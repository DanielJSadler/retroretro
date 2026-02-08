'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StickyNote from '@/components/organisms/StickyNote';
import Header from '@/components/organisms/Header';
import Sidebar from '@/components/organisms/Sidebar';
import { Session, Note, Phase, NoteColor, Section } from '@/types';

const VISITED_BOARDS_KEY = 'visitedBoards';

const sectionColorClasses: Record<NoteColor, string> = {
  yellow: 'bg-yellow-100 border-yellow-300',
  blue: 'bg-blue-100 border-blue-300',
  green: 'bg-green-100 border-green-300',
  red: 'bg-red-100 border-red-300',
  pink: 'bg-pink-100 border-pink-300',
};

export default function BoardPage() {
  const router = useRouter();
  const params = useParams();
  const boardId = params.boardId as string;

  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [creatingInSection, setCreatingInSection] = useState<string | null>(
    null,
  );
  const [newNoteContent, setNewNoteContent] = useState('');
  const [zoom, setZoom] = useState(1);
  const [justDragged, setJustDragged] = useState(false);
  const [draggingNote, setDraggingNote] = useState<{
    note: Note;
    x: number;
    y: number;
  } | null>(null);
  const draggingNoteRef = useRef<Note | null>(null);
  const boardRef = useRef<HTMLDivElement>(null);

  // Refs for each section container
  const sectionRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const syncSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/session/${boardId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      } else if (response.status === 404) {
        setNotFound(true);
      }
    } catch (error) {
      console.error('Failed to sync session:', error);
    }
  }, [boardId]);

  useEffect(() => {
    const userName = localStorage.getItem('userName');
    if (!userName) {
      router.push('/');
      return;
    }
    setCurrentUser(userName);

    const joinSession = async () => {
      try {
        const response = await fetch(`/api/session/${boardId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName }),
        });

        if (response.ok) {
          const data = await response.json();
          setSession(data);

          // Save this board to visited boards
          const visitedIds = JSON.parse(
            localStorage.getItem(VISITED_BOARDS_KEY) || '[]',
          ) as string[];
          if (!visitedIds.includes(boardId)) {
            visitedIds.unshift(boardId);
            localStorage.setItem(
              VISITED_BOARDS_KEY,
              JSON.stringify(visitedIds.slice(0, 50)),
            );
          }
        } else if (response.status === 404) {
          setNotFound(true);
        }
      } catch (error) {
        console.error('Failed to join session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    joinSession();

    // Poll for updates
    const interval = setInterval(syncSession, 2000);

    return () => clearInterval(interval);
  }, [router, boardId, syncSession]);

  // Handle wheel zoom with passive: false to prevent browser zoom
  useEffect(() => {
    const mainEl = document.getElementById('board-main');
    if (!mainEl) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom((z) =>
          Math.max(0.25, Math.min(2, z + (e.deltaY > 0 ? -0.05 : 0.05))),
        );
      }
    };

    mainEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => mainEl.removeEventListener('wheel', handleWheel);
  }, [session]); // Re-run when session loads to ensure element exists

  const handleAddNote = async (
    content: string,
    color: NoteColor,
    sectionId: string,
    position?: { x: number; y: number },
  ) => {
    if (!currentUser || !session) return;

    // Use provided position or calculate one (percentages for consistent sizing)
    const finalPosition = position || {
      x: 5 + Math.random() * 30, // 5-35% from left
      y: 5 + Math.random() * 30, // 5-35% from top
    };

    try {
      await fetch(`/api/session/${boardId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          color,
          position: finalPosition,
          sectionId,
          createdBy: currentUser,
        }),
      });
      await syncSession();
    } catch (error) {
      console.error('Failed to add note:', error);
    }
  };

  // Handle click to create note in a section
  const handleSectionClick = (
    e: React.MouseEvent<HTMLDivElement>,
    section: Section,
  ) => {
    // Don't create if we just finished dragging
    if (justDragged) return;
    // Only create if clicking on the section background, not on a note
    if ((e.target as HTMLElement).closest('.sticky-note')) return;

    const rect = e.currentTarget.getBoundingClientRect();
    // Calculate position as percentage of section size
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;

    setCreatingInSection(section.id);
    setNewNoteContent('');

    // Store click position for when note is created (as percentages)
    (
      window as unknown as { _newNotePosition: { x: number; y: number } }
    )._newNotePosition = {
      x: Math.max(2, Math.min(85, xPercent)),
      y: Math.max(2, Math.min(85, yPercent)),
    };
  };

  const handleCreateNote = async (section: Section) => {
    if (!newNoteContent.trim()) {
      setCreatingInSection(null);
      return;
    }

    const position = (
      window as unknown as { _newNotePosition?: { x: number; y: number } }
    )._newNotePosition || { x: 50, y: 50 };
    await handleAddNote(newNoteContent, section.color, section.id, position);
    setCreatingInSection(null);
    setNewNoteContent('');
  };

  // Handle drag start - show note in portal
  const handleNoteDragStart = (note: Note, x: number, y: number) => {
    draggingNoteRef.current = note;
    setDraggingNote({ note, x, y });
  };

  // Handle drag move - update portal position
  const handleNoteDragMove = (x: number, y: number) => {
    if (draggingNoteRef.current) {
      setDraggingNote({ note: draggingNoteRef.current, x, y });
    }
  };

  // Handle dragging note - repositioning within section or moving between sections
  const handleNoteDragEnd = (
    noteId: string,
    clientX: number,
    clientY: number,
  ) => {
    if (!session) return;

    // Set flag to prevent click handler from creating a new note
    setJustDragged(true);
    setDraggingNote(null);
    draggingNoteRef.current = null;
    setTimeout(() => setJustDragged(false), 100);

    // Find which section the note was dropped in
    // Use the center of the note for hit detection
    const noteCenterX = clientX + 80; // Half note width (160/2)
    const noteCenterY = clientY + 60; // Approximate half note height

    for (const [sectionId, ref] of sectionRefs.current.entries()) {
      if (ref) {
        const rect = ref.getBoundingClientRect();
        if (
          noteCenterX >= rect.left &&
          noteCenterX <= rect.right &&
          noteCenterY >= rect.top &&
          noteCenterY <= rect.bottom
        ) {
          // Calculate position as percentage of section size
          // clientX/Y represent the note's top-left corner position
          const xPercent = Math.max(
            2,
            Math.min(85, ((clientX - rect.left) / rect.width) * 100),
          );
          const yPercent = Math.max(
            2,
            Math.min(85, ((clientY - rect.top) / rect.height) * 100),
          );

          const note = session.notes.find((n) => n.id === noteId);
          const targetSection = session.sections.find(
            (s) => s.id === sectionId,
          );
          if (note) {
            // Update position (and section/color if changed)
            const updates: Partial<Note> = {
              position: { x: xPercent, y: yPercent },
            };
            if (note.sectionId !== sectionId) {
              updates.sectionId = sectionId;
              // Change note color to match the new section
              if (targetSection) {
                updates.color = targetSection.color;
              }
            }
            handleUpdateNote(noteId, updates);
          }
          break;
        }
      }
    }
  };

  // Create an action from a note
  const handleCreateAction = async (sourceNote: Note) => {
    if (!session) return;

    // Find the actions section
    const actionsSection = session.sections.find((s) => isActionsSection(s));
    if (!actionsSection) {
      alert(
        'No actions section found! Add a section with "Action" in the name.',
      );
      return;
    }

    // Create a new note in the actions section
    await handleAddNote(
      `ACTION: ${sourceNote.content}`,
      actionsSection.color,
      actionsSection.id,
    );
  };

  const handleUpdateNote = async (id: string, updates: Partial<Note>) => {
    try {
      await fetch(`/api/session/${boardId}/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      await syncSession();
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await fetch(`/api/session/${boardId}/notes/${id}`, {
        method: 'DELETE',
      });
      await syncSession();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handlePhaseChange = async (
    phase: Phase,
    options?: { votesPerPerson?: number; resetVotes?: boolean },
  ) => {
    try {
      await fetch(`/api/session/${boardId}/phase`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, ...options }),
      });
      await syncSession();
    } catch (error) {
      console.error('Failed to change phase:', error);
    }
  };

  const handleStartTimer = async (duration: number) => {
    try {
      await fetch(`/api/session/${boardId}/timer/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration }),
      });
      await syncSession();
    } catch (error) {
      console.error('Failed to start timer:', error);
    }
  };

  const handlePauseTimer = async () => {
    try {
      await fetch(`/api/session/${boardId}/timer/pause`, {
        method: 'POST',
      });
      await syncSession();
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  };

  const handleResetTimer = async () => {
    try {
      await fetch(`/api/session/${boardId}/timer/reset`, {
        method: 'POST',
      });
      await syncSession();
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  };

  const handleLeave = () => {
    localStorage.removeItem('userName');
    router.push('/');
  };

  const canSeeNote = (note: Note): 'full' | 'ghost' | 'hidden' => {
    if (!session) return 'hidden';
    if (session.phase === 'writing') {
      // Show own notes fully, show others as ghosts
      return note.createdBy === currentUser ? 'full' : 'ghost';
    }
    return 'full';
  };

  const canEditNote = (note: Note) => {
    return note.createdBy === currentUser;
  };

  const handleVote = async (noteId: string) => {
    try {
      await fetch(`/api/session/${boardId}/notes/${noteId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: currentUser }),
      });
      await syncSession();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const getRemainingVotes = () => {
    if (!session) return 0;
    const usedVotes = session.notes.reduce(
      (count, note) => count + (note.votes?.includes(currentUser) ? 1 : 0),
      0,
    );
    return session.votesPerPerson - usedVotes;
  };

  const hasVotedForNote = (note: Note) => {
    return note.votes?.includes(currentUser) || false;
  };

  // Check if a section is the "actions" section (case insensitive check for common names)
  const isActionsSection = (section: Section): boolean => {
    const name = section.name.toLowerCase();
    return (
      name.includes('action') ||
      name.includes('todo') ||
      name.includes('next step')
    );
  };

  // Get top-voted notes for reference in actions section (excluding notes already in actions)
  const getTopVotedNotes = (): (Note & { rank: number })[] => {
    if (!session || session.phase !== 'discussion') return [];

    const actionsSection = session.sections.find((s) => isActionsSection(s));
    if (!actionsSection) return [];

    // Get notes not in actions section, with votes
    const votableNotes = session.notes.filter(
      (n) => n.sectionId !== actionsSection.id && (n.votes?.length || 0) > 0,
    );

    // Sort by vote count descending
    const sorted = [...votableNotes].sort(
      (a, b) => (b.votes?.length || 0) - (a.votes?.length || 0),
    );

    // Take top 5 and add rank
    return sorted.slice(0, 5).map((note, index) => ({
      ...note,
      rank: index + 1,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🔄</div>
          <div className="text-xl font-semibold text-black">
            Loading board...
          </div>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold text-black mb-2">
            Board Not Found
          </h1>
          <p className="text-gray-600 mb-4">
            This board doesn&apos;t exist or may have been deleted.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <div className="text-xl font-semibold text-black mb-4">
            Failed to load board
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const copyBoardLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Board link copied to clipboard!');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100 text-black overflow-hidden">
      <Header
        session={session}
        currentUser={currentUser}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCopyLink={copyBoardLink}
        onLeave={handleLeave}
        getRemainingVotes={getRemainingVotes}
      />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          session={session}
          currentUser={currentUser}
          collapsed={sidebarCollapsed}
          zoom={zoom}
          onPhaseChange={handlePhaseChange}
          onStartTimer={handleStartTimer}
          onPauseTimer={handlePauseTimer}
          onResetTimer={handleResetTimer}
          onZoomIn={() => setZoom((z) => Math.min(2, z + 0.1))}
          onZoomOut={() => setZoom((z) => Math.max(0.25, z - 0.1))}
          onZoomReset={() => setZoom(1)}
        />

        {/* Main Board - Sections fill available space */}
        <main id="board-main" className="flex-1 p-3 overflow-auto">
          <div
            ref={boardRef}
            className="flex gap-3 origin-top-left transition-transform duration-100"
            style={{
              transform: `scale(${zoom})`,
            }}
          >
            {(session.sections || []).map((section) => {
              const isActions = isActionsSection(section);
              const sectionNotes = session.notes.filter(
                (note) => note.sectionId === section.id,
              );
              const visibleNotes = sectionNotes.filter(
                (note) => canSeeNote(note) !== 'hidden',
              );
              const topVotedRefs = isActions ? getTopVotedNotes() : [];

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
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      ({visibleNotes.length})
                    </span>
                  </h3>

                  {/* Section canvas - click to create, drag notes within */}
                  <div
                    ref={(el) => {
                      sectionRefs.current.set(section.id, el);
                    }}
                    className="section-canvas flex-1 relative overflow-hidden cursor-crosshair"
                    onClick={(e) => handleSectionClick(e, section)}
                  >
                    {/* Top voted reference notes for actions section */}
                    {isActions && topVotedRefs.length > 0 && (
                      <div className="absolute left-2 top-2 space-y-2 z-10 pointer-events-auto">
                        <div className="text-xs font-semibold text-purple-700 mb-1">
                          🏆 Top Voted Items:
                        </div>
                        {topVotedRefs.map((refNote) => (
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

                    {/* Notes in this section */}
                    {visibleNotes.map((note) => {
                      const visibility = canSeeNote(note);
                      const isGhost = visibility === 'ghost';

                      return (
                        <div key={note.id} className="sticky-note">
                          {isGhost ? (
                            // Ghost note - show presence but not content
                            <div
                              className="w-40 p-3 rounded-lg shadow-md bg-gray-200 border-2 border-dashed border-gray-400 opacity-50"
                              style={{
                                position: 'absolute',
                                left: `${note.position.x}%`,
                                top: `${note.position.y}%`,
                              }}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-semibold text-gray-500 truncate">
                                  {note.createdBy}
                                </span>
                              </div>
                              <div className="text-xs text-gray-400 italic">
                                ✍️ Writing...
                              </div>
                            </div>
                          ) : (
                            <StickyNote
                              note={note}
                              canEdit={canEditNote(note)}
                              canSee={true}
                              canVote={
                                !isActions &&
                                (getRemainingVotes() > 0 ||
                                  hasVotedForNote(note))
                              }
                              hasVoted={hasVotedForNote(note)}
                              currentPhase={session.phase}
                              onUpdate={handleUpdateNote}
                              onDelete={handleDeleteNote}
                              onVote={handleVote}
                              onDragEnd={handleNoteDragEnd}
                              onDragStart={handleNoteDragStart}
                              onDragMove={handleNoteDragMove}
                              onCreateAction={handleCreateAction}
                              showCreateAction={
                                !isActions && session.phase === 'discussion'
                              }
                              zoom={zoom}
                            />
                          )}
                        </div>
                      );
                    })}

                    {/* Inline note creator */}
                    {creatingInSection === section.id && (
                      <div
                        className="absolute bg-white rounded-lg shadow-xl p-3 z-50 w-48"
                        style={{
                          left: `${(window as unknown as { _newNotePosition?: { x: number; y: number } })._newNotePosition?.x || 20}%`,
                          top: `${(window as unknown as { _newNotePosition?: { x: number; y: number } })._newNotePosition?.y || 20}%`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder="Type your note..."
                          className="w-full p-2 text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                          rows={3}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleCreateNote(section);
                            }
                            if (e.key === 'Escape') {
                              setCreatingInSection(null);
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
              );
            })}
          </div>
        </main>

        {/* Dragging note portal - rendered outside zoom container */}
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
              <div className="text-xs font-semibold text-gray-700 mb-1">
                {draggingNote.note.createdBy}
              </div>
              <div className="text-xs text-gray-800">
                {draggingNote.note.content}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
