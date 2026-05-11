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
  Slider,
  Typography,
} from '@mui/material';
import { keyframes } from '@mui/material/styles';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';
import VolumeOffRoundedIcon from '@mui/icons-material/VolumeOffRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
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

type RankingWeights = {
  quietness: number;
  popularity: number;
  weather: number;
  rating: number;
  availability: number;
};

type PresetKey = 'focus' | 'popular' | 'weather' | 'balanced' | 'custom';

type RankedSpace = Space & {
  rankingScore: number;
  quietScore: number;
  popularityScore: number;
  weatherScore: number;
  ratingScore: number;
  availabilityScore: number;
  environmentFit: number;
  estimatedCrowd: 'Low' | 'Moderate' | 'Busy';
};

function getNumber(space: Space, keys: string[], fallback = 0): number {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return fallback;
}

function getString(space: Space, keys: string[], fallback = ''): string {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function getBoolean(space: Space, keys: string[]): boolean {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value === 1;
    }

    if (typeof value === 'string') {
      const lower = value.trim().toLowerCase();

      if (['true', 'yes', '1'].includes(lower)) return true;
      if (['false', 'no', '0'].includes(lower)) return false;
    }
  }

  return false;
}

function calculateEnvironmentFit(space: Space): number {
  const noiseDb = getNumber(space, ['noiseDb', 'noise_db'], 65);
  const windSpeed = getNumber(space, ['windSpeed', 'avg_wind_speed'], 10);
  const temperature = getNumber(space, ['temperature', 'air_temperature'], 22);
  const humidity = getNumber(space, ['humidity', 'relative_humidity'], 50);

  const score =
    100 -
    Math.max(0, noiseDb - 35) * 0.55 -
    Math.max(0, windSpeed - 12) * 1.2 -
    Math.abs(temperature - 22) * 1.8 -
    Math.abs(humidity - 50) * 0.25;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function calculateWeatherScore(space: Space): number {
  const windSpeed = getNumber(space, ['windSpeed', 'avg_wind_speed'], 10);
  const temperature = getNumber(space, ['temperature', 'air_temperature'], 22);
  const humidity = getNumber(space, ['humidity', 'relative_humidity'], 50);

  const windScore = Math.max(0, Math.min(100, 100 - Math.max(0, windSpeed - 8) * 3));
  const temperatureScore = Math.max(0, Math.min(100, 100 - Math.abs(temperature - 22) * 5));
  const humidityScore = Math.max(0, Math.min(100, 100 - Math.abs(humidity - 50) * 1.1));

  return Math.round(windScore * 0.3 + temperatureScore * 0.45 + humidityScore * 0.25);
}

function calculateRatingScore(space: Space): number {
  const rating = getNumber(space, ['rating'], 0);

  if (rating <= 0) return 55;

  return Math.max(0, Math.min(100, Math.round((rating / 5) * 100)));
}

function calculatePopularityScore(space: Space): {
  popularityScore: number;
  estimatedCrowd: 'Low' | 'Moderate' | 'Busy';
} {
  const ratingCount = getNumber(space, ['ratingCount', 'rating_count'], 0);

  let popularityScore = 45;
  let estimatedCrowd: 'Low' | 'Moderate' | 'Busy' = 'Low';

  if (ratingCount === 0) {
    popularityScore = 45;
    estimatedCrowd = 'Low';
  } else if (ratingCount < 50) {
    popularityScore = 60;
    estimatedCrowd = 'Low';
  } else if (ratingCount < 200) {
    popularityScore = 85;
    estimatedCrowd = 'Moderate';
  } else if (ratingCount < 800) {
    popularityScore = 75;
    estimatedCrowd = 'Moderate';
  } else {
    popularityScore = 62;
    estimatedCrowd = 'Busy';
  }

  return { popularityScore, estimatedCrowd };
}

function calculateAvailabilityScore(space: Space): number {
  const is24_7 = getBoolean(space, ['is24_7', 'is_24_7']);
  const openingHours = getString(space, ['openingHours', 'opening_hours'], '');

  if (is24_7) return 100;
  if (openingHours) return 78;

  return 45;
}

function enrichSpaces(spaces: Space[]): Space[] {
  return spaces.map((space) => ({
    ...space,
    serenityScore:
      typeof (space as Space & { serenityScore?: number }).serenityScore === 'number'
        ? (space as Space & { serenityScore?: number }).serenityScore
        : calculateEnvironmentFit(space),
  }));
}

async function fetchSpaces(): Promise<Space[]> {
  const res = await fetch('/api/spaces', { cache: 'no-store' });

  if (!res.ok) {
    throw new Error('Failed to fetch spaces');
  }

  const json = await res.json();
  return (json.data ?? []) as Space[];
}

function formatCategory(category: string | undefined) {
  if (!category) return 'Place';
  return category.charAt(0).toUpperCase() + category.slice(1);
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
        p: 1.8,
        borderRadius: '16px',
        border: '1px solid #E4D9C8',
        bgcolor: '#FFFDF8',
        minHeight: 88,
        transition: 'transform 0.24s ease, box-shadow 0.24s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 24px rgba(36,60,53,0.08)',
        },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.1 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#F1EBDD',
            color: '#243C35',
            flexShrink: 0,
            '& .MuiSvgIcon-root': {
              fontSize: 20,
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
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#6E7771',
              lineHeight: 1.2,
              mb: 0.3,
            }}
          >
            {label}
          </Typography>

          <Typography
            sx={{
              fontSize: '1.05rem',
              fontWeight: 900,
              color: '#243C35',
              lineHeight: 1,
            }}
          >
            {value}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}

