'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  Container,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import SearchRoundedIcon from '@mui/icons-material/SearchRounded';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AppNavbar from '../../components/AppNavbar';
import MapPlaceholder from '../../components/MapPlaceholder';
import SpaceCard from '../../components/SpaceCard';
import FloatingCompareButton from '../../components/FloatingCompareButton';
import { Space } from '../../types/space';
import { getSpaces } from '../../lib/api-client';

type CategoryFilter = 'all' | 'study' | 'culture' | 'leisure' | 'lifestyle';

type ActivityFilter = 'study' | 'remote-work' | 'relax';

type SortFilter =
  | 'best-match'
  | 'nearest'
  | 'quietest'
  | 'highest-rating'
  | 'most-reviews';

type SearchCenter = {
  latitude: number;
  longitude: number;
  label: string;
};

type LocationPoint = {
  latitude: number;
  longitude: number;
};

type SearchSuggestion = {
  mapboxId: string;
  name: string;
  label: string;
  featureType: string;
  postcode: string;
  suburb: string;
};

const MELBOURNE_CBD_CENTER: SearchCenter = {
  latitude: -37.8136,
  longitude: 144.9631,
  label: 'Melbourne CBD, Victoria, Australia',
};

function createSessionToken() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getSpaceId(space: Space): string {
  const record = space as unknown as Record<string, unknown>;

  return String(
    record.poiId ??
      record.poi_id ??
      record.googlePlaceId ??
      record.google_place_id ??
      space.id ??
      `${space.name}-${space.latitude}-${space.longitude}`
  );
}

function getNumberValue(space: Space, keys: string[], fallback = 0): number {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (
      typeof value === 'string' &&
      value.trim() &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }

  return fallback;
}

function getStringValue(space: Space, keys: string[], fallback = ''): string {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function getSpaceLatitude(space: Space) {
  return getNumberValue(space, ['latitude'], Number.NaN);
}

function getSpaceLongitude(space: Space) {
  return getNumberValue(space, ['longitude'], Number.NaN);
}

function hasValidCoordinates(space: Space) {
  const latitude = getSpaceLatitude(space);
  const longitude = getSpaceLongitude(space);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -39 &&
    latitude <= -36 &&
    longitude >= 143 &&
    longitude <= 146
  );
}

