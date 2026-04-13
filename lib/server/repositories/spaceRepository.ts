import { mockSpaces } from '../../../data/mockSpaces';
import { Space } from '../../../types/space';

export interface SpaceRecord extends Space {
  latitude?: number;
  longitude?: number;
}

export async function getAllSpaces(): Promise<SpaceRecord[]> {
  // 未来改这里：
  // 1. 从数据库读
  // 2. 从 Melbourne open data 聚合
  // 3. 从你自己的数据表读
  return mockSpaces;
}

export async function getSpaceByIdFromRepo(id: number): Promise<SpaceRecord | null> {
  const spaces = await getAllSpaces();
  return spaces.find((space) => space.id === id) ?? null;
}