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
import LocalPhoneRoundedIcon from '@mui/icons-material/LocalPhoneRounded';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import WbSunnyRoundedIcon from '@mui/icons-material/WbSunnyRounded';
import AirRoundedIcon from '@mui/icons-material/AirRounded';
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
  poiId: string;
  googlePlaceId: string;
  placeName: string;
  placeType: string;
  category: string;
  address: string;
  suburb: string;
  postcode: string;
  latitude: number;
  longitude: number;
  rating: number;
  ratingCount: number;
  phone: string;
  openingHours: string;
  openingSummary: string;
  is24_7: boolean;
  openHours: number[];
  baseNoiseDb: number;
  baseWindSpeed: number;
  baseTemperature: number;
  baseHumidity: number;
  readingCount: number;
  createdAt: string | null;
};

type HourTrend = {
  hour: number;
  label: string;
  range: string;
  noiseDb: number;
  minNoise: number;
  maxNoise: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  comfortScore: number;
  comfortLabel: string;
  readingCount: number;
  zone: string;
  isOpen: boolean;
};

type TrendsSummary = {
  totalPlaces: number;
  categorySummary: Record<string, number>;
  quietest: HourTrend | null;
  busiest: HourTrend | null;
  mostComfortable: HourTrend | null;
  averageNoise: number | null;
  averageComfort: number | null;
};

