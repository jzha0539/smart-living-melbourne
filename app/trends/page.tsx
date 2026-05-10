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
import NightsStayRoundedIcon from '@mui/icons-material/NightsStayRounded';
import AppNavbar from '../../components/AppNavbar';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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

const colors = {
  background: '#F5F1E8',
  sidebar: '#EFE8DA',
  surface: '#FFFDF8',
  surfaceSoft: '#F8F4EC',
  primary: '#243C35',
  primarySoft: '#4F6B57',
  sage: '#7F9276',
  sageSoft: '#E4ECD8',
  border: '#E4D9C8',
  borderStrong: '#CFC4B4',
  muted: '#6E7771',
  mutedLight: '#8A9690',
  accent: '#72986fff',
};

function formatDb(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'No data';
  return `${value.toFixed(1)} dB`;
}

function getValidHourlyData(data: HourTrend[]) {
  return data.filter((item) => item.noiseDb !== null && !Number.isNaN(item.noiseDb));
}

function shortHour(hour: number) {
  return String(hour).padStart(2, '0');
}

function getBarColor(value: number | null) {
  if (value === null) return colors.border;
  if (value < 45) return colors.sage;
  if (value <= 60) return colors.accent;
  return '#2c4529ff';
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, md: 2.2 },
        minHeight: 96,
        borderRadius: '16px',
        bgcolor: colors.surface,
        border: `1px solid ${colors.border}`,
        boxShadow: 'none',
      }}
    >
      <Typography
        sx={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: colors.mutedLight,
          letterSpacing: '0.28em',
          textTransform: 'uppercase',
          mb: 1.2,
        }}
      >
        {label}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.7 }}>
        <Typography
          sx={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: { xs: '1.9rem', md: '2.15rem' },
            lineHeight: 1,
            fontWeight: 600,
            color: colors.primary,
            letterSpacing: '-0.05em',
          }}
        >
          {value}
        </Typography>
        {suffix && (
          <Typography
            sx={{
              fontSize: '0.9rem',
              fontWeight: 600,
              color: colors.muted,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {suffix}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

export default function TrendsPage() {
  const [places, setPlaces] = React.useState<PlaceOption[]>([]);
  const [selectedPlaceName, setSelectedPlaceName] = React.useState('');
  const [hourlyData, setHourlyData] = React.useState<HourTrend[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadTrendData = React.useCallback(async (placeName?: string) => {
    try {
      setLoading(true);
      setError('');

      const query = placeName ? `?placeName=${encodeURIComponent(placeName)}` : '';
      const response = await fetch(`/api/trends/noise${query}`, { cache: 'no-store' });

      if (!response.ok) throw new Error('Failed to load trend data');

      const data: TrendsResponse = await response.json();
      setPlaces(data.places);
      setSelectedPlaceName(data.selectedPlaceName || '');
      setHourlyData(data.hourlyData);
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
    return validHourlyData.reduce((min, item) => (item.noiseDb! < min.noiseDb! ? item : min));
  }, [validHourlyData]);

  const busiestHour = React.useMemo(() => {
    if (validHourlyData.length === 0) return null;
    return validHourlyData.reduce((max, item) => (item.noiseDb! > max.noiseDb! ? item : max));
  }, [validHourlyData]);

  const averageNoise = React.useMemo(() => {
    if (validHourlyData.length === 0) return null;
    const total = validHourlyData.reduce((sum, item) => sum + item.noiseDb!, 0);
    return total / validHourlyData.length;
  }, [validHourlyData]);

  const selectedPlace = React.useMemo(
    () => places.find((place) => place.placeName === selectedPlaceName),
    [places, selectedPlaceName]
  );

  const totalReadings = React.useMemo(
    () => hourlyData.reduce((sum, item) => sum + item.readingCount, 0),
    [hourlyData]
  );

  const chartData = React.useMemo(
    () =>
      hourlyData.map((item) => ({
        ...item,
        shortLabel: shortHour(item.hour),
        value: item.noiseDb ?? 0,
      })),
    [hourlyData]
  );

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: colors.background,
          background: `radial-gradient(circle at 28% 8%, rgba(255, 253, 248, 0.9), transparent 34%), ${colors.background}`,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <Box
          sx={{
            borderBottom: `1px solid ${colors.border}`,
            bgcolor: 'rgba(255,253,248,0.45)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Container
            maxWidth="xl"
            sx={{
              minHeight: 74,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 2,
              py: 1.5,
            }}
          >
            <Typography sx={{ color: colors.muted, fontSize: '0.92rem' }}>
              Smart Living Melbourne&nbsp;&nbsp;/&nbsp;&nbsp;
              <Box component="span" sx={{ color: colors.primary, fontWeight: 700 }}>
                Trends
              </Box>
            </Typography>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box
                sx={{
                  px: 1.6,
                  py: 0.8,
                  borderRadius: 999,
                  border: `1px solid ${colors.borderStrong}`,
                  bgcolor: colors.surface,
                  color: colors.muted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <AccessTimeRoundedIcon sx={{ fontSize: 16 }} /> Thu, 7 May
              </Box>
              <Box
                sx={{
                  px: 1.6,
                  py: 0.8,
                  borderRadius: 999,
                  border: `1px solid ${colors.borderStrong}`,
                  bgcolor: colors.surface,
                  color: colors.muted,
                  display: { xs: 'none', sm: 'flex' },
                  alignItems: 'center',
                  gap: 0.8,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                }}
              >
                <NightsStayRoundedIcon sx={{ fontSize: 16 }} /> Evening
              </Box>
            </Box>
          </Container>
        </Box>

        <Container maxWidth="xl" sx={{ py: { xs: 4, md: 6 } }}>
          <Box sx={{ maxWidth: 760, mb: 4 }}>
            <Typography
              sx={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: colors.mutedLight,
                letterSpacing: '0.34em',
                textTransform: 'uppercase',
                mb: 1,
              }}
            >
              A 24-hour read
            </Typography>

            <Typography
              sx={{
                fontFamily: 'Georgia, "Times New Roman", serif',
                fontSize: { xs: '2.6rem', md: '4rem' },
                lineHeight: 0.98,
                fontWeight: 500,
                color: colors.primary,
                letterSpacing: '-0.055em',
                mb: 1.5,
              }}
            >
              When does the city{' '}
              <Box component="em" sx={{ fontStyle: 'italic', color: colors.primarySoft }}>
                soften?
              </Box>
            </Typography>

            <Typography sx={{ fontSize: '1.05rem', color: colors.muted, lineHeight: 1.55 }}>
              Aggregated readings by hour, drawn from the live sensor network. Pick a place to see
              its rhythm.
            </Typography>
          </Box>

          {error && (
            <Paper
              elevation={0}
              sx={{
                p: 2,
                mb: 3,
                borderRadius: '16px',
                bgcolor: '#FFF3EA',
                border: '1px solid #E8B99C',
                color: '#8A4B2A',
              }}
            >
              {error}
            </Paper>
          )}

          {loading ? (
            <Paper
              elevation={0}
              sx={{
                minHeight: 420,
                borderRadius: '18px',
                display: 'grid',
                placeItems: 'center',
                bgcolor: colors.surface,
                border: `1px solid ${colors.border}`,
              }}
            >
              <CircularProgress sx={{ color: colors.primary }} />
            </Paper>
          ) : (
            <>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                  gap: 2,
                  mb: 4,
                }}
              >
                <StatCard
                  label="Calmest hour citywide"
                  value={quietestHour ? shortHour(quietestHour.hour) : '—'}
                  suffix={quietestHour ? formatDb(quietestHour.noiseDb) : undefined}
                />
                <StatCard
                  label="Busiest hour citywide"
                  value={busiestHour ? shortHour(busiestHour.hour) : '—'}
                  suffix={busiestHour ? formatDb(busiestHour.noiseDb) : undefined}
                />
                <StatCard label="Sensor places live" value={places.length || '—'} suffix="in network" />
              </Box>

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: 2,
                  mb: 2,
                }}
              >
                <Typography
                  sx={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    fontSize: '1.55rem',
                    fontWeight: 600,
                    color: colors.primary,
                  }}
                >
                  By place
                </Typography>

                <FormControl sx={{ minWidth: { xs: '100%', sm: 300 } }}>
                  <Select
                    value={selectedPlaceName}
                    disabled={places.length === 0}
                    onChange={(event) => {
                      const nextPlace = event.target.value;
                      setSelectedPlaceName(nextPlace);
                      loadTrendData(nextPlace);
                    }}
                    sx={{
                      height: 34,
                      borderRadius: '8px',
                      bgcolor: colors.surface,
                      color: colors.primary,
                      fontSize: '0.9rem',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.borderStrong,
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.primarySoft,
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: colors.primary,
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
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
                  gap: 2,
                  mb: 3,
                }}
              >
                <StatCard
                  label="Average"
                  value={averageNoise === null ? '—' : averageNoise.toFixed(1)}
                  suffix="dB"
                />
                <StatCard
                  label="Calmest"
                  value={quietestHour ? shortHour(quietestHour.hour) : '—'}
                  suffix={quietestHour ? formatDb(quietestHour.noiseDb) : undefined}
                />
                <StatCard
                  label="Loudest"
                  value={busiestHour ? shortHour(busiestHour.hour) : '—'}
                  suffix={busiestHour ? formatDb(busiestHour.noiseDb) : undefined}
                />
                <StatCard label="Readings" value={totalReadings.toLocaleString()} suffix="total" />
              </Box>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 2, md: 2.4 },
                  borderRadius: '18px',
                  bgcolor: colors.surface,
                  border: `1.5px solid ${colors.sage}`,
                  boxShadow: 'none',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    color: colors.mutedLight,
                    letterSpacing: '0.32em',
                    textTransform: 'uppercase',
                    mb: 3,
                  }}
                >
                  Hourly noise · {selectedPlace?.placeName || selectedPlaceName || 'Selected place'}
                </Typography>

                <Box sx={{ width: '100%', height: { xs: 300, md: 390 } }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 16, right: 26, left: 8, bottom: 18 }}>
                      <CartesianGrid stroke={colors.border} strokeDasharray="3 4" vertical={false} />
                      <XAxis
                        dataKey="shortLabel"
                        axisLine={false}
                        tickLine={false}
                        interval={2}
                        tick={{ fill: colors.mutedLight, fontSize: 12, fontFamily: 'monospace' }}
                      />
                      <YAxis
                        domain={[20, 45]}
                        ticks={[20, 30, 40]}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: colors.mutedLight, fontSize: 12, fontFamily: 'monospace' }}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(127,146,118,0.12)' }}
                        contentStyle={{
                          background: colors.surface,
                          border: `1px solid ${colors.borderStrong}`,
                          borderRadius: 12,
                          color: colors.primary,
                          boxShadow: '0 16px 40px rgba(36,60,53,0.10)',
                        }}
                        formatter={(value) => [`${Number(value).toFixed(1)} dB`, 'Noise']}
                        labelFormatter={(label) => `${label}:00`}
                      />
                      <Bar dataKey="value" radius={[4, 4, 4, 4]} barSize={28}>
                        {chartData.map((entry) => (
                          <Cell key={`cell-${entry.hour}`} fill={getBarColor(entry.noiseDb)} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                <Box sx={{ display: 'flex', gap: 2.2, flexWrap: 'wrap', mt: 1, color: colors.muted }}>
                  <LegendItem color={colors.sage} label="< 45 dB · Library quiet" />
                  <LegendItem color={colors.accent} label="46-60 dB · Calm" />
                  <LegendItem color="#2c4529ff" label="> 60 dB · Active" />
                </Box>
              </Paper>
            </>
          )}
        </Container>

        <Box
          sx={{
            borderTop: `1px solid ${colors.border}`,
            py: 2,
            mt: 4,
          }}
        >
          <Container maxWidth="xl">
            <Typography sx={{ color: colors.mutedLight, fontSize: '0.78rem' }}>
              Smart Living Melbourne · A quieter way to read the city · v0.3
            </Typography>
          </Container>
        </Box>
      </Box>
    </>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
      <Box sx={{ width: 10, height: 10, borderRadius: '2px', bgcolor: color }} />
      <Typography
        sx={{
          fontSize: '0.75rem',
          color: colors.muted,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
}
