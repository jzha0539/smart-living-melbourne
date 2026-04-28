'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AppNavbar from '../../components/AppNavbar';
import { Space } from '../../types/space';

function getCompareImage(space: Space) {
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
  activity: 'study' | 'remote work' | 'relax' = 'study'
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

function getBestTimeLabel(space: Space) {
  return {
    study: getPredictedBestTime(space, 'study'),
    remoteWork: getPredictedBestTime(space, 'remote work'),
    relax: getPredictedBestTime(space, 'relax'),
  };
}

function getEstimatedWalkMinutes(space: Space) {
  return Math.max(3, Math.round(space.distance * 12));
}

function getRouteEfficiency(space: Space) {
  const walk = getEstimatedWalkMinutes(space);

  if (walk <= 8) return 'Very easy access';
  if (walk <= 15) return 'Easy access';
  if (walk <= 22) return 'Moderate access';
  return 'Longer walk';
}

function generateNoiseTrend(space: Space) {
  const base = space.noiseDb;
  const activityBias = space.category.toLowerCase().includes('library') ? -4 : 0;

  return Array.from({ length: 24 }, (_, hour) => {
    let value = base + activityBias;

    if (hour >= 7 && hour <= 9) value -= 6;
    if (hour >= 10 && hour <= 13) value += 4;
    if (hour >= 14 && hour <= 17) value += 8;
    if (hour >= 18 && hour <= 20) value += 5;
    if (hour >= 21 || hour <= 6) value -= 7;

    value = Math.max(35, Math.min(90, Math.round(value)));
    return { hour, value };
  });
}

function generateComfortTrend(space: Space) {
  const base = space.comfort;
  const shadeBonus = space.shade >= 70 ? 6 : space.shade >= 50 ? 3 : 0;

  return Array.from({ length: 24 }, (_, hour) => {
    let value = base + shadeBonus;

    if (hour >= 7 && hour <= 10) value += 5;
    if (hour >= 11 && hour <= 14) value -= 6;
    if (hour >= 15 && hour <= 17) value -= 2;
    if (hour >= 18 && hour <= 20) value += 4;
    if (hour >= 21 || hour <= 6) value -= 3;

    value = Math.max(35, Math.min(100, Math.round(value)));
    return { hour, value };
  });
}

function MiniTrendChart({
  title,
  data,
  min,
  max,
  suffix,
}: {
  title: string;
  data: { hour: number; value: number }[];
  min: number;
  max: number;
  suffix: string;
}) {
  const width = 100;
  const height = 44;

  const points = data
    .map((item, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((item.value - min) / (max - min)) * height;
      return `${x},${y}`;
    })
    .join(' ');

  const minValue = Math.min(...data.map((d) => d.value));
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        bgcolor: '#f8fafc',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.78rem',
          fontWeight: 900,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#5850ec',
          mb: 1.2,
        }}
      >
        {title}
      </Typography>

      <Box sx={{ width: '100%', mb: 1 }}>
        <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="72" preserveAspectRatio="none">
          <polyline
            fill="none"
            stroke="#5850ec"
            strokeWidth="2.5"
            points={points}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.72rem',
          color: '#64748b',
          mb: 0.8,
        }}
      >
        <span>0:00</span>
        <span>12:00</span>
        <span>24:00</span>
      </Box>

      <Typography sx={{ fontSize: '0.82rem', color: '#475569' }}>
        Range: {minValue}
        {suffix} – {maxValue}
        {suffix}
      </Typography>
    </Paper>
  );
}

