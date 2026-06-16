"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, DivIcon } from "leaflet";

export type MapPin = {
  id: number;
  name: string;
  lat: number;
  lng: number;
  productCount?: number;
};

type LiveMapProps = {
  pins: MapPin[];
  onPinClick?: (id: number) => void;
  onUserLocation?: (coords: { lat: number; lng: number }) => void;
  selectedPinId?: number | null;
  nearestPinIds?: number[];
  focusPoint?: { lat: number; lng: number; zoom?: number } | null;
  className?: string;
};

const UZ_BOUNDS: [[number, number], [number, number]] = [
  [37.0, 55.9],
  [45.75, 73.25],
];
const UZ_CENTER: [number, number] = [41.3775, 64.5853];

function makeFactoryIcon(L: typeof import("leaflet")): DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:10px;background:#0d9488;border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.25)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/></svg>
    </div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  });
}

function makePinIcon(
  L: typeof import("leaflet"),
  opts: { active?: boolean; nearest?: boolean } = {}
): DivIcon {
  const bg = opts.active ? "#0f766e" : opts.nearest ? "#10b981" : "#14b8a6";
  const size = opts.active ? 34 : opts.nearest ? 31 : 28;
  return L.divIcon({
    className: "",
    html: `<div style="width:${size}px;height:${size}px;border-radius:12px;background:${bg};border:2px solid white;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 16px rgba(15,118,110,.35);transform:translateY(-1px)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M3 7h18v13H3zM7 3h10v4H7zM9 11h2v2H9zm4 0h2v2h-2z"/></svg>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
  });
}

export default function LiveMap({
  pins,
  onPinClick,
  onUserLocation,
  selectedPinId,
  nearestPinIds = [],
  focusPoint,
  className = "h-64 sm:h-80",
}: LiveMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const pinMarkersRef = useRef<Marker[]>([]);
  const watchIdRef = useRef<number | null>(null);
  const onPinClickRef = useRef(onPinClick);
  const onUserLocationRef = useRef(onUserLocation);
  const factoryIconRef = useRef<DivIcon | null>(null);
  const pinsRef = useRef(pins);
  const [mapReady, setMapReady] = useState(false);
  const userCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const nearestRef = useRef(new Set<number>());

  useEffect(() => {
    onPinClickRef.current = onPinClick;
    onUserLocationRef.current = onUserLocation;
    pinsRef.current = pins;
    nearestRef.current = new Set(nearestPinIds);
  }, [onPinClick, onUserLocation, pins, nearestPinIds]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (cancelled || !containerRef.current) return;

      factoryIconRef.current = makeFactoryIcon(L);

      const map = L.map(containerRef.current, { zoomControl: true, scrollWheelZoom: true });
      mapRef.current = map;

      // Universal ko'rinish uchun bir nechta qatlam:
      // - OSM Standard: kichik ko'chalar nomi yaxshi
      // - CARTO Voyager: modern dizayn
      // - OSM HOT: obyektlar kontrasti kuchli
      const osmStandard = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 20,
        minZoom: 8,
      });
      const cartoVoyager = L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        maxZoom: 20,
        minZoom: 8,
      });
      const osmHot = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors, HOT",
        maxZoom: 20,
        minZoom: 8,
      });
      osmStandard.addTo(map);
      L.control.layers(
        {
          "OSM (aniq ko'chalar)": osmStandard,
          "Modern (Voyager)": cartoVoyager,
          "OSM HOT": osmHot,
        },
        {}
      ).addTo(map);
      L.control.scale({ imperial: false }).addTo(map);

      const bounds = L.latLngBounds(UZ_BOUNDS);
      map.setMaxBounds(bounds.pad(0.08));
      map.fitBounds(bounds, { padding: [12, 12] });

      const userIcon = L.divIcon({
        className: "",
        html: `<div style="position:relative;width:22px;height:22px">
          <div style="position:absolute;inset:0;border-radius:50%;background:rgba(37,99,235,0.25);animation:map-pulse 2s infinite"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const setUserPosition = (lat: number, lng: number, fly = false) => {
        if (!mapRef.current) return;
        userCoordsRef.current = { lat, lng };
        onUserLocationRef.current?.({ lat, lng });
        if (userMarkerRef.current) {
          userMarkerRef.current.setLatLng([lat, lng]);
        } else {
          userMarkerRef.current = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 })
            .addTo(mapRef.current)
            .bindPopup("<b>Siz shu yerdasiz</b><br/><span style='font-size:11px'>Joylashuv jonli yangilanadi</span>");
        }
        if (fly) mapRef.current.flyTo([lat, lng], 16.5, { duration: 1.1 });
      };


      // Xarita bosilganda foydalanuvchining joriy turgan hududiga (tuman darajasi) zoom qilamiz.
        map.on("click", () => {
        if (!mapRef.current || !userCoordsRef.current) return;
        const { lat, lng } = userCoordsRef.current;
        mapRef.current.flyTo([lat, lng], 16.2, { duration: 1.0 });
        userMarkerRef.current?.openPopup();
      });

      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setUserPosition(latitude, longitude, !userMarkerRef.current);
          },
          () => map.setView(UZ_CENTER, 6),
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
        );
      }

      setMapReady(true);
    })();

    return () => {
      cancelled = true;
      if (watchIdRef.current != null && "geolocation" in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      pinMarkersRef.current.forEach((m) => m.remove());
      pinMarkersRef.current = [];
      userMarkerRef.current = null;
      userCoordsRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      factoryIconRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !focusPoint) return;
    mapRef.current.flyTo([focusPoint.lat, focusPoint.lng], focusPoint.zoom ?? 16.2, { duration: 0.9 });
  }, [focusPoint]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) return;

    (async () => {
      const L = (await import("leaflet")).default;
      if (!mapRef.current) return;

      if (!factoryIconRef.current) factoryIconRef.current = makeFactoryIcon(L);

      pinMarkersRef.current.forEach((m) => m.remove());
      pinMarkersRef.current = pinsRef.current.map((p) => {
        const icon = makePinIcon(L, {
          active: selectedPinId === p.id,
          nearest: nearestRef.current.has(p.id),
        });
        const m = L.marker([p.lat, p.lng], { icon }).addTo(mapRef.current!);
        m.bindPopup(`<b>${p.name}</b>${p.productCount ? `<br/>${p.productCount} ta mahsulot` : ""}`);
        m.on("click", () => onPinClickRef.current?.(p.id));
        return m;
      });
    })();
  }, [mapReady, pins, selectedPinId, nearestPinIds]);

  return (
    <div className={`leaflet-map-host relative rounded-3xl overflow-hidden ${className}`}>
      <div ref={containerRef} className="w-full h-full z-0" />
    </div>
  );
}
