import { Grid, Paper, Typography, Box } from '@mui/material';
import { Space } from '../types/space';

interface ComparePanelProps {
  spaces: Space[];
}

export default function ComparePanel({ spaces }: ComparePanelProps) {
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
                    <Typography sx={{ fontSize: '1.8rem', fontWeight: 900 }}>
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
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  {space.reason}
                </Typography>
              </Paper>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}