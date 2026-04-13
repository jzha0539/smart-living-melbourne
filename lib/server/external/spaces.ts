import { Space } from '../../../types/space';
import { filterAndSortSpaces } from '../../../utils/spaceHelpers';
import { fetchWeatherByCoords } from './weather';
import {
  calculateComfortScore,
  enrichSpaceForActivity,
  getWeatherAdvice,
  sortSpacesForActivity,
} from '../adapters/spaceAdapter';
import { getAllSpaces, getSpaceByIdFromRepo } from '../repositories/spaceRepository';
import { ActivityType, CategoryFilter, SortType } from '../../../types/space';

async function enrichSpaceWithRealSignals(space: Space): Promise<Space> {
  if (space.latitude !== undefined && space.longitude !== undefined) {
    try {
      const weather = await fetchWeatherByCoords(space.latitude, space.longitude);

      return {
        ...space,
        comfort: calculateComfortScore(weather),
        weatherAdvice: getWeatherAdvice(weather),
      };
    } catch {
      return space;
    }
  }

  return space;
}

export async function getSpacesFromRealSources(params: {
  search?: string;
  category?: CategoryFilter;
  activity?: ActivityType;
  sortBy?: SortType;
  limit?: number;
}): Promise<Space[]> {
  const baseSpaces = await getAllSpaces();
  const weatherEnrichedSpaces = await Promise.all(
    baseSpaces.map((space) => enrichSpaceWithRealSignals(space))
  );

  const filtered = filterAndSortSpaces({
    spaces: weatherEnrichedSpaces,
    search: params.search ?? '',
    category: params.category ?? 'all',
    activity: params.activity ?? 'study',
    sortBy: params.sortBy ?? 'best',
  });

  const ranked =
    params.sortBy === 'best'
      ? sortSpacesForActivity(filtered, params.activity ?? 'study')
      : filtered;

  const enriched = ranked.map((space) =>
    enrichSpaceForActivity(space, params.activity ?? 'study')
  );

  if (params.limit) {
    return enriched.slice(0, params.limit);
  }

  return enriched;
}

export async function getTopPicksFromRealSources(activity: ActivityType): Promise<Space[]> {
  const spaces = await getSpacesFromRealSources({
    activity,
    category: 'all',
    sortBy: 'best',
    limit: 3,
  });

  return spaces;
}

export async function getSpaceDetailFromRealSources(id: number): Promise<Space | null> {
  const space = await getSpaceByIdFromRepo(id);
  if (!space) return null;

  const enriched = await enrichSpaceWithRealSignals(space);
  return enrichSpaceForActivity(enriched, 'study');
}