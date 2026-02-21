'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation } from 'convex/react'
import { useConvexAuth } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { Id } from '../../../../convex/_generated/dataModel'
import StickyNote from '@/components/organisms/StickyNote'
import Header from '@/components/organisms/Header'
import Sidebar from '@/components/organisms/Sidebar'
import ConfettiLayer from '@/components/organisms/ConfettiLayer'
import ConfettiMenu from '@/components/molecules/ConfettiMenu'
import { Note, Phase, NoteColor, Section, Session } from '@/types'

const sectionColorClasses: Record<NoteColor, string> = {
  yellow: 'bg-yellow-100 border-yellow-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  red: 'bg-red-100 border-red-300',
  pink: 'bg-pink-100 border-pink-300',
}

const CURSOR_COLORS = [
  { border: 'border-l-red-500', bg: 'bg-red-500' },
  { border: 'border-l-orange-500', bg: 'bg-orange-500' },
  { border: 'border-l-amber-500', bg: 'bg-amber-500' },
  { border: 'border-l-lime-500', bg: 'bg-lime-500' },
  { border: 'border-l-green-500', bg: 'bg-green-500' },
  { border: 'border-l-emerald-500', bg: 'bg-emerald-500' },
  { border: 'border-l-teal-500', bg: 'bg-teal-500' },
  { border: 'border-l-cyan-500', bg: 'bg-cyan-500' },
  { border: 'border-l-sky-500', bg: 'bg-sky-500' },
  { border: 'border-l-blue-500', bg: 'bg-blue-500' },
  { border: 'border-l-indigo-500', bg: 'bg-indigo-500' },
  { border: 'border-l-violet-500', bg: 'bg-violet-500' },
  { border: 'border-l-purple-500', bg: 'bg-purple-500' },
  { border: 'border-l-fuchsia-500', bg: 'bg-fuchsia-500' },
  { border: 'border-l-pink-500', bg: 'bg-pink-500' },
  { border: 'border-l-rose-500', bg: 'bg-rose-500' },
]

function getCursorColor(id: string) {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return CURSOR_COLORS[Math.abs(hash) % CURSOR_COLORS.length]
}