function getSpaceId(space: Space): string {
  const record = space as unknown as Record<string, unknown>;

  return String(
    record.poiId ??
      record.poi_id ??
      record.googlePlaceId ??
      record.google_place_id ??
      space.id ??
      `${space.name}-${space.latitude}-${space.longitude}`
  );
}

function HomeRecommendationCard({
  space,
  rank,
  highlight,
  onAddToCompare,
  isCompared,
}: {
  space: RankedSpace;
  rank: number;
  highlight: boolean;
  onAddToCompare: (space: Space) => void;
  isCompared: boolean;
}) {
  const router = useRouter();

  const noiseDb = getNumber(space, ['noiseDb', 'noise_db'], 65);
  const windSpeed = getNumber(space, ['windSpeed', 'avg_wind_speed'], 10);
  const temperature = getNumber(space, ['temperature', 'air_temperature'], 22);
  const humidity = getNumber(space, ['humidity', 'relative_humidity'], 50);
  const rating = getNumber(space, ['rating'], 0);
  const ratingCount = getNumber(space, ['ratingCount', 'rating_count'], 0);
  const suburb = getString(space, ['suburb'], 'Melbourne');
  const address = getString(space, ['address'], '');
  const openingHours = getString(space, ['openingHours', 'opening_hours'], '');
  const phone = getString(space, ['phone'], '');
  const category = String(space.category || 'place');

  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'][rank - 1] ?? String(rank);

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
          p: { xs: 1.6, md: 2 },
          borderRadius: '14px',
          bgcolor: '#EFE8DA',
          border: '1px solid #D8CBB8',
          minHeight: 86,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        <Typography
          sx={{
            fontSize: '0.72rem',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            color: '#8A9690',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            mt: 1.2,
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: { xs: '1.25rem', md: '1.48rem' },
            lineHeight: 1,
            fontWeight: 700,
            color: '#243C35',
            wordBreak: 'break-word',
          }}
        >
          {value}
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper
      id={`recommendation-card-${space.id}`}
      elevation={0}
      sx={{
        p: { xs: 2.2, md: 2.6 },
        borderRadius: '24px',
        bgcolor: '#FFFDF8',
        border: highlight ? '2px solid #4F6B57' : '1px solid #D8CBB8',
        boxShadow: highlight
          ? '0 20px 44px rgba(36,60,53,0.16)'
          : '0 10px 26px rgba(36,60,53,0.06)',
        transition: 'all 0.25s ease',
        height: '100%',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, mb: 1.4 }}>
        <Box>
          <Typography
            sx={{
              fontSize: '0.72rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.24em',
              color: '#8A9690',
              mb: 0.8,
            }}
          >
            Recommended from ranking
          </Typography>

          <Typography
            sx={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: { xs: '1.75rem', md: '2rem' },
              lineHeight: 1.05,
              fontWeight: 700,
              color: '#243C35',
              letterSpacing: '-0.035em',
            }}
          >
            {space.name}
          </Typography>

          <Typography sx={{ mt: 0.8, color: '#6E7771', fontSize: '0.95rem' }}>
            {formatCategory(category)} · {suburb}
          </Typography>

          {address && (
            <Typography sx={{ mt: 0.4, color: '#8A9690', fontSize: '0.84rem' }}>
              {address}
            </Typography>
          )}
        </Box>

        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography
            sx={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.6rem',
              color: '#D8845F',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {roman}
          </Typography>

          <Typography
            sx={{
              mt: 0.8,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '1rem',
              color: '#4F6B57',
              fontWeight: 900,
            }}
          >
            {space.rankingScore}
            <Box component="span" sx={{ color: '#8A9690', fontSize: '0.68rem' }}>
              /100
            </Box>
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' },
          gap: 1,
        }}
      >
        <MetricBox label="Noise" value={`${Math.round(noiseDb)} dB`} />
        <MetricBox label="Weather fit" value={`${space.weatherScore}/100`} />
        <MetricBox label="Popularity" value={`${space.popularityScore}/100`} />
        <MetricBox label="Rating" value={rating > 0 ? `${rating.toFixed(1)}★` : 'No rating'} />
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1,
        }}
      >
        <MetricBox label="Wind" value={`${windSpeed.toFixed(1)} km/h`} />
        <MetricBox label="Air" value={`${temperature.toFixed(1)}°C · ${Math.round(humidity)}%`} />
      </Box>

      <Box
        sx={{
          mt: 2.2,
          pl: 1.6,
          borderLeft: '3px solid #4F6B57',
          color: '#6E7771',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1.05rem',
          lineHeight: 1.5,
        }}
      >
        Ranked highly because it balances quietness, popularity, weather comfort,
        public rating, and availability using the new POI dataset.
      </Box>

      <Box sx={{ mt: 2.2, display: 'grid', gap: 1 }}>
        {[
          ['Quietness', space.quietScore],
          ['Weather', space.weatherScore],
          ['Popularity', space.popularityScore],
          ['Availability', space.availabilityScore],
        ].map(([label, value]) => (
          <Box
            key={String(label)}
            sx={{
              display: 'grid',
              gridTemplateColumns: '98px 1fr 42px',
              gap: 1.2,
              alignItems: 'center',
            }}
          >
            <Typography sx={{ color: '#6E7771', fontSize: '0.92rem' }}>
              {label}
            </Typography>

            <Box sx={{ height: 7, borderRadius: 999, bgcolor: '#D8CBB8', overflow: 'hidden' }}>
              <Box
                sx={{
                  width: `${Math.round(Number(value))}%`,
                  height: '100%',
                  bgcolor: '#4F6B57',
                }}
              />
            </Box>

            <Typography
              sx={{
                textAlign: 'right',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: '#243C35',
                fontWeight: 800,
                fontSize: '0.82rem',
              }}
            >
              {Math.round(Number(value))}%
            </Typography>
          </Box>
        ))}
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 0.8,
        }}
      >
        <Chip
          label={`Crowd estimate: ${space.estimatedCrowd}`}
          sx={{
            bgcolor: '#F5F1E8',
            color: '#243C35',
            border: '1px solid #D8CBB8',
            fontWeight: 700,
          }}
        />

        <Chip
          label={`${Math.round(ratingCount)} reviews`}
          sx={{
            bgcolor: '#F5F1E8',
            color: '#243C35',
            border: '1px solid #D8CBB8',
            fontWeight: 700,
          }}
        />

        {openingHours && (
          <Chip
            label={openingHours}
            sx={{
              bgcolor: '#F5F1E8',
              color: '#243C35',
              border: '1px solid #D8CBB8',
              fontWeight: 700,
              maxWidth: '100%',
            }}
          />
        )}

        {phone && (
          <Chip
            label={phone}
            sx={{
              bgcolor: '#F5F1E8',
              color: '#243C35',
              border: '1px solid #D8CBB8',
              fontWeight: 700,
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          mt: 2.4,
          pt: 2,
          borderTop: '1px dashed #D8CBB8',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
          gap: 1,
        }}
      >
        <Button
          onClick={handleStartRoutine}
          sx={{
            px: 2,
            py: 1.2,
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 900,
            bgcolor: '#243C35',
            color: '#FFFDF8',
            '&:hover': { bgcolor: '#182B25' },
          }}
        >
          I'm going here
        </Button>

        <Button
          onClick={() => onAddToCompare(space)}
          sx={{
            px: 2,
            py: 1.2,
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 900,
            bgcolor: isCompared ? '#243C35' : '#EFE8DA',
            color: isCompared ? '#FFFDF8' : '#243C35',
            border: '1px solid #D8CBB8',
            '&:hover': { bgcolor: isCompared ? '#243C35' : '#E4D9C8' },
          }}
        >
          {isCompared ? 'Added to compare' : 'Compare with others'}
        </Button>
      </Box>

      <Button
        component={Link}
        href={`/discover?spaceId=${getSpaceId(space)}`}
        sx={{
          mt: 1,
          width: '100%',
          px: 2,
          py: 1,
          borderRadius: '14px',
          textTransform: 'none',
          fontWeight: 800,
          color: '#4F6B57',
          border: '1px solid #D8CBB8',
          '&:hover': { bgcolor: '#F5F1E8' },
        }}
      >
        View details
      </Button>
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
  const [activeNoiseSpaceId, setActiveNoiseSpaceId] = React.useState<string | number | null>(null);
  const [activeTopPickId, setActiveTopPickId] = React.useState<string | number | null>(null);

  const [rankingWeights, setRankingWeights] = React.useState<RankingWeights>({
    quietness: 85,
    popularity: 65,
    weather: 75,
    rating: 70,
    availability: 55,
  });

  const [selectedPreset, setSelectedPreset] = React.useState<PresetKey>('focus');

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

  const quietSpacesCount = spaces.filter((space) => getNumber(space, ['noiseDb', 'noise_db'], 65) <= 65).length;

  const averageEnvironmentFit =
    spaces.length > 0
      ? Math.round(spaces.reduce((sum, item) => sum + calculateEnvironmentFit(item), 0) / spaces.length)
      : 0;

  const averageRating =
    spaces.length > 0
      ? spaces.reduce((sum, item) => sum + getNumber(item, ['rating'], 0), 0) / spaces.length
      : 0;

  const totalReviews = spaces.reduce((sum, item) => sum + getNumber(item, ['ratingCount', 'rating_count'], 0), 0);

  const applyPreset = (preset: Exclude<PresetKey, 'custom'>) => {
    setSelectedPreset(preset);

    if (preset === 'focus') {
      setRankingWeights({
        quietness: 95,
        popularity: 45,
        weather: 75,
        rating: 70,
        availability: 60,
      });
    }

    if (preset === 'popular') {
      setRankingWeights({
        quietness: 60,
        popularity: 90,
        weather: 60,
        rating: 85,
        availability: 60,
      });
    }

    if (preset === 'weather') {
      setRankingWeights({
        quietness: 60,
        popularity: 50,
        weather: 95,
        rating: 65,
        availability: 65,
      });
    }

    if (preset === 'balanced') {
      setRankingWeights({
        quietness: 70,
        popularity: 70,
        weather: 70,
        rating: 70,
        availability: 70,
      });
    }
  };

  const updateWeight = (key: keyof RankingWeights, value: number) => {
    setSelectedPreset('custom');
    setRankingWeights((previous) => ({ ...previous, [key]: value }));
  };

  const rankedSpaces = React.useMemo<RankedSpace[]>(() => {
    if (!spaces.length) return [];

    return [...spaces]
      .map((space) => {
        const noiseDb = getNumber(space, ['noiseDb', 'noise_db'], 65);

        const quietScore = Math.max(0, Math.min(100, 100 - noiseDb));
        const weatherScore = calculateWeatherScore(space);
        const ratingScore = calculateRatingScore(space);
        const availabilityScore = calculateAvailabilityScore(space);
        const environmentFit = calculateEnvironmentFit(space);
        const { popularityScore, estimatedCrowd } = calculatePopularityScore(space);

        const weightedScore =
          quietScore * rankingWeights.quietness +
          popularityScore * rankingWeights.popularity +
          weatherScore * rankingWeights.weather +
          ratingScore * rankingWeights.rating +
          availabilityScore * rankingWeights.availability;

        const normaliser =
          rankingWeights.quietness +
          rankingWeights.popularity +
          rankingWeights.weather +
          rankingWeights.rating +
          rankingWeights.availability;

        const rankingScore = Math.max(0, Math.min(100, Math.round(weightedScore / normaliser)));

        return {
          ...space,
          rankingScore,
          quietScore,
          popularityScore,
          weatherScore,
          ratingScore,
          availabilityScore,
          environmentFit,
          estimatedCrowd,
        };
      })
      .sort((a, b) => b.rankingScore - a.rankingScore)
      .slice(0, 6);
  }, [spaces, rankingWeights]);

  const recommendedSpaces = rankedSpaces;

  React.useEffect(() => {
    if (!recommendedSpaces.length) {
      setActiveNoiseSpaceId(null);
      return;
    }

    const stillExists = recommendedSpaces.some((space) => space.id === activeNoiseSpaceId);

    if (!stillExists) {
      setActiveNoiseSpaceId(recommendedSpaces[0].id);
    }
  }, [recommendedSpaces, activeNoiseSpaceId]);

  const noiseThreshold = React.useMemo(() => {
    return Math.max(30, Math.min(80, Math.round(85 - rankingWeights.quietness * 0.55)));
  }, [rankingWeights.quietness]);

  const noiseRingDegrees = React.useMemo(() => {
    const min = 30;
    const max = 80;
    const value = Math.max(min, Math.min(max, noiseThreshold));

    return Math.round(((value - min) / (max - min)) * 360);
  }, [noiseThreshold]);

  const noiseDescription = React.useMemo(() => {
    if (noiseThreshold <= 40) {
      return 'Quietness is set very high — recommendations prioritise library-like calm.';
    }

    if (noiseThreshold <= 50) {
      return 'Quietness is important — suitable for focused work and low-noise visits.';
    }

    if (noiseThreshold <= 60) {
      return 'Balanced quietness — good for study, casual work, and short breaks.';
    }

    if (noiseThreshold <= 70) {
      return 'More flexible quietness — allows lively cafés and active public spaces.';
    }

    return 'Quietness is relaxed — recommendations can include busier lifestyle locations.';
  }, [noiseThreshold]);

  function getNoiseRingColor(noise: number) {
  if (noise < 50) return '#2DBE63';
  if (noise < 65) return '#E8B100';
  return '#E06D3A';
}

const noiseRingColor = getNoiseRingColor(noiseThreshold);
const visibleNoiseRingDegrees =
  noiseRingDegrees <= 0 ? 0 : Math.min(360, noiseRingDegrees + 0.8);

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
            bgcolor: '#F5F1E8',
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
              transform: introLeaving ? 'scale(1.035)' : 'scale(1)',
              transition: 'transform 0.9s ease',
              filter: 'grayscale(8%) contrast(0.95) brightness(1.04)',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: `
                linear-gradient(
                  180deg,
                  rgba(245,241,232,0.82) 0%,
                  rgba(245,241,232,0.74) 38%,
                  rgba(245,241,232,0.88) 100%
                )
              `,
              backdropFilter: 'blur(1px)',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              width: { xs: 320, md: 540 },
              height: { xs: 320, md: 540 },
              borderRadius: '50%',
              border: '1px solid rgba(36,60,53,0.08)',
              left: { xs: -130, md: 90 },
              top: { xs: 95, md: 150 },
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              position: 'absolute',
              width: { xs: 280, md: 440 },
              height: { xs: 280, md: 440 },
              borderRadius: '50%',
              border: '1px solid rgba(36,60,53,0.08)',
              right: { xs: -120, md: 210 },
              bottom: { xs: 80, md: 110 },
              pointerEvents: 'none',
            }}
          />

          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              px: { xs: 2.5, md: 5 },
              py: { xs: 2.5, md: 4 },
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  bgcolor: '#4F6B57',
                  color: '#FFFDF8',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  boxShadow: '0 10px 28px rgba(36,60,53,0.12)',
                }}
              >
                ◌
              </Box>

              <Box>
                <Typography
                  sx={{
                    fontSize: '1rem',
                    fontWeight: 800,
                    color: '#243C35',
                    lineHeight: 1,
                  }}
                >
                  Smart Living
                </Typography>

                <Typography
                  sx={{
                    mt: 0.35,
                    fontSize: '0.58rem',
                    fontWeight: 800,
                    color: '#8A9690',
                    letterSpacing: '0.28em',
                  }}
                >
                  MELBOURNE
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              minHeight: 'calc(100vh - 120px)',
              display: 'grid',
              placeItems: 'center',
              px: { xs: 2.5, md: 4 },
              textAlign: 'center',
              transform: { xs: 'translateY(-24px)', md: 'translateY(-46px)' },
            }}
          >
            <Box
              sx={{
                maxWidth: 960,
                transform: introLeaving ? 'scale(0.16)' : 'scale(1)',
                opacity: introLeaving ? 0 : 1,
                transition:
                  'transform 0.85s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.65s ease',
                willChange: 'transform, opacity',
              }}
            >
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                  py: 0.72,
                  mb: 3,
                  borderRadius: 999,
                  bgcolor: 'rgba(228,236,216,0.86)',
                  color: '#4F6B57',
                  fontSize: { xs: '0.66rem', md: '0.72rem' },
                  fontWeight: 800,
                  letterSpacing: '0.32em',
                  textTransform: 'uppercase',
                  border: '1px solid rgba(79,107,87,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                Smart Living Melbourne
              </Box>

              <Typography
                sx={{
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontSize: {
                    xs: '3.4rem',
                    sm: '4.8rem',
                    md: '6.8rem',
                    lg: '7.4rem',
                  },
                  lineHeight: 0.92,
                  fontWeight: 500,
                  color: '#243C35',
                  letterSpacing: '-0.075em',
                  textShadow: '0 10px 30px rgba(255,253,248,0.35)',
                  animation: introLeaving ? 'none' : `${introTextFloat} 5.4s ease-in-out infinite`,
                }}
              >
                Start your{' '}
                <Box
                  component="em"
                  sx={{
                    fontStyle: 'italic',
                    color: '#4F6B57',
                  }}
                >
                  ideal
                </Box>{' '}
                life.
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  mx: 'auto',
                  maxWidth: 560,
                  fontFamily: 'Georgia, "Times New Roman", serif',
                  fontStyle: 'italic',
                  fontSize: { xs: '1.05rem', md: '1.22rem' },
                  lineHeight: 1.55,
                  color: '#6E7771',
                }}
              >
                Find study-friendly, work-friendly, and short-break spaces using comfort,
                noise, opening hours, and location signals.
              </Typography>

              <Box
                sx={{
                  mt: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 3.1,
                  py: 1.25,
                  borderRadius: '999px',
                  bgcolor: '#243C35',
                  color: '#FFFDF8',
                  boxShadow: '0 18px 38px rgba(36,60,53,0.14)',
                  transition: 'transform 0.25s ease, background-color 0.25s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    bgcolor: '#4F6B57',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '0.95rem', md: '1rem' },
                    fontWeight: 800,
                    color: '#FFFDF8',
                    textTransform: 'none',
                  }}
                >
                  Start exploring
                </Typography>

                <Typography
                  sx={{
                    ml: 1.4,
                    fontSize: '1.25rem',
                    lineHeight: 1,
                    color: '#FFFDF8',
                  }}
                >
                  →
                </Typography>
              </Box>

              <Typography
                sx={{
                  mt: 3.3,
                  color: '#8A9690',
                  fontSize: { xs: '0.68rem', md: '0.72rem' },
                  fontWeight: 800,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                  animation: introLeaving ? 'none' : `${introHintFade} 2.2s ease-in-out infinite`,
                }}
              >
                Tap anywhere to enter
              </Typography>
            </Box>
          </Box>

          <Box
            sx={{
              position: 'absolute',
              zIndex: 1,
              left: 0,
              right: 0,
              bottom: 0,
              height: { xs: 92, md: 128 },
              opacity: 0.45,
              pointerEvents: 'none',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: '100%',
                bgcolor: 'rgba(36,60,53,0.14)',
                clipPath:
                  'polygon(0 65%, 5% 65%, 5% 42%, 9% 42%, 9% 65%, 13% 65%, 13% 35%, 18% 35%, 18% 65%, 23% 65%, 23% 52%, 28% 52%, 28% 40%, 33% 40%, 33% 65%, 39% 65%, 39% 48%, 44% 48%, 44% 65%, 49% 65%, 49% 32%, 54% 32%, 54% 65%, 60% 65%, 60% 50%, 65% 50%, 65% 65%, 71% 65%, 71% 38%, 76% 38%, 76% 65%, 81% 65%, 81% 46%, 86% 46%, 86% 65%, 92% 65%, 92% 55%, 96% 55%, 96% 65%, 100% 65%, 100% 100%, 0 100%)',
              }}
            />
          </Box>
        </Box>
      )}

      {shouldRenderHome && (
        <>
          <AppNavbar />

          <Box sx={{ minHeight: '100vh', bgcolor: '#F5F1E8', pb: 6 }}>
            <Container maxWidth="xl" sx={{ pt: 2 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '1.45fr 0.75fr' },
                  gap: 3,
                  alignItems: 'stretch',
                  animation: `${fadeUp} 0.7s ease both`,
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.4, md: 3.4 },
                    borderRadius: '24px',
                    bgcolor: '#FFFDF8',
                    border: '2px solid #4F6B57',
                    boxShadow: '0 18px 42px rgba(36,60,53,0.08)',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 2,
                      alignItems: 'flex-start',
                      mb: 2.6,
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                          color: '#D8845F',
                          mb: 1,
                        }}
                      >
                        Widget 1 · Main feature
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontSize: { xs: '2rem', md: '2.8rem' },
                          lineHeight: 1,
                          fontWeight: 600,
                          color: '#243C35',
                          letterSpacing: '-0.045em',
                        }}
                      >
                        Personalised ranking — your top picks
                      </Typography>

                      <Typography
                        sx={{
                          mt: 1,
                          maxWidth: 680,
                          color: '#6E7771',
                          fontSize: '1rem',
                          lineHeight: 1.5,
                        }}
                      >
                        Different users define comfort differently. Choose a preset or adjust the
                        sliders; the top 6 places will reorder live using your POI data.
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: { xs: 'none', md: 'flex' },
                        gap: 1,
                        flexWrap: 'wrap',
                        justifyContent: 'flex-end',
                      }}
                    >
                      {['Live ranking', 'Uses real POI data', 'Drives top picks'].map((tag, index) => (
                        <Box
                          key={tag}
                          sx={{
                            px: 1.5,
                            py: 0.75,
                            borderRadius: 999,
                            bgcolor: index === 0 ? '#D8845F' : '#F5F1E8',
                            color: index === 0 ? '#FFFDF8' : '#6E7771',
                            border: index === 0 ? 'none' : '1px solid #D8CBB8',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            letterSpacing: '0.08em',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {tag}
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2.8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.6 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: '#4F6B57',
                          color: '#FFFDF8',
                          display: 'grid',
                          placeItems: 'center',
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontStyle: 'italic',
                          fontWeight: 700,
                        }}
                      >
                        1
                      </Box>

                      <Typography
                        sx={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: '#243C35',
                        }}
                      >
                        Quick preset
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(4, 1fr)',
                        },
                        gap: 1.4,
                      }}
                    >
                      {[
                        ['focus', 'Focus mode', 'Quietness ↑ · Crowd ↓'],
                        ['popular', 'Popular choice', 'Rating ↑ · Reviews ↑'],
                        ['weather', 'Weather comfort', 'Temp · Wind · Humidity'],
                        ['balanced', 'Balanced', 'All factors even'],
                      ].map(([key, title, subtitle]) => {
                        const active = selectedPreset === key;

                        return (
                          <Box
                            key={key}
                            onClick={() => applyPreset(key as Exclude<PresetKey, 'custom'>)}
                            sx={{
                              minHeight: 104,
                              p: 1.8,
                              borderRadius: '16px',
                              bgcolor: active ? '#E4ECD8' : '#FFFDF8',
                              border: active ? '2px solid #4F6B57' : '1px solid #E4D9C8',
                              boxShadow: active ? '0 0 0 4px rgba(79,107,87,0.08)' : 'none',
                              display: 'grid',
                              placeItems: 'center',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.22s ease',
                              '&:hover': {
                                transform: 'translateY(-2px)',
                                borderColor: '#4F6B57',
                              },
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: 'Georgia, "Times New Roman", serif',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                color: '#243C35',
                                mb: 0.8,
                              }}
                            >
                              {title}
                            </Typography>

                            <Typography
                              sx={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                letterSpacing: '0.18em',
                                color: '#8A9690',
                                textTransform: 'uppercase',
                              }}
                            >
                              {subtitle}
                            </Typography>
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>

                  <Box sx={{ mb: 2.8 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.6 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: '#4F6B57',
                          color: '#FFFDF8',
                          display: 'grid',
                          placeItems: 'center',
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontStyle: 'italic',
                          fontWeight: 700,
                        }}
                      >
                        2
                      </Box>

                      <Typography
                        sx={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: '#243C35',
                        }}
                      >
                        Fine-tune your priorities
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        p: { xs: 1.6, md: 2 },
                        borderRadius: '16px',
                        bgcolor: '#EFE8DA',
                        border: '1px solid #D8CBB8',
                        display: 'grid',
                        gap: 0.7,
                      }}
                    >
                      {[
                        ['quietness', 'Quietness'],
                        ['popularity', 'Popularity / crowd'],
                        ['weather', 'Weather comfort'],
                        ['rating', 'Public rating'],
                        ['availability', 'Availability'],
                      ].map(([key, label]) => (
                        <Box
                          key={key}
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '136px 1fr 42px', md: '190px 1fr 44px' },
                            gap: 1.5,
                            alignItems: 'center',
                            borderBottom:
                              key === 'availability'
                                ? 'none'
                                : '1px solid rgba(216,203,184,0.9)',
                            py: 0.2,
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: 'Georgia, "Times New Roman", serif',
                              fontSize: '1rem',
                              fontWeight: 700,
                              color: '#243C35',
                            }}
                          >
                            {label}
                          </Typography>

                          <Slider
                            value={rankingWeights[key as keyof RankingWeights]}
                            min={0}
                            max={100}
                            step={5}
                            onChange={(_, value) => updateWeight(key as keyof RankingWeights, value as number)}
                            sx={{
                              color: '#4F6B57',
                              '& .MuiSlider-track': {
                                border: 'none',
                                bgcolor: '#4F6B57',
                              },
                              '& .MuiSlider-rail': {
                                bgcolor: '#D8CBB8',
                                opacity: 1,
                              },
                              '& .MuiSlider-thumb': {
                                width: 20,
                                height: 20,
                                bgcolor: '#4F6B57',
                                border: '2px solid #FFFDF8',
                                boxShadow: '0 2px 7px rgba(36,60,53,0.24)',
                                '&:hover': {
                                  boxShadow: '0 0 0 8px rgba(79,107,87,0.12)',
                                },
                              },
                            }}
                          />

                          <Typography
                            sx={{
                              textAlign: 'right',
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                              color: '#243C35',
                              fontWeight: 800,
                            }}
                          >
                            {rankingWeights[key as keyof RankingWeights]}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2, mb: 1.6 }}>
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          bgcolor: '#4F6B57',
                          color: '#FFFDF8',
                          display: 'grid',
                          placeItems: 'center',
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontStyle: 'italic',
                          fontWeight: 700,
                        }}
                      >
                        3
                      </Box>

                      <Typography
                        sx={{
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          letterSpacing: '0.24em',
                          textTransform: 'uppercase',
                          color: '#243C35',
                        }}
                      >
                        Top 6 for you
                      </Typography>
                    </Box>

                    {loading ? (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            xl: 'repeat(6, 1fr)',
                          },
                          gap: 1.2,
                        }}
                      >
                        {[1, 2, 3, 4, 5, 6].map((item) => (
                          <Skeleton
                            key={item}
                            variant="rounded"
                            height={132}
                            sx={{ borderRadius: '16px' }}
                          />
                        ))}
                      </Box>
                    ) : (
                      <Box
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: {
                            xs: '1fr',
                            sm: 'repeat(2, 1fr)',
                            md: 'repeat(3, 1fr)',
                            xl: 'repeat(6, 1fr)',
                          },
                          gap: 1.2,
                        }}
                      >
                        {rankedSpaces.map((space, index) => {
                          const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'][index];
                          const active = activeTopPickId === space.id;
                          const suburb = getString(space, ['suburb'], String(space.category || 'Place'));

                          return (
                            <Box
                              key={space.id}
                              onClick={() => {
                                setActiveTopPickId(space.id);
                                setActiveNoiseSpaceId(space.id);
                                document
                                  .getElementById(`recommendation-card-${space.id}`)
                                  ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }}
                              sx={{
                                p: 1.5,
                                minHeight: 132,
                                borderRadius: '16px',
                                bgcolor: active || index === 0 ? '#FFFDF8' : '#EFE8DA',
                                border: active || index === 0 ? '2px solid #4F6B57' : '1px solid #D8CBB8',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                transition: 'all 0.22s ease',
                                '&:hover': {
                                  transform: 'translateY(-3px)',
                                  borderColor: '#4F6B57',
                                },
                              }}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                }}
                              >
                                <Typography
                                  sx={{
                                    fontFamily: 'Georgia, "Times New Roman", serif',
                                    fontStyle: 'italic',
                                    color: '#D8845F',
                                    fontSize: '1.35rem',
                                    fontWeight: 700,
                                  }}
                                >
                                  {roman}
                                </Typography>

                                <Typography
                                  sx={{
                                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                    color: '#4F6B57',
                                    fontSize: '1.1rem',
                                    fontWeight: 900,
                                  }}
                                >
                                  {space.rankingScore}
                                  <Box component="span" sx={{ color: '#8A9690', fontSize: '0.65rem' }}>
                                    /100
                                  </Box>
                                </Typography>
                              </Box>

                              <Typography
                                sx={{
                                  mt: 0.8,
                                  fontFamily: 'Georgia, "Times New Roman", serif',
                                  fontSize: '1rem',
                                  lineHeight: 1.1,
                                  fontWeight: 700,
                                  color: '#243C35',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                }}
                              >
                                {space.name}
                              </Typography>

                              <Typography
                                sx={{
                                  mt: 0.8,
                                  color: '#8A9690',
                                  fontSize: '0.75rem',
                                  fontWeight: 700,
                                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                }}
                              >
                                {suburb} · {getNumber(space, ['noiseDb', 'noise_db'], 65)} dB
                              </Typography>

                              <Box
                                sx={{
                                  mt: 1,
                                  height: 5,
                                  borderRadius: 999,
                                  bgcolor: '#D8CBB8',
                                  overflow: 'hidden',
                                }}
                              >
                                <Box
                                  sx={{
                                    width: `${space.rankingScore}%`,
                                    height: '100%',
                                    bgcolor: '#4F6B57',
                                  }}
                                />
                              </Box>
                            </Box>
                          );
                        })}
                      </Box>
                    )}

                    <Box
                      sx={{
                        mt: 1.6,
                        px: 1.8,
                        py: 1.2,
                        borderRadius: '12px',
                        bgcolor: '#E4ECD8',
                        border: '1px solid rgba(79,107,87,0.22)',
                        color: '#4F6B57',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      Live ranking: presets snap the sliders; sliders reorder these picks; tapping a pick jumps to its recommendation card below.
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: { xs: 2.6, md: 3 },
                    borderRadius: '24px',
                    bgcolor: '#FFFDF8',
                    border: '1px solid #E4D9C8',
                    boxShadow: '0 18px 42px rgba(36,60,53,0.08)',
                    minHeight: '100%',
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, mb: 2 }}>
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          letterSpacing: '0.28em',
                          textTransform: 'uppercase',
                          color: '#6E7771',
                          mb: 1,
                        }}
                      >
                        Widget 3 · Noise reference guide
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: 'Georgia, "Times New Roman", serif',
                          fontSize: { xs: '2rem', md: '2.4rem' },
                          lineHeight: 0.95,
                          fontWeight: 600,
                          color: '#243C35',
                          letterSpacing: '-0.04em',
                        }}
                      >
                        Understand the dB scale
                      </Typography>
                    </Box>

                    <Box
                      sx={{
                        px: 1.2,
                        py: 0.65,
                        borderRadius: 999,
                        bgcolor: '#F5F1E8',
                        border: '1px solid #D8CBB8',
                        color: '#6E7771',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        whiteSpace: 'nowrap',
                        height: 'fit-content',
                      }}
                    >
                      Follows quietness
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      color: '#6E7771',
                      fontSize: '1rem',
                      lineHeight: 1.45,
                      maxWidth: 360,
                    }}
                  >
                    The dB ring follows the Quietness slider on the left. Recommendations are ranked by
                    quietness, popularity, weather comfort, public rating, and availability.
                  </Typography>

                  <Box
                    sx={{
                      position: 'relative',
                      width: { xs: 260, md: 310 },
                      height: { xs: 260, md: 310 },
                      mx: 'auto',
                      my: { xs: 3, md: 4 },
                      borderRadius: '50%',
                      background:
  noiseRingDegrees <= 0
    ? '#DDE1D6'
    : noiseRingDegrees >= 359
      ? noiseRingColor
      : `conic-gradient(
          ${noiseRingColor} 0deg ${visibleNoiseRingDegrees}deg,
          #DDE1D6 ${visibleNoiseRingDegrees}deg 360deg
        )`,
                      display: 'grid',
                      placeItems: 'center',
                      transition: 'background 0.25s ease',
                    }}
                  >
                    <Box
                      sx={{
                        width: '68%',
                        height: '68%',
                        borderRadius: '50%',
                        bgcolor: '#FFFDF8',
                        display: 'grid',
                        placeItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '0.72rem',
                            fontWeight: 800,
                            letterSpacing: '0.18em',
                            textTransform: 'uppercase',
                            color: '#8A9690',
                            mb: 0.8,
                          }}
                        >
                          Quietness threshold
                        </Typography>

                        <Typography
                          sx={{
                            fontFamily: 'Georgia, "Times New Roman", serif',
                            fontSize: '2.4rem',
                            fontWeight: 700,
                            color: noiseRingColor,
                            lineHeight: 1,
                          }}
                        >
                          {noiseThreshold} dB
                        </Typography>

                        <Typography sx={{ mt: 0.6, color: noiseRingColor, fontWeight: 800 }}>
                          {loading ? '—' : `${rankedSpaces.length} ranked places`}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Typography
                    sx={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontStyle: 'italic',
                      color: '#6E7771',
                      fontSize: '1.25rem',
                      lineHeight: 1.4,
                      mb: 2,
                    }}
                  >
                    {noiseDescription}
                  </Typography>

                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 1,
                    }}
                  >
                    {[
                      ['30 dB', 'Whisper, library'],
                      ['40 dB', 'Quiet office'],
                      ['50 dB', 'Soft conversation'],
                      ['60 dB', 'Lively café'],
                      ['70 dB', 'Train passing'],
                      ['80 dB', 'Busy street'],
                    ].map(([db, label]) => {
                      const value = Number(db.replace(' dB', ''));

function getActiveNoiseLevel(noise: number) {
  if (noise < 35) return 30;
  if (noise < 45) return 40;
  if (noise < 55) return 50;
  if (noise < 65) return 60;
  if (noise < 75) return 70;
  return 80;
}

const active = value === getActiveNoiseLevel(noiseThreshold);

                      return (
                        <Box
                          key={db}
                          sx={{
                            p: 1.2,
                            minHeight: 84,
                            borderRadius: '12px',
                            bgcolor: active ? '#E4ECD8' : '#EFE8DA',
                            border: active ? '2px solid #4F6B57' : '1px solid #D8CBB8',
                          }}
                        >
                          <Typography
                            sx={{
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                              fontWeight: 900,
                              color: '#4F6B57',
                              fontSize: '0.84rem',
                            }}
                          >
                            {db}
                          </Typography>

                          <Typography
                            sx={{
                              mt: 0.6,
                              fontFamily: 'Georgia, "Times New Roman", serif',
                              fontStyle: 'italic',
                              color: '#243C35',
                              fontSize: '0.92rem',
                              lineHeight: 1.15,
                            }}
                          >
                            {label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                </Paper>
              </Box>

              <Box
                sx={{
                  mt: 3,
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
                  label="Average environment fit"
                  value={loading ? '—' : `${averageEnvironmentFit}/100`}
                />

                <StatCard
                  icon={<BoltRoundedIcon />}
                  label="Average public rating"
                  value={loading ? '—' : `${averageRating.toFixed(1)}★`}
                />

                <StatCard
                  icon={<PlaceRoundedIcon />}
                  label="Total public reviews"
                  value={loading ? '—' : Math.round(totalReviews).toLocaleString()}
                />
              </Box>

              <Paper
                elevation={0}
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: '18px',
                  border: '1px solid #E4D9C8',
                  bgcolor: '#FFFDF8',
                  boxShadow: '0 12px 30px rgba(36,60,53,0.06)',
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
                        color: '#243C35',
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
                              bgcolor: '#EFE8DA',
                              color: '#243C35',
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
                        bgcolor: '#243C35',
                        boxShadow: '0 10px 20px rgba(88,80,236,0.25)',
                        '&:hover': {
                          bgcolor: '#182B25',
                        },
                        '&.Mui-disabled': {
                          bgcolor: '#CFC4B4',
                          color: '#FFFDF8',
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
                    border: '1px solid #E4D9C8',
                    bgcolor: '#FFFDF8',
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
                      color: '#243C35',
                      letterSpacing: '-0.04em',
                    }}
                  >
                    Recommended places
                  </Typography>

                  <Typography color="text.secondary" sx={{ mb: 3 }}>
                    Top 6 places based on your full comfort ranking.
                  </Typography>

                  {error ? (
                    <Typography color="error.main">{error}</Typography>
                  ) : loading ? (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
                        gap: 3,
                      }}
                    >
                      {[1, 2, 3, 4, 5, 6].map((item) => (
                        <Skeleton
                          key={item}
                          variant="rounded"
                          height={420}
                          sx={{ borderRadius: '20px' }}
                        />
                      ))}
                    </Box>
                  ) : recommendedSpaces.length === 0 ? (
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: '20px',
                        border: '1px solid #E4D9C8',
                        bgcolor: '#FFFDF8',
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '1.35rem',
                          fontWeight: 900,
                          color: '#243C35',
                        }}
                      >
                        No places match the current ranking settings
                      </Typography>

                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Adjust the priority sliders above to refresh recommendations.
                      </Typography>
                    </Paper>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
                        gap: 3,
                      }}
                    >
                      {recommendedSpaces.map((space, index) => (
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
                          <HomeRecommendationCard
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