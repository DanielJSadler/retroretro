import { NextRequest, NextResponse } from 'next/server';
import { addParticipant, getSession } from '@/lib/sessionStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { userName } = body as {
    userName: string;
  };

  if (!userName) {
    return NextResponse.json(
      { error: 'userName is required' },
      { status: 400 },
    );
  }

  // Check if session exists
  const existingSession = getSession(sessionId);
  if (!existingSession) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  const session = addParticipant(sessionId, userName);
  return NextResponse.json(session);
}