export default function BoardPage() {
  const router = useRouter()
  const params = useParams()
  const boardId = params.boardId as string

  const { isAuthenticated, isLoading: authLoading } = useConvexAuth()

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [creatingInSection, setCreatingInSection] = useState<string | null>(null)
  const [newNoteContent, setNewNoteContent] = useState('')
  const [zoom, setZoom] = useState(1)
  const [justDragged, setJustDragged] = useState(false)
  const [draggingNote, setDraggingNote] = useState<{
    note: Note
    x: number
    y: number
  } | null>(null)
  const draggingNoteRef = useRef<Note | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const sectionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map())

  // Confetti State
  const [isConfettiMode, setIsConfettiMode] = useState(false)
  const [confettiType, setConfettiType] = useState<'basic' | 'stars' | 'fireworks' | 'random'>('basic')

  // Convex queries and mutations
  const board = useQuery(api.boards.get, boardId ? { boardId: boardId as Id<'boards'> } : 'skip')

  const currentUser = useQuery(api.users.current)

  const joinBoard = useMutation(api.participants.join)
  const heartbeat = useMutation(api.participants.heartbeat)
  const createNote = useMutation(api.notes.create)
  const updateNote = useMutation(api.notes.update)
  const moveNote = useMutation(api.notes.move)
  const deleteNote = useMutation(api.notes.remove)
  const voteNote = useMutation(api.notes.vote)
  const updatePhase = useMutation(api.boards.updatePhase)
  const startTimer = useMutation(api.timer.start)
  const pauseTimer = useMutation(api.timer.pause)
  const resetTimer = useMutation(api.timer.reset)
  const pauseMusic = useMutation(api.music.pause)
  const leaveBoard = useMutation(api.participants.leave)
  const updateCursor = useMutation(api.participants.updateCursor)
  const getCursorPositions = useQuery(
    api.participants.getCursorPositions,
    boardId ? { boardId: boardId as Id<'boards'> } : 'skip'
  )

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, authLoading, router])

  // Join the board when component mounts
  useEffect(() => {
    if (isAuthenticated && boardId) {
      joinBoard({ boardId: boardId as Id<'boards'> })
    }

    return () => {
      if (isAuthenticated && boardId) {
        leaveBoard({ boardId: boardId as Id<'boards'> })
      }
    }
  }, [isAuthenticated, boardId, joinBoard, leaveBoard])

  // Heartbeat to keep participant active
  useEffect(() => {
    if (!isAuthenticated || !boardId) return

    const interval = setInterval(() => {
      heartbeat({ boardId: boardId as Id<'boards'> })
    }, 10000)

    return () => clearInterval(interval)
  }, [isAuthenticated, boardId, heartbeat])

  // Handle wheel zoom
  useEffect(() => {
    const mainEl = document.getElementById('board-main')
    if (!mainEl) return

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoom(z => Math.max(0.25, Math.min(2, z + (e.deltaY > 0 ? -0.05 : 0.05))))
      }
    }

    mainEl.addEventListener('wheel', handleWheel, { passive: false })
    return () => mainEl.removeEventListener('wheel', handleWheel)
  }, [board])

  // Convert board data to session format for compatibility
  const session: Session | null = board
    ? {
        id: board._id,
        name: board.name,
        createdAt: board._creationTime,
        createdBy: board.creatorName,
        phase: board.phase,
        notes: board.notes.map(
          (n: {
            id: Id<'notes'>
            content: string
            color: NoteColor
            createdBy: string
            position: { x: number; y: number }
            sectionId: Id<'sections'>
            createdAt: number
            votes: Id<'users'>[]
          }) => ({
            ...n,
            id: n.id as string,
            sectionId: n.sectionId as string,
            votes: n.votes.map(v => v as string),
          })
        ),
        participants: board.participants,
        sections: board.sections.map((s: { id: Id<'sections'>; name: string; color: NoteColor }) => ({
          ...s,
          id: s.id as string,
        })),
        timerDuration: board.timerDuration,
        timerStartedAt: board.timerStartedAt,
        timerPaused: board.timerPaused,
        timerRemainingTime: board.timerRemainingTime,
        votesPerPerson: board.votesPerPerson,
      }
    : null

  const currentUserName = currentUser?.name ?? ''

  const handleAddNote = async (
    content: string,
    color: NoteColor,
    sectionId: string,
    position?: { x: number; y: number }
  ) => {
    if (!currentUser || !board) return

    const finalPosition = position || {
      x: 5 + Math.random() * 30,
      y: 5 + Math.random() * 30,
    }

    try {
      await createNote({
        boardId: boardId as Id<'boards'>,
        sectionId: sectionId as Id<'sections'>,
        content,
        color,
        positionX: finalPosition.x,
        positionY: finalPosition.y,
      })
    } catch (error) {
      console.error('Failed to add note:', error)
    }
  }

  const handleSectionClick = (e: React.MouseEvent<HTMLDivElement>, section: Section) => {
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

  const handleCreateNote = async (section: Section) => {
    if (!newNoteContent.trim()) {
      setCreatingInSection(null)
      return
    }

    const position = (window as unknown as { _newNotePosition?: { x: number; y: number } })._newNotePosition || {
      x: 50,
      y: 50,
    }
    await handleAddNote(newNoteContent, section.color, section.id, position)
    setCreatingInSection(null)
    setNewNoteContent('')
  }

  const handleNoteDragStart = (note: Note, x: number, y: number) => {
    draggingNoteRef.current = note
    setDraggingNote({ note, x, y })
  }

  const handleNoteDragMove = (x: number, y: number) => {
    if (draggingNoteRef.current) {
      setDraggingNote({ note: draggingNoteRef.current, x, y })
    }
  }

  const handleNoteDragEnd = async (noteId: string, clientX: number, clientY: number) => {
    if (!session) return

    setJustDragged(true)
    setDraggingNote(null)
    draggingNoteRef.current = null
    setTimeout(() => setJustDragged(false), 100)

    const noteCenterX = clientX + 80
    const noteCenterY = clientY + 60

    for (const [sectionId, ref] of sectionRefs.current.entries()) {
      if (ref) {
        const rect = ref.getBoundingClientRect()
        if (
          noteCenterX >= rect.left &&
          noteCenterX <= rect.right &&
          noteCenterY >= rect.top &&
          noteCenterY <= rect.bottom
        ) {
          const xPercent = Math.max(2, Math.min(85, ((clientX - rect.left) / rect.width) * 100))
          const yPercent = Math.max(2, Math.min(85, ((clientY - rect.top) / rect.height) * 100))

          const note = session.notes.find(n => n.id === noteId)
          const targetSection = session.sections.find(s => s.id === sectionId)

          if (note) {
            // Use moveNote for position changes (any user can move any note)
            const moveData: {
              noteId: Id<'notes'>
              positionX: number
              positionY: number
              sectionId?: Id<'sections'>
            } = {
              noteId: noteId as Id<'notes'>,
              positionX: xPercent,
              positionY: yPercent,
            }

            if (note.sectionId !== sectionId) {
              moveData.sectionId = sectionId as Id<'sections'>
            }

            try {
              await moveNote(moveData)

              // If moved to a different section, also update the color (owner only)
              if (note.sectionId !== sectionId && targetSection && canEditNote(note)) {
                await updateNote({
                  noteId: noteId as Id<'notes'>,
                  color: targetSection.color,
                })
              }
            } catch (error) {
              console.error('Failed to move note:', error)
            }
          }
          break
        }
      }
    }
  }

  const handleCreateAction = async (sourceNote: Note) => {
    if (!session) return

    const actionsSection = session.sections.find(s => isActionsSection(s))
    if (!actionsSection) {
      alert('No actions section found! Add a section with "Action" in the name.')
      return
    }

    await handleAddNote(`ACTION: ${sourceNote.content}`, actionsSection.color, actionsSection.id)
  }

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      const updateData: {
        noteId: Id<'notes'>
        content?: string
        positionX?: number
        positionY?: number
        sectionId?: Id<'sections'>
        color?: NoteColor
      } = { noteId: id as Id<'notes'> }

      if (updates.content !== undefined) updateData.content = updates.content
      if (updates.position) {
        updateData.positionX = updates.position.x
        updateData.positionY = updates.position.y
      }
      if (updates.sectionId) updateData.sectionId = updates.sectionId as Id<'sections'>
      if (updates.color) updateData.color = updates.color

      await updateNote(updateData)
    } catch (error) {
      console.error('Failed to update note:', error)
    }
  }

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote({ noteId: id as Id<'notes'> })
    } catch (error) {
      console.error('Failed to delete note:', error)
    }
  }

  const handlePhaseChange = async (phase: Phase, options?: { votesPerPerson?: number; resetVotes?: boolean }) => {
    try {
      await updatePhase({
        boardId: boardId as Id<'boards'>,
        phase,
        ...options,
      })
    } catch (error) {
      console.error('Failed to change phase:', error)
    }
  }

  const handleStartTimer = async (duration: number) => {
    try {
      await startTimer({
        boardId: boardId as Id<'boards'>,
        duration,
      })
    } catch (error) {
      console.error('Failed to start timer:', error)
    }
  }

  const handlePauseTimer = async () => {
    try {
      await pauseTimer({ boardId: boardId as Id<'boards'> })
    } catch (error) {
      console.error('Failed to pause timer:', error)
    }
  }

  const handleResetTimer = async () => {
    try {
      await resetTimer({ boardId: boardId as Id<'boards'> })
    } catch (error) {
      console.error('Failed to reset timer:', error)
    }
  }

  const handleLeave = () => {
    router.push('/')
  }

  const canSeeNote = (note: Note): 'full' | 'ghost' | 'hidden' => {
    if (!session) return 'hidden'
    if (session.phase === 'writing') {
      return note.createdBy === currentUserName ? 'full' : 'ghost'
    }
    return 'full'
  }

  const canEditNote = (note: Note) => {
    return note.createdBy === currentUserName
  }

  const handleVote = async (noteId: string) => {
    try {
      await voteNote({
        noteId: noteId as Id<'notes'>,
        boardId: boardId as Id<'boards'>,
      })
    } catch (error) {
      console.error('Failed to vote:', error)
    }
  }

  const getRemainingVotes = () => {
    if (!session || !currentUser) return 0
    const usedVotes = session.notes.reduce((count, note) => count + (note.votes?.includes(currentUser.id) ? 1 : 0), 0)
    return session.votesPerPerson - usedVotes
  }

  const hasVotedForNote = (note: Note) => {
    if (!currentUser) return false
    return note.votes?.includes(currentUser.id) || false
  }

  const isActionsSection = (section: Section): boolean => {
    const name = section.name.toLowerCase()
    return name.includes('action') || name.includes('todo') || name.includes('next step')
  }

  const getTopVotedNotes = (): (Note & { rank: number })[] => {
    if (!session || session.phase !== 'discussion') return []

    const actionsSection = session.sections.find(s => isActionsSection(s))
    if (!actionsSection) return []

    const votableNotes = session.notes.filter(n => n.sectionId !== actionsSection.id && (n.votes?.length || 0) > 0)

    const sorted = [...votableNotes].sort((a, b) => (b.votes?.length || 0) - (a.votes?.length || 0))

    return sorted.slice(0, 5).map((note, index) => ({
      ...note,
      rank: index + 1,
    }))
  }

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
    [moveCursor, zoom]
  )

  console.log(getCursorPositions)

  useEffect(() => {
    const onMove = throttle(handleMouseMove, 200)

    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [handleMouseMove])

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-xl font-semibold text-black">Loading...</div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (board === undefined) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-xl font-semibold text-black">Loading board...</div>
        </div>
      </div>
    )
  }

  if (board === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-black mb-2">Board Not Found</h1>
          <p className="text-gray-600 mb-4">This board doesn&apos;t exist or may have been deleted.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl font-semibold text-black mb-4">Failed to load board</div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  const copyBoardLink = () => {
    navigator.clipboard.writeText(window.location.href)
    alert('Board link copied to clipboard!')
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 text-black overflow-hidden">
      <Header
        session={session}
        currentUser={currentUserName}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCopyLink={copyBoardLink}
        onLeave={handleLeave}
        getRemainingVotes={getRemainingVotes}
      />
      {/* cursor positionings */}

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

        <main id="board-main" className="flex-1 p-3 overflow-auto">
          <div
            ref={boardRef}
            className="flex gap-3 origin-top-left transition-transform duration-100 relative w-max"
            style={{
              transform: `scale(${zoom})`,
            }}
          >
            {getCursorPositions
              ?.filter(
                c =>
                  c.cursorX !== undefined &&
                  c.cursorY !== undefined &&
                  c.userId !== (currentUser as any)?._id &&
                  c.userId !== (currentUser as any)?.id
              )
              .map(cursor => {
                const color = getCursorColor(cursor.userId || cursor.id)
                return (
                  <div
                    key={cursor.id}
                    className="absolute z-50 pointer-events-none transition-all duration-300 ease-linear"
                    style={{ left: cursor.cursorX, top: cursor.cursorY }}
                  >
                    <div
                      className={`-rotate-135 inline-block w-0 h-0 border-solid border-t-[5px] border-r-0 border-l-[10px] border-b-[6px] border-r-transparent border-t-transparent border-b-transparent ${color.border}`}
                    />
                    <p
                      className={`whitespace-nowrap translate-x-3 -translate-y-2 text-xs font-semibold text-white px-1.5 py-0.5 rounded shadow-sm ${color.bg}`}
                    >
                      {cursor.name}
                    </p>
                  </div>
                )
              })}
            {(session.sections || []).map(section => {
              const isActions = isActionsSection(section)
              const sectionNotes = session.notes.filter(note => note.sectionId === section.id)
              const visibleNotes = sectionNotes.filter(note => canSeeNote(note) !== 'hidden')
              const topVotedRefs = isActions ? getTopVotedNotes() : []

              return (
                <div
                  key={section.id}
                  className={`rounded-lg border-2 ${sectionColorClasses[section.color]} flex flex-col shrink-0`}
                  style={{
                    width: '1000px',
                    height: '1000px',
                  }}
                >
                  <h3 className="font-semibold text-gray-800 text-center border-b border-gray-300 py-2 px-2 flex-shrink-0 text-sm">
                    {section.name}
                    <span className="ml-1 text-xs font-normal text-gray-500">({visibleNotes.length})</span>
                  </h3>

                  <div
                    ref={el => {
                      sectionRefs.current.set(section.id, el)
                    }}
                    className="section-canvas flex-1 relative overflow-hidden cursor-crosshair"
                    onClick={e => handleSectionClick(e, section)}
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
                              currentPhase={session.phase}
                              onUpdate={() => {}}
                              onDelete={() => {}}
                              onVote={() => {}}
                              onCreateAction={handleCreateAction}
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
                              currentPhase={session.phase}
                              onUpdate={handleUpdateNote}
                              onDelete={handleDeleteNote}
                              onVote={handleVote}
                              onDragEnd={handleNoteDragEnd}
                              onDragStart={handleNoteDragStart}
                              onDragMove={handleNoteDragMove}
                              onCreateAction={handleCreateAction}
                              showCreateAction={!isActions && session.phase === 'discussion'}
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
                              handleCreateNote(section)
                            }
                            if (e.key === 'Escape') {
                              setCreatingInSection(null)
                            }
                          }}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => handleCreateNote(section)}
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

                    {visibleNotes.length === 0 &&
                      creatingInSection !== section.id &&
                      !(isActions && topVotedRefs.length > 0) && (
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
            })}
          </div>
        </main>

        {draggingNote && (
          <div
            className="fixed pointer-events-none"
            style={{
              left: `${draggingNote.x}px`,
              top: `${draggingNote.y}px`,
              zIndex: 99999,
            }}
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
