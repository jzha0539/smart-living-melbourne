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
import { alpha, keyframes } from '@mui/material/styles';
import NearMeRoundedIcon from '@mui/icons-material/NearMeRounded';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import ParkRoundedIcon from '@mui/icons-material/ParkRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import AppNavbar from '../components/AppNavbar';
import SpaceCard from '../components/SpaceCard';
import { Space } from '../types/space';

const floatY = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const fadeUp = keyframes`
  0% {
    opacity: 0;
    transform: translateY(24px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
`;

const pulseGlow = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.18);
  }
  70% {
    box-shadow: 0 0 0 14px rgba(99, 102, 241, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(99, 102, 241, 0);
  }
`;

const softDrift = keyframes`
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  50% {
    transform: translate3d(12px, -14px, 0) scale(1.04);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
`;

const introGlow = keyframes`
  0% {
    opacity: 0.18;
    transform: scale(1);
  }
  50% {
    opacity: 0.34;
    transform: scale(1.06);
  }
  100% {
    opacity: 0.18;
    transform: scale(1);
  }
`;

const introTextFloat = keyframes`
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-8px);
  }
  100% {
    transform: translateY(0px);
  }
`;

const introHintFade = keyframes`
  0% {
    opacity: 0.35;
  }
  50% {
    opacity: 0.95;
  }
  100% {
    opacity: 0.35;
  }
