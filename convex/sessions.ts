import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { deckSelection, resolveDeckSelection } from "./pokerDecks";
import { PRESET_DECKS } from "../src/features/planning-poker/lib/decks";

function generateRoomCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const createSession = mutation({
  args: { playerName: v.string(), deckSelection: v.optional(deckSelection) },
  handler: async (ctx, args) => {
    const deck = args.deckSelection
      ? await resolveDeckSelection(ctx, args.deckSelection)
      : { name: PRESET_DECKS.fibonacci.name, cards: [...PRESET_DECKS.fibonacci.cards] };
    const roomCode = generateRoomCode();
    const sessionId = await ctx.db.insert("sessions", {
      roomCode,
      status: "voting",
      round: 1,
      moderatorId: "temp",
      createdAt: Date.now(),
      deck,
    });

    const playerId = await ctx.db.insert("players", {
      sessionId,
      name: args.playerName.trim(),
      hasVoted: false,
      isModerator: true,
      isConnected: true,
    });

    await ctx.db.patch(sessionId, { moderatorId: playerId });

    return { sessionId, roomCode, playerId };
  },
});

export const changeDeck = mutation({
  args: {
    sessionId: v.id("sessions"),
    playerId: v.id("players"),
    deckSelection,
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found.");
    const moderator = await ctx.db.get(args.playerId);
    if (
      !moderator ||
      moderator.sessionId !== args.sessionId ||
      session.moderatorId !== args.playerId
    ) {
      throw new Error("Only the room creator can change the deck.");
    }

    if (session.status === "voting") {
      const currentVotes = await ctx.db
        .query("pokerVotes")
        .withIndex("by_session_round", (q) =>
          q.eq("sessionId", args.sessionId).eq("round", session.round)
        )
        .first();
      if (currentVotes) throw new Error("Reveal or reset the current round first.");
    }

    const deck = await resolveDeckSelection(ctx, args.deckSelection);
    if (session.status === "revealed") {
      const players = await ctx.db
        .query("players")
        .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
        .collect();
      for (const player of players) {
        await ctx.db.patch(player._id, { hasVoted: false });
      }
      await ctx.db.patch(args.sessionId, {
        deck,
        status: "voting",
        round: session.round + 1,
      });
    } else {
      await ctx.db.patch(args.sessionId, { deck });
    }
  },
});

export const joinSession = mutation({
  args: { roomCode: v.string(), playerName: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .unique();

    if (!session) {
      throw new Error("Room not found");
    }

    const trimmedName = args.playerName.trim();
    const existingPlayers = await ctx.db
      .query("players")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", session._id))
      .collect();

    const sameNameCount = existingPlayers.filter((player) => player.name === trimmedName).length;

    const disambiguator = sameNameCount > 0 ? sameNameCount + 1 : undefined;

    const playerId = await ctx.db.insert("players", {
      sessionId: session._id,
      name: trimmedName,
      hasVoted: false,
      isModerator: false,
      isConnected: true,
      disambiguator,
    });

    return { sessionId: session._id, playerId };
  },
});

export const getSession = query({
  args: { roomCode: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_roomCode", (q) => q.eq("roomCode", args.roomCode.toUpperCase()))
      .unique();
    return session;
  },
});

export const getSessionById = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const resetRound = mutation({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");

    await ctx.db.patch(args.sessionId, {
      status: "voting",
      round: session.round + 1,
    });

    const players = await ctx.db
      .query("players")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    for (const player of players) {
      await ctx.db.patch(player._id, { hasVoted: false });
    }

    return { success: true };
  },
});

export const updatePlayerStatus = mutation({
  args: { playerId: v.id("players"), isConnected: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.playerId, { isConnected: args.isConnected });
  },
});
