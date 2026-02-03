import { NextRequest, NextResponse } from 'next/server';
import { resetTimer } from '@/lib/sessionStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const session = resetTimer(sessionId);
  return NextResponse.json(session);
}
