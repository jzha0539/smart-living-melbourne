'use client';

import * as React from 'react';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AppNavbar from '../../components/AppNavbar';
import { Space } from '../../types/space';

function getCompareImage(space: Space) {
  const name = space.name.toLowerCase();
  const category = space.category.toLowerCase();

  // specific spaces
  if (name.includes('birrarung')) return '/images/birrarung.jpg';
  if (name.includes('enterprise')) return '/images/enterprise.jpg';
  if (name.includes('skyfarm') || name.includes('mcec')) return '/images/skyfarm.jpg';
  if (name.includes('ch1')) return '/images/rooftop.jpg';
  if (name.includes('101 collins')) return '/images/rooftop.jpg';
  if (name.includes('treasury')) return '/images/lounge.jpg';

  // category fallback
  if (category.includes('park')) return '/images/park.jpg';
  if (category.includes('rooftop')) return '/images/rooftop.jpg';
  if (category.includes('library')) return '/images/library.jpg';
  if (category.includes('public lounge')) return '/images/lounge.jpg';

  // final fallback
  return '/images/1.jpg';
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

  const left = spaces[0];
  const right = spaces[1];

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