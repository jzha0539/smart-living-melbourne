import { NextRequest, NextResponse } from 'next/server';
import { getSpacesFromRealSources } from '../../../lib/server/external/spaces';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q') ?? '';
    const category = (request.nextUrl.searchParams.get('category') ?? 'all') as
      | 'all'
      | 'Library'
      | 'Park'
      | 'Public Lounge';
    const activity = (request.nextUrl.searchParams.get('activity') ?? 'study') as
      | 'study'
      | 'remote work'
      | 'relax';
    const sortBy = (request.nextUrl.searchParams.get('sortBy') ?? 'best') as
      | 'best'
      | 'quiet'
      | 'comfort'
      | 'distance';

    const spaces = await getSpacesFromRealSources({
      search: q,
      category,
      activity,
      sortBy,
    });

    return NextResponse.json({
      success: true,
      count: spaces.length,
      data: spaces,
    });
  } catch (error) {
    console.error('GET /api/spaces error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch spaces.' },
      { status: 500 }
    );
  }
}