'use client';

import React from 'react';
import { Participant } from '@/types';
import StatusIndicator from '@/components/atoms/StatusIndicator';

interface ParticipantBadgeProps {
  participant: Participant;
  isCurrentUser?: boolean;
}

export default function ParticipantBadge({
  participant,
  isCurrentUser,
}: ParticipantBadgeProps) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-md ${
        isCurrentUser ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
      }`}
    >
      <StatusIndicator isActive={participant.isActive} />
      <span className="text-sm font-medium">{participant.name}</span>
      {isCurrentUser && (
        <span className="ml-auto text-xs text-blue-600">(You)</span>
      )}
    </div>
  );
}
