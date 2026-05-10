'use client';

import * as React from 'react';
import mapboxgl from 'mapbox-gl';
import { Box, Paper, Typography } from '@mui/material';
import { Space } from '../types/space';

interface MapPlaceholderProps {
  spaces: Space[];
  selectedSpaceId?: string | number | null;
  onSelectSpace?: (spaceId: string) => void;
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

function getNumberValue(space: Space, keys: string[], fallback = 0): number {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'number' && Number.isFinite(value)) return value;

    if (typeof value === 'string' && value.trim() && !Number.isNaN(Number(value))) {
      return Number(value);
    }
  }

  return fallback;
}

function getStringValue(space: Space, keys: string[], fallback = ''): string {
  const record = space as unknown as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];

    if (typeof value === 'string' && value.trim()) return value;

    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
  }

  return fallback;
}

function hasValidCoordinates(space: Space): boolean {
  const latitude = getNumberValue(space, ['latitude'], Number.NaN);
  const longitude = getNumberValue(space, ['longitude'], Number.NaN);

  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -39 &&
    latitude <= -36 &&
    longitude >= 143 &&
    longitude <= 146
  );
}

function getSpaceCoords(space: Space): [number, number] | null {
  if (!hasValidCoordinates(space)) return null;

  const latitude = getNumberValue(space, ['latitude'], Number.NaN);
  const longitude = getNumberValue(space, ['longitude'], Number.NaN);

  return [longitude, latitude];
}

export default function MapPlaceholder({
  spaces,
  selectedSpaceId,
  onSelectSpace,
}: MapPlaceholderProps) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const mapRef = React.useRef<mapboxgl.Map | null>(null);
  const markersRef = React.useRef<mapboxgl.Marker[]>([]);
  const popupRef = React.useRef<mapboxgl.Popup | null>(null);
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
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }

      map.remove();
      mapRef.current = null;
    };
  }, []);

  React.useEffect(() => {
    const styleId = 'slm-map-clean-marker-style';

    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.innerHTML = `
      @keyframes slm-selected-marker-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(79,107,87,0.32), 0 8px 18px rgba(36,60,53,0.24);
        }
        60% {
          box-shadow: 0 0 0 14px rgba(79,107,87,0.06), 0 8px 22px rgba(36,60,53,0.28);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(79,107,87,0), 0 8px 18px rgba(36,60,53,0.24);
        }
      }

      .slm-map-popup .mapboxgl-popup-content {
        border-radius: 14px;
        border: 1px solid #D8CBB8;
        box-shadow: 0 18px 36px rgba(36,60,53,0.16);
        padding: 14px;
      }

      .slm-map-popup .mapboxgl-popup-close-button {
        font-size: 16px;
        color: #243C35;
        padding: 6px 8px;
      }
    `;

    document.head.appendChild(style);
  }, []);

  React.useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    const validSpaces = spaces.filter((space) => {
      const id = getSpaceId(space);
      const coords = getSpaceCoords(space);

      return Boolean(id) && Boolean(coords);
    });

    if (validSpaces.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();
    const selectedIdString = selectedSpaceId === null || selectedSpaceId === undefined
      ? null
      : String(selectedSpaceId);

    validSpaces.forEach((space) => {
      const id = getSpaceId(space);
      const coords = getSpaceCoords(space);

      if (!coords) return;

      const isSelected = selectedIdString === id;

      const markerEl = document.createElement('button');
      markerEl.type = 'button';
      markerEl.setAttribute('aria-label', getStringValue(space, ['name'], 'Map place'));
      markerEl.style.width = isSelected ? '22px' : '16px';
      markerEl.style.height = isSelected ? '22px' : '16px';
      markerEl.style.borderRadius = '999px';
      markerEl.style.border = '3px solid #FFFDF8';
      markerEl.style.background = isSelected ? '#4F6B57' : '#D8845F';
      markerEl.style.cursor = 'pointer';
      markerEl.style.padding = '0';
      markerEl.style.margin = '0';
      markerEl.style.display = 'block';
      markerEl.style.boxSizing = 'border-box';
      markerEl.style.transition = 'width 0.2s ease, height 0.2s ease, background 0.2s ease';
      markerEl.style.boxShadow = isSelected
        ? '0 0 0 8px rgba(79,107,87,0.18), 0 8px 18px rgba(36,60,53,0.24)'
        : '0 6px 14px rgba(216,132,95,0.26)';

      if (isSelected) {
        markerEl.style.animation = 'slm-selected-marker-pulse 1.35s ease-in-out infinite';
      }

      markerEl.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        onSelectSpace?.(id);
      });

      const marker = new mapboxgl.Marker({
        element: markerEl,
        anchor: 'center',
      })
        .setLngLat(coords)
        .addTo(map);

      markersRef.current.push(marker);
      bounds.extend(coords);
    });

    const selectedSpace = validSpaces.find((space) => getSpaceId(space) === selectedIdString);

    if (selectedSpace) {
      const selectedCoords = getSpaceCoords(selectedSpace);

      if (!selectedCoords) return;

      const selectedName = getStringValue(selectedSpace, ['name'], 'Selected place');
      const selectedSuburb = getStringValue(selectedSpace, ['suburb'], 'Melbourne');
      const selectedCategory = getStringValue(selectedSpace, ['category'], 'place');
      const selectedNoise = getNumberValue(selectedSpace, ['noiseDb', 'noise_db'], 0);
      const selectedComfort = getNumberValue(selectedSpace, ['comfort'], 0);

      const popup = new mapboxgl.Popup({
        offset: 18,
        closeButton: true,
        closeOnClick: false,
        className: 'slm-map-popup',
        anchor: 'top',
      })
        .setLngLat(selectedCoords)
        .setHTML(`
          <div style="font-family: Arial, sans-serif; min-width: 190px;">
            <strong style="display:block; color:#243C35; font-size:14px; margin-bottom:6px;">
              ${selectedName}
            </strong>
            <div style="color:#6E7771; font-size:13px; margin-bottom:6px;">
              ${selectedSuburb} · ${selectedCategory}
            </div>
            <div style="color:#243C35; font-size:13px;">
              Noise: ${Math.round(selectedNoise)} dB<br/>
              Comfort: ${Math.round(selectedComfort)}/100
            </div>
          </div>
        `)
        .addTo(map);

      popupRef.current = popup;

      map.flyTo({
        center: selectedCoords,
        zoom: 15,
        speed: 1.05,
        curve: 1.2,
        essential: true,
      });
    } else {
      map.fitBounds(bounds, {
        padding: 60,
        maxZoom: 14,
      });
    }
  }, [spaces, selectedSpaceId, onSelectSpace]);

  return (
    <Paper
      elevation={0}
      sx={{
        minHeight: 360,
        borderRadius: '32px',
        overflow: 'hidden',
        border: '1px solid #E4D9C8',
        boxShadow: '0 12px 40px rgba(36,60,53,0.08)',
        bgcolor: '#FFFDF8',
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