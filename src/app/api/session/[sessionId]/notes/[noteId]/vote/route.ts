import { NextRequest, NextResponse } from 'next/server';
import { toggleVote, getSession } from '@/lib/sessionStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; noteId: string }> },
) {
  const { sessionId, noteId } = await params;
  const body = await request.json();
  const { userName } = body as { userName: string };

  if (!userName) {
    return NextResponse.json({ error: 'userName is required' }, { status: 400 });
  }

  const currentSession = getSession(sessionId);
  if (currentSession.phase !== 'voting') {
    return NextResponse.json(
      { error: 'Voting is only allowed during the voting phase' },
      { status: 400 },
    );
  }

  const result = toggleVote(sessionId, noteId, userName);

  if (!result.success) {
    return NextResponse.json(
      { error: result.message, session: result.session },
      { status: 400 },
    );
  }

  return NextResponse.json(result.session);
}