function MetricRow({
  label,
  left,
  right,
}: {
  label: string;
  left: string | number;
  right: string | number;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: '16px',
        border: '1px solid #e5e7eb',
        bgcolor: '#f8fafc',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.75rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#64748b',
          mb: 1.2,
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 2,
        }}
      >
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
          {left}
        </Typography>
        <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
          {right}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const [spaces, setSpaces] = React.useState<Space[]>([]);

  React.useEffect(() => {
    const stored = localStorage.getItem('compare-spaces');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Space[];
      setSpaces(parsed.slice(0, 2));
    } catch {
      localStorage.removeItem('compare-spaces');
    }
  }, []);

  function clearCompare() {
    localStorage.removeItem('compare-spaces');
    setSpaces([]);
  }

  function handleStartRoutine(
    space: Space,
    activity: 'study' | 'remote work' | 'relax' = 'study'
  ) {
    localStorage.setItem('routine-space', JSON.stringify(space));
    localStorage.setItem('routine-activity', activity);
    router.push('/routine');
  }

  const left = spaces[0];
  const right = spaces[1];

  const leftBestTime = left ? getBestTimeLabel(left) : null;
  const rightBestTime = right ? getBestTimeLabel(right) : null;

  const leftWalk = left ? getEstimatedWalkMinutes(left) : null;
  const rightWalk = right ? getEstimatedWalkMinutes(right) : null;

  const leftRoute = left ? getRouteEfficiency(left) : null;
  const rightRoute = right ? getRouteEfficiency(right) : null;

  const leftNoiseTrend = left ? generateNoiseTrend(left) : [];
  const rightNoiseTrend = right ? generateNoiseTrend(right) : [];

  const leftComfortTrend = left ? generateComfortTrend(left) : [];
  const rightComfortTrend = right ? generateComfortTrend(right) : [];

  return (
    <>
      <AppNavbar />

      <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', py: 4 }}>
        <Container maxWidth="xl">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: { xs: '2.6rem', md: '3.6rem' },
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                  color: '#0f172a',
                }}
              >
                Compare spaces
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Compare the places you selected from Discover.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
              {left && (
                <Button
                  onClick={() => handleStartRoutine(left, 'study')}
                  variant="contained"
                  startIcon={<PlayArrowRoundedIcon />}
                  sx={{
                    borderRadius: '999px',
                    px: 2.4,
                    textTransform: 'none',
                    fontWeight: 800,
                    bgcolor: '#5850ec',
                    '&:hover': {
                      bgcolor: '#4e46df',
                    },
                  }}
                >
                  Start routine
                </Button>
              )}

              <Button
                onClick={clearCompare}
                variant="outlined"
                startIcon={<DeleteOutlineRoundedIcon />}
                sx={{
                  borderRadius: '999px',
                  px: 2.4,
                  textTransform: 'none',
                  fontWeight: 800,
                }}
              >
                Clear compare
              </Button>
            </Box>
          </Box>

          {spaces.length < 2 ? (
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
                No spaces selected
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1.2 }}>
                Go back to Discover and click “Add to compare” on up to two places.
              </Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
                gap: 3,
              }}
            >
              {[left, right].map((space, index) => (
                <Paper
                  key={`${space?.name}-${index}`}
                  elevation={0}
                  sx={{
                    overflow: 'hidden',
                    borderRadius: '24px',
                    border: '1px solid #dbe1e8',
                    bgcolor: '#ffffff',
                    boxShadow: '0 18px 50px rgba(15,23,42,0.06)',
                  }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: 260,
                      backgroundImage: `url(${getCompareImage(space as Space)})`,
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
                          'linear-gradient(180deg, rgba(2,6,23,0.18) 0%, rgba(2,6,23,0.70) 100%)',
                      }}
                    />

                    <Box
                      sx={{
                        position: 'absolute',
                        left: 24,
                        bottom: 24,
                        right: 24,
                      }}
                    >
                      <Chip
                        label={index === 0 ? 'Space A' : 'Space B'}
                        sx={{
                          mb: 1.4,
                          borderRadius: '999px',
                          bgcolor: '#fef3c7',
                          color: '#854d0e',
                          fontWeight: 800,
                        }}
                      />

                      <Typography
                        sx={{
                          fontSize: { xs: '2rem', md: '2.7rem' },
                          lineHeight: 1,
                          fontWeight: 900,
                          color: '#fff',
                          letterSpacing: '-0.04em',
                        }}
                      >
                        {space?.name}
                      </Typography>

                      <Typography sx={{ mt: 1, color: 'rgba(255,255,255,0.82)' }}>
                        {space?.category} · {space?.suburb}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      <Chip label={`${space?.distance} km away`} />
                      <Chip label={`Quiet time: ${space?.quietTime}`} />
                    </Box>
                  </Box>
                </Paper>
              ))}

              <Paper
                elevation={0}
                sx={{
                  gridColumn: { xs: 'auto', lg: '1 / -1' },
                  p: { xs: 2.5, md: 3 },
                  borderRadius: '24px',
                  border: '1px solid #dbe1e8',
                  bgcolor: '#ffffff',
                  boxShadow: '0 18px 50px rgba(15,23,42,0.06)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '2rem', md: '2.6rem' },
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    color: '#0f172a',
                    mb: 2.5,
                  }}
                >
                  24-hour noise trend
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <MiniTrendChart
                    title={`${left?.name ?? 'Space A'} noise trend`}
                    data={leftNoiseTrend}
                    min={35}
                    max={90}
                    suffix=" dB"
                  />
                  <MiniTrendChart
                    title={`${right?.name ?? 'Space B'} noise trend`}
                    data={rightNoiseTrend}
                    min={35}
                    max={90}
                    suffix=" dB"
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: { xs: '2rem', md: '2.6rem' },
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    color: '#0f172a',
                    mb: 2.5,
                  }}
                >
                  24-hour comfort trend
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 2,
                    mb: 3,
                  }}
                >
                  <MiniTrendChart
                    title={`${left?.name ?? 'Space A'} comfort trend`}
                    data={leftComfortTrend}
                    min={35}
                    max={100}
                    suffix="/100"
                  />
                  <MiniTrendChart
                    title={`${right?.name ?? 'Space B'} comfort trend`}
                    data={rightComfortTrend}
                    min={35}
                    max={100}
                    suffix="/100"
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: { xs: '2rem', md: '2.6rem' },
                    fontWeight: 900,
                    letterSpacing: '-0.04em',
                    color: '#0f172a',
                    mb: 2.5,
                    mt: 1,
                  }}
                >
                  Side-by-side comparison
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr',
                    gap: 1.5,
                  }}
                >
                  <MetricRow
                    label="Noise"
                    left={`${left.noiseDb} dB`}
                    right={`${right.noiseDb} dB`}
                  />
                  <MetricRow
                    label="Comfort"
                    left={`${left.comfort}/100`}
                    right={`${right.comfort}/100`}
                  />
                  <MetricRow
                    label="Shade"
                    left={`${left.shade}%`}
                    right={`${right.shade}%`}
                  />
                  <MetricRow
                    label="Distance"
                    left={`${left.distance} km`}
                    right={`${right.distance} km`}
                  />
                  <MetricRow
                    label="Best quiet time"
                    left={left.quietTime}
                    right={right.quietTime}
                  />
                  <MetricRow
                    label="Best time for study"
                    left={leftBestTime?.study ?? '—'}
                    right={rightBestTime?.study ?? '—'}
                  />
                  <MetricRow
                    label="Estimated walking time"
                    left={leftWalk ? `~${leftWalk} min` : '—'}
                    right={rightWalk ? `~${rightWalk} min` : '—'}
                  />
                  <MetricRow
                    label="Route convenience"
                    left={leftRoute ?? '—'}
                    right={rightRoute ?? '—'}
                  />
                  <MetricRow
                    label="Reason"
                    left={left.reason}
                    right={right.reason}
                  />
                </Box>
              </Paper>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}