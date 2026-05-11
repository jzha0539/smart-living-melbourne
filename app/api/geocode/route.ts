import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

type MapboxFeature = {
  place_name?: string;
  text?: string;
  center?: [number, number];
  geometry?: {
    coordinates?: [number, number];
  };
  context?: Array<{
    id?: string;
    text?: string;
    short_code?: string;
  }>;
  properties?: {
    address?: string;
    category?: string;
  };
};

type MapboxResponse = {
  features?: MapboxFeature[];
};

type NominatimResult = {
  display_name?: string;
  lat?: string;
  lon?: string;
};

type GeocodeResult = {
  label: string;
  latitude: number;
  longitude: number;
  source: 'mapbox' | 'nominatim';
};

const MELBOURNE_BBOX = {
  minLon: 144.5,
  minLat: -38.45,
  maxLon: 145.65,
  maxLat: -37.45,
};

const MELBOURNE_PROXIMITY = {
  longitude: 144.9631,
  latitude: -37.8136,
};

const GENERIC_WORDS = new Set([
  'street',
  'st',
  'road',
  'rd',
  'avenue',
  'ave',
  'drive',
  'dr',
  'lane',
  'ln',
  'place',
  'pl',
  'parade',
  'pde',
  'court',
  'ct',
  'way',
  'melbourne',
  'victoria',
  'vic',
  'australia',
  'au',
]);

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

function normaliseQuery(query: string) {
  return query
    .trim()
    .replace(/\bst\b/gi, 'street')
    .replace(/\brd\b/gi, 'road')
    .replace(/\bave\b/gi, 'avenue')
    .replace(/\bdr\b/gi, 'drive')
    .replace(/\bln\b/gi, 'lane')
    .replace(/\s+/g, ' ');
}

function normaliseText(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\bst\b/g, 'street')
    .replace(/\brd\b/g, 'road')
    .replace(/\bave\b/g, 'avenue')
    .replace(/\bdr\b/g, 'drive')
    .replace(/\bln\b/g, 'lane')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractPostcode(query: string) {
  const match = query.match(/\b(3\d{3})\b/);
  return match?.[1] ?? null;
}

function removePostcode(query: string) {
  return query.replace(/\b3\d{3}\b/g, '').replace(/\s+/g, ' ').trim();
}

function getImportantTokens(query: string) {
  return normaliseText(query)
    .split(/\s+/)
    .filter((token) => token.length >= 3)
    .filter((token) => !GENERIC_WORDS.has(token));
}

function looksLikeStreetSearch(query: string) {
  const q = normaliseText(query);

  return (
    /\b(street|road|avenue|drive|lane|place|parade|court|way)\b/.test(q) ||
    /\b(st|rd|ave|dr|ln|pl|pde|ct)\b/.test(query.toLowerCase())
  );
}

function getFeaturePostcode(feature: MapboxFeature) {
  const placeName = feature.place_name || '';
  const directMatch = placeName.match(/\b(3\d{3})\b/);

  if (directMatch) return directMatch[1];

  const contextText = feature.context?.map((item) => item.text).join(' ') || '';
  const contextMatch = contextText.match(/\b(3\d{3})\b/);

  return contextMatch?.[1] ?? null;
}

function scoreFeature(feature: MapboxFeature, query: string, postcode: string | null) {
  const placeName = feature.place_name || '';
  const normalisedPlace = normaliseText(placeName);
  const queryWithoutPostcode = removePostcode(query);
  const normalisedQuery = normaliseText(queryWithoutPostcode);
  const tokens = getImportantTokens(queryWithoutPostcode);
  const featurePostcode = getFeaturePostcode(feature);

  let score = 0;

  // 1. Exact / complete phrase match is strongest.
  if (normalisedPlace.includes(normalisedQuery)) {
    score += 220;
  }

  // 2. Important words must be present for full-name searches.
  for (const token of tokens) {
    if (normalisedPlace.includes(token)) {
      score += 45;
    } else {
      score -= looksLikeStreetSearch(query) ? 20 : 120;
    }
  }

  // 3. Postcode match should strongly prioritise the right area.
  if (postcode) {
    if (featurePostcode === postcode || normalisedPlace.includes(postcode)) {
      score += 180;
    } else {
      score -= 180;
    }
  }

  // 4. Avoid weak results that only match generic words like "university" or "street".
  if (!looksLikeStreetSearch(query) && tokens.length > 0) {
    const matchedImportantTokens = tokens.filter((token) =>
      normalisedPlace.includes(token)
    ).length;

    if (matchedImportantTokens === 0) {
      score -= 300;
    }

    if (tokens.length >= 2 && matchedImportantTokens < tokens.length) {
      score -= 120;
    }
  }

  // 5. Prefer Melbourne/Victoria results.
  if (normalisedPlace.includes('victoria') || normalisedPlace.includes('melbourne')) {
    score += 20;
  }

  return score;
}

