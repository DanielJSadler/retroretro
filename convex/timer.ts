import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

// Start the timer
export const start = mutation({
  args: {
    boardId: v.id("boards"),
    duration: v.number(),
  },
  handler: async (ctx, { boardId, duration }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(boardId, {
      timerDuration: duration,
      timerStartedAt: Date.now(),
      timerPaused: false,
      timerRemainingTime: duration,
    });
  },
});

// Pause the timer
export const pause = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const board = await ctx.db.get(boardId);
    if (!board) throw new Error("Board not found");

    if (board.timerStartedAt && !board.timerPaused) {
      const elapsed = Date.now() - board.timerStartedAt;
      const remaining = Math.max(0, board.timerDuration - elapsed);

      await ctx.db.patch(boardId, {
        timerPaused: true,
        timerRemainingTime: remaining,
      });
    }
  },
});

// Resume the timer
export const resume = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const board = await ctx.db.get(boardId);
    if (!board) throw new Error("Board not found");

    if (board.timerPaused && board.timerRemainingTime) {
      await ctx.db.patch(boardId, {
        timerStartedAt: Date.now(),
        timerDuration: board.timerRemainingTime,
        timerPaused: false,
      });
    }
  },
});

// Reset the timer
export const reset = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await ctx.db.patch(boardId, {
      timerDuration: 0,
      timerStartedAt: undefined,
      timerPaused: true,
      timerRemainingTime: undefined,
    });
  },
});
