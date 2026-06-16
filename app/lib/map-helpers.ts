"use client";

import { api } from "./api";

export type LatLng = { lat: number; lng: number };

export function getCurrentUserLocation(): Promise<LatLng> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("Brauzer geolokatsiyani qo'llab-quvvatlamaydi."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Joylashuv ruxsati berilmadi.")),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 }
    );
  });
}

export function calculateDistanceKm(
  userLat: number,
  userLng: number,
  itemLat: number,
  itemLng: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(itemLat - userLat);
  const dLng = toRad(itemLng - userLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(userLat)) * Math.cos(toRad(itemLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function sortByNearestProducts<T extends { latitude: number; longitude: number }>(
  items: T[],
  userLocation: LatLng
): (T & { distanceKm: number })[] {
  return items
    .map((x) => ({
      ...x,
      distanceKm: calculateDistanceKm(userLocation.lat, userLocation.lng, x.latitude, x.longitude),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);
}

export async function openOrCreateConversation(
  producerId: number,
  productId?: number
): Promise<number> {
  const conv = (await api("/conversations/", {
    method: "POST",
    body: { user_id: producerId, ...(productId ? { product: productId } : {}) },
  })) as { id: number };
  return conv.id;
}
