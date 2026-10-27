import { v } from "convex/values";
import { internalMutation, mutation, query, type MutationCtx } from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { getRoomDeck, voteLabel } from "../src/features/planning-poker/lib/decks";

export async function cancelAutoReveal(ctx: MutationCtx, session: Doc<"sessions">): Promise<void> {
  if (session.autoRevealJobId) await ctx.scheduler.cancel(session.autoRevealJobId);
  if (session.autoRevealAt !== undefined || session.autoRevealJobId) {
    await ctx.db.patch(session._id, { autoRevealAt: undefined, autoRevealJobId: undefined });
  }
}

export async function syncAutoReveal(ctx: MutationCtx, sessionId: Id<"sessions">): Promise<void> {
  const session = await ctx.db.get(sessionId);
  if (!session) return;
  const players = await ctx.db.query("players")
    .withIndex("by_sessionId", q => q.eq("sessionId", sessionId)).collect();
  const connected = players.filter(player => player.isConnected);
  if (session.status !== "voting" || connected.length === 0 || connected.some(player => !player.hasVoted)) {
    await cancelAutoReveal(ctx, session);
    return;
  }
  // Keep the same deadline if a player changes their chosen card.
  if (session.autoRevealAt !== undefined) return;
  const deadline = Date.now() + 3000;
  const jobId = await ctx.scheduler.runAt(deadline, internal.pokerVotes.autoReveal, {
    sessionId, round: session.round, deadline,
  });
  await ctx.db.patch(sessionId, { autoRevealAt: deadline, autoRevealJobId: jobId });
}

export const autoReveal = internalMutation({
  args: { sessionId: v.id("sessions"), round: v.number(), deadline: v.number() },
  handler: async (ctx, { sessionId, round, deadline }): Promise<void> => {
    const session = await ctx.db.get(sessionId);
    if (!session || session.status !== "voting" || session.round !== round || session.autoRevealAt !== deadline) return;
    const players = await ctx.db.query("players")
      .withIndex("by_sessionId", q => q.eq("sessionId", sessionId)).collect();
    const connected = players.filter(player => player.isConnected);
    await ctx.db.patch(sessionId, {
      ...(connected.length > 0 && connected.every(player => player.hasVoted) ? { status: "revealed" as const } : {}),
      autoRevealAt: undefined,
      autoRevealJobId: undefined,
    });
  },
});

export const submitVote = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    value: v.union(v.string(), v.number(), v.null()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "voting") throw new Error("Voting is closed");

    const player = await ctx.db.get(args.playerId);
    if (!player) throw new Error("Player not found");
    if (player.sessionId !== args.sessionId) throw new Error("Player is not in this room");
    const deck = getRoomDeck(session);
    if (
      (session.deck && typeof args.value !== "string") ||
      !deck.cards.includes(voteLabel(args.value))
    ) {
      throw new Error("This card is not in the room's deck");
    }

    const existing = await ctx.db
      .query("pokerVotes")
      .withIndex("by_session_round", (q) =>
        q.eq("sessionId", args.sessionId).eq("round", session.round)
      )
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .unique();

    if (existing) {
      if (voteLabel(existing.value) === voteLabel(args.value)) {
        await ctx.db.delete(existing._id);
        await ctx.db.patch(args.playerId, { hasVoted: false });
        await syncAutoReveal(ctx, args.sessionId);
        return { success: true };
      }
      await ctx.db.patch(existing._id, { value: args.value });
    } else {
      await ctx.db.insert("pokerVotes", {
        sessionId: args.sessionId,
        playerId: args.playerId,
        playerName: player.name,
        value: args.value,
        round: session.round,
      });
    }

    await ctx.db.patch(args.playerId, { hasVoted: true });
    await syncAutoReveal(ctx, args.sessionId);
    return { success: true };
  },
});

export const revealVotes = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await cancelAutoReveal(ctx, session);
    await ctx.db.patch(args.sessionId, { status: "revealed" });
    return { success: true };
  },
});

export const getVotes = query({
  args: { sessionId: v.id("sessions"), round: v.number() },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "revealed") return [];

    const votes = await ctx.db
      .query("pokerVotes")
      .withIndex("by_session_round", (q) =>
        q.eq("sessionId", args.sessionId).eq("round", args.round)
      )
      .collect();

    return votes;
  },
});

export const getCurrentVote = query({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    round: v.number(),
  },
  handler: async (ctx, args) => {
    const vote = await ctx.db
      .query("pokerVotes")
      .withIndex("by_session_round", (q) =>
        q.eq("sessionId", args.sessionId).eq("round", args.round)
      )
      .filter((q) => q.eq(q.field("playerId"), args.playerId))
      .unique();

    return vote;
  },
});
