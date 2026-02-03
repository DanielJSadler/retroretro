import { NextRequest, NextResponse } from 'next/server';
import { pauseTimer } from '@/lib/sessionStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = pauseTimer(sessionId);
  return NextResponse.json(session);
}
