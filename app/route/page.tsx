'use client';

import * as React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Typography,
} from '@mui/material';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';
import DirectionsWalkRoundedIcon from '@mui/icons-material/DirectionsWalkRounded';
import NavigationRoundedIcon from '@mui/icons-material/NavigationRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import MyLocationRoundedIcon from '@mui/icons-material/MyLocationRounded';
import { Space } from '../../types/space';

const RouteMap = dynamic(() => import('../../components/RouteMap'), {
  ssr: false,
});

type LatLng = [number, number];

type NominatimResult = {
  lat: string;
  lon: string;
  display_name: string;
};

function defaultStartPoint(): LatLng {
  return [-37.8101, 144.9624];
}

async function geocodePlace(query: string): Promise<NominatimResult | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(
    query
  )}`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!res.ok) return null;
  const data = (await res.json()) as NominatimResult[];
  return data[0] ?? null;
}

async function getWalkingRoute(start: LatLng, end: LatLng) {
  const url = `https://router.project-osrm.org/route/v1/foot/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;

  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch route');

  const data = await res.json();
  const route = data.routes?.[0];
  if (!route) throw new Error('No route found');

  const coordinates: LatLng[] = route.geometry.coordinates.map(
    (c: [number, number]) => [c[1], c[0]]
  );

  return {
    distanceKm: route.distance / 1000,
    durationMin: route.duration / 60,
    geometry: coordinates,
    steps:
      route.legs?.[0]?.steps?.map((step: any) => {
        if (step.maneuver?.instruction) return step.maneuver.instruction;

        const type = step.maneuver?.type ?? 'Walk';
        const road = step.name ? ` via ${step.name}` : '';
        return `${type}${road}`;
      }) ?? [],
  };
}

