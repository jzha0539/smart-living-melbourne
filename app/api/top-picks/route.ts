import { NextRequest, NextResponse } from 'next/server';
import { getTopPicksFromRealSources } from '../../../lib/server/external/spaces';

export async function GET(request: NextRequest) {
  try {
    const activity = (request.nextUrl.searchParams.get('activity') ?? 'study') as
      | 'study'
      | 'remote work'
      | 'relax';

    const topPicks = await getTopPicksFromRealSources(activity);

    return NextResponse.json({
      success: true,
      count: topPicks.length,
      data: topPicks,
    });
  } catch (error) {
    console.error('GET /api/top-picks error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch top picks.' },
      { status: 500 }
    );
  }
}