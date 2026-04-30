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
    const styleId = 'slm-map-marker-animations';

    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes slm-marker-pulse {
        0% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(88,80,236,0.36), 0 10px 24px rgba(88,80,236,0.28);
        }
        50% {
          transform: scale(1.18);
          box-shadow: 0 0 0 14px rgba(88,80,236,0.10), 0 10px 28px rgba(88,80,236,0.42);
        }
        100% {
          transform: scale(1);
          box-shadow: 0 0 0 0 rgba(88,80,236,0), 0 10px 24px rgba(88,80,236,0.28);
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

    if (spaces.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    let selectedCoords: [number, number] | null = null;

    spaces.forEach((space) => {
      const coords: [number, number] =
        typeof space.longitude === 'number' && typeof space.latitude === 'number'
          ? [space.longitude, space.latitude]
          : FALLBACK_COORDS[space.suburb] ?? [144.9631, -37.8136];

      const isSelected = selectedSpaceId === space.id;

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
      inner.style.background = isSelected ? '#5850ec' : '#0ea5e9';
      inner.style.border = '3px solid white';
      inner.style.boxShadow = isSelected
        ? '0 0 0 10px rgba(88,80,236,0.18), 0 10px 24px rgba(88,80,236,0.35)'
        : '0 6px 14px rgba(14,165,233,0.28)';
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
        ring.style.border = '2px solid rgba(88,80,236,0.35)';
        ring.style.transform = 'translate(-50%, -50%)';
        ring.style.pointerEvents = 'none';
        ring.style.animation = 'slm-marker-ring 1.35s ease-out infinite';
        inner.appendChild(ring);

        selectedCoords = coords;
      }

      el.appendChild(inner);

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

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: 'center',
      })
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(map);

      if (isSelected) {
        popup.addTo(map);
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
    } else {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
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