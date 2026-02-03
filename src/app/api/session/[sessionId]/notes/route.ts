import { NextRequest, NextResponse } from 'next/server';
import { addNote } from '@/lib/sessionStore';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  const { sessionId } = await params;
  const body = await request.json();
  const { content, color, position, createdBy, sectionId } = body;

  if (!content || !color || !position || !createdBy || !sectionId) {
    return NextResponse.json(
      {
        error:
          'content, color, position, createdBy, and sectionId are required',
      },
      { status: 400 },
    );
  }

  const session = addNote(sessionId, {
    content,
    color,
    position,
    createdBy,
    sectionId,
  });

  return NextResponse.json(session);
}
