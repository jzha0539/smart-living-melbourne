import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type MapboxSuggestItem = {
  name?: string;
  name_preferred?: string;
  mapbox_id?: string;
  feature_type?: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  context?: {
    country?: { name?: string };
    region?: { name?: string };
    postcode?: { name?: string };
    place?: { name?: string };
    locality?: { name?: string };
    neighborhood?: { name?: string };
    street?: { name?: string };
  };
};

type MapboxSuggestResponse = {
  suggestions?: MapboxSuggestItem[];
};

const MELBOURNE_BBOX = '144.5,-38.45,145.65,-37.45';
const MELBOURNE_PROXIMITY = '144.9631,-37.8136';

function getToken() {
  return process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
}

function cleanQuery(query: string) {
  return query
    .trim()
    .replace(/\bst\b/gi, 'street')
    .replace(/\brd\b/gi, 'road')
    .replace(/\bave\b/gi, 'avenue')
    .replace(/\bdr\b/gi, 'drive')
    .replace(/\bln\b/gi, 'lane')
    .replace(/\s+/g, ' ');
}

function buildLabel(item: MapboxSuggestItem) {
  const name = item.name_preferred || item.name || '';
  const detail = item.full_address || item.place_formatted || item.address || '';

  if (name && detail && !detail.toLowerCase().includes(name.toLowerCase())) {
    return `${name}, ${detail}`;
  }

  return detail || name || 'Unknown location';
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken();

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing Mapbox token.',
        },
        { status: 500 }
      );
    }

    const rawQuery = request.nextUrl.searchParams.get('q')?.trim();
    const sessionToken =
      request.nextUrl.searchParams.get('sessionToken') ||
      request.nextUrl.searchParams.get('session_token') ||
      '';

    if (!rawQuery) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (!sessionToken) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing sessionToken.',
        },
        { status: 400 }
      );
    }

    const query = cleanQuery(rawQuery);

    const url = new URL('https://api.mapbox.com/search/searchbox/v1/suggest');

    url.searchParams.set('q', query);
    url.searchParams.set('access_token', token);
    url.searchParams.set('session_token', sessionToken);
    url.searchParams.set('country', 'au');
    url.searchParams.set('language', 'en');
    url.searchParams.set('limit', '6');
    url.searchParams.set('bbox', MELBOURNE_BBOX);
    url.searchParams.set('proximity', MELBOURNE_PROXIMITY);
    url.searchParams.set('types', 'address,street,poi,place,locality,neighborhood,postcode');

    const response = await fetch(url.toString(), {
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();

      return NextResponse.json(
        {
          success: false,
          message: `Mapbox suggest failed: ${response.status}`,
          detail: text,
        },
        { status: response.status }
      );
    }

    const json = (await response.json()) as MapboxSuggestResponse;

    const suggestions =
      json.suggestions
        ?.filter((item) => item.mapbox_id)
        .map((item) => ({
          mapboxId: item.mapbox_id,
          name: item.name_preferred || item.name || 'Unknown location',
          label: buildLabel(item),
          featureType: item.feature_type || '',
          postcode: item.context?.postcode?.name || '',
          suburb:
            item.context?.locality?.name ||
            item.context?.neighborhood?.name ||
            item.context?.place?.name ||
            '',
        })) ?? [];

    return NextResponse.json({
      success: true,
      data: suggestions,
    });
  } catch (error) {
    console.error('GET /api/search-suggest failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch search suggestions.',
      },
      { status: 500 }
    );
  }
}