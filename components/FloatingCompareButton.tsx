'use client';

import * as React from 'react';
import { Box, Button, Typography } from '@mui/material';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import { useRouter } from 'next/navigation';

type FloatingCompareButtonProps = {
  count: number;
};

export default function FloatingCompareButton({ count }: FloatingCompareButtonProps) {
  const router = useRouter();

  if (count <= 0) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 18, md: 28 },
        bottom: { xs: 22, md: 28 },
        zIndex: 1200,
        display: 'flex',
        alignItems: 'center',
        gap: 1.1,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          left: -10,
          minWidth: 26,
          height: 26,
          px: 0.7,
          borderRadius: 999,
          bgcolor: '#D8845F',
          color: '#FFFDF8',
          border: '2px solid #FFFDF8',
          display: 'grid',
          placeItems: 'center',
          fontSize: '0.8rem',
          fontWeight: 900,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          boxShadow: '0 8px 18px rgba(36,60,53,0.16)',
        }}
      >
        {count}
      </Box>

      <Button
        onClick={() => router.push('/compare')}
        sx={{
          px: { xs: 2.2, md: 2.6 },
          py: { xs: 1.15, md: 1.25 },
          minHeight: 52,
          borderRadius: 999,
          bgcolor: '#243C35',
          color: '#FFFDF8',
          border: '1px solid rgba(255,253,248,0.32)',
          boxShadow: '0 18px 40px rgba(36,60,53,0.22)',
          textTransform: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          transition: 'all 0.25s ease',
          '&:hover': {
            bgcolor: '#4F6B57',
            transform: 'translateY(-2px)',
            boxShadow: '0 22px 46px rgba(36,60,53,0.26)',
          },
        }}
      >
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: 'rgba(255,253,248,0.14)',
            color: '#FFFDF8',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          <CompareArrowsRoundedIcon sx={{ fontSize: 18 }} />
        </Box>

        <Box sx={{ textAlign: 'left', lineHeight: 1 }}>
          <Typography
            sx={{
              fontSize: { xs: '0.95rem', md: '1rem' },
              fontWeight: 900,
              color: '#FFFDF8',
              lineHeight: 1.05,
            }}
          >
            Go to compare
          </Typography>

          <Typography
            sx={{
              mt: 0.25,
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: 'rgba(255,253,248,0.68)',
            }}
          >
            {count}/2 selected
          </Typography>
        </Box>
      </Button>
    </Box>
  );
}