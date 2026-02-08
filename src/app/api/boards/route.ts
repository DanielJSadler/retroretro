import { NextRequest, NextResponse } from 'next/server';
import {
  generateBoardId,
  createSession,
  getBoardsByIds,
} from '@/lib/sessionStore';
import { Section } from '@/types';

// POST - Create a new board
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, createdBy, sections } = body as {
      name: string;
      createdBy: string;
      sections?: Section[];
    };

    if (!name || !createdBy) {
      return NextResponse.json(
        { error: 'name and createdBy are required' },
        { status: 400 },
      );
    }

    const boardId = generateBoardId();
    const session = createSession(boardId, name, createdBy, sections || []);

    return NextResponse.json({
      id: session.id,
      name: session.name,
      createdAt: session.createdAt,
      createdBy: session.createdBy,
    });
  } catch (error) {
    console.error('Failed to create board:', error);
    return NextResponse.json(
      { error: 'Failed to create board' },
      { status: 500 },
    );
  }
}

// GET - Get boards by IDs (passed as query param)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ boards: [] });
    }

    const ids = idsParam.split(',').filter(Boolean);
    const boards = getBoardsByIds(ids);

    return NextResponse.json({ boards });
  } catch (error) {
    console.error('Failed to get boards:', error);
    return NextResponse.json(
      { error: 'Failed to get boards' },
      { status: 500 },
    );
  }
}
