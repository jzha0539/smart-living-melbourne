export type SpaceCategory = 'Library' | 'Park' | 'Public Lounge';
export type CrowdLevel = 'Low' | 'Medium' | 'High';
export type ActivityType = 'study' | 'remote work' | 'relax';
export type SortType = 'best' | 'quiet' | 'comfort' | 'distance';
export type CategoryFilter = 'all' | SpaceCategory;

export interface Space {
  id: number;
  name: string;
  category: SpaceCategory;
  suburb: string;
  distance: number;
  noiseDb: number;
  comfort: number;
  shade: number;
  crowd: CrowdLevel;
  activityFit: ActivityType[];
  reason: string;
  quietTime: string;
}