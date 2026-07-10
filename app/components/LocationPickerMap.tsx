"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap, Marker } from "leaflet";

type Props = {
  value: { lat: number; lng: number } | null;
  onChange: (coords: { lat: number; lng: number }) => void;
};

export default function LocationPickerMap({ value, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);

  useEffect(() => {
    if (!rootRef.current || mapRef.current) return;
    let killed = false;
    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");
      if (killed || !rootRef.current) return;
      const map = L.map(rootRef.current, { zoomControl: true }).setView([41.3111, 69.2797], 11);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      map.on("click", (e) => {
        const lat = Number(e.latlng.lat.toFixed(6));
        const lng = Number(e.latlng.lng.toFixed(6));
        if (!markerRef.current) {
          markerRef.current = L.marker([lat, lng]).addTo(map);
        } else {
          markerRef.current.setLatLng([lat, lng]);
        }
        onChange({ lat, lng });
      });
    })();

    return () => {
      killed = true;
      markerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [onChange]);

  useEffect(() => {
    if (!mapRef.current || !value) return;
    (async () => {
      const L = (await import("leaflet")).default;
      if (!mapRef.current) return;
      if (!markerRef.current) {
        markerRef.current = L.marker([value.lat, value.lng]).addTo(mapRef.current);
      } else {
        markerRef.current.setLatLng([value.lat, value.lng]);
      }
      mapRef.current.setView([value.lat, value.lng], Math.max(mapRef.current.getZoom(), 15));
    })();
  }, [value]);

  return <div ref={rootRef} className="h-48 w-full rounded-xl border border-[var(--brand-primary-muted)] overflow-hidden" />;
}
