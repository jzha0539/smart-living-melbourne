import { Box, Button, Chip, Grid, Paper, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import BoltIcon from '@mui/icons-material/Bolt';
import StatsOverview from './StatsOverview';
import { Space } from '../types/space';
import Link from 'next/link';

interface HeroSectionProps {
  spaces: Space[];
  topSuggestion?: Space;
}

export default function HeroSection({
  spaces,
  topSuggestion,
}: HeroSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        px: { xs: 3, md: 5 },
        py: { xs: 4, md: 5 },
        borderRadius: '32px',
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.94) 0%, rgba(255,255,255,0.86) 100%)',
        backdropFilter: 'blur(14px)',
        boxShadow: '0 24px 80px rgba(15, 23, 42, 0.08)',
        border: '1px solid rgba(255,255,255,0.75)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: '50%',
          background: 'rgba(79,70,229,0.08)',
          top: -90,
          right: -20,
          filter: 'blur(12px)',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'rgba(14,165,233,0.10)',
          bottom: -60,
          left: 100,
          filter: 'blur(12px)',
        }}
      />

      <Grid
        container
        spacing={{ xs: 3, md: 4 }}
        sx={{
          position: 'relative',
          zIndex: 2,
          alignItems: 'center',
        }}
      >
        <Grid size={{ xs: 12, lg: 7 }}>
          <Box
            sx={{
              display: 'flex',
              gap: 1,
              flexWrap: 'wrap',
              mb: 2.5,
            }}
          >
            <Chip
              label="Smart Living Melbourne"
              color="primary"
              sx={{ borderRadius: '999px' }}
            />
            <Chip
              label="Next.js + TypeScript + MUI"
              variant="outlined"
              sx={{ borderRadius: '999px' }}
            />
          </Box>

          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              lineHeight: 1.02,
              letterSpacing: '-0.04em',
              fontSize: { xs: '2.5rem', md: '4.2rem' },
              maxWidth: 760,
              mb: 2,
            }}
          >
            Find your ideal spot in Melbourne
          </Typography>

          <Typography
            sx={{
              fontSize: { xs: '1rem', md: '1.14rem' },
              color: 'text.secondary',
              maxWidth: 680,
              lineHeight: 1.65,
              mb: 3.5,
            }}
          >
            Discover quiet, shaded, and comfortable places for study, remote work,
            and everyday reset—without wasting time guessing where to go.
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              mb: 4,
            }}
          >
            <Button
  component={Link}
  href="/discover"
  variant="contained"
  size="large"
  startIcon={<LocationOnIcon />}
  sx={{
    borderRadius: '999px',
    px: 3.2,
    py: 1.35,
    textTransform: 'none',
    fontWeight: 700,
    boxShadow: '0 10px 24px rgba(79,70,229,0.28)',
  }}
>
  Explore spaces
</Button>

<Button
  component={Link}
  href="/suggestions"
  variant="outlined"
  size="large"
  startIcon={<BoltIcon />}
  sx={{
    borderRadius: '999px',
    px: 3.2,
    py: 1.35,
    textTransform: 'none',
    fontWeight: 700,
    bgcolor: 'rgba(255,255,255,0.74)',
    borderColor: 'rgba(79,70,229,0.30)',
  }}
>
  See top suggestions
</Button>
          </Box>

          <StatsOverview spaces={spaces} />
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              borderRadius: '28px',
              bgcolor: 'rgba(255,255,255,0.82)',
              border: '1px solid #e7ecf3',
              boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 2.5,
              }}
            >
              <AutoAwesomeIcon color="primary" />
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                Best match right now
              </Typography>
            </Box>

            {topSuggestion ? (
              <>
                <Typography
                  sx={{
                    fontSize: { xs: '2rem', md: '2.25rem' },
                    fontWeight: 900,
                    lineHeight: 1.1,
                    mb: 0.8,
                  }}
                >
                  {topSuggestion.name}
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  {topSuggestion.category} · {topSuggestion.suburb}
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 2,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: '18px',
                      bgcolor: '#f7f9fc',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
                      Noise
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {topSuggestion.noiseDb} dB
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: '18px',
                      bgcolor: '#f7f9fc',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
                      Comfort
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {topSuggestion.comfort}/100
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: '18px',
                      bgcolor: '#f7f9fc',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
                      Best quiet time
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {topSuggestion.quietTime}
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: '18px',
                      bgcolor: '#f7f9fc',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.6 }}>
                      Distance
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 800 }}>
                      {topSuggestion.distance} km
                    </Typography>
                  </Paper>
                </Box>

                <Paper
                  elevation={0}
                  sx={{
                    mt: 2.5,
                    p: 2,
                    borderRadius: '18px',
                    background: 'linear-gradient(135deg, #eef2ff, #f8fafc)',
                  }}
                >
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                    {topSuggestion.reason}
                  </Typography>
                </Paper>
              </>
            ) : (
              <Typography color="text.secondary">No recommendation available.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Paper>
  );
}