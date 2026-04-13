'use client';

import { Box, Container, Typography } from '@mui/material';
import AppNavbar from '../../components/AppNavbar';
import ComparePanel from '../../components/ComparePanel';
import { mockSpaces } from '../../data/mockSpaces';

export default function ComparePage() {
  const compareSpaces = mockSpaces.filter((space) => [1, 4].includes(space.id));

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
            Compare spaces
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Compare different locations side by side.
          </Typography>

          <ComparePanel spaces={compareSpaces} />
        </Container>
      </Box>
    </>
  );
}