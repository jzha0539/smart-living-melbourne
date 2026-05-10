import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

type DbRow = {
  poi_id: string | number | null;
  name: string | null;
  category: string | null;
  region: string | null;
  address: string | null;
  suburb: string | null;
  postcode: string | number | null;
  latitude: string | number | null;
  longitude: string | number | null;
  rating: string | number | null;
  rating_count: string | number | null;
  phone: string | null;
  opening_hours: string | null;
  is_24_7: boolean | string | number | null;
  noise_db: string | number | null;
  avg_wind_speed: string | number | null;
  air_temperature: string | number | null;
  relative_humidity: string | number | null;
  created_at: string | Date | null;
};

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return fallback;
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return fallback;
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;

  if (typeof value === 'number') return value === 1;

  if (typeof value === 'string') {
    const lower = value.toLowerCase().trim();
    return lower === 'true' || lower === 'yes' || lower === '1';
  }

  return false;
}

function normalizeCategory(category: string): 'study' | 'leisure' | 'culture' | 'lifestyle' {
  const lower = category.toLowerCase();

  if (lower.includes('study')) return 'study';
  if (lower.includes('leisure')) return 'leisure';
  if (lower.includes('culture')) return 'culture';
  if (lower.includes('lifestyle')) return 'lifestyle';

  return 'lifestyle';
}

function getDisplayCategory(category: string): string {
  const normalized = normalizeCategory(category);

  if (normalized === 'study') return 'Study';
  if (normalized === 'leisure') return 'Leisure';
  if (normalized === 'culture') return 'Culture';
  return 'Lifestyle';
}

function getNoiseLabel(noiseDb: number): string {
  if (noiseDb <= 40) return 'Library Quiet';
  if (noiseDb <= 50) return 'Very Calm';
  if (noiseDb <= 60) return 'Moderate';
  if (noiseDb <= 70) return 'Active';
  return 'Busy';
}

function getCrowdLabel(noiseDb: number): string {
  if (noiseDb <= 50) return 'Low';
  if (noiseDb <= 65) return 'Moderate';
  return 'Busy';
}

function getAirComfortLabel(temperature: number, humidity: number, windSpeed: number): string {
  const comfortableTemp = temperature >= 16 && temperature <= 26;
  const comfortableHumidity = humidity >= 35 && humidity <= 65;
  const comfortableWind = windSpeed <= 18;

  if (comfortableTemp && comfortableHumidity && comfortableWind) {
    return 'Comfortable';
  }

  if (temperature > 30) return 'Hot';
  if (temperature < 12) return 'Cold';
  if (humidity > 75) return 'Humid';
  if (windSpeed > 25) return 'Windy';

  return 'Fair';
}

function getComfortScore(noiseDb: number, temperature: number, humidity: number, windSpeed: number): number {
  let score = 100;

  score -= Math.max(0, noiseDb - 35) * 0.55;
  score -= Math.abs(temperature - 22) * 1.8;
  score -= Math.abs(humidity - 50) * 0.25;
  score -= Math.max(0, windSpeed - 12) * 1.2;

  return Math.max(30, Math.min(100, Math.round(score)));
}

function getRatingLabel(rating: number, ratingCount: number): string {
  if (!rating || ratingCount === 0) return 'No public rating yet';
  if (rating >= 4.6 && ratingCount >= 100) return 'Highly rated';
  if (rating >= 4.2) return 'Well rated';
  if (rating >= 3.8) return 'Generally positive';
  return 'Mixed reviews';
}

function getOpeningStatus(openingHours: string, is24_7: boolean): string {
  if (is24_7) return 'Open 24 hours';
  if (!openingHours) return 'Opening hours unavailable';
  return openingHours;
}

function getPrimaryUse(category: string): string {
  const normalized = normalizeCategory(category);

  if (normalized === 'study') return 'Study or remote work';
  if (normalized === 'leisure') return 'Relaxation and outdoor breaks';
  if (normalized === 'culture') return 'Cultural visits and exploration';
  return 'Food, shopping, social visits, and daily lifestyle';
}

function getActivityFit(category: string, noiseDb: number, rating: number, is24_7: boolean): string[] {
  const normalized = normalizeCategory(category);
  const activities: string[] = [];

  if (normalized === 'study') {
    activities.push('study');
    activities.push('remote work');

    if (noiseDb <= 55) {
      activities.push('deep focus');
    }

    if (is24_7) {
      activities.push('late-night study');
    }
  }

  if (normalized === 'leisure') {
    activities.push('relax');
    activities.push('outdoor break');

    if (noiseDb <= 60) {
      activities.push('light study');
    }
  }

  if (normalized === 'culture') {
    activities.push('explore');
    activities.push('relax');

    if (rating >= 4.3) {
      activities.push('recommended visit');
    }
  }

  if (normalized === 'lifestyle') {
    activities.push('social visit');
    activities.push('food and shopping');

    if (noiseDb <= 60) {
      activities.push('casual work');
    }

    if (is24_7) {
      activities.push('late visit');
    }
  }

  return [...new Set(activities)];
}

