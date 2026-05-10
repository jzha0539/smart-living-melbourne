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
  TextField,
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
type SortFilter = 'best-match' | 'quietest' | 'highest-rating' | 'most-reviews';

type SearchCenter = {
  latitude: number;
  longitude: number;
  label: string;
};

type LocationPoint = {
  latitude: number;
  longitude: number;
};

const MELBOURNE_CBD_CENTER: LocationPoint = {
  latitude: -37.8136,
  longitude: 144.9631,
};

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

    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
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

function getActivityMatch(space: Space, activity: ActivityFilter): boolean {
  const category = getStringValue(space, ['category'], '').toLowerCase();
  const name = getStringValue(space, ['name'], '').toLowerCase();
  const noiseDb = getNumberValue(space, ['noiseDb', 'noise_db'], 65);
  const rating = getNumberValue(space, ['rating'], 0);
  const ratingCount = getNumberValue(space, ['ratingCount', 'rating_count'], 0);
  const openingHours = getStringValue(space, ['openingHours', 'opening_hours'], '');

  if (activity === 'study') {
    return (
      category === 'study' ||
      noiseDb <= 60 ||
      name.includes('library') ||
      name.includes('book') ||
      name.includes('study')
    );
  }

  if (activity === 'remote-work') {
    return (
      category === 'study' ||
      (category === 'lifestyle' && noiseDb <= 62) ||
      (rating >= 4.2 && Boolean(openingHours) && noiseDb <= 65)
    );
  }

  if (activity === 'relax') {
    return (
      category === 'leisure' ||
      category === 'culture' ||
      (noiseDb <= 65 && ratingCount < 800)
    );
  }

  return true;
}

function getBestMatchScore(space: Space, activity: ActivityFilter): number {
  const category = getStringValue(space, ['category'], '').toLowerCase();
  const noiseDb = getNumberValue(space, ['noiseDb', 'noise_db'], 65);
  const comfort = getNumberValue(space, ['comfort'], 70);
  const rating = getNumberValue(space, ['rating'], 0);
  const ratingCount = getNumberValue(space, ['ratingCount', 'rating_count'], 0);
  const windSpeed = getNumberValue(space, ['windSpeed', 'avg_wind_speed'], 10);
  const temperature = getNumberValue(space, ['temperature', 'air_temperature'], 22);
  const humidity = getNumberValue(space, ['humidity', 'relative_humidity'], 50);
  const openingHours = getStringValue(space, ['openingHours', 'opening_hours'], '');

  const quietScore = Math.max(0, Math.min(100, 100 - noiseDb));
  const ratingScore = rating > 0 ? Math.max(0, Math.min(100, (rating / 5) * 100)) : 55;

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
        : ratingCount < 200
          ? 85
          : ratingCount < 800
            ? 75
            : 62;

  const availabilityScore = openingHours ? 80 : 45;

  let activityBonus = 0;

  if (activity === 'study') {
    if (category === 'study') activityBonus += 20;
    if (noiseDb <= 55) activityBonus += 15;
  }

  if (activity === 'remote-work') {
    if (category === 'study') activityBonus += 15;
    if (category === 'lifestyle') activityBonus += 12;
    if (openingHours) activityBonus += 10;
    if (rating >= 4.2) activityBonus += 10;
  }

  if (activity === 'relax') {
    if (category === 'leisure') activityBonus += 20;
    if (category === 'culture') activityBonus += 12;
    if (noiseDb <= 65) activityBonus += 8;
  }

  return (
    comfort * 0.25 +
    quietScore * 0.25 +
    weatherScore * 0.2 +
    ratingScore * 0.15 +
    popularityScore * 0.1 +
    availabilityScore * 0.05 +
    activityBonus
  );
}

function DiscoverPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSpaceId = searchParams.get('spaceId');

  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [activity, setActivity] = React.useState<ActivityFilter>('study');
  const [sortBy, setSortBy] = React.useState<SortFilter>('best-match');
  const [searchCenter, setSearchCenter] = React.useState<SearchCenter | null>(null);
  const [userLocation, setUserLocation] = React.useState<LocationPoint | null>(null);
  const [hasAppliedFilters, setHasAppliedFilters] = React.useState(false);

  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = React.useState<string | null>(null);
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

          const matchedId = requestedSpaceId ? String(requestedSpaceId) : null;

          const hasMatchedSpace =
            matchedId !== null &&
            data.some((space) => getSpaceId(space) === matchedId);

          setSelectedSpaceId(
            hasMatchedSpace
              ? matchedId
              : data[0]
                ? getSpaceId(data[0])
                : null
          );
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
  }, [requestedSpaceId]);

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
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('Unable to get user location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  async function handleApplyFilters() {
    setHasAppliedFilters(true);

    const query = search.trim();

    if (!query) {
      setSearchCenter(null);
      return;
    }

    const keyword = query.toLowerCase();

    const matchedSpace = spaces.find((space) => {
      const address = getStringValue(space, ['address'], '');
      const postcode = getStringValue(space, ['postcode'], '');

      const text = [
        space.name,
        space.suburb,
        address,
        postcode,
        space.category,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return text.includes(keyword);
    });

    if (matchedSpace && hasValidCoordinates(matchedSpace)) {
      const center = {
        latitude: getSpaceLatitude(matchedSpace),
        longitude: getSpaceLongitude(matchedSpace),
        label: matchedSpace.name,
      };

      setSearchCenter(center);
      setSelectedSpaceId(getSpaceId(matchedSpace));
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=au&q=${encodeURIComponent(
          `${query}, Melbourne, Victoria, Australia`
        )}`
      );

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const firstResult = data[0];

        const center = {
          latitude: Number(firstResult.lat),
          longitude: Number(firstResult.lon),
          label: firstResult.display_name || query,
        };

        if (
          Number.isFinite(center.latitude) &&
          Number.isFinite(center.longitude)
        ) {
          setSearchCenter(center);
          setSelectedSpaceId(null);
          return;
        }
      }

      setSearchCenter(null);
    } catch (error) {
      console.error('Failed to geocode search query:', error);
      setSearchCenter(null);
    }
  }

  function handleResetFilters() {
    setSearch('');
    setSearchCenter(null);
    setCategory('all');
    setActivity('study');
    setSortBy('best-match');
    setHasAppliedFilters(false);

    if (spaces[0]) {
      setSelectedSpaceId(getSpaceId(spaces[0]));
    } else {
      setSelectedSpaceId(null);
    }
  }

  const filteredSpaces = React.useMemo(() => {
    const keyword = search.trim().toLowerCase();
    let result = [...spaces];

    if (searchCenter) {
      const nearbyRadiusKm = 1.5;

      result = result.filter((space) => {
        if (!hasValidCoordinates(space)) return false;

        const distanceFromSearch = getDistanceKm(searchCenter, {
          latitude: getSpaceLatitude(space),
          longitude: getSpaceLongitude(space),
        });

        return distanceFromSearch <= nearbyRadiusKm;
      });

      result.sort((a, b) => {
        const distanceA = getDistanceKm(searchCenter, {
          latitude: getSpaceLatitude(a),
          longitude: getSpaceLongitude(a),
        });

        const distanceB = getDistanceKm(searchCenter, {
          latitude: getSpaceLatitude(b),
          longitude: getSpaceLongitude(b),
        });

        return distanceA - distanceB;
      });
    } else if (keyword) {
      result = result.filter((space) => {
        const address = getStringValue(space, ['address'], '');
        const postcode = getStringValue(space, ['postcode'], '');
        const openingHours = getStringValue(space, ['openingHours', 'opening_hours'], '');

        const haystack = [
          space.name,
          space.suburb,
          address,
          postcode,
          space.category,
          space.reason,
          space.quietTime,
          space.crowd,
          openingHours,
          ...(space.activityFit ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(keyword);
      });
    }

    if (category !== 'all') {
      result = result.filter((space) => {
        const categoryValue = getStringValue(space, ['category'], '').toLowerCase();
        return categoryValue === category;
      });
    }

    result = result.filter((space) => getActivityMatch(space, activity));

    const distanceCenter = searchCenter ?? userLocation ?? MELBOURNE_CBD_CENTER;

    result = result.map((space) => {
      if (!hasValidCoordinates(space)) return space;

      const distance = getDistanceKm(distanceCenter, {
        latitude: getSpaceLatitude(space),
        longitude: getSpaceLongitude(space),
      });

      return {
        ...space,
        distance: Number(distance.toFixed(2)),
      };
    });

    if (sortBy === 'best-match') {
      result.sort((a, b) => getBestMatchScore(b, activity) - getBestMatchScore(a, activity));
    }

    if (sortBy === 'quietest') {
      result.sort((a, b) => {
        const aNoise = getNumberValue(a, ['noiseDb', 'noise_db'], 999);
        const bNoise = getNumberValue(b, ['noiseDb', 'noise_db'], 999);
        return aNoise - bNoise;
      });
    }

    if (sortBy === 'highest-rating') {
      result.sort((a, b) => {
        const aRating = getNumberValue(a, ['rating'], 0);
        const bRating = getNumberValue(b, ['rating'], 0);
        return bRating - aRating;
      });
    }

    if (sortBy === 'most-reviews') {
      result.sort((a, b) => {
        const aReviews = getNumberValue(a, ['ratingCount', 'rating_count'], 0);
        const bReviews = getNumberValue(b, ['ratingCount', 'rating_count'], 0);
        return bReviews - aReviews;
      });
    }

    return result;
  }, [
    spaces,
    search,
    searchCenter,
    userLocation,
    category,
    activity,
    sortBy,
    hasAppliedFilters,
  ]);

  React.useEffect(() => {
    if (!filteredSpaces.length) {
      setSelectedSpaceId(null);
      return;
    }

    const stillExists = filteredSpaces.some(
      (space) => getSpaceId(space) === selectedSpaceId
    );

    if (!stillExists) {
      const matchedId = requestedSpaceId ? String(requestedSpaceId) : null;

      const hasMatchedFilteredSpace =
        matchedId !== null &&
        filteredSpaces.some((space) => getSpaceId(space) === matchedId);

      setSelectedSpaceId(
        hasMatchedFilteredSpace
          ? matchedId
          : filteredSpaces[0]
            ? getSpaceId(filteredSpaces[0])
            : null
      );
    }
  }, [filteredSpaces, selectedSpaceId, requestedSpaceId]);

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
                mb: 3,
                color: '#52645d',
                fontSize: '1.02rem',
              }}
            >
              Search, filter, and explore all matching spaces across Melbourne.
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
              <TextField
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search suburb or place"
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '14px',
                    bgcolor: '#fffaf1',
                  },
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  label="Category"
                  onChange={(event) => setCategory(event.target.value as CategoryFilter)}
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
                  onChange={(event) => setActivity(event.target.value as ActivityFilter)}
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
                  onChange={(event) => setSortBy(event.target.value as SortFilter)}
                  sx={{
                    borderRadius: '14px',
                    bgcolor: '#fffaf1',
                  }}
                >
                  <MenuItem value="best-match">Best match</MenuItem>
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
                    spaces={filteredSpaces}
                    selectedSpaceId={selectedSpaceId}
                    onSelectSpace={setSelectedSpaceId}
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
                              onDelete={() => handleRemoveFromCompare(getSpaceId(item))}
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
                    Recommendations combine noise level, weather comfort, public rating,
                    review count, opening hours, and activity suitability.
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
                    Best experience now:{' '}
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 900,
                        color: '#273d34',
                      }}
                    >
                      {filteredSpaces[0]?.name ?? spaces[0]?.name ?? 'No result'}
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
                All matching spaces
              </Typography>

              <Typography
                sx={{
                  color: '#52645d',
                  mb: 3,
                }}
              >
                Browse every result that matches your selected filters.
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
              ) : filteredSpaces.length === 0 ? (
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
                    No matching spaces
                  </Typography>

                  <Typography sx={{ color: '#52645d', mt: 1 }}>
                    Try a different keyword or adjust your filters.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {filteredSpaces.slice(0, 6).map((space, index) => {
                    const id = getSpaceId(space);
                    const selected = id === selectedSpaceId;

                    return (
                      <Grid key={id} size={{ xs: 12, md: 6, xl: 4 }}>
                        <Box
                          onClick={() => setSelectedSpaceId(id)}
                          sx={{
                            cursor: 'pointer',
                            '& > *': {
                              borderColor: selected ? '#c9775c !important' : undefined,
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