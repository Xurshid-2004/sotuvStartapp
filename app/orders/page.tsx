"use client";

import { useEffect, useState, useCallback, useMemo, Suspense } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useRequireAuth } from "../lib/session";
import BottomNav from "../components/BottomNav";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import LoadingScreen from "../components/ui/LoadingScreen";
import Toast from "../components/ui/Toast";
import { useLocale } from "../components/LocaleProvider";
import { fmtPrice, fmtQty } from "../lib/format";

type Item = {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  product_image: string;
  quantity: number;
  fulfilled_quantity: number | null;
  status: string;
  reject_reason: string;
};

type Order = {
  id: number;
  manufacturer: number;
  manufacturer_name: string;
  manufacturer_phone: string;
  note: string;
  items: Item[];
  item_count: number;
  total_price: number;
  summary_status: string;
  created_at: string;
};

type OrderFilter = "all" | "jarayonda" | "yuborildi" | "yetkazildi" | "rad_etildi";

const STATUS_STYLE: Record<string, string> = {
  yangi: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-hover)]",
  qabul_qilindi: "bg-[var(--warning-soft)] text-[var(--brand-primary-hover)]",
  jarayonda: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-hover)]",
  yuborildi: "bg-[var(--success-soft)] text-[var(--success)]",
  yetkazildi: "bg-[var(--brand-primary)] text-[var(--brand-on)]",
  rad_etildi: "bg-[var(--danger-soft)] text-[var(--danger)]",
};

function Placeholder({ name }: { name: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--brand-primary-soft)]">
      <span className="text-xl font-extrabold text-[var(--brand-primary)]/50">{(name || "?").charAt(0)}</span>
    </div>
  );
}

function OrdersInner() {
  const router = useRouter();
  const { user, loading: authLoading } = useRequireAuth("sotuvchi");
  const { t } = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderFilter>("all");
  const [toast, setToast] = useState("");
  const [busy, setBusy] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const r = (await api("/orders/")) as Order[];
      setOrders(r);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const timer = setInterval(load, 15000);
    return () => clearInterval(timer);
  }, [authLoading, user, load]);

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.summary_status === filter)),
    [orders, filter],
  );

  const filters: { key: OrderFilter; label: string }[] = [
    { key: "all", label: t("orders.filterAll") },
    { key: "jarayonda", label: t("orders.status_jarayonda") },
    { key: "yuborildi", label: t("orders.status_yuborildi") },
    { key: "yetkazildi", label: t("orders.status_yetkazildi") },
    { key: "rad_etildi", label: t("orders.status_rad_etildi") },
  ];

  const statusLabel = (s: string) => t(`orders.status_${s}` as "orders.status_yangi");

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2800);
  };

  const reorderElsewhere = (it: Item) =>
    router.push(`/seler?q=${encodeURIComponent(it.product_name)}`);

  const messageOwner = async (o: Order) => {
    try {
      const conv = (await api("/conversations/", {
        method: "POST",
        body: { user_id: o.manufacturer },
      })) as { id: number };
      router.push(`/chat?c=${conv.id}`);
    } catch { /* ignore */ }
  };

  const confirmReceived = async (it: Item) => {
    setBusy(it.id);
    try {
      await api(`/requests/${it.id}/set_status/`, {
        method: "POST",
        body: { status: "yetkazildi" },
      });
      showToast(t("orders.status_yetkazildi"));
      await load();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setBusy(null);
    }
  };

  if (authLoading) return <LoadingScreen />;

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg)]">
      <PageHeader title={t("pages.orders")}>
        <div className="flex gap-2 overflow-x-auto no-sb pb-0.5">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition ${
                filter === f.key
                  ? "bg-white text-[var(--brand-primary-hover)] border-white"
                  : "bg-white/15 text-white border-white/25 hover:bg-white/25"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </PageHeader>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[var(--surface)] rounded-[20px] p-4 border border-[var(--soft-border)]">
              <div className="skeleton h-4 w-1/3 rounded mb-3" />
              <div className="skeleton h-12 w-full rounded" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t("orders.empty")}
            subtitle={t("orders.emptySub")}
            actionLabel={t("orders.toCatalog")}
            onAction={() => router.push("/seler")}
            icon="orders"
          />
        ) : (
          filtered.map((o) => (
            <div key={o.id} className="bg-[var(--surface)] rounded-[20px] border border-[var(--soft-border)] shadow-[var(--shadow-card)] overflow-hidden fade-up">
              <div className="px-4 py-3 flex items-center justify-between gap-2 border-b border-[var(--soft-border)]">
                <div className="min-w-0">
                  <p className="font-bold text-[var(--text-primary)] text-sm truncate">
                    {t("orders.orderNo")} #{o.id} · {o.manufacturer_name}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">
                    {fmtPrice(o.total_price)} {t("common.som")} · {t("cart.items", { n: o.item_count })}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap ${STATUS_STYLE[o.summary_status] || ""}`}>
                  {statusLabel(o.summary_status)}
                </span>
              </div>

              <div className="divide-y divide-[var(--soft-border)]">
                {o.items.map((it) => (
                  <div key={it.id} className="p-3 flex gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-[var(--soft-border)]">
                      {it.product_image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={it.product_image} alt={it.product_name} className="w-full h-full object-cover" />
                      ) : <Placeholder name={it.product_name} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <p className="font-semibold text-sm text-[var(--text-primary)] leading-tight">{it.product_name}</p>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap h-fit ${STATUS_STYLE[it.status] || ""}`}>
                          {statusLabel(it.status)}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        {fmtQty(it.fulfilled_quantity ?? it.quantity)} {it.product_unit}
                      </p>
                      {it.status === "rad_etildi" && it.reject_reason && (
                        <p className="text-xs text-[var(--danger)] mt-1.5 px-2.5 py-1.5 rounded-lg bg-[var(--danger-soft)]">
                          {t("orders.reason")}: {it.reject_reason}
                        </p>
                      )}
                      <div className="flex gap-2 mt-2">
                        {it.status === "yuborildi" && (
                          <button
                            type="button"
                            onClick={() => confirmReceived(it)}
                            disabled={busy === it.id}
                            className="btn btn-primary btn-sm disabled:opacity-60"
                          >
                            {busy === it.id ? "..." : t("orders.received")}
                          </button>
                        )}
                        {it.status === "rad_etildi" && (
                          <button type="button" onClick={() => reorderElsewhere(it)} className="btn btn-secondary btn-sm">
                            {t("orders.reorder")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-4 py-2.5 bg-[var(--surface-2)]">
                {o.note && <p className="text-xs text-[var(--text-muted)] mb-2">{t("orders.note")}: {o.note}</p>}
                <button type="button" onClick={() => messageOwner(o)} className="btn btn-secondary btn-sm w-full">
                  {t("orders.message")}
                </button>
              </div>
            </div>
          ))
        )}
      </main>
      <Toast message={toast} />
      <BottomNav />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <OrdersInner />
    </Suspense>
  );
}
