'use client';

import React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import type { Space } from '@/types/space';

type SpaceCardProps = {
  space: Space;
  rank?: number;
  highlight?: boolean;
  selected?: boolean;
  isCompared?: boolean;
  onAddToCompare?: (space: Space) => void;
  onCompare?: (space: Space) => void;
  onSelect?: (space: Space) => void;
};

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getDistance(space: Space) {
  const distance = Number(space.distance);
  return Number.isFinite(distance) && distance > 0 ? distance : null;
}

function getNoise(space: Space) {
  return safeNumber(space.noiseDb, 70);
}

function getComfort(space: Space) {
  return safeNumber(space.comfort, 0);
}

function getShade(space: Space) {
  return safeNumber(space.shade, 0);
}

function getSerenity(space: Space) {
  const serenity = Number(space.serenityScore);

  if (Number.isFinite(serenity)) {
    return Math.round(serenity);
  }

  const noise = getNoise(space);
  const comfort = getComfort(space);
  const shade = getShade(space);

  const noiseScore = Math.max(0, 100 - Math.max(0, noise - 40) * 1.5);

  return Math.round(noiseScore * 0.45 + comfort * 0.4 + shade * 0.15);
}

function getWalkMinutes(space: Space) {
  const distance = getDistance(space);

  if (distance === null) {
    return null;
  }

  return Math.max(1, Math.round(distance * 12));
}

function getNoiseLabel(noiseDb: number) {
  if (noiseDb <= 45) return 'Library Quiet';
  if (noiseDb <= 60) return 'Moderate Zone';
  if (noiseDb <= 70) return 'Active Zone';
  return 'Busy Zone';
}

function getCategoryLabel(category: string) {
  const value = String(category ?? '').toLowerCase();

  if (value === 'study') return 'Study';
  if (value === 'leisure') return 'Leisure';
  if (value === 'culture') return 'Culture';
  if (value === 'lifestyle') return 'Lifestyle';

  return category || 'Space';
}

function getBestTime(space: Space) {
  if (space.quietTime) {
    return space.quietTime;
  }

  const category = String(space.category ?? '').toLowerCase();

  if (category === 'study') return '7am-9am';
  if (category === 'leisure') return '8am-10am';
  if (category === 'culture') return '10am-12pm';
  if (category === 'lifestyle') return '9am-11am';

  return '8am-10am';
}

