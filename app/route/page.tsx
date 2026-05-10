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
type TravelMode = 'walking' | 'driving';

type RouteStep = {
  instruction: string;
  distanceMeters?: number;
  maneuverType?: string;
  modifier?: string;
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

function estimateMinutes(distanceKm: number, mode: TravelMode) {
  if (mode === 'driving') {
    // Driving: about 4 min per km in city traffic
    return Math.max(2, Math.round(distanceKm * 4));
  }

  // Walking: about 12 min per km
  return Math.max(3, Math.round(distanceKm * 12));
}

function getTravelProfile(mode: TravelMode) {
  return mode === 'driving' ? 'driving' : 'foot';
}

function getTravelLabel(mode: TravelMode) {
  return mode === 'driving' ? 'Driving' : 'Walking';
}

function getTravelIcon(mode: TravelMode) {
  return mode === 'driving' ? '🚗' : '🚶';
}

function formatStepDistance(meters?: number) {
  const value = Number(meters);

  if (!Number.isFinite(value) || value <= 0) {
    return '';
  }

  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)} km`;
  }

  return `${Math.round(value)} m`;
}

function getStepIcon(step: RouteStep, index: number, total: number) {
  if (index === 0) return 'S';
  if (index === total - 1) return 'E';

  const modifier = String(step.modifier ?? '').toLowerCase();
  const type = String(step.maneuverType ?? '').toLowerCase();

  if (type.includes('arrive')) return 'E';
  if (modifier.includes('left')) return '←';
  if (modifier.includes('right')) return '→';
  if (modifier.includes('uturn') || modifier.includes('u-turn')) return '↩';
  if (type.includes('turn')) return '↱';

  return '•';
}

function createFallbackRoute(start: LatLng, end: LatLng): LatLng[] {
  const midA: LatLng = [start[0], end[1]];
  return [start, midA, end];
}

function createFallbackSteps(start: LatLng, end: LatLng, mode: TravelMode): RouteStep[] {
  const distanceKm = getDistanceKm(start, end);
  const totalMeters = distanceKm * 1000;

  if (distanceKm < 0.3) {
    return [
      {
        instruction: `Start from current location`,
        distanceMeters: Math.round(totalMeters * 0.35),
        maneuverType: 'depart',
      },
      {
        instruction: `Continue towards destination`,
        distanceMeters: Math.round(totalMeters * 0.45),
        maneuverType: 'continue',
      },
      {
        instruction: `Arrive at destination`,
        distanceMeters: Math.round(totalMeters * 0.2),
        maneuverType: 'arrive',
      },
    ];
  }

  return [
    {
      instruction: `Start from current location`,
      distanceMeters: Math.round(totalMeters * 0.25),
      maneuverType: 'depart',
    },
    {
      instruction:
        mode === 'driving'
          ? 'Continue along the suggested driving route'
          : 'Continue along the suggested walking route',
      distanceMeters: Math.round(totalMeters * 0.45),
      maneuverType: 'continue',
    },
    {
      instruction: 'Turn towards the destination area',
      distanceMeters: Math.round(totalMeters * 0.2),
      maneuverType: 'turn',
    },
    {
      instruction: 'Arrive at destination',
      distanceMeters: Math.round(totalMeters * 0.1),
      maneuverType: 'arrive',
    },
  ];
}

function normaliseStepInstruction(step: any) {
  const maneuver = step?.maneuver;
  const type = maneuver?.type;
  const modifier = maneuver?.modifier;
  const name = step?.name;

  if (type === 'depart') {
    return name ? `Start on ${name}` : 'Start from current location';
  }

  if (type === 'arrive') {
    return name ? `Arrive via ${name}` : 'Arrive at destination';
  }

  if (type === 'turn') {
    if (modifier === 'left') return name ? `Left onto ${name}` : 'Turn left';
    if (modifier === 'right') return name ? `Right onto ${name}` : 'Turn right';
    if (modifier === 'uturn') return name ? `Uturn onto ${name}` : 'Make a U-turn';

    return name ? `Turn onto ${name}` : 'Turn';
  }

  if (type === 'new name') {
    return name ? `Continue via ${name}` : 'Continue';
  }

  if (type === 'end of road') {
    return name ? `Continue to end of road via ${name}` : 'Continue to end of road';
  }

  if (name) {
    return `Continue via ${name}`;
  }

  return 'Continue';
}

async function fetchRoute(start: LatLng, end: LatLng, mode: TravelMode) {
  try {
    const profile = getTravelProfile(mode);

    const url = `https://router.project-osrm.org/route/v1/${profile}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;

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
        distanceMeters: Number(step.distance),
        maneuverType: step?.maneuver?.type,
        modifier: step?.maneuver?.modifier,
      })) ?? [];

      const finalDistanceKm = Number.isFinite(distanceKm)
      ? distanceKm
      : getDistanceKm(start, end);
    
    const finalDurationMin =
      mode === 'walking'
        ? estimateMinutes(finalDistanceKm, 'walking')
        : Number.isFinite(durationMin)
          ? durationMin
          : estimateMinutes(finalDistanceKm, 'driving');
    
    return {
      routeLine,
      distanceKm: finalDistanceKm,
      durationMin: finalDurationMin,
      steps: steps.length ? steps : createFallbackSteps(start, end, mode),
    };
  } catch (error) {
    console.warn('Using fallback route:', error);

    const distanceKm = getDistanceKm(start, end);

    return {
      routeLine: createFallbackRoute(start, end),
      distanceKm,
      durationMin: estimateMinutes(distanceKm, mode),
      steps: createFallbackSteps(start, end, mode),
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

  const [spaces, setSpaces] = React.useState<Space[]>([]);
  const [space, setSpace] = React.useState<Space | null>(null);
  const [loading, setLoading] = React.useState(true);

  const [startPoint, setStartPoint] = React.useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = React.useState<LatLng | null>(null);
  const [routeLine, setRouteLine] = React.useState<LatLng[]>([]);
  const [tripKm, setTripKm] = React.useState<number | null>(null);
  const [tripMin, setTripMin] = React.useState<number | null>(null);
  const [routeSteps, setRouteSteps] = React.useState<RouteStep[]>([]);
  const [travelMode, setTravelMode] = React.useState<TravelMode>('walking');

  React.useEffect(() => {
    if (querySelectedName) {
      setSelectedName(querySelectedName);
      return;
    }

    if (typeof window === 'undefined') return;

    const storedSpaceName =
      localStorage.getItem('selectedSpaceName') ||
      localStorage.getItem('selectedRouteSpace') ||
      localStorage.getItem('routeDestination') ||
      localStorage.getItem('selectedDestinationName') ||
      '';

    if (storedSpaceName) {
      setSelectedName(storedSpaceName);
    }
  }, [querySelectedName]);

  React.useEffect(() => {
    async function loadSpaces() {
      try {
        setLoading(true);

        const records = await getSpaces();
        setSpaces(records);

        const lowerSelected = selectedName.toLowerCase();

        const matchedSpace =
          records.find(
            (item) => item.name.toLowerCase() === lowerSelected
          ) ||
          records.find((item) =>
            item.name.toLowerCase().includes(lowerSelected)
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
      const route = await fetchRoute(start, endPoint, travelMode);

      setRouteLine(route.routeLine);
      setTripKm(route.distanceKm);
      setTripMin(route.durationMin);
      setRouteSteps(route.steps);
    }

    buildRoute();
  }, [startPoint, endPoint, travelMode]);

  const displayDistance =
  tripKm !== null && tripMin !== null
    ? `${tripKm.toFixed(2)} km · ~ ${Math.round(tripMin)} min`
    : space && Number.isFinite(Number(space.distance))
      ? `${Number(space.distance).toFixed(2)} km · ~ ${estimateMinutes(
          Number(space.distance),
          travelMode
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
              fontFamily: 'Georgia, serif',
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

          <Box sx={{ mt: 3 }}>
            <Typography
              sx={{
                mb: 1.4,
                fontWeight: 900,
                color: '#273d34',
                fontSize: '1.05rem',
              }}
            >
              Travel Mode
            </Typography>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: '1fr 1fr',
                },
                gap: 1.4,
              }}
            >
              {[
  { value: 'walking' as TravelMode, label: '🚶 Walking' },
  { value: 'driving' as TravelMode, label: '🚗 Driving' },
].map((item) => {
  const active = travelMode === item.value;

  return (
    <Button
      key={item.value}
      onClick={() => setTravelMode(item.value)}
      variant={active ? 'contained' : 'outlined'}
      sx={{
        py: 1.7,
        borderRadius: '18px',
        textTransform: 'none',
        fontWeight: 900,
        fontSize: '1.05rem',

        bgcolor: active ? '#7fa887' : '#fffaf1',
        color: active ? '#ffffff' : '#273d34',

        border: 'none',
        outline: 'none',
        boxShadow: active
          ? '0 10px 24px rgba(127, 168, 135, 0.22)'
          : 'inset 0 0 0 1px #d8c9ae',

        '&:hover': {
          bgcolor: active ? '#739b7b' : '#f7efdf',
          border: 'none',
          boxShadow: active
            ? '0 10px 24px rgba(127, 168, 135, 0.24)'
            : 'inset 0 0 0 1px #cdbb9b',
        },
      }}
    >
      {item.label}
    </Button>
  );
})}
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
              {getTravelIcon(travelMode)} {getTravelLabel(travelMode)}:{' '}
              {displayDistance}
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
                  maxWidth: 280,
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
                  Choose walking or driving to update the route and directions.
                </Typography>
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
              <Box sx={{ mb: 3 }}>
                <Typography
                  sx={{
                    mb: 1.5,
                    color: '#202020',
                    fontWeight: 900,
                    fontSize: '1.15rem',
                  }}
                >
                  Choose Route
                </Typography>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '18px',
                    bgcolor: '#eef5ff',
                    border: '2px solid #188a42',
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 2,
                      alignItems: 'flex-start',
                    }}
                  >
                    <Box>
                      <Typography
                        sx={{
                          color: '#202020',
                          fontWeight: 900,
                          fontSize: '1.2rem',
                        }}
                      >
                        Fastest
                      </Typography>

                      <Typography
                        sx={{
                          mt: 0.6,
                          color: '#64748b',
                          fontSize: '1rem',
                        }}
                      >
                        Shortest{' '}
                        {travelMode === 'driving' ? 'driving' : 'walking'} time
                      </Typography>

                      <Typography
                        sx={{
                          mt: 1.2,
                          color: '#202020',
                          fontWeight: 900,
                          fontSize: '1.05rem',
                        }}
                      >
                        {tripKm !== null
                          ? `${tripKm.toFixed(1)} km`
                          : destinationDistance}{' '}
                        ·{' '}
                        {tripMin !== null
                          ? `${Math.round(tripMin)} min`
                          : 'Time unavailable'}
                      </Typography>
                    </Box>

                    <Chip
                      label="Easy"
                      sx={{
                        bgcolor: '#dceee3',
                        color: '#188a42',
                        border: '1px solid #8bc5a2',
                        fontWeight: 900,
                        borderRadius: '999px',
                      }}
                    />
                  </Box>
                </Paper>
              </Box>

              <Typography
                sx={{
                  mb: 2,
                  color: '#202020',
                  fontWeight: 900,
                  fontSize: '1.15rem',
                }}
              >
                Step-by-step
              </Typography>

              <Box sx={{ display: 'grid', gap: 2 }}>
                {routeSteps.length > 0 ? (
                  routeSteps.map((step, index) => {
                    const total = routeSteps.length;
                    const icon = getStepIcon(step, index, total);
                    const distanceText = formatStepDistance(step.distanceMeters);

                    return (
                      <Box
                        key={`${step.instruction}-${index}`}
                        sx={{
                          display: 'grid',
                          gridTemplateColumns: '56px 1fr',
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
                          {index < total - 1 && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 42,
                                bottom: -28,
                                width: 3,
                                bgcolor: '#9e9a92',
                                opacity: 0.65,
                              }}
                            />
                          )}

                          <Box
                            sx={{
                              width: 34,
                              height: 34,
                              mt: 0.6,
                              borderRadius:
                                icon === 'S' || icon === 'E' ? '4px' : '50%',
                              border:
                                icon === 'S' || icon === 'E'
                                  ? '2px solid #202020'
                                  : 'none',
                              bgcolor:
                                icon === 'E'
                                  ? '#188a42'
                                  : icon === 'S'
                                    ? '#fffaf1'
                                    : '#c9775c',
                              color: icon === 'S' ? '#202020' : '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              zIndex: 1,
                            }}
                          >
                            {icon === 'S' || icon === 'E' ? '' : index + 1}
                          </Box>
                        </Box>

                        <Paper
                          elevation={0}
                          sx={{
                            p: 2.2,
                            borderRadius: '16px',
                            border: '1px solid #ded2bd',
                            bgcolor: '#fffaf1',
                            boxShadow: '0 8px 18px rgba(87, 72, 48, 0.05)',
                          }}
                        >
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '44px 1fr',
                              gap: 1.5,
                              alignItems: 'start',
                            }}
                          >
                            <Typography
                              sx={{
                                fontSize: '2rem',
                                lineHeight: 1,
                                color: '#202020',
                                fontWeight: 700,
                              }}
                            >
                              {icon}
                            </Typography>

                            <Box>
                              <Typography
                                sx={{
                                  color: '#202020',
                                  fontWeight: 900,
                                  fontSize: '1.08rem',
                                  lineHeight: 1.35,
                                }}
                              >
                                {index === total - 1
                                  ? 'Arrive at destination'
                                  : step.instruction}
                              </Typography>

                              {distanceText && (
                                <Typography
                                  sx={{
                                    mt: 1,
                                    color: '#64748b',
                                    fontWeight: 900,
                                    fontSize: '1rem',
                                  }}
                                >
                                  {distanceText}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </Paper>
                      </Box>
                    );
                  })
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