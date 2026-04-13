import {
  ActivityType,
  CategoryFilter,
  SortType,
  Space,
} from '@/types/space';

export function getNoiseLabel(db: number): string {
  if (db <= 35) return 'Library Quiet';
  if (db <= 42) return 'Calm';
  if (db <= 48) return 'Moderate';
  return 'Active Zone';
}

export function getSuggestionScore(space: Space, activity: ActivityType): number {
  let score = 0;

  if (space.activityFit.includes(activity)) score += 45;
  score += Math.max(0, 30 - (space.noiseDb - 30));
  score += Math.round(space.comfort * 0.25);

  if (activity === 'relax') score += Math.round(space.shade * 0.2);
  if (activity === 'remote work') score += space.category !== 'Park' ? 12 : 0;
  if (activity === 'study') score += space.noiseDb <= 40 ? 12 : 0;

  return score;
}

export function filterAndSortSpaces(params: {
  spaces: Space[];
  search: string;
  category: CategoryFilter;
  activity: ActivityType;
  sortBy: SortType;
}): Space[] {
  const { spaces, search, category, activity, sortBy } = params;
  const keyword = search.trim().toLowerCase();

  const filtered = spaces.filter((space) => {
    const matchesSearch =
      !keyword ||
      space.name.toLowerCase().includes(keyword) ||
      space.suburb.toLowerCase().includes(keyword);

    const matchesCategory = category === 'all' || space.category === category;
    const matchesActivity = space.activityFit.includes(activity);

    return matchesSearch && matchesCategory && matchesActivity;
  });

  switch (sortBy) {
    case 'quiet':
      return [...filtered].sort((a, b) => a.noiseDb - b.noiseDb);
    case 'comfort':
      return [...filtered].sort((a, b) => b.comfort - a.comfort);
    case 'distance':
      return [...filtered].sort((a, b) => a.distance - b.distance);
    default:
      return [...filtered].sort(
        (a, b) => getSuggestionScore(b, activity) - getSuggestionScore(a, activity)
      );
  }
}