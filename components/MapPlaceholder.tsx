'use client';

import * as React from 'react';
import mapboxgl from 'mapbox-gl';
import { Box, Paper, Typography } from '@mui/material';
import { Space } from '../types/space';

interface MapPlaceholderProps {
  spaces: Space[];
  selectedSpaceId?: number | null;
  onSelectSpace?: (spaceId: number) => void;
}

const FALLBACK_COORDS: Record<string, [number, number]> = {
  'Melbourne CBD': [144.9631, -37.8136],
  Carlton: [144.9671, -37.8008],
  Docklands: [144.9465, -37.814],
  'West Melbourne': [144.949, -37.808],
  Southbank: [144.965, -37.823],
};

export default function MapPlaceholder({
  spaces,
  selectedSpaceId,
  onSelectSpace,
}: MapPlaceholderProps) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markersRef = React.useRef<mapboxgl.Marker[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!token) {
      setError('Missing NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN');
      return;
    }

    if (!mapContainerRef.current || mapRef.current) return;

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/standard',
      center: [144.9631, -37.8136],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (spaces.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    spaces.forEach((space) => {
      const coords: [number, number] =
        typeof space.longitude === 'number' &&
        typeof space.latitude === 'number'
          ? [space.longitude, space.latitude]
          : FALLBACK_COORDS[space.suburb] ?? [144.9631, -37.8136];

      const el = document.createElement('div');
      el.style.width = '16px';
      el.style.height = '16px';
      el.style.borderRadius = '999px';
      el.style.background =
        selectedSpaceId === space.id ? '#4f46e5' : '#0ea5e9';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 4px 10px rgba(15,23,42,0.2)';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        onSelectSpace?.(space.id);
      });

      const popup = new mapboxgl.Popup({ offset: 20 }).setHTML(`
        <div style="font-family: Arial, sans-serif; min-width: 180px;">
          <strong>${space.name}</strong><br/>
          ${space.suburb}<br/>
          Noise: ${space.noiseDb} dB<br/>
          Comfort: ${space.comfort}/100
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend(coords);
    });

    map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
  }, [spaces, selectedSpaceId, onSelectSpace]);

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 360,
        borderRadius: '32px',
        overflow: 'hidden',
        border: '1px solid #e2e8f0',
        boxShadow: '0 12px 40px rgba(15, 23, 42, 0.08)',
        bgcolor: 'white',
      }}
    >
      {error ? (
        <Box sx={{ p: 3 }}>
          <Typography color="error.main">{error}</Typography>
        </Box>
      ) : (
        <Box ref={mapContainerRef} sx={{ width: '100%', height: 420 }} />
      )}
    </Paper>
  );
}