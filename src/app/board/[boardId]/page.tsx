'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/organisms/Header'
import Sidebar from '@/components/organisms/Sidebar'
import ConfettiLayer from '@/components/organisms/ConfettiLayer'
import ConfettiMenu from '@/components/molecules/ConfettiMenu'
import BoardCanvas from '@/components/organisms/BoardCanvas'
import BoardSection from '@/components/organisms/BoardSection'
import CursorOverlay from '@/components/organisms/CursorOverlay'
import { Note } from '@/types'

import { useBoardSync } from '@/hooks/useBoardSync'
import { useCursorTracking } from '@/hooks/useCursorTracking'
import { useNotes } from '@/hooks/useNotes'
import { useBoardControls } from '@/hooks/useBoardControls'

export default function BoardPage() {
  const params = useParams()
  const boardId = params.boardId as string

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [justDragged, setJustDragged] = useState(false)
  const [draggingNote, setDraggingNote] = useState<{ note: Note; x: number; y: number } | null>(null)

  const [isConfettiMode, setIsConfettiMode] = useState(false)
  const [confettiType, setConfettiType] = useState<'basic' | 'stars' | 'fireworks' | 'random'>('basic')

  const boardRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  const { board, session, currentUser, currentUserName, isAuthenticated, authLoading } = useBoardSync(boardId)
  const { getCursorPositions } = useCursorTracking(boardId, boardRef, zoom)
  const { handlePhaseChange, handleStartTimer, handlePauseTimer, handleResetTimer, handleLeave } =
    useBoardControls(boardId)
  const notesManager = useNotes(boardId, session, currentUser)

  const handleNoteDragStart = (note: Note, x: number, y: number) => {
    setDraggingNote({ note, x, y })
  }

  const handleNoteDragMove = (x: number, y: number) => {
    if (draggingNote) {
      setDraggingNote({ note: draggingNote.note, x, y })
    }
  }

  const handleDragEndAndDrop = async (noteId: string, clientX: number, clientY: number) => {
    setJustDragged(true)
    setDraggingNote(null)
    setTimeout(() => setJustDragged(false), 100)
    await notesManager.handleNoteDragEnd(noteId, clientX, clientY, sectionRefs)
  }

  if (authLoading) return <LoadingScreen message="Loading..." />
  if (!isAuthenticated) return null
  if (board === undefined) return <LoadingScreen message="Loading board..." />
  if (board === null)
    return <ErrorScreen title="Board Not Found" message="This board doesn't exist or may have been deleted." />
  if (!session)
    return (
      <ErrorScreen title="Failed to load board" message="An error occurred building the session out of board data." />
    )

  const getTopVotedNotes = (): (Note & { rank: number })[] => {
    if (session.phase !== 'discussion' && session.phase !== 'finished') return []
    const actionsSection = session.sections.find(s => notesManager.isActionsSection(s))
    if (!actionsSection) return []
    const votableNotes = session.notes.filter(n => n.sectionId !== actionsSection.id && (n.votes?.length || 0) > 0)
    return [...votableNotes]
      .sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))
      .slice(0, 5)
      .map((note, index) => ({ ...note, rank: index + 1 }))
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 text-black overflow-hidden">
      <Header
        session={session}
        currentUser={currentUserName}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCopyLink={() => {
          navigator.clipboard.writeText(window.location.href)
          alert('Board link copied to clipboard!')
        }}
        onLeave={handleLeave}
        getRemainingVotes={notesManager.getRemainingVotes}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          session={session}
          currentUser={currentUserName}
          collapsed={sidebarCollapsed}
          zoom={zoom}
          onPhaseChange={handlePhaseChange}
          onStartTimer={handleStartTimer}
          onPauseTimer={handlePauseTimer}
          onResetTimer={handleResetTimer}
          onZoomIn={() => setZoom(z => Math.min(2, z + 0.1))}
          onZoomOut={() => setZoom(z => Math.max(0.25, z - 0.1))}
          onZoomReset={() => setZoom(1)}
          musicCurrentSong={board?.musicCurrentSong}
          musicStatus={board?.musicStatus}
          musicStartedAt={board?.musicStartedAt}
          musicSeekTime={board?.musicSeekTime}
        />

        <BoardCanvas zoom={zoom} onZoomChange={setZoom} boardRef={boardRef}>
          <CursorOverlay
            cursors={getCursorPositions}
            currentUserId={(currentUser as any)?._id || (currentUser as any)?.id}
          />

          {(session.sections || []).map(section => (
            <BoardSection
              key={section.id}
              section={section}
              isActions={notesManager.isActionsSection(section)}
              visibleNotes={session.notes.filter(
                note => note.sectionId === section.id && notesManager.canSeeNote(note) !== 'hidden'
              )}
              topVotedRefs={notesManager.isActionsSection(section) ? getTopVotedNotes() : []}
              sessionPhase={session.phase}
              getRemainingVotes={notesManager.getRemainingVotes}
              hasVotedForNote={notesManager.hasVotedForNote}
              canSeeNote={notesManager.canSeeNote}
              canEditNote={notesManager.canEditNote}
              onAddNote={notesManager.handleAddNote}
              onUpdateNote={notesManager.handleUpdateNote}
              onDeleteNote={notesManager.handleDeleteNote}
              onVote={notesManager.handleVote}
              onCreateAction={notesManager.handleCreateAction}
              onDragStart={handleNoteDragStart}
              onDragMove={handleNoteDragMove}
              onDragEnd={handleDragEndAndDrop}
              zoom={zoom}
              justDragged={justDragged}
              sectionRef={el => sectionRefs.current.set(section.id, el)}
            />
          ))}
        </BoardCanvas>

        {draggingNote && (
          <div
            className="fixed pointer-events-none"
            style={{ left: `${draggingNote.x}px`, top: `${draggingNote.y}px`, zIndex: 99999 }}
          >
            <div
              className={`w-40 p-3 rounded-lg shadow-2xl scale-105 ${
                draggingNote.note.color === 'yellow'
                  ? 'bg-yellow-200'
                  : draggingNote.note.color === 'blue'
                    ? 'bg-blue-200'
                    : draggingNote.note.color === 'green'
                      ? 'bg-green-200'
                      : draggingNote.note.color === 'red'
                        ? 'bg-red-200'
                        : 'bg-pink-200'
              }`}
            >
              <div className="text-xs font-semibold text-gray-700 mb-1">{draggingNote.note.createdBy}</div>
              <div className="text-xs text-gray-800 overflow-hidden text-ellipsis line-clamp-4">
                {draggingNote.note.content}
              </div>
            </div>
          </div>
        )}

        <ConfettiLayer
          isActive={isConfettiMode}
          type={confettiType}
          boardId={boardId}
          currentUserId={currentUser?.id}
        />
        <ConfettiMenu
          isActive={isConfettiMode}
          onToggle={() => setIsConfettiMode(!isConfettiMode)}
          currentType={confettiType}
          onTypeChange={setConfettiType}
        />
      </div>
    </div>
  )
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <div className="text-xl font-semibold text-black">{message}</div>
      </div>
    </div>
  )
}

function ErrorScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-2xl font-bold text-black mb-2">{title}</h1>
        <p className="text-gray-600 mb-4">{message}</p>
        <button
          onClick={() => (window.location.href = '/')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
        >
          Go to Home
        </button>
      </div>
    </div>
  )
}
