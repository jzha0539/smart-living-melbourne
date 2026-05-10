import { NextRequest, NextResponse } from 'next/server';
import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

type PoiRow = {
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

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
    return Number(value);
  }

  return fallback;
}

function toStringValue(value: unknown, fallback = ''): string {
  if (typeof value === 'string' && value.trim()) return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
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

function getNoiseZone(noiseDb: number) {
  if (noiseDb < 50) return 'Library Quiet';
  if (noiseDb < 60) return 'Calm Zone';
  if (noiseDb < 70) return 'Active Zone';
  return 'Loud Zone';
}

function getComfortLabel(score: number) {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Good';
  if (score >= 55) return 'Fair';
  return 'Low';
}

function getComfortScore(noiseDb: number, temperature: number, humidity: number, windSpeed: number) {
  let score = 100;

  score -= Math.max(0, noiseDb - 35) * 0.55;
  score -= Math.abs(temperature - 22) * 1.8;
  score -= Math.abs(humidity - 50) * 0.25;
  score -= Math.max(0, windSpeed - 12) * 1.2;

  return Math.max(30, Math.min(100, Math.round(score)));
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

function getEstimatedHourlyNoise(baseNoise: number, hour: number, category: string) {
  const lower = category.toLowerCase();

  let adjustment = 0;

  if (hour >= 7 && hour <= 9) adjustment -= 4;
  if (hour >= 10 && hour <= 12) adjustment -= 1;
  if (hour >= 13 && hour <= 16) adjustment += 2;
  if (hour >= 17 && hour <= 20) adjustment += 5;
  if (hour >= 21 || hour <= 5) adjustment -= 6;

  if (lower.includes('lifestyle') && hour >= 18 && hour <= 22) adjustment += 5;
  if (lower.includes('study') && hour >= 9 && hour <= 16) adjustment += 1;
  if (lower.includes('leisure') && hour >= 12 && hour <= 17) adjustment += 3;
  if (lower.includes('culture') && hour >= 18 && hour <= 21) adjustment += 4;

  return Math.max(25, Math.min(85, Number((baseNoise + adjustment).toFixed(1))));
}

function getEstimatedHourlyTemperature(baseTemperature: number, hour: number) {
  let adjustment = 0;

  if (hour >= 0 && hour <= 5) adjustment -= 4;
  if (hour >= 6 && hour <= 9) adjustment -= 2;
  if (hour >= 12 && hour <= 16) adjustment += 3;
  if (hour >= 17 && hour <= 20) adjustment += 1;
  if (hour >= 21) adjustment -= 2;

  return Number((baseTemperature + adjustment).toFixed(1));
}

function getEstimatedHourlyWind(baseWind: number, hour: number) {
  let adjustment = 0;

  if (hour >= 12 && hour <= 17) adjustment += 2;
  if (hour >= 21 || hour <= 6) adjustment -= 1;

  return Math.max(0, Number((baseWind + adjustment).toFixed(1)));
}

function parseHourFromTimeText(text: string): number | null {
  const cleaned = text.trim().toLowerCase();

  const match = cleaned.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
  if (!match) return null;

  let hour = Number(match[1]);
  const period = match[3];

  if (period === 'pm' && hour < 12) hour += 12;
  if (period === 'am' && hour === 12) hour = 0;

  if (hour < 0 || hour > 23) return null;
  return hour;
}

function getOpenHoursFromOpeningText(openingHours: string, is24_7: boolean): number[] {
  if (is24_7) {
    return Array.from({ length: 24 }, (_, hour) => hour);
  }

  const text = openingHours.toLowerCase();

  if (!text.trim()) {
    return Array.from({ length: 24 }, (_, hour) => hour);
  }

  if (
    text.includes('24 hours') ||
    text.includes('open 24') ||
    text.includes('24/7') ||
    text.includes('always open')
  ) {
    return Array.from({ length: 24 }, (_, hour) => hour);
  }

  if (
    text.includes('closed') &&
    !text.includes('open') &&
    !text.match(/\d{1,2}/)
  ) {
    return [];
  }

  const timeRangeMatch = text.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:–|-|to)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/
  );

  if (!timeRangeMatch) {
    return Array.from({ length: 24 }, (_, hour) => hour);
  }

  const startHour = parseHourFromTimeText(timeRangeMatch[1]);
  const endHour = parseHourFromTimeText(timeRangeMatch[2]);

  if (startHour === null || endHour === null) {
    return Array.from({ length: 24 }, (_, hour) => hour);
  }

  const hours: number[] = [];

  if (startHour === endHour) {
    return Array.from({ length: 24 }, (_, hour) => hour);
  }

  if (startHour < endHour) {
    for (let hour = startHour; hour < endHour; hour += 1) {
      hours.push(hour);
    }
  } else {
    for (let hour = startHour; hour < 24; hour += 1) {
      hours.push(hour);
    }

    for (let hour = 0; hour < endHour; hour += 1) {
      hours.push(hour);
    }
  }

  return [...new Set(hours)];
}

