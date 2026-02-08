export type NoteColor = 'yellow' | 'blue' | 'green' | 'red' | 'pink';

export type Phase = 'writing' | 'reveal' | 'voting' | 'discussion';

export interface Section {
  id: string;
  name: string;
  color: NoteColor;
}

export interface Note {
  id: string;
  content: string;
  color: NoteColor;
  createdBy: string;
  position: { x: number; y: number };
  sectionId: string;
  group?: string;
  createdAt: number;
  votes: string[]; // Array of participant names who voted for this note
}

export interface Participant {
  id: string;
  name: string;
  isActive: boolean;
  lastSeen: number;
}

export interface Session {
  id: string;
  name: string; // Board name
  createdAt: number; // Timestamp when board was created
  createdBy: string; // Name of person who created the board
  phase: Phase;
  notes: Note[];
  participants: Participant[];
  sections: Section[];
  timerDuration: number;
  timerStartedAt?: number;
  timerPaused: boolean;
  timerRemainingTime?: number;
  votesPerPerson: number; // Number of votes each participant gets
}

// Summary info for listing boards (doesn't include full notes data)
export interface BoardSummary {
  id: string;
  name: string;
  createdAt: number;
  createdBy: string;
  phase: Phase;
  participantCount: number;
  noteCount: number;
  folderId?: string;
}

export interface Folder {
  id: string;
  name: string;
  color?: string;
}

export interface TimerConfig {
  duration: number;
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
  startedAt?: number;
}
