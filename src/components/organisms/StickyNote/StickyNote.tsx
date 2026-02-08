'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Note, NoteColor, Phase } from '@/types';

interface StickyNoteProps {
  note: Note;
  canEdit: boolean;
  canSee: boolean;
  canVote: boolean;
  hasVoted: boolean;
  currentPhase: Phase;
  onUpdate: (id: string, updates: Partial<Note>) => void;
  onDelete: (id: string) => void;
  onVote: (id: string) => void;
  onCreateAction?: (note: Note) => void;
  onDragEnd?: (noteId: string, noteX: number, noteY: number) => void;
  onDragStart?: (note: Note, x: number, y: number) => void;
  onDragMove?: (x: number, y: number) => void;
  showCreateAction?: boolean;
  isReference?: boolean;
  zoom?: number;
}

const colorClasses: Record<NoteColor, string> = {
  yellow: 'bg-yellow-200 hover:bg-yellow-300',
  blue: 'bg-blue-200 hover:bg-blue-300',
  green: 'bg-green-200 hover:bg-green-300',
  red: 'bg-red-200 hover:bg-red-300',
  pink: 'bg-pink-200 hover:bg-pink-300',
};

export default function StickyNote({
  note,
  canEdit,
  canSee,
  canVote,
  hasVoted,
  currentPhase,
  onUpdate,
  onDelete,
  onVote,
  onCreateAction,
  onDragEnd,
  onDragStart,
  onDragMove,
  showCreateAction = false,
  isReference = false,
  zoom = 1,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const noteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setEditContent(note.content);
  }, [note.content]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing || isReference) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const noteRect = noteRef.current?.getBoundingClientRect();

    if (noteRect) {
      // Store the offset from cursor to note's top-left corner (in screen coords)
      setDragOffset({
        x: e.clientX - noteRect.left,
        y: e.clientY - noteRect.top,
      });
      // Start at current screen position
      setDragPosition({
        x: noteRect.left,
        y: noteRect.top,
      });
      // Notify parent to show portal
      if (onDragStart) {
        onDragStart(note, noteRect.left, noteRect.top);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        // Track position in screen coordinates for smooth cross-section dragging
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        setDragPosition({ x: newX, y: newY });
        // Update portal position
        if (onDragMove) {
          onDragMove(newX, newY);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        if (onDragEnd) {
          // Pass the note's visual screen position
          const noteX = e.clientX - dragOffset.x;
          const noteY = e.clientY - dragOffset.y;
          onDragEnd(note.id, noteX, noteY);
        }
        setIsDragging(false);
        setDragPosition(null);
      }
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, note.id, onDragEnd, onDragMove]);

  const handleSave = () => {
    onUpdate(note.id, { content: editContent });
    setIsEditing(false);
  };

  if (!canSee) {
    return null;
  }

  // When dragging, show ghost at original position (portal shows the dragging visual)
  // For reference notes, use relative positioning
  // Normal notes use percentage-based positioning
  const positionStyle = isReference
    ? { position: 'relative' as const }
    : {
        position: 'absolute' as const,
        left: `${note.position.x}%`,
        top: `${note.position.y}%`,
      };

  return (
    <div
      ref={noteRef}
      className={`w-40 p-3 rounded-lg shadow-lg select-none z-20 ${
        colorClasses[note.color]
      } ${isDragging ? 'opacity-30 cursor-none' : ''} ${
        !isDragging && !isReference ? 'cursor-grab' : ''
      } ${isReference ? 'opacity-90 ring-2 ring-purple-400' : ''}`}
      style={positionStyle}
      onMouseDown={handleMouseDown}
    >
      {isReference && (
        <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
          #{(note as Note & { rank?: number }).rank || ''}
        </div>
      )}
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-semibold text-gray-700 truncate max-w-[70%]">
          {note.createdBy}
        </span>
        {canEdit && !isReference && (
          <div className="flex gap-1">
            {!isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(true);
                }}
                className="text-gray-600 hover:text-gray-800 text-xs"
              >
                ✏️
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(note.id);
              }}
              className="text-gray-600 hover:text-red-600 text-xs"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-1">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full p-1 text-xs bg-white/50 rounded resize-none focus:outline-none focus:ring-2 focus:ring-gray-400"
            rows={3}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            autoFocus
          />
          <div className="flex gap-1">
            <button
              onClick={handleSave}
              className="flex-1 px-1 py-0.5 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              Save
            </button>
            <button
              onClick={() => {
                setEditContent(note.content);
                setIsEditing(false);
              }}
              className="flex-1 px-1 py-0.5 bg-gray-500 text-white text-xs rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-xs text-gray-800 whitespace-pre-wrap break-words overflow-hidden max-h-16">
          {note.content}
        </div>
      )}

      {/* Vote section - visible in voting and discussion phases */}
      {(currentPhase === 'voting' || currentPhase === 'discussion') && (
        <div className="flex items-center justify-between mt-2 pt-1 border-t border-gray-300/50">
          <div className="flex items-center gap-1">
            <span className="text-sm">👍</span>
            <span className="font-bold text-gray-800 text-sm">
              {note.votes?.length || 0}
            </span>
          </div>
          <div className="flex gap-1">
            {canVote && currentPhase === 'voting' && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onVote(note.id);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                  hasVoted
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-white/70 text-gray-700 hover:bg-white'
                }`}
              >
                {hasVoted ? '✓' : 'Vote'}
              </button>
            )}
            {showCreateAction && onCreateAction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateAction(note);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 transition-all"
                title="Create action from this note"
              >
                → Action
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
