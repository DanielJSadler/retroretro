import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

import { auth } from "./auth";

// Send a confetti event
export const fire = mutation({
  args: {
    boardId: v.id("boards"),
    type: v.string(),
    originX: v.number(),
    originY: v.number(),
    angle: v.number(),
    velocity: v.number(),
    distance: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Unauthenticated");

    await ctx.db.insert("confetti", {
      boardId: args.boardId,
      senderId: userId,
      type: args.type,
      originX: args.originX,
      originY: args.originY,
      angle: args.angle,
      velocity: args.velocity,
      distance: args.distance,
    });
    
    // Optional: Clean up old events?
    // To keep table small, we could delete events older than 1 minute?
    // Using a scheduled function is better, but doing it here probabilistically is okay for low volume.
    // Or just let it grow and rely on TTL if configured (Convex has TTL now?).
    // For now, leave it.
  },
});

// Subscribe to recent confetti events
export const recent = query({
  args: {
    boardId: v.id("boards"),
  },
  handler: async (ctx, args) => {
    // Return last 50 events, ordered by time.
    // Clients will filter by timestamp.
    const events = await ctx.db
      .query("confetti")
      .withIndex("by_board", (q) => q.eq("boardId", args.boardId))
      .order("desc") // Newest first
      .take(50);
      
    return events.reverse(); // Return oldest to newest for easier processing
  },
});
