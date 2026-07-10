"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useRequireAuth } from "../lib/session";
import { useCart, type CartItem } from "../components/CartProvider";
import BottomNav from "../components/BottomNav";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import LoadingScreen from "../components/ui/LoadingScreen";
import Toast from "../components/ui/Toast";
import { useLocale } from "../components/LocaleProvider";
import { fmtPrice, fmtQty } from "../lib/format";

function qtyStepForUnit(unit: string) {
  const u = (unit || "").trim().toLowerCase();
  const fractionalUnits = ["kg", "kilogram", "l", "litr", "metr", "m", "tonna"];
  return fractionalUnits.some((x) => u.includes(x)) ? 0.1 : 1;
}

function Placeholder({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--brand-primary-soft)]">
      <span className="text-xl font-extrabold text-[var(--brand-primary)]/50">{(name || "?").charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function CartPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth("sotuvchi");
  const { t } = useLocale();
  const { items, setQuantity, remove, clear } = useCart();
  const [note, setNote] = useState("");
  const [placing, setPlacing] = useState(false);
  const [toast, setToast] = useState("");

  // Firma bo'yicha guruhlash — checkoutda har firmaga alohida buyurtma ochiladi
  const groups = useMemo(() => {
    const m = new Map<number, { name: string; items: CartItem[] }>();
    for (const it of items) {
      const g = m.get(it.manufacturer) ?? { name: it.manufacturer_name, items: [] };
      g.items.push(it);
      m.set(it.manufacturer, g);
    }
    return Array.from(m.entries()).map(([id, g]) => ({ id, ...g }));
  }, [items]);

  const grandTotal = useMemo(
    () => items.reduce((s, it) => s + Number(it.price) * it.quantity, 0),
    [items],
  );

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2800);
  };

  const changeQty = (it: CartItem, delta: number) => {
    const step = qtyStepForUnit(it.unit);
    const max = Number(it.stock) || step;
    const next = Math.max(step, Math.min(max, it.quantity + delta * step));
    setQuantity(it.id, Number(next.toFixed(3)));
  };

  const checkout = async () => {
    if (items.length === 0) return;
    setPlacing(true);
    try {
      await api("/orders/", {
        method: "POST",
        body: {
          items: items.map((it) => ({ product: it.id, quantity: it.quantity })),
          note: note.trim(),
        },
      });
      clear();
      showToast(t("cart.placed"));
      router.push("/orders");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setPlacing(false);
    }
  };

  if (authLoading || !user) return <LoadingScreen />;

  return (
    <div className="min-h-screen pb-40 bg-[var(--bg)]">
      <PageHeader
        title={t("cart.title")}
        subtitle={
          items.length
            ? `${t("cart.items", { n: items.length })} · ${t("cart.suppliers", { n: groups.length })}`
            : undefined
        }
      >
        {items.length > 0 && (
          <button
            type="button"
            onClick={clear}
            className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25 hover:bg-white/25 transition"
          >
            {t("cart.clear")}
          </button>
        )}
      </PageHeader>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {items.length === 0 ? (
          <EmptyState
            title={t("cart.empty")}
            subtitle={t("cart.emptySub")}
            actionLabel={t("cart.toCatalog")}
            onAction={() => router.push("/seler")}
            icon="orders"
          />
        ) : (
          <>
            {groups.map((g) => {
              const groupTotal = g.items.reduce((s, it) => s + Number(it.price) * it.quantity, 0);
              return (
                <section key={g.id} className="bg-[var(--surface)] rounded-[20px] border border-[var(--soft-border)] shadow-[var(--shadow-card)] overflow-hidden fade-up">
                  <div className="px-4 py-2.5 bg-[var(--brand-primary-soft)] flex items-center justify-between">
                    <p className="text-sm font-bold text-[var(--brand-primary-strong)] truncate">{g.name}</p>
                    <p className="text-xs font-bold text-[var(--brand-primary-strong)] whitespace-nowrap">
                      {fmtPrice(groupTotal)} {t("common.som")}
                    </p>
                  </div>
                  <div className="divide-y divide-[var(--soft-border)]">
                    {g.items.map((it) => {
                      const step = qtyStepForUnit(it.unit);
                      const atMax = it.quantity + step > (Number(it.stock) || 0) + 1e-9;
                      return (
                        <div key={it.id} className="p-3 flex gap-3">
                          <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 border border-[var(--soft-border)]">
                            {it.image_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={it.image_url} alt={it.name} className="w-full h-full object-cover" />
                            ) : (
                              <Placeholder name={it.name} />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between gap-2">
                              <p className="font-bold text-sm text-[var(--text-primary)] leading-tight line-clamp-2">{it.name}</p>
                              <button
                                type="button"
                                onClick={() => remove(it.id)}
                                className="shrink-0 w-7 h-7 rounded-lg bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center active:scale-90 transition"
                                aria-label={t("cart.remove")}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a1 1 0 01-1 1H7a1 1 0 01-1-1V6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </button>
                            </div>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5">
                              {fmtPrice(it.price)} {t("common.som")}/{it.unit}
                            </p>
                            <div className="flex items-center justify-between gap-2 mt-2">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => changeQty(it, -1)}
                                  className="w-8 h-8 rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] font-black active:scale-90 transition"
                                >−</button>
                                <span className="min-w-[3rem] text-center font-bold text-sm text-[var(--text-primary)]">
                                  {fmtQty(it.quantity)} <span className="text-[10px] text-[var(--text-muted)] font-medium">{it.unit}</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => changeQty(it, 1)}
                                  disabled={atMax}
                                  className="w-8 h-8 rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] font-black active:scale-90 transition disabled:opacity-40"
                                >+</button>
                              </div>
                              <p className="font-extrabold text-sm text-[var(--text-primary)] whitespace-nowrap">
                                {fmtPrice(Number(it.price) * it.quantity)} {t("common.som")}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("cart.notePlaceholder")}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border-2 bg-[var(--surface)] border-[var(--border)] outline-none focus:border-[var(--brand-primary)] text-sm resize-none text-[var(--text-primary)]"
            />
          </>
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed bottom-[4.5rem] inset-x-0 z-30 px-3 pointer-events-none">
          <div className="mx-auto max-w-2xl pointer-events-auto bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-[var(--shadow-brand)] p-3 flex items-center gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">{t("cart.grandTotal")}</p>
              <p className="text-xl font-black text-[var(--text-primary)] leading-tight">
                {fmtPrice(grandTotal)} <span className="text-sm">{t("common.som")}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={checkout}
              disabled={placing}
              className="btn btn-primary flex-1 !py-3 disabled:opacity-60"
            >
              {placing ? t("cart.placing") : t("cart.checkout")}
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} />
      <BottomNav />
    </div>
  );
}
