'use client';

import React from 'react';
import { BoardSummary } from '@/types';
import BoardCard from '@/components/molecules/BoardCard';

interface RecentBoardsListProps {
  boards: BoardSummary[];
  isLoading: boolean;
  onRejoin: (boardId: string) => void;
}

export default function RecentBoardsList({
  boards,
  isLoading,
  onRejoin,
}: RecentBoardsListProps) {
  return (
    <div className="bg-white rounded-2xl shadow-2xl p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        📋 Your Recent Boards
      </h2>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500">Loading...</div>
      ) : boards.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>No previous boards found.</p>
          <p className="text-sm">Create a new board to get started!</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {boards.map((board) => (
            <BoardCard key={board.id} board={board} onRejoin={onRejoin} />
          ))}
        </div>
      )}
    </div>
  );
}
