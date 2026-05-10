'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  Typography,
} from '@mui/material';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';

export default function NotFoundPage() {
  function handleBackToStart() {
    sessionStorage.removeItem('hasSeenIntro');
    localStorage.removeItem('hasSeenIntro');
    window.location.href = '/';
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100%',
        bgcolor: '#eee9df',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 3,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          bgcolor: 'rgba(188, 211, 174, 0.28)',
          filter: 'blur(90px)',
          top: -180,
          left: -120,
        },
        '&::after': {
          content: '""',
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          bgcolor: 'rgba(214, 166, 135, 0.2)',
          filter: 'blur(100px)',
          right: -180,
          bottom: -200,
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: 620,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 58,
            height: 58,
            borderRadius: '50%',
            mx: 'auto',
            mb: 3,
            bgcolor: '#dce8d2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#536b4e',
            border: '1px solid rgba(83, 107, 78, 0.18)',
          }}
        >
          <ExploreOutlinedIcon sx={{ fontSize: 27 }} />
        </Box>

        <Typography
          sx={{
            fontFamily: '"Courier New", monospace',
            fontSize: '0.78rem',
            fontWeight: 900,
            letterSpacing: '0.35em',
            color: '#7f8c88',
            mb: 1.5,
          }}
        >
          LOST IN THE CITY
        </Typography>

        <Typography
          component="h1"
          sx={{
            fontFamily: 'Georgia, serif',
            fontSize: {
              xs: '2.3rem',
              sm: '3.1rem',
              md: '3.6rem',
            },
            fontWeight: 900,
            lineHeight: 1.05,
            color: '#2f3d39',
            mb: 2,
          }}
        >
          We couldn't find{' '}
          <Box
            component="span"
            sx={{
              color: '#536b4e',
              fontStyle: 'italic',
            }}
          >
            that page.
          </Box>
        </Typography>

        <Typography
          sx={{
            maxWidth: 500,
            mx: 'auto',
            fontSize: {
              xs: '0.95rem',
              sm: '1rem',
            },
            lineHeight: 1.65,
            color: '#66736f',
            mb: 4,
          }}
        >
          The link may have moved, or the address might be slightly off.
          The quiet places are still here — let’s point you back.
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            gap: 1.5,
            flexWrap: 'wrap',
          }}
        >
          <Button
            component={Link}
            href="/discover"
            startIcon={<ExploreOutlinedIcon />}
            sx={{
              minWidth: 170,
              height: 54,
              borderRadius: '14px',
              px: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 800,
              bgcolor: '#243c36',
              color: '#fffaf2',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: '#1d312c',
                boxShadow: 'none',
              },
            }}
          >
            Open Discover
          </Button>

          <Button
            onClick={handleBackToStart}
            startIcon={<HomeOutlinedIcon />}
            sx={{
              minWidth: 170,
              height: 54,
              borderRadius: '14px',
              px: 3,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 800,
              bgcolor: 'rgba(255, 250, 242, 0.4)',
              color: '#2f3d39',
              border: '1px solid #d8ccb7',
              boxShadow: 'none',
              '&:hover': {
                bgcolor: 'rgba(255, 250, 242, 0.75)',
                borderColor: '#c8bda8',
                boxShadow: 'none',
              },
            }}
          >
            Back to start
          </Button>
        </Box>
      </Box>
    </Box>
  );
}