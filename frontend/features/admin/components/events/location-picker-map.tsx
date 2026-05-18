"use client";

import { useEffect } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type Coordinate = {
  latitude: number;
  longitude: number;
};

const DEFAULT_CENTER: Coordinate = {
  latitude: 10.7769,
  longitude: 106.7009,
};

function configureLeafletMarker() {
  L.Icon.Default.mergeOptions({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function MapClickHandler({ onChange }: { onChange: (coordinate: Coordinate) => void }) {
  useMapEvents({
    click(event) {
      onChange({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      });
    },
  });

  return null;
}

function RecenterMap({ coordinate }: { coordinate: Coordinate }) {
  const map = useMap();

  useEffect(() => {
    map.setView([coordinate.latitude, coordinate.longitude], map.getZoom(), { animate: true });
  }, [coordinate.latitude, coordinate.longitude, map]);

  return null;
}

export default function LocationPickerMap({
  coordinate,
  onChange,
}: {
  coordinate: Coordinate | null;
  onChange: (coordinate: Coordinate) => void;
}) {
  const center = coordinate ?? DEFAULT_CENTER;

  useEffect(() => {
    configureLeafletMarker();
  }, []);

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={coordinate ? 15 : 12}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapClickHandler onChange={onChange} />
      <RecenterMap coordinate={center} />
      {coordinate ? <Marker position={[coordinate.latitude, coordinate.longitude]} /> : null}
    </MapContainer>
  );
}
