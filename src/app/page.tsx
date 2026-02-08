'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BoardSummary } from '@/types';
import HomeTemplate from '@/components/templates/HomeTemplate';
import { SectionInput } from '@/components/organisms/CreateBoardForm';

const VISITED_BOARDS_KEY = 'visitedBoards';

export default function Home() {
  const [name, setName] = useState('');
  const [previousBoards, setPreviousBoards] = useState<BoardSummary[]>([]);
  const [isLoadingBoards, setIsLoadingBoards] = useState(true);
  const router = useRouter();

  // Load user name from localStorage
  useEffect(() => {
    const savedName = localStorage.getItem('userName');
    if (savedName) {
      setName(savedName);
    }
  }, []);

  // Load previously visited boards
  useEffect(() => {
    const loadPreviousBoards = async () => {
      const visitedIds = JSON.parse(
        localStorage.getItem(VISITED_BOARDS_KEY) || '[]',
      ) as string[];

      if (visitedIds.length === 0) {
        setIsLoadingBoards(false);
        return;
      }

      try {
        const response = await fetch(`/api/boards?ids=${visitedIds.join(',')}`);
        if (response.ok) {
          const data = await response.json();
          setPreviousBoards(data.boards);
        }
      } catch (error) {
        console.error('Failed to load previous boards:', error);
      } finally {
        setIsLoadingBoards(false);
      }
    };

    loadPreviousBoards();
  }, []);

  const handleCreateBoard = async (boardName: string, sections: SectionInput[]) => {
    if (!name.trim() || sections.filter((s) => s.name.trim()).length === 0)
      return;

    localStorage.setItem('userName', name.trim());

    // Create valid sections with new IDs
    const validSections = sections
      .filter((s) => s.name.trim())
      .map((s, index) => ({
        id: `section-${Date.now()}-${index}`,
        name: s.name.trim(),
        color: s.color,
      }));

    try {
      const response = await fetch('/api/boards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: boardName.trim() || 'Retro Board',
          createdBy: name.trim(),
          sections: validSections,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Save to visited boards
        const visitedIds = JSON.parse(
          localStorage.getItem(VISITED_BOARDS_KEY) || '[]',
        ) as string[];
        if (!visitedIds.includes(data.id)) {
          visitedIds.unshift(data.id);
          localStorage.setItem(
            VISITED_BOARDS_KEY,
            JSON.stringify(visitedIds.slice(0, 50)),
          ); // Keep last 50
        }

        router.push(`/board/${data.id}`);
      }
    } catch (error) {
      console.error('Failed to create board:', error);
    }
  };

  const handleJoinBoard = (boardId: string) => {
    if (!name.trim()) return;

    localStorage.setItem('userName', name.trim());

    // Save to visited boards
    const visitedIds = JSON.parse(
      localStorage.getItem(VISITED_BOARDS_KEY) || '[]',
    ) as string[];
    if (!visitedIds.includes(boardId)) {
      visitedIds.unshift(boardId);
      localStorage.setItem(
        VISITED_BOARDS_KEY,
        JSON.stringify(visitedIds.slice(0, 50)),
      );
    }

    router.push(`/board/${boardId}`);
  };

  const handleRejoinBoard = (boardId: string) => {
    if (!name.trim()) {
      alert('Please enter your name first');
      return;
    }
    localStorage.setItem('userName', name.trim());
    router.push(`/board/${boardId}`);
  };

  return (
    <HomeTemplate
      name={name}
      onNameChange={setName}
      onCreateBoard={handleCreateBoard}
      onJoinBoard={handleJoinBoard}
      onRejoinBoard={handleRejoinBoard}
      previousBoards={previousBoards}
      isLoadingBoards={isLoadingBoards}
    />
  );
}
