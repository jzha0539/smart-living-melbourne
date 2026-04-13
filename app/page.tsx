'use client';

import * as React from 'react';
import { Box, Container } from '@mui/material';
import AppNavbar from '../components/AppNavbar';
import HeroSection from '../components/HeroSection';
import FilterPanel from '../components/FilterPanel';
import TopPicksSection from '../components/TopPicksSection';
import { ActivityType, CategoryFilter, SortType, Space } from '../types/space';
import { getInsights, getTopPicks, InsightsResponse } from '../lib/api-client';

export default function HomePage() {
  const [search, setSearch] = React.useState('');
  const [category, setCategory] = React.useState<CategoryFilter>('all');
  const [activity, setActivity] = React.useState<ActivityType>('study');
  const [sortBy, setSortBy] = React.useState<SortType>('best');

  const [topPicks, setTopPicks] = React.useState<Space[]>([]);
  const [insights, setInsights] = React.useState<InsightsResponse | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadHomeData() {
      try {
        setIsLoading(true);
        setError(null);

        const [topPicksData, insightsData] = await Promise.all([
          getTopPicks({ activity, limit: 3 }),
          getInsights({ activity }),
        ]);

        if (!cancelled) {
          setTopPicks(topPicksData);
          setInsights(insightsData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load homepage data.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadHomeData();

    return () => {
      cancelled = true;
    };
  }, [activity]);

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(79,70,229,0.10), transparent 28%), radial-gradient(circle at top right, rgba(14,165,233,0.08), transparent 22%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="xl">
          <HeroSection
            spaces={topPicks}
            topSuggestion={insights?.bestMatch ?? undefined}
          />

          <Box sx={{ mt: 3 }}>
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
          </Box>

          {error ? (
            <Box sx={{ mt: 4, color: 'error.main' }}>{error}</Box>
          ) : (
            <TopPicksSection spaces={topPicks} />
          )}
        </Container>
      </Box>
    </>
  );
}