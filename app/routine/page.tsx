'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import AppNavbar from '../../components/AppNavbar';
import { Space } from '../../types/space';

type RoutineActivity = 'study' | 'remote work' | 'relax';

function getRoutineImage(space: Space) {
  const name = space.name.toLowerCase();
  const category = space.category.toLowerCase();

  if (name.includes('birrarung')) return '/images/birrarung.jpg';
  if (name.includes('enterprize') || name.includes('enterprise')) return '/images/enterprize.jpg';
  if (name.includes('skyfarm') || name.includes('mcec')) return '/images/skyfarm.jpg';
  if (name.includes('ch1')) return '/images/rooftop.jpg';
  if (name.includes('101 collins')) return '/images/rooftop.jpg';
  if (name.includes('treasury')) return '/images/lounge.jpg';

  if (category.includes('park')) return '/images/park.jpg';
  if (category.includes('rooftop')) return '/images/rooftop.jpg';
  if (category.includes('library')) return '/images/library.jpg';
  if (category.includes('public lounge')) return '/images/lounge.jpg';

  return '/images/1.jpg';
}

function getPredictedBestTime(
  space: Space,
  activity: RoutineActivity = 'study'
) {
  const noiseDb = space.noiseDb;
  const comfort = space.comfort;
  const shade = space.shade;

  if (activity === 'study') {
    if (noiseDb <= 50) return '9am–11am';
    if (noiseDb <= 60) return '8am–10am';
    if (noiseDb <= 70) return '7am–9am';
    return 'before 8am';
  }

  if (activity === 'remote work') {
    if (comfort >= 80) return '10am–1pm';
    if (comfort >= 65) return '9am–12pm';
    if (comfort >= 50) return '8am–10am';
    return 'before 9am';
  }

  if (shade >= 70) return 'after 4pm';
  if (shade >= 50) return '3pm–5pm';
  return 'before 10am or after 5pm';
}

function getEstimatedWalkMinutes(space: Space) {
  return Math.max(3, Math.round(space.distance * 12));
}

export default function RoutinePage() {
  const [space, setSpace] = React.useState<Space | null>(null);
  const [activity, setActivity] = React.useState<RoutineActivity>('study');

  React.useEffect(() => {
    const storedSpace = localStorage.getItem('routine-space');
    const storedActivity = localStorage.getItem('routine-activity');

    if (storedSpace) {
      try {
        setSpace(JSON.parse(storedSpace) as Space);
      } catch {
        localStorage.removeItem('routine-space');
      }
    }

    if (
      storedActivity === 'study' ||
      storedActivity === 'remote work' ||
      storedActivity === 'relax'
    ) {
      setActivity(storedActivity);
    }
  }, []);

  if (!space) {
    return (
      <>
        <AppNavbar />
        <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', py: 4 }}>
          <Container maxWidth="lg">
            <Paper
              elevation={0}
              sx={{
                p: 4,
                borderRadius: '28px',
                border: '1px solid #e5e7eb',
                bgcolor: '#ffffff',
              }}
            >
              <Typography sx={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a' }}>
                No routine selected
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.2, mb: 3 }}>
                Go back and start a routine from a space card or compare page.
              </Typography>

              <Button
                component={Link}
                href="/discover"
                startIcon={<ArrowBackRoundedIcon />}
                variant="contained"
                sx={{
                  borderRadius: '999px',
                  textTransform: 'none',
                  fontWeight: 800,
                }}
              >
                Back to discover
              </Button>
            </Paper>
          </Container>
        </Box>
      </>
    );
  }

  const bestTime = getPredictedBestTime(space, activity);
  const walkMinutes = getEstimatedWalkMinutes(space);

  return (
    <>
      <AppNavbar />

      <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', py: 4 }}>
        <Container maxWidth="lg">
          <Paper
            elevation={0}
            sx={{
              overflow: 'hidden',
              borderRadius: '28px',
              border: '1px solid #dbe1e8',
              bgcolor: '#ffffff',
              boxShadow: '0 18px 50px rgba(15,23,42,0.06)',
            }}
          >
            <Box
              sx={{
                position: 'relative',
                minHeight: 340,
                backgroundImage: `url(${getRoutineImage(space)})`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.75) 100%)',
                }}
              />

              <Box
                sx={{
                  position: 'absolute',
                  left: 28,
                  right: 28,
                  bottom: 28,
                }}
              >
                <Chip
                  icon={<PlayArrowRoundedIcon />}
                  label="Routine started"
                  sx={{
                    mb: 1.5,
                    borderRadius: '999px',
                    bgcolor: '#dcfce7',
                    color: '#166534',
                    fontWeight: 800,
                  }}
                />

                <Typography
                  sx={{
                    fontSize: { xs: '2.3rem', md: '3.4rem' },
                    lineHeight: 1,
                    fontWeight: 900,
                    color: '#fff',
                    letterSpacing: '-0.05em',
                  }}
                >
                  {space.name}
                </Typography>

                <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.82)' }}>
                  {space.category} · {space.suburb}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: { xs: 3, md: 4 } }}>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#5850ec',
                  mb: 1.2,
                }}
              >
                Current routine
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mb: 3 }}>
                <Chip label={`Mode: ${activity}`} />
                <Chip icon={<AccessTimeRoundedIcon />} label={`Best time: ${bestTime}`} />
                <Chip icon={<PlaceRoundedIcon />} label={`~${walkMinutes} min walk`} />
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: '20px',
                  border: '1px solid #e5e7eb',
                  bgcolor: '#f8fafc',
                  mb: 3,
                }}
              >
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 900, mb: 1 }}>
                  Focus mode active
                </Typography>
                <Typography color="text.secondary">
                  Your routine has started. This space was selected based on quietness,
                  comfort, shade, and accessibility, with a recommended time window of{' '}
                  <strong>{bestTime}</strong>.
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 2.4,
                  borderRadius: '20px',
                  border: '1px solid #e5e7eb',
                  bgcolor: '#ffffff',
                  mb: 3,
                }}
              >
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 900, mb: 1 }}>
                  Why this space
                </Typography>
                <Typography color="text.secondary">{space.reason}</Typography>
              </Paper>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                <Button
                  component={Link}
                  href="/discover"
                  variant="outlined"
                  startIcon={<ArrowBackRoundedIcon />}
                  sx={{
                    borderRadius: '999px',
                    textTransform: 'none',
                    fontWeight: 800,
                  }}
                >
                  Back to discover
                </Button>

                <Button
                  component="a"
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${space.name}, ${space.suburb}, Melbourne`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  variant="contained"
                  startIcon={<PlaceRoundedIcon />}
                  sx={{
                    borderRadius: '999px',
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: '#5850ec',
                    '&:hover': {
                      bgcolor: '#4e46df',
                    },
                  }}
                >
                  Open route
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      </Box>
    </>
  );
}