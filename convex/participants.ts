import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { auth } from './auth'

// Join a board (add/update participant)
export const join = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) throw new Error('Not authenticated')

    const user = await ctx.db.get(userId)
    if (!user) throw new Error('User not found')

    // Check if already a participant
    const existing = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .first()

    if (existing) {
      // Update last seen and active status
      await ctx.db.patch(existing._id, {
        isActive: true,
        lastSeen: Date.now(),
      })
    } else {
      // Create new participant
      await ctx.db.insert('participants', {
        boardId,
        userId,
        name: user.name ?? 'Anonymous',
        isActive: true,
        lastSeen: Date.now(),
      })
    }
  },
})

// Update heartbeat (last seen)
export const heartbeat = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return

    const participant = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .first()

    if (participant) {
      await ctx.db.patch(participant._id, {
        isActive: true,
        lastSeen: Date.now(),
      })
    }
  },
})

// Get active participants for a board
export const getActive = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const thirtySecondsAgo = Date.now() - 30000

    const participants = await ctx.db
      .query('participants')
      .withIndex('by_board', q => q.eq('boardId', boardId))
      .collect()

    // Filter and update active status based on last seen
    return participants
      .map(p => ({
        id: p._id,
        name: p.name,
        isActive: p.lastSeen > thirtySecondsAgo,
        lastSeen: p.lastSeen,
      }))
      .filter(p => p.isActive)
  },
})

// Leave a board (mark as inactive)
export const leave = mutation({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return

    const participant = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .first()

    if (participant) {
      await ctx.db.patch(participant._id, {
        isActive: false,
      })
    }
  },
})
export const updateCursor = mutation({
  args: {
    boardId: v.id('boards'),
    cursorX: v.number(),
    cursorY: v.number(),
    viewportX: v.optional(v.number()),
    viewportY: v.optional(v.number()),
    zoom: v.optional(v.number()),
  },
  handler: async (ctx, { boardId, cursorX, cursorY, viewportX, viewportY, zoom }) => {
    const userId = await auth.getUserId(ctx)
    if (!userId) return

    const participant = await ctx.db
      .query('participants')
      .withIndex('by_user_and_board', q => q.eq('userId', userId).eq('boardId', boardId))
      .first()

    if (participant) {
      await ctx.db.patch(participant._id, {
        cursorX,
        cursorY,
        viewportX,
        viewportY,
        zoom,
      })
    }
  },
})

export const getCursorPositions = query({
  args: { boardId: v.id('boards') },
  handler: async (ctx, { boardId }) => {
    const participants = await ctx.db
      .query('participants')
      .withIndex('by_board', q => q.eq('boardId', boardId))
      .collect()

    return participants.map(p => ({
      id: p._id,
      userId: p.userId,
      name: p.name,
      cursorX: p.cursorX,
      cursorY: p.cursorY,
      viewportX: p.viewportX,
      viewportY: p.viewportY,
      zoom: p.zoom,
    }))
  },
})
