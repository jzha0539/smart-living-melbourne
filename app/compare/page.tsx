'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import PlayArrowRoundedIcon from '@mui/icons-material/PlayArrowRounded';
import AppNavbar from '../../components/AppNavbar';
import { Space } from '../../types/space';

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function getNoiseValue(space: Space) {
  return toNumber(space.noiseDb) ?? 55;
}

function getComfortValue(space: Space) {
  return toNumber(space.comfort) ?? 70;
}

function getShadeValue(space: Space) {
  const directShade = toNumber(space.shade);

  if (directShade !== null) {
    return Math.round(Math.max(0, Math.min(100, directShade)));
  }

  const category = String(space.category ?? '').toLowerCase();
  const name = String(space.name ?? '').toLowerCase();
  const comfort = getComfortValue(space);

  if (
    category.includes('park') ||
    category.includes('garden') ||
    category.includes('leisure') ||
    category.includes('reserve') ||
    category.includes('trail') ||
    category.includes('river') ||
    name.includes('park') ||
    name.includes('garden') ||
    name.includes('reserve') ||
    name.includes('trail') ||
    name.includes('river')
  ) {
    return Math.round(Math.min(100, comfort + 12));
  }

  if (
    category.includes('library') ||
    category.includes('book') ||
    category.includes('indoor') ||
    name.includes('library') ||
    name.includes('book')
  ) {
    return Math.round(Math.min(100, comfort + 4));
  }

  return Math.round(Math.max(0, Math.min(100, comfort)));
}

function getPredictedBestTime(
  space: Space,
  activity: 'study' | 'remote work' | 'relax' = 'study'
) {
  const noiseDb = getNoiseValue(space);
  const comfort = getComfortValue(space);
  const shade = getShadeValue(space);

  if (activity === 'study') {
    if (noiseDb <= 50) return '9:00 AM - 11:00 AM';
    if (noiseDb <= 60) return '8:00 AM - 10:00 AM';
    if (noiseDb <= 70) return '7:00 AM - 9:00 AM';
    return 'Before 8:00 AM';
  }

  if (activity === 'remote work') {
    if (comfort >= 80) return '10:00 AM - 1:00 PM';
    if (comfort >= 65) return '9:00 AM - 12:00 PM';
    if (comfort >= 50) return '8:00 AM - 10:00 AM';
    return 'Before 9:00 AM';
  }

  if (shade >= 70) return 'After 4:00 PM';
  if (shade >= 50) return '3:00 PM - 5:00 PM';
  return 'Before 10:00 AM or after 5:00 PM';
}

function getCrowdLabel(space: Space) {
  const noise = getNoiseValue(space);

  if (noise <= 45) return 'Low';
  if (noise <= 60) return 'Medium';
  return 'High';
}

function getSerenityScore(space: Space) {
  const noise = getNoiseValue(space);
  const comfort = getComfortValue(space);
  const shade = getShadeValue(space);

  const noiseScore = Math.max(0, Math.min(100, 100 - noise));
  const comfortScore = Math.max(0, Math.min(100, comfort));
  const shadeScore = Math.max(0, Math.min(100, shade));

  return Math.round(
    noiseScore * 0.4 +
      comfortScore * 0.4 +
      shadeScore * 0.2
  );
}

function getWinner(
  label: string,
  left: Space,
  right: Space
): 'left' | 'right' | 'tie' {
  if (label === 'Noise') {
    const leftNoise = getNoiseValue(left);
    const rightNoise = getNoiseValue(right);

    if (leftNoise < rightNoise) return 'left';
    if (rightNoise < leftNoise) return 'right';
    return 'tie';
  }

  if (label === 'Comfort') {
    const leftComfort = getComfortValue(left);
    const rightComfort = getComfortValue(right);

    if (leftComfort > rightComfort) return 'left';
    if (rightComfort > leftComfort) return 'right';
    return 'tie';
  }

  if (label === 'Shade') {
    const leftShade = getShadeValue(left);
    const rightShade = getShadeValue(right);

    if (leftShade > rightShade) return 'left';
    if (rightShade > leftShade) return 'right';
    return 'tie';
  }

  if (label === 'Serenity score') {
    const leftScore = getSerenityScore(left);
    const rightScore = getSerenityScore(right);

    if (leftScore > rightScore) return 'left';
    if (rightScore > leftScore) return 'right';
    return 'tie';
  }

  return 'tie';
}

function formatName(name: string) {
  return name.toUpperCase();
}

function CompareValue({
  value,
  isWinner,
}: {
  value: string | number;
  isWinner?: boolean;
}) {
  return (
    <Typography
      sx={{
        fontFamily: '"Courier New", monospace',
        fontSize: { xs: '1rem', sm: '1.25rem' },
        fontWeight: 800,
        lineHeight: 1.35,
        color: isWinner ? '#4f624b' : '#53635f',
        wordBreak: 'break-word',
      }}
    >
      {isWinner ? '✓ ' : ''}
      {value}
    </Typography>
  );
}

