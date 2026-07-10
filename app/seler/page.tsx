"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../lib/api";
import { useRequireAuth } from "../lib/session";
import { PRODUCT_CATEGORIES } from "../lib/categories";
import BottomNav from "../components/BottomNav";
import Carousel, { Slide } from "../components/Carousel";
import Logo from "../components/Logo";
import LoadingScreen from "../components/ui/LoadingScreen";
import Toast from "../components/ui/Toast";
import EmptyState from "../components/ui/EmptyState";
import { useLocale } from "../components/LocaleProvider";
import { useCart, type CartProduct } from "../components/CartProvider";
import { fmtPrice, fmtQty } from "../lib/format";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  stock: string;
  category: string;
  image_url: string;
  manufacturer: number;
  manufacturer_name: string;
};

function fmtPriceLocal(p: string) {
  return fmtPrice(p);
}

function qtyStepForUnit(unit: string) {
  const u = (unit || "").trim().toLowerCase();
  const fractionalUnits = ["kg", "kilogram", "l", "litr", "metr", "m", "tonna"];
  return fractionalUnits.some((x) => u.includes(x)) ? 0.1 : 1;
}

function normalizeQtyInput(raw: string) {
  const cleaned = raw.replace(",", ".").replace(/[^0-9.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  const frac = rest.join("").slice(0, 3);
  if (cleaned.startsWith(".")) return `0.${frac}`;
  return frac.length ? `${whole || "0"}.${frac}` : (whole || "");
}

function Placeholder({ name }: { name: string }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--brand-primary-soft)]">
      <span className="text-5xl font-extrabold text-[var(--brand-primary)]/50 select-none">{letter}</span>
    </div>
  );
}

