import { useCallback, useEffect } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { Id } from '../../convex/_generated/dataModel'

export function useCursorTracking(boardId: string, boardRef: React.RefObject<HTMLDivElement | null>, zoom: number) {
  const getCursorPositions = useQuery(
    api.participants.getCursorPositions,
    boardId ? { boardId: boardId as Id<'boards'> } : 'skip'
  )
  const updateCursor = useMutation(api.participants.updateCursor)

  const moveCursor = async (cursorX: number, cursorY: number) => {
    await updateCursor({ boardId: boardId as Id<'boards'>, cursorX, cursorY })
  }

  function throttle<T extends (...args: any[]) => void>(fn: T, wait = 500) {
    let lastArgs: Parameters<T> | null = null
    let timeoutId: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
      lastArgs = args

      if (!timeoutId) {
        fn(...args)
        timeoutId = setTimeout(() => {
          timeoutId = null
          if (lastArgs && lastArgs !== args) {
            fn(...lastArgs)
          }
        }, wait)
      }
    }
  }

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = boardRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom

      moveCursor(x, y)
    },
    [zoom, boardId, updateCursor]
  )

  useEffect(() => {
    const onMove = throttle(handleMouseMove, 200)

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [handleMouseMove])

  return {
    getCursorPositions,
  }
}
