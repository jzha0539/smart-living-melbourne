'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Skeleton,
  Typography,
} from '@mui/material';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import ParkRoundedIcon from '@mui/icons-material/ParkRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import AppNavbar from '../components/AppNavbar';
import SpaceCard from '../components/SpaceCard';
import { Space } from '../types/space';

function calculateSerenity(space: Space): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round((100 - space.noiseDb) * 0.45 + space.comfort * 0.35 + space.shade * 0.2)
    )
  );
}

function enrichSpaces(spaces: Space[]): Space[] {
  return spaces.map((space) => ({
    ...space,
    serenityScore:
      typeof (space as Space & { serenityScore?: number }).serenityScore === 'number'
        ? (space as Space & { serenityScore?: number }).serenityScore
        : calculateSerenity(space),
  }));
}

function getBestMatch(spaces: Space[]): Space | null {
  if (!spaces.length) return null;

  const ranked = [...enrichSpaces(spaces)].sort(
    (a, b) =>
      ((b as Space & { serenityScore?: number }).serenityScore ?? 0) -
      ((a as Space & { serenityScore?: number }).serenityScore ?? 0)
  );

  return ranked[0];
}

function getTopPicks(spaces: Space[]): Space[] {
  return [...enrichSpaces(spaces)]
    .sort(
      (a, b) =>
        ((b as Space & { serenityScore?: number }).serenityScore ?? 0) -
        ((a as Space & { serenityScore?: number }).serenityScore ?? 0)
    )
    .slice(0, 3);
}

