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

export interface TimerConfig {
  duration: number;
  isRunning: boolean;
  isPaused: boolean;
  remainingTime: number;
  startedAt?: number;
}