function getRecommendationReason(params: {
  name: string;
  category: string;
  noiseDb: number;
  rating: number;
  ratingCount: number;
  suburb: string;
  openingHours: string;
  is24_7: boolean;
  temperature: number;
  humidity: number;
  windSpeed: number;
}): string {
  const {
    name,
    category,
    noiseDb,
    rating,
    ratingCount,
    suburb,
    openingHours,
    is24_7,
    temperature,
    humidity,
    windSpeed,
  } = params;

  const displayCategory = getDisplayCategory(category);
  const noiseLabel = getNoiseLabel(noiseDb);
  const comfortLabel = getAirComfortLabel(temperature, humidity, windSpeed);
  const ratingText =
    rating > 0 && ratingCount > 0
      ? `It has a public rating of ${rating.toFixed(1)} from ${ratingCount} reviews`
      : 'It does not have enough public rating information yet';

  const openingText = is24_7
    ? 'It is available 24 hours'
    : openingHours
      ? 'Opening hours are available for planning'
      : 'Opening hours are not currently available';

  return `${name} is a ${displayCategory.toLowerCase()} place in ${
    suburb || 'Melbourne'
  }. ${ratingText}. The measured noise level is around ${Math.round(
    noiseDb
  )} dB, which is labelled as ${noiseLabel}. Current environmental comfort is ${comfortLabel.toLowerCase()} based on temperature, humidity, and wind speed. ${openingText}.`;
}

function mapRowToSpace(row: DbRow) {
  const id = toStringValue(row.poi_id);
  const googlePlaceId = id;

  const name = toStringValue(row.name, 'Unnamed place');
  const rawCategory = toStringValue(row.category, 'lifestyle');
  const category = normalizeCategory(rawCategory);
  const displayCategory = getDisplayCategory(rawCategory);

  const region = toStringValue(row.region);
  const address = toStringValue(row.address);
  const suburb = toStringValue(row.suburb, 'Melbourne');
  const postcode = toStringValue(row.postcode);
  const latitude = toNumber(row.latitude, -37.8136);
  const longitude = toNumber(row.longitude, 144.9631);

  const rating = toNumber(row.rating, 0);
  const ratingCount = Math.round(toNumber(row.rating_count, 0));
  const phone = toStringValue(row.phone);
  const openingHours = toStringValue(row.opening_hours);
  const is24_7 = toBoolean(row.is_24_7);

  const noiseDb = toNumber(row.noise_db, 60);
  const windSpeed = toNumber(row.avg_wind_speed, 0);
  const temperature = toNumber(row.air_temperature, 22);
  const humidity = toNumber(row.relative_humidity, 50);

  const comfort = getComfortScore(noiseDb, temperature, humidity, windSpeed);
  const noiseLabel = getNoiseLabel(noiseDb);
  const crowd = getCrowdLabel(noiseDb);
  const airComfort = getAirComfortLabel(temperature, humidity, windSpeed);
  const ratingLabel = getRatingLabel(rating, ratingCount);
  const openingStatus = getOpeningStatus(openingHours, is24_7);
  const activityFit = getActivityFit(rawCategory, noiseDb, rating, is24_7);

  return {
    id,
    googlePlaceId,

    name,
    category,
    displayCategory,
    primaryUse: getPrimaryUse(rawCategory),

    region,
    address,
    suburb,
    postcode,
    latitude,
    longitude,

    rating,
    ratingCount,
    ratingLabel,

    phone,
    hasPhone: Boolean(phone),
    openingHours,
    openingStatus,
    is24_7,

    noiseDb: Math.round(noiseDb),
    noiseLabel,
    crowd,

    windSpeed,
    temperature,
    humidity,
    airComfort,

    comfort,
    activityFit,

    reason: getRecommendationReason({
      name,
      category: rawCategory,
      noiseDb,
      rating,
      ratingCount,
      suburb,
      openingHours,
      is24_7,
      temperature,
      humidity,
      windSpeed,
    }),

    createdAt: row.created_at,
  };
}

export async function GET() {
  try {
    const result = await pool.query<DbRow>(`
      SELECT
        poi_id,
        name,
        category,
        region,
        address,
        suburb,
        postcode,
        latitude,
        longitude,
        rating,
        rating_count,
        phone,
        opening_hours,
        is_24_7,
        noise_db,
        avg_wind_speed,
        air_temperature,
        relative_humidity,
        created_at
      FROM poi_locations
      WHERE latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND name IS NOT NULL
      ORDER BY
        category ASC,
        rating DESC NULLS LAST,
        rating_count DESC NULLS LAST,
        name ASC
      LIMIT 600
    `);

    const spaces = result.rows.map((row) => mapRowToSpace(row));

    const categorySummary = spaces.reduce<Record<string, number>>((summary, space) => {
      summary[space.category] = (summary[space.category] || 0) + 1;
      return summary;
    }, {});

    return NextResponse.json({
      success: true,
      count: spaces.length,
      categories: categorySummary,
      data: spaces,
    });
  } catch (error) {
    console.error('GET /api/spaces failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch POI locations from database.',
      },
      { status: 500 }
    );
  }
}