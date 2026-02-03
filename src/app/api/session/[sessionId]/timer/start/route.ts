import { NextRequest, NextResponse } from 'next/server';
import { startTimer } from '@/lib/sessionStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { duration } = body;

  if (!duration || typeof duration !== 'number') {
    return NextResponse.json(
      { error: 'duration is required' },
      { status: 400 },
    );
  }

  const session = startTimer(sessionId, duration);
  return NextResponse.json(session);
}
