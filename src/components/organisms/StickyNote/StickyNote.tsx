'use client';

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
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
  const teaxtareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize function
  const autoResize = () => {
    if (teaxtareaRef.current) {
      teaxtareaRef.current.style.height = 'auto';
      teaxtareaRef.current.style.height = teaxtareaRef.current.scrollHeight + 'px';
    }
  };

  useLayoutEffect(() => {
    if (isEditing) {
      autoResize();
    }
  }, [isEditing, editContent]);

  useEffect(() => {
    setEditContent(note.content);
  }, [note.content]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEditing || isReference) return;

    // Only drag if clicking the note background, not buttons
    if ((e.target as HTMLElement).tagName === 'BUTTON') return;
    if ((e.target as HTMLElement).closest('button')) return;

    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const noteRect = noteRef.current?.getBoundingClientRect();

    if (noteRect) {
      setDragOffset({
        x: e.clientX - noteRect.left,
        y: e.clientY - noteRect.top,
      });
      setDragPosition({
        x: noteRect.left,
        y: noteRect.top,
      });
      
      if (onDragStart) {
        onDragStart(note, noteRect.left, noteRect.top);
      }
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        setDragPosition({ x: newX, y: newY });
        if (onDragMove) {
          onDragMove(newX, newY);
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isDragging) {
        if (onDragEnd) {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      setEditContent(note.content);
      setIsEditing(false);
    }
  };

  if (!canSee) {
    return null;
  }

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
      className={`absolute min-w-[200px] max-w-[300px] p-4 rounded-lg shadow-lg select-none z-20 flex flex-col gap-2 transition-colors ${
        colorClasses[note.color]
      } ${isDragging ? 'opacity-30 cursor-none' : ''} ${
        !isDragging && !isReference ? 'cursor-grab active:cursor-grabbing' : ''
      } ${isReference ? 'opacity-90 ring-2 ring-purple-400' : ''}`}
      style={positionStyle}
      onMouseDown={handleMouseDown}
    >
      {isReference && (
        <div className="absolute -top-2 -left-2 bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
          #{(note as Note & { rank?: number }).rank || ''}
        </div>
      )}
      
      {/* Header with Creator Name and Actions */}
      <div className="flex justify-between items-start border-b border-black/5 pb-1 mb-1">
        <span className="text-xs font-bold text-gray-700 truncate max-w-[60%] uppercase tracking-wider opacity-70">
          {note.createdBy}
        </span>
        {canEdit && !isReference && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
             {/* Only show edit/delete when hovering (handled by group on parent if we added 'group' class, 
                 but for touch devices keeping them visible or relying on click to edit is better. 
                 Let's keep them always visible for now but subtle) */}
          </div>
        )}
         {canEdit && !isReference && (
            <div className="flex gap-1">
              {!isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                  }}
                  className="text-gray-600 hover:text-gray-900 px-1 hover:bg-black/5 rounded"
                  title="Edit"
                >
                  ✏️
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(note.id);
                }}
                className="text-gray-600 hover:text-red-600 px-1 hover:bg-black/5 rounded"
                title="Delete"
              >
                🗑️
              </button>
            </div>
         )}
      </div>

      {/* Content Area */}
      {isEditing ? (
        <div className="flex flex-col gap-2 relative">
          <textarea
            ref={teaxtareaRef}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[80px] p-2 text-base md:text-lg bg-white/40 border border-black/10 rounded-md focus:outline-none focus:ring-2 focus:ring-black/20 focus:bg-white/60 resize-none overflow-hidden leading-snug placeholder-gray-500/50"
            rows={1}
            placeholder="Write your thought..."
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            autoFocus
          />
          <div className="flex gap-2 justify-end">
             <span className="text-[10px] text-gray-500 self-center mr-auto">
               Enter to save, Shift+Enter for new line
             </span>
            <button
              onClick={() => {
                 setEditContent(note.content);
                 setIsEditing(false);
              }}
              className="px-3 py-1 bg-black/10 text-gray-800 text-xs font-bold rounded hover:bg-black/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 bg-black/80 text-white text-xs font-bold rounded hover:bg-black transition-colors shadow-sm"
            >
              Save
            </button>
          </div>
        </div>
      ) : (
        <div 
            className="text-base md:text-lg text-gray-900 whitespace-pre-wrap break-words leading-snug font-medium cursor-text"
            onDoubleClick={(e) => {
                if (canEdit && !isReference) {
                    e.stopPropagation();
                    setIsEditing(true);
                }
            }}
        >
          {note.content}
        </div>
      )}

      {/* Vote section */}
      {(currentPhase === 'voting' || currentPhase === 'discussion') && (
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/10">
          <div className="flex items-center gap-1.5 bg-white/30 px-2 py-1 rounded-full">
            <span className="text-sm">👍</span>
            <span className="font-bold text-gray-900 text-sm">
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
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm border ${
                  hasVoted
                    ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {hasVoted ? '✓ Voted' : '+ Vote'}
              </button>
            )}
            {showCreateAction && onCreateAction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateAction(note);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                className="px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-sm border border-purple-800"
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
