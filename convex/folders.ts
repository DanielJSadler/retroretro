import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";

// List all folders for the current user
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return [];

    const folders = await ctx.db
      .query("folders")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return folders.map((f) => ({
      id: f._id,
      name: f.name,
      color: f.color,
    }));
  },
});

// Create a new folder
export const create = mutation({
  args: {
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { name, color }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const folderId = await ctx.db.insert("folders", {
      name,
      userId,
      color,
    });

    return folderId;
  },
});

// Rename a folder
export const rename = mutation({
  args: {
    folderId: v.id("folders"),
    name: v.string(),
  },
  handler: async (ctx, { folderId, name }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const folder = await ctx.db.get(folderId);
    if (!folder || folder.userId !== userId) {
      throw new Error("Folder not found");
    }

    await ctx.db.patch(folderId, { name });
  },
});

// Delete a folder
export const remove = mutation({
  args: { folderId: v.id("folders") },
  handler: async (ctx, { folderId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const folder = await ctx.db.get(folderId);
    if (!folder) throw new Error("Folder not found");

    if (folder.userId !== userId) {
      throw new Error("Not authorized to delete this folder");
    }

    // Un-file all boards in this folder for this user
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_user_and_folder", (q) => 
        q.eq("userId", userId).eq("folderId", folderId)
      )
      .collect();

    for (const participant of participants) {
      await ctx.db.patch(participant._id, { folderId: undefined });
    }

    await ctx.db.delete(folderId);
  },
});
