import { query } from "./_generated/server";
import { auth } from "./auth";

// Get current user info
export const current = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    return {
      id: user._id,
      name: user.name ?? "Anonymous",
      email: user.email,
    };
  },
});
