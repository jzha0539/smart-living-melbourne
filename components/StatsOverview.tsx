import { Avatar, Box, Grid, Paper, Typography } from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import ParkIcon from '@mui/icons-material/Park';
import PlaceIcon from '@mui/icons-material/Place';
import { Space } from '../types/space';

interface StatsOverviewProps {
  spaces: Space[];
}

export default function StatsOverview({ spaces }: StatsOverviewProps) {
  const stats = [
    {
      label: 'Quiet spaces',
      value: String(spaces.filter((s) => s.noiseDb <= 40).length),
      icon: <VolumeUpIcon />,
    },
    {
      label: 'Average comfort',
      value: '82/100',
      icon: <WbSunnyIcon />,
    },
    {
      label: 'High shade spots',
      value: String(spaces.filter((s) => s.shade >= 80).length),
      icon: <ParkIcon />,
    },
    {
      label: 'Nearby choices',
      value: String(spaces.filter((s) => s.distance <= 1.5).length),
      icon: <PlaceIcon />,
    },
  ];

  return (
    <Grid container spacing={2}>
      {stats.map((item) => (
        <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 5,
              bgcolor: 'rgba(255,255,255,0.78)',
              border: '1px solid #e2e8f0',
              boxShadow: '0 8px 24px rgba(15, 23, 42, 0.04)',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <Avatar sx={{ bgcolor: 'secondary.main' }}>{item.icon}</Avatar>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  {item.value}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}