const SelerInner = () => {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useRequireAuth("sotuvchi");
  const { t } = useLocale();
  const { add, has } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Hammasi");
  const [toast, setToast] = useState("");

  const [picked, setPicked] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");

  const loadData = useCallback(async () => {
    try {
      const p = (await api("/products/")) as Product[];
      setProducts(p);
      const f = (await api("/favorites/")) as { product: number }[];
      setFavIds(new Set(f.map((x) => x.product)));
    } catch {
      setToast(t("catalog.loadError"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    const q = params.get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setSearch(q);
    loadData();
  }, [authLoading, user, loadData, params]);

  const categories = useMemo(() => {
    const fromDb = new Set<string>();
    products.forEach((p) => p.category && fromDb.add(p.category));
    const extra = Array.from(fromDb).filter(
      (c) => !PRODUCT_CATEGORIES.includes(c as (typeof PRODUCT_CATEGORIES)[number])
    );
    return ["Hammasi", ...PRODUCT_CATEGORIES, ...extra];
  }, [products]);

  const allLabel = t("catalog.all");
  const displayCat = (c: string) => (c === "Hammasi" ? allLabel : c);

  // Karusel uchun rasmli mahsulotlardan eng qimmat 5 tasini tanlaymiz
  const slides: Slide[] = useMemo(() => {
    return products
      .filter((p) => p.image_url)
      .sort((a, b) => Number(b.price) - Number(a.price))
      .slice(0, 5)
      .map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.manufacturer_name,
        price: p.price,
        image: p.image_url,
      }));
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchCat = activeCat === "Hammasi" || p.category === activeCat;
      const matchQ =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.manufacturer_name?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [products, search, activeCat]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  const toggleFav = async (p: Product) => {
    const isFav = favIds.has(p.id);
    setFavIds((s) => {
      const n = new Set(s);
      if (isFav) n.delete(p.id);
      else n.add(p.id);
      return n;
    });
    try {
      if (isFav) await api(`/favorites/by-product/${p.id}/`, { method: "DELETE" });
      else await api("/favorites/", { method: "POST", body: { product: p.id } });
    } catch {
      loadData();
    }
  };

  const openOrder = (p: Product) => {
    setPicked(p);
    setQty(qtyStepForUnit(p.unit) < 1 ? "0.1" : "1");
  };

  const adjustQty = (delta: number) => {
    if (!picked) return;
    const step = qtyStepForUnit(picked.unit);
    const current = Number(qty.replace(",", ".")) || 0;
    const next = Math.max(step, current + delta * step);
    const rounded = Number(next.toFixed(3));
    setQty(String(rounded));
  };

  const toCartProduct = (p: Product): CartProduct => ({
    id: p.id,
    name: p.name,
    price: p.price,
    unit: p.unit,
    image_url: p.image_url,
    manufacturer: p.manufacturer,
    manufacturer_name: p.manufacturer_name,
    stock: p.stock,
  });

  const addPickedToCart = (goToCart: boolean) => {
    if (!picked) return;
    const quantity = Number(qty.replace(",", "."));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      showToast("Miqdor noto'g'ri kiritildi");
      return;
    }
    add(toCartProduct(picked), quantity);
    const name = picked.name;
    setPicked(null);
    if (goToCart) router.push("/cart");
    else showToast(`${name} — ${t("catalog.added")}`);
  };

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg)]">
      {authLoading ? (
        <LoadingScreen />
      ) : (
      <>
      <header className="sticky top-0 z-30 brand-header shadow-[var(--shadow-brand)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <Logo size={38} textClassName="hidden sm:inline text-white text-lg" />
          <div className="flex-1 relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("catalog.search")}
              className="w-full pl-11 pr-4 py-2.5 rounded-[14px] bg-white text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-4 focus:ring-white/30 transition"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--brand-primary)]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-sb">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition border ${
                activeCat === c ? "bg-white text-[var(--brand-primary-hover)] border-white" : "bg-white/15 text-white border-white/20 hover:bg-white/25"
              }`}
            >
              {displayCat(c)}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Karusel */}
        {!loading && slides.length > 0 && (
          <Carousel
            slides={slides}
            onSlideClick={(id) => {
              const p = products.find((x) => x.id === id);
              if (p) openOrder(p);
            }}
          />
        )}

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-[var(--surface)] p-3">
                <div className="skeleton aspect-square rounded-xl mb-3" />
                <div className="skeleton h-4 rounded mb-2" />
                <div className="skeleton h-4 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t("catalog.noResults")}
            subtitle={products.length === 0 ? t("catalog.noProducts") : t("catalog.tryFilter")}
            icon="search"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p, i) => {
              const isFav = favIds.has(p.id);
              const outOfStock = Number(p.stock) <= 0;
              return (
                <div
                  key={p.id}
                  className="card-hover rounded-[20px] bg-[var(--surface)] border border-[var(--soft-border)] overflow-hidden flex flex-col fade-up shadow-[var(--shadow-card)]"
                  style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}
                >
                  <div className="aspect-square overflow-hidden relative">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover transition-transform duration-500 hover:scale-110" />
                    ) : (
                      <Placeholder name={p.name} />
                    )}
                    {p.category && (
                      <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11px] font-bold text-[var(--brand-primary-strong)]">{p.category}</span>
                    )}
                    <button
                      onClick={() => toggleFav(p)}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition ${isFav ? "bg-white text-rose-500 pop" : "bg-white/80 text-[var(--brand-primary-strong)]"}`}
                      aria-label="Sevimli"
                    >
                      <svg className="w-5 h-5" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" strokeLinejoin="round" /></svg>
                    </button>
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-sm leading-snug line-clamp-2 text-[var(--text-primary)]">{p.name}</h3>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">{p.manufacturer_name}</p>
                    <div className="mt-auto pt-3">
                      <p className="text-lg font-extrabold text-[var(--text-primary)]">
                        {fmtPriceLocal(p.price)} <span className="text-xs font-medium text-[var(--text-muted)]">{t("common.som")}/{p.unit}</span>
                      </p>
                      <button
                        onClick={() => openOrder(p)}
                        disabled={outOfStock}
                        className="btn btn-primary mt-2 w-full !py-2 !text-sm disabled:opacity-50"
                      >
                        {outOfStock
                          ? t("catalog.outOfStock")
                          : has(p.id)
                          ? `✓ ${t("catalog.inCart")}`
                          : t("catalog.addToCart")}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Order modal */}
      {picked && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={() => setPicked(null)} />
          <div className="relative bg-[var(--surface)] w-full sm:max-w-md rounded-t-[20px] sm:rounded-[20px] p-6 fade-up border border-[var(--border)]">
            <div className="flex gap-4 items-center mb-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                {picked.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={picked.image_url} alt={picked.name} className="w-full h-full object-cover" />
                ) : <Placeholder name={picked.name} />}
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight" style={{ color: "var(--ink)" }}>{picked.name}</h3>
                <p className="text-sm text-[var(--text-muted)]">{picked.manufacturer_name}</p>
                <p className="text-[var(--brand-primary-hover)] font-bold mt-1">{fmtPriceLocal(picked.price)} {t("common.som")}/{picked.unit}</p>
              </div>
            </div>

            <label className="text-sm font-bold" style={{ color: "var(--ink)" }}>Sotuvda bor: ({picked.unit})</label>
            <div className="flex items-center gap-3 mt-2 mb-4">
              <button onClick={() => adjustQty(-1)} className="w-11 h-11 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] font-black text-xl active:scale-90 transition">−</button>
              <input
                value={qty}
                onChange={(e) => setQty(normalizeQtyInput(e.target.value))}
                inputMode="decimal"
                className="flex-1 text-center text-xl font-black py-2.5 rounded-xl border-2 bg-[var(--surface-2)] border-[var(--border)] outline-none focus:border-[var(--brand-primary)]"
                style={{ color: "var(--ink)" }}
              />
              <button onClick={() => adjustQty(1)} className="w-11 h-11 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] font-black text-xl active:scale-90 transition">+</button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] -mt-2 mb-3">
              Kasr miqdor yozish mumkin: masalan 1.5 yoki 1,5.
            </p>

            {(() => {
              const qn = Number(qty.replace(",", ".")) || 0;
              const total = Number(picked.price) * qn;
              return (
                <div className="flex items-center justify-between gap-3 mt-4 px-4 py-3 rounded-2xl bg-[var(--brand-primary-soft)] border border-[var(--brand-primary-muted)]">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--brand-primary-strong)]/70">{t("catalog.total")}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{fmtPriceLocal(picked.price)} × {fmtQty(qn)} {picked.unit}</p>
                  </div>
                  <p key={total} className="pop text-2xl font-black text-[var(--brand-primary-strong)] whitespace-nowrap">
                    {fmtPriceLocal(String(total))} <span className="text-sm font-bold">{t("common.som")}</span>
                  </p>
                </div>
              );
            })()}

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => addPickedToCart(false)}
                disabled={!qty || Number(qty.replace(",", ".")) <= 0}
                className="btn btn-secondary flex-1 !py-3"
              >
                {t("catalog.addToCart")}
              </button>
              <button
                onClick={() => addPickedToCart(true)}
                disabled={!qty || Number(qty.replace(",", ".")) <= 0}
                className="btn btn-primary flex-[1.4] !py-3"
              >
                {t("cart.title")}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />

      <BottomNav />
      </>
      )}
    </div>
  );
};

export default function Seler() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--bg)" }} />}>
      <SelerInner />
    </Suspense>
  );
}
