'use client';

import React from 'react';
import { Session } from '@/types';
import ParticipantList from '@/components/organisms/ParticipantList';
import PhaseControls from '@/components/organisms/PhaseControls';
import Timer from '@/components/organisms/Timer';
import ZoomControls from '@/components/molecules/ZoomControls';

interface SidebarProps {
  session: Session;
  currentUser: string;
  collapsed: boolean;
  zoom: number;
  onPhaseChange: (
    phase: Session['phase'],
    options?: { votesPerPerson?: number; resetVotes?: boolean },
  ) => void;
  onStartTimer: (duration: number) => void;
  onPauseTimer: () => void;
  onResetTimer: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
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
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: SidebarProps) {
  return (
    <aside
      className={`bg-white shadow-lg transition-all duration-300 overflow-y-auto flex-shrink-0 ${
        collapsed ? 'w-0 p-0 overflow-hidden' : 'w-72 p-3'
      }`}
    >
      <div className="space-y-3">
        <ParticipantList
          participants={session.participants}
          currentUser={currentUser}
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
        />

        <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
          <p className="font-semibold mb-1">💡 Tips:</p>
          <ul className="space-y-1">
            <li>• Click anywhere in a section to add a note</li>
            <li>• Drag notes between sections</li>
            <li>• Use → Action button to create action items</li>
            <li>• Ctrl/Cmd + scroll to zoom</li>
          </ul>
        </div>

        <ZoomControls
          zoom={zoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onReset={onZoomReset}
        />
      </div>
    </aside>
  );
}
