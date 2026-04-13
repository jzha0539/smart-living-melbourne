import { NextRequest, NextResponse } from 'next/server';
import { getSpaceDetailFromRealSources } from '../../../../lib/server/external/spaces';

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;
    const numericId = Number.parseInt(id, 10);

    if (!Number.isFinite(numericId)) {
      return NextResponse.json(
        { success: false, message: 'Invalid space id.' },
        { status: 400 }
      );
    }

    const space = await getSpaceDetailFromRealSources(numericId);

    if (!space) {
      return NextResponse.json(
        { success: false, message: 'Space not found.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: space,
    });
  } catch (error) {
    console.error('GET /api/spaces/[id] error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch space detail.' },
      { status: 500 }
    );
  }
}