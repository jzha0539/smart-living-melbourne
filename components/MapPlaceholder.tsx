'use client';

import * as React from 'react';
import mapboxgl from 'mapbox-gl';
import { Box, Paper, Typography } from '@mui/material';
import { Space } from '../types/space';

interface MapPlaceholderProps {
  spaces: Space[];
  selectedSpaceId?: string | number | null;
  onSelectSpace?: (spaceId: string | number) => void;
}

function getSpaceId(space: Space): string {
  const record = space as unknown as Record<string, unknown>;

  return String(
    record.poiId ??
      record.poi_id ??
      record.googlePlaceId ??
      record.google_place_id ??
      space.id ??
      `${space.name}-${space.latitude}-${space.longitude}`
  );
}

function getNumberValue(space: Space, keys: string[], fallback = Number.NaN) {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }

    if (
      typeof value === 'string' &&
      value.trim() &&
      !Number.isNaN(Number(value))
    ) {
      return Number(value);
    }
  }

  return fallback;
}

function getStringValue(space: Space, keys: string[], fallback = '') {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) {
      return value;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function getCoords(space: Space): [number, number] | null {
  const longitude = getNumberValue(space, ['longitude']);
  const latitude = getNumberValue(space, ['latitude']);

  if (
    Number.isFinite(longitude) &&
    Number.isFinite(latitude) &&
    latitude >= -39 &&
    latitude <= -36 &&
    longitude >= 143 &&
    longitude <= 146
  ) {
    return [longitude, latitude];
  }

  return null;
}

export default function MapPlaceholder({
  spaces,
  selectedSpaceId,
  onSelectSpace,
}: MapPlaceholderProps) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markersRef = React.useRef<mapboxgl.Marker[]>([]);
  const onSelectSpaceRef = React.useRef<MapPlaceholderProps['onSelectSpace']>(
    onSelectSpace
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    onSelectSpaceRef.current = onSelectSpace;
  }, [onSelectSpace]);

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
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const styleId = 'slm-map-marker-animations';

    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes slm-marker-pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(79,107,87,0.36), 0 10px 24px rgba(79,107,87,0.28);
        }
        50% {
          transform: scale(1.16);
          box-shadow: 0 0 0 14px rgba(79,107,87,0.10), 0 10px 28px rgba(79,107,87,0.42);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(79,107,87,0), 0 10px 24px rgba(79,107,87,0.28);
        }
      }

      @keyframes slm-marker-ring {
        0% {
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0.95;
        }
        100% {
          transform: translate(-50%, -50%) scale(1.8);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const validSpaces = spaces
      .map((space) => ({
        space,
        id: getSpaceId(space),
        coords: getCoords(space),
      }))
      .filter(
        (item): item is { space: Space; id: string; coords: [number, number] } =>
          item.coords !== null
      );

    if (!validSpaces.length) return;

    const bounds = new mapboxgl.LngLatBounds();
    let selectedCoords: [number, number] | null = null;

    validSpaces.forEach(({ space, id, coords }) => {
      const isSelected = String(selectedSpaceId) === id;

      const el = document.createElement('div');
      el.style.position = 'relative';
      el.style.width = '32px';
      el.style.height = '32px';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.cursor = 'pointer';

      const inner = document.createElement('div');
      inner.style.position = 'relative';
      inner.style.width = isSelected ? '24px' : '16px';
      inner.style.height = isSelected ? '24px' : '16px';
      inner.style.borderRadius = '999px';
      inner.style.background = isSelected ? '#4F6B57' : '#D8845F';
      inner.style.border = '3px solid #FFFDF8';
      inner.style.boxShadow = isSelected
        ? '0 0 0 10px rgba(79,107,87,0.18), 0 10px 24px rgba(79,107,87,0.35)'
        : '0 6px 14px rgba(216,132,95,0.28)';
      inner.style.transition = 'all 0.25s ease';

      if (isSelected) {
        inner.style.animation = 'slm-marker-pulse 1.35s ease-in-out infinite';

        const ring = document.createElement('div');
        ring.style.position = 'absolute';
        ring.style.left = '50%';
        ring.style.top = '50%';
        ring.style.width = '24px';
        ring.style.height = '24px';
        ring.style.borderRadius = '999px';
        ring.style.border = '2px solid rgba(79,107,87,0.35)';
        ring.style.transform = 'translate(-50%, -50%)';
        ring.style.pointerEvents = 'none';
        ring.style.animation = 'slm-marker-ring 1.35s ease-out infinite';
        inner.appendChild(ring);

        selectedCoords = coords;
      }

      el.appendChild(inner);

      el.addEventListener('click', () => {
        onSelectSpaceRef.current?.(id);
      });

      const suburb = getStringValue(space, ['suburb'], '');
      const category = getStringValue(space, ['category'], '');
      const noise = getNumberValue(space, ['noiseDb', 'noise_db'], 0);
      const comfort = getNumberValue(space, ['comfort'], 0);

      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
      }).setHTML(`
        <div style="font-family: Arial, sans-serif; min-width: 180px;">
          <strong>${space.name}</strong><br/>
          ${suburb}${category ? ` · ${category}` : ''}<br/>
          Noise: ${Math.round(noise)} dB<br/>
          Comfort: ${Math.round(comfort)}/100
        </div>
      `);

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      if (isSelected) {
        marker.togglePopup();
      }

      markersRef.current.push(marker);
      bounds.extend(coords);
    });

    if (selectedCoords) {
      map.flyTo({
        center: selectedCoords,
        zoom: 15,
        speed: 1.1,
        curve: 1.2,
        essential: true,
      });
    } else if (!bounds.isEmpty()) {
      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 14,
        duration: 700,
      });
    }
  }, [spaces, selectedSpaceId]);

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 360,
        borderRadius: '18px',
        overflow: 'hidden',
        border: '1px solid #ded2bd',
        boxShadow: '0 12px 40px rgba(87,72,48,0.08)',
        bgcolor: '#fffaf1',
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