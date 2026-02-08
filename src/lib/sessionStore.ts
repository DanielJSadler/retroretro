import { Session, Note, Participant, Section, BoardSummary } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for sessions
const sessions: Map<string, Session> = new Map();

// Default sections if none provided
const defaultSections: Section[] = [
  { id: 'went-well', name: 'What went well?', color: 'green' },
  { id: 'improve', name: 'What could be better?', color: 'pink' },
  { id: 'actions', name: 'Action items', color: 'blue' },
];

// Generate a new board ID (UUID)
export function generateBoardId(): string {
  return uuidv4();
}

// Check if a session exists
export function sessionExists(sessionId: string): boolean {
  return sessions.has(sessionId);
}

// Get all boards as summaries (for listing)
export function getAllBoards(): BoardSummary[] {
  const boards: BoardSummary[] = [];
  sessions.forEach((session) => {
    boards.push({
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      createdBy: session.createdBy,
      phase: session.phase,
      participantCount: session.participants.length,
      noteCount: session.notes.length,
    });
  });
  // Sort by createdAt descending (newest first)
  return boards.sort((a, b) => b.createdAt - a.createdAt);
}

// Get specific boards by IDs
export function getBoardsByIds(ids: string[]): BoardSummary[] {
  const boards: BoardSummary[] = [];
  ids.forEach((id) => {
    const session = sessions.get(id);
    if (session) {
      boards.push({
        id: session.id,
        name: session.name,
        createdAt: session.createdAt,
        createdBy: session.createdBy,
        phase: session.phase,
        participantCount: session.participants.length,
        noteCount: session.notes.length,
      });
    }
  });
  // Sort by createdAt descending (newest first)
  return boards.sort((a, b) => b.createdAt - a.createdAt);
}

export function getSession(sessionId: string): Session | null {
  return sessions.get(sessionId) || null;
}

// Create a new session with required fields
export function createSession(
  sessionId: string,
  name: string,
  createdBy: string,
  sections: Section[],
): Session {
  const newSession: Session = {
    id: sessionId,
    name,
    createdAt: Date.now(),
    createdBy,
    phase: 'writing',
    notes: [],
    participants: [],
    sections: sections.length > 0 ? sections : defaultSections,
    timerDuration: 0,
    timerPaused: true,
    votesPerPerson: 3,
  };
  sessions.set(sessionId, newSession);
  return newSession;
}

export function updateSession(
  sessionId: string,
  updates: Partial<Session>,
): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;
  const updatedSession = { ...session, ...updates };
  sessions.set(sessionId, updatedSession);
  return updatedSession;
}

export function addParticipant(
  sessionId: string,
  userName: string,
): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const existingParticipant = session.participants.find(
    (p) => p.name === userName,
  );

  if (existingParticipant) {
    existingParticipant.isActive = true;
    existingParticipant.lastSeen = Date.now();
  } else {
    const newParticipant: Participant = {
      id: `participant-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: userName,
      isActive: true,
      lastSeen: Date.now(),
    };
    session.participants.push(newParticipant);
  }

  // Mark inactive participants (not seen for 30 seconds)
  session.participants = session.participants.map((p) => ({
    ...p,
    isActive: Date.now() - p.lastSeen < 30000,
  }));

  sessions.set(sessionId, session);
  return session;
}

export function addNote(
  sessionId: string,
  note: Omit<Note, 'id' | 'createdAt' | 'votes'>,
): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const newNote: Note = {
    ...note,
    id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: Date.now(),
    votes: [],
  };
  session.notes.push(newNote);
  sessions.set(sessionId, session);
  return session;
}

export function updateNote(
  sessionId: string,
  noteId: string,
  updates: Partial<Note>,
): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const noteIndex = session.notes.findIndex((n) => n.id === noteId);

  if (noteIndex !== -1) {
    session.notes[noteIndex] = { ...session.notes[noteIndex], ...updates };
    sessions.set(sessionId, session);
  }

  return session;
}

export function deleteNote(sessionId: string, noteId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.notes = session.notes.filter((n) => n.id !== noteId);
  sessions.set(sessionId, session);
  return session;
}

export function updateParticipantLastSeen(
  sessionId: string,
  userName: string,
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const participant = session.participants.find((p) => p.name === userName);
  if (participant) {
    participant.lastSeen = Date.now();
    participant.isActive = true;
  }
  sessions.set(sessionId, session);
}

export function startTimer(
  sessionId: string,
  duration: number,
): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.timerDuration = duration;
  session.timerStartedAt = Date.now();
  session.timerPaused = false;
  session.timerRemainingTime = duration;
  sessions.set(sessionId, session);
  return session;
}

export function pauseTimer(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  if (session.timerStartedAt && !session.timerPaused) {
    const elapsed = Date.now() - session.timerStartedAt;
    session.timerRemainingTime = Math.max(0, session.timerDuration - elapsed);
    session.timerPaused = true;
  }
  sessions.set(sessionId, session);
  return session;
}

export function resetTimer(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.timerDuration = 0;
  session.timerStartedAt = undefined;
  session.timerPaused = true;
  session.timerRemainingTime = undefined;
  sessions.set(sessionId, session);
  return session;
}

export function toggleVote(
  sessionId: string,
  noteId: string,
  userName: string,
): { session: Session | null; success: boolean; message?: string } {
  const session = sessions.get(sessionId);
  if (!session) {
    return { session: null, success: false, message: 'Session not found' };
  }

  const note = session.notes.find((n) => n.id === noteId);

  if (!note) {
    return { session, success: false, message: 'Note not found' };
  }

  const hasVoted = note.votes.includes(userName);

  if (hasVoted) {
    // Remove vote
    note.votes = note.votes.filter((v) => v !== userName);
    sessions.set(sessionId, session);
    return { session, success: true };
  } else {
    // Check if user has remaining votes
    const totalVotesUsed = session.notes.reduce(
      (count, n) => count + (n.votes.includes(userName) ? 1 : 0),
      0,
    );

    if (totalVotesUsed >= session.votesPerPerson) {
      return { session, success: false, message: 'No votes remaining' };
    }

    // Add vote
    note.votes.push(userName);
    sessions.set(sessionId, session);
    return { session, success: true };
  }
}

export function setVotesPerPerson(
  sessionId: string,
  votesPerPerson: number,
): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.votesPerPerson = votesPerPerson;
  sessions.set(sessionId, session);
  return session;
}

export function resetAllVotes(sessionId: string): Session | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  session.notes = session.notes.map((note) => ({ ...note, votes: [] }));
  sessions.set(sessionId, session);
  return session;
}
