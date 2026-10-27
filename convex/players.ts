import { v } from "convex/values";
import { query } from "./_generated/server";

export const getPlayers = query({
  args: { sessionId: v.id("sessions") },
  handler: async (ctx, args) => {
    const players = await ctx.db
      .query("players")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .collect();

    return players.sort((a, b) => (a._creationTime < b._creationTime ? -1 : 1));
  },
});
