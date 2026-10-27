'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Session } from '@/types'
import ParticipantList from '@/components/organisms/ParticipantList'
import PhaseControls from '@/components/organisms/PhaseControls'
import Timer from '@/components/organisms/Timer'
import ZoomControls from '@/components/molecules/ZoomControls'

interface SidebarProps {
  session: Session
  currentUser: string
  currentUserId?: string
  collapsed: boolean
  onClose?: () => void
  zoom: number
  onPhaseChange: (phase: Session['phase'], options?: { votesPerPerson?: number; resetVotes?: boolean }) => void
  onStartTimer: (duration: number) => void
  onPauseTimer: () => void
  onResetTimer: () => void
  onTimerFinish?: () => void
  timerExpired?: boolean
  onVotingDone?: (isDone: boolean) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  onZoomFit: () => void
  highlightedUser?: string | null
  setHighlightedUser?: (userId: string | null) => void
  followedUser?: string | null
  setFollowedUser?: (userId: string | null) => void
}

export default function Sidebar({
  session,
  currentUser,
  currentUserId,
  collapsed,
  onClose,
  zoom,
  onPhaseChange,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerFinish,
  timerExpired,
  onVotingDone,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onZoomFit,
  highlightedUser,
  setHighlightedUser,
  followedUser,
  setFollowedUser,
}: SidebarProps) {
  const [iframeExpanded, setIframeExpanded] = useState(false)
  const panelRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (collapsed || !window.matchMedia('(max-width: 767px)').matches) return
    const previousFocus = document.activeElement as HTMLElement | null
    panelRef.current?.querySelector<HTMLButtonElement>('button')?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      previousFocus?.focus()
    }
  }, [collapsed, onClose])

  return (
    <>
      {/* Backdrop when iframe is expanded */}
      {iframeExpanded && <div className="fixed inset-0 z-9998 bg-black/50" onClick={() => setIframeExpanded(false)} />}

      <aside
        ref={panelRef}
        id="board-controls"
        aria-label="Board controls"
        aria-hidden={collapsed}
        inert={collapsed}
        style={{ zIndex: 100002 }}
        className={`absolute inset-y-0 left-0 md:static bg-white shadow-lg transition-all duration-300 overflow-y-auto overscroll-contain shrink-0 flex flex-col ${
          collapsed ? 'w-0 p-0 overflow-hidden invisible' : 'w-72 max-w-full'
        }`}
      >
        <div className="flex-1 p-3 space-y-3">
          <button type="button" onClick={onClose} className="md:hidden w-full rounded bg-gray-200 px-3 py-2 font-semibold text-gray-800">Close controls</button>
          <ParticipantList
            participants={session.participants}
            currentUser={currentUser}
            currentUserId={currentUserId}
            highlightedUser={highlightedUser}
            setHighlightedUser={setHighlightedUser}
            followedUser={followedUser}
            setFollowedUser={setFollowedUser}
          />

          {session.phase === 'voting' && session.votingStatus && onVotingDone && (
            <button
              type="button"
              onClick={() => onVotingDone(!session.votingStatus?.currentUserDone)}
              className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                session.votingStatus.currentUserDone
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
              }`}
            >
              {session.votingStatus.currentUserDone ? '✓ Voting complete' : 'I’m done voting'}
            </button>
          )}

          <PhaseControls
            currentPhase={session.phase}
            onPhaseChange={onPhaseChange}
            votesPerPerson={session.votesPerPerson}
          />

          <Timer
            duration={session.timerDuration}
            startedAt={session.timerStartedAt}
            isPaused={session.timerPaused}
            remainingTime={session.timerRemainingTime}
            onStart={onStartTimer}
            onPause={onPauseTimer}
            onReset={onResetTimer}
            onFinish={onTimerFinish}
            alertActive={timerExpired}
          />

          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-semibold mb-1">💡 Tips:</p>
            <ul className="space-y-1">
              <li>• Click anywhere in a section to add a note</li>
              <li>• Drag notes between sections</li>
              <li>• Use → Action button to create action items</li>
              <li>• Ctrl/Cmd + run scroll to zoom</li>
            </ul>
          </div>

          <div className="hidden md:block">
            <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onZoomReset} onFit={onZoomFit} />
          </div>

          {/* Single iframe that switches between inline and fullscreen */}
          <div
            className={
              iframeExpanded
                ? 'fixed inset-4 z-9999 bg-white rounded-xl shadow-2xl flex flex-col'
                : 'relative rounded-lg overflow-hidden border border-gray-200'
            }
          >
            <div
              className={
                iframeExpanded ? 'flex items-center justify-between px-3 py-1.5 bg-gray-100 border-b' : 'hidden'
              }
            >
              <span className="text-sm font-semibold text-gray-700">🎮 p3bbl3</span>
              <button
                onClick={() => setIframeExpanded(false)}
                className="p-1.5 rounded-md hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
                title="Collapse"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
