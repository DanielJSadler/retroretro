import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { auth } from './auth'
import { getAuthUserId } from '@convex-dev/auth/server'

const DEFAULT_SECTION_WIDTH = 900
const DEFAULT_SECTION_HEIGHT = 650
const SECTION_GAP = 60
const REVEAL_LAYOUT_PADDING = 24
const REVEAL_NOTE_COLUMN_WIDTH = 260
// Reserve enough height for the vote and action controls that appear after Reveal.
const REVEAL_NOTE_HEIGHT = 190
const SECTION_HEADER_HEIGHT = 40

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
        width: s.width ?? DEFAULT_SECTION_WIDTH,
        height: s.height ?? DEFAULT_SECTION_HEIGHT,
        x: s.x ?? (s.order % 2) * (DEFAULT_SECTION_WIDTH + SECTION_GAP),
        y: s.y ?? Math.floor(s.order / 2) * (DEFAULT_SECTION_HEIGHT + SECTION_GAP),
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
        width: DEFAULT_SECTION_WIDTH,
        height: DEFAULT_SECTION_HEIGHT,
        x: (i % 2) * (DEFAULT_SECTION_WIDTH + SECTION_GAP),
        y: Math.floor(i / 2) * (DEFAULT_SECTION_HEIGHT + SECTION_GAP),
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

    const board = await ctx.db.get(boardId)
    if (!board) throw new Error('Board not found')

    const updates: Record<string, unknown> = { phase }
    if (votesPerPerson !== undefined) {
      updates.votesPerPerson = votesPerPerson
    }

    await ctx.db.patch(boardId, updates)

    if (phase === 'reveal' && board.phase !== 'reveal') {
      const [sections, notes] = await Promise.all([
        ctx.db
          .query('sections')
          .withIndex('by_board', q => q.eq('boardId', boardId))
          .collect(),
        ctx.db
          .query('notes')
          .withIndex('by_board', q => q.eq('boardId', boardId))
          .collect(),
      ])

      const creatorIds = [...new Set(notes.map(note => note.createdBy))]
      const creators = await Promise.all(creatorIds.map(async id => [id, await ctx.db.get(id)] as const))
      const creatorNames = new Map(creators.map(([id, creator]) => [id, creator?.name ?? 'Unknown']))

      for (const section of sections) {
        const sectionName = section.name.toLowerCase()
        const isActionsSection =
          sectionName.includes('action') || sectionName.includes('todo') || sectionName.includes('next step')
        if (isActionsSection) continue

        const sectionNotes = notes.filter(note => note.sectionId === section._id)
        if (sectionNotes.length === 0) continue

        const notesByCreator = new Map<(typeof sectionNotes)[number]['createdBy'], typeof sectionNotes>()
        for (const note of sectionNotes) {
          const creatorNotes = notesByCreator.get(note.createdBy) ?? []
          creatorNotes.push(note)
          notesByCreator.set(note.createdBy, creatorNotes)
        }

        const creatorGroups = [...notesByCreator.entries()].sort(([leftId], [rightId]) => {
          const nameOrder = (creatorNames.get(leftId) ?? '').localeCompare(creatorNames.get(rightId) ?? '')
          return nameOrder || leftId.localeCompare(rightId)
        })
        const sectionWidth = section.width ?? DEFAULT_SECTION_WIDTH
        const sectionHeight = section.height ?? DEFAULT_SECTION_HEIGHT
        const canvasHeight = Math.max(1, sectionHeight - SECTION_HEADER_HEIGHT)
        const usableWidth = Math.max(REVEAL_NOTE_COLUMN_WIDTH, sectionWidth - REVEAL_LAYOUT_PADDING * 2)
        const columns = Math.max(1, Math.floor(usableWidth / REVEAL_NOTE_COLUMN_WIDTH))
        const columnWidth = usableWidth / columns
        const placements: { noteId: (typeof sectionNotes)[number]['_id']; column: number; row: number }[] = []
        let shelfColumn = 0
        let shelfRow = 0
        let shelfHeight = 1

        for (const [, creatorNotes] of creatorGroups) {
          creatorNotes.sort((left, right) => left._creationTime - right._creationTime)
          const groupWidth = Math.min(columns, Math.max(1, Math.round(Math.sqrt(creatorNotes.length))))
          const groupHeight = Math.ceil(creatorNotes.length / groupWidth)

          if (shelfColumn + groupWidth > columns) {
            shelfRow += shelfHeight
            shelfColumn = 0
            shelfHeight = 1
          }

          creatorNotes.forEach((note, index) => {
            placements.push({
              noteId: note._id,
              column: shelfColumn + (index % groupWidth),
              row: shelfRow + Math.floor(index / groupWidth),
            })
          })

          shelfColumn += groupWidth
          shelfHeight = Math.max(shelfHeight, groupHeight)
          if (shelfColumn === columns) {
            shelfRow += shelfHeight
            shelfColumn = 0
            shelfHeight = 1
          }
        }

        const lastRow = Math.max(0, ...placements.map(placement => placement.row))
        const availableVerticalSpace = Math.max(
          0,
          canvasHeight - REVEAL_LAYOUT_PADDING * 2 - REVEAL_NOTE_HEIGHT
        )
        const rowStep = lastRow === 0 ? 0 : Math.min(REVEAL_NOTE_HEIGHT, availableVerticalSpace / lastRow)

        for (const placement of placements) {
          await ctx.db.patch(placement.noteId, {
            positionX: ((REVEAL_LAYOUT_PADDING + placement.column * columnWidth) / sectionWidth) * 100,
            positionY: ((REVEAL_LAYOUT_PADDING + placement.row * rowStep) / canvasHeight) * 100,
          })
        }
      }
    }

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
          width: DEFAULT_SECTION_WIDTH,
          height: DEFAULT_SECTION_HEIGHT,
          x: ((maxOrder + 1) % 2) * (DEFAULT_SECTION_WIDTH + SECTION_GAP),
          y: Math.floor((maxOrder + 1) / 2) * (DEFAULT_SECTION_HEIGHT + SECTION_GAP),
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
    const previousWidth = section.width ?? DEFAULT_SECTION_WIDTH
    const previousHeight = section.height ?? DEFAULT_SECTION_HEIGHT

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