async function fetchSpaces(): Promise<Space[]> {
  const res = await fetch('/api/spaces', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch spaces');
  }

  const json = await res.json();
  return (json.data ?? []) as Space[];
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: '24px',
        border: '1px solid #e8edf5',
        bgcolor: 'white',
        minHeight: 96,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.4,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '999px',
            display: 'grid',
            placeItems: 'center',
            bgcolor: '#eef2ff',
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
          <Typography sx={{ fontSize: '1.55rem', fontWeight: 900 }}>
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '20px',
        bgcolor: '#f8fafc',
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem' }, fontWeight: 900 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function HomePage() {
  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchSpaces();
        setSpaces(enrichSpaces(data));
      } catch {
        setError('Failed to load homepage data.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const bestMatch = getBestMatch(spaces);
  const topPicks = getTopPicks(spaces);

  const quietSpacesCount = spaces.filter((space) => space.noiseDb <= 50).length;
  const averageComfort =
    spaces.length > 0
      ? Math.round(spaces.reduce((sum, item) => sum + item.comfort, 0) / spaces.length)
      : 0;
  const highShadeCount = spaces.filter((space) => space.shade >= 70).length;
  const nearbyChoices = spaces.filter((space) => space.distance <= 2).length;

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: '100vh',
          background:
            'linear-gradient(180deg, #f8fafc 0%, #eef2ff 55%, #f8fafc 100%)',
          py: 4,
        }}
      >
        <Container maxWidth="xl">
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '36px',
              border: '1px solid #e8edf5',
              background:
                'radial-gradient(circle at top right, rgba(99,102,241,0.10), transparent 28%), white',
              boxShadow: '0 18px 50px rgba(15,23,42,0.05)',
              mb: 3,
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '1.4fr 1fr' },
                gap: 3,
                alignItems: 'stretch',
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 1.2,
                  }}
                >
                  <Chip
                    label="Smart Living Melbourne"
                    color="primary"
                    sx={{ borderRadius: '999px' }}
                  />
                  <Chip
                    label="Next.js + TypeScript + MUI"
                    variant="outlined"
                    sx={{ borderRadius: '999px' }}
                  />
                </Box>

                <Box>
                  <Typography
                    sx={{
                      fontSize: { xs: '2.8rem', md: '4.4rem' },
                      lineHeight: 1.02,
                      fontWeight: 900,
                      letterSpacing: '-0.04em',
                      maxWidth: 780,
                    }}
                  >
                    Find your ideal spot in Melbourne
                  </Typography>

                  <Typography
                    color="text.secondary"
                    sx={{
                      mt: 2,
                      fontSize: { xs: '1rem', md: '1.1rem' },
                      maxWidth: 720,
                    }}
                  >
                    Discover quiet, shaded, and comfortable places for study,
                    remote work, and everyday reset—without wasting time guessing
                    where to go.
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1.5,
                  }}
                >
                  <Button
                    component={Link}
                    href="/discover"
                    variant="contained"
                    startIcon={<PlaceRoundedIcon />}
                    sx={{
                      borderRadius: '999px',
                      px: 3,
                      py: 1.4,
                      textTransform: 'none',
                      fontWeight: 800,
                      boxShadow: '0 12px 24px rgba(79,70,229,0.22)',
                    }}
                  >
                    Explore spaces
                  </Button>

                  <Button
                    component={Link}
                    href="/suggestions"
                    variant="outlined"
                    startIcon={<BoltRoundedIcon />}
                    sx={{
                      borderRadius: '999px',
                      px: 3,
                      py: 1.4,
                      textTransform: 'none',
                      fontWeight: 800,
                    }}
                  >
                    See top suggestions
                  </Button>
                </Box>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: '1fr 1fr',
                      lg: 'repeat(4, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  <StatCard
                    icon={<VolumeOffRoundedIcon />}
                    label="Quiet spaces"
                    value={loading ? '—' : quietSpacesCount}
                  />
                  <StatCard
                    icon={<WbSunnyRoundedIcon />}
                    label="Average comfort"
                    value={loading ? '—' : `${averageComfort}/100`}
                  />
                  <StatCard
                    icon={<ParkRoundedIcon />}
                    label="High shade spots"
                    value={loading ? '—' : highShadeCount}
                  />
                  <StatCard
                    icon={<NearMeRoundedIcon />}
                    label="Nearby choices"
                    value={loading ? '—' : nearbyChoices}
                  />
                </Box>
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '32px',
                  border: '1px solid #edf2f7',
                  bgcolor: '#ffffff',
                  minHeight: '100%',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '1.05rem',
                    fontWeight: 900,
                    color: 'primary.main',
                    mb: 2,
                  }}
                >
                  ✦ Best match right now
                </Typography>

                {loading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Skeleton variant="text" width="80%" height={54} />
                    <Skeleton variant="text" width="50%" height={30} />

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1.5,
                      }}
                    >
                      {[1, 2, 3, 4].map((item) => (
                        <Skeleton
                          key={item}
                          variant="rounded"
                          height={96}
                          sx={{ borderRadius: '20px' }}
                        />
                      ))}
                    </Box>

                    <Skeleton
                      variant="rounded"
                      height={52}
                      sx={{ borderRadius: '16px' }}
                    />
                  </Box>
                ) : bestMatch ? (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: { xs: '2rem', md: '2.35rem' },
                          lineHeight: 1.08,
                          fontWeight: 900,
                        }}
                      >
                        {bestMatch.name}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {bestMatch.category} · {bestMatch.suburb}
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 1.5,
                      }}
                    >
                      <MetricCard label="Noise" value={`${bestMatch.noiseDb} dB`} />
                      <MetricCard
                        label="Comfort"
                        value={`${bestMatch.comfort}/100`}
                      />
                      <MetricCard
                        label="Best quiet time"
                        value={bestMatch.quietTime}
                      />
                      <MetricCard
                        label="Distance"
                        value={`${bestMatch.distance} km`}
                      />
                    </Box>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: '18px',
                        bgcolor: '#f8fafc',
                      }}
                    >
                      <Typography color="text.secondary">
                        {bestMatch.reason}
                      </Typography>
                    </Paper>
                  </Box>
                ) : (
                  <Typography color="text.secondary">No current result.</Typography>
                )}
              </Paper>
            </Box>
          </Paper>

        

          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: '36px',
              border: '1px solid #e8edf5',
              bgcolor: 'white',
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '2.3rem', md: '3rem' },
                fontWeight: 900,
                mb: 1,
              }}
            >
              Top picks for you
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Smart recommendations based on your activity, comfort, and
              quietness preferences.
            </Typography>

            {error ? (
              <Typography color="error.main">{error}</Typography>
            ) : loading ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                {[1, 2, 3].map((item) => (
                  <Skeleton
                    key={item}
                    variant="rounded"
                    height={420}
                    sx={{ borderRadius: '28px' }}
                  />
                ))}
              </Box>
            ) : (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                  gap: 3,
                }}
              >
                {topPicks.map((space, index) => (
                  <Box key={`${space.name}-${index}`}>
                    <SpaceCard
                      space={space}
                      rank={index + 1}
                      highlight={index === 0}
                    />
                  </Box>
                ))}
              </Box>
            )}
          </Paper>
        </Container>
      </Box>
    </>
  );
}