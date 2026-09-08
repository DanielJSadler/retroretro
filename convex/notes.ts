import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { auth } from './auth'
import { getAuthUserId } from '@convex-dev/auth/server'

const NOTE_WIDTH_PERCENT = 18
const NOTE_HEIGHT_PERCENT = 20

function findAvailablePosition(
  notes: { positionX: number; positionY: number }[],
  requestedPosition: { x: number; y: number }
) {
  const requested = {
    x: Math.max(2, Math.min(80, requestedPosition.x)),
    y: Math.max(2, Math.min(80, requestedPosition.y)),
  }
  const candidates = [requested]

  for (let y = 2; y <= 80; y += NOTE_HEIGHT_PERCENT) {
    for (let x = 2; x <= 80; x += NOTE_WIDTH_PERCENT) {
      candidates.push({ x, y })
    }
  }

  candidates.sort(
    (a, b) =>
      Math.hypot(a.x - requested.x, a.y - requested.y) - Math.hypot(b.x - requested.x, b.y - requested.y)
  )

  return (
    candidates.find(candidate =>
      notes.every(
        note =>
          Math.abs(note.positionX - candidate.x) >= NOTE_WIDTH_PERCENT ||
          Math.abs(note.positionY - candidate.y) >= NOTE_HEIGHT_PERCENT
      )
    ) ?? requested
  )
}

// Get all notes for a board with their votes
export const getByBoard = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const userId = await getAuthUserId(ctx)
    if (!userId) return []

    const notes = await ctx.db
      .query('notes')
      .withIndex('by_board', q => q.eq('boardId', boardId))
      .collect()

    const board = await ctx.db.get(boardId)

    return await Promise.all(
      notes.map(async note => {
        const votes = await ctx.db
          .query('votes')
          .withIndex('by_note', q => q.eq('noteId', note._id))
          .collect()

        const creator = await ctx.db.get(note.createdBy)

        return {
          id: note._id,
          content: board?.phase === 'writing' && note.createdBy !== userId ? '' : note.content,
          color: note.color,
          createdBy: creator?.name ?? 'Unknown',
          createdById: note.createdBy,
          position: { x: note.positionX, y: note.positionY },
          sectionId: note.sectionId,
          createdAt: note._creationTime,
          isDraft: note.isDraft ?? false,
          votes:
            board?.phase === 'voting'
              ? votes.filter(v => v.userId === userId).map(v => v.userId)
              : votes.map(v => v.userId),
        }
      })
    )
  },
})

// Create a new note
export const create = mutation({
  args: {
    boardId: v.id('boards'),
    sectionId: v.id('sections'),
    content: v.string(),
    color: v.union(v.literal('yellow'), v.literal('blue'), v.literal('green'), v.literal('red'), v.literal('pink')),
    positionX: v.number(),
    positionY: v.number(),
  },
  handler: async (ctx, { boardId, sectionId, content, color, positionX, positionY }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const board = await ctx.db.get(boardId)
    if (!board) throw new Error('Board not found')
    if (board.phase === 'finished') throw new Error('Board is finished')

    return await ctx.db.insert('notes', {
      boardId,
      sectionId,
      content,
      color,
      createdBy: userId,
      positionX,
      positionY,
      isDraft: false,
    })
  },
})

export const createDraft = mutation({
  args: {
    boardId: v.id('boards'),
    sectionId: v.id('sections'),
    color: v.union(v.literal('yellow'), v.literal('blue'), v.literal('green'), v.literal('red'), v.literal('pink')),
    positionX: v.number(),
    positionY: v.number(),
  },
  handler: async (ctx, { boardId, sectionId, color, positionX, positionY }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const board = await ctx.db.get(boardId)
    if (!board) throw new Error('Board not found')
    if (board.phase === 'finished') throw new Error('Board is finished')

    const section = await ctx.db.get(sectionId)
    if (!section || section.boardId !== boardId) throw new Error('Section not found')

    const notes = await ctx.db
      .query('notes')
      .withIndex('by_section', q => q.eq('sectionId', sectionId))
      .collect()
    const position = findAvailablePosition(notes, { x: positionX, y: positionY })
    const noteId = await ctx.db.insert('notes', {
      boardId,
      sectionId,
      content: '',
      color,
      createdBy: userId,
      positionX: position.x,
      positionY: position.y,
      isDraft: true,
      draftUpdatedAt: Date.now(),
    })

    return { id: noteId, position }
  },
})

