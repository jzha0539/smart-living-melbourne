import { NextRequest, NextResponse } from 'next/server';
import { getSpacesFromRealSources } from '../../../lib/server/external/spaces';

export async function GET(request: NextRequest) {
  try {
    const activity = (request.nextUrl.searchParams.get('activity') ?? 'study') as
      | 'study'
      | 'remote work'
      | 'relax';

    const spaces = await getSpacesFromRealSources({
      activity,
      category: 'all',
      sortBy: 'best',
    });

    const quietSpaces = spaces.filter((space) => space.noiseDb <= 40).length;
    const nearbyChoices = spaces.filter((space) => space.distance <= 1.5).length;
    const highShadeSpots = spaces.filter((space) => space.shade >= 80).length;
    const averageComfort =
      spaces.length > 0
        ? Math.round(spaces.reduce((sum, space) => sum + space.comfort, 0) / spaces.length)
        : 0;

    return NextResponse.json({
      success: true,
      data: {
        activity,
        bestMatch: spaces[0] ?? null,
        stats: {
          quietSpaces,
          nearbyChoices,
          highShadeSpots,
          averageComfort,
          totalSpaces: spaces.length,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/insights error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch insights.' },
      { status: 500 }
    );
  }
}