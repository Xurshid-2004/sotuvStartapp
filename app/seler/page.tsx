"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getRole } from "../lib/api";
import BottomNav from "../components/BottomNav";
import Carousel, { Slide } from "../components/Carousel";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  category: string;
  image_url: string;
  manufacturer: number;
  manufacturer_name: string;
};

function fmtPrice(p: string) {
  return Math.round(Number(p)).toLocaleString("ru-RU");
}

function Placeholder({ name }: { name: string }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-200">
      <span className="text-5xl font-black text-violet-400/70 select-none">{letter}</span>
    </div>
  );
}

const SelerInner = () => {
  const router = useRouter();
  const params = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [favIds, setFavIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("Hammasi");
  const [toast, setToast] = useState("");

  const [picked, setPicked] = useState<Product | null>(null);
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const p = (await api("/products/")) as Product[];
      setProducts(p);
      const f = (await api("/favorites/")) as { product: number }[];
      setFavIds(new Set(f.map((x) => x.product)));
    } catch {
      setToast("Ma'lumotlarni yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getRole() !== "sotuvchi") {
      router.push("/sign_up");
      return;
    }
    const q = params.get("q");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setSearch(q);
    loadData();
  }, [router, loadData, params]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.category && set.add(p.category));
    return ["Hammasi", ...Array.from(set)];
  }, [products]);

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
    setQty("1");
    setNote("");
  };

  const submitOrder = async (alsoMessage: boolean) => {
    if (!picked) return;
    setSending(true);
    try {
      await api("/requests/", {
        method: "POST",
        body: { product: picked.id, quantity: Number(qty), note },
      });
      if (alsoMessage) {
        const conv = (await api("/conversations/", {
          method: "POST",
          body: { user_id: picked.manufacturer, product: picked.id },
        })) as { id: number };
        const autoText = `Buyurtma: ${picked.name} — ${qty} ${picked.unit}.${note ? " " + note : ""}`;
        await api(`/conversations/${conv.id}/send/`, { method: "POST", body: { text: autoText } });
        setPicked(null);
        router.push(`/chat?c=${conv.id}`);
        return;
      }
      setPicked(null);
      showToast(`${picked.name} — buyurtma yuborildi`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-violet-700 to-violet-600 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center font-black text-violet-700">S</div>
            <span className="hidden sm:block text-white font-extrabold text-lg tracking-tight">SavdoMarket</span>
          </div>
          <div className="flex-1 relative">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Mahsulot yoki ishlab chiqaruvchini qidiring..."
              className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white text-ink placeholder-violet-300 outline-none focus:ring-4 focus:ring-violet-400/40 transition"
              style={{ color: "var(--ink)" }}
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex gap-2 overflow-x-auto no-sb">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCat(c)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition ${
                activeCat === c ? "bg-white text-violet-700" : "bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              {c}
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
              <div key={i} className="rounded-2xl bg-white p-3">
                <div className="skeleton aspect-square rounded-xl mb-3" />
                <div className="skeleton h-4 rounded mb-2" />
                <div className="skeleton h-4 w-2/3 rounded" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <p className="font-bold text-lg" style={{ color: "var(--ink)" }}>Hech narsa topilmadi</p>
            <p className="text-violet-400 text-sm mt-1">
              {products.length === 0 ? "Ishlab chiqaruvchilar hali mahsulot qo'shmagan." : "Qidiruv yoki kategoriyani o'zgartirib ko'ring."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((p, i) => {
              const isFav = favIds.has(p.id);
              return (
                <div
                  key={p.id}
                  className="card-hover rounded-2xl bg-white overflow-hidden flex flex-col fade-up"
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
                      <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur text-[11px] font-bold text-violet-700">{p.category}</span>
                    )}
                    <button
                      onClick={() => toggleFav(p)}
                      className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center active:scale-90 transition ${isFav ? "bg-white text-rose-500 pop" : "bg-white/80 text-violet-300"}`}
                      aria-label="Sevimli"
                    >
                      <svg className="w-5 h-5" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" strokeLinejoin="round" /></svg>
                    </button>
                  </div>

                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="font-bold text-sm leading-snug line-clamp-2" style={{ color: "var(--ink)" }}>{p.name}</h3>
                    <p className="text-xs text-violet-400 mt-0.5 truncate">{p.manufacturer_name}</p>
                    <div className="mt-auto pt-3">
                      <p className="text-lg font-black" style={{ color: "var(--ink)" }}>
                        {fmtPrice(p.price)} <span className="text-xs font-semibold text-violet-400">so&apos;m/{p.unit}</span>
                      </p>
                      <button
                        onClick={() => openOrder(p)}
                        className="mt-2 w-full py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white font-bold text-sm transition flex items-center justify-center gap-1.5"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
                        Buyurtma berish
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
          <div className="absolute inset-0 bg-violet-900/40 backdrop-blur-sm" onClick={() => setPicked(null)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 fade-up">
            <div className="flex gap-4 items-center mb-5">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0">
                {picked.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={picked.image_url} alt={picked.name} className="w-full h-full object-cover" />
                ) : <Placeholder name={picked.name} />}
              </div>
              <div>
                <h3 className="font-black text-lg leading-tight" style={{ color: "var(--ink)" }}>{picked.name}</h3>
                <p className="text-sm text-violet-400">{picked.manufacturer_name}</p>
                <p className="text-violet-700 font-bold mt-1">{fmtPrice(picked.price)} so&apos;m/{picked.unit}</p>
              </div>
            </div>

            <label className="text-sm font-bold" style={{ color: "var(--ink)" }}>Kerakli miqdor ({picked.unit})</label>
            <div className="flex items-center gap-3 mt-2 mb-4">
              <button onClick={() => setQty(String(Math.max(1, Number(qty) - 1)))} className="w-11 h-11 rounded-xl bg-violet-100 text-violet-700 font-black text-xl active:scale-90 transition">−</button>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/\D/g, "") || "")}
                inputMode="numeric"
                className="flex-1 text-center text-xl font-black py-2.5 rounded-xl border-2 border-violet-200 outline-none focus:border-violet-500"
                style={{ color: "var(--ink)" }}
              />
              <button onClick={() => setQty(String(Number(qty || "0") + 1))} className="w-11 h-11 rounded-xl bg-violet-100 text-violet-700 font-black text-xl active:scale-90 transition">+</button>
            </div>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Izoh (ixtiyoriy): shoshilinch, yetkazib berish manzili..."
              className="w-full px-4 py-3 rounded-xl border-2 border-violet-100 outline-none focus:border-violet-400 text-sm resize-none"
              rows={2}
            />

            <div className="flex gap-3 mt-5">
              <button
                onClick={() => submitOrder(false)}
                disabled={sending || !qty || Number(qty) < 1}
                className="flex-1 py-3 rounded-xl bg-violet-100 text-violet-700 font-bold transition active:scale-95 disabled:opacity-50"
              >
                {sending ? "..." : "Buyurtma"}
              </button>
              <button
                onClick={() => submitOrder(true)}
                disabled={sending || !qty || Number(qty) < 1}
                className="flex-[1.4] py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinejoin="round" /></svg>
                Buyurtma + yozish
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white font-semibold text-sm shadow-2xl fade-up flex items-center gap-2" style={{ background: "var(--ink)" }}>
          <span className="text-electric">✓</span> {toast}
        </div>
      )}

      <BottomNav />
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
