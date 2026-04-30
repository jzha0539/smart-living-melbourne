import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../../lib/db';

export const dynamic = 'force-dynamic';

type PlaceRow = {
  place_name: string | null;
  place_type: string | null;
  latitude: number | string | null;
  longitude: number | string | null;
  reading_count: number | string | null;
};

type TrendRow = {
  record_hour: number | string | null;
  avg_noise: number | string | null;
  min_noise: number | string | null;
  max_noise: number | string | null;
  reading_count: number | string | null;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function getNoiseZone(noiseDb: number) {
  if (noiseDb < 50) return 'Library Quiet';
  if (noiseDb < 60) return 'Calm Zone';
  if (noiseDb < 70) return 'Active Zone';
  return 'Loud Zone';
}

function formatHourRange(hour: number) {
  const nextHour = (hour + 1) % 24;

  const format = (h: number) => {
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  return `${format(hour)} - ${format(nextHour)}`;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeName = searchParams.get('placeName');

    const placesResult = await pool.query<PlaceRow>(`
      SELECT
        place_name,
        place_type,
        ROUND(AVG(latitude)::numeric, 6) AS latitude,
        ROUND(AVG(longitude)::numeric, 6) AS longitude,
        COUNT(*) AS reading_count
      FROM sensor_readings
      WHERE place_name IS NOT NULL
      GROUP BY place_name, place_type
      ORDER BY place_name ASC;
    `);

    const places = placesResult.rows.map((row) => ({
      placeName: row.place_name ?? '',
      placeType: row.place_type ?? 'unknown',
      latitude: toNumber(row.latitude),
      longitude: toNumber(row.longitude),
      readingCount: toNumber(row.reading_count),
    }));

    const selectedPlaceName = placeName || places[0]?.placeName;

    if (!selectedPlaceName) {
      return NextResponse.json({
        places: [],
        selectedPlaceName: null,
        hourlyData: [],
      });
    }

    const trendsResult = await pool.query<TrendRow>(
      `
      SELECT
        record_hour,
        COUNT(*) AS reading_count,
        ROUND(AVG(noise)::numeric, 2) AS avg_noise,
        ROUND(MIN(noise)::numeric, 2) AS min_noise,
        ROUND(MAX(noise)::numeric, 2) AS max_noise
      FROM sensor_readings
      WHERE
        place_name = $1
        AND record_hour IS NOT NULL
        AND noise IS NOT NULL
      GROUP BY record_hour
      ORDER BY record_hour ASC;
      `,
      [selectedPlaceName]
    );

    const rowsByHour = new Map<number, TrendRow>();

    trendsResult.rows.forEach((row) => {
      rowsByHour.set(toNumber(row.record_hour, -1), row);
    });

    const hourlyData = Array.from({ length: 24 }, (_, hour) => {
      const row = rowsByHour.get(hour);
      const noiseDb =
        row?.avg_noise === null || row?.avg_noise === undefined
          ? null
          : toNumber(row.avg_noise);

      return {
        hour,
        label: String(hour).padStart(2, '0'),
        range: formatHourRange(hour),
        noiseDb,
        minNoise:
          row?.min_noise === null || row?.min_noise === undefined
            ? null
            : toNumber(row.min_noise),
        maxNoise:
          row?.max_noise === null || row?.max_noise === undefined
            ? null
            : toNumber(row.max_noise),
        readingCount: row?.reading_count ? toNumber(row.reading_count) : 0,
        zone: noiseDb === null ? 'No Data' : getNoiseZone(noiseDb),
      };
    });

    return NextResponse.json({
      places,
      selectedPlaceName,
      hourlyData,
    });
  } catch (error) {
    console.error('GET /api/trends/noise failed:', error);

    return NextResponse.json(
      {
        error: 'Failed to load noise trend data',
      },
      { status: 500 }
    );
  }
}