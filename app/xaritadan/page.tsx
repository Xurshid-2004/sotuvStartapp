"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useRequireAuth } from "../lib/session";
import {
  getCurrentUserLocation,
  openOrCreateConversation,
  sortByNearestProducts,
  type LatLng,
} from "../lib/map-helpers";
import BottomNav from "../components/BottomNav";
import Logo from "../components/Logo";
import { useLocale } from "../components/LocaleProvider";
import type { MapPin } from "../components/LiveMap";
import { PRODUCT_CATEGORIES } from "../lib/categories";

const LiveMap = dynamic(() => import("../components/LiveMap"), {
  ssr: false,
  loading: () => (
    <div className="relative rounded-[2rem] overflow-hidden h-[70vh] min-h-[480px]">
      <div className="skeleton w-full h-full" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-9 h-9 border-4 border-[var(--brand-primary-soft)] border-t-[var(--brand-primary)] rounded-full animate-spin" />
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
  const { t } = useLocale();
  const { user, loading: authLoading } = useRequireAuth("sotuvchi");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProductWithDistance | null>(null);
  const [geoHint, setGeoHint] = useState(t("map.locating"));
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
    if (authLoading || !user) return;
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
  }, [authLoading, user, load]);

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 border-4 border-[var(--brand-primary-soft)] border-t-[var(--brand-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-36" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-30 brand-header">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center gap-3">
          <Logo size={36} showText={false} />
          <div className="min-w-0">
            <h1 className="text-white text-xl font-black leading-tight tracking-tight">{t("map.title")}</h1>
            <p className="text-white/80 text-xs sm:text-sm">{t("map.subtitle")}</p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-4 space-y-5">
        <div className="relative fade-up rounded-[2rem] overflow-hidden border border-[var(--brand-primary-muted)] bg-[var(--surface)]/60 backdrop-blur shadow-[var(--shadow-card)]">
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
            <div className="bg-[var(--surface)]/72 backdrop-blur-xl border border-[var(--border)] rounded-2xl shadow-xl p-3 sm:p-4">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Mahsulot yoki firma qidiring..."
                  className="md:col-span-4 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/90 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="md:col-span-3 px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)]/90 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
                >
                  <option value="all">Barcha kategoriyalar</option>
                  {PRODUCT_CATEGORIES.filter((c) => categories.includes(c)).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <div className="md:col-span-3 flex items-center gap-1 bg-[var(--surface-2)]/90 border border-[var(--border)] rounded-xl p-1">
                  {[
                    { label: "1km", value: 1 },
                    { label: "3km", value: 3 },
                    { label: "5km", value: 5 },
                    { label: "10km", value: 10 },
                    { label: t("map.allRadius"), value: null },
                  ].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setRadiusKm(opt.value)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                        radiusKm === opt.value ? "bg-[var(--brand-primary)] text-[var(--brand-on)]" : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
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
                  className="md:col-span-2 px-3 py-2 rounded-xl bg-[var(--text-primary)] text-[var(--surface)] text-xs sm:text-sm font-bold"
                >
                  Mening joylashuvim
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs font-medium px-1 text-[var(--brand-primary-strong)]">{geoHint}</p>
        <p className="text-sm font-semibold px-1" style={{ color: "var(--muted)" }}>
          {loading ? "Yuklanmoqda..." : t("map.found", { n: displayProducts.length })}
        </p>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-[var(--surface)] rounded-2xl p-3 border border-[var(--soft-border)]">
                <div className="skeleton h-28 rounded-xl mb-3" />
                <div className="skeleton h-4 rounded w-2/3 mb-2" />
                <div className="skeleton h-3 rounded w-1/2 mb-2" />
                <div className="skeleton h-9 rounded-xl" />
              </div>
            ))}
          </div>
        )}

        {!loading && displayProducts.length === 0 && (
          <div className="text-center py-12 bg-[var(--surface)] rounded-3xl border border-[var(--soft-border)] shadow-sm">
            <div className="text-6xl mb-3">🧭</div>
            <p className="font-black text-lg" style={{ color: "var(--ink)" }}>{t("map.none")}</p>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Radius yoki kategoriya filtrini o‘zgartirib qayta urinib ko‘ring.
            </p>
          </div>
        )}

        {!loading && displayProducts.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-black text-[var(--text-secondary)] px-1">Yaqin ishlab chiqaruvchilar</p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {displayProducts.map((p) => (
                <div key={p.id} className="bg-[var(--surface)] rounded-2xl border border-[var(--soft-border)] p-3 shadow-sm">
                  <div className="flex gap-3">
                    <div className="w-20 h-20 rounded-xl bg-[var(--surface-2)] overflow-hidden shrink-0">
                      {p.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">📦</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-black text-sm line-clamp-2 text-[var(--text-primary)]">{p.name}</p>
                      <p className="text-xs text-[var(--brand-primary-strong)] mt-0.5">{p.manufacturer_name}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-1 line-clamp-1">{p.location_address || "Manzil kiritilmagan"}</p>
                      <p className="text-[11px] font-bold text-[var(--brand-primary-strong)] mt-1">
                        {Number.isFinite(p.distanceKm) ? t("map.distance", { km: p.distanceKm.toFixed(2) }) : "Masofa aniqlanmagan"}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button
                      onClick={() => {
                        setSelected(p);
                        setFocusPoint({ lat: p.latitudeNum, lng: p.longitudeNum, zoom: 17 });
                      }}
                      className="py-2 rounded-xl bg-[var(--brand-primary)] text-[var(--brand-on)] text-xs font-bold"
                    >
                      Xaritada ko‘rish
                    </button>
                    <button
                      onClick={() => openChat(p.manufacturer, p.id)}
                      className="py-2 rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs font-bold"
                    >
                      {t("map.message")}
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
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-[var(--surface)] w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 fade-up">
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-[var(--surface-2)] shrink-0">
                {selected.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.image_url} alt={selected.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)] text-2xl">📦</div>
                )}
              </div>
              <div className="min-w-0">
                <p className="font-black text-lg text-[var(--text-primary)] line-clamp-2">{selected.name}</p>
                <p className="text-sm text-[var(--brand-primary-strong)]">{selected.manufacturer_name}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{selected.location_address || "Manzil ko'rsatilmagan"}</p>
                <p className="text-xs font-semibold text-[var(--brand-primary-strong)] mt-1">
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
                  className="py-2.5 rounded-xl bg-[var(--brand-primary)] text-[var(--brand-on)] text-xs font-bold text-center"
                >
                  {t("map.call")}
                </a>
              ) : (
                <button disabled className="py-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text-muted)] text-xs font-bold">
                  Telefon yo&apos;q
                </button>
              )}
              <button
                onClick={() => openChat(selected.manufacturer, selected.id)}
                className="py-2.5 rounded-xl bg-[var(--brand-primary)] text-[var(--brand-on)] text-xs font-bold"
              >
                {t("map.message")}
              </button>
              <a
                href={`https://www.google.com/maps?q=${selected.latitudeNum},${selected.longitudeNum}`}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] text-xs font-bold text-center"
              >
                Yo‘nalish olish
              </a>
              <button
                onClick={() => setSelected(null)}
                className="py-2.5 rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)] text-xs font-bold"
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
