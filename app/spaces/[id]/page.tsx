import Link from 'next/link';
import {
  Box,
  Button,
  Chip,
  Container,
  Grid,
  Paper,
  Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getSpaceDetailFromRealSources } from '../../../lib/server/external/spaces';

export default async function SpaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numericId = Number.parseInt(id, 10);

  if (!Number.isFinite(numericId)) {
    throw new Error('Invalid space id');
  }

  const space = await getSpaceDetailFromRealSources(numericId);

  if (!space) {
    throw new Error('Space not found');
  }

  return (
    <Box sx={{ minHeight: '100vh', background: '#f8fafc', py: 5 }}>
      <Container maxWidth="lg">
        <Button
          component={Link}
          href="/discover"
          startIcon={<ArrowBackIcon />}
          sx={{
            mb: 3,
            borderRadius: '999px',
            textTransform: 'none',
            fontWeight: 700,
          }}
        >
          Back to discover
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: '32px',
            bgcolor: 'white',
            boxShadow: '0 12px 40px rgba(15,23,42,0.08)',
          }}
        >
          <Typography sx={{ fontSize: { xs: '2.2rem', md: '3.2rem' }, fontWeight: 900, mb: 1 }}>
            {space.name}
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3 }}>
            {space.category} · {space.suburb}
          </Typography>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
            <Chip label={`Noise: ${space.noiseDb} dB`} />
            <Chip label={`Comfort: ${space.comfort}/100`} />
            <Chip label={`Shade: ${space.shade}%`} />
            <Chip label={`Distance: ${space.distance} km`} />
            {typeof space.serenityScore === 'number' ? (
              <Chip label={`Serenity: ${space.serenityScore}`} color="secondary" />
            ) : null}
          </Box>

          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  bgcolor: '#f8fafc',
                  mb: 3,
                }}
              >
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, mb: 1.2 }}>
                  Why this place is suitable
                </Typography>
                <Typography color="text.secondary">
                  {space.activityExplanation ?? space.reason}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  bgcolor: '#f8fafc',
                }}
              >
                <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, mb: 1.2 }}>
                  Environmental note
                </Typography>
                <Typography color="text.secondary">
                  {space.weatherAdvice ??
                    'Conditions are currently based on stored location data and available environmental signals.'}
                </Typography>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  bgcolor: '#f8fafc',
                  mb: 3,
                }}
              >
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, mb: 1.2 }}>
                  Visit timing
                </Typography>
                <Typography sx={{ mb: 1 }}>
                  <strong>Quiet time:</strong> {space.quietTime}
                </Typography>
                <Typography>
                  <strong>Crowd:</strong> {space.crowd}
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '24px',
                  bgcolor: '#f8fafc',
                }}
              >
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, mb: 1.2 }}>
                  Best activities
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                  {space.activityFit.map((item) => (
                    <Chip key={item} label={item} variant="outlined" />
                  ))}
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}