function pickBestFeature(
  features: MapboxFeature[] | undefined,
  query: string,
  postcode: string | null
) {
  const validFeatures =
    features?.filter((feature) => {
      const center = feature.center || feature.geometry?.coordinates;

      if (!center || center.length !== 2) return false;

      const longitude = Number(center[0]);
      const latitude = Number(center[1]);

      return isValidMelbourneCoordinate(latitude, longitude);
    }) ?? [];

  const rankedFeatures = validFeatures
    .map((feature) => ({
      feature,
      score: scoreFeature(feature, query, postcode),
    }))
    .sort((a, b) => b.score - a.score);

  const best = rankedFeatures[0];

  if (!best) return null;

  // Full-name search should not accept a weak generic result.
  if (!looksLikeStreetSearch(query)) {
    const tokens = getImportantTokens(removePostcode(query));
    const place = normaliseText(best.feature.place_name || '');
    const matchedImportantTokens = tokens.filter((token) => place.includes(token)).length;

    if (tokens.length >= 2 && matchedImportantTokens < tokens.length) {
      return null;
    }

    if (best.score < 80) {
      return null;
    }
  }

  // Street + postcode should not accept the wrong postcode.
  if (postcode) {
    const featurePostcode = getFeaturePostcode(best.feature);
    const place = normaliseText(best.feature.place_name || '');

    if (featurePostcode !== postcode && !place.includes(postcode)) {
      return null;
    }
  }

  return best.feature;
}

