import { Session, Note, Participant, Section } from '@/types';

// In-memory storage for sessions
const sessions: Map<string, Session> = new Map();

// Default sections if none provided
const defaultSections: Section[] = [
  { id: 'went-well', name: 'What went well?', color: 'green' },
  { id: 'improve', name: 'What could be better?', color: 'pink' },
  { id: 'actions', name: 'Action items', color: 'blue' },
];

export function getSession(sessionId: string): Session {
  if (!sessions.has(sessionId)) {
    const newSession: Session = {
      id: sessionId,
      phase: 'writing',
      notes: [],
      participants: [],
      sections: defaultSections,
      timerDuration: 0,
      timerPaused: true,
      votesPerPerson: 3,
    };
    sessions.set(sessionId, newSession);
  }
  return sessions.get(sessionId)!;
}

export function createSessionWithSections(
  sessionId: string,
  sections: Section[],
): Session {
  const newSession: Session = {
    id: sessionId,
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
): Session {
  const session = getSession(sessionId);
  const updatedSession = { ...session, ...updates };
  sessions.set(sessionId, updatedSession);
  return updatedSession;
}

export function addParticipant(sessionId: string, userName: string): Session {
  const session = getSession(sessionId);
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
): Session {
  const session = getSession(sessionId);
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
): Session {
  const session = getSession(sessionId);
  const noteIndex = session.notes.findIndex((n) => n.id === noteId);

  if (noteIndex !== -1) {
    session.notes[noteIndex] = { ...session.notes[noteIndex], ...updates };
    sessions.set(sessionId, session);
  }

  return session;
}

export function deleteNote(sessionId: string, noteId: string): Session {
  const session = getSession(sessionId);
  session.notes = session.notes.filter((n) => n.id !== noteId);
  sessions.set(sessionId, session);
  return session;
}

export function updateParticipantLastSeen(
  sessionId: string,
  userName: string,
): void {
  const session = getSession(sessionId);
  const participant = session.participants.find((p) => p.name === userName);
  if (participant) {
    participant.lastSeen = Date.now();
    participant.isActive = true;
  }
  sessions.set(sessionId, session);
}

export function startTimer(sessionId: string, duration: number): Session {
  const session = getSession(sessionId);
  session.timerDuration = duration;
  session.timerStartedAt = Date.now();
  session.timerPaused = false;
  session.timerRemainingTime = duration;
  sessions.set(sessionId, session);
  return session;
}

export function pauseTimer(sessionId: string): Session {
  const session = getSession(sessionId);
  if (session.timerStartedAt && !session.timerPaused) {
    const elapsed = Date.now() - session.timerStartedAt;
    session.timerRemainingTime = Math.max(0, session.timerDuration - elapsed);
    session.timerPaused = true;
  }
  sessions.set(sessionId, session);
  return session;
}

export function resetTimer(sessionId: string): Session {
  const session = getSession(sessionId);
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
): { session: Session; success: boolean; message?: string } {
  const session = getSession(sessionId);
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
): Session {
  const session = getSession(sessionId);
  session.votesPerPerson = votesPerPerson;
  sessions.set(sessionId, session);
  return session;
}

export function resetAllVotes(sessionId: string): Session {
  const session = getSession(sessionId);
  session.notes = session.notes.map((note) => ({ ...note, votes: [] }));
  sessions.set(sessionId, session);
  return session;
}
