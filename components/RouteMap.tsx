'use client';

import * as React from 'react';
import {
  MapContainer,
  TileLayer,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type LatLng = [number, number];

const RLMapContainer = MapContainer as any;
const RLTileLayer = TileLayer as any;
const RLPolyline = Polyline as any;
const RLCircleMarker = CircleMarker as any;
const RLPopup = Popup as any;

function FitBounds({
  route,
  start,
  end,
}: {
  route: LatLng[];
  start: LatLng | null;
  end: LatLng | null;
}) {
  const map = useMap();

  React.useEffect(() => {
    const points = route.length
      ? route
      : ([start, end].filter(Boolean) as LatLng[]);

    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
    } else if (points.length === 1) {
      map.setView(points[0], 14);
    }
  }, [map, route, start, end]);

  return null;
}

export default function RouteMap({
  startPoint,
  endPoint,
  routeLine,
  destinationName,
  fallbackCenter,
}: {
  startPoint: LatLng | null;
  endPoint: LatLng | null;
  routeLine: LatLng[];
  destinationName: string;
  fallbackCenter: LatLng;
}) {
  return (
    <RLMapContainer
      center={startPoint ?? fallbackCenter}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <RLTileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds route={routeLine} start={startPoint} end={endPoint} />

      {startPoint && (
        <RLCircleMarker center={startPoint} radius={10} pathOptions={{ color: '#2563eb' }}>
          <RLPopup>Start</RLPopup>
        </RLCircleMarker>
      )}

      {endPoint && (
        <RLCircleMarker center={endPoint} radius={10} pathOptions={{ color: '#ef4444' }}>
          <RLPopup>{destinationName}</RLPopup>
        </RLCircleMarker>
      )}

      {routeLine.length > 1 && (
        <RLPolyline positions={routeLine} pathOptions={{ color: '#1473e6', weight: 5 }} />
      )}
    </RLMapContainer>
  );
}