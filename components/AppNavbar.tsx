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
  { label: 'Help', href: '/help' },
];

export default function AppNavbar() {
  const pathname = usePathname();

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        top: 0,
        bgcolor: 'rgba(255,253,248,0.92)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid #E4D9C8',
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
              bgcolor: '#243C35',
              color: '#FFFDF8',
              boxShadow: '0 8px 20px rgba(36,60,53,0.18)',
              flexShrink: 0,
            }}
          >
            <ExploreIcon sx={{ fontSize: 18 }} />
          </Box>

          <Typography
            sx={{
              fontWeight: 900,
              letterSpacing: '-0.02em',
              color: '#243C35',
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
                  color: active ? '#243C35' : '#1f2f2a',
                  bgcolor: active ? '#E7EFE2' : 'transparent',
                  border: active
                    ? '1px solid #C9D8BF'
                    : '1px solid transparent',
                  boxShadow: active
                    ? '0 8px 18px rgba(36,60,53,0.08)'
                    : 'none',
                  '&:hover': {
                    bgcolor: active ? '#DCE8D4' : '#F3EBDD',
                    color: '#243C35',
                    borderColor: active ? '#B8CBAE' : '#E4D9C8',
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