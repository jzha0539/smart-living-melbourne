'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Paper,
  Typography,
} from '@mui/material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import AutoAwesomeRoundedIcon from '@mui/icons-material/AutoAwesomeRounded';
import { Space } from '../types/space';

type Props = {
  space: Space;
  rank?: number;
  highlight?: boolean;
  onAddToCompare?: (space: Space) => void;
  isCompared?: boolean;
};

function getSerenity(space: Space) {
  if (typeof (space as Space & { serenityScore?: number }).serenityScore === 'number') {
    return (space as Space & { serenityScore?: number }).serenityScore as number;
  }

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

function getSpaceImage(space: Space) {
  const name = space.name.toLowerCase();
  const category = space.category.toLowerCase();

  if (name.includes('birrarung')) return '/images/birrarung.jpg';
  if (name.includes('enterprize')) return '/images/enterprize.jpg';
  if (name.includes('skyfarm') || name.includes('mcec')) return '/images/skyfarm.jpg';

  if (category.includes('park')) return '/images/park.jpg';
  if (category.includes('rooftop')) return '/images/rooftop.jpg';
  if (category.includes('library')) return '/images/library.jpg';
  if (category.includes('public lounge')) return '/images/lounge.jpg';

  return '/images/1.jpg';
}

function MetricBar({
  label,
  value,
  suffix = '',
  tone = 'blue',
}: {
  label: string;
  value: number;
  suffix?: string;
  tone?: 'blue' | 'purple';
}) {
  const barColor = tone === 'purple' ? '#6d5dfc' : '#4f46e5';

  return (
    <Box sx={{ mb: 2.2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          mb: 0.7,
        }}
      >
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a' }}>
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.82rem', color: '#334155' }}>
          {value}
          {suffix}
        </Typography>
      </Box>

      <Box
        sx={{
          width: '100%',
          height: 12,
          borderRadius: '999px',
          bgcolor: '#e8e8ff',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            width: `${Math.max(0, Math.min(100, value))}%`,
            height: '100%',
            borderRadius: '999px',
            bgcolor: barColor,
          }}
        />
      </Box>
    </Box>
  );
}

export default function SpaceCard({
  space,
  rank,
  highlight,
  onAddToCompare,
  isCompared,
}: Props) {
  const serenity = getSerenity(space);
  const imageUrl = getSpaceImage(space);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: '26px',
        border: '1px solid #e1e5f2',
        bgcolor: '#ffffff',
        boxShadow: highlight
          ? '0 18px 36px rgba(79,70,229,0.10)'
          : '0 10px 26px rgba(15,23,42,0.05)',
        transition: 'transform 0.28s ease, box-shadow 0.28s ease',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        '&:hover': {
          transform: 'translateY(-6px)',
          boxShadow: '0 22px 40px rgba(79,70,229,0.14)',
        },
      }}
    >
      {/* top chips */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
          mb: 1.2,
        }}
      >
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {typeof rank === 'number' && (
            <Chip
              icon={<AutoAwesomeRoundedIcon sx={{ fontSize: 16 }} />}
              label={`Top ${rank}`}
              sx={{
                height: 30,
                borderRadius: '999px',
                bgcolor: '#5850ec',
                color: '#fff',
                fontWeight: 800,
                '& .MuiChip-icon': { color: '#fff', ml: 0.4 },
              }}
            />
          )}

          <Chip
            label={space.category}
            variant="outlined"
            sx={{
              height: 30,
              borderRadius: '999px',
              borderColor: '#cbd5e1',
              color: '#334155',
              fontWeight: 700,
              bgcolor: '#fff',
            }}
          />
        </Box>

        <Chip
          icon={<PlaceRoundedIcon sx={{ fontSize: 18 }} />}
          label={`${space.distance} km`}
          variant="outlined"
          sx={{
            height: 34,
            borderRadius: '999px',
            borderColor: '#bcbcbc',
            color: '#334155',
            fontWeight: 700,
            '& .MuiChip-icon': { color: '#666' },
          }}
        />
      </Box>

      <Chip
        label={`Serenity ${serenity}`}
        variant="outlined"
        sx={{
          alignSelf: 'flex-start',
          mb: 1.8,
          height: 34,
          borderRadius: '999px',
          borderColor: '#64b5f6',
          color: '#1d9bf0',
          fontWeight: 700,
          bgcolor: '#f7fbff',
        }}
      />

      {/* name */}
      <Typography
        sx={{
          fontSize: { xs: '2rem', md: '2.1rem' },
          lineHeight: 1.04,
          fontWeight: 900,
          color: '#1f2937',
          letterSpacing: '-0.03em',
        }}
      >
        {space.name}
      </Typography>

      <Typography sx={{ mt: 0.8, color: '#475569', fontSize: '0.95rem', mb: 1.8 }}>
        {space.suburb}
      </Typography>

      {/* image block */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: 180,
          borderRadius: '22px',
          overflow: 'hidden',
          mb: 2.2,
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.08)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(2,6,23,0.10) 0%, rgba(2,6,23,0.40) 100%)',
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            opacity: 0.18,
          }}
        />

        <Box
          sx={{
            position: 'absolute',
            left: 16,
            top: 16,
            display: 'inline-flex',
            px: 1.1,
            py: 0.5,
            borderRadius: '999px',
            bgcolor: 'rgba(255,255,255,0.92)',
            color: '#0f172a',
            fontSize: '0.78rem',
            fontWeight: 800,
            boxShadow: '0 8px 20px rgba(15,23,42,0.10)',
          }}
        >
          {space.category}
        </Box>
      </Box>

      {/* metrics */}
      <MetricBar label="Noise" value={space.noiseDb} suffix=" dB" tone="blue" />

      <Typography sx={{ mb: 2.2, fontSize: '0.9rem', color: '#334155' }}>
        Active Zone
      </Typography>

      <MetricBar label="Comfort" value={space.comfort} suffix="/100" tone="purple" />
      <MetricBar label="Shade" value={space.shade} suffix="%" tone="blue" />

      {/* reason */}
      <Box
        sx={{
          p: 2,
          borderRadius: '18px',
          bgcolor: '#f8fafc',
          border: '1px solid #e9edf5',
          color: '#334155',
          fontSize: '0.95rem',
          lineHeight: 1.65,
          mb: 2,
        }}
      >
        {space.reason}
      </Box>

      {/* chips */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          mb: 2.2,
        }}
      >
        <Chip
          label={`Quiet time: ${space.quietTime}`}
          sx={{
            borderRadius: '999px',
            bgcolor: '#eeeeee',
            color: '#333',
            fontWeight: 500,
          }}
        />

        {(space as Space & { crowd?: string }).crowd && (
          <Chip
            label={`Crowd: ${(space as Space & { crowd?: string }).crowd}`}
            sx={{
              borderRadius: '999px',
              bgcolor: '#eeeeee',
              color: '#333',
              fontWeight: 500,
            }}
          />
        )}

        {(space as Space & { tag?: string }).tag && (
          <Chip
            label={(space as Space & { tag?: string }).tag as string}
            variant="outlined"
            sx={{
              borderRadius: '999px',
              color: '#1d9bf0',
              borderColor: '#64b5f6',
              bgcolor: '#fff',
            }}
          />
        )}

        <Chip
          label="relax"
          variant="outlined"
          sx={{
            borderRadius: '999px',
            color: '#1d9bf0',
            borderColor: '#64b5f6',
            bgcolor: '#fff',
          }}
        />
      </Box>

      {/* buttons */}
      <Box
        sx={{
          mt: 'auto',
          display: 'flex',
          gap: 1.2,
          flexWrap: 'wrap',
        }}
      >
        <Button
          component={Link}
          href="/discover"
          endIcon={<ArrowForwardRoundedIcon />}
          sx={{
            px: 2.4,
            py: 1.1,
            minWidth: 0,
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 800,
            fontSize: '1.05rem',
            color: '#5850ec',
            bgcolor: '#f1efff',
            '&:hover': {
              bgcolor: '#e6e3ff',
            },
          }}
        >
          View details
        </Button>

        <Button
  onClick={() => onAddToCompare?.(space)}
  disabled={isCompared}
  variant={isCompared ? 'contained' : 'outlined'}
  sx={{
    px: 2.4,
    py: 1.1,
    minWidth: 0,
    borderRadius: '999px',
    textTransform: 'none',
    fontWeight: 800,
    fontSize: '1.05rem',
    bgcolor: isCompared ? '#5850ec' : '#fff',
    color: isCompared ? '#fff' : '#5850ec',
    borderColor: '#8b82ff',
    boxShadow: isCompared ? '0 8px 18px rgba(88,80,236,0.28)' : 'none',
    '&:hover': {
      bgcolor: isCompared ? '#4e46df' : '#f6f5ff',
      borderColor: '#8b82ff',
    },
    '&.Mui-disabled': {
      color: '#fff',
      bgcolor: '#5850ec',
      opacity: 0.95,
    },
  }}
>
  {isCompared ? 'Added to compare' : 'Add to compare'}
</Button>
      </Box>
    </Paper>
  );
}