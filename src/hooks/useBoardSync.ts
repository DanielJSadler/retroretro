import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { NoteColor, Session } from '@/types'

export function useBoardSync(boardId: string) {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()

  const skipArgs = !boardId ? ('skip' as const) : undefined
  const boardArgs = boardId ? { boardId: boardId as Id<'boards'> } : ('skip' as const)

  // Split queries — each only re-fires when its own tables change
  const board = useQuery(api.boards.get, boardArgs) // boards + sections
  const notes = useQuery(api.notes.getByBoard, boardArgs) // notes + votes
  const participants = useQuery(api.participants.getActive, boardArgs) // participants

  const currentUser = useQuery(api.users.current)

  // Mutations
  const joinBoard = useMutation(api.participants.join)
  const heartbeat = useMutation(api.participants.heartbeat)
  const leaveBoard = useMutation(api.participants.leave)

  // Auth Redirect
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Join/Leave
  useEffect(() => {
    if (isAuthenticated && boardId) {
      joinBoard({ boardId: boardId as Id<'boards'> })
    }
    return () => {
      if (isAuthenticated && boardId) {
        leaveBoard({ boardId: boardId as Id<'boards'> })
      }
    }
  }, [isAuthenticated, boardId, joinBoard, leaveBoard])

  // Heartbeat
  useEffect(() => {
    if (!isAuthenticated || !boardId) return
    const interval = setInterval(() => {
      heartbeat({ boardId: boardId as Id<'boards'> })
    }, 10000)
    return () => clearInterval(interval)
  }, [isAuthenticated, boardId, heartbeat])

  // Format Session — merge data from separate queries
  const session: Session | null =
    board && notes && participants
      ? {
          id: board._id,
          name: board.name,
          createdAt: board._creationTime,
          createdBy: board.creatorName,
          phase: board.phase,
          notes: notes.map(
            (n: {
              id: Id<'notes'>
              content: string
              color: NoteColor
              createdBy: string
              position: { x: number; y: number }
              sectionId: Id<'sections'>
              createdAt: number
              votes: Id<'users'>[]
            }) => ({
              ...n,
              id: n.id as string,
              sectionId: n.sectionId as string,
              votes: n.votes.map(v => v as string),
            })
          ),
          participants: participants,
          sections: board.sections.map((s: { id: Id<'sections'>; name: string; color: NoteColor }) => ({
            ...s,
            id: s.id as string,
          })),
          timerDuration: board.timerDuration,
          timerStartedAt: board.timerStartedAt,
          timerPaused: board.timerPaused,
          timerRemainingTime: board.timerRemainingTime,
          votesPerPerson: board.votesPerPerson,
        }
      : null

  const currentUserName = currentUser?.name ?? ''

  return {
    board,
    session,
    currentUser,
    currentUserName,
    isAuthenticated,
    authLoading,
  }
}
