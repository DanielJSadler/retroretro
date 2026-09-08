import React, { useEffect, useRef, useState } from 'react'
import { Note, NoteColor, Phase, Section } from '@/types'
import StickyNote from '@/components/organisms/StickyNote'

const sectionColorClasses: Record<NoteColor, string> = {
  yellow: 'bg-yellow-100 border-yellow-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  red: 'bg-red-100 border-red-300',
  pink: 'bg-pink-100 border-pink-300',
}

interface BoardSectionProps {
  section: Section
  isActions: boolean
  visibleNotes: Note[]
  topVotedRefs: (Note & { rank: number })[]
  sessionPhase: Phase
  getRemainingVotes: () => number
  hasVotedForNote: (note: Note) => boolean
  canSeeNote: (note: Note) => 'full' | 'ghost' | 'hidden'
  canEditNote: (note: Note) => boolean
  onAddNote: (
    content: string,
    color: NoteColor,
    sectionId: string,
    position?: { x: number; y: number }
  ) => Promise<void>
  onUpdateNote: (id: string, updates: Partial<Note>) => Promise<void>
  onDeleteNote: (id: string) => Promise<void>
  onVote: (noteId: string) => Promise<void>
  onDragStart: (note: Note, x: number, y: number) => void
  onDragMove: (x: number, y: number) => void
  onDragEnd: (noteId: string, clientX: number, clientY: number) => Promise<void>
  onCreateAction: (sourceNote: Note) => Promise<void>
  onResizeSection: (sectionId: string, width: number, height: number) => Promise<void>
  onSectionDragStart?: (sectionId: string, event: React.DragEvent<HTMLButtonElement>) => void
  onSectionDragOver?: (sectionId: string, event: React.DragEvent<HTMLDivElement>) => void
  onSectionDrop?: (sectionId: string, event: React.DragEvent<HTMLDivElement>) => void
  onSectionDragEnd?: () => void
  isMoving?: boolean
  zoom: number
  justDragged: boolean
  sectionRef: (el: HTMLDivElement | null) => void
  highlightedUser?: string | null
}

