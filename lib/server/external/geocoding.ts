import { requireEnv, serverConfig } from '../config';

export interface GeocodingResult {
  name: string;
  latitude: number;
  longitude: number;
  placeName: string;
}

interface MapboxFeature {
  place_name: string;
  center: [number, number];
  text: string;
}

interface MapboxGeocodingResponse {
  features: MapboxFeature[];
}

export async function geocodePlace(query: string): Promise<GeocodingResult | null> {
  const token = requireEnv(serverConfig.mapboxAccessToken, 'MAPBOX_ACCESS_TOKEN');

  const encoded = encodeURIComponent(query);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${token}&limit=1&country=AU`;

  const response = await fetch(url, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Mapbox geocoding failed: ${response.status}`);
  }

  const data = (await response.json()) as MapboxGeocodingResponse;
  const feature = data.features?.[0];

  if (!feature) return null;

  return {
    name: feature.text,
    longitude: feature.center[0],
    latitude: feature.center[1],
    placeName: feature.place_name,
  };
}