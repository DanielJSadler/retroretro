import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { auth } from "./auth";

// Create a new note
export const create = mutation({
  args: {
    boardId: v.id("boards"),
    sectionId: v.id("sections"),
    content: v.string(),
    color: v.union(
      v.literal("yellow"),
      v.literal("blue"),
      v.literal("green"),
      v.literal("red"),
      v.literal("pink")
    ),
    positionX: v.number(),
    positionY: v.number(),
  },
  handler: async (ctx, { boardId, sectionId, content, color, positionX, positionY }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const board = await ctx.db.get(boardId);
    if (!board) throw new Error("Board not found");
    if (board.phase === "finished") throw new Error("Board is finished");

    return await ctx.db.insert("notes", {
      boardId,
      sectionId,
      content,
      color,
      createdBy: userId,
      positionX,
      positionY,
    });
  },
});

// Update a note
export const update = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.optional(v.string()),
    sectionId: v.optional(v.id("sections")),
    color: v.optional(
      v.union(
        v.literal("yellow"),
        v.literal("blue"),
        v.literal("green"),
        v.literal("red"),
        v.literal("pink")
      )
    ),
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
  },
  handler: async (ctx, { noteId, ...updates }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(noteId);
    if (!note) throw new Error("Note not found");

    const board = await ctx.db.get(note.boardId);
    if (board && board.phase === "finished") throw new Error("Board is finished");

    // Only the creator can edit the note
    if (note.createdBy !== userId) {
      throw new Error("Not authorized to edit this note");
    }

    const patchData: Record<string, unknown> = {};
    if (updates.content !== undefined) patchData.content = updates.content;
    if (updates.sectionId !== undefined) patchData.sectionId = updates.sectionId;
    if (updates.color !== undefined) patchData.color = updates.color;
    if (updates.positionX !== undefined) patchData.positionX = updates.positionX;
    if (updates.positionY !== undefined) patchData.positionY = updates.positionY;

    await ctx.db.patch(noteId, patchData);
  },
});

// Delete a note
export const remove = mutation({
  args: { noteId: v.id("notes") },
  handler: async (ctx, { noteId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(noteId);
    if (!note) throw new Error("Note not found");

    const board = await ctx.db.get(note.boardId);
    if (board && board.phase === "finished") throw new Error("Board is finished");

    // Only the creator can delete the note
    if (note.createdBy !== userId) {
      throw new Error("Not authorized to delete this note");
    }

    // Delete votes for this note
    const votes = await ctx.db
      .query("votes")
      .withIndex("by_note", (q) => q.eq("noteId", noteId))
      .collect();

    for (const vote of votes) {
      await ctx.db.delete(vote._id);
    }

    await ctx.db.delete(noteId);
  },
});

// Move a note (any participant can move any note)
export const move = mutation({
  args: {
    noteId: v.id("notes"),
    positionX: v.number(),
    positionY: v.number(),
    sectionId: v.optional(v.id("sections")),
  },
  handler: async (ctx, { noteId, positionX, positionY, sectionId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const note = await ctx.db.get(noteId);
    if (!note) throw new Error("Note not found");

    const patchData: Record<string, unknown> = {
      positionX,
      positionY,
    };
    
    if (sectionId !== undefined) {
      patchData.sectionId = sectionId;
    }

    await ctx.db.patch(noteId, patchData);
  },
});

// Toggle vote on a note
export const vote = mutation({
  args: {
    noteId: v.id("notes"),
    boardId: v.id("boards"),
  },
  handler: async (ctx, { noteId, boardId }) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Check if user already voted for this note
    const existingVote = await ctx.db
      .query("votes")
      .withIndex("by_note", (q) => q.eq("noteId", noteId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (existingVote) {
      // Remove vote
      await ctx.db.delete(existingVote._id);
      return { success: true, action: "removed" };
    }

    // Check vote limit
    const board = await ctx.db.get(boardId);
    if (!board) throw new Error("Board not found");

    const userVotes = await ctx.db
      .query("votes")
      .withIndex("by_user_and_board", (q) => 
        q.eq("userId", userId).eq("boardId", boardId)
      )
      .collect();

    if (userVotes.length >= board.votesPerPerson) {
      return { success: false, message: "No votes remaining" };
    }

    // Add vote
    await ctx.db.insert("votes", {
      noteId,
      boardId,
      userId,
    });

    return { success: true, action: "added" };
  },
});
