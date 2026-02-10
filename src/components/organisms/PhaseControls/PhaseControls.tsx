'use client';

import React, { useState } from 'react';
import { Phase } from '@/types';

interface PhaseControlsProps {
  currentPhase: Phase;
  onPhaseChange: (
    phase: Phase,
    options?: { votesPerPerson?: number; resetVotes?: boolean },
  ) => void;
  votesPerPerson: number;
}

const phases: { value: Phase; label: string; description: string }[] = [
  { value: 'writing', label: 'Writing', description: 'Notes are private' },
  { value: 'reveal', label: 'Reveal', description: 'All notes visible' },
  { value: 'voting', label: 'Voting', description: 'Vote on notes' },
  { value: 'discussion', label: 'Discussion', description: 'Group & discuss' },
  { value: 'finished', label: 'Finished', description: 'Board is locked' },
];

export default function PhaseControls({
  currentPhase,
  onPhaseChange,
  votesPerPerson,
}: PhaseControlsProps) {
  const [showVoteSettings, setShowVoteSettings] = useState(false);
  const [voteCount, setVoteCount] = useState(votesPerPerson);

  const handlePhaseClick = (phase: Phase) => {
    if (phase === 'voting' && currentPhase !== 'voting') {
      setShowVoteSettings(true);
    } else {
      onPhaseChange(phase);
    }
  };

  const handleStartVoting = (resetVotes: boolean) => {
    onPhaseChange('voting', { votesPerPerson: voteCount, resetVotes });
    setShowVoteSettings(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Phase</h3>

      <div className="flex flex-col gap-2">
        {phases.map((phase) => (
          <button
            key={phase.value}
            onClick={() => handlePhaseClick(phase.value)}
            className={`px-4 py-3 rounded-md text-left transition-all ${
              currentPhase === phase.value
                ? 'bg-blue-600 text-white shadow-lg scale-105'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            <div className="font-semibold">{phase.label}</div>
            <div
              className={`text-sm ${currentPhase === phase.value ? 'text-blue-100' : 'text-gray-600'}`}
            >
              {phase.description}
            </div>
          </button>
        ))}
      </div>

      {/* Vote Settings Modal */}
      {showVoteSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h4 className="text-lg font-semibold mb-4">Start Voting Phase</h4>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votes per person
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={voteCount}
                onChange={(e) =>
                  setVoteCount(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleStartVoting(true)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Start Fresh (Reset Votes)
              </button>
              <button
                onClick={() => handleStartVoting(false)}
                className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Continue (Keep Existing Votes)
              </button>
              <button
                onClick={() => setShowVoteSettings(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
