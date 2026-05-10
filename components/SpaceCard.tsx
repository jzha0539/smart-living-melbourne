'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import type { Space } from '../types/space';

type SpaceCardProps = {
  space: Space;
  rank?: number;
  selected?: boolean;
  isCompared?: boolean;
  onSelect?: (space: Space) => void;
  onCompare?: (space: Space) => void;
  onAddToCompare?: (space: Space) => void;
};

function safeNumber(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getDistance(space: Space) {
  const distance = Number(space.distance);
  return Number.isFinite(distance) && distance >= 0 ? distance : null;
}

function getWalkingText(space: Space) {
  const distance = getDistance(space);

  if (distance === null) {
    return 'Walking distance unavailable';
  }

  const minutes = Math.max(3, Math.round(distance * 12));
  return `~${minutes} min walk`;
}

function getDistanceText(space: Space) {
  const distance = getDistance(space);

  if (distance === null) {
    return 'Nearby';
  }

  return `${distance.toFixed(1)} km`;
}

function getRouteDistanceDescription(space: Space) {
  const distance = getDistance(space);

  if (distance === null) {
    return 'Distance data unavailable';
  }

  if (distance < 1) {
    return 'Short walk';
  }

  if (distance < 2) {
    return 'Moderate walk';
  }

  return 'Longer walk';
}

function getSerenity(space: Space) {
  const explicit = Number(space.serenityScore);

  if (Number.isFinite(explicit)) {
    return Math.round(explicit);
  }

  const noise = safeNumber(space.noiseDb, 70);
  const comfort = safeNumber(space.comfort, 60);
  const shade = safeNumber(space.shade, 0);

  const noiseScore = Math.max(0, 100 - noise);
  const score = noiseScore * 0.45 + comfort * 0.4 + shade * 0.15;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function getStudyTime(space: Space) {
  if (space.quietTime) {
    return space.quietTime;
  }

  const noise = safeNumber(space.noiseDb, 70);

  if (noise <= 55) {
    return '8am-10am';
  }

  if (noise <= 65) {
    return '10am-12pm';
  }

  return 'before 10am';
}

function getRemoteWorkTime(space: Space) {
  const comfort = safeNumber(space.comfort, 60);

  if (comfort >= 70) {
    return '9am-12pm';
  }

  return '10am-1pm';
}

function getRelaxTime(space: Space) {
  const shade = safeNumber(space.shade, 0);

  if (shade >= 50) {
    return 'before 11am or after 4pm';
  }

  return 'before 10am or after 5pm';
}

function getNoiseZone(space: Space) {
  const noise = safeNumber(space.noiseDb, 70);

  if (noise <= 45) return 'Quiet Zone';
  if (noise <= 60) return 'Moderate Zone';
  if (noise <= 70) return 'Active Zone';

  return 'Busy Zone';
}

function getCategoryLabel(category: string) {
  if (!category) return 'Space';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function MetricBar({
  label,
  value,
  suffix,
  displayValue,
}: {
  label: string;
  value: number;
  suffix?: string;
  displayValue?: string;
}) {
  const safeValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <Box>
      <Box
        sx={{
          mb: 0.8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography
          sx={{
            color: '#273d34',
            fontWeight: 900,
            fontSize: '1rem',
          }}
        >
          {label}
        </Typography>

        <Typography
          sx={{
            color: '#273d34',
            fontWeight: 900,
            fontSize: '1rem',
            fontFamily: 'monospace',
          }}
        >
          {displayValue ?? `${safeValue}${suffix ?? ''}`}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={safeValue}
        sx={{
          height: 10,
          borderRadius: 999,
          bgcolor: '#d8cdb8',
          '& .MuiLinearProgress-bar': {
            borderRadius: 999,
            bgcolor: '#55715e',
          },
        }}
      />
    </Box>
  );
}

export default function SpaceCard({
  space,
  rank = 1,
  selected = false,
  isCompared = false,
  onSelect,
  onCompare,
  onAddToCompare,
}: SpaceCardProps) {
  const router = useRouter();

  const noise = safeNumber(space.noiseDb, 70);
  const comfort = safeNumber(space.comfort, 0);
  const shade = safeNumber(space.shade, 0);
  const serenity = getSerenity(space);

  function handleStartRoutine(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedSpaceName', space.name);
      localStorage.setItem('selectedRouteSpace', space.name);
      localStorage.setItem('routeDestination', space.name);
      localStorage.setItem('selectedDestinationName', space.name);

      localStorage.setItem(
        'selectedRouteSpaceData',
        JSON.stringify({
          id: space.id,
          name: space.name,
          suburb: space.suburb,
          category: space.category,
          latitude: space.latitude,
          longitude: space.longitude,
        })
      );
    }

    router.push(`/route?space=${encodeURIComponent(space.name)}`);
  }

  function handleCompare(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (onAddToCompare) {
      onAddToCompare(space);
      return;
    }

    if (onCompare) {
      onCompare(space);
    }
  }

  return (
    <Paper
      elevation={0}
      onClick={() => onSelect?.(space)}
      sx={{
        position: 'relative',
        height: '100%',
        p: { xs: 2.5, md: 3 },
        borderRadius: '24px',
        border: selected ? '2px solid #c9775c' : '1px solid #ded2bd',
        bgcolor: '#fbf7ed',
        color: '#273d34',
        boxShadow: selected
          ? '0 18px 44px rgba(201, 119, 92, 0.18)'
          : '0 18px 40px rgba(87, 72, 48, 0.1)',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 180ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 2.2,
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 22px 48px rgba(87, 72, 48, 0.14)',
        },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={`✨ Top ${rank}`}
            sx={{
              height: 34,
              borderRadius: '999px',
              bgcolor: '#c9775c',
              color: '#fffaf1',
              fontWeight: 900,
              fontSize: '0.95rem',
              '& .MuiChip-label': {
                px: 1.4,
              },
            }}
          />

          <Chip
            label={getCategoryLabel(space.category)}
            sx={{
              height: 34,
              borderRadius: '999px',
              bgcolor: '#eee6d8',
              color: '#273d34',
              border: '1px solid #d8c9ae',
              fontWeight: 900,
              textTransform: 'capitalize',
              fontSize: '0.95rem',
              '& .MuiChip-label': {
                px: 1.4,
              },
            }}
          />
        </Box>

        <Chip
          label={`📍 ${getDistanceText(space)}`}
          sx={{
            height: 34,
            borderRadius: '999px',
            bgcolor: '#fffaf1',
            border: '1px solid #d8c9ae',
            color: '#273d34',
            fontWeight: 900,
            fontSize: '0.95rem',
            '& .MuiChip-label': {
              px: 1.4,
            },
          }}
        />
      </Box>

      <Box>
        <Typography
          sx={{
            color: '#273d34',
            fontFamily: 'Georgia, serif',
            fontWeight: 900,
            fontSize: {
              xs: '2rem',
              md: '2.3rem',
            },
            lineHeight: 1.05,
            letterSpacing: '-0.04em',
          }}
        >
          {space.name}
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: '#68766d',
            fontSize: '1.08rem',
          }}
        >
          {space.suburb || 'Melbourne'}
        </Typography>
      </Box>

      <Chip
        label={`Serenity ${serenity}/100`}
        sx={{
          alignSelf: 'flex-start',
          height: 32,
          borderRadius: '999px',
          bgcolor: '#fffaf1',
          border: '1px solid #d8c9ae',
          color: '#486445',
          fontWeight: 900,
          fontSize: '0.95rem',
        }}
      />

      <Box sx={{ display: 'grid', gap: 2.2 }}>
        <Box>
          <MetricBar
            label="Noise"
            value={noise}
            displayValue={`${Math.round(noise)} dB`}
          />

          <Typography
            sx={{
              mt: 0.9,
              color: '#68766d',
              fontSize: '1rem',
            }}
          >
            {getNoiseZone(space)}
          </Typography>
        </Box>

        <MetricBar
          label="Comfort"
          value={comfort}
          displayValue={`${Math.round(comfort)}/100`}
        />

        <MetricBar
          label="Shade"
          value={shade}
          displayValue={`${Math.round(shade)}%`}
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          mt: 1,
          p: 2.2,
          borderRadius: '18px',
          border: '1px solid #ded2bd',
          bgcolor: '#fffaf1',
        }}
      >
        <Typography
          sx={{
            mb: 1.2,
            color: '#9a8f7e',
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          Best time to visit
        </Typography>

        <Typography sx={{ color: '#273d34', mb: 0.8, fontSize: '1rem' }}>
          <strong>Study:</strong> {getStudyTime(space)}
        </Typography>

        <Typography sx={{ color: '#273d34', mb: 0.8, fontSize: '1rem' }}>
          <strong>Remote work:</strong> {getRemoteWorkTime(space)}
        </Typography>

        <Typography sx={{ color: '#273d34', fontSize: '1rem' }}>
          <strong>Relax:</strong> {getRelaxTime(space)}
        </Typography>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 2.2,
          borderRadius: '18px',
          border: '1px solid #ded2bd',
          bgcolor: '#fffaf1',
        }}
      >
        <Typography
          sx={{
            mb: 1.2,
            color: '#273d34',
            fontSize: 13,
            fontWeight: 900,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
          }}
        >
          Route insight
        </Typography>

        <Typography sx={{ color: '#273d34', mb: 0.8, fontSize: '1rem' }}>
          ⏱ {getWalkingText(space)}
        </Typography>

        <Typography sx={{ color: '#68766d', fontSize: '1rem' }}>
          {getRouteDistanceDescription(space)}
        </Typography>
      </Paper>

      <Box
        sx={{
          mt: 'auto',
          pt: 2,
          borderTop: '1px dashed #d8c9ae',
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: '1fr auto',
          },
          gap: 1.2,
          alignItems: 'center',
        }}
      >
        <Button
          onClick={handleStartRoutine}
          variant="contained"
          sx={{
            borderRadius: '18px',
            bgcolor: '#2d4a3d',
            color: '#ffffff',
            textTransform: 'none',
            fontWeight: 900,
            py: 1.45,
            px: 3,
            fontSize: '1rem',
            boxShadow: 'none',
            '&:hover': {
              bgcolor: '#263f35',
              boxShadow: 'none',
            },
          }}
        >
          Start routine
        </Button>

        <Button
          onClick={handleCompare}
          variant="outlined"
          disabled={isCompared}
          sx={{
            borderRadius: '18px',
            px: 2.6,
            color: isCompared ? '#9a8f7e' : '#273d34',
            borderColor: '#d8c9ae',
            bgcolor: '#eee6d8',
            textTransform: 'none',
            fontWeight: 900,
            py: 1.35,
            fontSize: '1rem',
            whiteSpace: 'nowrap',
            '&:hover': {
              borderColor: '#cdbb9b',
              bgcolor: '#e5dbc9',
            },
            '&.Mui-disabled': {
              bgcolor: '#eee6d8',
              color: '#9a8f7e',
            },
          }}
        >
          {isCompared ? 'Added' : '+ Compare'}
        </Button>
      </Box>
    </Paper>
  );
}