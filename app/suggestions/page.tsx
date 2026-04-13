'use client';

import * as React from 'react';
import { Box, Container, Typography } from '@mui/material';
import AppNavbar from '../../components/AppNavbar';
import SuggestionsPanel from '../../components/SuggestionsPanel';
import { mockSpaces } from '../../data/mockSpaces';
import { ActivityType, CategoryFilter, SortType } from '../../types/space';
import { filterAndSortSpaces } from '../../utils/spaceHelpers';

export default function SuggestionsPage() {
  const [activity] = React.useState<ActivityType>('study');
  const [category] = React.useState<CategoryFilter>('all');
  const [sortBy] = React.useState<SortType>('best');

  const filteredSpaces = React.useMemo(() => {
    return filterAndSortSpaces({
      spaces: mockSpaces,
      search: '',
      category,
      activity,
      sortBy,
    });
  }, [activity, category, sortBy]);

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          py: 5,
        }}
      >
        <Container maxWidth="xl">
          <Typography variant="h3" sx={{ mb: 1, fontWeight: 900 }}>
            Activity-based suggestions
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Explore the best places based on what you want to do.
          </Typography>

          <SuggestionsPanel spaces={filteredSpaces} activity={activity} />
        </Container>
      </Box>
    </>
  );
}