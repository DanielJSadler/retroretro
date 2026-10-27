'use client';

import React from 'react';
import { Session, Phase } from '@/types';
import Button from '@/components/atoms/Button';

interface HeaderProps {
  session: Session;
  currentUser: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
  onCopyLink: () => void;
  onLeave: () => void;
  getRemainingVotes: () => number;
  votingStatus?: Session['votingStatus'];
  timerExpired?: boolean;
  onDismissTimer?: () => void;
}

const phaseConfig: Record<Phase, { color: string; message: string }> = {
  writing: {
    color: 'bg-blue-600',
    message: '✍️ Writing - Your notes are private (others see ghosts)',
  },
  reveal: {
    color: 'bg-green-600',
    message: '👀 Reveal - All notes visible',
  },
  voting: {
    color: 'bg-orange-600',
    message: '🗳️ Voting',
  },
  discussion: {
    color: 'bg-purple-600',
    message: '💬 Discussion - Top voted → Actions',
  },
  finished: {
    color: 'bg-gray-600',
    message: '🏁 Finished - Board is locked',
  },
};

import { useStandardMode } from '@/context/StandardModeContext';

export default function Header({
  session,
  currentUser,
  sidebarCollapsed,
  onToggleSidebar,
  onCopyLink,
  onLeave,
  getRemainingVotes,
  votingStatus,
  timerExpired = false,
  onDismissTimer,
}: HeaderProps) {
  const config = session.phase === 'finished' 
    ? { color: 'bg-gray-800', message: '🏁 Finished - Board is locked' }
    : phaseConfig[session.phase];
    
  const votingMessage =
    session.phase === 'voting'
      ? `${config.message} - ${getRemainingVotes()} votes left`
      : config.message;

  const { isStandardMode, toggleStandardMode } = useStandardMode();

  return (
    <header className="bg-white shadow-md flex-shrink-0">
      <div className="px-3 py-2 flex flex-wrap items-center justify-between gap-2 sm:px-4 sm:py-3">
        <div className="min-w-0 flex flex-1 items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            aria-expanded={!sidebarCollapsed}
            aria-controls="board-controls"
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
          <div className="min-w-0">
            <h2 className="break-words text-base sm:text-xl font-bold text-black">{session.name}</h2>
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="text-xs text-gray-600">
                Phase:{' '}
                <span className="font-semibold capitalize">{session.phase}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Phase Banner */}
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {timerExpired && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white font-bold text-sm animate-pulse" role="alert">
              <span>⏰ Time&apos;s up</span>
              {onDismissTimer && (
                <button
                  type="button"
                  onClick={onDismissTimer}
                  className="rounded bg-white/20 px-1.5 py-0.5 text-xs font-semibold hover:bg-white/30"
                  aria-label="Dismiss timer alert"
                >
                  Dismiss
                </button>
              )}
            </div>
          )}
          <div className={`px-4 py-2 rounded-lg text-white font-semibold text-sm ${config.color}`}>
            {votingMessage}
            {session.phase === 'voting' && votingStatus && (
              <span className="ml-2 font-normal">
                · {votingStatus.completed}/{votingStatus.total} finished
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={toggleStandardMode}
            className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 font-medium"
            title={isStandardMode ? "Switch to Retro Mode" : "Switch to Standard Mode"}
          >
            {isStandardMode ? "👾 Retro" : "👔 Standard"}
          </button>
          <Button
            onClick={onCopyLink}
            variant="secondary"
            size="sm"
            className="bg-blue-100 text-blue-700 hover:bg-blue-200"
            title="Copy board link to share"
          >
            📋 Share
          </Button>
          <span className="max-w-full break-words text-sm text-black">
            <span className="font-semibold">{currentUser}</span>
          </span>
          <Button onClick={onLeave} variant="secondary" size="sm">
            Leave
          </Button>
        </div>
      </div>
    </header>
  );
}
