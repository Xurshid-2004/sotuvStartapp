"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, getRole, getFullName } from "../lib/api";
import BottomNav from "../components/BottomNav";

type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  stock: number;
  category: string;
  image_url: string;
};

type Req = {
  id: number;
  seller: number;
  seller_name: string;
  seller_email: string;
  product_name: string;
  product_unit: string;
  quantity: number;
  note: string;
  status: string;
  reject_reason: string;
  created_at: string;
};

const STATUS_LABEL: Record<string, string> = {
  yangi: "Yangi", qabul_qilindi: "Qabul qilindi", yuborildi: "Yuborildi", rad_etildi: "Rad etildi",
};
const STATUS_COLOR: Record<string, string> = {
  yangi: "bg-blue-100 text-blue-700",
  qabul_qilindi: "bg-amber-100 text-amber-700",
  yuborildi: "bg-emerald-100 text-emerald-700",
  rad_etildi: "bg-rose-100 text-rose-700",
};

function fmtPrice(p: string) {
  return Math.round(Number(p)).toLocaleString("ru-RU");
}

const emptyForm = { name: "", description: "", price: "", unit: "dona", stock: "", category: "", image_url: "" };

function FirmaInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [tab, setTab] = useState<"requests" | "products">("requests");
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [toast, setToast] = useState("");

  // mahsulot formasi (qo'shish/tahrir)
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [rejectReq, setRejectReq] = useState<Req | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadData = useCallback(async () => {
    try {
      const p = (await api("/products/?mine=1")) as Product[];
      setProducts(p);
      const r = (await api("/requests/")) as Req[];
      setRequests(r);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Yuklashda xatolik");
    }
  }, []);

  useEffect(() => {
    if (getRole() !== "ishlab_chiqaruvchi") {
      router.push("/sign_up");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
    if (params.get("tab") === "add") {
      setTab("products");
      setShowForm(true);
    }
  }, [router, loadData, params]);

  const showToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  };

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, description: p.description, price: String(p.price),
      unit: p.unit, stock: String(p.stock), category: p.category, image_url: p.image_url,
    });
    setShowForm(true);
  };

  const saveProduct = async () => {
    setSaving(true);
    const body = {
      name: form.name, description: form.description, price: form.price,
      unit: form.unit, stock: Number(form.stock) || 0,
      category: form.category, image_url: form.image_url,
    };
    try {
      if (editId != null) {
        await api(`/products/${editId}/`, { method: "PATCH", body });
        showToast("Mahsulot yangilandi");
      } else {
        await api("/products/", { method: "POST", body });
        showToast("Mahsulot qo'shildi");
      }
      setShowForm(false);
      loadData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteId == null) return;
    try {
      await api(`/products/${deleteId}/`, { method: "DELETE" });
      setDeleteId(null);
      showToast("Mahsulot o'chirildi");
      loadData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    }
  };

  const setStatus = async (id: number, status: string) => {
    await api(`/requests/${id}/set_status/`, { method: "POST", body: { status } });
    showToast(status === "qabul_qilindi" ? "Buyurtma qabul qilindi" : "Buyurtma yuborildi");
    loadData();
  };

  const openReject = (r: Req) => {
    setRejectReq(r);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectReq) return;
    try {
      await api(`/requests/${rejectReq.id}/set_status/`, {
        method: "POST",
        body: { status: "rad_etildi", reject_reason: rejectReason.trim() },
      });
      setRejectReq(null);
      showToast("Buyurtma rad etildi — sotuvchiga xabar yuborildi");
      loadData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    }
  };

  const messageSeller = async (r: Req) => {
    try {
      const conv = (await api("/conversations/", {
        method: "POST",
        body: { user_id: r.seller },
      })) as { id: number };
      router.push(`/chat?c=${conv.id}`);
    } catch {
      /* ignore */
    }
  };

  const F = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <header className="sticky top-0 z-30 bg-gradient-to-r from-violet-700 to-violet-600 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-black">Ishlab chiqaruvchi</h1>
            <p className="text-violet-200 text-xs">{getFullName()}</p>
          </div>
          <button onClick={openAdd} className="px-4 py-2 rounded-xl bg-white text-violet-700 font-bold text-sm active:scale-95 transition flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            Mahsulot
          </button>
        </div>
        <div className="max-w-5xl mx-auto px-4 pb-3 flex gap-2">
          <button onClick={() => setTab("requests")} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${tab === "requests" ? "bg-white text-violet-700" : "bg-white/15 text-white"}`}>
            Buyurtmalar ({requests.length})
          </button>
          <button onClick={() => setTab("products")} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${tab === "products" ? "bg-white text-violet-700" : "bg-white/15 text-white"}`}>
            Mahsulotlarim ({products.length})
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === "requests" ? (
          <div className="space-y-3">
            {requests.length === 0 && (
              <div className="text-center py-16">
                <div className="text-5xl mb-3">📭</div>
                <p className="font-bold" style={{ color: "var(--ink)" }}>Hozircha buyurtma yo&apos;q</p>
              </div>
            )}
            {requests.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-4 fade-up">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-black" style={{ color: "var(--ink)" }}>{r.product_name} — {r.quantity} {r.product_unit}</p>
                    <p className="text-sm text-violet-500">{r.seller_name} · {r.seller_email}</p>
                    {r.note && <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>Izoh: {r.note}</p>}
                    {r.status === "rad_etildi" && r.reject_reason && (
                      <p className="text-sm mt-1 text-rose-600">Rad sababi: {r.reject_reason}</p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs rounded-full font-bold whitespace-nowrap ${STATUS_COLOR[r.status]}`}>{STATUS_LABEL[r.status]}</span>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {r.status === "yangi" && (
                    <>
                      <button onClick={() => setStatus(r.id, "qabul_qilindi")} className="px-3 py-1.5 text-xs rounded-lg bg-amber-100 text-amber-700 font-semibold active:scale-95 transition">Qabul qilish</button>
                      <button onClick={() => openReject(r)} className="px-3 py-1.5 text-xs rounded-lg bg-rose-100 text-rose-700 font-semibold active:scale-95 transition">Rad etish</button>
                    </>
                  )}
                  {r.status === "qabul_qilindi" && (
                    <button onClick={() => setStatus(r.id, "yuborildi")} className="px-3 py-1.5 text-xs rounded-lg bg-emerald-100 text-emerald-700 font-semibold active:scale-95 transition">Yuborildi deb belgilash</button>
                  )}
                  <button onClick={() => messageSeller(r)} className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 text-white font-semibold active:scale-95 transition ml-auto flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinejoin="round" /></svg>
                    Yozish
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="text-5xl mb-3">📦</div>
                <p className="font-bold" style={{ color: "var(--ink)" }}>Mahsulot yo&apos;q</p>
                <button onClick={openAdd} className="mt-4 px-5 py-2.5 rounded-xl bg-violet-600 text-white font-bold text-sm">Birinchi mahsulotni qo&apos;shing</button>
              </div>
            )}
            {products.map((p, i) => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden flex flex-col fade-up" style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                <div className="aspect-square relative overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-100 to-violet-200">
                      <span className="text-5xl font-black text-violet-400/70">{(p.name || "?").charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {p.category && <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-white/90 text-[11px] font-bold text-violet-700">{p.category}</span>}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-sm leading-snug line-clamp-2" style={{ color: "var(--ink)" }}>{p.name}</h3>
                  <p className="text-base font-black mt-1" style={{ color: "var(--ink)" }}>{fmtPrice(p.price)} <span className="text-[11px] text-violet-400">so&apos;m/{p.unit}</span></p>
                  <p className="text-xs text-violet-400">Zaxira: {p.stock}</p>
                  <div className="flex gap-2 mt-auto pt-3">
                    <button onClick={() => openEdit(p)} className="flex-1 py-2 rounded-xl bg-violet-100 text-violet-700 font-bold text-xs active:scale-95 transition flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M11 4H4v16h16v-7M18.5 2.5a2.12 2.12 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinejoin="round" /></svg>
                      Tahrir
                    </button>
                    <button onClick={() => setDeleteId(p.id)} className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs active:scale-95 transition flex items-center justify-center gap-1">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" strokeLinejoin="round" /></svg>
                      O&apos;chirish
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Mahsulot formasi modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-violet-900/40 backdrop-blur-sm" onClick={() => setShowForm(false)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 fade-up max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-lg mb-4" style={{ color: "var(--ink)" }}>{editId != null ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}</h3>
            <div className="space-y-3">
              <input value={form.name} onChange={F("name")} placeholder="Nomi" className="w-full px-4 py-2.5 rounded-xl border-2 border-violet-100 outline-none focus:border-violet-400" style={{ color: "var(--ink)" }} />
              <textarea value={form.description} onChange={F("description")} placeholder="Tavsif (ixtiyoriy)" rows={2} className="w-full px-4 py-2.5 rounded-xl border-2 border-violet-100 outline-none focus:border-violet-400 resize-none" style={{ color: "var(--ink)" }} />
              <input value={form.image_url} onChange={F("image_url")} placeholder="Rasm havolasi (URL)" className="w-full px-4 py-2.5 rounded-xl border-2 border-violet-100 outline-none focus:border-violet-400" style={{ color: "var(--ink)" }} />
              <input value={form.category} onChange={F("category")} placeholder="Kategoriya (masalan: Ichimliklar)" className="w-full px-4 py-2.5 rounded-xl border-2 border-violet-100 outline-none focus:border-violet-400" style={{ color: "var(--ink)" }} />
              <div className="flex gap-2">
                <input value={form.price} onChange={F("price")} type="number" placeholder="Narx" className="w-1/3 px-4 py-2.5 rounded-xl border-2 border-violet-100 outline-none focus:border-violet-400" style={{ color: "var(--ink)" }} />
                <input value={form.unit} onChange={F("unit")} placeholder="Birlik" className="w-1/3 px-4 py-2.5 rounded-xl border-2 border-violet-100 outline-none focus:border-violet-400" style={{ color: "var(--ink)" }} />
                <input value={form.stock} onChange={F("stock")} type="number" placeholder="Zaxira" className="w-1/3 px-4 py-2.5 rounded-xl border-2 border-violet-100 outline-none focus:border-violet-400" style={{ color: "var(--ink)" }} />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl bg-violet-100 text-violet-700 font-bold active:scale-95 transition">Bekor</button>
              <button onClick={saveProduct} disabled={saving || !form.name.trim()} className="flex-[2] py-3 rounded-xl bg-violet-600 text-white font-bold active:scale-95 transition disabled:opacity-50">
                {saving ? "Saqlanmoqda..." : editId != null ? "Saqlash" : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rad etish modali (sabab bilan) */}
      {rejectReq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="absolute inset-0 bg-violet-900/40 backdrop-blur-sm" onClick={() => setRejectReq(null)} />
          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 fade-up">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" /></svg>
            </div>
            <p className="font-black text-lg text-center" style={{ color: "var(--ink)" }}>Buyurtmani rad etish</p>
            <p className="text-sm text-violet-400 text-center mt-1">{rejectReq.product_name} — {rejectReq.quantity} {rejectReq.product_unit}</p>
            <label className="block text-sm font-bold mt-4 mb-1" style={{ color: "var(--ink)" }}>Rad etish sababi</label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Masalan: Hozir omborda yo'q / narx o'zgardi / yetkazib bera olmaymiz..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl border-2 border-rose-100 outline-none focus:border-rose-400 text-sm resize-none"
              style={{ color: "var(--ink)" }}
            />
            <p className="text-[11px] text-violet-300 mt-1">Sabab sotuvchiga chat orqali yetkaziladi.</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectReq(null)} className="flex-1 py-3 rounded-xl bg-violet-100 text-violet-700 font-bold active:scale-95 transition">Bekor</button>
              <button onClick={confirmReject} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold active:scale-95 transition">Rad etish</button>
            </div>
          </div>
        </div>
      )}

      {/* O'chirish tasdiqlash */}
      {deleteId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-violet-900/40 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-3xl p-6 fade-up text-center">
            <div className="w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-3">
              <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinejoin="round" /></svg>
            </div>
            <p className="font-black text-lg" style={{ color: "var(--ink)" }}>Mahsulot o&apos;chirilsinmi?</p>
            <p className="text-sm text-violet-400 mt-1">Bu amalni ortga qaytarib bo&apos;lmaydi.</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-violet-100 text-violet-700 font-bold active:scale-95 transition">Bekor</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold active:scale-95 transition">O&apos;chirish</button>
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
}

export default function FirmaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--bg)" }} />}>
      <FirmaInner />
    </Suspense>
  );
}
