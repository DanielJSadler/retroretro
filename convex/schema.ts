import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { authTables } from '@convex-dev/auth/server'

export default defineSchema({
  ...authTables,

  // User folders for organizing boards
  folders: defineTable({
    name: v.string(),
    userId: v.id('users'),
    color: v.optional(v.string()),
  }).index('by_user', ['userId']),

  // Boards (retro sessions)
  boards: defineTable({
    name: v.string(),
    createdBy: v.id('users'),
    folderId: v.optional(v.id('folders')), // Temporary: for migration
    phase: v.union(
      v.literal('writing'),
      v.literal('reveal'),
      v.literal('voting'),
      v.literal('discussion'),
      v.literal('finished')
    ),
    timerDuration: v.number(),
    timerStartedAt: v.optional(v.number()),
    timerPaused: v.boolean(),
    timerRemainingTime: v.optional(v.number()),
    votesPerPerson: v.number(),

    // Music Player
    musicCurrentSong: v.optional(v.string()),
    musicStatus: v.optional(v.union(v.literal('playing'), v.literal('paused'))),
    musicStartedAt: v.optional(v.number()),
    musicSeekTime: v.optional(v.number()),
  }).index('by_creator', ['createdBy']),

  // Sections within a board
  sections: defineTable({
    boardId: v.id('boards'),
    name: v.string(),
    color: v.union(v.literal('yellow'), v.literal('blue'), v.literal('green'), v.literal('red'), v.literal('pink')),
    order: v.number(),
    height: v.optional(v.number()),
    width: v.optional(v.number()),
    x: v.optional(v.number()),
    y: v.optional(v.number()),
  }).index('by_board', ['boardId']),

  // Sticky notes
  notes: defineTable({
    boardId: v.id('boards'),
    sectionId: v.id('sections'),
    content: v.string(),
    color: v.union(v.literal('yellow'), v.literal('blue'), v.literal('green'), v.literal('red'), v.literal('pink')),
    createdBy: v.id('users'),
    positionX: v.number(),
    positionY: v.number(),
    // Action notes retain a durable link to the item they were created from.
    sourceNoteId: v.optional(v.id('notes')),
    isDraft: v.optional(v.boolean()),
    draftUpdatedAt: v.optional(v.number()),
    size: v.optional(v.object({ width: v.number(), height: v.number() })),
  })
    .index('by_board', ['boardId'])
    .index('by_section', ['sectionId']),

  // Votes on notes
  votes: defineTable({
    noteId: v.id('notes'),
    boardId: v.id('boards'),
    userId: v.id('users'),
  })
    .index('by_note', ['noteId'])
    .index('by_user_and_board', ['userId', 'boardId']),

  votingStatus: defineTable({
    boardId: v.id('boards'),
    userId: v.id('users'),
    isDone: v.boolean(),
    updatedAt: v.number(),
  })
    .index('by_board', ['boardId'])
    .index('by_user_and_board', ['userId', 'boardId']),

  // Participants currently viewing a board
  participants: defineTable({
    boardId: v.id('boards'),
    userId: v.id('users'),
    name: v.string(),
    isActive: v.boolean(),
    lastSeen: v.number(),
    folderId: v.optional(v.id('folders')),
    cursorX: v.optional(v.number()),
    cursorY: v.optional(v.number()),
    viewportX: v.optional(v.number()),
    viewportY: v.optional(v.number()),
    zoom: v.optional(v.number()),
  })
    .index('by_board', ['boardId'])
    .index('by_user_and_board', ['userId', 'boardId'])
    .index('by_user_and_folder', ['userId', 'folderId']),

  // Ephemeral confetti events
  confetti: defineTable({
    boardId: v.id('boards'),
    senderId: v.id('users'),
    type: v.string(),
    originX: v.number(),
    originY: v.number(),
    angle: v.number(),
    velocity: v.number(),
    distance: v.number(),
  }).index('by_board', ['boardId']),

  // Planning Poker rooms are guest-accessible and independent of retro boards.
  sessions: defineTable({
    roomCode: v.string(),
    status: v.union(v.literal('voting'), v.literal('revealed')),
    round: v.number(),
    moderatorId: v.string(),
    createdAt: v.number(),
    deck: v.optional(v.object({
      name: v.string(),
      cards: v.array(v.string()),
    })),
  })
    .index('by_roomCode', ['roomCode'])
    .index('by_moderatorId', ['moderatorId']),

  players: defineTable({
    sessionId: v.id('sessions'),
    name: v.string(),
    hasVoted: v.boolean(),
    isModerator: v.boolean(),
    isConnected: v.boolean(),
    disambiguator: v.optional(v.number()),
  }).index('by_sessionId', ['sessionId']),

  pokerVotes: defineTable({
    sessionId: v.id('sessions'),
    playerId: v.id('players'),
    playerName: v.string(),
    value: v.union(v.string(), v.number(), v.null()),
    round: v.number(),
  })
    .index('by_session_round', ['sessionId', 'round'])
    .index('by_playerId', ['playerId']),

  pokerDecks: defineTable({
    userId: v.id('users'),
    name: v.string(),
    cards: v.array(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),
})