async function geocodeWithMapbox(query: string): Promise<GeocodeResult | null> {
  const token =
    process.env.MAPBOX_ACCESS_TOKEN ||
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  if (!token) return null;

  const postcode = extractPostcode(query);
  const queryWithoutPostcode = removePostcode(query);

  let searchVariants: string[];

  if (postcode) {
    searchVariants = [
      `${queryWithoutPostcode}, ${postcode}, Victoria, Australia`,
      `${queryWithoutPostcode}, VIC ${postcode}, Australia`,
      `${queryWithoutPostcode}, Melbourne, Victoria ${postcode}, Australia`,
    ];
  } else if (looksLikeStreetSearch(query)) {
    searchVariants = [
      `${query}, Melbourne, Victoria, Australia`,
      `${query}, City of Melbourne, Victoria, Australia`,
      `${query}, Victoria, Australia`,
      query,
    ];
  } else {
    searchVariants = [
      `${query}, Victoria, Australia`,
      `${query}, Melbourne, Victoria, Australia`,
      query,
    ];
  }

  for (const searchText of searchVariants) {
    const url = new URL(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        searchText
      )}.json`
    );

    url.searchParams.set('access_token', token);
    url.searchParams.set('country', 'au');
    url.searchParams.set('limit', '10');
    url.searchParams.set('language', 'en');
    url.searchParams.set(
      'bbox',
      `${MELBOURNE_BBOX.minLon},${MELBOURNE_BBOX.minLat},${MELBOURNE_BBOX.maxLon},${MELBOURNE_BBOX.maxLat}`
    );
    url.searchParams.set(
      'proximity',
      `${MELBOURNE_PROXIMITY.longitude},${MELBOURNE_PROXIMITY.latitude}`
    );

    if (looksLikeStreetSearch(query)) {
      url.searchParams.set('types', 'address,street,place,locality,neighborhood,poi');
    } else {
      url.searchParams.set('types', 'poi,address,place,locality,neighborhood');
    }

    const response = await fetch(url.toString(), {
      cache: 'no-store',
    });

    if (!response.ok) continue;

    const json = (await response.json()) as MapboxResponse;
    const bestFeature = pickBestFeature(json.features, query, postcode);

    if (!bestFeature) continue;

    const center = bestFeature.center || bestFeature.geometry?.coordinates;

    if (!center) continue;

    const longitude = Number(center[0]);
    const latitude = Number(center[1]);

    return {
      label: bestFeature.place_name || searchText,
      latitude,
      longitude,
      source: 'mapbox',
    };
  }

  return null;
}

async function geocodeWithNominatim(query: string): Promise<GeocodeResult | null> {
  const postcode = extractPostcode(query);
  const queryWithoutPostcode = removePostcode(query);

  let searchVariants: string[];

  if (postcode) {
    searchVariants = [
      `${queryWithoutPostcode}, ${postcode}, Victoria, Australia`,
      `${queryWithoutPostcode}, VIC ${postcode}, Australia`,
      `${queryWithoutPostcode}, Australia`,
    ];
  } else if (looksLikeStreetSearch(query)) {
    searchVariants = [
      `${query}, Melbourne, Victoria, Australia`,
      `${query}, City of Melbourne, Victoria, Australia`,
      `${query}, Victoria, Australia`,
    ];
  } else {
    searchVariants = [
      `${query}, Victoria, Australia`,
      `${query}, Australia`,
    ];
  }

  for (const searchText of searchVariants) {
    const url = new URL('https://nominatim.openstreetmap.org/search');

    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '10');
    url.searchParams.set('countrycodes', 'au');
    url.searchParams.set('addressdetails', '1');
    url.searchParams.set('q', searchText);

    url.searchParams.set(
      'viewbox',
      `${MELBOURNE_BBOX.minLon},${MELBOURNE_BBOX.maxLat},${MELBOURNE_BBOX.maxLon},${MELBOURNE_BBOX.minLat}`
    );
    url.searchParams.set('bounded', '1');

    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: {
        'User-Agent': 'Smart-Living-Melbourne/1.0',
      },
    });

    if (!response.ok) continue;

    const results = (await response.json()) as NominatimResult[];

    const rankedResults = results
      .filter((item) => {
        const latitude = Number(item.lat);
        const longitude = Number(item.lon);

        return isValidMelbourneCoordinate(latitude, longitude);
      })
      .map((item) => {
        const placeName = item.display_name || '';
        const fakeFeature: MapboxFeature = {
          place_name: placeName,
          center: [Number(item.lon), Number(item.lat)],
        };

        return {
          item,
          score: scoreFeature(fakeFeature, query, postcode),
        };
      })
      .sort((a, b) => b.score - a.score);

    const best = rankedResults[0];

    if (!best) continue;

    if (postcode && !normaliseText(best.item.display_name || '').includes(postcode)) {
      continue;
    }

    if (!looksLikeStreetSearch(query) && best.score < 80) {
      continue;
    }

    const latitude = Number(best.item.lat);
    const longitude = Number(best.item.lon);

    return {
      label: best.item.display_name || searchText,
      latitude,
      longitude,
      source: 'nominatim',
    };
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const rawQuery = request.nextUrl.searchParams.get('q')?.trim();

    if (!rawQuery) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing search query.',
        },
        { status: 400 }
      );
    }

    const query = normaliseQuery(rawQuery);

    const mapboxResult = await geocodeWithMapbox(query);

    if (mapboxResult) {
      return NextResponse.json({
        success: true,
        data: mapboxResult,
      });
    }

    const nominatimResult = await geocodeWithNominatim(query);

    if (nominatimResult) {
      return NextResponse.json({
        success: true,
        data: nominatimResult,
      });
    }

    return NextResponse.json(
      {
        success: false,
        message: `No location found for "${rawQuery}".`,
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('GET /api/geocode failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to geocode location.',
      },
      { status: 500 }
    );
  }
}