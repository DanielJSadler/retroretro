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
  const resizeSection = useMutation(api.boards.resizeSection)
  const reorderSections = useMutation(api.boards.reorderSections)
  const moveSection = useMutation(api.boards.moveSection)

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

  const handleResizeSection = async (sectionId: string, width: number, height: number) => {
    await resizeSection({ sectionId: sectionId as Id<'sections'>, width, height })
  }

  const handleReorderSections = async (sectionIds: string[]) => {
    await reorderSections({
      boardId: boardId as Id<'boards'>,
      sectionIds: sectionIds as Id<'sections'>[],
    })
  }

  const handleMoveSection = async (sectionId: string, x: number, y: number) => {
    await moveSection({ sectionId: sectionId as Id<'sections'>, x, y })
  }

  return {
    handlePhaseChange,
    handleStartTimer,
    handlePauseTimer,
    handleResetTimer,
    handleResizeSection,
    handleReorderSections,
    handleMoveSection,
    handleLeave,
  }
}
