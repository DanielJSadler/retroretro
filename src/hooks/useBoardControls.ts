import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'
import { Phase } from '@/types'
import { useRouter } from 'next/navigation'

export function useBoardControls(boardId: string) {
  const router = useRouter()
  const updatePhase = useMutation(api.boards.updatePhase)
  const startTimer = useMutation(api.timer.start)
  const pauseTimer = useMutation(api.timer.pause)
  const resetTimer = useMutation(api.timer.reset)

  const handlePhaseChange = async (phase: Phase, options?: { votesPerPerson?: number; resetVotes?: boolean }) => {
    try {
      await updatePhase({
        boardId: boardId as Id<'boards'>,
        phase,
        ...options,
      })
    } catch (error) {
      console.error('Failed to change phase:', error)
    }
  }

  const handleStartTimer = async (duration: number) => {
    try {
      await startTimer({
        boardId: boardId as Id<'boards'>,
        duration,
      })
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handlePauseTimer = async () => {
    try {
      await pauseTimer({ boardId: boardId as Id<'boards'> })
    } catch (error) {
      console.error('Failed to pause timer:', error)
    }
  }

  const handleResetTimer = async () => {
    try {
      await resetTimer({ boardId: boardId as Id<'boards'> })
    } catch (error) {
      console.error('Failed to reset timer:', error)
    }
  }

  const handleLeave = () => {
    router.push('/')
  }

  return {
    handlePhaseChange,
    handleStartTimer,
    handlePauseTimer,
    handleResetTimer,
    handleLeave,
  }
}
