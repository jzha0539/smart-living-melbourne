import { Box, Paper, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

export default function TrendsPanel() {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: '32px',
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
        bgcolor: 'white',
      }}
    >
      <Typography sx={{ mb: 2, fontSize: '2rem', fontWeight: 900 }}>
        Historical Quiet-Time Trend
      </Typography>

      <Paper
        elevation={0}
        sx={{
          minHeight: 300,
          borderRadius: '32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: '#f8fafc',
          textAlign: 'center',
          p: 3,
        }}
      >
        <Box>
          <AccessTimeIcon sx={{ fontSize: 40, mb: 1 }} />
          <Typography sx={{ mb: 1, fontSize: '1.5rem', fontWeight: 800 }}>
            Trend chart placeholder
          </Typography>
          <Typography color="text.secondary">
            Later you can replace this with Recharts or MUI X Charts.
          </Typography>
        </Box>
      </Paper>
    </Paper>
  );
}