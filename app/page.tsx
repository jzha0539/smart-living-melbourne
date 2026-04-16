'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import AppNavbar from '../components/AppNavbar';
import SpaceCard from '../components/SpaceCard';
import { Space } from '../types/space';

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
  0% { box-shadow: 0 0 0 0 rgba(34,197,94,0.18); }
  70% { box-shadow: 0 0 0 14px rgba(34,197,94,0); }
  100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
`;

const introGlow = keyframes`
  0% { opacity: 0.18; transform: scale(1); }
  50% { opacity: 0.34; transform: scale(1.06); }
  100% { opacity: 0.18; transform: scale(1); }
`;

const introTextFloat = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0px); }
`;

const introHintFade = keyframes`
  0% { opacity: 0.35; }
  50% { opacity: 0.95; }
  100% { opacity: 0.35; }
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
        p: 2.4,
        borderRadius: '18px',
        border: '1px solid #e5e7eb',
        bgcolor: '#f8fafc',
        minHeight: 108,
        transition: 'transform 0.24s ease, box-shadow 0.24s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 14px 30px rgba(15,23,42,0.08)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#ecfdf5',
            color: '#15803d',
            flexShrink: 0,
            '& .MuiSvgIcon-root': {
              fontSize: 22,
              display: 'block',
            },
          }}
        >
          {icon}
        </Box>

        <Box>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#64748b',
            }}
          >
            {label}
          </Typography>
          <Typography sx={{ fontSize: '1.7rem', fontWeight: 900, color: '#0f172a' }}>
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
        borderRadius: '16px',
        bgcolor: '#f8fafc',
        border: '1px solid #e5e7eb',
        transition: 'transform 0.24s ease, box-shadow 0.24s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 10px 24px rgba(15,23,42,0.07)',
        },
      }}
    >
      <Typography
        sx={{
          fontSize: '0.72rem',
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: '#64748b',
          mb: 0.4,
        }}
      >
        {label}
      </Typography>
      <Typography sx={{ fontSize: { xs: '1.45rem', md: '1.9rem' }, fontWeight: 900 }}>
        {value}
      </Typography>
    </Paper>
  );
}

export default function HomePage() {
  const router = useRouter();

  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [showIntro, setShowIntro] = React.useState(true);
  const [introLeaving, setIntroLeaving] = React.useState(false);
  const [pageReady, setPageReady] = React.useState(false);

  const [compareSpaces, setCompareSpaces] = React.useState<Space[]>([]);

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

  React.useEffect(() => {
    const stored = localStorage.getItem('compare-spaces');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Space[];
        setCompareSpaces(parsed.slice(0, 2));
      } catch {
        localStorage.removeItem('compare-spaces');
      }
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

  const handleAddToCompare = React.useCallback((space: Space) => {
    setCompareSpaces((prev) => {
      const exists = prev.some((item) => item.name === space.name);
      if (exists) return prev;

      const next = prev.length >= 2 ? [prev[1], space] : [...prev, space];
      localStorage.setItem('compare-spaces', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleRemoveFromCompare = React.useCallback((name: string) => {
    setCompareSpaces((prev) => {
      const next = prev.filter((item) => item.name !== name);
      localStorage.setItem('compare-spaces', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleGoToCompare = React.useCallback(() => {
    localStorage.setItem('compare-spaces', JSON.stringify(compareSpaces));
    router.push('/compare');
  }, [compareSpaces, router]);

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
                <Box
                  component="span"
                  className="outlined"
                  sx={{ display: 'block', mt: { xs: 0.4, md: 0.2 } }}
                >
                  IDEAL LIFE
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  fontSize: { xs: '0.92rem', md: '1rem' },
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  color: 'rgba(15,23,42,0.72)',
                  animation: introLeaving ? 'none' : `${introHintFade} 2.2s ease-in-out infinite`,
                }}
              >
                Tap anywhere to enter
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {shouldRenderHome && (
        <>
          <AppNavbar />

          <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', pb: 6 }}>
            <Container maxWidth="xl" sx={{ pt: 2 }}>
              <Paper
                elevation={0}
                sx={{
                  overflow: 'hidden',
                  borderRadius: '22px',
                  border: '1px solid #dbe1e8',
                  boxShadow: '0 18px 50px rgba(15,23,42,0.08)',
                  animation: `${fadeUp} 0.7s ease both`,
                  bgcolor: '#fff',
                }}
              >
                <Box
                  sx={{
                    position: 'relative',
                    minHeight: { xs: 420, md: 520 },
                    display: 'flex',
                    alignItems: 'flex-end',
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
                      filter: 'brightness(0.55) contrast(1.05)',
                      transform: 'scale(1.02)',
                    }}
                  />

                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(180deg, rgba(2,6,23,0.22) 0%, rgba(2,6,23,0.52) 55%, rgba(2,6,23,0.82) 100%)',
                    }}
                  />

                  <Box
                    sx={{
                      position: 'absolute',
                      inset: 0,
                      background:
                        'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                      backgroundSize: '32px 32px',
                      opacity: 0.24,
                    }}
                  />

                  <Box
                    sx={{
                      position: 'relative',
                      zIndex: 2,
                      width: '100%',
                      p: { xs: 3, md: 5 },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mb: 2,
                        animation: `${fadeUp} 0.8s ease both`,
                        animationDelay: '0.05s',
                      }}
                    >
                      <Chip
                        label="Smart Living Melbourne"
                        sx={{
                          borderRadius: '999px',
                          bgcolor: '#fef3c7',
                          color: '#854d0e',
                          fontWeight: 800,
                          height: 28,
                        }}
                      />
                      <Chip
                        label="Quiet • Comfortable • Nearby"
                        sx={{
                          borderRadius: '999px',
                          bgcolor: alpha('#ffffff', 0.14),
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.18)',
                          fontWeight: 700,
                          height: 28,
                        }}
                      />
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: '1.2fr 0.8fr' },
                        gap: 3,
                        alignItems: 'end',
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: { xs: '2.5rem', md: '4rem' },
                            lineHeight: 0.95,
                            fontWeight: 900,
                            color: '#fff',
                            letterSpacing: '-0.05em',
                            maxWidth: 780,
                            animation: `${fadeUp} 0.84s ease both`,
                            animationDelay: '0.1s',
                          }}
                        >
                          Find your ideal spot in Melbourne
                        </Typography>

                        <Typography
                          sx={{
                            mt: 1.8,
                            maxWidth: 720,
                            fontSize: { xs: '1rem', md: '1.08rem' },
                            color: 'rgba(255,255,255,0.82)',
                            animation: `${fadeUp} 0.84s ease both`,
                            animationDelay: '0.18s',
                          }}
                        >
                          Discover quiet, shaded, and comfortable places for study,
                          remote work, and everyday reset—without wasting time guessing
                          where to go.
                        </Typography>

                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 1.5,
                            mt: 3,
                            animation: `${fadeUp} 0.84s ease both`,
                            animationDelay: '0.28s',
                          }}
                        >
                          <Button
                            component={Link}
                            href="/discover"
                            variant="contained"
                            startIcon={<PlaceRoundedIcon />}
                            sx={{
                              borderRadius: '12px',
                              px: 3,
                              py: 1.3,
                              textTransform: 'none',
                              fontWeight: 800,
                              bgcolor: '#15803d',
                              animation: `${pulseGlow} 2.8s infinite`,
                              '&:hover': {
                                bgcolor: '#166534',
                              },
                            }}
                          >
                            Explore spaces
                          </Button>

                          <Button
                            component={Link}
                            href="/suggestions"
                            variant="contained"
                            startIcon={<BoltRoundedIcon />}
                            sx={{
                              borderRadius: '12px',
                              px: 3,
                              py: 1.3,
                              textTransform: 'none',
                              fontWeight: 800,
                              bgcolor: '#ffffff',
                              color: '#0f172a',
                              '&:hover': {
                                bgcolor: '#f8fafc',
                              },
                            }}
                          >
                            See top suggestions
                          </Button>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: 'grid',
                          gap: 1.2,
                          animation: `${fadeUp} 0.9s ease both`,
                          animationDelay: '0.26s',
                        }}
                      >
                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.2,
                            borderRadius: '16px',
                            bgcolor: alpha('#ffffff', 0.94),
                            ml: { md: 'auto' },
                            width: { md: '100%' },
                            maxWidth: 360,
                          }}
                        >
                          <Typography
                            sx={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              letterSpacing: '0.08em',
                              textTransform: 'uppercase',
                              color: '#64748b',
                            }}
                          >
                            Live snapshot
                          </Typography>
                          <Typography
                            sx={{
                              mt: 0.8,
                              fontSize: '1.85rem',
                              lineHeight: 1,
                              fontWeight: 900,
                              color: '#0f172a',
                            }}
                          >
                            {loading ? '—' : `${quietSpacesCount} quiet spaces`}
                          </Typography>
                          <Typography sx={{ mt: 1, color: '#475569' }}>
                            Fast overview of calm, comfortable, and nearby choices.
                          </Typography>
                        </Paper>
                      </Box>
                    </Box>
                  </Box>
                </Box>

                <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: '#f8fafc' }}>
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
              </Paper>

              {/* compare strip */}
              <Paper
                elevation={0}
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: '18px',
                  border: '1px solid #dbe1e8',
                  bgcolor: '#ffffff',
                  boxShadow: '0 12px 30px rgba(15,23,42,0.05)',
                  animation: `${fadeUp} 0.75s ease both`,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    justifyContent: 'space-between',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '0.8rem',
                        fontWeight: 900,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: '#5850ec',
                        mb: 0.6,
                      }}
                    >
                      Compare list
                    </Typography>

                    {compareSpaces.length === 0 ? (
                      <Typography color="text.secondary">
                        Select up to 2 spaces to compare.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {compareSpaces.map((item) => (
                          <Chip
                            key={item.name}
                            label={item.name}
                            onDelete={() => handleRemoveFromCompare(item.name)}
                            sx={{
                              borderRadius: '999px',
                              bgcolor: '#f1efff',
                              color: '#4f46e5',
                              fontWeight: 800,
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
                    {compareSpaces.length > 0 && (
                      <Button
                        onClick={() => {
                          setCompareSpaces([]);
                          localStorage.removeItem('compare-spaces');
                        }}
                        startIcon={<DeleteOutlineRoundedIcon />}
                        variant="outlined"
                        sx={{
                          borderRadius: '999px',
                          px: 2.2,
                          textTransform: 'none',
                          fontWeight: 800,
                        }}
                      >
                        Clear
                      </Button>
                    )}

                    <Button
                      onClick={handleGoToCompare}
                      disabled={compareSpaces.length < 2}
                      startIcon={<CompareArrowsRoundedIcon />}
                      variant="contained"
                      sx={{
                        borderRadius: '999px',
                        px: 2.4,
                        textTransform: 'none',
                        fontWeight: 800,
                        bgcolor: '#5850ec',
                        boxShadow: '0 10px 20px rgba(88,80,236,0.25)',
                        '&:hover': {
                          bgcolor: '#4e46df',
                        },
                        '&.Mui-disabled': {
                          bgcolor: '#c7c4ff',
                          color: '#fff',
                        },
                      }}
                    >
                      Go to compare
                    </Button>
                  </Box>
                </Box>
              </Paper>

              {/* Bottom two panels */}
              <Box
                sx={{
                  mt: 3,
                  display: 'grid',
                  gridTemplateColumns: {
                    xs: '1fr',
                    xl: 'minmax(0, 1.65fr) 360px',
                  },
                  gap: 3,
                  alignItems: 'start',
                }}
              >
                {/* Left panel: Top picks */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: '22px',
                    border: '1px solid #dbe1e8',
                    bgcolor: '#ffffff',
                    boxShadow: '0 18px 50px rgba(15,23,42,0.06)',
                    animation: `${fadeUp} 0.85s ease both`,
                    animationDelay: '0.12s',
                    width: '100%',
                    justifySelf: 'stretch',
                    alignSelf: 'start',
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: '2rem', md: '2.8rem' },
                      fontWeight: 900,
                      mb: 0.8,
                      color: '#0f172a',
                      letterSpacing: '-0.04em',
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
                          sx={{ borderRadius: '20px' }}
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
                            onAddToCompare={handleAddToCompare}
                            isCompared={compareSpaces.some(
                              (item) => item.name === space.name
                            )}
                          />
                        </Box>
                      ))}
                    </Box>
                  )}
                </Paper>

                {/* Right panel: Best match */}
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.5, md: 3 },
                    borderRadius: '22px',
                    border: '1px solid #dbe1e8',
                    bgcolor: '#ffffff',
                    boxShadow: '0 18px 50px rgba(15,23,42,0.06)',
                    animation: `${fadeUp} 0.85s ease both`,
                    animationDelay: '0.18s',
                    width: '100%',
                    maxWidth: 360,
                    justifySelf: { xl: 'end' },
                    alignSelf: 'start',
                    ml: { xl: 'auto' },
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      color: '#15803d',
                      mb: 1.6,
                    }}
                  >
                    Best match right now
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
                            sx={{ borderRadius: '16px' }}
                          />
                        ))}
                      </Box>

                      <Skeleton
                        variant="rounded"
                        height={72}
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
                            fontSize: { xs: '2rem', md: '2.4rem' },
                            lineHeight: 1,
                            fontWeight: 900,
                            letterSpacing: '-0.04em',
                            color: '#0f172a',
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
                          borderRadius: '16px',
                          bgcolor: '#05264d',
                          color: '#fff',
                          overflow: 'hidden',
                          position: 'relative',
                        }}
                      >
                        <Typography
                          sx={{
                            fontSize: '0.8rem',
                            fontWeight: 900,
                            letterSpacing: '0.08em',
                            textTransform: 'uppercase',
                            color: '#fde68a',
                            mb: 0.8,
                          }}
                        >
                          Why this works
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.88)' }}>
                          {bestMatch.reason}
                        </Typography>
                      </Paper>
                    </Box>
                  ) : (
                    <Typography color="text.secondary">No current result.</Typography>
                  )}
                </Paper>
              </Box>
            </Container>
          </Box>
        </>
      )}
    </>
  );
}