'use client';

import * as React from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { Space } from '../types/space';

type SpaceCardProps = {
  space: Space;
  rank?: number;
  selected?: boolean;
  onSelect?: (space: Space) => void;
  onAddToCompare?: (space: Space) => void;
  isCompared?: boolean;
};

function getNumberValue(space: Space, keys: string[], fallback = 0): number {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (
      typeof value === 'string' &&
      value.trim() &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }

  return fallback;
}

function getStringValue(space: Space, keys: string[], fallback = ''): string {
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

function getWeatherFit(space: Space): number {
  const windSpeed = getNumberValue(space, ['windSpeed', 'avg_wind_speed'], 10);
  const temperature = getNumberValue(space, ['temperature', 'air_temperature'], 22);
  const humidity = getNumberValue(space, ['humidity', 'relative_humidity'], 50);

  const score =
    100 -
    Math.max(0, windSpeed - 8) * 2.5 -
    Math.abs(temperature - 22) * 3 -
    Math.abs(humidity - 50) * 0.7;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getPopularityScore(space: Space): number {
  const ratingCount = getNumberValue(space, ['ratingCount', 'rating_count'], 0);

  if (ratingCount === 0) return 45;
  if (ratingCount < 50) return 60;
  if (ratingCount < 250) return 85;
  if (ratingCount < 1000) return 76;
  return 64;
}

function getAvailabilityScore(space: Space): number {
  const record = space as unknown as Record<string, unknown>;
  const openingHours = getStringValue(space, ['openingHours', 'opening_hours'], '');
  const is24_7 =
    record.is24_7 === true || record.is24_7 === 1 || record.is24_7 === 'true';

  if (is24_7) return 100;
  if (openingHours) return 82;
  return 48;
}

function getCrowdEstimate(space: Space): string {
  const ratingCount = getNumberValue(space, ['ratingCount', 'rating_count'], 0);

  if (ratingCount >= 1000) return 'Busy';
  if (ratingCount >= 150) return 'Moderate';
  return 'Low';
}

function getOpeningLabel(space: Space): string {
  const record = space as unknown as Record<string, unknown>;
  const is24_7 =
    record.is24_7 === true || record.is24_7 === 1 || record.is24_7 === 'true';

  if (is24_7) return '24h';

  const openingHours = getStringValue(space, ['openingHours', 'opening_hours'], '');
  if (openingHours) return 'Hours listed';

  return 'Hours unknown';
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
        p: { xs: 1.7, md: 2 },
        borderRadius: '16px',
        bgcolor: '#EFE8DA',
        border: '1px solid #D8CBB8',
        minHeight: 94,
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
          mt: 1.1,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: { xs: '1.45rem', md: '1.65rem' },
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

function ScoreRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 54px',
        gap: 1.4,
        alignItems: 'center',
      }}
    >
      <Typography
        sx={{
          color: '#6E7771',
          fontSize: '1rem',
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          height: 8,
          borderRadius: 999,
          bgcolor: '#D8CBB8',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${safeValue}%`,
            height: '100%',
            bgcolor: '#4F6B57',
            borderRadius: 999,
          }}
        />
      </Box>

      <Typography
        sx={{
          textAlign: 'right',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          color: '#243C35',
          fontWeight: 900,
          fontSize: '0.9rem',
        }}
      >
        {safeValue}%
      </Typography>
    </Box>
  );
}

export default function SpaceCard({
  space,
  rank = 1,
  selected = false,
  onSelect,
  onAddToCompare,
  isCompared = false,
}: SpaceCardProps) {
  const router = useRouter();

  const id = getSpaceId(space);
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI'][rank - 1] ?? String(rank);

  const name = getStringValue(space, ['name'], 'Unknown place');
  const category = getStringValue(space, ['category'], 'place');
  const suburb = getStringValue(space, ['suburb'], '');
  const address = getStringValue(space, ['address'], '');

  const noise = getNumberValue(space, ['noiseDb', 'noise_db'], 65);
  const comfort = getNumberValue(space, ['comfort'], 70);
  const rating = getNumberValue(space, ['rating'], 0);
  const ratingCount = getNumberValue(space, ['ratingCount', 'rating_count'], 0);
  const windSpeed = getNumberValue(space, ['windSpeed', 'avg_wind_speed'], 0);
  const temperature = getNumberValue(space, ['temperature', 'air_temperature'], 0);
  const humidity = getNumberValue(space, ['humidity', 'relative_humidity'], 0);
  const distance = getNumberValue(space, ['distance'], 0);

  const quietness = Math.max(0, Math.min(100, 100 - noise));
  const weatherFit = getWeatherFit(space);
  const popularity = getPopularityScore(space);
  const availability = getAvailabilityScore(space);

  const rankingScore = Math.max(
    0,
    Math.min(
      100,
      Math.round(
        quietness * 0.22 +
          weatherFit * 0.22 +
          popularity * 0.18 +
          availability * 0.16 +
          comfort * 0.22
      )
    )
  );

  function handleStartRoute() {
    localStorage.setItem('route-space', JSON.stringify(space));
    router.push(`/route?space=${encodeURIComponent(name)}`);
  }

  return (
    <Paper
      elevation={0}
      onClick={() => onSelect?.(space)}
      sx={{
        p: { xs: 2.4, md: 3 },
        borderRadius: '28px',
        bgcolor: '#FFFDF8',
        border: selected ? '2px solid #4F6B57' : '1px solid #D8CBB8',
        boxShadow: selected
          ? '0 20px 46px rgba(36,60,53,0.18)'
          : '0 12px 30px rgba(36,60,53,0.07)',
        transition: 'all 0.26s ease',
        height: '100%',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 22px 48px rgba(36,60,53,0.14)',
          borderColor: '#4F6B57',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 2,
          alignItems: 'flex-start',
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.78rem',
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '0.26em',
              color: '#8A9690',
              mb: 1,
            }}
          >
            Recommended from ranking
          </Typography>

          <Typography
            sx={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontSize: { xs: '2rem', md: '2.35rem' },
              lineHeight: 1.02,
              fontWeight: 700,
              color: '#243C35',
              letterSpacing: '-0.045em',
            }}
          >
            {name}
          </Typography>

          <Typography
            sx={{
              mt: 1,
              color: '#6E7771',
              fontSize: '1rem',
              lineHeight: 1.5,
            }}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
            {suburb ? ` · ${suburb}` : ''}
            {distance > 0 ? ` · ${distance.toFixed(1)} km` : ''}
          </Typography>

          {address && (
            <Typography
              sx={{
                mt: 0.6,
                color: '#8A9690',
                fontSize: '0.92rem',
                lineHeight: 1.45,
              }}
            >
              {address}
            </Typography>
          )}
        </Box>

        <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
          <Typography
            sx={{
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontStyle: 'italic',
              fontSize: '1.8rem',
              color: '#D8845F',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {roman}
          </Typography>

          <Typography
            sx={{
              mt: 1,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              fontSize: '1.15rem',
              color: '#4F6B57',
              fontWeight: 900,
            }}
          >
            {rankingScore}
            <Box
              component="span"
              sx={{
                color: '#8A9690',
                fontSize: '0.72rem',
              }}
            >
              /100
            </Box>
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            sm: 'repeat(4, 1fr)',
          },
          gap: 1.2,
        }}
      >
        <MetricBox label="Noise" value={`${Math.round(noise)} dB`} />
        <MetricBox label="Weather Fit" value={`${weatherFit}/100`} />
        <MetricBox label="Popularity" value={`${popularity}/100`} />
        <MetricBox
          label="Rating"
          value={rating > 0 ? `${rating.toFixed(1)}★` : 'N/A'}
        />
      </Box>

      <Box
        sx={{
          mt: 1.2,
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
          },
          gap: 1.2,
        }}
      >
        <MetricBox label="Wind" value={`${windSpeed.toFixed(1)} km/h`} />
        <MetricBox
          label="Air"
          value={`${temperature.toFixed(1)}°C · ${Math.round(humidity)}%`}
        />
      </Box>

      <Box
        sx={{
          mt: 2.4,
          pl: 1.8,
          borderLeft: '3px solid #4F6B57',
          color: '#6E7771',
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontStyle: 'italic',
          fontSize: '1.05rem',
          lineHeight: 1.55,
        }}
      >
        Ranked highly because it balances quietness, popularity, weather comfort,
        public rating, and availability using the new POI dataset.
      </Box>

      <Box
        sx={{
          mt: 2.4,
          display: 'grid',
          gap: 1.1,
        }}
      >
        <ScoreRow label="Quietness" value={quietness} />
        <ScoreRow label="Weather" value={weatherFit} />
        <ScoreRow label="Popularity" value={popularity} />
        <ScoreRow label="Availability" value={availability} />
      </Box>

      <Box
        sx={{
          mt: 2.2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Box
          sx={{
            px: 1.4,
            py: 0.7,
            borderRadius: 999,
            border: '1px solid #D8CBB8',
            bgcolor: '#FFFDF8',
            color: '#243C35',
            fontWeight: 800,
            fontSize: '0.82rem',
          }}
        >
          Crowd estimate: {getCrowdEstimate(space)}
        </Box>

        <Box
          sx={{
            px: 1.4,
            py: 0.7,
            borderRadius: 999,
            border: '1px solid #D8CBB8',
            bgcolor: '#FFFDF8',
            color: '#243C35',
            fontWeight: 800,
            fontSize: '0.82rem',
          }}
        >
          {ratingCount} reviews
        </Box>

        <Box
          sx={{
            px: 1.4,
            py: 0.7,
            borderRadius: 999,
            border: '1px solid #D8CBB8',
            bgcolor: '#FFFDF8',
            color: '#243C35',
            fontWeight: 800,
            fontSize: '0.82rem',
          }}
        >
          {getOpeningLabel(space)}
        </Box>
      </Box>

      <Box
        sx={{
          mt: 2.6,
          pt: 2,
          borderTop: '1px dashed #D8CBB8',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
          },
          gap: 1,
        }}
      >
        <Button
  onClick={(event) => {
    event.stopPropagation();
    handleStartRoute();
  }}
  sx={{
    px: 2,
    py: 1.25,
    borderRadius: '16px',
    textTransform: 'none',
    fontWeight: 900,
    bgcolor: '#243C35',
    color: '#FFFDF8',
    '&:hover': {
      bgcolor: '#182B25',
    },
  }}
>
  I'm going here
</Button>

        <Button
          onClick={(event) => {
            event.stopPropagation();
            onAddToCompare?.(space);
          }}
          sx={{
            px: 2,
            py: 1.25,
            borderRadius: '16px',
            textTransform: 'none',
            fontWeight: 900,
            bgcolor: isCompared ? '#243C35' : '#EFE8DA',
            color: isCompared ? '#FFFDF8' : '#243C35',
            border: '1px solid #D8CBB8',
            '&:hover': {
              bgcolor: isCompared ? '#243C35' : '#E4D9C8',
            },
          }}
        >
          {isCompared ? 'Added to compare' : 'Compare with others'}
        </Button>
      </Box>
    </Paper>
  );
}