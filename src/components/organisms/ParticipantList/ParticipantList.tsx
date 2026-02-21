'use client'

import React from 'react'
import { Participant } from '@/types'

interface ParticipantListProps {
  participants: Participant[]
  currentUser: string
  highlightedUser?: string | null
  setHighlightedUser?: (userId: string | null) => void
  followedUser?: string | null
  setFollowedUser?: (userId: string | null) => void
}

export default function ParticipantList({
  participants,
  currentUser,
  highlightedUser,
  setHighlightedUser,
  followedUser,
  setFollowedUser,
}: ParticipantListProps) {
  // Sort participants so active ones are at the top, and current user is very first
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.name === currentUser) return -1
    if (b.name === currentUser) return 1
    if (a.isActive && !b.isActive) return -1
    if (!a.isActive && b.isActive) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">
        Participants ({participants.filter(p => p.isActive).length}/{participants.length})
      </h3>

      <div className="space-y-2">
        {sortedParticipants.map(participant => (
          <div
            key={participant.id}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              highlightedUser === participant.name
                ? 'bg-yellow-100 border border-yellow-300'
                : participant.name === currentUser
                  ? 'bg-blue-100 border border-blue-300 hover:bg-blue-200'
                  : 'bg-gray-50 hover:bg-gray-200 border border-transparent'
            } ${!participant.isActive && participant.name !== currentUser ? 'opacity-60' : ''}`}
          >
            <div
              className={`w-2 h-2 rounded-full shrink-0 ${
                participant.isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium truncate">{participant.name}</span>
            {participant.name === currentUser && <span className="text-xs text-blue-600 shrink-0">(You)</span>}

            <button
              onClick={e => {
                e.stopPropagation()
                if (setHighlightedUser) {
                  setHighlightedUser(highlightedUser === participant.name ? null : participant.name)
                }
              }}
              className={`ml-auto p-1.5 rounded-md border shrink-0 transition-all ${
                highlightedUser === participant.name
                  ? 'bg-yellow-400 text-yellow-900 border-yellow-500 shadow-sm hover:bg-yellow-500'
                  : 'bg-white text-gray-400 border-gray-200 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200'
              }`}
              title={
                highlightedUser === participant.name ? 'Remove highlight' : `Highlight ${participant.name}'s notes`
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </button>

            {participant.name !== currentUser && (
              <button
                onClick={e => {
                  e.stopPropagation()
                  if (setFollowedUser) {
                    setFollowedUser(followedUser === participant.name ? null : participant.name)
                  }
                }}
                className={`p-1.5 rounded-md border shrink-0 transition-all ${
                  followedUser === participant.name
                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm hover:bg-blue-600'
                    : 'bg-white text-gray-400 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200'
                }`}
                title={followedUser === participant.name ? 'Stop following' : `Follow ${participant.name}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 17l-5-5-5 5" />
                  <path d="M17 12v10" />
                  <circle cx="7" cy="6" r="4" />
                  <path d="M12 9A4 4 0 0 0 4 9" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
