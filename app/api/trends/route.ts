import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

type TrendRow = {
  record_hour: number | string | null;
  avg_noise: number | string | null;
  readings_count: number | string | null;
};

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function getNoiseLabel(noise: number): string {
  if (noise <= 40) return 'Library Quiet';
  if (noise <= 50) return 'Very Calm';
  if (noise <= 60) return 'Moderate';
  return 'Active Zone';
}

export async function GET() {
  try {
    const result = await pool.query<TrendRow>(`
      SELECT
        record_hour,
        ROUND(AVG(noise)::numeric, 1) AS avg_noise,
        COUNT(*) AS readings_count
      FROM sensor_readings
      WHERE noise IS NOT NULL
        AND record_hour IS NOT NULL
      GROUP BY record_hour
      ORDER BY record_hour ASC
    `);

    const hourly = Array.from({ length: 24 }, (_, hour) => {
      const found = result.rows.find(
        (row) => toNumber(row.record_hour, -1) === hour
      );

      const avgNoise = found ? toNumber(found.avg_noise, 0) : 0;
      const readings = found ? toNumber(found.readings_count, 0) : 0;

      return {
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        avgNoise,
        readings,
        level: getNoiseLabel(avgNoise),
      };
    });

    const available = hourly.filter((item) => item.readings > 0);
    const quietest = [...available].sort((a, b) => a.avgNoise - b.avgNoise)[0] ?? null;
    const busiest = [...available].sort((a, b) => b.avgNoise - a.avgNoise)[0] ?? null;

    return NextResponse.json({
      success: true,
      data: {
        hourly,
        quietest,
        busiest,
      },
    });
  } catch (error) {
    console.error('GET /api/trends failed:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch historical trend data.',
      },
      { status: 500 }
    );
  }
}