function getDistanceKm(from: LocationPoint, to: LocationPoint) {
  const earthRadiusKm = 6371;

  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;

  const lat1 = (from.latitude * Math.PI) / 180;
  const lat2 = (to.latitude * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

async function reverseGeocodeLocation(point: LocationPoint): Promise<string> {
  try {
    const response = await fetch(
      `/api/geocode/reverse?lat=${point.latitude}&lng=${point.longitude}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      return 'Your current location';
    }

    const json = await response.json();

    return json?.data?.label || 'Your current location';
  } catch {
    return 'Your current location';
  }
}

async function geocodeAddress(query: string): Promise<SearchCenter | null> {
  try {
    const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
      cache: 'no-store',
    });

    const json = await response.json();

    if (!response.ok || !json.success || !json.data) {
      return null;
    }

    const latitude = Number(json.data.latitude);
    const longitude = Number(json.data.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    if (latitude < -39 || latitude > -36 || longitude < 143 || longitude > 146) {
      return null;
    }

    return {
      latitude,
      longitude,
      label: json.data.label || query,
    };
  } catch (error) {
    console.error('Failed to geocode search query:', error);
    return null;
  }
}

async function retrieveSuggestion(
  mapboxId: string,
  sessionToken: string
): Promise<SearchCenter | null> {
  try {
    const response = await fetch(
      `/api/search-retrieve?mapboxId=${encodeURIComponent(
        mapboxId
      )}&sessionToken=${encodeURIComponent(sessionToken)}`,
      { cache: 'no-store' }
    );

    const json = await response.json();

    if (!response.ok || !json.success || !json.data) {
      return null;
    }

    const latitude = Number(json.data.latitude);
    const longitude = Number(json.data.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return null;
    }

    if (latitude < -39 || latitude > -36 || longitude < 143 || longitude > 146) {
      return null;
    }

    return {
      latitude,
      longitude,
      label: json.data.label || 'Selected location',
    };
  } catch (error) {
    console.error('Failed to retrieve suggestion:', error);
    return null;
  }
}

function getActivityMatch(space: Space, activity: ActivityFilter): boolean {
  const category = getStringValue(space, ['category'], '').toLowerCase();
  const name = getStringValue(space, ['name'], '').toLowerCase();
  const noiseDb = getNumberValue(space, ['noiseDb', 'noise_db'], 65);
  const rating = getNumberValue(space, ['rating'], 0);
  const ratingCount = getNumberValue(space, ['ratingCount', 'rating_count'], 0);
  const openingHours = getStringValue(
    space,
    ['openingHours', 'opening_hours'],
    ''
  );

  if (activity === 'study') {
    return (
      category === 'study' ||
      noiseDb <= 62 ||
      name.includes('library') ||
      name.includes('book') ||
      name.includes('study')
    );
  }

  if (activity === 'remote-work') {
    return (
      category === 'study' ||
      category === 'lifestyle' ||
      (rating >= 4.1 && Boolean(openingHours) && noiseDb <= 68)
    );
  }

  if (activity === 'relax') {
    return (
      category === 'leisure' ||
      category === 'culture' ||
      noiseDb <= 68 ||
      ratingCount < 900
    );
  }

  return true;
}

function getBestMatchScore(space: Space, activity: ActivityFilter): number {
  const category = getStringValue(space, ['category'], '').toLowerCase();
  const name = getStringValue(space, ['name'], '').toLowerCase();

  const noiseDb = getNumberValue(space, ['noiseDb', 'noise_db'], 65);
  const comfort = getNumberValue(space, ['comfort'], 70);
  const rating = getNumberValue(space, ['rating'], 0);
  const ratingCount = getNumberValue(space, ['ratingCount', 'rating_count'], 0);
  const distance = getNumberValue(space, ['distance'], 999);
  const windSpeed = getNumberValue(space, ['windSpeed', 'avg_wind_speed'], 10);
  const temperature = getNumberValue(
    space,
    ['temperature', 'air_temperature'],
    22
  );
  const humidity = getNumberValue(space, ['humidity', 'relative_humidity'], 50);
  const openingHours = getStringValue(
    space,
    ['openingHours', 'opening_hours'],
    ''
  );

  const record = space as unknown as Record<string, unknown>;
  const is24_7 =
    record.is24_7 === true || record.is24_7 === 1 || record.is24_7 === 'true';

  const quietScore = Math.max(0, Math.min(100, 100 - noiseDb));
  const ratingScore =
    rating > 0 ? Math.max(0, Math.min(100, (rating / 5) * 100)) : 55;

  const weatherScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        100 -
          Math.max(0, windSpeed - 8) * 2.5 -
          Math.abs(temperature - 22) * 3 -
          Math.abs(humidity - 50) * 0.7
      )
    )
  );

  const popularityScore =
    ratingCount === 0
      ? 45
      : ratingCount < 50
        ? 60
        : ratingCount < 250
          ? 86
          : ratingCount < 1000
            ? 76
            : 64;

  const availabilityScore = is24_7 ? 100 : openingHours ? 82 : 48;
  const distanceScore = Math.max(0, Math.min(100, 100 - distance * 12));

  let activityBonus = 0;

  if (activity === 'study') {
    if (category === 'study') activityBonus += 22;
    if (noiseDb <= 55) activityBonus += 14;
    if (name.includes('library') || name.includes('book')) activityBonus += 12;
  }

  if (activity === 'remote-work') {
    if (category === 'study') activityBonus += 14;
    if (category === 'lifestyle') activityBonus += 12;
    if (openingHours) activityBonus += 10;
    if (rating >= 4.2) activityBonus += 8;
  }

  if (activity === 'relax') {
    if (category === 'leisure') activityBonus += 20;
    if (category === 'culture') activityBonus += 12;
    if (noiseDb <= 65) activityBonus += 8;
  }

  return (
    distanceScore * 0.35 +
    comfort * 0.18 +
    quietScore * 0.16 +
    weatherScore * 0.12 +
    ratingScore * 0.08 +
    popularityScore * 0.06 +
    availabilityScore * 0.05 +
    activityBonus
  );
}

function DiscoverPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSpaceId = searchParams.get('spaceId');

  const searchInputRef = React.useRef<HTMLInputElement | null>(null);
  const sessionTokenRef = React.useRef(createSessionToken());
  const debounceRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestionRequestSeq = React.useRef(0);

  const [appliedSearch, setAppliedSearch] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const [isSuggesting, setIsSuggesting] = React.useState(false);

  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [activity, setActivity] = React.useState<ActivityFilter>('study');
  const [sortBy, setSortBy] = React.useState<SortFilter>('best-match');

  const [searchCenter, setSearchCenter] =
    React.useState<SearchCenter | null>(null);
  const [originLabel, setOriginLabel] = React.useState(
    'Finding your location...'
  );
  const [hasAppliedFilters, setHasAppliedFilters] = React.useState(false);
  const [hasInitialisedOrigin, setHasInitialisedOrigin] =
    React.useState(false);
  const [detailSpaceId, setDetailSpaceId] = React.useState<string | null>(
    requestedSpaceId ? String(requestedSpaceId) : null
  );

  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = React.useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [compareSpaces, setCompareSpaces] = React.useState<Space[]>([]);

  React.useEffect(() => {
    let cancelled = false;

    async function loadSpaces() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getSpaces();

        if (!cancelled) {
          setSpaces(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load spaces.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadSpaces();

    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    const stored = localStorage.getItem('compare-spaces');

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Space[];
        setCompareSpaces(parsed.slice(0, 2));
      } catch {
        localStorage.removeItem('compare-spaces');
      }
    }
  }, []);

  React.useEffect(() => {
    if (!spaces.length || hasInitialisedOrigin) return;

    const matchedSpace =
      detailSpaceId !== null
        ? spaces.find((space) => getSpaceId(space) === detailSpaceId)
        : null;

    if (matchedSpace && hasValidCoordinates(matchedSpace)) {
      const matchedId = getSpaceId(matchedSpace);

      setSelectedSpaceId(matchedId);
      setSearchCenter({
        latitude: getSpaceLatitude(matchedSpace),
        longitude: getSpaceLongitude(matchedSpace),
        label: matchedSpace.name,
      });
      setOriginLabel(`${matchedSpace.name} · selected from details`);
      setSortBy('nearest');
      setHasInitialisedOrigin(true);
      return;
    }

    let cancelled = false;

    function useFallbackLocation() {
      if (cancelled) return;

      setSearchCenter(MELBOURNE_CBD_CENTER);
      setOriginLabel(MELBOURNE_CBD_CENTER.label);
      setAppliedSearch('');
      setSelectedSpaceId(null);
      setHasInitialisedOrigin(true);
    }

    if (!navigator.geolocation) {
      useFallbackLocation();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };

        const label = await reverseGeocodeLocation(point);

        if (cancelled) return;

        setSearchCenter({
          ...point,
          label,
        });
        setOriginLabel(label);
        setAppliedSearch('');
        setSelectedSpaceId(null);
        setHasInitialisedOrigin(true);
      },
      () => {
        useFallbackLocation();
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );

    return () => {
      cancelled = true;
    };
  }, [spaces, detailSpaceId, hasInitialisedOrigin]);

  React.useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  function scheduleSuggestionSearch(value: string) {
    const query = value.trim();

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsSuggesting(false);
      return;
    }

    const requestId = suggestionRequestSeq.current + 1;
    suggestionRequestSeq.current = requestId;

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSuggesting(true);

        const response = await fetch(
          `/api/search-suggest?q=${encodeURIComponent(
            query
          )}&sessionToken=${encodeURIComponent(sessionTokenRef.current)}`,
          { cache: 'no-store' }
        );

        const json = await response.json();

        if (suggestionRequestSeq.current !== requestId) {
          return;
        }

        if (!response.ok || !json.success) {
          setSuggestions([]);
          setShowSuggestions(false);
          return;
        }

        setSuggestions(json.data ?? []);
        setShowSuggestions(true);
      } catch {
        if (suggestionRequestSeq.current === requestId) {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } finally {
        if (suggestionRequestSeq.current === requestId) {
          setIsSuggesting(false);
        }
      }
    }, 350);
  }

  async function applyNewSearchCenter(center: SearchCenter, labelForInput: string) {
    setAppliedSearch(labelForInput);
    setSearchCenter(center);
    setOriginLabel(center.label);
    setSortBy('nearest');
    setSelectedSpaceId(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setHasAppliedFilters(true);
    setDetailSpaceId(null);
    sessionTokenRef.current = createSessionToken();

    if (requestedSpaceId) {
      router.replace('/discover', { scroll: false });
    }
  }

  async function handleSelectSuggestion(suggestion: SearchSuggestion) {
    const selected = await retrieveSuggestion(
      suggestion.mapboxId,
      sessionTokenRef.current
    );

    if (!selected) {
      return;
    }

    if (searchInputRef.current) {
      searchInputRef.current.value = suggestion.name;
    }

    await applyNewSearchCenter(selected, suggestion.name);
  }

  async function handleApplyFilters() {
    setHasAppliedFilters(true);

    const query = searchInputRef.current?.value.trim() ?? '';
    setAppliedSearch(query);

    if (!query) {
      setSearchCenter(MELBOURNE_CBD_CENTER);
      setOriginLabel(MELBOURNE_CBD_CENTER.label);
      setSelectedSpaceId(null);
      setSuggestions([]);
      setShowSuggestions(false);
      setDetailSpaceId(null);

      if (requestedSpaceId) {
        router.replace('/discover', { scroll: false });
      }

      return;
    }

    if (suggestions.length > 0) {
      await handleSelectSuggestion(suggestions[0]);
      return;
    }

    const geocoded = await geocodeAddress(query);

    if (geocoded) {
      if (searchInputRef.current) {
        searchInputRef.current.value = query;
      }

      await applyNewSearchCenter(geocoded, query);
      return;
    }

    setSearchCenter(null);
    setOriginLabel(`No location found for "${query}"`);
    setSelectedSpaceId(null);
    setSuggestions([]);
    setShowSuggestions(false);
    setDetailSpaceId(null);

    if (requestedSpaceId) {
      router.replace('/discover', { scroll: false });
    }
  }

  function handleResetFilters() {
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }

    setAppliedSearch('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSearchCenter(MELBOURNE_CBD_CENTER);
    setOriginLabel(MELBOURNE_CBD_CENTER.label);
    setCategory('all');
    setActivity('study');
    setSortBy('best-match');
    setHasAppliedFilters(false);
    setSelectedSpaceId(null);
    setDetailSpaceId(null);
    sessionTokenRef.current = createSessionToken();

    router.replace('/discover', { scroll: false });
  }

  const filteredSpaces = React.useMemo(() => {
    if (!searchCenter) return [];

    let result = spaces
      .filter((space) => hasValidCoordinates(space))
      .map((space) => {
        const distance = getDistanceKm(searchCenter, {
          latitude: getSpaceLatitude(space),
          longitude: getSpaceLongitude(space),
        });

        return {
          ...space,
          distance: Number(distance.toFixed(2)),
        };
      });

    if (category !== 'all') {
      result = result.filter((space) => {
        const categoryValue = getStringValue(
          space,
          ['category'],
          ''
        ).toLowerCase();

        return categoryValue === category;
      });
    }

    result = result.filter((space) => getActivityMatch(space, activity));

    if (sortBy === 'best-match') {
      result.sort((a, b) => {
        const distanceA = getNumberValue(a, ['distance'], 999);
        const distanceB = getNumberValue(b, ['distance'], 999);

        const scoreA = getBestMatchScore(a, activity);
        const scoreB = getBestMatchScore(b, activity);

        if (Math.abs(distanceA - distanceB) > 0.35) {
          return distanceA - distanceB;
        }

        return scoreB - scoreA;
      });
    }

    if (sortBy === 'nearest') {
      result.sort((a, b) => {
        return (
          getNumberValue(a, ['distance'], 999) -
          getNumberValue(b, ['distance'], 999)
        );
      });
    }

    if (sortBy === 'quietest') {
      result.sort((a, b) => {
        const aNoise = getNumberValue(a, ['noiseDb', 'noise_db'], 999);
        const bNoise = getNumberValue(b, ['noiseDb', 'noise_db'], 999);

        if (aNoise !== bNoise) return aNoise - bNoise;

        return (
          getNumberValue(a, ['distance'], 999) -
          getNumberValue(b, ['distance'], 999)
        );
      });
    }

    if (sortBy === 'highest-rating') {
      result.sort((a, b) => {
        const aRating = getNumberValue(a, ['rating'], 0);
        const bRating = getNumberValue(b, ['rating'], 0);

        if (aRating !== bRating) return bRating - aRating;

        return (
          getNumberValue(a, ['distance'], 999) -
          getNumberValue(b, ['distance'], 999)
        );
      });
    }

    if (sortBy === 'most-reviews') {
      result.sort((a, b) => {
        const aReviews = getNumberValue(a, ['ratingCount', 'rating_count'], 0);
        const bReviews = getNumberValue(b, ['ratingCount', 'rating_count'], 0);

        if (aReviews !== bReviews) return bReviews - aReviews;

        return (
          getNumberValue(a, ['distance'], 999) -
          getNumberValue(b, ['distance'], 999)
        );
      });
    }

    return result;
  }, [spaces, searchCenter, category, activity, sortBy, appliedSearch, hasAppliedFilters]);

  const displayedSpaces = React.useMemo(() => {
    if (!filteredSpaces.length) return [];

    if (detailSpaceId) {
      const target = filteredSpaces.find(
        (space) => getSpaceId(space) === detailSpaceId
      );
      const rest = filteredSpaces.filter(
        (space) => getSpaceId(space) !== detailSpaceId
      );

      if (target) {
        return [target, ...rest].slice(0, 6);
      }
    }

    return filteredSpaces.slice(0, 6);
  }, [filteredSpaces, detailSpaceId]);

  React.useEffect(() => {
    if (!displayedSpaces.length) {
      if (selectedSpaceId !== null) {
        setSelectedSpaceId(null);
      }
      return;
    }

    const stillExists = displayedSpaces.some(
      (space) => getSpaceId(space) === selectedSpaceId
    );

    if (!stillExists) {
      const hasDetailSpace =
        detailSpaceId !== null &&
        displayedSpaces.some((space) => getSpaceId(space) === detailSpaceId);

      setSelectedSpaceId(
        hasDetailSpace ? detailSpaceId : getSpaceId(displayedSpaces[0])
      );
    }
  }, [displayedSpaces, selectedSpaceId, detailSpaceId]);

  const handleMapSelectSpace = React.useCallback((spaceId: string | number) => {
    setSelectedSpaceId(String(spaceId));
  }, []);

  function handleAddToCompare(space: Space) {
    setCompareSpaces((prev) => {
      const exists = prev.some((item) => getSpaceId(item) === getSpaceId(space));
      if (exists) return prev;

      const next = prev.length >= 2 ? [prev[1], space] : [...prev, space];
      localStorage.setItem('compare-spaces', JSON.stringify(next));
      return next;
    });
  }

  function handleRemoveFromCompare(spaceId: string) {
    setCompareSpaces((prev) => {
      const next = prev.filter((item) => getSpaceId(item) !== spaceId);
      localStorage.setItem('compare-spaces', JSON.stringify(next));
      return next;
    });
  }

  function handleClearCompare() {
    setCompareSpaces([]);
    localStorage.removeItem('compare-spaces');
  }

  function handleGoToCompare() {
    localStorage.setItem('compare-spaces', JSON.stringify(compareSpaces));
    router.push('/compare');
  }

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f5efe2',
          color: '#273d34',
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="xl">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 4 },
              borderRadius: '28px',
              bgcolor: '#fbf7ed',
              border: '1px solid #ded2bd',
              boxShadow: '0 18px 40px rgba(87, 72, 48, 0.12)',
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '2.4rem', md: '3.4rem' },
                fontWeight: 900,
                mb: 1,
                color: '#273d34',
                fontFamily: 'Georgia, serif',
                letterSpacing: '-0.04em',
              }}
            >
              Discover spaces
            </Typography>

            <Typography
              sx={{
                mb: 1,
                color: '#52645d',
                fontSize: '1.02rem',
              }}
            >
              Search a street, address, or place name, select a suggestion, and
              find the nearest six spaces from that origin.
            </Typography>

            <Typography
              sx={{
                mb: 3,
                color: '#8a8173',
                fontSize: '0.9rem',
              }}
            >
              Current origin: {originLabel}
            </Typography>

            <Paper
              component="form"
              elevation={0}
              onSubmit={(event) => {
                event.preventDefault();
                handleApplyFilters();
              }}
              sx={{
                p: { xs: 2, md: 2.2 },
                borderRadius: '24px',
                bgcolor: '#fffaf1',
                border: '1px solid #ded2bd',
                boxShadow: '0 10px 28px rgba(87, 72, 48, 0.08)',
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  md: '1.6fr 0.8fr 0.8fr 0.8fr auto auto',
                },
                gap: 1.6,
                alignItems: 'center',
              }}
            >
              <Box sx={{ position: 'relative' }}>
                <Box
                  component="input"
                  ref={searchInputRef}
                  defaultValue=""
                  placeholder="Search street, address, or place"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  onChange={(event) => {
                    scheduleSuggestionSearch(event.currentTarget.value);
                  }}
                  onFocus={() => {
                    if (suggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  sx={{
                    width: '100%',
                    height: 56,
                    px: 2,
                    borderRadius: '14px',
                    border: '1px solid rgba(39,61,52,0.28)',
                    bgcolor: '#fffaf1',
                    color: '#273d34',
                    fontSize: '1rem',
                    outline: 'none',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                    '&::placeholder': {
                      color: '#9a8f7e',
                    },
                    '&:focus': {
                      borderColor: '#2d4a3d',
                      boxShadow: '0 0 0 3px rgba(45,74,61,0.12)',
                    },
                  }}
                />

                {showSuggestions && (suggestions.length > 0 || isSuggesting) && (
                  <Paper
                    elevation={0}
                    sx={{
                      position: 'absolute',
                      zIndex: 200,
                      left: 0,
                      right: 0,
                      top: 'calc(100% + 8px)',
                      borderRadius: '16px',
                      border: '1px solid #ded2bd',
                      bgcolor: '#fffaf1',
                      boxShadow: '0 18px 34px rgba(87, 72, 48, 0.16)',
                      overflow: 'hidden',
                      maxHeight: 360,
                      overflowY: 'auto',
                    }}
                  >
                    {isSuggesting && suggestions.length === 0 ? (
                      <Box
                        sx={{
                          px: 2,
                          py: 1.5,
                          color: '#8a8173',
                          fontSize: '0.9rem',
                        }}
                      >
                        Searching suggestions...
                      </Box>
                    ) : (
                      suggestions.map((item) => (
                        <Box
                          key={item.mapboxId}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            handleSelectSuggestion(item);
                          }}
                          sx={{
                            px: 2,
                            py: 1.3,
                            cursor: 'pointer',
                            borderBottom: '1px solid rgba(222,210,189,0.65)',
                            '&:hover': {
                              bgcolor: '#f1eadc',
                            },
                            '&:last-child': {
                              borderBottom: 'none',
                            },
                          }}
                        >
                          <Typography
                            sx={{
                              fontWeight: 900,
                              color: '#273d34',
                              fontSize: '0.95rem',
                            }}
                          >
                            {item.name}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.35,
                              color: '#6c7a72',
                              fontSize: '0.82rem',
                              lineHeight: 1.35,
                            }}
                          >
                            {item.label}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Paper>
                )}
              </Box>

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(event) =>
                    setCategory(event.target.value as CategoryFilter)
                  }
                  sx={{
                    borderRadius: '14px',
                    bgcolor: '#fffaf1',
                  }}
                >
                  <MenuItem value="all">All categories</MenuItem>
                  <MenuItem value="study">Study</MenuItem>
                  <MenuItem value="culture">Culture</MenuItem>
                  <MenuItem value="leisure">Leisure</MenuItem>
                  <MenuItem value="lifestyle">Lifestyle</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Activity</InputLabel>
                <Select
                  value={activity}
                  label="Activity"
                  onChange={(event) =>
                    setActivity(event.target.value as ActivityFilter)
                  }
                  sx={{
                    borderRadius: '14px',
                    bgcolor: '#fffaf1',
                  }}
                >
                  <MenuItem value="study">Study</MenuItem>
                  <MenuItem value="remote-work">Remote work</MenuItem>
                  <MenuItem value="relax">Relax</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel>Sort by</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort by"
                  onChange={(event) =>
                    setSortBy(event.target.value as SortFilter)
                  }
                  sx={{
                    borderRadius: '14px',
                    bgcolor: '#fffaf1',
                  }}
                >
                  <MenuItem value="best-match">Best match</MenuItem>
                  <MenuItem value="nearest">Nearest</MenuItem>
                  <MenuItem value="quietest">Quietest</MenuItem>
                  <MenuItem value="highest-rating">Highest rating</MenuItem>
                  <MenuItem value="most-reviews">Most reviews</MenuItem>
                </Select>
              </FormControl>

              <Button
                type="submit"
                startIcon={<SearchRoundedIcon />}
                variant="contained"
                sx={{
                  minHeight: 56,
                  px: 3,
                  borderRadius: '18px',
                  textTransform: 'none',
                  fontWeight: 900,
                  bgcolor: '#2d4a3d',
                  color: '#ffffff',
                  boxShadow: 'none',
                  '&:hover': {
                    bgcolor: '#263f35',
                    boxShadow: 'none',
                  },
                }}
              >
                Search
              </Button>

              <Button
                type="button"
                onClick={handleResetFilters}
                variant="outlined"
                sx={{
                  minHeight: 56,
                  px: 3,
                  borderRadius: '18px',
                  textTransform: 'none',
                  fontWeight: 900,
                  color: '#273d34',
                  borderColor: '#d8c9ae',
                  bgcolor: '#fffaf1',
                  '&:hover': {
                    borderColor: '#cdbb9b',
                    bgcolor: '#f7efdf',
                  },
                }}
              >
                Reset
              </Button>
            </Paper>

            <Grid container spacing={3} sx={{ mt: 3 }}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper
                  elevation={0}
                  sx={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '18px',
                    border: '1px solid #ded2bd',
                    bgcolor: '#eee6d8',
                    boxShadow: '0 18px 40px rgba(87, 72, 48, 0.1)',
                    '& .mapboxgl-map, & .leaflet-container': {
                      borderRadius: '18px',
                    },
                  }}
                >
                  <MapPlaceholder
                    spaces={displayedSpaces}
                    selectedSpaceId={selectedSpaceId}
                    onSelectSpace={handleMapSelectSpace}
                  />
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: '14px',
                    border: '1px solid #ded2bd',
                    bgcolor: '#fbf7ed',
                    boxShadow: '0 12px 30px rgba(87, 72, 48, 0.08)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '0.8rem',
                          fontWeight: 900,
                          letterSpacing: '0.18em',
                          textTransform: 'uppercase',
                          color: '#9a8f7e',
                          mb: 0.8,
                        }}
                      >
                        Compare list
                      </Typography>

                      {compareSpaces.length === 0 ? (
                        <Typography sx={{ color: '#52645d' }}>
                          Select up to 2 spaces to compare.
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {compareSpaces.map((item) => (
                            <Chip
                              key={getSpaceId(item)}
                              label={item.name}
                              onDelete={() =>
                                handleRemoveFromCompare(getSpaceId(item))
                              }
                              sx={{
                                borderRadius: '999px',
                                bgcolor: '#eee6d8',
                                color: '#273d34',
                                border: '1px solid #d8c9ae',
                                fontWeight: 800,
                                '& .MuiChip-deleteIcon': {
                                  color: '#9a8f7e',
                                  '&:hover': {
                                    color: '#c9775c',
                                  },
                                },
                              }}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                      {compareSpaces.length > 0 && (
                        <Button
                          onClick={handleClearCompare}
                          startIcon={<DeleteOutlineRoundedIcon />}
                          variant="outlined"
                          sx={{
                            borderRadius: '999px',
                            px: 2.2,
                            textTransform: 'none',
                            fontWeight: 900,
                            color: '#273d34',
                            borderColor: '#d8c9ae',
                            bgcolor: '#fffaf1',
                            '&:hover': {
                              borderColor: '#cdbb9b',
                              bgcolor: '#f7efdf',
                            },
                          }}
                        >
                          Clear
                        </Button>
                      )}

                      <Button
                        onClick={handleGoToCompare}
                        disabled={compareSpaces.length < 2}
                        startIcon={<CompareArrowsRoundedIcon />}
                        variant="contained"
                        sx={{
                          borderRadius: '999px',
                          px: 2.4,
                          textTransform: 'none',
                          fontWeight: 900,
                          bgcolor: '#2d4a3d',
                          color: '#ffffff',
                          boxShadow: '0 10px 22px rgba(45, 74, 61, 0.18)',
                          '&:hover': {
                            bgcolor: '#263f35',
                          },
                          '&.Mui-disabled': {
                            bgcolor: '#d8d0bf',
                            color: '#fffaf1',
                          },
                        }}
                      >
                        Go to compare
                      </Button>
                    </Box>
                  </Box>
                </Paper>
              </Grid>

              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '14px',
                    bgcolor: '#fbf7ed',
                    border: '1px solid #ded2bd',
                    boxShadow: '0 18px 40px rgba(87, 72, 48, 0.1)',
                    mb: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 900,
                      mb: 1,
                      color: '#273d34',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    Why these places?
                  </Typography>

                  <Typography
                    sx={{
                      color: '#52645d',
                      lineHeight: 1.65,
                    }}
                  >
                    Search suggestions resolve a real street, address, or place
                    into coordinates. The system then calculates the nearest
                    matching POI records from your database.
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '14px',
                    bgcolor: '#fbf7ed',
                    border: '1px solid #ded2bd',
                    boxShadow: '0 18px 40px rgba(87, 72, 48, 0.1)',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '2rem',
                      fontWeight: 900,
                      mb: 1,
                      color: '#273d34',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    Quick insight
                  </Typography>

                  <Typography sx={{ color: '#52645d' }}>
                    Nearest best match:{' '}
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 900,
                        color: '#273d34',
                      }}
                    >
                      {displayedSpaces[0]?.name ?? 'No result'}
                    </Box>
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ mt: 5 }}>
              <Typography
                sx={{
                  fontSize: { xs: '2.2rem', md: '3.2rem' },
                  fontWeight: 900,
                  mb: 1,
                  color: '#273d34',
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '-0.04em',
                }}
              >
                Nearby matching spaces
              </Typography>

              <Typography
                sx={{
                  color: '#52645d',
                  mb: 3,
                }}
              >
                Showing the nearest six database places from your current or
                searched location.
              </Typography>

              {error ? (
                <Box sx={{ color: '#b42318', fontWeight: 800 }}>{error}</Box>
              ) : isLoading ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '14px',
                    border: '1px solid #ded2bd',
                    bgcolor: '#fffaf1',
                  }}
                >
                  Loading spaces...
                </Paper>
              ) : displayedSpaces.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '14px',
                    border: '1px solid #ded2bd',
                    bgcolor: '#fffaf1',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '1.4rem',
                      fontWeight: 900,
                      color: '#273d34',
                      fontFamily: 'Georgia, serif',
                    }}
                  >
                    No nearby matching spaces
                  </Typography>

                  <Typography sx={{ color: '#52645d', mt: 1 }}>
                    Try another street, address, category, activity, or sort
                    option.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {displayedSpaces.map((space, index) => {
                    const id = getSpaceId(space);
                    const selected = id === selectedSpaceId;

                    return (
                      <Grid key={id} size={{ xs: 12, md: 6, xl: 4 }}>
                        <Box
                          onClick={() => setSelectedSpaceId(id)}
                          sx={{
                            cursor: 'pointer',
                            '& > *': {
                              borderColor: selected
                                ? '#c9775c !important'
                                : undefined,
                              boxShadow: selected
                                ? '0 18px 40px rgba(201, 119, 92, 0.18) !important'
                                : undefined,
                            },
                          }}
                        >
                          <SpaceCard
                            space={space}
                            rank={index + 1}
                            selected={selected}
                            onSelect={() => setSelectedSpaceId(id)}
                            onAddToCompare={handleAddToCompare}
                            isCompared={compareSpaces.some(
                              (item) => getSpaceId(item) === id
                            )}
                          />
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Paper>
        </Container>
      </Box>

      <FloatingCompareButton count={compareSpaces.length} />
    </>
  );
}

function DiscoverPageFallback() {
  return (
    <>
      <AppNavbar />
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#f5efe2',
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="xl">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '28px',
              bgcolor: '#fbf7ed',
              border: '1px solid #ded2bd',
              boxShadow: '0 18px 40px rgba(87, 72, 48, 0.12)',
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '2rem', md: '3rem' },
                fontWeight: 900,
                color: '#273d34',
                fontFamily: 'Georgia, serif',
              }}
            >
              Loading discover spaces...
            </Typography>
          </Paper>
        </Container>
      </Box>
    </>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<DiscoverPageFallback />}>
      <DiscoverPageContent />
    </Suspense>
  );
}