export default function RoutePage() {
  const [space, setSpace] = React.useState<Space | null>(null);
  const [startPoint, setStartPoint] = React.useState<LatLng | null>(null);
  const [endPoint, setEndPoint] = React.useState<LatLng | null>(null);

  const [routeLine, setRouteLine] = React.useState<LatLng[]>([]);
  const [tripKm, setTripKm] = React.useState<number | null>(null);
  const [tripMin, setTripMin] = React.useState<number | null>(null);
  const [steps, setSteps] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);

  const [usingRealLocation, setUsingRealLocation] = React.useState(false);
  const [locationError, setLocationError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const stored = localStorage.getItem('routine-space');
    if (!stored) return;

    try {
      const parsed = JSON.parse(stored) as Space;
      setSpace(parsed);
    } catch {
      localStorage.removeItem('routine-space');
    }
  }, []);

  React.useEffect(() => {
    async function resolveDestination() {
      if (!space) return;

      if (typeof space.latitude === 'number' && typeof space.longitude === 'number') {
        setEndPoint([space.latitude, space.longitude]);
        return;
      }

      const geo = await geocodePlace(`${space.name}, ${space.suburb}, Melbourne`);
      if (geo) {
        setEndPoint([Number(geo.lat), Number(geo.lon)]);
      }
    }

    resolveDestination();
  }, [space]);

  React.useEffect(() => {
    if (!navigator.geolocation) {
      setUsingRealLocation(false);
      setLocationError('Geolocation is not supported on this browser. Using Melbourne CBD instead.');
      setStartPoint(defaultStartPoint());
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setStartPoint([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        setUsingRealLocation(true);
        setLocationError(null);
      },
      (error) => {
        setUsingRealLocation(false);

        if (error.code === 1) {
          setLocationError('Location permission was denied. Using Melbourne CBD instead.');
        } else if (error.code === 2) {
          setLocationError('Location is unavailable. Using Melbourne CBD instead.');
        } else if (error.code === 3) {
          setLocationError('Location request timed out. Using Melbourne CBD instead.');
        } else {
          setLocationError('Could not get your location. Using Melbourne CBD instead.');
        }

        setStartPoint(defaultStartPoint());
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  React.useEffect(() => {
    async function autoRoute() {
      if (!startPoint || !endPoint || !space) return;

      try {
        setLoading(true);
        const result = await getWalkingRoute(startPoint, endPoint);
        setRouteLine(result.geometry);
        setTripKm(result.distanceKm);
        setTripMin(result.durationMin);
        setSteps(result.steps);
      } catch {
        const roughKm = space.distance ?? 2;
        setRouteLine([startPoint, endPoint]);
        setTripKm(roughKm);
        setTripMin(Math.max(3, Math.round(roughKm * 12)));
        setSteps([
          'Start from your current location',
          `Head toward ${space.suburb}`,
          `Continue walking to ${space.name}`,
          'Arrive at your destination',
        ]);
      } finally {
        setLoading(false);
      }
    }

    autoRoute();
  }, [startPoint, endPoint, space]);

  async function handleRefreshRoute() {
    if (!startPoint || !endPoint || !space) return;

    try {
      setLoading(true);
      const result = await getWalkingRoute(startPoint, endPoint);
      setRouteLine(result.geometry);
      setTripKm(result.distanceKm);
      setTripMin(result.durationMin);
      setSteps(result.steps);
    } catch {
      const roughKm = space.distance ?? 2;
      setRouteLine([startPoint, endPoint]);
      setTripKm(roughKm);
      setTripMin(Math.max(3, Math.round(roughKm * 12)));
      setSteps([
        'Start from your current location',
        `Head toward ${space.suburb}`,
        `Continue walking to ${space.name}`,
        'Arrive at your destination',
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleRefreshLocation() {
    if (!navigator.geolocation) {
      setUsingRealLocation(false);
      setLocationError('Geolocation is not supported on this browser.');
      return;
    }

    setLocationError('Refreshing your live location...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStartPoint([
          position.coords.latitude,
          position.coords.longitude,
        ]);
        setUsingRealLocation(true);
        setLocationError(null);
      },
      (error) => {
        setUsingRealLocation(false);

        if (error.code === 1) {
          setLocationError('Location permission was denied.');
        } else if (error.code === 2) {
          setLocationError('Location is unavailable.');
        } else if (error.code === 3) {
          setLocationError('Location request timed out.');
        } else {
          setLocationError('Could not refresh your location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  if (!space) {
    return (
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Paper sx={{ p: 4, borderRadius: '24px' }}>
          <Typography variant="h4" sx={{ fontWeight: 900 }}>
            No destination selected
          </Typography>

          <Typography sx={{ mt: 1.5, color: 'text.secondary' }}>
            Start a routine first, then open the route page.
          </Typography>

          <Button
            component={Link}
            href="/discover"
            startIcon={<ArrowBackRoundedIcon />}
            variant="contained"
            sx={{
              mt: 3,
              borderRadius: '999px',
              textTransform: 'none',
              fontWeight: 800,
            }}
          >
            Back to discover
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f3f4f6', py: 4 }}>
      <Container maxWidth="xl">
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '28px',
            border: '1px solid #e5e7eb',
            bgcolor: '#ffffff',
            mb: 3,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '2rem', md: '2.4rem' },
                fontWeight: 900,
                color: '#111827',
              }}
            >
              Map & Directions
            </Typography>

            <Button
              component={Link}
              href="/routine"
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              sx={{
                borderRadius: '999px',
                textTransform: 'none',
                fontWeight: 800,
              }}
            >
              Back
            </Button>
          </Box>

          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: '22px',
              border: '1px solid #d1d5db',
              bgcolor: '#fafafa',
            }}
          >
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', lg: '1.25fr 1fr auto' },
                gap: 2,
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography sx={{ fontWeight: 800, mb: 0.6 }}>Start</Typography>

                <Chip
                  icon={<MyLocationRoundedIcon />}
                  label={usingRealLocation ? 'My real location' : 'Fallback location'}
                  sx={{ borderRadius: '999px', fontWeight: 700, mb: 1 }}
                />

                {locationError ? (
                  <Typography sx={{ fontSize: '0.88rem', color: '#b45309' }}>
                    {locationError}
                  </Typography>
                ) : (
                  <Typography sx={{ fontSize: '0.88rem', color: 'text.secondary' }}>
                    {usingRealLocation
                      ? 'Using your browser live location.'
                      : 'Detecting your real location...'}
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography sx={{ fontWeight: 800, mb: 0.6 }}>Destination</Typography>
                <Typography sx={{ fontSize: '1rem', color: '#374151', fontWeight: 700 }}>
                  {space.name}
                </Typography>
                <Typography sx={{ fontSize: '0.92rem', color: 'text.secondary' }}>
                  {space.suburb}, Melbourne
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  gap: 1.2,
                  flexWrap: 'wrap',
                  justifyContent: { xs: 'flex-start', lg: 'flex-end' },
                }}
              >
                <Button
                  onClick={handleRefreshLocation}
                  variant="outlined"
                  sx={{
                    minHeight: 60,
                    px: 3,
                    borderRadius: '18px',
                    textTransform: 'none',
                    fontWeight: 900,
                  }}
                >
                  Refresh location
                </Button>

                <Button
                  onClick={handleRefreshRoute}
                  variant="contained"
                  disabled={loading || !startPoint || !endPoint}
                  sx={{
                    minHeight: 60,
                    px: 4,
                    borderRadius: '18px',
                    textTransform: 'none',
                    fontWeight: 900,
                    fontSize: '1.05rem',
                    bgcolor: '#1473e6',
                    '&:hover': {
                      bgcolor: '#0f62c7',
                    },
                  }}
                >
                  {loading ? 'Loading...' : 'Go'}
                </Button>
              </Box>
            </Box>

            <Paper
              elevation={0}
              sx={{
                mt: 2.2,
                p: 2.2,
                borderRadius: '18px',
                bgcolor: '#dff4fb',
                border: '1px solid #b7e7f6',
              }}
            >
              <Typography sx={{ fontSize: '1.05rem', fontWeight: 900, color: '#0f4c5c' }}>
                Trip:{' '}
                {tripKm !== null && tripMin !== null
                  ? `${tripKm.toFixed(2)} km · ~ ${Math.round(tripMin)} min`
                  : `${space.distance.toFixed(2)} km · ~ ${Math.max(
                      3,
                      Math.round(space.distance * 12)
                    )} min`}
              </Typography>
            </Paper>
          </Paper>
        </Paper>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', xl: '1.45fr 0.8fr' },
            gap: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 0,
              overflow: 'hidden',
              borderRadius: '28px',
              border: '1px solid #dbe1e8',
              minHeight: 640,
            }}
          >
            <Box sx={{ height: 640, width: '100%' }}>
              <RouteMap
                startPoint={startPoint}
                endPoint={endPoint}
                routeLine={routeLine}
                destinationName={space.name}
                fallbackCenter={defaultStartPoint()}
              />
            </Box>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: '28px',
              border: '1px solid #dbe1e8',
              bgcolor: '#ffffff',
            }}
          >
            <Typography
              sx={{
                fontSize: { xs: '1.8rem', md: '2.2rem' },
                fontWeight: 900,
                color: '#111827',
                mb: 1,
              }}
            >
              Route summary
            </Typography>

            <Typography color="text.secondary" sx={{ mb: 2.5 }}>
              Direct walking navigation to your selected destination.
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
              <Chip icon={<PlaceRoundedIcon />} label={space.name} />
              <Chip
                icon={<DirectionsWalkRoundedIcon />}
                label={
                  tripKm !== null ? `${tripKm.toFixed(1)} km away` : `${space.distance} km away`
                }
              />
              <Chip icon={<NavigationRoundedIcon />} label={space.suburb} />
            </Box>

            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: '20px',
                bgcolor: '#f8fafc',
                border: '1px solid #e5e7eb',
                mb: 2.5,
              }}
            >
              <Typography sx={{ fontWeight: 900, mb: 1.2 }}>
                Navigation steps
              </Typography>

              <Box sx={{ display: 'grid', gap: 1.2 }}>
                {(steps.length
                  ? steps
                  : [
                      'Getting your current location',
                      `Preparing the route to ${space.name}`,
                      'Generating navigation path',
                    ]
                ).map((step, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '30px 1fr',
                      gap: 1.2,
                      alignItems: 'start',
                    }}
                  >
                    <Box
                      sx={{
                        width: 28,
                        height: 28,
                        borderRadius: '999px',
                        bgcolor: '#eef2ff',
                        color: '#5850ec',
                        display: 'grid',
                        placeItems: 'center',
                        fontWeight: 900,
                        fontSize: '0.85rem',
                      }}
                    >
                      {index + 1}
                    </Box>

                    <Typography color="text.secondary">{step}</Typography>
                  </Box>
                ))}
              </Box>
            </Paper>

            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: '20px',
                bgcolor: '#ffffff',
                border: '1px solid #e5e7eb',
              }}
            >
              <Typography sx={{ fontWeight: 900, mb: 1 }}>
                Selected destination
              </Typography>

              <Typography sx={{ fontSize: '1.15rem', fontWeight: 800 }}>
                {space.name}
              </Typography>

              <Typography color="text.secondary" sx={{ mt: 0.8 }}>
                {space.reason}
              </Typography>
            </Paper>
          </Paper>
        </Box>
      </Container>
    </Box>
  );
}