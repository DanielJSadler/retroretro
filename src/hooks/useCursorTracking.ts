import type React from 'react'
// import { useCallback, useEffect, useRef } from 'react'
// import { useQuery, useMutation } from 'convex/react'
// import { api } from '../../convex/_generated/api'
// import { Id } from '../../convex/_generated/dataModel'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function useCursorTracking(boardId: string, boardRef: React.RefObject<HTMLDivElement | null>, zoom: number) {
  /*
  const getCursorPositions = useQuery(
    api.participants.getCursorPositions,
    boardId ? { boardId: boardId as Id<'boards'> } : 'skip'
  )
  const updateCursor = useMutation(api.participants.updateCursor)

  const lastCursorRef = useRef({ x: 0, y: 0 })

  const syncPresence = async (cursorX: number, cursorY: number) => {
    const mainEl = document.getElementById('board-main')
    try {
      await updateCursor({
        boardId: boardId as Id<'boards'>,
        cursorX,
        cursorY,
        viewportX: mainEl?.scrollLeft,
        viewportY: mainEl?.scrollTop,
        zoom,
      })
    } catch (_e) {
      // Ignore sync errors
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const throttledSync = useCallback(throttle(syncPresence, 200), [updateCursor, boardId, zoom])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const rect = boardRef.current?.getBoundingClientRect()
      if (!rect) return

      const x = (e.clientX - rect.left) / zoom
      const y = (e.clientY - rect.top) / zoom

      lastCursorRef.current = { x, y }
      throttledSync(x, y)
    },
    [zoom, boardRef, throttledSync]
  )

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  // Sync when scrolling the board
  useEffect(() => {
    const mainEl = document.getElementById('board-main')
    if (!mainEl) return

    const handleScroll = () => {
      throttledSync(lastCursorRef.current.x, lastCursorRef.current.y)
    }

    mainEl.addEventListener('scroll', handleScroll, { passive: true })
    return () => mainEl.removeEventListener('scroll', handleScroll)
  }, [throttledSync])

  // Sync on zoom changes explicitly
  useEffect(() => {
    throttledSync(lastCursorRef.current.x, lastCursorRef.current.y)
  }, [zoom, throttledSync])

  return {
    getCursorPositions,
  }
  */

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getCursorPositions: undefined as any[] | undefined,
  }
}
