'use client';

import { Box, Container, Typography } from '@mui/material';
import AppNavbar from '../../components/AppNavbar';
import TrendsPanel from '../../components/TrendsPanel';

export default function TrendsPage() {
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
            Quiet-time trends
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            Explore historical patterns and better times to visit.
          </Typography>

          <TrendsPanel />
        </Container>
      </Box>
    </>
  );
}