import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type MapboxRetrieveFeature = {
  type?: string;
  geometry?: {
    type?: string;
    coordinates?: [number, number];
  };
  properties?: {
    name?: string;
    name_preferred?: string;
    full_address?: string;
    place_formatted?: string;
    address?: string;
    mapbox_id?: string;
    feature_type?: string;
  };
};

type MapboxRetrieveResponse = {
  features?: MapboxRetrieveFeature[];
};

const MELBOURNE_BBOX = {
  minLon: 144.5,
  minLat: -38.45,
  maxLon: 145.65,
  maxLat: -37.45,
};

function getToken() {
  return process.env.MAPBOX_ACCESS_TOKEN || process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
}

function isValidMelbourneCoordinate(latitude: number, longitude: number) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= MELBOURNE_BBOX.minLat &&
    latitude <= MELBOURNE_BBOX.maxLat &&
    longitude >= MELBOURNE_BBOX.minLon &&
    longitude <= MELBOURNE_BBOX.maxLon
  );
}

function buildLabel(feature: MapboxRetrieveFeature) {
  const properties = feature.properties;
  const name = properties?.name_preferred || properties?.name || '';
  const detail =
    properties?.full_address ||
    properties?.place_formatted ||
    properties?.address ||
    '';

  if (name && detail && !detail.toLowerCase().includes(name.toLowerCase())) {
    return `${name}, ${detail}`;
  }

  return detail || name || 'Selected location';
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

    const mapboxId = request.nextUrl.searchParams.get('mapboxId');
    const sessionToken =
      request.nextUrl.searchParams.get('sessionToken') ||
      request.nextUrl.searchParams.get('session_token') ||
      '';

    if (!mapboxId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing mapboxId.',
        },
        { status: 400 }
      );
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

    const url = new URL(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}`
    );

    url.searchParams.set('access_token', token);
    url.searchParams.set('session_token', sessionToken);

    const response = await fetch(url.toString(), {
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text();

      return NextResponse.json(
        {
          success: false,
          message: `Mapbox retrieve failed: ${response.status}`,
          detail: text,
        },
        { status: response.status }
      );
    }

    const json = (await response.json()) as MapboxRetrieveResponse;
    const feature = json.features?.[0];

    const coordinates = feature?.geometry?.coordinates;

    if (!coordinates || coordinates.length !== 2) {
      return NextResponse.json(
        {
          success: false,
          message: 'No coordinates found for selected location.',
        },
        { status: 404 }
      );
    }

    const longitude = Number(coordinates[0]);
    const latitude = Number(coordinates[1]);

    if (!isValidMelbourneCoordinate(latitude, longitude)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Selected location is outside the Melbourne search area.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        label: buildLabel(feature),
        latitude,
        longitude,
        source: 'mapbox-searchbox',
      },
    });
  } catch (error) {
    console.error('GET /api/search-retrieve failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to retrieve selected location.',
      },
      { status: 500 }
    );
  }
}