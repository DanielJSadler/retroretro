'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { Session, Note, Participant, Phase, NoteColor } from '@/types';

interface SessionContextType {
  session: Session | null;
  currentUser: string;
  addNote: (
    content: string,
    color: NoteColor,
    position: { x: number; y: number },
  ) => void;
  updateNote: (id: string, updates: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  changePhase: (phase: Phase) => void;
  startTimer: (duration: number) => void;
  pauseTimer: () => void;
  resetTimer: () => void;
  joinSession: (userName: string) => void;
  syncSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<string>('');
  const [sessionId] = useState('default-session');

  const syncSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        setSession(data);
      }
    } catch (error) {
      console.error('Failed to sync session:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    if (currentUser && sessionId) {
      // Initial sync
      syncSession();

      // Poll for updates every 2 seconds
      const interval = setInterval(syncSession, 2000);

      return () => clearInterval(interval);
    }
  }, [currentUser, sessionId, syncSession]);

  const joinSession = useCallback(
    async (userName: string) => {
      setCurrentUser(userName);

      try {
        const response = await fetch(`/api/session/${sessionId}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName }),
        });

        if (response.ok) {
          const data = await response.json();
          setSession(data);
        }
      } catch (error) {
        console.error('Failed to join session:', error);
      }
    },
    [sessionId],
  );

  const addNote = useCallback(
    async (
      content: string,
      color: NoteColor,
      position: { x: number; y: number },
    ) => {
      if (!currentUser) return;

      try {
        const response = await fetch(`/api/session/${sessionId}/notes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            color,
            position,
            createdBy: currentUser,
          }),
        });

        if (response.ok) {
          await syncSession();
        }
      } catch (error) {
        console.error('Failed to add note:', error);
      }
    },
    [currentUser, sessionId, syncSession],
  );

  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      try {
        const response = await fetch(`/api/session/${sessionId}/notes/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          await syncSession();
        }
      } catch (error) {
        console.error('Failed to update note:', error);
      }
    },
    [sessionId, syncSession],
  );

  const deleteNote = useCallback(
    async (id: string) => {
      try {
        const response = await fetch(`/api/session/${sessionId}/notes/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await syncSession();
        }
      } catch (error) {
        console.error('Failed to delete note:', error);
      }
    },
    [sessionId, syncSession],
  );

  const changePhase = useCallback(
    async (phase: Phase) => {
      try {
        const response = await fetch(`/api/session/${sessionId}/phase`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phase }),
        });

        if (response.ok) {
          await syncSession();
        }
      } catch (error) {
        console.error('Failed to change phase:', error);
      }
    },
    [sessionId, syncSession],
  );

  const startTimer = useCallback(
    async (duration: number) => {
      try {
        const response = await fetch(`/api/session/${sessionId}/timer/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ duration }),
        });

        if (response.ok) {
          await syncSession();
        }
      } catch (error) {
        console.error('Failed to start timer:', error);
      }
    },
    [sessionId, syncSession],
  );

  const pauseTimer = useCallback(async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}/timer/pause`, {
        method: 'POST',
      });

      if (response.ok) {
        await syncSession();
      }
    } catch (error) {
      console.error('Failed to pause timer:', error);
    }
  }, [sessionId, syncSession]);

  const resetTimer = useCallback(async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}/timer/reset`, {
        method: 'POST',
      });

      if (response.ok) {
        await syncSession();
      }
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  }, [sessionId, syncSession]);

  return (
    <SessionContext.Provider
      value={{
        session,
        currentUser,
        addNote,
        updateNote,
        deleteNote,
        changePhase,
        startTimer,
        pauseTimer,
        resetTimer,
        joinSession,
        syncSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
