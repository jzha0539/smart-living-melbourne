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
import FloatingCompareButton from '../components/FloatingCompareButton';
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

function NoiseDialCard({
  spaces,
  loading,
  threshold,
  onThresholdChange,
  activeSpaceId,
  onSelectSpace,
}: {
  spaces: Space[];
  loading: boolean;
  threshold: number;
  onThresholdChange: (value: number) => void;
  activeSpaceId: number | null;
  onSelectSpace: (spaceId: number) => void;
}) {
  const minDb = 45;
  const maxDb = 80;

  const size = 190;
  const dynamicStroke = 8 + ((threshold - minDb) / (maxDb - minDb)) * 14;
  const stroke = dynamicStroke;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  const matchedCount = spaces.length;
  const progress = (threshold - minDb) / (maxDb - minDb);
  const dashOffset = circumference * (1 - progress);

  function updateFromPointer(clientX: number, clientY: number, element: HTMLDivElement) {
    const rect = element.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = clientX - cx;
    const dy = clientY - cy;

    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;

    const ratio = Math.max(0, Math.min(360, angle)) / 360;
    const value = Math.round(minDb + ratio * (maxDb - minDb));
    onThresholdChange(value);
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    updateFromPointer(e.clientX, e.clientY, el);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (e.buttons !== 1) return;
    updateFromPointer(e.clientX, e.clientY, e.currentTarget);
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: '20px',
        bgcolor: alpha('#ffffff', 0.94),
        ml: { md: 'auto' },
        width: '100%',
        maxWidth: 470,
        minHeight: 255,
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '190px 1fr' },
          gap: 2,
          alignItems: 'center',
        }}
      >
        <Box
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          sx={{
            position: 'relative',
            width: size,
            height: size,
            mx: 'auto',
            cursor: 'pointer',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(148,163,184,0.16)"
              strokeWidth={stroke}
            />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="#5850ec"
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{
                transition: 'stroke-dashoffset 0.18s ease, stroke-width 0.18s ease',
              }}
            />
          </svg>

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              textAlign: 'center',
              px: 2,
            }}
          >
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
                Noise threshold
              </Typography>

              <Typography
                sx={{
                  mt: 0.5,
                  fontSize: '1.9rem',
                  lineHeight: 1,
                  fontWeight: 900,
                  color: '#0f172a',
                }}
              >
                {threshold} dB
              </Typography>

              <Typography
                sx={{
                  mt: 0.7,
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: '#5850ec',
                }}
              >
                {loading ? '—' : `${matchedCount} places`}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ pr: { md: 1 } }}>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 800,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#64748b',
              mb: 1,
            }}
          >
            Matching places
          </Typography>

          {loading ? (
            <Typography sx={{ color: '#64748b' }}>Loading...</Typography>
          ) : spaces.length === 0 ? (
            <Typography sx={{ color: '#64748b' }}>Please turn the ring</Typography>
          ) : (
            <Box sx={{ display: 'grid', gap: 1 }}>
              {spaces.slice(0, 3).map((space) => (
                <Button
                  key={space.id}
                  onClick={() => {
                    onSelectSpace(space.id);
                    document
                      .getElementById('noise-results')
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  variant={activeSpaceId === space.id ? 'contained' : 'outlined'}
                  sx={{
                    justifyContent: 'space-between',
                    borderRadius: '14px',
                    px: 1.6,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    bgcolor: activeSpaceId === space.id ? '#5850ec' : 'transparent',
                    color: activeSpaceId === space.id ? '#fff' : '#334155',
                    borderColor: 'rgba(88,80,236,0.32)',
                    '&:hover': {
                      bgcolor: activeSpaceId === space.id ? '#4e46df' : '#f8f7ff',
                      borderColor: '#5850ec',
                    },
                  }}
                >
                  <Box sx={{ textAlign: 'left', mr: 1, overflow: 'hidden' }}>
                    <Typography
                      sx={{
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {space.name}
                    </Typography>
                  </Box>

                  <Typography
                    sx={{
                      fontSize: '0.9rem',
                      fontWeight: 900,
                      color: activeSpaceId === space.id ? '#fff' : '#5850ec',
                      flexShrink: 0,
                    }}
                  >
                    {space.noiseDb} dB
                  </Typography>
                </Button>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Paper>
  );
}

function HomeNoiseCard({
  space,
  rank,
  highlight,
  onAddToCompare,
  isCompared,
}: {
  space: Space;
  rank: number;
  highlight: boolean;
  onAddToCompare: (space: Space) => void;
  isCompared: boolean;
}) {
  const router = useRouter();

  function getImageSrc(target: Space) {
    const name = target.name.toLowerCase();

    if (name.includes('birrarung')) return '/images/birrarung.jpg';
    if (name.includes('enterprise')) return '/images/enterprize.jpg';
    if (name.includes('skyfarm')) return '/images/skyfarm.jpg';
    if (name.includes('library')) return '/images/library.jpg';
    if (name.includes('rooftop')) return '/images/rooftop.jpg';
    if (name.includes('lounge')) return '/images/lounge.jpg';
    if (name.includes('park')) return '/images/park.jpg';

    const category = (target.category ?? '').toLowerCase();
    if (category.includes('library')) return '/images/library.jpg';
    if (category.includes('rooftop')) return '/images/rooftop.jpg';
    if (category.includes('lounge')) return '/images/lounge.jpg';
    if (category.includes('park')) return '/images/park.jpg';

    return '/images/park.jpg';
  }

  function handleStartRoutine() {
    localStorage.setItem('routine-space', JSON.stringify(space));
    router.push('/routine');
  }

  function MetricBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.2,
        borderRadius: '22px',
        bgcolor: '#f8fafc',
        border: '1px solid #e5e7eb',
        minHeight: 140,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.76rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
          color: '#64748b',
          fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: { xs: '2.2rem', md: '2.9rem' },
          lineHeight: 0.95,
          fontWeight: 950,
          letterSpacing: '-0.06em',
          color: '#0f172a',
          wordBreak: 'break-word',
          fontFamily:
            '"Arial Black", "Inter", "Helvetica Neue", Arial, sans-serif',
          transform: 'skewX(-2deg)',
          textShadow: '0 1px 0 rgba(255,255,255,0.4)',
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.4,
        borderRadius: '28px',
        bgcolor: '#ffffff',
        border: highlight
          ? '2px solid rgba(88,80,236,0.34)'
          : '1px solid #e5e7eb',
        boxShadow: highlight
          ? '0 20px 44px rgba(88,80,236,0.16)'
          : '0 10px 26px rgba(15,23,42,0.05)',
        transition: 'all 0.25s ease',
        height: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 1.5,
          mb: 1.6,
          flexWrap: 'wrap',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={`Top ${rank}`}
            sx={{
              borderRadius: '999px',
              bgcolor: '#5b52f0',
              color: '#fff',
              fontWeight: 800,
            }}
          />

          <Chip
            label={space.category}
            sx={{
              borderRadius: '999px',
              bgcolor: '#ffffff',
              border: '1px solid #cbd5e1',
              color: '#334155',
              fontWeight: 700,
            }}
          />
        </Box>

        <Chip
          label={`${space.distance} km`}
          sx={{
            borderRadius: '999px',
            bgcolor: '#ffffff',
            border: '1px solid #d1d5db',
            color: '#334155',
            fontWeight: 800,
          }}
        />
      </Box>

      {typeof space.serenityScore === 'number' && (
        <Chip
          label={`Serenity ${space.serenityScore}`}
          sx={{
            mb: 1.8,
            borderRadius: '999px',
            bgcolor: '#f0f9ff',
            color: '#1d9bf0',
            border: '1px solid #60a5fa',
            fontWeight: 800,
          }}
        />
      )}

      <Typography
        sx={{
          fontSize: { xs: '2.15rem', md: '2.75rem' },
          lineHeight: 1,
          fontWeight: 900,
          color: '#1e293b',
          letterSpacing: '-0.05em',
        }}
      >
        {space.name}
      </Typography>

      <Typography
        sx={{
          mt: 1,
          color: '#64748b',
          fontSize: '1rem',
          textTransform: 'lowercase',
        }}
      >
        {space.category?.toLowerCase()}
      </Typography>

      <Box
        sx={{
          mt: 2.2,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: '28px',
          height: 240,
          backgroundImage: `url(${getImageSrc(space)})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Chip
          label={space.category}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            borderRadius: '999px',
            bgcolor: 'rgba(255,255,255,0.92)',
            color: '#0f172a',
            fontWeight: 800,
          }}
        />
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 1.5,
        }}
      >
        <MetricBox label="Noise" value={`${space.noiseDb} dB`} />
        <MetricBox label="Comfort" value={`${space.comfort}/100`} />
        <MetricBox label="Best quiet time" value={space.quietTime} />
        <MetricBox label="Distance" value={`${space.distance} km`} />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.1, mt: 2 }}>
        <Chip
          label={`Quiet time: ${space.quietTime}`}
          sx={{ borderRadius: '999px', bgcolor: '#f3f4f6' }}
        />
        <Chip
          label={`Crowd: ${space.crowd}`}
          sx={{ borderRadius: '999px', bgcolor: '#f3f4f6' }}
        />
        <Chip
          label={space.activityFit?.[0] ?? 'study'}
          sx={{
            borderRadius: '999px',
            bgcolor: '#ffffff',
            border: '1px solid #60a5fa',
            color: '#1d9bf0',
          }}
        />
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2, mt: 2.2 }}>
        <Button
          component={Link}
          href={`/discover?spaceId=${space.id}`}
          sx={{
            px: 2.2,
            py: 1.1,
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: '1rem',
            color: '#5850ec',
            bgcolor: '#f1efff',
            '&:hover': {
              bgcolor: '#e9e7ff',
            },
          }}
        >
          View details
        </Button>

        <Button
          onClick={handleStartRoutine}
          variant="contained"
          sx={{
            px: 2.2,
            py: 1.1,
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: '1rem',
            bgcolor: '#081a44',
            '&:hover': {
              bgcolor: '#061536',
            },
          }}
        >
          Start routine
        </Button>

        <Button
          onClick={() => onAddToCompare(space)}
          variant={isCompared ? 'contained' : 'outlined'}
          sx={{
            px: 2.2,
            py: 1.1,
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: '1rem',
            borderColor: '#7c6cff',
            color: isCompared ? '#fff' : '#5b52f0',
            bgcolor: isCompared ? '#5b52f0' : 'transparent',
            '&:hover': {
              borderColor: '#5b52f0',
              bgcolor: isCompared ? '#4f46e5' : '#f8f7ff',
            },
          }}
        >
          {isCompared ? 'Added to compare' : 'Add to compare'}
        </Button>
      </Box>
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

  const [noiseThreshold, setNoiseThreshold] = React.useState(65);
  const [activeNoiseSpaceId, setActiveNoiseSpaceId] = React.useState<number | null>(null);

  const filteredNoiseSpaces = React.useMemo(() => {
    return [...spaces]
      .filter((space) => space.noiseDb <= noiseThreshold)
      .sort((a, b) => a.noiseDb - b.noiseDb);
  }, [spaces, noiseThreshold]);

  React.useEffect(() => {
    if (!filteredNoiseSpaces.length) {
      setActiveNoiseSpaceId(null);
      return;
    }

    const stillExists = filteredNoiseSpaces.some((space) => space.id === activeNoiseSpaceId);

    if (!stillExists) {
      setActiveNoiseSpaceId(filteredNoiseSpaces[0].id);
    }
  }, [filteredNoiseSpaces, activeNoiseSpaceId]);

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

  const quietSpacesCount = spaces.filter((space) => space.noiseDb <= 65).length;
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
              transform: introLeaving ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.9s ease',
              filter: 'grayscale(4%) contrast(1.02) brightness(0.98)',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `
                radial-gradient(circle at 18% 22%, rgba(99,102,241,0.12), transparent 20%),
                radial-gradient(circle at 82% 76%, rgba(139,92,246,0.14), transparent 22%),
                linear-gradient(
                  180deg,
                  rgba(248,250,252,0.40) 0%,
                  rgba(248,250,252,0.56) 36%,
                  rgba(248,250,252,0.78) 100%
                )
              `,
              backdropFilter: 'blur(2px)',
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
                maxWidth: 1280,
                transform: introLeaving ? 'scale(0.16)' : 'scale(1)',
                opacity: introLeaving ? 0 : 1,
                transition:
                  'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease',
                willChange: 'transform, opacity',
              }}
            >
              <Chip
                label="Smart Living Melbourne"
                sx={{
                  mb: 2.5,
                  height: 38,
                  px: 1.2,
                  borderRadius: '999px',
                  bgcolor: 'rgba(255,255,255,0.72)',
                  color: '#4f46e5',
                  border: '1px solid rgba(79,70,229,0.12)',
                  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
                  backdropFilter: 'blur(10px)',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  letterSpacing: '0.02em',
                }}
              />

              <Typography
                sx={{
                  fontSize: { xs: '2.9rem', sm: '4.4rem', md: '6.4rem' },
                  lineHeight: 0.94,
                  fontWeight: 950,
                  letterSpacing: '-0.07em',
                  color: '#0f172a',
                  textAlign: 'center',
                  animation: introLeaving ? 'none' : `${introTextFloat} 5.4s ease-in-out infinite`,
                  textShadow: '0 8px 28px rgba(255,255,255,0.42)',
                  fontFamily: '"Arial Black", Inter, "Helvetica Neue", Arial, sans-serif',
                  '& .outlined': {
                    color: 'transparent',
                    WebkitTextStroke: '1.8px rgba(15,23,42,0.92)',
                    textShadow: '0 8px 22px rgba(255,255,255,0.22)',
                  },
                }}
              >
                <Box component="span" sx={{ display: 'block' }}>
                  START YOUR
                </Box>
                <Box
                  component="span"
                  className="outlined"
                  sx={{
                    display: 'block',
                    mt: { xs: 0.45, md: 0.2 },
                  }}
                >
                  IDEAL LIFE
                </Box>
              </Typography>

              <Box
                sx={{
                  mt: 3.2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2.6,
                  py: 1.15,
                  borderRadius: '999px',
                  bgcolor: 'rgba(255,255,255,0.74)',
                  border: '1px solid rgba(15,23,42,0.08)',
                  boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
                  backdropFilter: 'blur(10px)',
                  animation: introLeaving ? 'none' : `${introHintFade} 2.2s ease-in-out infinite`,
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '0.95rem', md: '1rem' },
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: '#334155',
                  }}
                >
                  Tap anywhere to enter
                </Typography>
              </Box>
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
                        <NoiseDialCard
                          spaces={filteredNoiseSpaces}
                          loading={loading}
                          threshold={noiseThreshold}
                          onThresholdChange={setNoiseThreshold}
                          activeSpaceId={activeNoiseSpaceId}
                          onSelectSpace={setActiveNoiseSpaceId}
                        />
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
                      label="Quiet spaces under 65 dB"
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

              <Box
                sx={{
                  mt: 3,
                  display: 'grid',
                  gridTemplateColumns: '1fr',
                  gap: 3,
                  alignItems: 'start',
                }}
              >
                <Paper
                  id="noise-results"
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
                    Noise-matched places
                  </Typography>

                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Top 3 places below {noiseThreshold} dB.
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
                  ) : filteredNoiseSpaces.length === 0 ? (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '20px',
                        border: '1px solid #e5e7eb',
                        bgcolor: '#ffffff',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.35rem',
                          fontWeight: 900,
                          color: '#0f172a',
                        }}
                      >
                        No places match the current noise threshold
                      </Typography>

                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Increase the dial to show more places.
                      </Typography>
                    </Paper>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: 'repeat(3, 1fr)' },
                        gap: 3,
                      }}
                    >
                      {filteredNoiseSpaces.slice(0, 3).map((space, index) => (
                        <Box
  key={`${space.name}-${index}`}
  sx={{
    animation: `${fadeUp} 0.75s ease both`,
    animationDelay: `${0.12 * index}s`,
    transition: 'all 0.28s ease',
    transform:
      activeNoiseSpaceId === space.id
        ? 'translateY(-6px)'
        : 'translateY(0)',
    borderRadius: '28px',
    '&:hover': {
      transform: 'translateY(-6px)',
    },
  }}
>
                          <HomeNoiseCard
                            space={space}
                            rank={index + 1}
                            highlight={activeNoiseSpaceId === space.id}
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
              </Box>
            </Container>
          </Box>
          <FloatingCompareButton count={compareSpaces.length} />
        </>
      )}
    </>
  );
}