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
  userLocation,
}: {
  route: LatLng[];
  start: LatLng | null;
  end: LatLng | null;
  userLocation: LatLng | null;
}) {
  const map = useMap();

  React.useEffect(() => {
    const points = route.length
      ? route
      : ([start, end].filter(Boolean) as LatLng[]);

    if (points.length > 1) {
      map.fitBounds(points, { padding: [40, 40] });
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 14);
      return;
    }

    if (userLocation) {
      map.setView(userLocation, 15);
    }
  }, [map, route, start, end, userLocation]);

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
  const [userLocation, setUserLocation] = React.useState<LatLng | null>(null);

  React.useEffect(() => {
    if (startPoint) {
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: LatLng = [
          position.coords.latitude,
          position.coords.longitude,
        ];

        setUserLocation(location);
      },
      (error) => {
        console.warn('Unable to get current location:', error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [startPoint]);

  const mapCenter = startPoint ?? userLocation ?? fallbackCenter;

  return (
    <RLMapContainer
      center={mapCenter}
      zoom={14}
      style={{ height: '100%', width: '100%' }}
    >
      <RLTileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <FitBounds
        route={routeLine}
        start={startPoint}
        end={endPoint}
        userLocation={userLocation}
      />

      {userLocation && !startPoint && (
        <RLCircleMarker
          center={userLocation}
          radius={10}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#2563eb',
            fillOpacity: 0.9,
          }}
        >
          <RLPopup>Your current location</RLPopup>
        </RLCircleMarker>
      )}

      {startPoint && (
        <RLCircleMarker
          center={startPoint}
          radius={10}
          pathOptions={{
            color: '#2563eb',
            fillColor: '#2563eb',
            fillOpacity: 0.9,
          }}
        >
          <RLPopup>Start</RLPopup>
        </RLCircleMarker>
      )}

      {endPoint && (
        <RLCircleMarker
          center={endPoint}
          radius={10}
          pathOptions={{
            color: '#ef4444',
            fillColor: '#ef4444',
            fillOpacity: 0.9,
          }}
        >
          <RLPopup>{destinationName}</RLPopup>
        </RLCircleMarker>
      )}

      {routeLine.length > 1 && (
        <RLPolyline
          positions={routeLine}
          pathOptions={{
            color: '#1473e6',
            weight: 5,
          }}
        />
      )}
    </RLMapContainer>
  );
}