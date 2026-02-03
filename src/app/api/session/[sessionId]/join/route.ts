import { NextRequest, NextResponse } from 'next/server';
import {
  addParticipant,
  getSession,
  createSessionWithSections,
} from '@/lib/sessionStore';
import { Section } from '@/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { userName, sections } = body as {
    userName: string;
    sections?: Section[];
  };

  if (!userName) {
    return NextResponse.json(
      { error: 'userName is required' },
      { status: 400 },
    );
  }

  // If sections provided and session doesn't exist yet, create with sections
  const existingSession = getSession(sessionId);
  if (
    sections &&
    sections.length > 0 &&
    existingSession.participants.length === 0
  ) {
    createSessionWithSections(sessionId, sections);
  }

  const session = addParticipant(sessionId, userName);
  return NextResponse.json(session);
}