function CompareRow({
  label,
  leftValue,
  rightValue,
  winner,
}: {
  label: string;
  leftValue: string | number;
  rightValue: string | number;
  winner?: 'left' | 'right' | 'tie';
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: '170px minmax(0, 1fr) minmax(0, 1fr)',
        },
        borderTop: '1px solid #d8ccb7',
        minHeight: { xs: 'auto', sm: 78 },
      }}
    >
      <Box
        sx={{
          px: { xs: 2.2, sm: 3 },
          py: { xs: 1.8, sm: 2.6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
textAlign: 'center',
        }}
      >
        <Typography
          sx={{
            fontFamily: 'Georgia, serif',
            fontSize: { xs: '1.05rem', sm: '1.18rem' },
            fontWeight: 900,
            color: '#2f3d39',
          }}
        >
          {label}
        </Typography>
      </Box>

      <Box
        sx={{
          px: { xs: 2.2, sm: 3 },
          py: { xs: 0.2, sm: 2.6 },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
textAlign: 'center',
        }}
      >
        <CompareValue value={leftValue} isWinner={winner === 'left'} />
      </Box>

      <Box
        sx={{
          px: { xs: 2.2, sm: 3 },
          pt: { xs: 0.8, sm: 2.6 },
          pb: { xs: 2.2, sm: 2.6 },
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <CompareValue value={rightValue} isWinner={winner === 'right'} />
      </Box>
    </Box>
  );
}

export default function ComparePage() {
  const router = useRouter();
  const [spaces, setSpaces] = React.useState<Space[]>([]);

  React.useEffect(() => {
    const stored = localStorage.getItem('compare-spaces');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Space[];
      setSpaces(parsed.slice(0, 2));
    } catch {
      localStorage.removeItem('compare-spaces');
    }
  }, []);

  function clearCompare() {
    localStorage.removeItem('compare-spaces');
    setSpaces([]);
  }

  function handleStartNavigation(space: Space) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedSpaceName', space.name);
      localStorage.setItem('selectedRouteSpace', space.name);
      localStorage.setItem('routeDestination', space.name);
      localStorage.setItem('selectedDestinationName', space.name);

      localStorage.setItem(
        'selectedRouteSpaceData',
        JSON.stringify({
          id: space.id,
          name: space.name,
          suburb: space.suburb,
          category: space.category,
          latitude: space.latitude,
          longitude: space.longitude,
        })
      );
    }

    router.push(`/route?space=${encodeURIComponent(space.name)}`);
  }

  const left = spaces[0];
  const right = spaces[1];

  const hasTwoSpaces = Boolean(left && right);

  const leftSerenity = left ? getSerenityScore(left) : 0;
  const rightSerenity = right ? getSerenityScore(right) : 0;

  let finalMessage = '';

  if (left && right) {
    if (leftSerenity > rightSerenity) {
      finalMessage = `${left.name} is the stronger choice today for a calmer visit.`;
    } else if (rightSerenity > leftSerenity) {
      finalMessage = `${right.name} is the stronger choice today for a calmer visit.`;
    } else {
      finalMessage = `${left.name} and ${right.name} score evenly today — pick by mood.`;
    }
  }

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#eee9df',
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontFamily: 'Georgia, serif',
                  fontSize: { xs: '2rem', md: '2.4rem' },
                  fontWeight: 900,
                  color: '#2f3d39',
                  lineHeight: 1,
                }}
              >
                A vs B
              </Typography>

              <Typography
                sx={{
                  mt: 1,
                  fontFamily: '"Courier New", monospace',
                  color: '#68736e',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                }}
              >
                Compare your selected spaces side by side.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.2, flexWrap: 'wrap' }}>
              {left && (
                <Button
                  onClick={() => handleStartNavigation(left)}
                  variant="contained"
                  startIcon={<PlayArrowRoundedIcon />}
                  sx={{
                    borderRadius: '999px',
                    px: 2.2,
                    py: 1,
                    textTransform: 'none',
                    fontWeight: 900,
                    bgcolor: '#536b4e',
                    color: '#fffaf2',
                    boxShadow: 'none',
                    '&:hover': {
                      bgcolor: '#435a3f',
                      boxShadow: 'none',
                    },
                  }}
                >
                  Start navigation
                </Button>
              )}

              <Button
                onClick={clearCompare}
                variant="outlined"
                startIcon={<DeleteOutlineRoundedIcon />}
                sx={{
                  borderRadius: '999px',
                  px: 2.2,
                  py: 1,
                  textTransform: 'none',
                  fontWeight: 900,
                  color: '#536b4e',
                  borderColor: '#b9c3ad',
                  bgcolor: 'rgba(255, 250, 242, 0.5)',
                  '&:hover': {
                    borderColor: '#536b4e',
                    bgcolor: 'rgba(255, 250, 242, 0.85)',
                  },
                }}
              >
                Clear
              </Button>
            </Box>
          </Box>

          {!hasTwoSpaces ? (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 5 },
                borderRadius: '24px',
                border: '1px solid #d8ccb7',
                bgcolor: '#f8f3ea',
                boxShadow: '0 18px 35px rgba(73, 62, 42, 0.12)',
              }}
            >
              <Typography
                sx={{
                  fontFamily: 'Georgia, serif',
                  fontSize: { xs: '1.8rem', md: '2.2rem' },
                  fontWeight: 900,
                  color: '#2f3d39',
                }}
              >
                No spaces selected
              </Typography>

              <Typography
                sx={{
                  mt: 1.5,
                  fontFamily: '"Courier New", monospace',
                  color: '#53635f',
                  fontWeight: 700,
                  lineHeight: 1.7,
                }}
              >
                Go back to Discover and add two places to compare.
              </Typography>
            </Paper>
          ) : (
            <Paper
              elevation={0}
              sx={{
                overflow: 'hidden',
                borderRadius: '24px',
                border: '1px solid #d8ccb7',
                bgcolor: '#f8f3ea',
                boxShadow: '0 18px 35px rgba(73, 62, 42, 0.14)',
              }}
            >
              <Box
  sx={{
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: '170px minmax(0, 1fr) minmax(0, 1fr)',
    },
    minHeight: { xs: 'auto', sm: 124 },
    borderBottom: '1px solid #D8CBB8',
    alignItems: 'center',
  }}
