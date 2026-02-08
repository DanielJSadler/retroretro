'use client';

import React from 'react';
import Input from '@/components/atoms/Input';
import CreateBoardForm, { SectionInput } from '@/components/organisms/CreateBoardForm';
import JoinBoardForm from '@/components/organisms/JoinBoardForm';
import RecentBoardsList from '@/components/organisms/RecentBoardsList';
import { BoardSummary } from '@/types';

interface HomeTemplateProps {
  name: string;
  onNameChange: (name: string) => void;
  onCreateBoard: (boardName: string, sections: SectionInput[]) => void;
  onJoinBoard: (boardId: string) => void;
  onRejoinBoard: (boardId: string) => void;
  previousBoards: BoardSummary[];
  isLoadingBoards: boolean;
}

export default function HomeTemplate({
  name,
  onNameChange,
  onCreateBoard,
  onJoinBoard,
  onRejoinBoard,
  previousBoards,
  isLoadingBoards,
}: HomeTemplateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-5xl font-bold text-white mb-2">Retro Board</h1>
          <p className="text-blue-100 text-lg">
            Collaborate on your team retrospective
          </p>
        </div>

        {/* Your Name - Always visible */}
        <div className="bg-white rounded-2xl shadow-2xl p-6">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Your name
          </label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter your name"
            className="py-3"
            maxLength={30}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <CreateBoardForm onSubmit={onCreateBoard} disabled={!name.trim()} />
          <JoinBoardForm onSubmit={onJoinBoard} disabled={!name.trim()} />
        </div>

        <RecentBoardsList
          boards={previousBoards}
          isLoading={isLoadingBoards}
          onRejoin={onRejoinBoard}
        />
      </div>
    </div>
  );
}
