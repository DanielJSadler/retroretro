'use client';

import React from 'react';
import { Participant } from '@/types';

interface ParticipantListProps {
  participants: Participant[];
  currentUser: string;
}

export default function ParticipantList({
  participants,
  currentUser,
}: ParticipantListProps) {
  const activeParticipants = participants.filter((p) => p.isActive);

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">
        Participants ({activeParticipants.length})
      </h3>

      <div className="space-y-2">
        {activeParticipants.map((participant) => (
          <div
            key={participant.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-md ${
              participant.name === currentUser
                ? 'bg-blue-100 border border-blue-300'
                : 'bg-gray-50'
            }`}
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">{participant.name}</span>
            {participant.name === currentUser && (
              <span className="ml-auto text-xs text-blue-600">(You)</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
