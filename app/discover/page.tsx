'use client';

import * as React from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AppNavbar from '../../components/AppNavbar';
import FilterPanel from '../../components/FilterPanel';
import MapPlaceholder from '../../components/MapPlaceholder';
import SpaceCard from '../../components/SpaceCard';
import FloatingCompareButton from '../../components/FloatingCompareButton';
import { ActivityType, CategoryFilter, SortType, Space } from '../../types/space';
import { getSpaces } from '../../lib/api-client';

type SearchCenter = {
  latitude: number;
  longitude: number;
  label: string;
};

function getSpaceLatitude(space: Space) {
  return Number(space.latitude);
}

function getSpaceLongitude(space: Space) {
  return Number(space.longitude);
}

function hasValidCoordinates(space: Space) {
  return (
    Number.isFinite(getSpaceLatitude(space)) &&
    Number.isFinite(getSpaceLongitude(space))
  );
}

function getDistanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
) {
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

function getBestScore(space: Space) {
  return (100 - space.noiseDb) * 0.45 + space.comfort * 0.35 + space.shade * 0.2;
}

function DiscoverPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedSpaceId = searchParams.get('spaceId');

  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [activity, setActivity] = React.useState<ActivityType>('study');
  const [sortBy, setSortBy] = React.useState<SortType>('best');
  const [searchCenter, setSearchCenter] = React.useState<SearchCenter | null>(null);

  const [hasAppliedFilters, setHasAppliedFilters] = React.useState(false);

  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = React.useState<number | null>(null);
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

          const matchedId = requestedSpaceId ? Number(requestedSpaceId) : null;
          const hasMatchedSpace =
            matchedId !== null && data.some((space) => space.id === matchedId);

          setSelectedSpaceId(hasMatchedSpace ? matchedId : data[0]?.id ?? null);
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

  async function handleApplyFilters() {
    setHasAppliedFilters(true);
  
    const query = search.trim();
  
    if (!query) {
      setSearchCenter(null);
      return;
    }
  
    const keyword = query.toLowerCase();
  
    // 1. First try to match local POI database by name, suburb, address, category
    const matchedSpace = spaces.find((space) => {
      const address = String((space as any).address ?? '');
      const postcode = String((space as any).postcode ?? '');
  
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
      setSelectedSpaceId(matchedSpace.id);
      return;
    }
  
    // 2. If not found in local data, geocode the address/street
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

  const filteredSpaces = React.useMemo(() => {
    if (!hasAppliedFilters) {
      return spaces;
    }
  
    const keyword = search.trim().toLowerCase();
    let result = [...spaces];
  
    // If the search has a geocoded center, show nearby places
    if (searchCenter) {
      const nearbyRadiusKm = 1.5;
  
      result = result.filter((space) => {
        if (!hasValidCoordinates(space)) {
          return false;
        }
  
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
      // Fallback text search if geocoding failed
      result = result.filter((space) => {
        const address = String((space as any).address ?? '');
        const postcode = String((space as any).postcode ?? '');
  
        const haystack = [
          space.name,
          space.suburb,
          address,
          postcode,
          space.category,
          space.reason,
          space.quietTime,
          space.crowd,
          ...(space.activityFit ?? []),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
  
        return haystack.includes(keyword);
      });
    }
  
    // Category matches database values:
    // study / leisure / culture / lifestyle
    if (category !== 'all') {
      result = result.filter((space) => {
        const c = String(space.category ?? '').toLowerCase();
        return c === category;
      });
    }
  
    // Activity is user intent
    if (activity === 'study') {
      result = result.filter((space) => {
        const c = String(space.category ?? '').toLowerCase();
        return c === 'study' || Number(space.noiseDb ?? 999) <= 65;
      });
    } else if (activity === 'remote work') {
      result = result.filter((space) => {
        const c = String(space.category ?? '').toLowerCase();
        return (
          c === 'study' ||
          c === 'lifestyle' ||
          Number(space.comfort ?? 0) >= 55
        );
      });
    } else if (activity === 'relax') {
      result = result.filter((space) => {
        const c = String(space.category ?? '').toLowerCase();
        return (
          c === 'leisure' ||
          Number(space.shade ?? 0) >= 40 ||
          Number(space.noiseDb ?? 999) <= 60
        );
      });
    }
  
    if (sortBy === 'distance') {
      if (searchCenter) {
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
      } else {
        result.sort(
          (a, b) => Number(a.distance ?? 999) - Number(b.distance ?? 999)
        );
      }
    } else if (sortBy === 'quiet') {
      result.sort(
        (a, b) => Number(a.noiseDb ?? 999) - Number(b.noiseDb ?? 999)
      );
    } else if (sortBy === 'comfort') {
      result.sort(
        (a, b) => Number(b.comfort ?? 0) - Number(a.comfort ?? 0)
      );
    } else if (!searchCenter) {
      result.sort((a, b) => getBestScore(b) - getBestScore(a));
    }
  
    return result;
  }, [
    spaces,
    search,
    searchCenter,
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

    const stillExists = filteredSpaces.some((space) => space.id === selectedSpaceId);

    if (!stillExists) {
      const matchedId = requestedSpaceId ? Number(requestedSpaceId) : null;
      const hasMatchedFilteredSpace =
        matchedId !== null && filteredSpaces.some((space) => space.id === matchedId);

      setSelectedSpaceId(hasMatchedFilteredSpace ? matchedId : filteredSpaces[0]?.id ?? null);
    }
  }, [filteredSpaces, selectedSpaceId, requestedSpaceId]);

  function handleAddToCompare(space: Space) {
    setCompareSpaces((prev) => {
      const exists = prev.some((item) => item.name === space.name);
      if (exists) return prev;

      const next = prev.length >= 2 ? [prev[1], space] : [...prev, space];
      localStorage.setItem('compare-spaces', JSON.stringify(next));
      return next;
    });
  }

  function handleRemoveFromCompare(name: string) {
    setCompareSpaces((prev) => {
      const next = prev.filter((item) => item.name !== name);
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
          background:
            'radial-gradient(circle at top left, rgba(79,70,229,0.08), transparent 26%), radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 20%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="xl">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '32px',
              bgcolor: 'rgba(255,255,255,0.62)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 16px 50px rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(255,255,255,0.72)',
            }}
          >
            <Typography
              sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, mb: 1 }}
            >
              Discover spaces
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Search, filter, and explore all matching spaces across Melbourne.
            </Typography>

            <FilterPanel
  search={search}
  category={category}
  activity={activity}
  sortBy={sortBy}
  onSearchChange={setSearch}
  onCategoryChange={setCategory}
  onActivityChange={setActivity}
  onSortChange={setSortBy}
  onApply={handleApplyFilters}
  onReset={() => {
    setSearch('');
    setSearchCenter(null);
    setCategory('all');
    setActivity('study');
    setSortBy('best');
    setHasAppliedFilters(false);
    setSelectedSpaceId(null);
  }}
/>

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <MapPlaceholder
                  spaces={filteredSpaces}
                  selectedSpaceId={selectedSpaceId}
                  onSelectSpace={setSelectedSpaceId}
                />

                <Paper
                  elevation={0}
                  sx={{
                    mt: 3,
                    p: 2,
                    borderRadius: '18px',
                    border: '1px solid #dbe1e8',
                    bgcolor: '#ffffff',
                    boxShadow: '0 12px 30px rgba(15,23,42,0.05)',
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
                          letterSpacing: '0.12em',
                          textTransform: 'uppercase',
                          color: '#5850ec',
                          mb: 0.6,
                        }}
                      >
                        Compare list
                      </Typography>

                      {compareSpaces.length === 0 ? (
                        <Typography color="text.secondary">
                          Select up to 2 spaces to compare.
                        </Typography>
                      ) : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {compareSpaces.map((item) => (
                            <Chip
                              key={item.name}
                              label={item.name}
                              onDelete={() => handleRemoveFromCompare(item.name)}
                              sx={{
                                borderRadius: '999px',
                                bgcolor: '#f1efff',
                                color: '#4f46e5',
                                fontWeight: 800,
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
                            fontWeight: 800,
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
                          fontWeight: 800,
                          bgcolor: '#5850ec',
                          boxShadow: '0 10px 20px rgba(88,80,236,0.25)',
                          '&:hover': {
                            bgcolor: '#4e46df',
                          },
                          '&.Mui-disabled': {
                            bgcolor: '#c7c4ff',
                            color: '#fff',
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
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '32px',
                    bgcolor: 'white',
                    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
                    mb: 3,
                  }}
                >
                  <Typography sx={{ fontSize: '2rem', fontWeight: 900, mb: 1 }}>
                    Why these places?
                  </Typography>

                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    Recommendations combine noise level, comfort score, shade, distance,
                    and activity suitability.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    p: 3,
                    borderRadius: '32px',
                    bgcolor: 'white',
                    boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
                  }}
                >
                  <Typography sx={{ fontSize: '2rem', fontWeight: 900, mb: 1 }}>
                    Quick insight
                  </Typography>

                  <Typography color="text.secondary">
                    Best experience now:{' '}
                    <strong>
                      {filteredSpaces[0]?.name ?? spaces[0]?.name ?? 'No result'}
                    </strong>
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Typography
                sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, mb: 1 }}
              >
                All matching spaces
              </Typography>

              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Browse every result that matches your selected filters.
              </Typography>

              {error ? (
                <Box sx={{ color: 'error.main' }}>{error}</Box>
              ) : isLoading ? (
                <Box>Loading spaces...</Box>
              ) : filteredSpaces.length === 0 ? (
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '24px',
                    border: '1px solid #e5e7eb',
                    bgcolor: '#ffffff',
                  }}
                >
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 900 }}>
                    No matching spaces
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Try a different keyword or adjust your filters.
                  </Typography>
                </Paper>
              ) : (
                <Grid container spacing={3}>
                  {filteredSpaces.slice(0, 6).map((space, index) => (
                    <Grid key={space.id} size={{ xs: 12, md: 6, xl: 4 }}>
                      <Box
                        onClick={() => setSelectedSpaceId(space.id)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <SpaceCard
  space={space}
  rank={index + 1}
  selected={selectedSpaceId === space.id}
  onSelect={(selectedSpace) => setSelectedSpaceId(selectedSpace.id)}
  onAddToCompare={handleAddToCompare}
  isCompared={compareSpaces.some(
    (item) => item.name === space.name
  )}
/>
                      </Box>
                    </Grid>
                  ))}
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
          background:
            'radial-gradient(circle at top left, rgba(79,70,229,0.08), transparent 26%), radial-gradient(circle at top right, rgba(14,165,233,0.06), transparent 20%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="xl">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '32px',
              bgcolor: 'rgba(255,255,255,0.62)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 16px 50px rgba(15, 23, 42, 0.06)',
              border: '1px solid rgba(255,255,255,0.72)',
            }}
          >
            <Typography
              sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900 }}
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