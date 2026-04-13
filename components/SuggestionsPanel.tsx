import { Grid, Paper, Typography } from '@mui/material';
import { ActivityType, Space } from '../types/space';

interface SuggestionsPanelProps {
  spaces: Space[];
  activity: ActivityType;
}

export default function SuggestionsPanel({
  spaces,
  activity,
}: SuggestionsPanelProps) {
  return (
    <Grid container spacing={3}>
      {spaces.slice(0, 3).map((space, index) => (
        <Grid key={space.id} size={{ xs: 12, md: 6, xl: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '32px',
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
              height: '100%',
              bgcolor: 'white',
            }}
          >
            <Typography
              sx={{
                color: 'text.secondary',
                textTransform: 'uppercase',
                fontSize: '0.9rem',
                mb: 1.5,
              }}
            >
              Top {index + 1}
            </Typography>

            <Typography sx={{ fontSize: '2rem', fontWeight: 900, mb: 0.8 }}>
              {space.name}
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Best for {activity}
            </Typography>

            <Paper
              elevation={0}
              sx={{
                p: 2,
                borderRadius: '18px',
                bgcolor: '#f8fafc',
                mb: 2,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                {space.reason}
              </Typography>
            </Paper>

            <Typography variant="body2" sx={{ mb: 0.8 }}>
              Noise: {space.noiseDb} dB
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.8 }}>
              Comfort: {space.comfort}/100
            </Typography>
            <Typography variant="body2" sx={{ mb: 0.8 }}>
              Shade: {space.shade}%
            </Typography>
            <Typography variant="body2">
              Quiet time: {space.quietTime}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}