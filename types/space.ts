export type ActivityType = 'study' | 'remote work' | 'relax';
export type CategoryFilter = 'all' | 'Library' | 'Park' | 'Public Lounge';
export type SortType = 'best' | 'quiet' | 'comfort' | 'distance';

export interface Space {
  id: number;
  name: string;
  suburb: string;
  distance: number;
  noiseDb: number;
  comfort: number;
  shade: number;
  crowd: string;
  quietTime: string;
  category: string;
  reason: string;
  activityFit: string[];

  latitude?: number;
  longitude?: number;

  serenityScore?: number;
  activityExplanation?: string;
  weatherAdvice?: string;
}