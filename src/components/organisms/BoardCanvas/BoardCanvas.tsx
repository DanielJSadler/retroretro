import React, { useEffect, useState } from 'react'

interface BoardCanvasProps {
  children: React.ReactNode
  zoom?: number
  onZoomChange?: (newZoom: number) => void
  boardRef?: React.RefObject<HTMLDivElement | null>
}

export default function BoardCanvas({ children, zoom = 1, onZoomChange, boardRef }: BoardCanvasProps) {
  // Handle wheel zoom
  useEffect(() => {
    const mainEl = document.getElementById('board-main')
    if (!mainEl) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        if (onZoomChange) {
          onZoomChange(Math.max(0.25, Math.min(2, zoom + (e.deltaY > 0 ? -0.05 : 0.05))))
        }
      }
    }

    mainEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => mainEl.removeEventListener('wheel', handleWheel)
  }, [zoom, onZoomChange])

  return (
    <main id="board-main" className="flex-1 p-3 overflow-auto">
      <div
        ref={boardRef}
        className="flex gap-3 origin-top-left transition-transform duration-100 relative w-max"
        style={{
          transform: `scale(${zoom})`,
        }}
      >
        {children}
      </div>
    </main>
  )
}