>
  <Box sx={{ display: { xs: 'none', sm: 'block' } }} />

  <Typography
    sx={{
      px: 2,
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: '"Courier New", monospace',
      fontSize: { xs: '1rem', sm: '1.05rem' },
      fontWeight: 900,
      letterSpacing: '0.18em',
      lineHeight: 1.55,
      color: '#c46f4f',
      textAlign: 'center',
      justifySelf: 'center',
      alignSelf: 'center',
    }}
  >
    A · {formatName(left.name)}
  </Typography>

  <Typography
    sx={{
      px: 2,
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: '"Courier New", monospace',
      fontSize: { xs: '1rem', sm: '1.05rem' },
      fontWeight: 900,
      letterSpacing: '0.18em',
      lineHeight: 1.55,
      color: '#c46f4f',
      textAlign: 'center',
      justifySelf: 'center',
      alignSelf: 'center',
    }}
  >
    B · {formatName(right.name)}
  </Typography>
</Box>

              <CompareRow
                label="Suburb"
                leftValue={left.suburb || 'Unknown'}
                rightValue={right.suburb || 'Unknown'}
              />

              <CompareRow
                label="Category"
                leftValue={left.category || 'Unknown'}
                rightValue={right.category || 'Unknown'}
              />

              <CompareRow
                label="Noise"
                leftValue={`${getNoiseValue(left)} dB`}
                rightValue={`${getNoiseValue(right)} dB`}
                winner={getWinner('Noise', left, right)}
              />

              <CompareRow
                label="Comfort"
                leftValue={`${getComfortValue(left)}/100`}
                rightValue={`${getComfortValue(right)}/100`}
                winner={getWinner('Comfort', left, right)}
              />

              <CompareRow
                label="Shade"
                leftValue={`${getShadeValue(left)}/100`}
                rightValue={`${getShadeValue(right)}/100`}
                winner={getWinner('Shade', left, right)}
              />

              <CompareRow
                label="Crowd"
                leftValue={getCrowdLabel(left)}
                rightValue={getCrowdLabel(right)}
              />

              <CompareRow
                label="Quiet window"
                leftValue={left.quietTime || getPredictedBestTime(left, 'study')}
                rightValue={right.quietTime || getPredictedBestTime(right, 'study')}
              />

              <CompareRow
                label="Serenity score"
                leftValue={leftSerenity}
                rightValue={rightSerenity}
                winner={getWinner('Serenity score', left, right)}
              />

              <Box
                sx={{
                  borderTop: '1px solid #d8ccb7',
                  p: { xs: 2.2, sm: 3.5 },
                }}
              >
                <Box
                  sx={{
                    borderRadius: '18px',
                    border: '1px solid #b9c8ae',
                    bgcolor: '#dde6d5',
                    px: { xs: 2.2, sm: 3.5 },
                    py: { xs: 2.2, sm: 2.8 },
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Georgia, serif',
                      fontSize: { xs: '1.15rem', sm: '1.35rem' },
                      fontWeight: 700,
                      fontStyle: 'italic',
                      color: '#526d4f',
                      lineHeight: 1.55,
                    }}
                  >
                    {finalMessage}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          )}
        </Container>
      </Box>
    </>
  );
}