export default function BoardSection({
  section,
  isActions,
  visibleNotes,
  topVotedRefs,
  sessionPhase,
  getRemainingVotes,
  hasVotedForNote,
  canSeeNote,
  canEditNote,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onVote,
  onDragStart,
  onDragMove,
  onDragEnd,
  onCreateAction,
  onResizeSection,
  onSectionDragStart,
  onSectionDragOver,
  onSectionDrop,
  onSectionDragEnd,
  isMoving = false,
  zoom,
  justDragged,
  sectionRef,
  highlightedUser,
}: BoardSectionProps) {
  const [creatingInSection, setCreatingInSection] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [sectionSize, setSectionSize] = useState({ width: section.width, height: section.height })
  const resizeStart = useRef<{ x: number; y: number; width: number; height: number } | null>(null)
  const resizeLatest = useRef(sectionSize)

  useEffect(() => {
    if (!resizeStart.current) {
      const nextSize = { width: section.width, height: section.height }
      resizeLatest.current = nextSize
      setSectionSize(nextSize)
    }
  }, [section.width, section.height])

  const handleResizeStart = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    resizeStart.current = {
      x: e.clientX,
      y: e.clientY,
      width: sectionSize.width,
      height: sectionSize.height,
    }
  }

  const handleResizeMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const start = resizeStart.current
    if (!start) return
    e.preventDefault()
    e.stopPropagation()
    const nextSize = {
      width: Math.max(600, Math.min(4000, start.width + (e.clientX - start.x) / zoom)),
      height: Math.max(500, Math.min(4000, start.height + (e.clientY - start.y) / zoom)),
    }
    resizeLatest.current = nextSize
    setSectionSize(nextSize)
  }

  const handleResizeEnd = async (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizeStart.current) return
    e.preventDefault()
    e.stopPropagation()
    resizeStart.current = null
    await onResizeSection(section.id, resizeLatest.current.width, resizeLatest.current.height)
  }

  const handleSectionClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (justDragged) return
    if ((e.target as HTMLElement).closest('.sticky-note')) return

    const rect = e.currentTarget.getBoundingClientRect()
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100

    setCreatingInSection(section.id)
    setNewNoteContent('')
    ;(window as unknown as { _newNotePosition: { x: number; y: number } })._newNotePosition = {
      x: Math.max(2, Math.min(85, xPercent)),
      y: Math.max(2, Math.min(85, yPercent)),
    }
  }

  const handleCreateNote = async () => {
    if (!newNoteContent.trim()) {
      setCreatingInSection(null)
      return
    }
    const position = (window as unknown as { _newNotePosition?: { x: number; y: number } })._newNotePosition || {
      x: 50,
      y: 50,
    }
    await onAddNote(newNoteContent, section.color, section.id, position)
    setCreatingInSection(null)
    setNewNoteContent('')
  }

  const isNoteDimmed = (createdBy: string) => {
    if (!highlightedUser) return false
    return createdBy !== highlightedUser
  }

  return (
    <div
      className={`rounded-lg border-2 ${sectionColorClasses[section.color]} relative flex flex-col shrink-0 transition-opacity ${
        isMoving ? 'opacity-40' : ''
      }`}
      style={{
        width: `${sectionSize.width}px`,
        height: `${sectionSize.height}px`,
      }}
      onDragOver={event => onSectionDragOver?.(section.id, event)}
      onDrop={event => onSectionDrop?.(section.id, event)}
    >
      <h3 className="flex items-center gap-1 border-b border-gray-300 px-2 py-2 text-sm font-semibold text-gray-800 flex-shrink-0">
        <button
          type="button"
          draggable
          onDragStart={event => onSectionDragStart?.(section.id, event)}
          onDragEnd={onSectionDragEnd}
          className="cursor-grab rounded px-1 text-gray-500 hover:bg-white/60 active:cursor-grabbing"
          title="Drag to move this board area"
          aria-label={`Move ${section.name}`}
        >
          ⠿
        </button>
        <span className="flex-1 text-center">
          {section.name}
          <span className="ml-1 text-xs font-normal text-gray-500">({visibleNotes.length})</span>
        </span>
        <span className="w-5" aria-hidden />
      </h3>

      <div
        ref={sectionRef}
        className="section-canvas flex-1 relative overflow-hidden cursor-crosshair"
        onClick={handleSectionClick}
      >
        {isActions && topVotedRefs.length > 0 && (
          <div className="absolute left-2 top-2 space-y-2 z-10 pointer-events-auto">
            <div className="text-xs font-semibold text-purple-700 mb-1">🏆 Top Voted Items:</div>
            {topVotedRefs.map(refNote => (
              <div
                key={`ref-${refNote.id}`}
                className="sticky-note pointer-events-auto"
                style={{
                  position: 'relative',
                  opacity: isNoteDimmed(refNote.createdBy) ? 0.25 : 1,
                  transition: 'opacity 0.2s ease-in-out',
                }}
              >
                <StickyNote
                  note={refNote}
                  canEdit={false}
                  canSee={true}
                  canVote={false}
                  hasVoted={hasVotedForNote(refNote)}
                  currentPhase={sessionPhase}
                  onUpdate={async () => {}}
                  onDelete={async () => {}}
                  onVote={async () => {}}
                  onCreateAction={onCreateAction}
                  showCreateAction={true}
                  isReference={true}
                />
              </div>
            ))}
          </div>
        )}

        {visibleNotes.map(note => {
          const visibility = canSeeNote(note)
          const isGhost = visibility === 'ghost'
          const dimmed = isNoteDimmed(note.createdBy)

          return (
            <div
              key={note.id}
              className="sticky-note"
              style={{
                opacity: dimmed && !isGhost ? 0.25 : 1,
                transition: 'opacity 0.2s ease-in-out',
                pointerEvents: dimmed ? 'none' : 'auto',
              }}
            >
              {isGhost ? (
                <div
                  className="w-40 p-3 rounded-lg shadow-md bg-gray-200 border-2 border-dashed border-gray-400 opacity-50"
                  style={{
                    position: 'absolute',
                    left: `${note.position.x}%`,
                    top: `${note.position.y}%`,
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-xs font-semibold text-gray-500 truncate">{note.createdBy}</span>
                  </div>
                  <div className="text-xs text-gray-400 italic">✍️ Writing...</div>
                </div>
              ) : (
                <StickyNote
                  note={note}
                  canEdit={canEditNote(note)}
                  canSee={true}
                  canVote={!isActions && (getRemainingVotes() > 0 || hasVotedForNote(note))}
                  hasVoted={hasVotedForNote(note)}
                  currentPhase={sessionPhase}
                  onUpdate={onUpdateNote}
                  onDelete={onDeleteNote}
                  onVote={onVote}
                  onDragEnd={(id, x, y) => onDragEnd(id, x, y)}
                  onDragStart={onDragStart}
                  onDragMove={onDragMove}
                  onCreateAction={onCreateAction}
                  showCreateAction={!isActions && sessionPhase === 'discussion'}
                  zoom={zoom}
                />
              )}
            </div>
          )
        })}

        {creatingInSection === section.id && (
          <div
            className="absolute bg-white rounded-lg shadow-xl p-3 z-50 w-48"
            style={{
              left: `${(window as unknown as { _newNotePosition?: { x: number; y: number } })._newNotePosition?.x || 20}%`,
              top: `${(window as unknown as { _newNotePosition?: { x: number; y: number } })._newNotePosition?.y || 20}%`,
            }}
            onClick={e => e.stopPropagation()}
          >
            <textarea
              value={newNoteContent}
              onChange={e => setNewNoteContent(e.target.value)}
              placeholder="Type your note..."
              className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleCreateNote()
                }
                if (e.key === 'Escape') {
                  setCreatingInSection(null)
                }
              }}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleCreateNote}
                className="flex-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
              >
                Add (Enter)
              </button>
              <button
                onClick={() => setCreatingInSection(null)}
                className="flex-1 px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
              >
                Cancel (Esc)
              </button>
            </div>
          </div>
        )}

        {visibleNotes.length === 0 && creatingInSection !== section.id && !(isActions && topVotedRefs.length > 0) && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
            <div className="text-center">
              <div className="text-2xl mb-1">📝</div>
              <p className="text-xs">Click to add a note</p>
            </div>
          </div>
        )}

        {sessionPhase !== 'finished' && (
          <button
            type="button"
            data-resize-handle
            className="absolute bottom-1 right-1 z-50 h-7 w-7 cursor-nwse-resize touch-none rounded border border-gray-500/30 bg-white/80 text-gray-600 shadow-sm hover:bg-white"
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={handleResizeEnd}
            onPointerCancel={handleResizeEnd}
            onClick={e => e.stopPropagation()}
            aria-label={`Resize ${section.name}`}
            title="Drag to resize section"
          >
            ↘
          </button>
        )}
      </div>
    </div>
  )
}
