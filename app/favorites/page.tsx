"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useRequireAuth } from "../lib/session";
import BottomNav from "../components/BottomNav";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import LoadingScreen from "../components/ui/LoadingScreen";
import { useLocale } from "../components/LocaleProvider";
import { fmtPrice } from "../lib/format";

type Product = {
  id: number; name: string; price: string; unit: string; category: string;
  image_url: string; manufacturer: number; manufacturer_name: string;
};
type Favorite = { id: number; product: number; product_detail: Product };

function Placeholder({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--brand-primary-soft)]">
      <span className="text-4xl font-extrabold text-[var(--brand-primary)]/50">{(name || "?").charAt(0)}</span>
    </div>
  );
}

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth();
  const { t } = useLocale();
  const [favs, setFavs] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setFavs((await api("/favorites/")) as Favorite[]);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    load();
  }, [authLoading, user, load]);

  const remove = async (productId: number) => {
    setFavs((f) => f.filter((x) => x.product !== productId));
    try { await api(`/favorites/by-product/${productId}/`, { method: "DELETE" }); }
    catch { load(); }
  };

  const messageOwner = async (p: Product) => {
    try {
      const conv = (await api("/conversations/", { method: "POST", body: { user_id: p.manufacturer, product: p.id } })) as { id: number };
      router.push(`/chat?c=${conv.id}`);
    } catch { /* ignore */ }
  };

  if (authLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg)]">
      <PageHeader
        title={t("pages.favorites")}
        icon={<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>}
      />

      <main className="max-w-5xl mx-auto px-4 py-4">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-[20px] bg-[var(--surface)] border border-[var(--soft-border)] p-2">
                <div className="skeleton aspect-square rounded-2xl mb-2" />
                <div className="skeleton h-4 rounded" />
              </div>
            ))}
          </div>
        ) : favs.length === 0 ? (
          <EmptyState title={t("favorites.empty")} subtitle={t("favorites.emptySub")} actionLabel={t("favorites.toCatalog")} onAction={() => router.push("/seler")} icon="heart" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {favs.map(({ product: pid, product_detail: p }) => (
              <div key={pid} className="bg-[var(--surface)] rounded-[20px] border border-[var(--soft-border)] overflow-hidden flex flex-col card-hover fade-up">
                <div className="aspect-square relative">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : <Placeholder name={p.name} />}
                  <button type="button" onClick={() => remove(pid)} className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/95 text-[var(--accent-pink)] flex items-center justify-center shadow-sm" aria-label="Remove">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>
                  </button>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <p className="font-bold text-sm line-clamp-2 text-[var(--text-primary)]">{p.name}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{p.manufacturer_name}</p>
                  <p className="text-base font-extrabold mt-1 text-[var(--text-primary)]">{fmtPrice(p.price)} <span className="text-[11px] text-[var(--text-muted)]">{t("common.som")}</span></p>
                  <button type="button" onClick={() => messageOwner(p)} className="btn btn-secondary btn-sm mt-2 w-full">{t("favorites.messageOwner")}</button>
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
