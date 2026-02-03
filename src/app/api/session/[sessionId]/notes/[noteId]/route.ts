import { NextRequest, NextResponse } from 'next/server';
import { updateNote, deleteNote } from '@/lib/sessionStore';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; noteId: string }> }
) {
  const { sessionId, noteId } = await params;
  const body = await request.json();

  const session = updateNote(sessionId, noteId, body);
  return NextResponse.json(session);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; noteId: string }> }
) {
  const { sessionId, noteId } = await params;
  const session = deleteNote(sessionId, noteId);
  return NextResponse.json(session);
}
