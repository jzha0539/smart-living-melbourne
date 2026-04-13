'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AppBar, Box, Button, Toolbar, Typography } from '@mui/material';
import ExploreIcon from '@mui/icons-material/Explore';

const navItems = [
  { label: 'Home', href: '/' },
  { label: 'Discover', href: '/discover' },
  { label: 'Compare', href: '/compare' },
  { label: 'Trends', href: '/trends' },
  { label: 'Suggestions', href: '/suggestions' },
];

export default function AppNavbar() {
  const pathname = usePathname();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        bgcolor: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid rgba(226,232,240,0.9)',
      }}
    >
      <Toolbar
        sx={{
          minHeight: 76,
          display: 'flex',
          justifyContent: 'space-between',
          px: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
          <Box
            sx={{
              width: 34,
              height: 34,
              borderRadius: '999px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: 'white',
              boxShadow: '0 8px 20px rgba(79,70,229,0.25)',
              flexShrink: 0,
            }}
          >
            <ExploreIcon sx={{ fontSize: 18 }} />
          </Box>

          <Typography
            sx={{
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#111827',
              fontSize: { xs: '1rem', md: '1.1rem' },
            }}
          >
            Smart Living Melbourne
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);

            return (
              <Button
                key={item.href}
                component={Link}
                href={item.href}
                sx={{
                  borderRadius: '999px',
                  px: 2.2,
                  py: 0.9,
                  textTransform: 'none',
                  fontWeight: 800,
                  minWidth: 'unset',
                  color: active ? 'primary.main' : '#111827',
                  bgcolor: active ? 'rgba(79,70,229,0.12)' : 'transparent',
                  '&:hover': {
                    bgcolor: active
                      ? 'rgba(79,70,229,0.16)'
                      : 'rgba(15,23,42,0.05)',
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}