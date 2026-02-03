import { NextRequest, NextResponse } from 'next/server';
import {
  updateSession,
  setVotesPerPerson,
  resetAllVotes,
} from '@/lib/sessionStore';
import { Phase } from '@/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { phase, votesPerPerson, resetVotes } = body as {
    phase: Phase;
    votesPerPerson?: number;
    resetVotes?: boolean;
  };

  if (
    !phase ||
    !['writing', 'reveal', 'voting', 'discussion'].includes(phase)
  ) {
    return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
  }

  // If entering voting phase with votesPerPerson setting
  if (phase === 'voting' && votesPerPerson !== undefined) {
    setVotesPerPerson(sessionId, votesPerPerson);
  }

  // Optionally reset all votes when starting voting phase
  if (resetVotes) {
    resetAllVotes(sessionId);
  }

  const session = updateSession(sessionId, { phase });
  return NextResponse.json(session);
}
