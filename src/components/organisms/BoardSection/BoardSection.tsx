import React, { useState } from 'react'
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
  zoom: number
  justDragged: boolean
  sectionRef: (el: HTMLDivElement | null) => void
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
  zoom,
  justDragged,
  sectionRef,
}: BoardSectionProps) {
  const [creatingInSection, setCreatingInSection] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')

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

  return (
    <div
      className={`rounded-lg border-2 ${sectionColorClasses[section.color]} flex flex-col shrink-0`}
      style={{
        width: '1500px',
        height: '2000px',
      }}
    >
      <h3 className="font-semibold text-gray-800 text-center border-b border-gray-300 py-2 px-2 flex-shrink-0 text-sm">
        {section.name}
        <span className="ml-1 text-xs font-normal text-gray-500">({visibleNotes.length})</span>
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
                style={{ position: 'relative' }}
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

          return (
            <div key={note.id} className="sticky-note">
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
      </div>
    </div>
  )
}
