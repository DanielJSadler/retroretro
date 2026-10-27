'use client';

import React, { useState } from 'react';
import { BoardSummary, Folder } from '@/types';
import BoardCard from '@/components/molecules/BoardCard';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';

interface FolderListProps {
  boards: BoardSummary[];
  folders: Folder[];
  isLoading: boolean;
  onRejoin: (boardId: string) => void;
  onCreateFolder: (name: string) => Promise<string | null>;
  onRenameFolder: (folderId: string, name: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onMoveToFolder: (boardId: string, folderId: string | null) => void;
}

interface FolderSectionProps {
  title: string;
  icon: string;
  boards: BoardSummary[];
  allFolders: Folder[];
  folderId: string | null;
  onRejoin: (boardId: string) => void;
  onMoveToFolder: (boardId: string, folderId: string | null) => void;
  onRename?: () => void;
  onDelete?: () => void;
  onCreateFolderRequest: (boardId?: string) => void;
}

function FolderSection({
  title,
  icon,
  boards,
  allFolders,
  folderId,
  onRejoin,
  onMoveToFolder,
  onRename,
  onDelete,
  onCreateFolderRequest,
}: FolderSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showMoveMenu, setShowMoveMenu] = useState<string | null>(null);

  const availableFolders = allFolders.filter((f) => f.id !== folderId);

  return (
    <div className="border border-gray-200 rounded-lg bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors rounded-t-lg border-b border-gray-100"
      >
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="min-w-0 break-words font-semibold text-gray-800">{title}</span>
          <span className="text-sm text-gray-500">({boards.length})</span>
        </div>
        <div className="min-w-0 flex flex-wrap items-center gap-2">
          {onRename && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onRename();
              }}
              className="text-gray-400 hover:text-gray-600 cursor-pointer"
              title="Rename folder"
            >
              ✏️
            </span>
          )}
          {onDelete && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-gray-400 hover:text-red-500 cursor-pointer"
              title="Delete folder"
            >
              🗑️
            </span>
          )}
          <span className="text-gray-400">{isOpen ? '▼' : '▶'}</span>
        </div>
      </button>
      {isOpen && (
        <div className="p-3 space-y-2">
          {boards.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-2">No boards</p>
          ) : (
            boards.map((board) => (
              <div key={board.id} className="relative group">
                <BoardCard board={board} onRejoin={onRejoin} />
                <div data-folder-actions
                  className="relative mt-2 sm:absolute sm:mt-0 sm:top-5 sm:right-36 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100 transition-opacity z-10">
                  <button
                    onClick={() =>
                      setShowMoveMenu(showMoveMenu === board.id ? null : board.id)
                    }
                    className="p-1 bg-white border rounded shadow-sm text-xs hover:bg-gray-50"
                    title="Move to folder"
                  >
                    📁
                  </button>
                  {showMoveMenu === board.id && (
                    <div className="absolute top-full left-0 sm:left-auto sm:right-0 bg-white border rounded-lg shadow-xl py-1 z-50 min-w-[180px]">
                      {folderId && (
                        <button
                          onClick={() => {
                            onMoveToFolder(board.id, null);
                            setShowMoveMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-red-600"
                        >
                          📤 Remove from folder
                        </button>
                      )}
                      
                      {availableFolders.length > 0 ? (
                        <>
                          <div className="px-3 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                            Move to...
                          </div>
                          {availableFolders.map((folder) => (
                            <button
                              key={folder.id}
                              onClick={() => {
                                onMoveToFolder(board.id, folder.id);
                                setShowMoveMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                            >
                              📁 {folder.name}
                            </button>
                          ))}
                        </>
                      ) : (
                        <button
                          onClick={() => {
                            onCreateFolderRequest(board.id);
                            setShowMoveMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 text-blue-600"
                        >
                          + Create new folder
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function FolderList({
  boards,
  folders,
  isLoading,
  onRejoin,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
}: FolderListProps) {
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolder, setEditingFolder] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [activeBoardForNewFolder, setActiveBoardForNewFolder] = useState<string | null>(null);

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      const newFolderId = await onCreateFolder(newFolderName.trim());
      
      // Auto-move board if one was selected
      if (newFolderId && activeBoardForNewFolder) {
        onMoveToFolder(activeBoardForNewFolder, newFolderId);
      }
      
      setNewFolderName('');
      setShowNewFolder(false);
      setActiveBoardForNewFolder(null);
    }
  };

  const handleRenameFolder = (folderId: string) => {
    if (editFolderName.trim()) {
      onRenameFolder(folderId, editFolderName.trim());
      setEditingFolder(null);
      setEditFolderName('');
    }
  };

  // Group boards by folder
  const unfiledBoards = boards.filter((b) => !b.folderId);
  const boardsByFolder = folders.map((folder) => ({
    folder,
    boards: boards.filter((b) => b.folderId === folder.id),
  }));

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-2xl min-w-0 p-3 sm:p-6">
        <div className="text-center py-8 text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl min-w-0 p-3 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-gray-800">📋 Your Boards</h2>
        <Button
          onClick={() => setShowNewFolder(true)}
          variant="secondary"
          size="sm"
        >
          + New Folder
        </Button>
      </div>

      {showNewFolder && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex flex-wrap gap-2">
          <Input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
            className="min-w-0 basis-full sm:basis-0 flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
            autoFocus
          />
          <Button onClick={handleCreateFolder} size="sm">
            Create
          </Button>
          <Button
            onClick={() => {
              setShowNewFolder(false);
              setNewFolderName('');
            }}
            variant="secondary"
            size="sm"
          >
            Cancel
          </Button>
        </div>
      )}

      {boards.length === 0 && folders.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📭</div>
          <p>No boards found.</p>
          <p className="text-sm">Create a new board to get started!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Render folders first */}
          {boardsByFolder.map(({ folder, boards: folderBoards }) => (
            <div key={folder.id}>
              {editingFolder === folder.id ? (
                <div className="p-3 bg-yellow-50 rounded-lg flex flex-wrap gap-2 mb-2">
                  <Input
                    type="text"
                    value={editFolderName}
                    onChange={(e) => setEditFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="min-w-0 basis-full sm:basis-0 flex-1"
                    onKeyDown={(e) =>
                      e.key === 'Enter' && handleRenameFolder(folder.id)
                    }
                    autoFocus
                  />
                  <Button onClick={() => handleRenameFolder(folder.id)} size="sm">
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setEditingFolder(null);
                      setEditFolderName('');
                    }}
                    variant="secondary"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <FolderSection
                  title={folder.name}
                  icon="📁"
                  boards={folderBoards}
                  allFolders={folders}
                  folderId={folder.id}
                  onRejoin={onRejoin}
                  onMoveToFolder={onMoveToFolder}
                  onRename={() => {
                    setEditingFolder(folder.id);
                    setEditFolderName(folder.name);
                  }}
                  onDelete={() => onDeleteFolder(folder.id)}
                  onCreateFolderRequest={(boardId) => {
                    setShowNewFolder(true);
                    if (boardId) setActiveBoardForNewFolder(boardId);
                  }}
                />
              )}
            </div>
          ))}

          {/* Unfiled boards section */}
          {unfiledBoards.length > 0 && (
            <FolderSection
              title="Unfiled"
              icon="📋"
              boards={unfiledBoards}
              allFolders={folders}
              folderId={null}
              onRejoin={onRejoin}
              onMoveToFolder={onMoveToFolder}
              onCreateFolderRequest={(boardId) => {
                setShowNewFolder(true);
                if (boardId) setActiveBoardForNewFolder(boardId);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
