import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // User folders for organizing boards
  folders: defineTable({
    name: v.string(),
    userId: v.id("users"),
    color: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  // Boards (retro sessions)
  boards: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    folderId: v.optional(v.id("folders")), // Temporary: for migration
    phase: v.union(
      v.literal("writing"),
      v.literal("reveal"),
      v.literal("voting"),
      v.literal("discussion")
    ),
    timerDuration: v.number(),
    timerStartedAt: v.optional(v.number()),
    timerPaused: v.boolean(),
    timerRemainingTime: v.optional(v.number()),
    votesPerPerson: v.number(),
    
    // Music Player
    musicCurrentSong: v.optional(v.string()),
    musicStatus: v.optional(v.union(v.literal("playing"), v.literal("paused"))),
    musicStartedAt: v.optional(v.number()),
    musicSeekTime: v.optional(v.number()),
  }).index("by_creator", ["createdBy"]),

  // Sections within a board
  sections: defineTable({
    boardId: v.id("boards"),
    name: v.string(),
    color: v.union(
      v.literal("yellow"),
      v.literal("blue"),
      v.literal("green"),
      v.literal("red"),
      v.literal("pink")
    ),
    order: v.number(),
  }).index("by_board", ["boardId"]),

  // Sticky notes
  notes: defineTable({
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
    createdBy: v.id("users"),
    positionX: v.number(),
    positionY: v.number(),
  })
    .index("by_board", ["boardId"])
    .index("by_section", ["sectionId"]),

  // Votes on notes
  votes: defineTable({
    noteId: v.id("notes"),
    boardId: v.id("boards"),
    userId: v.id("users"),
  })
    .index("by_note", ["noteId"])
    .index("by_user_and_board", ["userId", "boardId"]),

  // Participants currently viewing a board
  participants: defineTable({
    boardId: v.id("boards"),
    userId: v.id("users"),
    name: v.string(),
    isActive: v.boolean(),
    lastSeen: v.number(),
    folderId: v.optional(v.id("folders")),
  })
    .index("by_board", ["boardId"])
    .index("by_user_and_board", ["userId", "boardId"])
    .index("by_user_and_folder", ["userId", "folderId"]),

  // Ephemeral confetti events
  confetti: defineTable({
    boardId: v.id("boards"),
    senderId: v.id("users"),
    type: v.string(),
    originX: v.number(),
    originY: v.number(),
    angle: v.number(),
    velocity: v.number(),
    distance: v.number(),
  }).index("by_board", ["boardId"]),
});
