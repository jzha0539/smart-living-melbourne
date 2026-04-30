'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Badge, Box, Button } from '@mui/material';
import CompareArrowsRoundedIcon from '@mui/icons-material/CompareArrowsRounded';
import { alpha, keyframes } from '@mui/material/styles';

const slowGlow = keyframes`
  0% {
    box-shadow: 0 10px 24px rgba(88,80,236,0.20);
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    box-shadow: 0 14px 34px rgba(88,80,236,0.38);
    transform: translateY(-2px);
    opacity: 0.82;
  }
  100% {
    box-shadow: 0 10px 24px rgba(88,80,236,0.20);
    transform: translateY(0);
    opacity: 1;
  }
`;

interface FloatingCompareButtonProps {
  count: number;
  max?: number;
}

export default function FloatingCompareButton({
  count,
  max = 2,
}: FloatingCompareButtonProps) {
  const router = useRouter();
  const pathname = usePathname();

  const isReady = count >= max;
  const isComparePage = pathname === '/compare';

  function handleClick() {
    if (!isReady) return;

    if (isComparePage) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    router.push('/compare');
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        right: { xs: 16, md: 24 },
        bottom: { xs: 18, md: 24 },
        zIndex: 1600,
      }}
    >
      <Badge
        badgeContent={count}
        color="primary"
        overlap="circular"
        anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
        sx={{
          '& .MuiBadge-badge': {
            minWidth: 24,
            height: 24,
            borderRadius: '999px',
            fontWeight: 900,
            fontSize: '0.78rem',
            border: '2px solid #fff',
            bgcolor: '#5b52f0',
            color: '#fff',
          },
        }}
      >
        <Button
          onClick={handleClick}
          startIcon={<CompareArrowsRoundedIcon />}
          variant="contained"
          sx={{
            minWidth: { xs: 156, md: 172 },
            height: 56,
            px: 2.4,
            borderRadius: '999px',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: 900,
            color: '#fff',
            bgcolor: isReady ? '#5b52f0' : alpha('#5b52f0', 0.45),
            boxShadow: isReady
              ? '0 10px 24px rgba(88,80,236,0.20)'
              : '0 8px 18px rgba(88,80,236,0.10)',
            backdropFilter: 'blur(10px)',
            animation: isReady ? `${slowGlow} 2.6s ease-in-out infinite` : 'none',
            opacity: isReady ? 1 : 0.5,
            pointerEvents: 'auto',
            '&:hover': {
              bgcolor: isReady ? '#4e46df' : alpha('#5b52f0', 0.45),
              boxShadow: isReady
                ? '0 14px 32px rgba(88,80,236,0.28)'
                : '0 8px 18px rgba(88,80,236,0.10)',
            },
            '&.Mui-disabled': {
              bgcolor: alpha('#5b52f0', 0.45),
              color: '#fff',
            },
          }}
        >
          {isComparePage ? 'Compare ready' : 'Go to compare'}
        </Button>
      </Badge>
    </Box>
  );
}