export const updateDraft = mutation({
  args: { noteId: v.id('notes'), content: v.string() },
  handler: async (ctx, { noteId, content }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const note = await ctx.db.get(noteId)
    if (!note || note.createdBy !== userId || !note.isDraft) throw new Error('Draft not found')

    await ctx.db.patch(noteId, { content, draftUpdatedAt: Date.now() })
  },
})

export const finalizeDraft = mutation({
  args: { noteId: v.id('notes'), content: v.string() },
  handler: async (ctx, { noteId, content }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const note = await ctx.db.get(noteId)
    if (!note || note.createdBy !== userId || !note.isDraft) throw new Error('Draft not found')
    if (!content.trim()) throw new Error('A note cannot be empty')

    const board = await ctx.db.get(note.boardId)
    if (!board || board.phase === 'finished') throw new Error('Board is finished')

    await ctx.db.patch(noteId, { content: content.trim(), isDraft: false, draftUpdatedAt: undefined })
  },
})

// Update a note
export const update = mutation({
  args: {
    noteId: v.id('notes'),
    content: v.optional(v.string()),
    sectionId: v.optional(v.id('sections')),
    color: v.optional(
      v.union(v.literal('yellow'), v.literal('blue'), v.literal('green'), v.literal('red'), v.literal('pink'))
    ),
    positionX: v.optional(v.number()),
    positionY: v.optional(v.number()),
  },
  handler: async (ctx, { noteId, ...updates }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const note = await ctx.db.get(noteId)
    if (!note) throw new Error('Note not found')

    const board = await ctx.db.get(note.boardId)
    if (board && board.phase === 'finished') throw new Error('Board is finished')

    // Only the creator can edit the note
    if (note.createdBy !== userId) {
      throw new Error('Not authorized to edit this note')
    }

    const patchData: Record<string, unknown> = {}
    if (updates.content !== undefined) patchData.content = updates.content
    if (updates.sectionId !== undefined) patchData.sectionId = updates.sectionId
    if (updates.color !== undefined) patchData.color = updates.color
    if (updates.positionX !== undefined) patchData.positionX = updates.positionX
    if (updates.positionY !== undefined) patchData.positionY = updates.positionY

    await ctx.db.patch(noteId, patchData)
  },
})

// Delete a note
export const remove = mutation({
  args: { noteId: v.id('notes') },
  handler: async (ctx, { noteId }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const note = await ctx.db.get(noteId)
    if (!note) throw new Error('Note not found')

    const board = await ctx.db.get(note.boardId)
    if (board && board.phase === 'finished') throw new Error('Board is finished')

    // Only the creator can delete the note
    if (note.createdBy !== userId) {
      throw new Error('Not authorized to delete this note')
    }

    // Delete votes for this note
    const votes = await ctx.db
      .query('votes')
      .withIndex('by_note', q => q.eq('noteId', noteId))
      .collect()

    for (const vote of votes) {
      await ctx.db.delete(vote._id)
    }

    await ctx.db.delete(noteId)
  },
})

// Move a note (any participant can move any note)
export const move = mutation({
  args: {
    noteId: v.id('notes'),
    positionX: v.number(),
    positionY: v.number(),
    sectionId: v.optional(v.id('sections')),
  },
  handler: async (ctx, { noteId, positionX, positionY, sectionId }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const note = await ctx.db.get(noteId)
    if (!note) throw new Error('Note not found')

    const patchData: Record<string, unknown> = {
      positionX,
      positionY,
    }

    if (sectionId !== undefined) {
      patchData.sectionId = sectionId
    }

    await ctx.db.patch(noteId, patchData)
  },
})

// Toggle vote on a note
export const vote = mutation({
  args: {
    noteId: v.id('notes'),
    boardId: v.id('boards'),
  },
  handler: async (ctx, { noteId, boardId }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    // Check if user already voted for this note
    const existingVote = await ctx.db
      .query('votes')
      .withIndex('by_note', q => q.eq('noteId', noteId))
      .filter(q => q.eq(q.field('userId'), userId))
      .first()

    if (existingVote) {
      // Remove vote
      await ctx.db.delete(existingVote._id)
      return { success: true, action: 'removed' }
    }

    // Check vote limit
    const board = await ctx.db.get(boardId)
    if (!board) throw new Error('Board not found')

    const userVotes = await ctx.db
      .query('votes')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .collect()

    if (userVotes.length >= board.votesPerPerson) {
      return { success: false, message: 'No votes remaining' }
    }

    // Add vote
    await ctx.db.insert('votes', {
      noteId,
      boardId,
      userId,
    })

    return { success: true, action: 'added' }
  },
})
