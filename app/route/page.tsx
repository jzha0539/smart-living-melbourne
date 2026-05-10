'use client';

import * as React from 'react';
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import type { Space } from '../../types/space';
import { getSpaces } from '../../lib/api-client';

const RouteMap = dynamic(() => import('../../components/RouteMap'), {
  ssr: false,
  loading: () => (
    <Box
      sx={{
        height: '100%',
        width: '100%',
        minHeight: 620,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#eee6d8',
        color: '#52645d',
        fontWeight: 800,
      }}
    >
      Loading map...
    </Box>
  ),
});

type LatLng = [number, number];

type RouteStep = {
  instruction: string;
};

const MELBOURNE_CBD: LatLng = [-37.8136, 144.9631];

function defaultStartPoint(): LatLng {
  return MELBOURNE_CBD;
}

function getSpaceLatitude(space: Space) {
  return Number(space.latitude);
}

function getSpaceLongitude(space: Space) {
  return Number(space.longitude);
}

function hasValidCoordinates(space: Space) {
  return (
    Number.isFinite(getSpaceLatitude(space)) &&
    Number.isFinite(getSpaceLongitude(space))
  );
}

function getDistanceKm(from: LatLng, to: LatLng) {
  const earthRadiusKm = 6371;

  const dLat = ((to[0] - from[0]) * Math.PI) / 180;
  const dLon = ((to[1] - from[1]) * Math.PI) / 180;

  const lat1 = (from[0] * Math.PI) / 180;
  const lat2 = (to[0] * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) *
      Math.cos(lat2) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

function estimateWalkingMinutes(distanceKm: number) {
  return Math.max(3, Math.round(distanceKm * 12));
}

function createFallbackRoute(start: LatLng, end: LatLng): LatLng[] {
  const midA: LatLng = [start[0], end[1]];
  return [start, midA, end];
}

function createFallbackSteps(start: LatLng, end: LatLng): RouteStep[] {
  const distance = getDistanceKm(start, end);

  if (distance < 0.3) {
    return [
      { instruction: 'depart from your current location' },
      { instruction: 'walk towards the selected destination' },
      { instruction: 'arrive at destination' },
    ];
  }

  return [
    { instruction: 'depart from your current location' },
    { instruction: 'continue along the suggested walking route' },
    { instruction: 'turn towards the destination area' },
    { instruction: 'arrive at destination' },
  ];
}

function normaliseStepInstruction(step: any) {
  const maneuver = step?.maneuver;
  const type = maneuver?.type;
  const modifier = maneuver?.modifier;
  const name = step?.name;

  if (type === 'depart') {
    return name ? `depart via ${name}` : 'depart from start point';
  }

  if (type === 'arrive') {
    return name ? `arrive via ${name}` : 'arrive at destination';
  }

  if (type === 'turn') {
    return `${modifier ? `${modifier} ` : ''}turn${
      name ? ` via ${name}` : ''
    }`;
  }

  if (type === 'new name') {
    return name ? `continue via ${name}` : 'continue walking';
  }

  if (type === 'end of road') {
    return name ? `end of road via ${name}` : 'continue to end of road';
  }

  if (name) {
    return `continue via ${name}`;
  }

  return 'continue walking';
}

async function fetchWalkingRoute(start: LatLng, end: LatLng) {
  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }

    const data = await response.json();
    const route = data?.routes?.[0];
    const coordinates = route?.geometry?.coordinates;

    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      throw new Error('Route geometry unavailable');
    }

    const routeLine: LatLng[] = coordinates.map((item: [number, number]) => [
      item[1],
      item[0],
    ]);

    const distanceKm = Number(route.distance) / 1000;
    const durationMin = Number(route.duration) / 60;

    const steps: RouteStep[] =
      route.legs?.[0]?.steps?.map((step: any) => ({
        instruction: normaliseStepInstruction(step),
      })) ?? [];

    return {
      routeLine,
      distanceKm: Number.isFinite(distanceKm)
        ? distanceKm
        : getDistanceKm(start, end),
      durationMin: Number.isFinite(durationMin)
        ? durationMin
        : estimateWalkingMinutes(getDistanceKm(start, end)),
      steps: steps.length ? steps : createFallbackSteps(start, end),
    };
  } catch (error) {
    console.warn('Using fallback route:', error);

    const distanceKm = getDistanceKm(start, end);

    return {
      routeLine: createFallbackRoute(start, end),
      distanceKm,
      durationMin: estimateWalkingMinutes(distanceKm),
      steps: createFallbackSteps(start, end),
    };
  }
}

function RoutePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const querySelectedName =
  searchParams.get('space') ||
  searchParams.get('destination') ||
  searchParams.get('name') ||
  '';

const [selectedName, setSelectedName] = React.useState(querySelectedName);

