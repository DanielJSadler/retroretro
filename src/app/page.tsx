'use client';

import { useQuery, useMutation } from 'convex/react';
import { useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { api } from '../../convex/_generated/api';
import HomeTemplate from '@/components/templates/HomeTemplate';
import { SectionInput } from '@/components/organisms/CreateBoardForm';
import AuthGuard from '@/components/organisms/AuthGuard/AuthGuard';
import { Id } from '../../convex/_generated/dataModel';

export default function Home() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Convex queries and mutations
  const boards = useQuery(api.boards.list);
  const folders = useQuery(api.folders.list);
  const currentUser = useQuery(api.users.current);
  const createBoard = useMutation(api.boards.create);
  const createFolder = useMutation(api.folders.create);
  const renameFolder = useMutation(api.folders.rename);
  const deleteFolder = useMutation(api.folders.remove);
  const moveToFolder = useMutation(api.boards.moveToFolder);

  const handleCreateBoard = async (boardName: string, sections: SectionInput[]) => {
    if (sections.filter((s) => s.name.trim()).length === 0) return;

    const validSections = sections
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        color: s.color,
      }));

    try {
      const boardId = await createBoard({
        name: boardName.trim() || 'Retro Board',
        sections: validSections,
      });

      router.push(`/board/${boardId}`);
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleJoinBoard = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  const handleRejoinBoard = (boardId: string) => {
    router.push(`/board/${boardId}`);
  };

  const handleCreateFolder = async (name: string) => {
    try {
      const folderId = await createFolder({ name });
      return folderId;
    } catch (error) {
      console.error('Failed to create folder:', error);
      return null;
    }
  };

  const handleRenameFolder = async (folderId: string, name: string) => {
    try {
      await renameFolder({ folderId: folderId as Id<"folders">, name });
    } catch (error) {
      console.error('Failed to rename folder:', error);
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    try {
      await deleteFolder({ folderId: folderId as Id<"folders"> });
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const handleMoveToFolder = async (boardId: string, folderId: string | null) => {
    try {
      await moveToFolder({
        boardId: boardId as Id<"boards">,
        folderId: folderId as Id<"folders"> | null,
      });
    } catch (error) {
      console.error('Failed to move board:', error);
    }
  };

  if (authLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🎮</div>
          <div className="text-xl font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  // Map Convex boards to the expected format
  const previousBoards = (boards ?? []).map(b => ({
    id: b._id,
    name: b.name,
    createdAt: b._creationTime,
    createdBy: b.creatorName,
    phase: b.phase,
    participantCount: b.participantCount,
    noteCount: b.noteCount,
    folderId: b.folderId,
  }));

  // Map folders to expected format
  const mappedFolders = (folders ?? []).map(f => ({
    id: f.id,
    name: f.name,
    color: f.color,
  }));

  return (
    <AuthGuard>
      <HomeTemplate
        name={currentUser?.name ?? ''}
        onCreateBoard={handleCreateBoard}
        onJoinBoard={handleJoinBoard}
        onRejoinBoard={handleRejoinBoard}
        previousBoards={previousBoards}
        folders={mappedFolders}
        isLoadingBoards={boards === undefined}
        onCreateFolder={handleCreateFolder}
        onRenameFolder={handleRenameFolder}
        onDeleteFolder={handleDeleteFolder}
        onMoveToFolder={handleMoveToFolder}
      />
    </AuthGuard>
  );
}
