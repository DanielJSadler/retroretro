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
};

export default function Header({
  session,
  currentUser,
  sidebarCollapsed,
  onToggleSidebar,
  onCopyLink,
  onLeave,
  getRemainingVotes,
}: HeaderProps) {
  const config = phaseConfig[session.phase];
  const votingMessage =
    session.phase === 'voting'
      ? `${config.message} - ${getRemainingVotes()} votes left`
      : config.message;

  return (
    <header className="bg-white shadow-md flex-shrink-0">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
          <div>
            <h2 className="text-xl font-bold text-black">{session.name}</h2>
            <p className="text-xs text-gray-600">
              Phase:{' '}
              <span className="font-semibold capitalize">{session.phase}</span>
            </p>
          </div>
        </div>

        {/* Phase Banner */}
        <div
          className={`px-4 py-2 rounded-lg text-white font-semibold text-sm ${config.color}`}
        >
          {votingMessage}
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={onCopyLink}
            variant="secondary"
            size="sm"
            className="bg-blue-100 text-blue-700 hover:bg-blue-200"
            title="Copy board link to share"
          >
            📋 Share
          </Button>
          <span className="text-sm text-black">
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