React.useEffect(() => {
  if (querySelectedName) {
    setSelectedName(querySelectedName);
    return;
  }

  const storedSpaceName =
    localStorage.getItem('selectedSpaceName') ||
    localStorage.getItem('selectedRouteSpace') ||
    localStorage.getItem('routeDestination') ||
    localStorage.getItem('selectedDestinationName');

  if (storedSpaceName) {
    setSelectedName(storedSpaceName);
  }
}, [querySelectedName]);

  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [space, setSpace] = React.useState<Space | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [startPoint, setStartPoint] = React.useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = React.useState<LatLng | null>(null);
  const [routeLine, setRouteLine] = React.useState<LatLng[]>([]);
  const [tripKm, setTripKm] = React.useState<number | null>(null);
  const [tripMin, setTripMin] = React.useState<number | null>(null);
  const [routeSteps, setRouteSteps] = React.useState<RouteStep[]>([]);

  React.useEffect(() => {
    async function loadSpaces() {
      try {
        setLoading(true);

        const records = await getSpaces();
        setSpaces(records);

        const matchedSpace =
          records.find(
            (item) =>
              item.name.toLowerCase() === selectedName.toLowerCase()
          ) ||
          records.find((item) =>
            item.name.toLowerCase().includes(selectedName.toLowerCase())
          ) ||
          records[0] ||
          null;

        setSpace(matchedSpace);

        if (matchedSpace && hasValidCoordinates(matchedSpace)) {
          setEndPoint([
            getSpaceLatitude(matchedSpace),
            getSpaceLongitude(matchedSpace),
          ]);
        } else {
          setEndPoint(null);
        }
      } catch (error) {
        console.error('Failed to load route space:', error);
      } finally {
        setLoading(false);
      }
    }

    loadSpaces();
  }, [selectedName]);

  const refreshLocation = React.useCallback(() => {
    if (!navigator.geolocation) {
      setStartPoint(defaultStartPoint());
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartPoint([
          position.coords.latitude,
          position.coords.longitude,
        ]);
      },
      (error) => {
        console.warn('Unable to get live location:', error);
        setStartPoint(defaultStartPoint());
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  React.useEffect(() => {
    refreshLocation();
  }, [refreshLocation]);

  React.useEffect(() => {
    async function buildRoute() {
      if (!endPoint) {
        setRouteLine([]);
        setTripKm(null);
        setTripMin(null);
        setRouteSteps([]);
        return;
      }

      const start = startPoint ?? defaultStartPoint();
      const route = await fetchWalkingRoute(start, endPoint);

      setRouteLine(route.routeLine);
      setTripKm(route.distanceKm);
      setTripMin(route.durationMin);
      setRouteSteps(route.steps);
    }

    buildRoute();
  }, [startPoint, endPoint]);

  const displayDistance =
    tripKm !== null && tripMin !== null
      ? `${tripKm.toFixed(2)} km · ~ ${Math.round(tripMin)} min`
      : space && Number.isFinite(Number(space.distance))
        ? `${Number(space.distance).toFixed(2)} km · ~ ${Math.max(
            3,
            Math.round(Number(space.distance) * 12)
          )} min`
        : 'Distance unavailable';

  const destinationDistance =
    tripKm !== null
      ? `${tripKm.toFixed(1)} km`
      : space && Number.isFinite(Number(space.distance))
        ? `${Number(space.distance).toFixed(1)} km`
        : 'Distance unavailable';

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5efe2' }}>
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: '28px',
              bgcolor: '#fbf7ed',
              border: '1px solid #ded2bd',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Loading route...
            </Typography>
          </Paper>
        </Container>
      </Box>
    );
  }

  if (!space) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f5efe2' }}>
        <Container maxWidth="xl" sx={{ py: 5 }}>
          <Paper
            elevation={0}
            sx={{
              p: 5,
              borderRadius: '28px',
              bgcolor: '#fbf7ed',
              border: '1px solid #ded2bd',
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              No destination found
            </Typography>

            <Button
              onClick={() => router.push('/discover')}
              sx={{ mt: 3, textTransform: 'none', fontWeight: 800 }}
            >
              Back to Discover
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#f5efe2',
        color: '#273d34',
      }}
    >
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box
          sx={{
            mb: 2.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 900,
              color: '#273d34',
              letterSpacing: '-0.04em',
            }}
          >
            Map & Directions
          </Typography>

          <Button
            variant="outlined"
            onClick={() => router.back()}
            sx={{
              borderRadius: 99,
              px: 3,
              py: 1.2,
              color: '#273d34',
              borderColor: '#d8c9ae',
              textTransform: 'none',
              fontWeight: 900,
              bgcolor: '#fffaf1',
              '&:hover': {
                borderColor: '#cdbb9b',
                bgcolor: '#f7efdf',
              },
            }}
          >
            ← Back
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            mb: 4,
            p: { xs: 2.5, md: 3 },
            borderRadius: '28px',
            border: '1px solid #ded2bd',
            bgcolor: '#fbf7ed',
            boxShadow: '0 18px 40px rgba(87, 72, 48, 0.12)',
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                md: '1fr 1fr auto',
              },
              gap: 3,
              alignItems: 'center',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: '#52645d',
                  mb: 1,
                }}
              >
                Start
              </Typography>

              <Chip
                label={
                  startPoint
                    ? '◎ My real location'
                    : '◎ Melbourne CBD fallback'
                }
                sx={{
                  bgcolor: '#eee6d8',
                  color: '#273d34',
                  fontWeight: 900,
                  border: '1px solid #d8c9ae',
                }}
              />

              <Typography
                sx={{
                  mt: 1,
                  color: '#7a867c',
                  fontSize: 14,
                }}
              >
                {startPoint
                  ? 'Using your browser live location.'
                  : 'Using fallback location until browser location is available.'}
              </Typography>
            </Box>

            <Box>
              <Typography
                sx={{
                  fontWeight: 900,
                  color: '#52645d',
                  mb: 1,
                }}
              >
                Destination
              </Typography>

              <Typography
                sx={{
                  fontWeight: 900,
                  color: '#273d34',
                }}
              >
                {space.name}
              </Typography>

              <Typography
                sx={{
                  color: '#7a867c',
                  fontSize: 14,
                }}
              >
                {space.suburb || 'Melbourne'}, Melbourne
              </Typography>
            </Box>

            <Box
              sx={{
                display: 'flex',
                gap: 1.5,
                justifyContent: {
                  xs: 'flex-start',
                  md: 'flex-end',
                },
              }}
            >
              <Button
                variant="outlined"
                onClick={refreshLocation}
                sx={{
                  borderRadius: '18px',
                  px: 2.5,
                  py: 1.4,
                  color: '#273d34',
                  borderColor: '#d8c9ae',
                  textTransform: 'none',
                  fontWeight: 900,
                  bgcolor: '#fffaf1',
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    borderColor: '#cdbb9b',
                    bgcolor: '#f7efdf',
                  },
                }}
              >
                Refresh location
              </Button>

              <Button
                variant="contained"
                onClick={refreshLocation}
                sx={{
                  borderRadius: '18px',
                  px: 3,
                  py: 1.4,
                  textTransform: 'none',
                  fontWeight: 900,
                  bgcolor: '#2d4a3d',
                  color: '#ffffff',
                  '&:hover': {
                    bgcolor: '#263f35',
                  },
                }}
              >
                Go
              </Button>
            </Box>
          </Box>

          <Box
            sx={{
              mt: 3,
              p: 2,
              borderRadius: '18px',
              bgcolor: '#dfe8d8',
              border: '1px solid #c8d6bf',
            }}
          >
            <Typography
              sx={{
                fontWeight: 900,
                color: '#486445',
              }}
            >
              Trip: {displayDistance}
            </Typography>
          </Box>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: '1.35fr 1fr',
            },
            gap: 3,
            alignItems: 'stretch',
          }}
        >
          <Box>
            <Box
              sx={{
                mb: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: '#273d34',
                  fontFamily: 'Georgia, serif',
                }}
              >
                Route map
              </Typography>

              <Typography
                sx={{
                  fontSize: 12,
                  letterSpacing: '0.18em',
                  color: '#9a8f7e',
                  textTransform: 'uppercase',
                }}
              >
                Selected destination only
              </Typography>
            </Box>

            <Paper
              elevation={0}
              sx={{
                position: 'relative',
                width: '100%',
                height: 620,
                overflow: 'hidden',
                borderRadius: '14px',
                border: '1px solid #ded2bd',
                bgcolor: '#eee6d8',
                boxShadow: '0 18px 40px rgba(87, 72, 48, 0.12)',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: '100%',
                  '& .leaflet-container': {
                    height: '100% !important',
                    width: '100% !important',
                  },
                }}
              >
                <RouteMap
                  startPoint={startPoint ?? defaultStartPoint()}
                  endPoint={endPoint}
                  routeLine={routeLine}
                  destinationName={space.name}
                  fallbackCenter={defaultStartPoint()}
                />
              </Box>

              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  top: 22,
                  right: 22,
                  zIndex: 500,
                  maxWidth: 260,
                  p: 1.6,
                  borderRadius: '10px',
                  bgcolor: '#fffaf1',
                  border: '1px solid #ded2bd',
                  boxShadow: '0 8px 24px rgba(87, 72, 48, 0.12)',
                }}
              >
                <Typography
                  sx={{
                    color: '#52645d',
                    fontSize: 14,
                    lineHeight: 1.5,
                  }}
                >
                  Choose the direct path or the quieter alternative.
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  left: 22,
                  bottom: 22,
                  zIndex: 500,
                  px: 2,
                  py: 1.2,
                  borderRadius: '10px',
                  bgcolor: '#fffaf1',
                  border: '1px solid #ded2bd',
                  boxShadow: '0 8px 24px rgba(87, 72, 48, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: '#c9775c',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: '#52645d',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                    }}
                  >
                    Fastest
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <Box
                    sx={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      bgcolor: '#617a59',
                    }}
                  />
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: '#52645d',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                    }}
                  >
                    Quieter
                  </Typography>
                </Box>
              </Paper>
            </Paper>
          </Box>

          <Box>
            <Typography
              variant="h5"
              sx={{
                mb: 1.5,
                fontWeight: 900,
                color: '#273d34',
                fontFamily: 'Georgia, serif',
              }}
            >
              Route details
            </Typography>

            <Paper
              elevation={0}
              sx={{
                width: '100%',
                height: 620,
                overflowY: 'auto',
                p: 3,
                borderRadius: '14px',
                border: '1px solid #ded2bd',
                bgcolor: '#fbf7ed',
                boxShadow: '0 18px 40px rgba(87, 72, 48, 0.12)',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Box sx={{ display: 'grid', gap: 2 }}>
                {routeSteps.length > 0 ? (
                  routeSteps.map((step, index) => (
                    <Box
                      key={`${step.instruction}-${index}`}
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '42px 1fr',
                        gap: 2,
                        position: 'relative',
                      }}
                    >
                      <Box
                        sx={{
                          position: 'relative',
                          display: 'flex',
                          justifyContent: 'center',
                        }}
                      >
                        {index < routeSteps.length - 1 && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 34,
                              bottom: -34,
                              width: 1,
                              borderLeft: '1px dashed #d8c9ae',
                            }}
                          />
                        )}

                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            bgcolor: '#c9775c',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            zIndex: 1,
                          }}
                        >
                          {index + 1}
                        </Box>
                      </Box>

                      <Paper
                        elevation={0}
                        sx={{
                          p: 2.2,
                          borderRadius: '10px',
                          border: '1px solid #ded2bd',
                          bgcolor: '#fffaf1',
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 900,
                            color: '#273d34',
                            fontFamily: 'Georgia, serif',
                            fontSize: '1.05rem',
                            mb: 0.8,
                          }}
                        >
                          {index === 0
                            ? 'Start from current location'
                            : index === routeSteps.length - 1
                              ? `Arrive at ${space.name}`
                              : `Step ${index + 1}`}
                        </Typography>

                        <Typography
                          sx={{
                            color: '#52645d',
                            fontStyle: 'italic',
                            fontFamily: 'Georgia, serif',
                            mb: 1,
                          }}
                        >
                          {step.instruction}
                        </Typography>

                        <Typography
                          sx={{
                            color: '#8a948c',
                            fontSize: 12,
                            letterSpacing: '0.08em',
                          }}
                        >
                          {index === 0
                            ? 'Begin route · walking'
                            : index === routeSteps.length - 1
                              ? `${Number(space.noiseDb ?? 50)} dB · ${Number(
                                  space.comfort ?? 70
                                )}/100 comfort · ${destinationDistance}`
                              : 'Walking navigation step'}
                        </Typography>
                      </Paper>
                    </Box>
                  ))
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: '10px',
                      border: '1px solid #ded2bd',
                      bgcolor: '#fffaf1',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 900,
                        color: '#273d34',
                        fontFamily: 'Georgia, serif',
                        mb: 1,
                      }}
                    >
                      Route details unavailable
                    </Typography>

                    <Typography sx={{ color: '#52645d' }}>
                      Try refreshing your location or selecting another
                      destination.
                    </Typography>
                  </Paper>
                )}
              </Box>

              <Paper
                elevation={0}
                sx={{
                  mt: 3,
                  p: 2.4,
                  borderRadius: '10px',
                  bgcolor: '#dfe8d8',
                  border: '1px solid #c8d6bf',
                }}
              >
                <Typography
                  sx={{
                    color: '#486445',
                    fontFamily: 'Georgia, serif',
                    fontWeight: 800,
                    lineHeight: 1.7,
                  }}
                >
                  Why this route:{' '}
                  <Box component="span" sx={{ fontStyle: 'italic' }}>
                    it connects the personalised recommendation to a clear next
                    action, helping users move from decision-making to physical
                    navigation.
                  </Box>
                </Typography>
              </Paper>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default function RoutePage() {
  return (
    <Suspense fallback={null}>
      <RoutePageContent />
    </Suspense>
  );
}