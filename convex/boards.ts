import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { auth } from "./auth";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get boards that the current user has participated in
export const list = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return [];

    // Get all boards where the user is a participant
    const userParticipations = await ctx.db
      .query("participants")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get the unique board IDs
    const boardIds = [...new Set(userParticipations.map((p) => p.boardId))];

    // Fetch the boards
    const boards = (
      await Promise.all(boardIds.map((id) => ctx.db.get(id)))
    ).filter((b): b is NonNullable<typeof b> => b !== null);

    // Get participant counts and note counts for each board
    const boardsWithCounts = await Promise.all(
      boards.map(async (board) => {
        const participants = await ctx.db
          .query("participants")
          .withIndex("by_board", (q) => q.eq("boardId", board._id))
          .collect();

        // Find current user's participant record to get their folder for this board
        const myParticipation = participants.find(p => p.userId === userId);

        const notes = await ctx.db
          .query("notes")
          .withIndex("by_board", (q) => q.eq("boardId", board._id))
          .collect();

        // Get creator info
        const creator = await ctx.db.get(board.createdBy);

        return {
          ...board,
          folderId: myParticipation?.folderId,
          participantCount: participants.filter(p => p.isActive).length,
          noteCount: notes.length,
          creatorName: creator?.name ?? "Unknown",
        };
      })
    );

    // Sort by creation time descending
    return boardsWithCounts.sort(
      (a, b) => b._creationTime - a._creationTime
    );
  },
});

// Get a single board with all its data
export const get = query({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null;

    const board = await ctx.db.get(boardId);
    if (!board) return null;

    // Get sections
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();

    // Sort sections by order
    sections.sort((a, b) => a.order - b.order);

    // Get notes with vote counts
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();

    const notesWithVotes = await Promise.all(
      notes.map(async (note) => {
        const votes = await ctx.db
          .query("votes")
          .withIndex("by_note", (q) => q.eq("noteId", note._id))
          .collect();

        // Get creator name
        const creator = await ctx.db.get(note.createdBy);

        return {
          ...note,
          votes: votes.map((v) => v.userId),
          creatorName: creator?.name ?? "Unknown",
        };
      })
    );

    // Get active participants
    const participants = await ctx.db
      .query("participants")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();

    // Find current user's participant record
    const myParticipation = participants.find(p => p.userId === userId);

    // Get creator info
    const creator = await ctx.db.get(board.createdBy);

    return {
      ...board,
      folderId: myParticipation?.folderId,
      sections: sections.map((s) => ({
        id: s._id,
        name: s.name,
        color: s.color,
      })),
      notes: notesWithVotes.map((n) => ({
        id: n._id,
        content: n.content,
        color: n.color,
        createdBy: n.creatorName,
        position: { x: n.positionX, y: n.positionY },
        sectionId: n.sectionId,
        createdAt: n._creationTime,
        votes: n.votes,
      })),
      participants: participants.map((p) => ({
        id: p._id,
        name: p.name,
        isActive: p.isActive,
        lastSeen: p.lastSeen,
      })),
      creatorName: creator?.name ?? "Unknown",
    };
  },
});

// Create a new board
export const create = mutation({
  args: {
    name: v.string(),
    sections: v.array(
      v.object({
        name: v.string(),
        color: v.union(
          v.literal("yellow"),
          v.literal("blue"),
          v.literal("green"),
          v.literal("red"),
          v.literal("pink")
        ),
      })
    ),
  },
  handler: async (ctx, { name, sections }) => { 
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);

    // Create the board
    const boardId = await ctx.db.insert("boards", {
      name,
      createdBy: userId,
      phase: "writing",
      timerDuration: 0,
      timerPaused: true,
      votesPerPerson: 3,
    });

    // Create sections
    for (let i = 0; i < sections.length; i++) {
      await ctx.db.insert("sections", {
        boardId,
        name: sections[i].name,
        color: sections[i].color,
        order: i,
      });
    }

    // Add creator as a participant
    await ctx.db.insert("participants", {
      boardId,
      userId,
      name: user?.name ?? "Anonymous",
      isActive: true,
      lastSeen: Date.now(),
    });

    return boardId;
  },
});

// Update board phase
export const updatePhase = mutation({
  args: {
    boardId: v.id("boards"),
    phase: v.union(
      v.literal("writing"),
      v.literal("reveal"),
      v.literal("voting"),
      v.literal("discussion"),
      v.literal("finished")
    ),
    votesPerPerson: v.optional(v.number()),
    resetVotes: v.optional(v.boolean()),
  },
  handler: async (ctx, { boardId, phase, votesPerPerson, resetVotes }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const updates: Record<string, unknown> = { phase };
    if (votesPerPerson !== undefined) {
      updates.votesPerPerson = votesPerPerson;
    }

    await ctx.db.patch(boardId, updates);

    // Reset votes if requested
    if (resetVotes) {
      const votes = await ctx.db
        .query("votes")
        .filter((q) => q.eq(q.field("boardId"), boardId))
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }
    }
  },
});

// Delete a board
export const remove = mutation({
  args: { boardId: v.id("boards") },
  handler: async (ctx, { boardId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Delete all related data
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();

    for (const section of sections) {
      await ctx.db.delete(section._id);
    }

    const notes = await ctx.db
      .query("notes")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();

    for (const note of notes) {
      // Delete votes for this note
      const votes = await ctx.db
        .query("votes")
        .withIndex("by_note", (q) => q.eq("noteId", note._id))
        .collect();

      for (const vote of votes) {
        await ctx.db.delete(vote._id);
      }

      await ctx.db.delete(note._id);
    }

    const participants = await ctx.db
      .query("participants")
      .withIndex("by_board", (q) => q.eq("boardId", boardId))
      .collect();

    for (const participant of participants) {
      await ctx.db.delete(participant._id);
    }

    await ctx.db.delete(boardId);
  },
});

// Move a board to a folder (or remove from folder) for the current user
export const moveToFolder = mutation({
  args: {
    boardId: v.id("boards"),
    folderId: v.union(v.id("folders"), v.null()),
  },
  handler: async (ctx, { boardId, folderId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const board = await ctx.db.get(boardId);
    if (!board) throw new Error("Board not found");

    // Verify user has access (is a participant)
    const participant = await ctx.db
      .query("participants")
      .withIndex("by_user_and_board", (q) =>
        q.eq("userId", userId).eq("boardId", boardId)
      )
      .first();

    if (!participant) throw new Error("Not a participant of this board");

    // If moving to a folder, verify folder ownership
    if (folderId) {
      const folder = await ctx.db.get(folderId);
      if (!folder || folder.userId !== userId) {
        throw new Error("Folder not found");
      }
    }

    // Update the participant record, not the board
    await ctx.db.patch(participant._id, { folderId: folderId ?? undefined });
  },
});
