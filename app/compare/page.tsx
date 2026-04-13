'use client';

import * as React from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import AppNavbar from '../../components/AppNavbar';
import ComparePanel from '../../components/ComparePanel';
import { Space } from '../../types/space';

const STORAGE_KEY = 'compare-space-ids';

async function fetchSpace(id: number): Promise<Space | null> {
  try {
    const res = await fetch(`/api/spaces/${id}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    const json = await res.json();
    return json.data as Space;
  } catch {
    return null;
  }
}

export default function ComparePage() {
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadCompareSpaces() {
      setLoading(true);

      const raw = window.localStorage.getItem(STORAGE_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];

      const results = await Promise.all(ids.map((id) => fetchSpace(id)));

      setSpaces(results.filter(Boolean) as Space[]);
      setLoading(false);
    }

    loadCompareSpaces();
    window.addEventListener('compare-storage-updated', loadCompareSpaces);

    return () => {
      window.removeEventListener('compare-storage-updated', loadCompareSpaces);
    };
  }, []);

  function clearCompare() {
    window.localStorage.removeItem(STORAGE_KEY);
    setSpaces([]);
    window.dispatchEvent(new Event('compare-storage-updated'));
  }

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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 2,
              flexWrap: 'wrap',
              mb: 4,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 900,
                  mb: 1,
                }}
              >
                Compare spaces
              </Typography>
              <Typography color="text.secondary">
                Compare the places you selected from Discover.
              </Typography>
            </Box>

            <Button
              onClick={clearCompare}
              variant="outlined"
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 700,
                alignSelf: 'flex-start',
              }}
            >
              Clear compare
            </Button>
          </Box>

          {loading ? (
            <Box>Loading compare data...</Box>
          ) : (
            <ComparePanel spaces={spaces} />
          )}
        </Container>
      </Box>
    </>
  );
}