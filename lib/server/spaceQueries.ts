import { mockSpaces } from '../../data/mockSpaces';
import {
  ActivityType,
  CategoryFilter,
  SortType,
  Space,
} from '../../types/space';
import { filterAndSortSpaces } from '../../utils/spaceHelpers';

function safeActivity(value: string | null): ActivityType {
  if (value === 'study' || value === 'remote work' || value === 'relax') {
    return value;
  }
  return 'study';
}

function safeCategory(value: string | null): CategoryFilter {
  if (
    value === 'all' ||
    value === 'Library' ||
    value === 'Park' ||
    value === 'Public Lounge'
  ) {
    return value;
  }
  return 'all';
}

function safeSort(value: string | null): SortType {
  if (
    value === 'best' ||
    value === 'quiet' ||
    value === 'comfort' ||
    value === 'distance'
  ) {
    return value;
  }
  return 'best';
}

function safePositiveInt(value: string | null, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

export function querySpaces(searchParams: URLSearchParams): Space[] {
  const search = searchParams.get('q') ?? '';
  const category = safeCategory(searchParams.get('category'));
  const activity = safeActivity(searchParams.get('activity'));
  const sortBy = safeSort(searchParams.get('sortBy'));

  const result = filterAndSortSpaces({
    spaces: mockSpaces,
    search,
    category,
    activity,
    sortBy,
  });

  const limit = safePositiveInt(searchParams.get('limit'), result.length);
  return result.slice(0, limit);
}

export function getTopPicks(searchParams: URLSearchParams): Space[] {
  const activity = safeActivity(searchParams.get('activity'));
  const limit = safePositiveInt(searchParams.get('limit'), 3);

  const result = filterAndSortSpaces({
    spaces: mockSpaces,
    search: '',
    category: 'all',
    activity,
    sortBy: 'best',
  });

  return result.slice(0, limit);
}

export function getSpaceById(id: number): Space | null {
  const found = mockSpaces.find((space) => space.id === id);
  return found ?? null;
}

export function getInsights(searchParams: URLSearchParams) {
  const activity = safeActivity(searchParams.get('activity'));

  const filtered = filterAndSortSpaces({
    spaces: mockSpaces,
    search: '',
    category: 'all',
    activity,
    sortBy: 'best',
  });

  const quietSpaces = mockSpaces.filter((space) => space.noiseDb <= 40).length;
  const nearbyChoices = mockSpaces.filter((space) => space.distance <= 1.5).length;
  const highShadeSpots = mockSpaces.filter((space) => space.shade >= 80).length;
  const averageComfort = Math.round(
    mockSpaces.reduce((sum, space) => sum + space.comfort, 0) / mockSpaces.length
  );

  return {
    activity,
    bestMatch: filtered[0] ?? null,
    stats: {
      quietSpaces,
      nearbyChoices,
      highShadeSpots,
      averageComfort,
      totalSpaces: mockSpaces.length,
    },
  };
}