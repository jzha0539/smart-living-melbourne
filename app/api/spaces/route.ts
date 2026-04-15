import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

type DbRow = Record<string, unknown>;

function pickString(row: DbRow, keys: string[], fallback = ''): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return fallback;
}

function pickNumber(row: DbRow, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }
  return fallback;
}

function normalizePlaceType(placeType: string): string {
  const lower = placeType.toLowerCase();

  if (lower.includes('park')) return 'Park';
  if (lower.includes('rooftop')) return 'Rooftop';
  if (lower.includes('urban')) return 'Urban';
  return 'Outdoor';
}

function getCrowdLabel(noise: number): string {
  if (noise <= 50) return 'Low';
  if (noise <= 65) return 'Moderate';
  return 'Busy';
}

function getQuietTime(noise: number): string {
  if (noise <= 50) return '7–9 AM';
  if (noise <= 65) return '10–11 AM';
  return '2–4 PM';
}

function getActivityFit(placeType: string, noise: number): string[] {
  const lower = placeType.toLowerCase();

  if (lower.includes('rooftop')) {
    return noise <= 60 ? ['remote work', 'relax'] : ['relax'];
  }

  if (lower.includes('park')) {
    return noise <= 60 ? ['relax', 'study'] : ['relax'];
  }

  if (noise <= 55) {
    return ['study', 'remote work'];
  }

  return ['relax', 'remote work'];
}

function getReason(name: string, noise: number, placeType: string): string {
  const roundedNoise = Math.round(noise);
  const lower = placeType.toLowerCase();

  if (roundedNoise <= 50) {
    return `${name} has a relatively low measured noise level (${roundedNoise} dB), making it suitable for focused study and quiet breaks.`;
  }

  if (lower.includes('park')) {
    return `${name} offers outdoor access with moderate environmental activity (${roundedNoise} dB), which works well for short breaks and relaxed stays.`;
  }

  if (roundedNoise <= 65) {
    return `${name} shows moderate noise conditions (${roundedNoise} dB), suitable for casual work, short stays, or light study.`;
  }

  return `${name} is more active (${roundedNoise} dB) but can still support short visits, movement breaks, and quick outdoor use.`;
}

function mapRowToSpace(row: DbRow, index: number) {
  const latitude = pickNumber(row, ['latitude', 'lat'], -37.8136);
  const longitude = pickNumber(row, ['longitude', 'lng', 'lon'], 144.9631);

  const placeName = pickString(row, ['place_name'], `Sensor Location ${index + 1}`);
  const placeType = pickString(row, ['place_type'], 'Outdoor');
  const noise = pickNumber(row, ['noise'], 60);

  const category = normalizePlaceType(placeType);
  const crowd = getCrowdLabel(noise);
  const quietTime = getQuietTime(noise);
  const activityFit = getActivityFit(placeType, noise);

  return {
    id: index + 1,
    name: placeName,
    suburb: placeType || 'Melbourne',
    category,
    distance: Number((1 + (index % 5) * 0.4).toFixed(1)),
    noiseDb: Math.round(noise),
    comfort: Math.max(35, Math.min(95, Math.round(100 - noise * 0.6))),
    shade: category === 'Park' ? 75 : category === 'Rooftop' ? 40 : 55,
    crowd,
    quietTime,
    reason: getReason(placeName, noise, placeType),
    activityFit,
    latitude,
    longitude,
  };
}

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT DISTINCT ON (place_name)
        place_name,
        place_type,
        latitude,
        longitude,
        noise,
        recorded_at
      FROM sensor_readings
      WHERE noise IS NOT NULL
        AND latitude IS NOT NULL
        AND longitude IS NOT NULL
        AND place_name IS NOT NULL
      ORDER BY place_name, recorded_at DESC
      LIMIT 50
    `);

    const spaces = result.rows.map((row: DbRow, index: number) => mapRowToSpace(row, index));

    return NextResponse.json({
      success: true,
      count: spaces.length,
      data: spaces,
    });
  } catch (error) {
    console.error('GET /api/spaces failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch spaces from database.',
      },
      { status: 500 }
    );
  }
}