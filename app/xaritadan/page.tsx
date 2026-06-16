"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { api, getRole } from "../lib/api";
import {
  getCurrentUserLocation,
  openOrCreateConversation,
  sortByNearestProducts,
  type LatLng,
} from "../lib/map-helpers";
import BottomNav from "../components/BottomNav";
import Logo from "../components/Logo";
import type { MapPin } from "../components/LiveMap";
import { PRODUCT_CATEGORIES } from "../lib/categories";

const LiveMap = dynamic(() => import("../components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="relative rounded-[2rem] overflow-hidden h-[70vh] min-h-[480px]">
      <div className="skeleton w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin" />
      </div>
    </div>
  ),
});

type Product = {
  id: number;
  name: string;
  description: string;
  image_url: string;
  producer_phone: string;
  location_address: string;
  latitude: string;
  longitude: string;
  manufacturer: number;
  manufacturer_name: string;
  category: string;
};
type ProductWithDistance = Product & { latitudeNum: number; longitudeNum: number; distanceKm: number };

export default function XaritadanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductWithDistance | null>(null);
  const [geoHint, setGeoHint] = useState("Joylashuv aniqlanmoqda...");
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [radiusKm, setRadiusKm] = useState<number | null>(5);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [focusPoint, setFocusPoint] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);

  const [products, setProducts] = useState<ProductWithDistance[]>([]);

  const load = useCallback(async () => {
    try {
      const all = (await api("/products/")) as Product[];
      const withCoords = all
        .filter((p) => p.latitude && p.longitude)
        .map((p) => ({
          ...p,
          latitudeNum: Number(p.latitude),
          longitudeNum: Number(p.longitude),
          distanceKm: Number.POSITIVE_INFINITY,
        }));
      setProducts(withCoords);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getRole() !== "sotuvchi") {
      router.push("/sign_up");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();

    getCurrentUserLocation()
      .then((loc) => {
        setUserLocation(loc);
        setGeoHint("Ko'k nuqta — sizning joylashuvingiz. Xarita bosilganda hududingizga zoom bo'ladi.");
      })
      .catch(() => {
        setGeoHint("Joylashuv ruxsati berilmadi. Radius filtri o'rniga hamma marker ko'rsatiladi.");
      });
  }, [router, load]);

  const productsWithDistance = useMemo(() => {
    if (!userLocation) return products;
    const sorted = sortByNearestProducts(
      products.map((p) => ({
        id: p.id,
        latitude: p.latitudeNum,
        longitude: p.longitudeNum,
      })),
      userLocation
    );
    const distanceMap = new Map<number, number>(sorted.map((s) => [s.id, s.distanceKm]));
    return products
      .map((p) => ({ ...p, distanceKm: distanceMap.get(p.id) ?? Number.POSITIVE_INFINITY }))
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [products, userLocation]);

  const openChat = async (manufacturerId: number, productId: number) => {
    try {
      const convId = await openOrCreateConversation(manufacturerId, productId);
      router.push(`/chat?c=${convId}`);
    } catch {
      /* ignore */
    }
  };

  const filtered = userLocation
    ? productsWithDistance.filter((p) => (radiusKm == null ? true : p.distanceKm <= radiusKm))
    : productsWithDistance;

  const displayProducts = filtered
    .filter((p) => (category === "all" ? true : p.category === category))
    .filter((p) => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.manufacturer_name.toLowerCase().includes(q) ||
        p.location_address.toLowerCase().includes(q)
      );
    });

  const pins: MapPin[] = displayProducts.map((p) => ({
    id: p.id,
    name: `${p.name} · ${p.manufacturer_name}`,
    lat: p.latitudeNum,
    lng: p.longitudeNum,
    productCount: 1,
  }));

  const nearestPinIds = displayProducts.slice(0, 8).map((x) => x.id);
  const categories = Array.from(
    new Set(displayProducts.map((p) => p.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  return (
    <div className="min-h-screen pb-36" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-30 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 shadow-[0_10px_30px_-15px_rgba(2,6,23,.8)]">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Logo size={36} showText={false} />
          <div className="min-w-0">
            <h1 className="text-white text-xl font-black leading-tight tracking-tight">Xaritadan</h1>
            <p className="text-teal-100/80 text-xs sm:text-sm">Yaqin hududdagi mahsulot qo&apos;shgan ishlab chiqaruvchilar</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-5">
        <div className="relative fade-up rounded-[2rem] overflow-hidden border border-teal-100/70 bg-white/60 backdrop-blur shadow-[0_25px_60px_-25px_rgba(15,23,42,.45)]">
          {!loading ? (
            <LiveMap
              pins={pins}
              className="h-[70vh] min-h-[500px]"
              onPinClick={(id) => {
                const found = displayProducts.find((p) => p.id === id);
                if (found) setSelected(found);
              }}
              onUserLocation={(coords) => setUserLocation(coords)}
              selectedPinId={selected?.id ?? null}
              nearestPinIds={nearestPinIds}
              focusPoint={focusPoint}
            />
          ) : (
            <div className="skeleton h-[70vh] min-h-[500px] rounded-[2rem]" />
          )}

          <div className="absolute left-3 top-3 right-3 z-[500]">
            <div className="bg-white/72 backdrop-blur-xl border border-white/60 rounded-2xl shadow-xl p-3 sm:p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mahsulot yoki firma qidiring..."
                  className="md:col-span-4 px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm outline-none focus:ring-2 focus:ring-teal-300"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="md:col-span-3 px-3 py-2 rounded-xl border border-slate-200 bg-white/90 text-sm outline-none focus:ring-2 focus:ring-teal-300"
                >
                  <option value="all">Barcha kategoriyalar</option>
                  {PRODUCT_CATEGORIES.filter((c) => categories.includes(c)).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="md:col-span-3 flex items-center gap-1 bg-white/90 border border-slate-200 rounded-xl p-1">
                  {[
                    { label: "1km", value: 1 },
                    { label: "3km", value: 3 },
                    { label: "5km", value: 5 },
                    { label: "10km", value: 10 },
                    { label: "Hammasi", value: null },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setRadiusKm(opt.value)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                        radiusKm === opt.value ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    if (userLocation) {
                      setFocusPoint({ ...userLocation, zoom: 16.5 });
                    }
                  }}
                  className="md:col-span-2 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs sm:text-sm font-bold"
                >
                  Mening joylashuvim
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs font-medium px-1 text-teal-700">{geoHint}</p>
        <p className="text-sm font-semibold px-1" style={{ color: "var(--muted)" }}>
          {loading ? "Yuklanmoqda..." : `${displayProducts.length} ta ishlab chiqaruvchi/mahsulot topildi`}
        </p>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 border border-slate-100">
                <div className="skeleton h-28 rounded-xl mb-3" />
                <div className="skeleton h-4 rounded w-2/3 mb-2" />
                <div className="skeleton h-3 rounded w-1/2 mb-2" />
                <div className="skeleton h-9 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!loading && displayProducts.length === 0 && (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 shadow-sm">
            <div className="text-6xl mb-3">🧭</div>
            <p className="font-black text-lg" style={{ color: "var(--ink)" }}>Yaqin hududda mahsulot topilmadi</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Radius yoki kategoriya filtrini o‘zgartirib qayta urinib ko‘ring.
            </p>
          </div>
        )}

        {!loading && displayProducts.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-black text-slate-700 px-1">Yaqin ishlab chiqaruvchilar</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {displayProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400">📦</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm line-clamp-2 text-slate-900">{p.name}</p>
                      <p className="text-xs text-teal-700 mt-0.5">{p.manufacturer_name}</p>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{p.location_address || "Manzil kiritilmagan"}</p>
                      <p className="text-[11px] font-bold text-violet-600 mt-1">
                        {Number.isFinite(p.distanceKm) ? `${p.distanceKm.toFixed(2)} km` : "Masofa aniqlanmagan"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => {
                        setSelected(p);
                        setFocusPoint({ lat: p.latitudeNum, lng: p.longitudeNum, zoom: 17 });
                      }}
                      className="py-2 rounded-xl bg-teal-600 text-white text-xs font-bold"
                    >
                      Xaritada ko‘rish
                    </button>
                    <button
                      onClick={() => openChat(p.manufacturer, p.id)}
                      className="py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                    >
                      Xabar yuborish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 fade-up">
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
                {selected.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-500 text-2xl">📦</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-lg text-slate-900 line-clamp-2">{selected.name}</p>
                <p className="text-sm text-teal-700">{selected.manufacturer_name}</p>
                <p className="text-xs text-slate-500 mt-1">{selected.location_address || "Manzil ko'rsatilmagan"}</p>
                <p className="text-xs font-semibold text-violet-600 mt-1">
                  {Number.isFinite(selected.distanceKm)
                    ? `${selected.distanceKm.toFixed(2)} km uzoqlikda`
                    : "Masofa aniqlanmadi"}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
              {selected.producer_phone ? (
                <a
                  href={`tel:${selected.producer_phone}`}
                  className="py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold text-center"
                >
                  Telefon qilish
                </a>
              ) : (
                <button disabled className="py-2.5 rounded-xl bg-slate-200 text-slate-500 text-xs font-bold">
                  Telefon yo&apos;q
                </button>
              )}
              <button
                onClick={() => openChat(selected.manufacturer, selected.id)}
                className="py-2.5 rounded-xl bg-violet-600 text-white text-xs font-bold"
              >
                Xabar yuborish
              </button>
              <a
                href={`https://www.google.com/maps?q=${selected.latitudeNum},${selected.longitudeNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 rounded-xl bg-teal-100 text-teal-800 text-xs font-bold text-center"
              >
                Yo‘nalish olish
              </a>
              <button
                onClick={() => setSelected(null)}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
