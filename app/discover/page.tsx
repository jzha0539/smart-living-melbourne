'use client';

import * as React from 'react';
import { Box, Container, Grid, Paper, Typography } from '@mui/material';
import AppNavbar from '../../components/AppNavbar';
import FilterPanel from '../../components/FilterPanel';
import MapPlaceholder from '../../components/MapPlaceholder';
import SpaceCard from '../../components/SpaceCard';
import { ActivityType, CategoryFilter, SortType, Space } from '../../types/space';
import { getSpaces } from '../../lib/api-client';

export default function DiscoverPage() {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [activity, setActivity] = React.useState<ActivityType>('study');
  const [sortBy, setSortBy] = React.useState<SortType>('best');

  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = React.useState<number | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadSpaces() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await getSpaces({
          q: search,
          category,
          activity,
          sortBy,
        });

        if (!cancelled) {
          setSpaces(data);
          setSelectedSpaceId(data[0]?.id ?? null);
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
  }, [search, category, activity, sortBy]);

  const selectedSpace = React.useMemo(
    () => spaces.find((space) => space.id === selectedSpaceId) ?? null,
    [spaces, selectedSpaceId]
  );

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
            <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, mb: 1 }}>
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
            />

            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12, lg: 8 }}>
                <MapPlaceholder
                  spaces={spaces}
                  selectedSpaceId={selectedSpaceId}
                  onSelectSpace={setSelectedSpaceId}
                />

                <Box sx={{ mt: 4 }}>
                  <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, mb: 1 }}>
                    All matching spaces
                  </Typography>

                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Browse every result that matches your selected filters.
                  </Typography>

                  {error ? (
                    <Box sx={{ color: 'error.main' }}>{error}</Box>
                  ) : isLoading ? (
                    <Box>Loading spaces...</Box>
                  ) : (
                    <Grid container spacing={3}>
                      {spaces.map((space, index) => (
                        <Grid key={space.id} size={{ xs: 12, md: 6 }}>
                          <SpaceCard
                            space={space}
                            rank={index + 1}
                            selected={space.id === selectedSpaceId}
                            onClick={() => setSelectedSpaceId(space.id)}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Box>
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

                  <Box sx={{ display: 'grid', gap: 1.5 }}>
                    {[
                      'Quietness for focus and comfort',
                      'Outdoor shade for healthier breaks',
                      'Distance for faster decisions',
                      'Activity fit for study, work, or relax',
                    ].map((item) => (
                      <Box
                        key={item}
                        sx={{
                          p: 1.6,
                          borderRadius: '18px',
                          bgcolor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        <Typography variant="body2">{item}</Typography>
                      </Box>
                    ))}
                  </Box>
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
                    <strong>{selectedSpace?.name ?? spaces[0]?.name ?? 'No result'}</strong>
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Box>
    </>
  );
}