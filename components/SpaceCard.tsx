import {
  Box,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Typography,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PlaceIcon from '@mui/icons-material/Place';
import { Space } from '../types/space';
import { getNoiseLabel } from '../utils/spaceHelpers';

interface SpaceCardProps {
  space: Space;
  rank?: number;
  highlight?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export default function SpaceCard({
  space,
  rank,
  highlight = false,
  selected = false,
  onClick,
}: SpaceCardProps) {
  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: '24px',
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        background: highlight
          ? 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)'
          : '#ffffff',
        boxShadow: selected
          ? '0 0 0 4px rgba(79,70,229,0.14), 0 18px 44px rgba(15, 23, 42, 0.10)'
          : highlight
            ? '0 20px 60px rgba(79, 70, 229, 0.10)'
            : '0 12px 36px rgba(15, 23, 42, 0.06)',
        border: selected
          ? '1px solid rgba(79,70,229,0.30)'
          : highlight
            ? '1px solid rgba(79,70,229,0.12)'
            : '1px solid #eef2f7',
        transition: 'all 0.25s ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: selected
            ? '0 0 0 4px rgba(79,70,229,0.16), 0 22px 52px rgba(15, 23, 42, 0.12)'
            : '0 18px 44px rgba(15, 23, 42, 0.10)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1.5,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                {rank ? (
                  <Chip
                    size="small"
                    icon={<AutoAwesomeIcon />}
                    label={`Top ${rank}`}
                    color="primary"
                  />
                ) : null}
                <Chip size="small" label={space.category} variant="outlined" />
              </Box>

              <Typography
                sx={{
                  fontSize: { xs: '1.6rem', md: '1.9rem' },
                  fontWeight: 900,
                  lineHeight: 1.1,
                }}
              >
                {space.name}
              </Typography>

              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {space.suburb}
              </Typography>
            </Box>

            <Chip
              icon={<PlaceIcon />}
              label={`${space.distance} km`}
              variant="outlined"
              sx={{ alignSelf: 'flex-start' }}
            />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Noise
              </Typography>
              <Typography variant="body2">{space.noiseDb} dB</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.max(0, 100 - space.noiseDb)}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: '#e9e8ff',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                },
              }}
            />
            <Typography variant="caption" color="text.secondary">
              {getNoiseLabel(space.noiseDb)}
            </Typography>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Comfort
              </Typography>
              <Typography variant="body2">{space.comfort}/100</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={space.comfort}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: '#e9e8ff',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                },
              }}
            />
          </Box>

          <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Shade
              </Typography>
              <Typography variant="body2">{space.shade}%</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={space.shade}
              sx={{
                height: 8,
                borderRadius: 999,
                bgcolor: '#e9e8ff',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 999,
                },
              }}
            />
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '16px',
              bgcolor: '#f8fafc',
              border: '1px solid #eef2f7',
            }}
          >
            <Typography variant="body2" color="text.secondary">
              {space.reason}
            </Typography>
          </Paper>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip size="small" label={`Quiet time: ${space.quietTime}`} />
            <Chip size="small" label={`Crowd: ${space.crowd}`} />
            <Chip
              size="small"
              label={space.activityFit[0]}
              color="secondary"
              variant="outlined"
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}