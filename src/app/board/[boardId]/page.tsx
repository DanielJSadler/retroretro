'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Header from '@/components/organisms/Header'
import Sidebar from '@/components/organisms/Sidebar'
import ConfettiLayer from '@/components/organisms/ConfettiLayer'
import ConfettiMenu from '@/components/molecules/ConfettiMenu'
import BoardCanvas from '@/components/organisms/BoardCanvas'
import BoardSection from '@/components/organisms/BoardSection'
import CursorOverlay from '@/components/organisms/CursorOverlay'
import ActionConnectorLayer from '@/components/organisms/ActionConnectorLayer'
import StickyNote from '@/components/organisms/StickyNote'
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
  const [highlightedUser, setHighlightedUser] = useState<string | null>(null)
  const [followedUser, setFollowedUser] = useState<string | null>(null)
  const [movingSectionId, setMovingSectionId] = useState<string | null>(null)
  const [sectionDragOffset, setSectionDragOffset] = useState({ x: 0, y: 0 })
  const [sectionGhostPosition, setSectionGhostPosition] = useState<{ x: number; y: number } | null>(null)
  const [timerExpired, setTimerExpired] = useState(false)
  const [focusedNoteId, setFocusedNoteId] = useState<string | null>(null)

  const [isConfettiMode, setIsConfettiMode] = useState(false)
  const [confettiType, setConfettiType] = useState<'basic' | 'stars' | 'fireworks' | 'random'>('basic')

  const boardRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const noteRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())
  const focusTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { board, session, currentUser, currentUserName, isAuthenticated, authLoading, setVotingDone } = useBoardSync(boardId)
  const { getCursorPositions } = useCursorTracking(boardId, boardRef, zoom)
  const {
    handlePhaseChange,
    handleStartTimer,
    handlePauseTimer,
    handleResetTimer,
    handleResizeSection,
    handleMoveSection,
    handleLeave,
  } = useBoardControls(boardId)
  const notesManager = useNotes(boardId, session, currentUser)
  const handleTimerFinish = useCallback(() => setTimerExpired(true), [])

  const handleNoteElementChange = useCallback((noteId: string, element: HTMLDivElement | null) => {
    if (element) {
      noteRefs.current.set(noteId, element)
    } else {
      noteRefs.current.delete(noteId)
    }
  }, [])

  const handleOpenSource = useCallback((sourceNoteId: string) => {
    const sourceElement = noteRefs.current.get(sourceNoteId)
    const mainElement = document.getElementById('board-main')
    if (sourceElement && mainElement) {
      const sourceRect = sourceElement.getBoundingClientRect()
      const mainRect = mainElement.getBoundingClientRect()
      mainElement.scrollBy({
        left: sourceRect.left - mainRect.left - (mainElement.clientWidth - sourceRect.width) / 2,
        top: sourceRect.top - mainRect.top - (mainElement.clientHeight - sourceRect.height) / 2,
        behavior: 'smooth',
      })
    }

    setFocusedNoteId(sourceNoteId)
    if (focusTimeout.current) clearTimeout(focusTimeout.current)
    focusTimeout.current = setTimeout(() => setFocusedNoteId(null), 1600)
  }, [])

  useEffect(() => {
    return () => {
      if (focusTimeout.current) clearTimeout(focusTimeout.current)
    }
  }, [])

  const handleZoomChange = useCallback(
    (requestedZoom: number, anchor?: { x: number; y: number }) => {
      const nextZoom = Math.max(0.1, Math.min(2, requestedZoom))
      const mainEl = document.getElementById('board-main')
      if (!mainEl || nextZoom === zoom) return

      const point = anchor ?? { x: mainEl.clientWidth / 2, y: mainEl.clientHeight / 2 }
      const boardX = (mainEl.scrollLeft + point.x) / zoom
      const boardY = (mainEl.scrollTop + point.y) / zoom
      setZoom(nextZoom)

      requestAnimationFrame(() => {
        mainEl.scrollLeft = boardX * nextZoom - point.x
        mainEl.scrollTop = boardY * nextZoom - point.y
      })
    },
    [zoom]
  )

  const handleFitBoard = useCallback(() => {
    const mainEl = document.getElementById('board-main')
    const boardEl = boardRef.current
    if (!mainEl || !boardEl) return
    const fitZoom = Math.min(
      1,
      (mainEl.clientWidth - 24) / boardEl.scrollWidth,
      (mainEl.clientHeight - 24) / boardEl.scrollHeight
    )
    setZoom(Math.max(0.1, fitZoom))
    requestAnimationFrame(() => mainEl.scrollTo({ left: 0, top: 0 }))
  }, [])

  const timerKey = `${boardId}:${session?.timerStartedAt}:${session?.timerDuration}`
  const [previousTimerKey, setPreviousTimerKey] = useState(timerKey)
  if (previousTimerKey !== timerKey) {
    setPreviousTimerKey(timerKey)
    setTimerExpired(false)
  }

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

  const handleSectionDragStart = (
    sectionId: string,
    offset: { x: number; y: number },
    event: React.DragEvent<HTMLButtonElement>
  ) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', sectionId)
    setMovingSectionId(sectionId)
    setSectionDragOffset(offset)
    const section = session?.sections.find(candidate => candidate.id === sectionId)
    setSectionGhostPosition(section ? { x: section.x, y: section.y } : null)
  }

  const getSnappedSectionPosition = (point: { x: number; y: number }) => ({
    x: Math.max(0, Math.round((point.x - sectionDragOffset.x) / 40) * 40),
    y: Math.max(0, Math.round((point.y - sectionDragOffset.y) / 40) * 40),
  })

  const handleCanvasSectionDragOver = (point: { x: number; y: number }) => {
    if (!movingSectionId) return
    setSectionGhostPosition(getSnappedSectionPosition(point))
  }

  const handleCanvasSectionDrop = async (point: { x: number; y: number }) => {
    if (!movingSectionId) {
      setMovingSectionId(null)
      setSectionGhostPosition(null)
      return
    }

    const nextPosition = getSnappedSectionPosition(point)
    const sectionId = movingSectionId

    setMovingSectionId(null)
    setSectionGhostPosition(null)
    try {
      await handleMoveSection(sectionId, nextPosition.x, nextPosition.y)
    } catch (error) {
      console.error('Failed to move board area:', error)
    }
  }

  const handleSectionDragEnd = () => {
    setMovingSectionId(null)
    setSectionGhostPosition(null)
  }

  // Follow logic
  useEffect(() => {
    if (!followedUser || !session || !getCursorPositions) return

    const followingParticipant = getCursorPositions.find(p => p.name === followedUser)
    if (followingParticipant) {
      // Sync zoom if it's drifting significantly
      if (followingParticipant.zoom && Math.abs(followingParticipant.zoom - zoom) > 0.05) {
        requestAnimationFrame(() => {
          setZoom(followingParticipant.zoom!)
        })
      }

      // Sync viewport scrolling
      const mainEl = document.getElementById('board-main')
      if (mainEl) {
        if (
          followingParticipant.viewportX !== undefined &&
          Math.abs(mainEl.scrollLeft - followingParticipant.viewportX) > 5
        ) {
          mainEl.scrollTo({ left: followingParticipant.viewportX, behavior: 'smooth' })
        }
        if (
          followingParticipant.viewportY !== undefined &&
          Math.abs(mainEl.scrollTop - followingParticipant.viewportY) > 5
        ) {
          mainEl.scrollTo({ top: followingParticipant.viewportY, behavior: 'smooth' })
        }
      }
    }
  }, [followedUser, session, getCursorPositions, zoom])

  if (authLoading) return <LoadingScreen message="Loading..." />
  if (!isAuthenticated) return null
  if (board === undefined) return <LoadingScreen message="Loading board..." />
  if (board === null)
    return <ErrorScreen title="Board Not Found" message="This board doesn't exist or may have been deleted." />
  if (!session)
    return (
      <ErrorScreen title="Failed to load board" message="An error occurred building the session out of board data." />
    )

  const movingSection = session.sections.find(section => section.id === movingSectionId)
  const canvasSize = session.sections.reduce(
    (size, section) => ({
      width: Math.max(size.width, section.x + section.width + 240),
      height: Math.max(size.height, section.y + section.height + 240),
    }),
    {
      width: sectionGhostPosition && movingSection ? sectionGhostPosition.x + movingSection.width + 240 : 1800,
      height: sectionGhostPosition && movingSection ? sectionGhostPosition.y + movingSection.height + 240 : 1200,
    }
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

  const topVotedNotes = getTopVotedNotes()
  const referencedNoteIds = new Set(topVotedNotes.map(note => note.id))
  const actionLinks = session.notes.flatMap(note =>
    note.sourceNoteId && referencedNoteIds.has(note.sourceNoteId)
      ? [{ actionNoteId: note.id, sourceNoteId: `reference:${note.sourceNoteId}` }]
      : []
  )
  const draggingNoteSection = draggingNote
    ? session.sections.find(section => section.id === draggingNote.note.sectionId)
    : undefined
  const draggingNoteIsActions = draggingNoteSection ? notesManager.isActionsSection(draggingNoteSection) : false
  const draggingNoteSource = draggingNote?.note.sourceNoteId
    ? session.notes.find(note => note.id === draggingNote.note.sourceNoteId)
    : undefined

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
        votingStatus={session.votingStatus}
        timerExpired={timerExpired}
        onDismissTimer={() => {
          setTimerExpired(false)
        }}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          session={session}
          currentUser={currentUserName}
          currentUserId={currentUser?.id}
          collapsed={sidebarCollapsed}
          zoom={zoom}
          onPhaseChange={handlePhaseChange}
          onStartTimer={duration => {
            setTimerExpired(false)
            handleStartTimer(duration)
          }}
          onPauseTimer={handlePauseTimer}
          onResetTimer={() => {
            setTimerExpired(false)
            handleResetTimer()
          }}
          onTimerFinish={handleTimerFinish}
          timerExpired={timerExpired}
          onVotingDone={setVotingDone}
          onZoomIn={() => handleZoomChange(zoom + 0.1)}
          onZoomOut={() => handleZoomChange(zoom - 0.1)}
          onZoomReset={() => handleZoomChange(1)}
          onZoomFit={handleFitBoard}
          highlightedUser={highlightedUser}
          setHighlightedUser={setHighlightedUser}
          followedUser={followedUser}
          setFollowedUser={setFollowedUser}
        />

        <BoardCanvas
          zoom={zoom}
          onZoomChange={handleZoomChange}
          boardRef={boardRef}
          isFollowing={!!followedUser}
          canvasSize={canvasSize}
          onCanvasDragOver={handleCanvasSectionDragOver}
          onCanvasDrop={handleCanvasSectionDrop}
        >
          <ActionConnectorLayer
            boardRef={boardRef}
            canvasSize={canvasSize}
            links={actionLinks}
            noteRefs={noteRefs}
            zoom={zoom}
          />

          <CursorOverlay
            cursors={getCursorPositions}
            currentUserId={currentUser?.id}
          />

          {movingSection && sectionGhostPosition && <SectionDropGhost section={movingSection} position={sectionGhostPosition} />}

          {(session.sections || []).map(section => (
            <BoardSection
              key={section.id}
              section={section}
              isActions={notesManager.isActionsSection(section)}
              allNotes={session.notes}
              visibleNotes={session.notes.filter(
                note => note.sectionId === section.id && notesManager.canSeeNote(note) !== 'hidden'
              )}
              topVotedRefs={notesManager.isActionsSection(section) ? topVotedNotes : []}
              sessionPhase={session.phase}
              getRemainingVotes={notesManager.getRemainingVotes}
              hasVotedForNote={notesManager.hasVotedForNote}
              canSeeNote={notesManager.canSeeNote}
              canEditNote={notesManager.canEditNote}
              onCreateDraft={notesManager.handleCreateDraft}
              onUpdateDraft={notesManager.handleUpdateDraft}
              onFinalizeDraft={notesManager.handleFinalizeDraft}
              onUpdateNote={notesManager.handleUpdateNote}
              onDeleteNote={notesManager.handleDeleteNote}
              onVote={notesManager.handleVote}
              onCreateAction={notesManager.handleCreateAction}
              onResizeSection={handleResizeSection}
              onSectionDragStart={handleSectionDragStart}
              onSectionDragEnd={handleSectionDragEnd}
              isMoving={movingSectionId === section.id}
              onDragStart={handleNoteDragStart}
              onDragMove={handleNoteDragMove}
              onDragEnd={handleDragEndAndDrop}
              zoom={zoom}
              justDragged={justDragged}
              sectionRef={el => sectionRefs.current.set(section.id, el)}
              onNoteElementChange={handleNoteElementChange}
              onOpenSource={handleOpenSource}
              focusedNoteId={focusedNoteId}
              highlightedUser={highlightedUser}
            />
          ))}
        </BoardCanvas>

        {draggingNote && (
          <div
            className="fixed pointer-events-none"
            style={{
              left: `${draggingNote.x}px`,
              top: `${draggingNote.y}px`,
              zIndex: 99999,
              transform: `scale(${zoom})`,
              transformOrigin: 'top left',
            }}
          >
            <StickyNote
              note={draggingNote.note}
              canEdit={notesManager.canEditNote(draggingNote.note)}
              canSee={true}
              canVote={
                !draggingNoteIsActions &&
                (notesManager.getRemainingVotes() > 0 || notesManager.hasVotedForNote(draggingNote.note))
              }
              hasVoted={notesManager.hasVotedForNote(draggingNote.note)}
              currentPhase={session.phase}
              onUpdate={() => {}}
              onDelete={() => {}}
              onVote={() => {}}
              onCreateAction={() => {}}
              onOpenSource={() => {}}
              showCreateAction={!draggingNoteIsActions && session.phase === 'discussion'}
              sourceNote={draggingNoteSource}
              isDragPreview
            />
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

function SectionDropGhost({ section, position }: { section: { width: number; height: number }; position: { x: number; y: number } }) {
  return (
    <div
      aria-hidden
      className="absolute flex items-center justify-center rounded-lg border-2 border-dashed border-blue-500 bg-blue-100/70 text-center text-sm font-semibold text-blue-700 pointer-events-none"
      style={{ width: `${section.width}px`, height: `${section.height}px`, left: `${position.x}px`, top: `${position.y}px` }}
    >
      <span>Snap to grid</span>
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
