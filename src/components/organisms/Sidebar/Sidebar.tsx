'use client'

import React, { useState } from 'react'
import { Session } from '@/types'
import ParticipantList from '@/components/organisms/ParticipantList'
import PhaseControls from '@/components/organisms/PhaseControls'
import Timer from '@/components/organisms/Timer'
import ZoomControls from '@/components/molecules/ZoomControls'
import MusicPlayer from '@/components/organisms/MusicPlayer'

interface SidebarProps {
  session: Session
  currentUser: string
  collapsed: boolean
  zoom: number
  onPhaseChange: (phase: Session['phase'], options?: { votesPerPerson?: number; resetVotes?: boolean }) => void
  onStartTimer: (duration: number) => void
  onPauseTimer: () => void
  onResetTimer: () => void
  onTimerFinish?: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  // Music Props
  musicCurrentSong?: string
  musicStatus?: 'playing' | 'paused'
  musicStartedAt?: number
  musicSeekTime?: number
  highlightedUser?: string | null
  setHighlightedUser?: (userId: string | null) => void
  followedUser?: string | null
  setFollowedUser?: (userId: string | null) => void
}

export default function Sidebar({
  session,
  currentUser,
  collapsed,
  zoom,
  onPhaseChange,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onTimerFinish,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  musicCurrentSong,
  musicStatus,
  musicStartedAt,
  musicSeekTime,
  highlightedUser,
  setHighlightedUser,
  followedUser,
  setFollowedUser,
}: SidebarProps) {
  const [iframeExpanded, setIframeExpanded] = useState(false)

  return (
    <>
      {/* Backdrop when iframe is expanded */}
      {iframeExpanded && <div className="fixed inset-0 z-9998 bg-black/50" onClick={() => setIframeExpanded(false)} />}

      <aside
        className={`bg-white shadow-lg transition-all duration-300 overflow-y-auto shrink-0 flex flex-col ${
          collapsed ? 'w-0 p-0 overflow-hidden' : 'w-72'
        }`}
      >
        <div className="flex-1 p-3 space-y-3">
          <ParticipantList
            participants={session.participants}
            currentUser={currentUser}
            highlightedUser={highlightedUser}
            setHighlightedUser={setHighlightedUser}
            followedUser={followedUser}
            setFollowedUser={setFollowedUser}
          />

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

          <ZoomControls zoom={zoom} onZoomIn={onZoomIn} onZoomOut={onZoomOut} onReset={onZoomReset} />

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

            {!iframeExpanded && (
              <button
                onClick={() => setIframeExpanded(true)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 hover:bg-white rounded-md shadow-sm border border-gray-200 text-gray-500 hover:text-gray-800 transition-colors"
                title="Expand"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </svg>
              </button>
            )}

            <iframe
              src="https://demo.p3bbl3.com/"
              className={iframeExpanded ? 'flex-1 w-full h-full border-0 rounded-b-xl' : 'w-full h-[500px] border-0'}
            />
          </div>
        </div>

        {/* Music Player at bottom */}
        {/* <MusicPlayer
        boardId={session.id}
        currentSong={musicCurrentSong}
        status={musicStatus}
        startedAt={musicStartedAt}
        seekTime={musicSeekTime}
      /> */}
      </aside>
    </>
  )
}
