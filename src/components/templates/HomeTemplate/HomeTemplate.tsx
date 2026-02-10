'use client';

import React from 'react';
import CreateBoardForm, { SectionInput } from '@/components/organisms/CreateBoardForm';
import JoinBoardForm from '@/components/organisms/JoinBoardForm';
import FolderList from '@/components/organisms/FolderList';
import { BoardSummary, Folder } from '@/types';

import { useStandardMode } from '@/context/StandardModeContext';

interface HomeTemplateProps {
  name: string;
  onCreateBoard: (boardName: string, sections: SectionInput[]) => void;
  onJoinBoard: (boardId: string) => void;
  onRejoinBoard: (boardId: string) => void;
  previousBoards: BoardSummary[];
  folders: Folder[];
  isLoadingBoards: boolean;
  onCreateFolder: (name: string) => Promise<string | null>;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveToFolder: (boardId: string, folderId: string | null) => void;
}

export default function HomeTemplate({
  name,
  onCreateBoard,
  onJoinBoard,
  onRejoinBoard,
  previousBoards,
  folders,
  isLoadingBoards,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
}: HomeTemplateProps) {
  const { isStandardMode, toggleStandardMode } = useStandardMode();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 p-4 transition-colors duration-300">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8 relative">
          <div className="absolute right-0 top-4">
             <button
              onClick={toggleStandardMode}
              className={`px-3 py-1 text-sm rounded transition-all duration-300 ${
                isStandardMode
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-black/20 text-white backdrop-blur-sm border border-white/20'
              }`}
            >
              {isStandardMode ? '✨ Standard' : '👾 Retro'}
            </button>
          </div>
          <h1 className="text-5xl font-bold text-white mb-2">Retro Retro</h1>
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
            Logged in as
          </label>
          <h3 className="text-lg font-semibold text-gray-800">{name}</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <CreateBoardForm onSubmit={onCreateBoard} disabled={!name.trim()} />
          <JoinBoardForm onSubmit={onJoinBoard} disabled={!name.trim()} />
        </div>

        <FolderList
          boards={previousBoards}
          folders={folders}
          isLoading={isLoadingBoards}
          onRejoin={onRejoinBoard}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onMoveToFolder={onMoveToFolder}
        />
      </div>
    </div>
  );
}
