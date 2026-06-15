"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { api, getRole } from "../lib/api";
import BottomNav from "../components/BottomNav";

type Req = {
  id: number;
  product: number;
  product_name: string;
  product_unit: string;
  product_image: string;
  manufacturer_id: number;
  manufacturer_name: string;
  quantity: number;
  note: string;
  status: string;
  reject_reason: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  yangi: "Kutilmoqda",
  qabul_qilindi: "Qabul qilindi",
  yuborildi: "Yuborildi",
  rad_etildi: "Qabul qilinmadi",
};
const STATUS_COLOR: Record<string, string> = {
  yangi: "bg-blue-100 text-blue-700",
  qabul_qilindi: "bg-amber-100 text-amber-700",
  yuborildi: "bg-emerald-100 text-emerald-700",
  rad_etildi: "bg-rose-100 text-rose-700",
};

function Placeholder({ name }: { name: string }) {
  const letter = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-200">
      <span className="text-2xl font-black text-violet-400/70">{letter}</span>
    </div>
  );
}

function OrdersInner() {
  const router = useRouter();
  const [requests, setRequests] = useState<Req[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = (await api("/requests/")) as Req[];
      setRequests(r);
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
  }, [router, load]);

  // Rad etilganda boshqa ishlab chiqaruvchidan qayta buyurtma:
  // katalogga o'tib, o'sha mahsulot nomini qidiruvga qo'yamiz
  const reorderElsewhere = (r: Req) => {
    router.push(`/seler?q=${encodeURIComponent(r.product_name)}`);
  };

  const messageOwner = async (r: Req) => {
    try {
      const conv = (await api("/conversations/", {
        method: "POST",
        body: { user_id: r.manufacturer_id, product: r.product },
      })) as { id: number };
      router.push(`/chat?c=${conv.id}`);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-20 bg-gradient-to-r from-violet-700 to-violet-600 px-4 py-4 shadow-lg">
        <h1 className="text-white text-xl font-black">Buyurtmalarim</h1>
      </header>

      <main className="max-w-2xl mx-auto px-3 py-4">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 flex gap-3">
                <div className="skeleton w-16 h-16 rounded-xl" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-1/2 rounded mb-2" />
                  <div className="skeleton h-3 w-3/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🧾</div>
            <p className="font-bold text-lg" style={{ color: "var(--ink)" }}>Hali buyurtma yo&apos;q</p>
            <button onClick={() => router.push("/seler")} className="mt-4 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm">Katalogga o&apos;tish</button>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-3 fade-up">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                    {r.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.product_image} alt={r.product_name} className="w-full h-full object-cover" />
                    ) : <Placeholder name={r.product_name} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold leading-tight" style={{ color: "var(--ink)" }}>{r.product_name}</p>
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                    </div>
                    <p className="text-sm text-violet-500">{r.quantity} {r.product_unit} · {r.manufacturer_name}</p>
                    {r.note && <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>Izoh: {r.note}</p>}
                    {r.status === "rad_etildi" && r.reject_reason && (
                      <div className="mt-2 px-3 py-2 rounded-xl bg-rose-50 border border-rose-100">
                        <p className="text-xs text-rose-700"><span className="font-bold">Sabab:</span> {r.reject_reason}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {r.status === "rad_etildi" && (
                    <button onClick={() => reorderElsewhere(r)} className="flex-1 py-2 rounded-xl bg-violet-600 text-white font-bold text-xs active:scale-95 transition flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M1 4v6h6M23 20v-6h-6M3.5 9a9 9 0 0114.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0020.5 15" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      Boshqa ishlab chiqaruvchidan
                    </button>
                  )}
                  <button onClick={() => messageOwner(r)} className="flex-1 py-2 rounded-xl bg-violet-100 text-violet-700 font-bold text-xs active:scale-95 transition flex items-center justify-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinejoin="round" /></svg>
                    Yozish
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

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--bg)" }} />}>
      <OrdersInner />
    </Suspense>
  );
}
