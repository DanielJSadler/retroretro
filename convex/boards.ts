import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { auth } from './auth'
import { getAuthUserId } from '@convex-dev/auth/server'

// Get boards that the current user has participated in
export const list = query({
  args: {},
  handler: async ctx => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    // Get all boards where the user is a participant
    const userParticipations = await ctx.db
      .query('participants')
      .filter(q => q.eq(q.field('userId'), userId))
      .collect()

    // Get the unique board IDs
    const boardIds = [...new Set(userParticipations.map(p => p.boardId))]

    // Fetch the boards
    const boards = (await Promise.all(boardIds.map(id => ctx.db.get(id)))).filter(
      (b): b is NonNullable<typeof b> => b !== null
    )

    // Get participant counts and note counts for each board
    const boardsWithCounts = await Promise.all(
      boards.map(async board => {
        const participants = await ctx.db
          .query('participants')
          .withIndex('by_board', q => q.eq('boardId', board._id))
          .collect()

        // Find current user's participant record to get their folder for this board
        const myParticipation = participants.find(p => p.userId === userId)

        const notes = await ctx.db
          .query('notes')
          .withIndex('by_board', q => q.eq('boardId', board._id))
          .collect()

        // Get creator info
        const creator = await ctx.db.get(board.createdBy)

        return {
          ...board,
          folderId: myParticipation?.folderId,
          participantCount: participants.filter(p => p.isActive).length,
          noteCount: notes.length,
          creatorName: creator?.name ?? 'Unknown',
        }
      })
    )

    // Sort by creation time descending
    return boardsWithCounts.sort((a, b) => b._creationTime - a._creationTime)
  },
})

// Get a single board with its metadata and sections (no notes or participants)
export const get = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return null

    const board = await ctx.db.get(boardId)
    if (!board) return null

    // Get sections
    const sections = await ctx.db
      .query('sections')
      .withIndex('by_board', q => q.eq('boardId', boardId))
      .collect()

    // Sort sections by order
    sections.sort((a, b) => a.order - b.order)

    // Find current user's participant record (for folderId only)
    const myParticipation = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .first()

    // Get creator info
    const creator = await ctx.db.get(board.createdBy)

    return {
      ...board,
      folderId: myParticipation?.folderId,
      sections: sections.map(s => ({
        id: s._id,
        name: s.name,
        color: s.color,
        width: s.width ?? 1500,
        height: s.height ?? 2000,
        x: s.x ?? s.order * 1520,
        y: s.y ?? 0,
      })),
      creatorName: creator?.name ?? 'Unknown',
    }
  },
})

// Create a new board
export const create = mutation({
  args: {
    name: v.string(),
    sections: v.array(
      v.object({
        name: v.string(),
        color: v.union(v.literal('yellow'), v.literal('blue'), v.literal('green'), v.literal('red'), v.literal('pink')),
      })
    ),
  },
  handler: async (ctx, { name, sections }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const user = await ctx.db.get(userId)

    // Create the board
    const boardId = await ctx.db.insert('boards', {
      name,
      createdBy: userId,
      phase: 'writing',
      timerDuration: 0,
      timerPaused: true,
      votesPerPerson: 3,
    })

    // Create sections
    for (let i = 0; i < sections.length; i++) {
      await ctx.db.insert('sections', {
        boardId,
        name: sections[i].name,
        color: sections[i].color,
        order: i,
      })
    }

    // Add creator as a participant
    await ctx.db.insert('participants', {
      boardId,
      userId,
      name: user?.name ?? 'Anonymous',
      isActive: true,
      lastSeen: Date.now(),
    })

    return boardId
  },
})

// Update board phase
export const updatePhase = mutation({
  args: {
    boardId: v.id('boards'),
    phase: v.union(
      v.literal('writing'),
      v.literal('reveal'),
      v.literal('voting'),
      v.literal('discussion'),
      v.literal('finished')
    ),
    votesPerPerson: v.optional(v.number()),
    resetVotes: v.optional(v.boolean()),
  },
  handler: async (ctx, { boardId, phase, votesPerPerson, resetVotes }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const updates: Record<string, unknown> = { phase }
    if (votesPerPerson !== undefined) {
      updates.votesPerPerson = votesPerPerson
    }

    await ctx.db.patch(boardId, updates)

    if (phase === 'voting') {
      const statuses = await ctx.db
        .query('votingStatus')
        .withIndex('by_board', q => q.eq('boardId', boardId))
        .collect()
      for (const status of statuses) {
        await ctx.db.delete(status._id)
      }
    }

    // If moving to discussion phase, ensure an actions section exists
    if (phase === 'discussion') {
      const sections = await ctx.db
        .query('sections')
        .withIndex('by_board', q => q.eq('boardId', boardId))
        .collect()

      const hasActionsSection = sections.some(s => {
        const name = s.name.toLowerCase()
        return name.includes('action') || name.includes('todo') || name.includes('next step')
      })

      if (!hasActionsSection) {
        const maxOrder = sections.reduce((max, s) => Math.max(max, s.order), -1)
        await ctx.db.insert('sections', {
          boardId,
          name: 'Action items',
          color: 'blue',
          order: maxOrder + 1,
        })
      }
    }

    // Reset votes if requested
    if (resetVotes) {
      const votes = await ctx.db
        .query('votes')
        .filter(q => q.eq(q.field('boardId'), boardId))
        .collect()

      for (const vote of votes) {
        await ctx.db.delete(vote._id)
      }
    }
  },
})

