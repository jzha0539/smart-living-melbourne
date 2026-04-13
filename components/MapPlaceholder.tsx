'use client';

import * as React from 'react';
import mapboxgl from 'mapbox-gl';
import { Box, Paper, Typography } from '@mui/material';
import { Space } from '../types/space';

type MapPlaceholderProps = {
  spaces: Space[];
  selectedSpaceId?: number | null;
  onSelectSpace?: (spaceId: number) => void;
};

const FALLBACK_COORDS: Record<string, [number, number]> = {
  'Melbourne CBD': [144.9631, -37.8136],
  Carlton: [144.9671, -37.8008],
  Docklands: [144.9465, -37.814],
  'West Melbourne': [144.949, -37.808],
  Southbank: [144.965, -37.823],
};

function getCoords(space: Space, index: number): [number, number] {
  const spaceWithCoords = space as Space & {
    latitude?: number;
    longitude?: number;
  };

  const hasRealCoords =
    typeof spaceWithCoords.longitude === 'number' &&
    typeof spaceWithCoords.latitude === 'number';

  const baseCoords: [number, number] = hasRealCoords
    ? [spaceWithCoords.longitude!, spaceWithCoords.latitude!]
    : FALLBACK_COORDS[space.suburb] ?? [144.9631, -37.8136];

  const angle = (index % 8) * (Math.PI / 4);
  const ring = Math.floor(index / 8) + 1;
  const offset = 0.0022 * ring;

  return [
    baseCoords[0] + Math.cos(angle) * offset,
    baseCoords[1] + Math.sin(angle) * offset,
  ];
}

export default function MapPlaceholder({
  spaces,
  selectedSpaceId = null,
  onSelectSpace,
}: MapPlaceholderProps) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markersRef = React.useRef<mapboxgl.Marker[]>([]);
  const coordsMapRef = React.useRef<Map<number, [number, number]>>(new Map());
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
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [144.9631, -37.8136],
      zoom: 12,
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      coordsMapRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];
    coordsMapRef.current.clear();

    if (!spaces.length) return;

    const bounds = new mapboxgl.LngLatBounds();

    spaces.forEach((space, index) => {
      const coords = getCoords(space, index);
      coordsMapRef.current.set(space.id, coords);

      const markerElement = document.createElement('div');
      const isSelected = selectedSpaceId === space.id;

      markerElement.style.width = isSelected ? '22px' : '18px';
      markerElement.style.height = isSelected ? '22px' : '18px';
      markerElement.style.borderRadius = '999px';
      markerElement.style.background = isSelected ? '#4F46E5' : '#0EA5E9';
      markerElement.style.border = '2px solid white';
      markerElement.style.boxShadow = isSelected
        ? '0 0 0 6px rgba(79,70,229,0.18)'
        : '0 6px 16px rgba(15,23,42,0.18)';
      markerElement.style.cursor = 'pointer';
      markerElement.style.transition = 'all 0.2s ease';

      markerElement.addEventListener('click', () => {
        onSelectSpace?.(space.id);
      });

      const popup = new mapboxgl.Popup({ offset: 18 }).setHTML(`
        <div style="font-family: Arial, sans-serif; min-width: 180px;">
          <strong>${space.name}</strong><br/>
          ${space.suburb}<br/>
          Category: ${space.category}<br/>
          Noise: ${space.noiseDb} dB<br/>
          Comfort: ${space.comfort}/100<br/>
          Shade: ${space.shade}%
        </div>
      `);

      const marker = new mapboxgl.Marker({ element: markerElement })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend(coords);
    });

    if (spaces.length === 1) {
      map.flyTo({
        center: bounds.getCenter(),
        zoom: 14,
        essential: true,
      });
    } else {
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
        duration: 800,
      });
    }
  }, [spaces, selectedSpaceId, onSelectSpace]);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedSpaceId) return;

    const coords = coordsMapRef.current.get(selectedSpaceId);
    if (!coords) return;

    map.flyTo({
      center: coords,
      zoom: 14.5,
      essential: true,
      duration: 900,
    });
  }, [selectedSpaceId]);

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