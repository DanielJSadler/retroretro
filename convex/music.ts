import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

export const SONGS = [
  "Naughty Daughty - Naughty Edits Vol. 2 - 02 September.mp3",
  "Naughty Daughty - Naughty Edits Vol. 4 - 01 Dreams.mp3",
  "Naughty Daughty - Naughty Edits Vol. 4 - 02 He_s The Greatest Dancer.mp3",
  "Naughty Daughty - Naughty Edits Vol. 8 - 01 You Should Be Dancing.mp3",
  "Naughty Daughty - Naughty Edits Vol. 8 - 04 Kung Fu Fighting.mp3",
];

export const listSongs = query({
  args: {},
  handler: async () => {
    return SONGS;
  },
});

export const play = mutation({
  args: {
    boardId: v.id("boards"),
    song: v.optional(v.string()), // Optional, if null resumes current
    seekTime: v.optional(v.number()),
  },
  handler: async (ctx, { boardId, song, seekTime }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const board = await ctx.db.get(boardId);
    if (!board) throw new Error("Board not found");

    const currentSong = song || board.musicCurrentSong || SONGS[0]; // Default to first if none

    await ctx.db.patch(boardId, {
      musicCurrentSong: currentSong,
      musicStatus: "playing",
      musicStartedAt: Date.now() - (seekTime || board.musicSeekTime || 0),
      musicSeekTime: seekTime || board.musicSeekTime || 0,
    });
  },
});

export const pause = mutation({
  args: {
    boardId: v.id("boards"),
    seekTime: v.number(), // Client reports current time when pausing
  },
  handler: async (ctx, { boardId, seekTime }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    await ctx.db.patch(boardId, {
      musicStatus: "paused",
      musicSeekTime: seekTime,
    });
  },
});

export const next = mutation({
  args: {
    boardId: v.id("boards"),
  },
  handler: async (ctx, { boardId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    const board = await ctx.db.get(boardId);
    if (!board) throw new Error("Board not found");

    const currentSong = board.musicCurrentSong;
    let nextSong = SONGS[Math.floor(Math.random() * SONGS.length)];

    // Ensure we don't pick the same song if possible
    if (SONGS.length > 1 && nextSong === currentSong) {
      while (nextSong === currentSong) {
        nextSong = SONGS[Math.floor(Math.random() * SONGS.length)];
      }
    }

    await ctx.db.patch(boardId, {
      musicCurrentSong: nextSong,
      musicStatus: "playing",
      musicStartedAt: Date.now(),
      musicSeekTime: 0,
    });
  },
});
