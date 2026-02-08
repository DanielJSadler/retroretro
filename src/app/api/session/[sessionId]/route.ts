import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateParticipantLastSeen } from '@/lib/sessionStore';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = getSession(sessionId);

  if (!session) {
    return NextResponse.json({ error: 'Board not found' }, { status: 404 });
  }

  // Update participant last seen from header if present
  const userName = request.headers.get('x-user-name');
  if (userName) {
    updateParticipantLastSeen(sessionId, userName);
  }

  return NextResponse.json(session);
}
