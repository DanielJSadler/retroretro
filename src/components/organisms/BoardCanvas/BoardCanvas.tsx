import React, { useEffect, useState } from 'react'

interface BoardCanvasProps {
  children: React.ReactNode
  zoom?: number
  onZoomChange?: (newZoom: number) => void
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
          onZoomChange(Math.max(0.25, Math.min(2, zoom + (e.deltaY > 0 ? -0.05 : 0.05))))
        }
      }
    }

    mainEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => mainEl.removeEventListener('wheel', handleWheel)
  }, [zoom, onZoomChange, isFollowing])

  return (
    <main
      id="board-main"
      className={`flex-1 p-3 ${isFollowing ? 'overflow-hidden pointer-events-none' : 'overflow-auto'}`}
    >
      <div
        ref={boardRef}
        className={`flex gap-3 origin-top-left transition-transform duration-100 relative w-max ${isFollowing ? 'pointer-events-auto' : ''}`}
        style={{
          transform: `scale(${zoom})`,
        }}
      >
        {children}
      </div>
    </main>
  )
}
