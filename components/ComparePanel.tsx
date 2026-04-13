import { Grid, Paper, Typography, Box, Chip } from '@mui/material';
import { Space } from '../types/space';

interface ComparePanelProps {
  spaces: Space[];
}

export default function ComparePanel({ spaces }: ComparePanelProps) {
  if (spaces.length === 0) {
    return (
      <Paper
        elevation={0}
        sx={{
          p: 4,
          borderRadius: '32px',
          bgcolor: 'white',
          boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
        }}
      >
        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, mb: 1 }}>
          No spaces selected
        </Typography>
        <Typography color="text.secondary">
          Go back to Discover and click “Add to compare” on up to two places.
        </Typography>
      </Paper>
    );
  }

  return (
    <Grid container spacing={3}>
      {spaces.map((space) => (
        <Grid key={space.id} size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '32px',
              boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
              bgcolor: 'white',
              height: '100%',
            }}
          >
            <Typography sx={{ mb: 2.5, fontSize: '2rem', fontWeight: 900 }}>
              {space.name}
            </Typography>

            <Grid container spacing={2}>
              {[
                { label: 'Noise', value: `${space.noiseDb} dB` },
                { label: 'Comfort', value: `${space.comfort}/100` },
                { label: 'Shade', value: `${space.shade}%` },
                { label: 'Distance', value: `${space.distance} km` },
                {
                  label: 'Serenity',
                  value:
                    typeof space.serenityScore === 'number'
                      ? `${space.serenityScore}`
                      : 'N/A',
                },
              ].map((item) => (
                <Grid key={item.label} size={{ xs: 6 }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '18px',
                      bgcolor: '#f8fafc',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 900 }}>
                      {item.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Box sx={{ mt: 2 }}>
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
                  {space.activityExplanation ?? space.reason}
                </Typography>
              </Paper>

              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {space.activityFit.map((item) => (
                  <Chip key={item} label={item} variant="outlined" />
                ))}
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}