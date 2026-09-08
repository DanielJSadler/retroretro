import React, { useEffect, useRef, useState } from 'react'

export interface ZoomAnchor {
  x: number
  y: number
}

interface BoardCanvasProps {
  children: React.ReactNode
  zoom?: number
  onZoomChange?: (newZoom: number, anchor?: ZoomAnchor) => void
  boardRef?: React.RefObject<HTMLDivElement | null>
  isFollowing?: boolean
}

export default function BoardCanvas({
  children,
  zoom = 1,
  onZoomChange,
  boardRef,
  isFollowing = false,
}: BoardCanvasProps) {
  const internalBoardRef = useRef<HTMLDivElement>(null)
  const activeBoardRef = boardRef ?? internalBoardRef
  const [contentSize, setContentSize] = useState({ width: 1, height: 1 })
  const [spacePressed, setSpacePressed] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const panStart = useRef<{ x: number; y: number; scrollLeft: number; scrollTop: number } | null>(null)

  useEffect(() => {
    const element = activeBoardRef.current
    if (!element) return

    const updateSize = () => {
      setContentSize({ width: element.scrollWidth, height: element.scrollHeight })
    }
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(element)
    return () => observer.disconnect()
  }, [activeBoardRef])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (e.code === 'Space' && !target?.closest('input, textarea, select, button')) {
        e.preventDefault()
        setSpacePressed(true)
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setSpacePressed(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Handle wheel zoom
  useEffect(() => {
    const mainEl = document.getElementById('board-main')
    if (!mainEl) return

    const handleWheel = (e: WheelEvent) => {
      // Don't allow zooming if following someone else's zoom
      if (isFollowing) return

      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (onZoomChange) {
          const rect = mainEl.getBoundingClientRect()
          const nextZoom = Math.max(0.25, Math.min(2, zoom * Math.exp(-e.deltaY * 0.002)))
          onZoomChange(nextZoom, { x: e.clientX - rect.left, y: e.clientY - rect.top })
        }
      }
    }

    mainEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => mainEl.removeEventListener('wheel', handleWheel)
  }, [zoom, onZoomChange, isFollowing])

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (isFollowing || (e.button !== 1 && !spacePressed)) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    panStart.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: e.currentTarget.scrollLeft,
      scrollTop: e.currentTarget.scrollTop,
    }
    setIsPanning(true)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!panStart.current) return
    e.preventDefault()
    e.currentTarget.scrollLeft = panStart.current.scrollLeft - (e.clientX - panStart.current.x)
    e.currentTarget.scrollTop = panStart.current.scrollTop - (e.clientY - panStart.current.y)
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!panStart.current) return
    panStart.current = null
    setIsPanning(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  return (
    <main
      id="board-main"
      className={`flex-1 p-3 ${isFollowing ? 'overflow-hidden pointer-events-none' : 'overflow-auto'} ${
        isPanning ? 'cursor-grabbing select-none' : spacePressed ? 'cursor-grab' : ''
      }`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div
        className="relative"
        style={{ width: `${contentSize.width * zoom}px`, height: `${contentSize.height * zoom}px` }}
      >
        <div
          ref={activeBoardRef}
          className={`absolute left-0 top-0 flex gap-3 origin-top-left w-max ${isFollowing ? 'pointer-events-auto' : ''}`}
          style={{ transform: `scale(${zoom})` }}
        >
          {children}
        </div>
      </div>
    </main>
  )
}
