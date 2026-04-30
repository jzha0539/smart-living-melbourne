'use client';

import * as React from 'react';
import { Box, Chip, Container, Paper, Typography } from '@mui/material';
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

type HourTrend = {
  hour: number;
  label: string;
  range: string;
  noiseDb: number;
  zone: string;
};

const hourlyData: HourTrend[] = [
  { hour: 0, label: '00', range: '12:00 AM - 1:00 AM', noiseDb: 68.9, zone: 'Active Zone' },
  { hour: 1, label: '01', range: '1:00 AM - 2:00 AM', noiseDb: 69.2, zone: 'Active Zone' },
  { hour: 2, label: '02', range: '2:00 AM - 3:00 AM', noiseDb: 69.6, zone: 'Active Zone' },
  { hour: 3, label: '03', range: '3:00 AM - 4:00 AM', noiseDb: 69.8, zone: 'Active Zone' },
  { hour: 4, label: '04', range: '4:00 AM - 5:00 AM', noiseDb: 69.9, zone: 'Active Zone' },
  { hour: 5, label: '05', range: '5:00 AM - 6:00 AM', noiseDb: 69.8, zone: 'Active Zone' },
  { hour: 6, label: '06', range: '6:00 AM - 7:00 AM', noiseDb: 69.7, zone: 'Active Zone' },
  { hour: 7, label: '07', range: '7:00 AM - 8:00 AM', noiseDb: 69.0, zone: 'Active Zone' },
  { hour: 8, label: '08', range: '8:00 AM - 9:00 AM', noiseDb: 68.0, zone: 'Active Zone' },
  { hour: 9, label: '09', range: '9:00 AM - 10:00 AM', noiseDb: 67.0, zone: 'Active Zone' },
  { hour: 10, label: '10', range: '10:00 AM - 11:00 AM', noiseDb: 66.1, zone: 'Active Zone' },
  { hour: 11, label: '11', range: '11:00 AM - 12:00 PM', noiseDb: 65.6, zone: 'Active Zone' },
  { hour: 12, label: '12', range: '12:00 PM - 1:00 PM', noiseDb: 65.1, zone: 'Active Zone' },
  { hour: 13, label: '13', range: '1:00 PM - 2:00 PM', noiseDb: 64.0, zone: 'Active Zone' },
  { hour: 14, label: '14', range: '2:00 PM - 3:00 PM', noiseDb: 62.8, zone: 'Active Zone' },
  { hour: 15, label: '15', range: '3:00 PM - 4:00 PM', noiseDb: 61.9, zone: 'Active Zone' },
  { hour: 16, label: '16', range: '4:00 PM - 5:00 PM', noiseDb: 61.5, zone: 'Active Zone' },
  { hour: 17, label: '17', range: '5:00 PM - 6:00 PM', noiseDb: 61.6, zone: 'Active Zone' },
  { hour: 18, label: '18', range: '6:00 PM - 7:00 PM', noiseDb: 62.7, zone: 'Active Zone' },
  { hour: 19, label: '19', range: '7:00 PM - 8:00 PM', noiseDb: 64.4, zone: 'Active Zone' },
  { hour: 20, label: '20', range: '8:00 PM - 9:00 PM', noiseDb: 66.0, zone: 'Active Zone' },
  { hour: 21, label: '21', range: '9:00 PM - 10:00 PM', noiseDb: 67.2, zone: 'Active Zone' },
  { hour: 22, label: '22', range: '10:00 PM - 11:00 PM', noiseDb: 68.0, zone: 'Active Zone' },
  { hour: 23, label: '23', range: '11:00 PM - 12:00 AM', noiseDb: 68.4, zone: 'Active Zone' },
];

function formatDb(value: number) {
  return `${value.toFixed(1)} dB`;
}

export default function TrendsPage() {
  const quietestHour = React.useMemo(
    () =>
      hourlyData.reduce((min, item) => (item.noiseDb < min.noiseDb ? item : min), hourlyData[0]),
    []
  );

  const busiestHour = React.useMemo(
    () =>
      hourlyData.reduce((max, item) => (item.noiseDb > max.noiseDb ? item : max), hourlyData[0]),
    []
  );

  const averageNoise = React.useMemo(() => {
    return hourlyData.reduce((sum, item) => sum + item.noiseDb, 0) / hourlyData.length;
  }, []);

  const [activeHour, setActiveHour] = React.useState<HourTrend>(quietestHour);

  const chartMin = Math.floor(Math.min(...hourlyData.map((d) => d.noiseDb)) - 2);
  const chartMax = Math.ceil(Math.max(...hourlyData.map((d) => d.noiseDb)) + 2);

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
            Explore historical hourly patterns to find better times to visit.
          </Typography>

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
                      dot={(props: any) => {
                        const { cx, cy, payload } = props;
                        const isActive = payload?.hour === activeHour.hour;

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
                    {quietestHour.range}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.6 }}>
                    {formatDb(quietestHour.noiseDb)} average
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
                    {busiestHour.range}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.6 }}>
                    {formatDb(busiestHour.noiseDb)} average
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
                    Across 24 hourly readings
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
                      {activeHour.range}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {formatDb(activeHour.noiseDb)} average · {activeHour.zone}
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
                      {(busiestHour.noiseDb - quietestHour.noiseDb).toFixed(1)} dB
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
                      Try visiting around {quietestHour.range}
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      Compared with the busiest period, this quieter window can help reduce
                      distractions and make study or breaks more predictable.
                    </Typography>
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        </Container>
      </Box>
    </>
  );
}