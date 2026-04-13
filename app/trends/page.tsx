'use client';

import * as React from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Chip,
  Skeleton,
} from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import AppNavbar from '../../components/AppNavbar';

type TrendPoint = {
  hour: number;
  label: string;
  avgNoise: number;
  readings: number;
  level: string;
};

type TrendResponse = {
  success: boolean;
  data?: {
    hourly: TrendPoint[];
    quietest: TrendPoint | null;
    busiest: TrendPoint | null;
  };
};

function formatHourRange(hour: number): string {
  const next = (hour + 1) % 24;

  function to12h(h: number) {
    const suffix = h >= 12 ? 'PM' : 'AM';
    const normalized = h % 12 === 0 ? 12 : h % 12;
    return `${normalized}:00 ${suffix}`;
  }

  return `${to12h(hour)} - ${to12h(next)}`;
}

function getBarColor(noise: number): string {
  if (noise <= 40) return '#4f46e5';
  if (noise <= 50) return '#6366f1';
  if (noise <= 60) return '#818cf8';
  return '#a5b4fc';
}

function SummaryCard({
  icon,
  title,
  value,
  helper,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  helper: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '24px',
        border: '1px solid #e8edf5',
        bgcolor: '#fff',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box
          sx={{
            width: 44,
            height: 44,
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
            {title}
          </Typography>
          <Typography sx={{ fontSize: '1.55rem', fontWeight: 900, mt: 0.4 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
            {helper}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

export default function TrendsPage() {
  const [hourly, setHourly] = React.useState<TrendPoint[]>([]);
  const [quietest, setQuietest] = React.useState<TrendPoint | null>(null);
  const [busiest, setBusiest] = React.useState<TrendPoint | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadTrends() {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch('/api/trends', { cache: 'no-store' });
        if (!res.ok) {
          throw new Error('Request failed');
        }

        const json = (await res.json()) as TrendResponse;

        setHourly(json.data?.hourly ?? []);
        setQuietest(json.data?.quietest ?? null);
        setBusiest(json.data?.busiest ?? null);
      } catch {
        setError('Failed to load historical trend data.');
      } finally {
        setLoading(false);
      }
    }

    loadTrends();
  }, []);

  const maxNoise = Math.max(...hourly.map((item) => item.avgNoise), 1);
  const availableCount = hourly.filter((item) => item.readings > 0).length;

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
          <Box sx={{ mb: 4 }}>
            <Typography
              sx={{
                fontSize: { xs: '2.4rem', md: '3.6rem' },
                fontWeight: 900,
                lineHeight: 1.04,
                mb: 1,
              }}
            >
              Quiet-time trends
            </Typography>

            <Typography color="text.secondary" sx={{ fontSize: '1.05rem' }}>
              Explore historical hourly patterns to find better times to visit.
            </Typography>
          </Box>

          {loading ? (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.5fr 1fr' },
                gap: 3,
              }}
            >
              <Skeleton variant="rounded" height={540} sx={{ borderRadius: '32px' }} />
              <Skeleton variant="rounded" height={540} sx={{ borderRadius: '32px' }} />
            </Box>
          ) : error ? (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '28px',
                border: '1px solid #e8edf5',
                bgcolor: '#fff',
              }}
            >
              <Typography color="error.main">{error}</Typography>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.55fr 0.95fr' },
                gap: 3,
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: '32px',
                  border: '1px solid #e8edf5',
                  bgcolor: '#fff',
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '1.8rem', md: '2.2rem' },
                    fontWeight: 900,
                    mb: 1,
                  }}
                >
                  Historical Quiet-Time Trend
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Lower bars mean quieter average conditions by hour across the
                  available sensor history.
                </Typography>

                <Box
                  sx={{
                    p: { xs: 2, md: 2.5 },
                    borderRadius: '24px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #edf2f7',
                  }}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(24, minmax(24px, 1fr))',
                      alignItems: 'end',
                      gap: 1,
                      minHeight: 280,
                    }}
                  >
                    {hourly.map((item) => {
                      const height =
                        item.readings > 0
                          ? Math.max(18, (item.avgNoise / maxNoise) * 220)
                          : 10;

                      return (
                        <Box
                          key={item.hour}
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.72rem',
                              color: 'text.secondary',
                              writingMode: 'vertical-rl',
                              transform: 'rotate(180deg)',
                              minHeight: 44,
                            }}
                          >
                            {item.readings > 0 ? `${item.avgNoise} dB` : '—'}
                          </Typography>

                          <Box
                            title={`${item.label} · ${item.avgNoise} dB · ${item.level}`}
                            sx={{
                              width: '100%',
                              height,
                              borderRadius: '14px 14px 8px 8px',
                              background:
                                item.readings > 0
                                  ? getBarColor(item.avgNoise)
                                  : '#e5e7eb',
                              opacity: item.readings > 0 ? 1 : 0.5,
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                              },
                            }}
                          />

                          <Typography
                            sx={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: 'text.secondary',
                            }}
                          >
                            {String(item.hour).padStart(2, '0')}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>

                  <Box
                    sx={{
                      mt: 3,
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 1,
                    }}
                  >
                    <Chip
                      size="small"
                      label="Low noise = better quiet time"
                      sx={{ borderRadius: '999px' }}
                    />
                    <Chip
                      size="small"
                      label={`${availableCount} hourly slots with readings`}
                      sx={{ borderRadius: '999px' }}
                    />
                  </Box>
                </Box>
              </Paper>

              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 3,
                }}
              >
                <SummaryCard
                  icon={<AccessTimeRoundedIcon />}
                  title="Best quiet time"
                  value={
                    quietest ? formatHourRange(quietest.hour) : 'No data'
                  }
                  helper={
                    quietest
                      ? `${quietest.avgNoise} dB average · ${quietest.level}`
                      : 'No hourly data available'
                  }
                />

                <SummaryCard
                  icon={<VolumeUpRoundedIcon />}
                  title="Most active hour"
                  value={
                    busiest ? formatHourRange(busiest.hour) : 'No data'
                  }
                  helper={
                    busiest
                      ? `${busiest.avgNoise} dB average · ${busiest.level}`
                      : 'No hourly data available'
                  }
                />

                <SummaryCard
                  icon={<InsightsRoundedIcon />}
                  title="What this means"
                  value={
                    quietest
                      ? `Try visiting around ${formatHourRange(quietest.hour)}`
                      : 'Historical guidance unavailable'
                  }
                  helper={
                    quietest && busiest
                      ? `Compared with the busiest period, this quieter window can help reduce distractions and make study or breaks more predictable.`
                      : 'Use this page to identify calmer periods from historical readings.'
                  }
                />

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '28px',
                    border: '1px solid #e8edf5',
                    bgcolor: '#fff',
                  }}
                >
                  <Typography sx={{ fontSize: '1.35rem', fontWeight: 900, mb: 1.5 }}>
                    Hour-by-hour snapshot
                  </Typography>

                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 1.2,
                    }}
                  >
                    {hourly
                      .filter((item) => item.readings > 0)
                      .slice(0, 8)
                      .map((item) => (
                        <Paper
                          key={item.hour}
                          elevation={0}
                          sx={{
                            p: 1.5,
                            borderRadius: '18px',
                            bgcolor: '#f8fafc',
                            border: '1px solid #edf2f7',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 2,
                              alignItems: 'center',
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontWeight: 800 }}>
                                {formatHourRange(item.hour)}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {item.level}
                              </Typography>
                            </Box>

                            <Chip
                              label={`${item.avgNoise} dB`}
                              sx={{ borderRadius: '999px', fontWeight: 700 }}
                            />
                          </Box>
                        </Paper>
                      ))}
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}