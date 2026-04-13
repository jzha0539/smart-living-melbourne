import { Space } from '../../../types/space';
import { filterAndSortSpaces } from '../../../utils/spaceHelpers';
import { fetchWeatherByCoords } from './weather';
import { calculateComfortScore } from '../adapters/spaceAdapter';
import { getAllSpaces, getSpaceByIdFromRepo } from '../repositories/spaceRepository';
import { ActivityType, CategoryFilter, SortType } from '../../../types/space';

export async function getSpacesFromRealSources(params: {
  search?: string;
  category?: CategoryFilter;
  activity?: ActivityType;
  sortBy?: SortType;
  limit?: number;
}): Promise<Space[]> {
  const spaces = await getAllSpaces();

  // 这里先保留你的本地筛选逻辑
  const filtered = filterAndSortSpaces({
    spaces,
    search: params.search ?? '',
    category: params.category ?? 'all',
    activity: params.activity ?? 'study',
    sortBy: params.sortBy ?? 'best',
  });

  if (params.limit) {
    return filtered.slice(0, params.limit);
  }

  return filtered;
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

  // 如果未来你的地点有真实经纬度，就可以动态算 comfort
  if (space.latitude !== undefined && space.longitude !== undefined) {
    try {
      const weather = await fetchWeatherByCoords(space.latitude, space.longitude);
      return {
        ...space,
        comfort: calculateComfortScore(weather),
      };
    } catch {
      return space;
    }
  }

  return space;
}