type TrendsResponse = {
  success: boolean;
  places: PlaceOption[];
  selectedPlaceName: string | null;
  selectedPlace: PlaceOption | null;
  hourlyData: HourTrend[];
  summary: TrendsSummary | null;
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

function shortHour(hour: number) {
  return String(hour).padStart(2, '0');
}

function formatCategory(category: string) {
  if (!category) return 'Lifestyle';
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getBarColor(value: number | null) {
  if (value === null) return colors.border;
  if (value < 45) return colors.sage;
  if (value <= 60) return colors.accent;
  return '#2c4529ff';
}

function getComfortColor(value: number) {
  if (value >= 80) return colors.sage;
  if (value >= 60) return colors.accent;
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  if (!value) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1.1, alignItems: 'flex-start' }}>
      <Box sx={{ color: colors.primarySoft, mt: '2px' }}>{icon}</Box>
      <Box>
        <Typography
          sx={{
            fontSize: '0.68rem',
            textTransform: 'uppercase',
            letterSpacing: '0.18em',
            color: colors.mutedLight,
            fontWeight: 700,
            mb: 0.2,
          }}
        >
          {label}
        </Typography>
        <Typography sx={{ fontSize: '0.9rem', color: colors.primary, lineHeight: 1.45 }}>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function TrendsPage() {
  const [places, setPlaces] = React.useState<PlaceOption[]>([]);
  const [selectedPlaceName, setSelectedPlaceName] = React.useState('');
  const [selectedPlace, setSelectedPlace] = React.useState<PlaceOption | null>(null);
  const [hourlyData, setHourlyData] = React.useState<HourTrend[]>([]);
  const [summary, setSummary] = React.useState<TrendsSummary | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const loadTrendData = React.useCallback(async (placeName?: string) => {
    try {
      setLoading(true);
      setError('');

      const query = placeName ? `?placeName=${encodeURIComponent(placeName)}` : '';
      const response = await fetch(`/api/trends${query}`, { cache: 'no-store' });

      if (!response.ok) throw new Error('Failed to load trend data');

      const data: TrendsResponse = await response.json();

      setPlaces(data.places || []);
      setSelectedPlaceName(data.selectedPlaceName || '');
      setSelectedPlace(data.selectedPlace || null);
      setHourlyData(data.hourlyData || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error(err);
      setError('Unable to load POI trend data.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadTrendData();
  }, [loadTrendData]);

  const quietestHour = summary?.quietest ?? null;
  const busiestHour = summary?.busiest ?? null;
  const mostComfortableHour = summary?.mostComfortable ?? null;

  const averageNoise = summary?.averageNoise ?? null;
  const averageComfort = summary?.averageComfort ?? null;

  const chartData = React.useMemo(
    () =>
      hourlyData.map((item) => ({
        ...item,
        shortLabel: shortHour(item.hour),
        value: item.noiseDb,
      })),
    [hourlyData]
  );

  const openHourText = React.useMemo(() => {
    if (!selectedPlace) return '—';

    if (selectedPlace.is24_7) return 'Open 24 hours';

    if (selectedPlace.openingSummary) return selectedPlace.openingSummary;

    return 'Hours vary';
  }, [selectedPlace]);

  return (
    <>
      <AppNavbar />

      <Box
        sx={{
          minHeight: 'auto',
          bgcolor: colors.background,
          background: `radial-gradient(circle at 28% 8%, rgba(255, 253, 248, 0.9), transparent 34%), ${colors.background}`,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <Container maxWidth="xl" sx={{ pt: { xs: 3, md: 4 }, pb: { xs: 2, md: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 2,
              mb: 4,
            }}
          >
            <Box sx={{ maxWidth: 840 }}>
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
                POI environmental trend
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
                When does this place{' '}
                <Box component="em" sx={{ fontStyle: 'italic', color: colors.primarySoft }}>
                  feel calmer?
                </Box>
              </Typography>

              <Typography sx={{ fontSize: '1.05rem', color: colors.muted, lineHeight: 1.55 }}>
                Explore estimated noise and comfort patterns during each place&apos;s opening
                hours. The chart only shows the hours when the selected place is available.
              </Typography>
            </Box>

            <Box
              sx={{
                flexShrink: 0,
                px: 1.15,
                py: 0.45,
                mt: 0.1,
                borderRadius: 999,
                border: `1px solid ${colors.border}`,
                bgcolor: 'rgba(255,253,248,0.68)',
                color: colors.muted,
                display: { xs: 'none', sm: 'inline-flex' },
                alignItems: 'center',
                gap: 0.55,
                fontSize: '0.72rem',
                fontWeight: 700,
                lineHeight: 1,
                letterSpacing: '0.02em',
                cursor: 'default',
                userSelect: 'none',
                boxShadow: 'none',
                pointerEvents: 'none',
              }}
            >
              <AccessTimeRoundedIcon sx={{ fontSize: 14 }} />
              Opening-hour pattern
            </Box>
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
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' },
                  gap: 2,
                  mb: 4,
                }}
              >
                <StatCard
                  label="Calmest open hour"
                  value={quietestHour ? shortHour(quietestHour.hour) : '—'}
                  suffix={quietestHour ? formatDb(quietestHour.noiseDb) : undefined}
                />
                <StatCard
                  label="Busiest open hour"
                  value={busiestHour ? shortHour(busiestHour.hour) : '—'}
                  suffix={busiestHour ? formatDb(busiestHour.noiseDb) : undefined}
                />
                <StatCard
                  label="Best comfort"
                  value={mostComfortableHour ? shortHour(mostComfortableHour.hour) : '—'}
                  suffix={mostComfortableHour ? `${mostComfortableHour.comfortScore}/100` : undefined}
                />
                <StatCard
                  label="Opening hours"
                  value={selectedPlace?.is24_7 ? '24H' : `${hourlyData.length || '—'}h`}
                  suffix={selectedPlace?.is24_7 ? 'open' : 'shown'}
                />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '340px 1fr' },
                  gap: 3,
                  alignItems: 'start',
                }}
              >
                <Paper
                  elevation={0}
                  sx={{
                    p: 2.4,
                    borderRadius: '18px',
                    bgcolor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    boxShadow: 'none',
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily: 'Georgia, "Times New Roman", serif',
                      fontSize: '1.45rem',
                      fontWeight: 600,
                      color: colors.primary,
                      mb: 2,
                    }}
                  >
                    Choose a place
                  </Typography>

                  <FormControl sx={{ width: '100%', mb: 2.5 }}>
                    <Select
                      value={selectedPlaceName}
                      disabled={places.length === 0}
                      onChange={(event) => {
                        const nextPlace = event.target.value;
                        setSelectedPlaceName(nextPlace);
                        loadTrendData(nextPlace);
                      }}
                      sx={{
                        height: 40,
                        borderRadius: '10px',
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
                        <MenuItem key={place.poiId || place.placeName} value={place.placeName}>
                          {place.placeName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {selectedPlace && (
                    <Box sx={{ display: 'grid', gap: 1.8 }}>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                            letterSpacing: '0.22em',
                            color: colors.mutedLight,
                            fontWeight: 700,
                            mb: 0.8,
                          }}
                        >
                          Selected POI
                        </Typography>

                        <Typography
                          sx={{
                            fontSize: '1.35rem',
                            fontWeight: 700,
                            color: colors.primary,
                            lineHeight: 1.15,
                          }}
                        >
                          {selectedPlace.placeName}
                        </Typography>

                        <Typography sx={{ mt: 0.6, color: colors.muted, fontSize: '0.9rem' }}>
                          {formatCategory(selectedPlace.category)} · {selectedPlace.suburb}
                        </Typography>
                      </Box>

                      <InfoRow
                        icon={<PlaceRoundedIcon sx={{ fontSize: 18 }} />}
                        label="Address"
                        value={selectedPlace.address}
                      />

                      <InfoRow
                        icon={<StarRoundedIcon sx={{ fontSize: 18 }} />}
                        label="Rating"
                        value={
                          selectedPlace.rating
                            ? `${selectedPlace.rating.toFixed(1)} from ${selectedPlace.ratingCount.toLocaleString()} reviews`
                            : 'No rating available'
                        }
                      />

                      <InfoRow
                        icon={<LocalPhoneRoundedIcon sx={{ fontSize: 18 }} />}
                        label="Phone"
                        value={selectedPlace.phone}
                      />

                      <InfoRow
                        icon={<AccessTimeRoundedIcon sx={{ fontSize: 18 }} />}
                        label="Opening hours"
                        value={openHourText}
                      />

                      <InfoRow
                        icon={<WbSunnyRoundedIcon sx={{ fontSize: 18 }} />}
                        label="Environment"
                        value={`${selectedPlace.baseTemperature.toFixed(1)}°C · ${selectedPlace.baseHumidity.toFixed(0)}% humidity`}
                      />

                      <InfoRow
                        icon={<AirRoundedIcon sx={{ fontSize: 18 }} />}
                        label="Wind and noise"
                        value={`${selectedPlace.baseWindSpeed.toFixed(1)} km/h wind · ${selectedPlace.baseNoiseDb.toFixed(1)} dB base noise`}
                      />
                    </Box>
                  )}
                </Paper>

                <Box>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                      gap: 2,
                      mb: 3,
                    }}
                  >
                    <StatCard
                      label="Average open-hour noise"
                      value={averageNoise === null ? '—' : averageNoise.toFixed(1)}
                      suffix="dB"
                    />
                    <StatCard
                      label="Average open-hour comfort"
                      value={averageComfort === null ? '—' : averageComfort}
                      suffix="/100"
                    />
                    <StatCard
                      label="Category"
                      value={selectedPlace ? formatCategory(selectedPlace.category) : '—'}
                    />
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
                      Estimated open-hour noise · {selectedPlace?.placeName || 'Selected place'}
                    </Typography>

                    {chartData.length === 0 ? (
                      <Box
                        sx={{
                          height: { xs: 260, md: 360 },
                          display: 'grid',
                          placeItems: 'center',
                          color: colors.muted,
                          border: `1px dashed ${colors.border}`,
                          borderRadius: '14px',
                        }}
                      >
                        No opening-hour data available for this place.
                      </Box>
                    ) : (
                      <Box sx={{ width: '100%', height: { xs: 300, md: 390 } }}>
                        <ResponsiveContainer>
                          <BarChart
                            data={chartData}
                            margin={{ top: 16, right: 26, left: 8, bottom: 18 }}
                          >
                            <CartesianGrid stroke={colors.border} strokeDasharray="3 4" vertical={false} />
                            <XAxis
                              dataKey="shortLabel"
                              axisLine={false}
                              tickLine={false}
                              interval={0}
                              tick={{ fill: colors.mutedLight, fontSize: 12, fontFamily: 'monospace' }}
                            />
                            <YAxis
                              domain={[20, 85]}
                              ticks={[20, 40, 60, 80]}
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
                              formatter={(value, name) => {
                                if (name === 'value') return [`${Number(value).toFixed(1)} dB`, 'Noise'];
                                return [value, name];
                              }}
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
                    )}

                    <Box sx={{ display: 'flex', gap: 2.2, flexWrap: 'wrap', mt: 1, color: colors.muted }}>
                      <LegendItem color={colors.sage} label="< 45 dB · Library quiet" />
                      <LegendItem color={colors.accent} label="46–60 dB · Calm" />
                      <LegendItem color="#2c4529ff" label="> 60 dB · Active" />
                    </Box>
                  </Paper>

                  <Paper
                    elevation={0}
                    sx={{
                      mt: 2,
                      p: { xs: 2, md: 2.4 },
                      borderRadius: '18px',
                      bgcolor: colors.surface,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        color: colors.mutedLight,
                        letterSpacing: '0.32em',
                        textTransform: 'uppercase',
                        mb: 2,
                      }}
                    >
                      Estimated open-hour comfort
                    </Typography>

                    {hourlyData.length === 0 ? (
                      <Typography sx={{ color: colors.muted }}>
                        No comfort data available during opening hours.
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'grid', gap: 1 }}>
                        {hourlyData.slice(0, 8).map((item) => (
                          <Box
                            key={item.hour}
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '64px 1fr 72px',
                              alignItems: 'center',
                              gap: 1.5,
                            }}
                          >
                            <Typography
                              sx={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                fontSize: '0.82rem',
                                color: colors.muted,
                              }}
                            >
                              {item.label}
                            </Typography>

                            <Box
                              sx={{
                                height: 9,
                                borderRadius: 999,
                                bgcolor: colors.surfaceSoft,
                                overflow: 'hidden',
                                border: `1px solid ${colors.border}`,
                              }}
                            >
                              <Box
                                sx={{
                                  width: `${item.comfortScore}%`,
                                  height: '100%',
                                  bgcolor: getComfortColor(item.comfortScore),
                                }}
                              />
                            </Box>

                            <Typography
                              sx={{
                                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                                fontSize: '0.82rem',
                                color: colors.primary,
                                textAlign: 'right',
                                fontWeight: 700,
                              }}
                            >
                              {item.comfortScore}/100
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
            </>
          )}
        </Container>
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