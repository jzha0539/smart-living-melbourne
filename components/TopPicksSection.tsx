import { Box, Grid, Paper, Typography } from '@mui/material';
import { Space } from '../types/space';
import SpaceCard from './SpaceCard';

interface TopPicksSectionProps {
  spaces: Space[];
}

export default function TopPicksSection({ spaces }: TopPicksSectionProps) {
  const topPicks = spaces.slice(0, 3);

  return (
    <Paper
      elevation={0}
      sx={{
        mt: 5,
        p: { xs: 3, md: 4 },
        borderRadius: '32px',
        bgcolor: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 16px 50px rgba(15, 23, 42, 0.06)',
        border: '1px solid rgba(255,255,255,0.72)',
      }}
    >
      <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, mb: 1 }}>
        Top picks for you
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Smart recommendations based on your activity, comfort, and quietness preferences.
      </Typography>

      <Grid container spacing={3}>
        {topPicks.map((space, index) => (
          <Grid key={space.id} size={{ xs: 12, md: 6, xl: 4 }}>
            <SpaceCard space={space} rank={index + 1} highlight />
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}