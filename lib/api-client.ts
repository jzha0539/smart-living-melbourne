import { ActivityType, CategoryFilter, SortType, Space } from '../types/space';

interface ApiListResponse<T> {
  success: boolean;
  count?: number;
  data: T;
  message?: string;
}

interface ApiItemResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface InsightsResponse {
  activity: ActivityType;
  bestMatch: Space | null;
  stats: {
    quietSpaces: number;
    nearbyChoices: number;
    highShadeSpots: number;
    averageComfort: number;
    totalSpaces: number;
  };
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
}

async function handleResponse<T>(response: Response): Promise<T> {
  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Request failed.');
  }

  return json.data as T;
}

export async function getSpaces(params?: {
  q?: string;
  category?: CategoryFilter;
  activity?: ActivityType;
  sortBy?: SortType;
  limit?: number;
}): Promise<Space[]> {
  const query = buildQuery({
    q: params?.q,
    category: params?.category,
    activity: params?.activity,
    sortBy: params?.sortBy,
    limit: params?.limit,
  });

  const response = await fetch(`/api/spaces${query ? `?${query}` : ''}`, {
    cache: 'no-store',
  });

  return handleResponse<Space[]>(response);
}

export async function getSpaceById(id: number): Promise<Space> {
  const response = await fetch(`/api/spaces/${id}`, {
    cache: 'no-store',
  });

  return handleResponse<Space>(response);
}

export async function getTopPicks(params?: {
  activity?: ActivityType;
  limit?: number;
}): Promise<Space[]> {
  const query = buildQuery({
    activity: params?.activity,
    limit: params?.limit,
  });

  const response = await fetch(`/api/top-picks${query ? `?${query}` : ''}`, {
    cache: 'no-store',
  });

  return handleResponse<Space[]>(response);
}

export async function getInsights(params?: {
  activity?: ActivityType;
}): Promise<InsightsResponse> {
  const query = buildQuery({
    activity: params?.activity,
  });

  const response = await fetch(`/api/insights${query ? `?${query}` : ''}`, {
    cache: 'no-store',
  });

  return handleResponse<InsightsResponse>(response);
}