'use client';

import * as React from 'react';
import {
  Box,
  CircularProgress,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded';
import VolumeUpRoundedIcon from '@mui/icons-material/VolumeUpRounded';
import InsightsRoundedIcon from '@mui/icons-material/InsightsRounded';
import AppNavbar from '../../components/AppNavbar';
import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type PlaceOption = {
  placeName: string;
  placeType: string;
  latitude: number;
  longitude: number;
  readingCount: number;
};

type HourTrend = {
  hour: number;
  label: string;
  range: string;
  noiseDb: number | null;
  minNoise: number | null;
  maxNoise: number | null;
  readingCount: number;
  zone: string;
};

type TrendsResponse = {
  places: PlaceOption[];
  selectedPlaceName: string | null;
  hourlyData: HourTrend[];
};

function formatDb(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'No data';
  }

  return `${value.toFixed(1)} dB`;
}

function getValidHourlyData(data: HourTrend[]) {
  return data.filter((item) => item.noiseDb !== null && !Number.isNaN(item.noiseDb));
}

export default function TrendsPage() {
  const [places, setPlaces] = React.useState<PlaceOption[]>([]);
  const [selectedPlaceName, setSelectedPlaceName] = React.useState('');
  const [hourlyData, setHourlyData] = React.useState<HourTrend[]>([]);
  const [activeHour, setActiveHour] = React.useState<HourTrend | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadTrendData = React.useCallback(async (placeName?: string) => {
    try {
      setLoading(true);
      setError('');

      const query = placeName ? `?placeName=${encodeURIComponent(placeName)}` : '';
      const response = await fetch(`/api/trends/noise${query}`, {
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to load trend data');
      }

      const data: TrendsResponse = await response.json();

      setPlaces(data.places);
      setSelectedPlaceName(data.selectedPlaceName || '');
      setHourlyData(data.hourlyData);

      const validData = getValidHourlyData(data.hourlyData);
      const quietest = validData.reduce(
        (min, item) => (item.noiseDb! < min.noiseDb! ? item : min),
        validData[0]
      );

      setActiveHour(quietest || data.hourlyData[0] || null);
    } catch (err) {
      console.error(err);
      setError('Unable to load noise trend data.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  const validHourlyData = React.useMemo(() => getValidHourlyData(hourlyData), [hourlyData]);

  const quietestHour = React.useMemo(() => {
    if (validHourlyData.length === 0) return null;

    return validHourlyData.reduce((min, item) =>
      item.noiseDb! < min.noiseDb! ? item : min
    );
  }, [validHourlyData]);

  const busiestHour = React.useMemo(() => {
    if (validHourlyData.length === 0) return null;

    return validHourlyData.reduce((max, item) =>
      item.noiseDb! > max.noiseDb! ? item : max
    );
  }, [validHourlyData]);

  const averageNoise = React.useMemo(() => {
    if (validHourlyData.length === 0) return null;

    const total = validHourlyData.reduce((sum, item) => sum + item.noiseDb!, 0);
    return total / validHourlyData.length;
  }, [validHourlyData]);

  const chartMin = React.useMemo(() => {
    if (validHourlyData.length === 0) return 0;

    return Math.floor(Math.min(...validHourlyData.map((d) => d.noiseDb!)) - 2);
  }, [validHourlyData]);

  const chartMax = React.useMemo(() => {
    if (validHourlyData.length === 0) return 100;

    return Math.ceil(Math.max(...validHourlyData.map((d) => d.noiseDb!)) + 2);
  }, [validHourlyData]);

  const selectedPlace = React.useMemo(() => {
    return places.find((place) => place.placeName === selectedPlaceName);
  }, [places, selectedPlaceName]);

  const quietnessDifference =
    quietestHour && busiestHour
      ? (busiestHour.noiseDb! - quietestHour.noiseDb!).toFixed(1)
      : 'No data';

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: '100vh',
          background:
            'radial-gradient(circle at top left, rgba(79,70,229,0.06), transparent 24%), linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%)',
          py: { xs: 3, md: 5 },
        }}
      >
        <Container maxWidth="xl">
          <Typography
            sx={{
              fontSize: { xs: '2.2rem', md: '3.2rem' },
              fontWeight: 900,
              color: '#111827',
              mb: 1,
              letterSpacing: '-0.04em',
            }}
          >
            Historical quiet-time trend
          </Typography>

          <Typography color="text.secondary" sx={{ mb: 3.5, fontSize: '1.05rem' }}>
            Choose a location and explore its real hourly noise pattern from the database.
          </Typography>

          <Paper
            elevation={0}
            sx={{
              mb: 3,
              p: { xs: 2, md: 2.5 },
              borderRadius: '24px',
              bgcolor: 'rgba(255,255,255,0.88)',
              border: '1px solid #e5e7eb',
              boxShadow: '0 16px 40px rgba(15,23,42,0.05)',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              gap: 2,
              alignItems: { xs: 'stretch', md: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Box>
              <Typography
                sx={{
                  fontSize: '0.82rem',
                  fontWeight: 900,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  mb: 0.6,
                }}
              >
                Selected location
              </Typography>

              <Typography sx={{ fontSize: '1.35rem', fontWeight: 900, color: '#111827' }}>
                {selectedPlaceName || 'Loading locations...'}
              </Typography>

              {selectedPlace && (
                <Typography color="text.secondary" sx={{ mt: 0.4 }}>
                  {selectedPlace.placeType} · {selectedPlace.readingCount.toLocaleString()} sensor
                  readings
                </Typography>
              )}
            </Box>

            <FormControl sx={{ minWidth: { xs: '100%', md: 360 } }}>
              <Select
                value={selectedPlaceName}
                disabled={loading || places.length === 0}
                onChange={(event) => {
                  const nextPlace = event.target.value;
                  setSelectedPlaceName(nextPlace);
                  loadTrendData(nextPlace);
                }}
                sx={{
                  bgcolor: '#ffffff',
                  borderRadius: '16px',
                  fontWeight: 800,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e5e7eb',
                  },
                }}
              >
                {places.map((place) => (
                  <MenuItem key={place.placeName} value={place.placeName}>
                    {place.placeName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>

          {error && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                mb: 3,
                borderRadius: '24px',
                border: '1px solid #fecaca',
                bgcolor: '#fef2f2',
              }}
            >
              <Typography sx={{ fontWeight: 800, color: '#991b1b' }}>{error}</Typography>
            </Paper>
          )}

          {loading ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 420,
                borderRadius: '28px',
                bgcolor: 'rgba(255,255,255,0.88)',
                border: '1px solid #e5e7eb',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <CircularProgress />
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                  Loading real noise trend data...
                </Typography>
              </Box>
            </Paper>
          ) : (
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', xl: '1.55fr 0.9fr' },
                gap: 3,
                alignItems: 'start',
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2.5, md: 3 },
                  borderRadius: '28px',
                  bgcolor: 'rgba(255,255,255,0.88)',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 16px 40px rgba(15,23,42,0.05)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: '1.7rem', md: '2.2rem' },
                    fontWeight: 900,
                    color: '#111827',
                    mb: 0.6,
                  }}
                >
                  Noise by hour
                </Typography>

                <Typography color="text.secondary" sx={{ mb: 2.2 }}>
                  Lower values indicate quieter average conditions. Click any point on the line to
                  inspect a specific time window.
                </Typography>

                <Box
                  sx={{
                    height: { xs: 340, md: 470 },
                    p: { xs: 1, md: 2 },
                    borderRadius: '24px',
                    bgcolor: '#fafbff',
                    border: '1px solid #edf0f7',
                  }}
                >
                  {validHourlyData.length === 0 ? (
                    <Box
                      sx={{
                        height: '100%',
                        display: 'grid',
                        placeItems: 'center',
                        textAlign: 'center',
                      }}
                    >
                      <Typography color="text.secondary">
                        No hourly noise data available for this location.
                      </Typography>
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={hourlyData}
                        margin={{ top: 20, right: 18, left: -10, bottom: 10 }}
                        onClick={(state: any) => {
                          if (state?.activePayload?.[0]?.payload) {
                            setActiveHour(state.activePayload[0].payload);
                          }
                        }}
                      >
                        <CartesianGrid stroke="#e5e7eb" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          domain={[chartMin, chartMax]}
                          tick={{ fill: '#6b7280', fontSize: 12 }}
                          axisLine={false}
                          tickLine={false}
                          width={42}
                        />
                        <Tooltip
                          cursor={{ stroke: '#c7d2fe', strokeWidth: 2 }}
                          contentStyle={{
                            borderRadius: 16,
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 10px 25px rgba(15,23,42,0.08)',
                          }}
                          formatter={(value: unknown) => [formatDb(Number(value)), 'Noise']}
                          labelFormatter={(label: unknown) => {
                            const found = hourlyData.find((item) => item.label === String(label));
                            return found?.range ?? String(label);
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="noiseDb"
                          stroke="none"
                          fill="#c7d2fe"
                          fillOpacity={0.3}
                        />
                        <Line
                          type="monotone"
                          dataKey="noiseDb"
                          stroke="#5b52f0"
                          strokeWidth={4}
                          connectNulls={false}
                          dot={(props: any) => {
                            const { cx, cy, payload } = props;
                            const isActive = payload?.hour === activeHour?.hour;

                            if (payload?.noiseDb === null) {
                              return <circle cx={cx} cy={cy} r={0} fill="transparent" />;
                            }

                            return (
                              <circle
                                cx={cx}
                                cy={cy}
                                r={isActive ? 7 : 4}
                                fill={isActive ? '#5b52f0' : '#ffffff'}
                                stroke="#5b52f0"
                                strokeWidth={isActive ? 3 : 2}
                                style={{ cursor: 'pointer' }}
                                onClick={() => payload && setActiveHour(payload)}
                              />
                            );
                          }}
                          activeDot={{
                            r: 7,
                            fill: '#5b52f0',
                            stroke: '#ffffff',
                            strokeWidth: 3,
                          }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </Box>

                <Box
                  sx={{
                    mt: 2.5,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                    gap: 2,
                  }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '20px',
                      bgcolor: '#f8fafc',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        mb: 0.6,
                      }}
                    >
                      Best quiet time
                    </Typography>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#111827' }}>
                      {quietestHour?.range ?? 'No data'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.6 }}>
                      {formatDb(quietestHour?.noiseDb)} average
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '20px',
                      bgcolor: '#f8fafc',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        mb: 0.6,
                      }}
                    >
                      Most active hour
                    </Typography>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#111827' }}>
                      {busiestHour?.range ?? 'No data'}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.6 }}>
                      {formatDb(busiestHour?.noiseDb)} average
                    </Typography>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: '20px',
                      bgcolor: '#f8fafc',
                      border: '1px solid #e5e7eb',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.82rem',
                        fontWeight: 900,
                        color: '#64748b',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        mb: 0.6,
                      }}
                    >
                      Daily average
                    </Typography>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, color: '#111827' }}>
                      {formatDb(averageNoise)}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 0.6 }}>
                      Across available hourly readings
                    </Typography>
                  </Paper>
                </Box>
              </Paper>

              <Box sx={{ display: 'grid', gap: 3, position: { xl: 'sticky' }, top: { xl: 96 } }}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '28px',
                    bgcolor: 'rgba(255,255,255,0.88)',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 16px 40px rgba(15,23,42,0.05)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 54,
                        height: 54,
                        borderRadius: '18px',
                        bgcolor: '#eef2ff',
                        color: '#5b52f0',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <AccessTimeRoundedIcon />
                    </Box>

                    <Box>
                      <Typography sx={{ color: '#374151', fontWeight: 700, mb: 0.4 }}>
                        Selected time window
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '2rem',
                          fontWeight: 900,
                          lineHeight: 1.08,
                          color: '#111827',
                        }}
                      >
                        {activeHour?.range ?? 'No data'}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        {formatDb(activeHour?.noiseDb)} average · {activeHour?.zone ?? 'No data'}
                      </Typography>
                      {activeHour && (
                        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                          Based on {activeHour.readingCount.toLocaleString()} readings.
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '28px',
                    bgcolor: 'rgba(255,255,255,0.88)',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 16px 40px rgba(15,23,42,0.05)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 54,
                        height: 54,
                        borderRadius: '18px',
                        bgcolor: '#eef2ff',
                        color: '#5b52f0',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <VolumeUpRoundedIcon />
                    </Box>

                    <Box>
                      <Typography sx={{ color: '#374151', fontWeight: 700, mb: 0.4 }}>
                        Quietness difference
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '2rem',
                          fontWeight: 900,
                          lineHeight: 1.08,
                          color: '#111827',
                        }}
                      >
                        {quietnessDifference === 'No data' ? 'No data' : `${quietnessDifference} dB`}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        Difference between the busiest and quietest hour.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    borderRadius: '28px',
                    bgcolor: 'rgba(255,255,255,0.88)',
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 16px 40px rgba(15,23,42,0.05)',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 54,
                        height: 54,
                        borderRadius: '18px',
                        bgcolor: '#eef2ff',
                        color: '#5b52f0',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <InsightsRoundedIcon />
                    </Box>

                    <Box>
                      <Typography sx={{ color: '#374151', fontWeight: 700, mb: 0.4 }}>
                        What this means
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: '1.7rem',
                          fontWeight: 900,
                          lineHeight: 1.15,
                          color: '#111827',
                        }}
                      >
                        {quietestHour
                          ? `Try visiting around ${quietestHour.range}`
                          : 'No recommendation available'}
                      </Typography>
                      <Typography color="text.secondary" sx={{ mt: 1 }}>
                        This recommendation is calculated from real hourly sensor readings for the
                        selected location.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            </Box>
          )}
        </Container>
      </Box>
    </>
  );
}