export default function SpaceCard({
  space,
  rank,
  highlight = false,
  selected = false,
  isCompared = false,
  onAddToCompare,
  onCompare,
  onSelect,
}: SpaceCardProps) {
  const distance = getDistance(space);
  const noise = getNoise(space);
  const comfort = getComfort(space);
  const shade = getShade(space);
  const serenity = getSerenity(space);
  const walkMinutes = getWalkMinutes(space);

  const categoryLabel = getCategoryLabel(space.category);
  const noiseLabel = getNoiseLabel(noise);
  const bestTime = getBestTime(space);

  const isActive = highlight || selected;

  const handleCompare = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (onCompare) {
      onCompare(space);
      return;
    }

    if (onAddToCompare) {
      onAddToCompare(space);
    }
  };

  return (
    <Paper
      onClick={() => onSelect?.(space)}
      elevation={0}
      sx={{
        height: '100%',
        p: 3,
        borderRadius: '28px',
        border: isActive ? '2px solid #6257f6' : '1px solid #e5e7eb',
        bgcolor: '#ffffff',
        boxShadow: isActive
          ? '0 18px 40px rgba(98, 87, 246, 0.18)'
          : '0 12px 32px rgba(31, 41, 55, 0.08)',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 18px 42px rgba(31, 41, 55, 0.14)',
        },
      }}
    >
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {typeof rank === 'number' && (
            <Chip
              label={`✨ Top ${rank}`}
              size="small"
              sx={{
                bgcolor: '#6257f6',
                color: '#ffffff',
                fontWeight: 800,
              }}
            />
          )}

          <Chip
            label={categoryLabel}
            size="small"
            sx={{
              bgcolor: '#f8fafc',
              color: '#263f35',
              border: '1px solid #d6dde7',
              fontWeight: 700,
            }}
          />
        </Box>

        <Chip
          label={distance !== null ? `📍 ${distance.toFixed(1)} km` : '📍 Nearby'}
          size="small"
          sx={{
            bgcolor: '#ffffff',
            color: '#4d5a54',
            border: '1px solid #d6dde7',
            fontWeight: 700,
          }}
        />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 900,
            color: '#172233',
            lineHeight: 1.2,
          }}
        >
          {space.name}
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: '#607086',
            fontSize: '0.95rem',
          }}
        >
          {space.suburb || 'Melbourne'}
        </Typography>
      </Box>

      <Chip
        label={`Serenity ${serenity}/100`}
        size="small"
        sx={{
          mb: 3,
          bgcolor: '#ffffff',
          color: '#1687ee',
          border: '1px solid #58aaf8',
          fontWeight: 800,
        }}
      />

      <Box sx={{ display: 'grid', gap: 2.5 }}>
        <Box>
          <Box
            sx={{
              mb: 0.8,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#172233', fontSize: 14 }}>
              Noise
            </Typography>
            <Typography sx={{ color: '#425064', fontSize: 14 }}>
              {noise} dB
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, noise))}
            sx={{
              height: 10,
              borderRadius: 99,
              bgcolor: '#e9e6ff',
              '& .MuiLinearProgress-bar': {
                borderRadius: 99,
                bgcolor: '#6257f6',
              },
            }}
          />

          <Typography sx={{ mt: 1, color: '#607086', fontSize: 14 }}>
            {noiseLabel}
          </Typography>
        </Box>

        <Box>
          <Box
            sx={{
              mb: 0.8,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#172233', fontSize: 14 }}>
              Comfort
            </Typography>
            <Typography sx={{ color: '#425064', fontSize: 14 }}>
              {comfort}/100
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, comfort))}
            sx={{
              height: 10,
              borderRadius: 99,
              bgcolor: '#e9e6ff',
              '& .MuiLinearProgress-bar': {
                borderRadius: 99,
                bgcolor: '#6257f6',
              },
            }}
          />
        </Box>

        <Box>
          <Box
            sx={{
              mb: 0.8,
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <Typography sx={{ fontWeight: 800, color: '#172233', fontSize: 14 }}>
              Shade
            </Typography>
            <Typography sx={{ color: '#425064', fontSize: 14 }}>
              {shade}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={Math.min(100, Math.max(0, shade))}
            sx={{
              height: 10,
              borderRadius: 99,
              bgcolor: '#e9e6ff',
              '& .MuiLinearProgress-bar': {
                borderRadius: 99,
                bgcolor: '#6257f6',
              },
            }}
          />
        </Box>
      </Box>

      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: '18px',
          border: '1px solid #e6eaf0',
          bgcolor: '#fafbff',
        }}
      >
        <Typography
          sx={{
            mb: 1.2,
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: '#6257f6',
          }}
        >
          BEST TIME TO VISIT
        </Typography>

        <Typography sx={{ fontSize: 14, color: '#425064', mb: 0.6 }}>
          <strong>Study:</strong> {bestTime}
        </Typography>

        <Typography sx={{ fontSize: 14, color: '#425064', mb: 0.6 }}>
          <strong>Remote work:</strong> 9am-12pm
        </Typography>

        <Typography sx={{ fontSize: 14, color: '#425064' }}>
          <strong>Relax:</strong> before 10am or after 5pm
        </Typography>
      </Box>

      <Box
        sx={{
          mt: 2,
          p: 2,
          borderRadius: '18px',
          border: '1px solid #e6eaf0',
          bgcolor: '#fafbff',
        }}
      >
        <Typography
          sx={{
            mb: 1.2,
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.08em',
            color: '#172233',
          }}
        >
          ROUTE INSIGHT
        </Typography>

        <Typography sx={{ fontSize: 14, color: '#425064' }}>
          ⏱{' '}
          {walkMinutes !== null
            ? `~${walkMinutes} min walk`
            : 'Walking distance unavailable'}
        </Typography>

        <Typography sx={{ mt: 0.6, fontSize: 14, color: '#607086' }}>
          {distance !== null && distance <= 1.5
            ? 'Short walk'
            : distance !== null
              ? 'Longer walk'
              : 'Distance data unavailable'}
        </Typography>
      </Box>

      <Box sx={{ mt: 2.5, display: 'flex', gap: 1.5 }}>
        <Button
          component={Link}
          href={`/routine?space=${encodeURIComponent(space.name)}`}
          variant="contained"
          onClick={(event) => {
            event.stopPropagation();
          }}
          sx={{
            flex: 1,
            borderRadius: 99,
            bgcolor: '#203d32',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 800,
            py: 1.2,
            '&:hover': {
              bgcolor: '#203d32',
              opacity: 0.9,
            },
          }}
        >
          Start routine
        </Button>

        <Button
          variant={isCompared ? 'contained' : 'outlined'}
          onClick={handleCompare}
          sx={{
            minWidth: 120,
            borderRadius: 99,
            textTransform: 'none',
            fontWeight: 800,
            py: 1.2,
            color: isCompared ? '#ffffff' : '#6257f6',
            borderColor: '#6257f6',
            bgcolor: isCompared ? '#6257f6' : '#ffffff',
            '&:hover': {
              borderColor: '#6257f6',
              bgcolor: isCompared ? '#6257f6' : '#f3f1ff',
            },
          }}
        >
          {isCompared ? '✓ Added' : '+ Compare'}
        </Button>
      </Box>
    </Paper>
  );
}