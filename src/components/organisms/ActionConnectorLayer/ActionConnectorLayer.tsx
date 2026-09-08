'use client'

import { useLayoutEffect, useState } from 'react'

interface ActionLink {
  actionNoteId: string
  sourceNoteId: string
}

interface Point {
  x: number
  y: number
}

interface Connector {
  actionNoteId: string
  end: Point
  start: Point
}

interface ActionConnectorLayerProps {
  boardRef: React.RefObject<HTMLDivElement | null>
  canvasSize: { width: number; height: number }
  links: ActionLink[]
  noteRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>
  zoom: number
}

function getEdgePoints(source: DOMRect, action: DOMRect, board: DOMRect, zoom: number) {
  const sourceCenter = {
    x: source.left + source.width / 2,
    y: source.top + source.height / 2,
  }
  const actionCenter = {
    x: action.left + action.width / 2,
    y: action.top + action.height / 2,
  }
  const horizontal = Math.abs(actionCenter.x - sourceCenter.x) >= Math.abs(actionCenter.y - sourceCenter.y)
  const movesRight = actionCenter.x >= sourceCenter.x
  const movesDown = actionCenter.y >= sourceCenter.y

  const toBoardPoint = (point: Point): Point => ({
    x: (point.x - board.left) / zoom,
    y: (point.y - board.top) / zoom,
  })

  if (horizontal) {
    return {
      start: toBoardPoint({ x: movesRight ? source.right : source.left, y: sourceCenter.y }),
      end: toBoardPoint({ x: movesRight ? action.left : action.right, y: actionCenter.y }),
    }
  }

  return {
    start: toBoardPoint({ x: sourceCenter.x, y: movesDown ? source.bottom : source.top }),
    end: toBoardPoint({ x: actionCenter.x, y: movesDown ? action.top : action.bottom }),
  }
}

export default function ActionConnectorLayer({
  boardRef,
  canvasSize,
  links,
  noteRefs,
  zoom,
}: ActionConnectorLayerProps) {
  const [connectors, setConnectors] = useState<Connector[]>([])

  useLayoutEffect(() => {
    const board = boardRef.current
    if (!board || links.length === 0) {
      setConnectors([])
      return
    }

    let frameId = 0
    const measure = () => {
      const boardRect = board.getBoundingClientRect()
      setConnectors(
        links.flatMap(link => {
          const source = noteRefs.current.get(link.sourceNoteId)
          const action = noteRefs.current.get(link.actionNoteId)
          if (!source || !action) return []

          const { start, end } = getEdgePoints(source.getBoundingClientRect(), action.getBoundingClientRect(), boardRect, zoom)
          return [{ actionNoteId: link.actionNoteId, start, end }]
        })
      )
    }

    frameId = requestAnimationFrame(measure)
    const observer = new ResizeObserver(measure)
    observer.observe(board)
    noteRefs.current.forEach(element => {
      if (element) observer.observe(element)
    })
    window.addEventListener('resize', measure)

    return () => {
      cancelAnimationFrame(frameId)
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [boardRef, links, noteRefs, zoom])

  if (connectors.length === 0) return null

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 z-10 overflow-visible"
      width={canvasSize.width}
      height={canvasSize.height}
      viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
    >
      <defs>
        <marker id="action-arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 z" fill="#7c3aed" />
        </marker>
      </defs>
      {connectors.map(({ actionNoteId, start, end }) => {
        const controlDistance = Math.max(40, Math.min(180, Math.hypot(end.x - start.x, end.y - start.y) / 2))
        const horizontal = Math.abs(end.x - start.x) >= Math.abs(end.y - start.y)
        const controlOne = horizontal ? { x: start.x + (end.x >= start.x ? controlDistance : -controlDistance), y: start.y } : { x: start.x, y: start.y + (end.y >= start.y ? controlDistance : -controlDistance) }
        const controlTwo = horizontal ? { x: end.x - (end.x >= start.x ? controlDistance : -controlDistance), y: end.y } : { x: end.x, y: end.y - (end.y >= start.y ? controlDistance : -controlDistance) }

        return (
          <path
            key={actionNoteId}
            d={`M ${start.x} ${start.y} C ${controlOne.x} ${controlOne.y}, ${controlTwo.x} ${controlTwo.y}, ${end.x} ${end.y}`}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="3"
            strokeDasharray="8 6"
            markerEnd="url(#action-arrowhead)"
          />
        )
      })}
    </svg>
  )
}