`;

function calculateSerenity(space: Space): number {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        (100 - space.noiseDb) * 0.45 + space.comfort * 0.35 + space.shade * 0.2
      )
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
        transition:
          'transform 0.28s ease, box-shadow 0.28s ease, border-color 0.28s ease',
        boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 18px 36px rgba(99,102,241,0.14)',
          borderColor: '#d9ddff',
        },
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#eef2ff',
            color: 'primary.main',
            flexShrink: 0,
            animation: `${floatY} 3.2s ease-in-out infinite`,
            '& .MuiSvgIcon-root': {
              fontSize: 24,
              display: 'block',
            },
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
        transition: 'transform 0.24s ease, background-color 0.24s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          bgcolor: '#f3f6ff',
        },
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

  const [showIntro, setShowIntro] = React.useState(true);
  const [introLeaving, setIntroLeaving] = React.useState(false);
  const [pageReady, setPageReady] = React.useState(false);

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

  React.useEffect(() => {
    const played = sessionStorage.getItem('home-intro-played');
    if (played === 'true') {
      setShowIntro(false);
      setPageReady(true);
    }
  }, []);

  const handleEnterSite = React.useCallback(() => {
    if (introLeaving || !showIntro) return;

    setIntroLeaving(true);
    sessionStorage.setItem('home-intro-played', 'true');

    window.setTimeout(() => {
      setShowIntro(false);
      setPageReady(true);
    }, 850);
  }, [introLeaving, showIntro]);

  const shouldRenderHome = !showIntro && pageReady;

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
      {showIntro && (
        <Box
          onClick={handleEnterSite}
          sx={{
            position: 'fixed',
            inset: 0,
            zIndex: 2000,
            cursor: 'pointer',
            overflow: 'hidden',
            userSelect: 'none',
            backgroundColor: '#eef1f8',
            opacity: introLeaving ? 0 : 1,
            transition: 'opacity 0.8s ease',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'url(/images/1.jpg)',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center center',
              backgroundSize: 'cover',
              transform: introLeaving ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.9s ease',
              filter: 'grayscale(8%) contrast(1.03) brightness(1.02)',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(circle at 18% 22%, rgba(99,102,241,0.14), transparent 20%),
                radial-gradient(circle at 82% 76%, rgba(139,92,246,0.16), transparent 22%),
                linear-gradient(180deg, rgba(248,250,252,0.62) 0%, rgba(238,242,255,0.48) 50%, rgba(248,250,252,0.62) 100%)
              `,
              animation: `${introGlow} 8s ease-in-out infinite`,
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(rgba(99,102,241,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.035) 1px, transparent 1px)',
              backgroundSize: { xs: '28px 28px', md: '42px 42px' },
              opacity: introLeaving ? 0 : 1,
              transition: 'opacity 0.4s ease',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              px: 3,
            }}
          >
            <Box
              sx={{
                textAlign: 'center',
                transform: introLeaving ? 'scale(0.16)' : 'scale(1)',
                opacity: introLeaving ? 0 : 1,
                transition:
                  'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease',
                willChange: 'transform, opacity',
              }}
            >
              <Typography
                sx={{
                  fontSize: { xs: '2.6rem', sm: '4rem', md: '6.2rem' },
                  lineHeight: 0.96,
                  fontWeight: 900,
                  letterSpacing: '-0.08em',
                  textTransform: 'uppercase',
                  color: '#0f172a',
                  animation: introLeaving ? 'none' : `${introTextFloat} 5.4s ease-in-out infinite`,
                  textShadow: '0 14px 40px rgba(15,23,42,0.08)',
                  fontFamily:
                    '"Arial Black", Inter, "Helvetica Neue", Arial, sans-serif',
                  '& .outlined': {
                    color: 'transparent',
                    WebkitTextStroke: '1.5px rgba(15,23,42,0.9)',
                    textShadow: 'none',
                  },
                }}
              >
                <Box component="span" sx={{ display: 'block' }}>
                  START YOUR
                </Box>
                <Box component="span" className="outlined" sx={{ display: 'block', mt: { xs: 0.4, md: 0.2 } }}>
                  IDEAL LIFE
                </Box>
              </Typography>

              
            </Box>
          </Box>
        </Box>
      )}

      {shouldRenderHome && (
        <>
          <AppNavbar />

          <Box
            sx={{
              minHeight: '100vh',
              background:
                'linear-gradient(180deg, #f8fafc 0%, #eef2ff 55%, #f8fafc 100%)',
              py: 4,
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 80,
                left: -60,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: alpha('#6366f1', 0.08),
                filter: 'blur(12px)',
                animation: `${softDrift} 10s ease-in-out infinite`,
                pointerEvents: 'none',
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                right: -40,
                top: 220,
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: alpha('#8b5cf6', 0.08),
                filter: 'blur(14px)',
                animation: `${softDrift} 12s ease-in-out infinite`,
                animationDelay: '1.2s',
                pointerEvents: 'none',
              },
            }}
          >
            <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1 }}>
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
                  position: 'relative',
                  zIndex: 1,
                  animation: `${fadeUp} 0.8s ease both`,
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
                        animation: `${fadeUp} 0.8s ease both`,
                        animationDelay: '0.02s',
                      }}
                    >
                      <Chip
                        label="Smart Living Melbourne"
                        color="primary"
                        sx={{
                          borderRadius: '999px',
                          transition: 'transform 0.24s ease, box-shadow 0.24s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 10px 22px rgba(99,102,241,0.18)',
                          },
                        }}
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
                          animation: `${fadeUp} 0.85s ease both`,
                          animationDelay: '0.1s',
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
                          animation: `${fadeUp} 0.8s ease both`,
                          animationDelay: '0.2s',
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
                        animation: `${fadeUp} 0.8s ease both`,
                        animationDelay: '0.3s',
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
                          transition: 'transform 0.24s ease, box-shadow 0.24s ease',
                          animation: `${pulseGlow} 2.8s infinite`,
                          '&:hover': {
                            transform: 'translateY(-3px) scale(1.02)',
                            boxShadow: '0 18px 32px rgba(79,70,229,0.28)',
                          },
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
                          transition:
                            'transform 0.24s ease, border-color 0.24s ease, background-color 0.24s ease',
                          '&:hover': {
                            transform: 'translateY(-3px)',
                            borderColor: 'primary.main',
                            backgroundColor: alpha('#6366f1', 0.04),
                          },
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
                        animation: `${fadeUp} 0.85s ease both`,
                        animationDelay: '0.38s',
                      }}
                    >
                      <StatCard
                        icon={<VolumeOffRoundedIcon sx={{ transform: 'translateY(2px)' }} />}
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
                      transition:
                        'transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease',
                      animation: `${fadeUp} 0.9s ease both`,
                      animationDelay: '0.2s',
                      boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 18px 40px rgba(99,102,241,0.12)',
                        borderColor: '#d9ddff',
                      },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '1.05rem',
                        fontWeight: 900,
                        color: 'primary.main',
                        mb: 2,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 1,
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
                          <MetricCard label="Comfort" value={`${bestMatch.comfort}/100`} />
                          <MetricCard label="Best quiet time" value={bestMatch.quietTime} />
                          <MetricCard label="Distance" value={`${bestMatch.distance} km`} />
                        </Box>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: '18px',
                            bgcolor: '#f8fafc',
                            transition: 'transform 0.24s ease, background-color 0.24s ease',
                            '&:hover': {
                              transform: 'translateY(-3px)',
                              bgcolor: '#f4f7ff',
                            },
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
                  animation: `${fadeUp} 0.95s ease both`,
                  animationDelay: '0.45s',
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
                      <Box
                        key={`${space.name}-${index}`}
                        sx={{
                          animation: `${fadeUp} 0.75s ease both`,
                          animationDelay: `${0.12 * index}s`,
                          transition: 'transform 0.28s ease',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                          },
                        }}
                      >
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
      )}
    </>
  );
}