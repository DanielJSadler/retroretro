'use client';

import React from 'react';
import { BoardSummary } from '@/types';
import Badge from '@/components/atoms/Badge';
import Button from '@/components/atoms/Button';

interface BoardCardProps {
  board: BoardSummary;
  onRejoin: (boardId: string) => void;
}

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function BoardCard({ board, onRejoin }: BoardCardProps) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-800 truncate">{board.name}</h3>
          <Badge variant="phase" phase={board.phase}>
            {board.phase}
          </Badge>
        </div>
        <div className="text-sm text-gray-500 flex items-center gap-3 mt-1">
          <span>Created by {board.createdBy}</span>
          <span>•</span>
          <span>{formatDate(board.createdAt)}</span>
          <span>•</span>
          <span>{board.participantCount} participants</span>
          <span>•</span>
          <span>{board.noteCount} notes</span>
        </div>
      </div>
      <Button
        onClick={() => onRejoin(board.id)}
        className="whitespace-nowrap ml-4"
      >
        Rejoin
      </Button>
    </div>
  );
}
