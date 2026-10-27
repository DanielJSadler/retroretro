import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getRoomDeck, voteLabel } from "../src/features/planning-poker/lib/decks";

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
    return { success: true };
  },
});

export const revealVotes = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

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