export const resizeSection = mutation({
  args: {
    sectionId: v.id('sections'),
    width: v.number(),
    height: v.number(),
  },
  handler: async (ctx, { sectionId, width, height }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const section = await ctx.db.get(sectionId)
    if (!section) throw new Error('Section not found')
    const board = await ctx.db.get(section.boardId)
    if (!board || board.phase === 'finished') throw new Error('Board cannot be resized')

    const participant = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', section.boardId))
      .first()
    if (!participant) throw new Error('Not a board participant')

    const nextWidth = Math.max(600, Math.min(4000, Math.round(width)))
    const nextHeight = Math.max(500, Math.min(4000, Math.round(height)))
    const previousWidth = section.width ?? 1500
    const previousHeight = section.height ?? 2000

    // Notes use percentage coordinates. Counter-scale them so their visual
    // positions remain fixed while the section edge moves.
    const notes = await ctx.db
      .query('notes')
      .withIndex('by_section', q => q.eq('sectionId', sectionId))
      .collect()
    for (const note of notes) {
      await ctx.db.patch(note._id, {
        positionX: Math.max(0, Math.min(95, note.positionX * (previousWidth / nextWidth))),
        positionY: Math.max(0, Math.min(95, note.positionY * (previousHeight / nextHeight))),
      })
    }

    await ctx.db.patch(sectionId, { width: nextWidth, height: nextHeight })
  },
})

export const reorderSections = mutation({
  args: {
    boardId: v.id('boards'),
    sectionIds: v.array(v.id('sections')),
  },
  handler: async (ctx, { boardId, sectionIds }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const board = await ctx.db.get(boardId)
    if (!board || board.phase === 'finished') throw new Error('Board cannot be reordered')

    const participant = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .first()
    if (!participant) throw new Error('Not a board participant')

    const sections = await ctx.db
      .query('sections')
      .withIndex('by_board', q => q.eq('boardId', boardId))
      .collect()
    const expectedIds = new Set(sections.map(section => section._id))
    if (sectionIds.length !== sections.length || sectionIds.some(id => !expectedIds.has(id))) {
      throw new Error('Section order does not match this board')
    }

    for (const [order, sectionId] of sectionIds.entries()) {
      await ctx.db.patch(sectionId, { order })
    }
  },
})

export const moveSection = mutation({
  args: {
    sectionId: v.id('sections'),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, { sectionId, x, y }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const section = await ctx.db.get(sectionId)
    if (!section) throw new Error('Section not found')
    const board = await ctx.db.get(section.boardId)
    if (!board || board.phase === 'finished') throw new Error('Board cannot be moved')

    const participant = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', section.boardId))
      .first()
    if (!participant) throw new Error('Not a board participant')

    const gridSize = 40
    await ctx.db.patch(sectionId, {
      x: Math.max(0, Math.min(10000, Math.round(x / gridSize) * gridSize)),
      y: Math.max(0, Math.min(10000, Math.round(y / gridSize) * gridSize)),
    })
  },
})

// Delete a board
export const remove = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    // Delete all related data
    const sections = await ctx.db
      .query('sections')
      .withIndex('by_board', q => q.eq('boardId', boardId))
      .collect()

    for (const section of sections) {
      await ctx.db.delete(section._id)
    }

    const notes = await ctx.db
      .query('notes')
      .withIndex('by_board', q => q.eq('boardId', boardId))
      .collect()

    for (const note of notes) {
      // Delete votes for this note
      const votes = await ctx.db
        .query('votes')
        .withIndex('by_note', q => q.eq('noteId', note._id))
        .collect()

      for (const vote of votes) {
        await ctx.db.delete(vote._id)
      }

      await ctx.db.delete(note._id)
    }

    const participants = await ctx.db
      .query('participants')
      .withIndex('by_board', q => q.eq('boardId', boardId))
      .collect()

    for (const participant of participants) {
      await ctx.db.delete(participant._id)
    }

    await ctx.db.delete(boardId)
  },
})

// Move a board to a folder (or remove from folder) for the current user
export const remove2 = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    // Get the participant record for this user and board
    const participant = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .first()

    if (!participant) throw new Error('Not a participant of this board')

    // Update the participant record to remove folder association
    await ctx.db.patch(participant._id, { folderId: undefined })
  },
})

export const moveToFolder = mutation({
  args: {
    boardId: v.id('boards'),
    folderId: v.union(v.id('folders'), v.null()),
  },
  handler: async (ctx, { boardId, folderId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const board = await ctx.db.get(boardId)
    if (!board) throw new Error('Board not found')

    // Verify user has access (is a participant)
    const participant = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .first()

    if (!participant) throw new Error('Not a participant of this board')

    // If moving to a folder, verify folder ownership
    if (folderId) {
      const folder = await ctx.db.get(folderId)
      if (!folder || folder.userId !== userId) {
        throw new Error('Folder not found')
      }
    }

    // Update the participant record, not the board
    await ctx.db.patch(participant._id, { folderId: folderId ?? undefined })
  },
})