function getOpeningSummary(openingHours: string, is24_7: boolean) {
  if (is24_7) return 'Open 24 hours';
  if (!openingHours.trim()) return 'Hours vary by show';
  return openingHours;
}

function mapPlace(row: PoiRow) {
  const openingHours = toStringValue(row.opening_hours);
  const is24_7 = toBoolean(row.is_24_7);
  const openHours = getOpenHoursFromOpeningText(openingHours, is24_7);

  return {
    poiId: toStringValue(row.poi_id),
    placeName: toStringValue(row.name, 'Unnamed place'),
    placeType: toStringValue(row.category, 'lifestyle'),

    category: toStringValue(row.category, 'lifestyle'),
    address: toStringValue(row.address),
    suburb: toStringValue(row.suburb, 'Melbourne'),
    postcode: toStringValue(row.postcode),

    latitude: toNumber(row.latitude, -37.8136),
    longitude: toNumber(row.longitude, 144.9631),

    rating: toNumber(row.rating, 0),
    ratingCount: Math.round(toNumber(row.rating_count, 0)),

    phone: toStringValue(row.phone),
    openingHours,
    openingSummary: getOpeningSummary(openingHours, is24_7),
    is24_7,
    openHours,

    baseNoiseDb: toNumber(row.noise_db, 60),
    baseWindSpeed: toNumber(row.avg_wind_speed, 10),
    baseTemperature: toNumber(row.air_temperature, 22),
    baseHumidity: toNumber(row.relative_humidity, 50),

    readingCount: 1,
    createdAt: row.created_at,
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placeName = searchParams.get('placeName');

    const placesResult = await pool.query<PoiRow>(`
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
        AND noise_db IS NOT NULL
      ORDER BY
        category ASC,
        rating DESC NULLS LAST,
        rating_count DESC NULLS LAST,
        name ASC
      LIMIT 600
    `);

    const places = placesResult.rows.map((row) => mapPlace(row));

    const selectedPlace =
      places.find((place) => place.placeName === placeName) ||
      places[0];

    if (!selectedPlace) {
      return NextResponse.json({
        success: true,
        places: [],
        selectedPlaceName: null,
        selectedPlace: null,
        hourlyData: [],
        summary: null,
      });
    }

    const hourlyData = selectedPlace.openHours.map((hour) => {
      const noiseDb = getEstimatedHourlyNoise(
        selectedPlace.baseNoiseDb,
        hour,
        selectedPlace.category
      );

      const temperature = getEstimatedHourlyTemperature(
        selectedPlace.baseTemperature,
        hour
      );

      const windSpeed = getEstimatedHourlyWind(
        selectedPlace.baseWindSpeed,
        hour
      );

      const humidity = selectedPlace.baseHumidity;

      const comfortScore = getComfortScore(
        noiseDb,
        temperature,
        humidity,
        windSpeed
      );

      return {
        hour,
        label: String(hour).padStart(2, '0'),
        range: formatHourRange(hour),

        noiseDb,
        minNoise: Math.max(20, Number((noiseDb - 3).toFixed(1))),
        maxNoise: Math.min(90, Number((noiseDb + 3).toFixed(1))),
        readingCount: 1,
        zone: getNoiseZone(noiseDb),

        temperature,
        humidity,
        windSpeed,
        comfortScore,
        comfortLabel: getComfortLabel(comfortScore),
        isOpen: true,
      };
    });

    const quietest = hourlyData.length
      ? [...hourlyData].sort((a, b) => a.noiseDb - b.noiseDb)[0]
      : null;

    const busiest = hourlyData.length
      ? [...hourlyData].sort((a, b) => b.noiseDb - a.noiseDb)[0]
      : null;

    const mostComfortable = hourlyData.length
      ? [...hourlyData].sort((a, b) => b.comfortScore - a.comfortScore)[0]
      : null;

    const averageNoise = hourlyData.length
      ? hourlyData.reduce((sum, item) => sum + item.noiseDb, 0) / hourlyData.length
      : null;

    const averageComfort = hourlyData.length
      ? hourlyData.reduce((sum, item) => sum + item.comfortScore, 0) / hourlyData.length
      : null;

    const categorySummary = places.reduce<Record<string, number>>((summary, place) => {
      summary[place.category] = (summary[place.category] || 0) + 1;
      return summary;
    }, {});

    return NextResponse.json({
      success: true,
      places,
      selectedPlaceName: selectedPlace.placeName,
      selectedPlace,
      hourlyData,
      summary: {
        totalPlaces: places.length,
        categorySummary,
        quietest,
        busiest,
        mostComfortable,
        averageNoise: averageNoise === null ? null : Number(averageNoise.toFixed(1)),
        averageComfort: averageComfort === null ? null : Math.round(averageComfort),
      },
    });
  } catch (error) {
    console.error('GET /api/trends failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to load POI trend data',
      },
      { status: 500 }
    );
  }
}