"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, getRole } from "../lib/api";
import BottomNav from "../components/BottomNav";

type Product = {
  id: number;
  name: string;
  price: string;
  unit: string;
  category: string;
  image_url: string;
  manufacturer: number;
  manufacturer_name: string;
};
type Favorite = { id: number; product: number; product_detail: Product };

function fmtPrice(p: string) {
  return Math.round(Number(p)).toLocaleString("ru-RU");
}
function Placeholder({ name }: { name: string }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-200">
      <span className="text-4xl font-black text-violet-400/70">{letter}</span>
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = (await api("/favorites/")) as Favorite[];
      setFavs(r);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!getRole()) {
      router.push("/sign_up");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [router, load]);

  const remove = async (productId: number) => {
    setFavs((f) => f.filter((x) => x.product !== productId));
    try {
      await api(`/favorites/by-product/${productId}/`, { method: "DELETE" });
    } catch {
      load();
    }
  };

  const messageOwner = async (p: Product) => {
    try {
      const conv = (await api("/conversations/", {
        method: "POST",
        body: { user_id: p.manufacturer, product: p.id },
      })) as { id: number };
      router.push(`/chat?c=${conv.id}`);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 to-violet-600 px-4 py-4 shadow-lg">
        <h1 className="text-white text-xl font-black flex items-center gap-2">
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
          Sevimlilar
        </h1>
      </header>

      <main className="max-w-3xl mx-auto px-3 py-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-2">
                <div className="skeleton aspect-square rounded-xl mb-2" />
                <div className="skeleton h-4 rounded" />
              </div>
            ))}
          </div>
        ) : favs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🤍</div>
            <p className="font-bold text-lg" style={{ color: "var(--ink)" }}>Sevimlilar bo&apos;sh</p>
            <p className="text-violet-400 text-sm mt-1">Katalogdagi yurakcha tugmasi bilan saqlang.</p>
            <button onClick={() => router.push("/seler")} className="mt-4 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm">Katalogga o&apos;tish</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {favs.map(({ product: pid, product_detail: p }) => (
              <div key={pid} className="bg-white rounded-2xl overflow-hidden flex flex-col fade-up card-hover">
                <div className="aspect-square relative overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : <Placeholder name={p.name} />}
                  <button
                    onClick={() => remove(pid)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 flex items-center justify-center text-rose-500 active:scale-90 transition"
                    aria-label="Sevimlidan o'chirish"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
                  </button>
                </div>
                <div className="p-2.5 flex flex-col flex-1">
                  <p className="font-bold text-sm leading-snug line-clamp-2" style={{ color: "var(--ink)" }}>{p.name}</p>
                  <p className="text-xs text-violet-400 truncate">{p.manufacturer_name}</p>
                  <p className="text-base font-black mt-1" style={{ color: "var(--ink)" }}>{fmtPrice(p.price)} <span className="text-[11px] text-violet-400">so&apos;m</span></p>
                  <button onClick={() => messageOwner(p)} className="mt-2 w-full py-2 rounded-xl bg-violet-100 text-violet-700 font-bold text-xs active:scale-95 transition">
                    Egasiga yozish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
