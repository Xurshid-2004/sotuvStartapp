"use client";

import { useEffect, useState, useCallback, Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { api, apiForm, getFullName } from "../lib/api";
import { useRequireAuth } from "../lib/session";
import { normalizeCategory } from "../lib/categories";
import { getCurrentUserLocation } from "../lib/map-helpers";
import BottomNav from "../components/BottomNav";
import { useLocale } from "../components/LocaleProvider";
import FirmaHeader from "../components/firma/FirmaHeader";
import StatsCard from "../components/firma/StatsCard";
import SearchBar from "../components/firma/SearchBar";
import FilterChips, { type ReqFilter } from "../components/firma/FilterChips";
import EmptyState from "../components/firma/EmptyState";

const ProductFormDrawer = dynamic(() => import("../components/ProductFormDrawer"), { ssr: false });


type Product = {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  stock: string;
  low_stock_threshold: string;
  is_active: boolean;
  is_low_stock: boolean;
  category: string;
  image_url: string;
  producer_phone: string;
  location_address: string;
  latitude: string;
  longitude: string;
};

type Req = {
  id: number;
  seller: number;
  seller_name: string;
  seller_email: string;
  seller_phone: string;
  product_name: string;
  product_unit: string;
  product_price: string;
  product_image: string;
  quantity: string;
  fulfilled_quantity: string | null;
  total_price: number;
  note: string;
  status: string;
  reject_reason: string;
  created_at: string;
};

type Dashboard = {
  new_orders: number;
  in_progress: number;
  completed_week: number;
  revenue_today: number;
  low_stock_count: number;
  total_products: number;
  active_products: number;
};

const STATUS_COLOR: Record<string, string> = {
  yangi: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-hover)] ring-2 ring-[var(--brand-primary)]/25",
  qabul_qilindi: "bg-[var(--warning-soft)] text-[var(--brand-primary-hover)]",
  yuborildi: "bg-[var(--success-soft)] text-[var(--success)]",
  yetkazildi: "bg-[var(--brand-primary)] text-[var(--brand-on)]",
  rad_etildi: "bg-[var(--danger-soft)] text-[var(--danger)]",
};

const REJECT_TEMPLATES = [
  "Hozir omborda yetarli mahsulot yo'q",
  "Narx o'zgardi — yangi narx bilan qayta buyurtma bering",
  "Yetkazib bera olmaymiz",
  "Mahsulot vaqtincha mavjud emas",
];

function fmtPrice(p: string | number) {
  return Math.round(Number(p)).toLocaleString("ru-RU");
}

function fmtQty(v: string | number) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("ru-RU", { maximumFractionDigits: 3 });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Hozirgina";
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  return `${Math.floor(h / 24)} kun oldin`;
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  unit: "dona",
  stock: "",
  low_stock_threshold: "10",
  category: "",
  producer_phone: "",
  location_address: "",
  latitude: "",
  longitude: "",
};

function FirmaInner() {
  const { t } = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useRequireAuth("ishlab_chiqaruvchi");
  const [tab, setTab] = useState<"requests" | "products">("requests");
  const [products, setProducts] = useState<Product[]>([]);
  const [requests, setRequests] = useState<Req[]>([]);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [reqFilter, setReqFilter] = useState<ReqFilter>("all");
  const [reqSearch, setReqSearch] = useState("");
  const [toast, setToast] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [rejectReq, setRejectReq] = useState<Req | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [fulfillReq, setFulfillReq] = useState<Req | null>(null);
  const [fulfillQty, setFulfillQty] = useState("");

  const showToast = useCallback((m: string) => {
    setToast(m);
    setTimeout(() => setToast(""), 2600);
  }, []);

  const loadData = useCallback(async () => {
    try {
      const q = new URLSearchParams();
      if (reqFilter === "yangi") q.set("status", "yangi");
      else if (reqFilter === "jarayonda") q.set("group", "jarayonda");
      else if (reqFilter === "yakunlangan") q.set("group", "yakunlangan");
      if (reqSearch.trim()) q.set("q", reqSearch.trim());
      const reqPath = q.toString() ? `/requests/?${q}` : "/requests/";
      const [p, r, d] = await Promise.all([
        api("/products/?mine=1") as Promise<Product[]>,
        api(reqPath) as Promise<Req[]>,
        api("/dashboard/") as Promise<Dashboard>,
      ]);
      setProducts(p);
      setRequests(r);
      setDashboard(d);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Yuklashda xatolik");
    }
  }, [reqFilter, reqSearch, showToast]);

  useEffect(() => {
    if (authLoading || !user) return;
    loadData();
    if (params.get("tab") === "add") {
      setTab("products");
      setShowForm(true);
    }
  }, [authLoading, user, loadData, params]);

  useEffect(() => {
    if (authLoading || !user) return;
    const t = setInterval(loadData, 15000);
    return () => clearInterval(t);
  }, [authLoading, user, loadData]);

  const newCount = dashboard?.new_orders ?? 0;

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    setImageFile(null);
    setImagePreview("");
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      name: p.name, description: p.description, price: String(p.price),
      unit: p.unit,
      stock: String(p.stock),
      low_stock_threshold: String(p.low_stock_threshold || "10"),
      category: normalizeCategory(p.category),
      producer_phone: p.producer_phone || "",
      location_address: p.location_address || "",
      latitude: p.latitude ? String(p.latitude) : "",
      longitude: p.longitude ? String(p.longitude) : "",
    });
    setImageFile(null);
    setImagePreview(p.image_url || "");
    setShowForm(true);
  };

  const onImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Faqat rasm faylini tanlang");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const buildProductFormData = () => {
    const fd = new FormData();
    const normalizedStock = form.stock.replace(",", ".").trim();
    fd.append("name", form.name.trim());
    fd.append("description", form.description);
    fd.append("price", form.price);
    fd.append("unit", form.unit.trim() || "dona");
    fd.append("stock", normalizedStock || "0");
    fd.append("low_stock_threshold", form.low_stock_threshold.replace(",", ".") || "10");
    fd.append("category", normalizeCategory(form.category));
    fd.append("producer_phone", form.producer_phone.trim());
    fd.append("location_address", form.location_address.trim());
    fd.append("latitude", form.latitude);
    fd.append("longitude", form.longitude);
    if (imageFile) fd.append("image", imageFile);
    return fd;
  };

  const pickCurrentLocation = async () => {
    setLocationLoading(true);
    try {
      const loc = await getCurrentUserLocation();
      setForm((s) => ({
        ...s,
        latitude: loc.lat.toFixed(6),
        longitude: loc.lng.toFixed(6),
      }));
      showToast("Joriy lokatsiya olindi");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Lokatsiya olinmadi");
    } finally {
      setLocationLoading(false);
    }
  };

  const saveProduct = async () => {
    setSaving(true);
    try {
      const body = buildProductFormData();
      if (editId != null) {
        await apiForm(`/products/${editId}/`, { method: "PATCH", body });
        showToast("Mahsulot yangilandi");
      } else {
        await apiForm("/products/", { method: "POST", body });
        showToast("Mahsulot qo'shildi");
      }
      setShowForm(false);
      setImageFile(null);
      setImagePreview("");
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

  const setStatus = async (id: number, status: string, extra: Record<string, unknown> = {}) => {
    await api(`/requests/${id}/set_status/`, { method: "POST", body: { status, ...extra } });
    showToast(status === "qabul_qilindi" ? "Buyurtma qabul qilindi" : "Buyurtma yuborildi");
    loadData();
  };

  const acceptAndMessage = async (r: Req) => {
    try {
      await setStatus(r.id, "qabul_qilindi");
      const conv = (await api("/conversations/", {
        method: "POST",
        body: { user_id: r.seller },
      })) as { id: number };
      router.push(`/chat?c=${conv.id}`);
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    }
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

  const openFulfill = (r: Req) => {
    setFulfillReq(r);
    setFulfillQty(String(r.quantity));
  };

  const confirmFulfill = async () => {
    if (!fulfillReq) return;
    const qty = Number(fulfillQty.replace(",", "."));
    if (!Number.isFinite(qty) || qty <= 0) {
      showToast("Miqdor noto'g'ri");
      return;
    }
    try {
      await api(`/requests/${fulfillReq.id}/set_status/`, {
        method: "POST",
        body: { status: "yuborildi", fulfilled_quantity: qty },
      });
      setFulfillReq(null);
      showToast("Buyurtma yuborildi deb belgilandi");
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
      showToast("Chat ochib bo'lmadi");
    }
  };

  const quickStock = async (id: number, delta: number) => {
    try {
      await api(`/products/${id}/quick_stock/`, { method: "POST", body: { delta } });
      showToast(delta > 0 ? `Zaxiraga +${delta} qo'shildi` : `Zaxiradan ${Math.abs(delta)} ayirildi`);
      loadData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    }
  };

  const toggleActive = async (id: number) => {
    try {
      await api(`/products/${id}/toggle_active/`, { method: "POST" });
      showToast("Mahsulot holati o'zgartirildi");
      loadData();
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Xatolik");
    }
  };

  const dashboardStats = useMemo(() => {
    if (!dashboard) return null;
    return {
      newOrders: dashboard.new_orders,
      inProgress: dashboard.in_progress,
      revenue: `${fmtPrice(dashboard.revenue_today)} so'm`,
      lowStock: dashboard.low_stock_count,
    };
  }, [dashboard]);

  const isEmptyAll = requests.length === 0 && reqFilter === "all" && !reqSearch.trim();

  return (
    <div className="min-h-screen pb-[4.5rem] bg-[var(--bg)]">
      {authLoading ? (
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-9 h-9 border-4 border-[var(--brand-primary-soft)] border-t-[var(--brand-primary)] rounded-full animate-spin" />
        </div>
      ) : (
      <>
      <FirmaHeader
        name={getFullName()}
        subtitle={`${dashboard?.active_products ?? products.length} ta faol mahsulot`}
        activeTab={tab}
        requestsCount={requests.length}
        productsCount={products.length}
        newOrdersBadge={newCount}
        onTabChange={setTab}
        onAddProduct={openAdd}
      />

      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-3 space-y-3.5">
        {dashboardStats && tab === "requests" && (
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <StatsCard
              label="Yangi buyurtmalar"
              value={dashboardStats.newOrders}
              variant="primary"
              highlight={dashboardStats.newOrders > 0}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <StatsCard
              label={t("firma.inProgress")}
              value={dashboardStats.inProgress}
              variant="warning"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 7v5l3 3" strokeLinecap="round" />
                </svg>
              }
            />
            <StatsCard
              label="Bugungi tushum"
              value={dashboardStats.revenue}
              variant="revenue"
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
            <StatsCard
              label="Kam zaxira"
              value={dashboardStats.lowStock}
              variant="alert"
              highlight={dashboardStats.lowStock > 0}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              }
            />
          </section>
        )}

        {tab === "requests" ? (
          <div className="space-y-4">
            <SearchBar
              value={reqSearch}
              onChange={setReqSearch}
              onSearch={loadData}
            />
            <FilterChips value={reqFilter} onChange={setReqFilter} />

            {requests.length === 0 && (
              isEmptyAll ? (
                <EmptyState
                  title="Hozircha buyurtmalar yo'q"
                  subtitle="Yangi buyurtmalar kelganda shu yerda ko'rinadi"
                  actionLabel={t("firma.addProduct")}
                  onAction={openAdd}
                  icon="inbox"
                />
              ) : (
                <EmptyState
                  title="Buyurtma topilmadi"
                  subtitle="Boshqa filtr yoki qidiruv so'zini sinab ko'ring"
                  icon="search"
                />
              )
            )}
            {requests.map((r) => (
              <div key={r.id} className={`bg-[var(--surface)] rounded-[20px] border border-[var(--soft-border)] p-4 fade-up shadow-[var(--shadow-card)] ${r.status === "yangi" ? "ring-2 ring-[var(--brand-primary)]/25" : ""}`}>
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-[var(--brand-primary-soft)] border border-[var(--soft-border)]">
                    {r.product_image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.product_image} alt={r.product_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--brand-primary)] font-extrabold text-xl">{(r.product_name || "?").charAt(0)}</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{r.product_name}</p>
                        <p className="text-sm text-[var(--text-secondary)] font-semibold">{fmtQty(r.quantity)} {r.product_unit} · {fmtPrice(r.total_price)} so&apos;m</p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">{timeAgo(r.created_at)}</p>
                      </div>
                      <span className={`px-3 py-1 text-xs rounded-full font-bold whitespace-nowrap ${STATUS_COLOR[r.status]}`}>{t(`orders.status_${r.status}`)}</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mt-1">{r.seller_name} · {r.seller_email}</p>
                    {r.seller_phone && (
                      <a href={`tel:${r.seller_phone}`} className="inline-flex items-center gap-1 text-sm text-[var(--brand-primary-hover)] font-semibold mt-1">
                        {r.seller_phone}
                      </a>
                    )}
                    {r.note && <p className="text-sm mt-1 text-[var(--text-muted)]">{t("orders.note")}: {r.note}</p>}
                    {r.status === "rad_etildi" && r.reject_reason && (
                      <p className="text-sm mt-1 text-[var(--danger)]">Rad sababi: {r.reject_reason}</p>
                    )}
                    {r.fulfilled_quantity && r.status === "yuborildi" && (
                      <p className="text-sm mt-1 text-[var(--success)] font-medium">{t("orders.status_yuborildi")}: {fmtQty(r.fulfilled_quantity)} {r.product_unit}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  {r.status === "yangi" && (
                    <>
                      <button onClick={() => setStatus(r.id, "qabul_qilindi")} className="btn btn-secondary btn-sm">{t("firma.accept")}</button>
                      <button onClick={() => acceptAndMessage(r)} className="btn btn-secondary btn-sm">Qabul + yozish</button>
                      <button onClick={() => openReject(r)} className="btn btn-danger-soft btn-sm">{t("firma.reject")}</button>
                    </>
                  )}
                  {r.status === "qabul_qilindi" && (
                    <button onClick={() => openFulfill(r)} className="btn btn-secondary btn-sm">Yuborildi deb belgilash</button>
                  )}
                  <button onClick={() => messageSeller(r)} className="btn btn-primary btn-sm ml-auto">{t("orders.message")}</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.length === 0 && (
              <div className="col-span-full">
                <EmptyState
                  title="Mahsulot yo'q"
                  subtitle="Birinchi mahsulotingizni qo'shing va sotuvchilarga ko'ring"
                  actionLabel={t("firma.addProduct")}
                  onAction={openAdd}
                  icon="box"
                />
              </div>
            )}
            {products.map((p, i) => {
              const threshold = Number(p.low_stock_threshold) || 10;
              const stockNum = Number(p.stock) || 0;
              const pct = threshold > 0 ? Math.min(100, (stockNum / (threshold * 3)) * 100) : 100;
              return (
              <div key={p.id} className={`bg-[var(--surface)] rounded-[20px] border border-[var(--soft-border)] overflow-hidden flex flex-col fade-up shadow-[var(--shadow-card)] ${!p.is_active ? "opacity-60" : ""}`} style={{ animationDelay: `${Math.min(i * 40, 400)}ms` }}>
                <div className="aspect-square relative overflow-hidden">
                  {p.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-[var(--brand-primary-soft)]">
                      <span className="text-5xl font-extrabold text-[var(--brand-primary)]/50">{(p.name || "?").charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                  {p.category && <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[var(--surface)]/95 text-[11px] font-bold text-[var(--text-secondary)] border border-[var(--soft-border)]">{p.category}</span>}
                  {p.is_low_stock && <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-[var(--accent-pink)] text-white text-[10px] font-bold">Kam zaxira</span>}
                  {!p.is_active && <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-[var(--text-primary)] text-[var(--surface)] text-[10px] font-bold">Nofaol</span>}
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-sm leading-snug line-clamp-2 text-[var(--text-primary)]">{p.name}</h3>
                  <p className="text-base font-extrabold mt-1 text-[var(--text-primary)]">{fmtPrice(p.price)} <span className="text-[11px] text-[var(--text-muted)] font-medium">so&apos;m/{p.unit}</span></p>
                  <p className="text-xs text-[var(--text-muted)]">{t("firma.stock")}: {fmtQty(p.stock)} {p.unit}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-[var(--soft-border)] overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${p.is_low_stock ? "bg-[var(--accent-pink)]" : "bg-[var(--brand-primary)]"}`} style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex gap-1 mt-2">
                    <button onClick={() => quickStock(p.id, 10)} className="flex-1 py-1 rounded-lg bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] text-[10px] font-bold">+10</button>
                    <button onClick={() => quickStock(p.id, -10)} className="flex-1 py-1 rounded-lg bg-rose-50 text-rose-600 text-[10px] font-bold">-10</button>
                    <button onClick={() => toggleActive(p.id)} className="flex-1 py-1 rounded-lg bg-[var(--surface-2)] text-[var(--text-secondary)] text-[10px] font-bold">{p.is_active ? "O'chir" : "Yoq"}</button>
                  </div>
                  <div className="flex gap-2 mt-auto pt-3">
                    <button onClick={() => openEdit(p)} className="flex-1 py-2 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] font-bold text-xs active:scale-95 transition">Tahrir</button>
                    <button onClick={() => setDeleteId(p.id)} className="flex-1 py-2 rounded-xl bg-rose-50 text-rose-600 font-bold text-xs active:scale-95 transition">{t("firma.delete")}</button>
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </main>

      <ProductFormDrawer
        open={showForm}
        onOpenChange={setShowForm}
        editId={editId}
        form={form}
        setForm={setForm}
        imagePreview={imagePreview}
        onImagePick={onImagePick}
        locationLoading={locationLoading}
        onPickLocation={pickCurrentLocation}
        saving={saving}
        onSave={saveProduct}
      />

      {rejectReq && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--text-primary)]/50 backdrop-blur-sm" onClick={() => setRejectReq(null)} />
          <div className="relative bg-[var(--surface)] w-full sm:max-w-md rounded-3xl p-6 fade-up">
            <p className="font-black text-lg text-center text-[var(--text-primary)]">Buyurtmani rad etish</p>
            <p className="text-sm text-[var(--text-muted)] text-center mt-1">{rejectReq.product_name}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {REJECT_TEMPLATES.map((tpl) => (
                <button key={tpl} type="button" onClick={() => setRejectReason(tpl)} className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 text-xs font-semibold border border-rose-100">{tpl}</button>
              ))}
            </div>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="Sabab..." className="w-full mt-3 px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-sm resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={() => setRejectReq(null)} className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)] font-bold">{t("settings.cancel")}</button>
              <button onClick={confirmReject} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold">{t("firma.reject")}</button>
            </div>
          </div>
        </div>
      )}

      {fulfillReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--text-primary)]/50 backdrop-blur-sm" onClick={() => setFulfillReq(null)} />
          <div className="relative bg-[var(--surface)] w-full max-w-sm rounded-3xl p-6 fade-up">
            <p className="font-black text-lg text-[var(--text-primary)]">Yuborish miqdori</p>
            <p className="text-sm text-[var(--brand-primary-strong)] mt-1">{fulfillReq.product_name} — buyurtma: {fmtQty(fulfillReq.quantity)} {fulfillReq.product_unit}</p>
            <input value={fulfillQty} onChange={(e) => setFulfillQty(e.target.value.replace(",", "."))} className="w-full mt-4 px-4 py-3 rounded-xl border-2 border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] text-center text-xl font-black" />
            <p className="text-[11px] text-[var(--text-muted)] mt-2">Kamroq yuborsangiz, qolgan qism zaxiraga qaytariladi.</p>
            <div className="flex gap-3 mt-4">
              <button onClick={() => setFulfillReq(null)} className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)] font-bold">{t("settings.cancel")}</button>
              <button onClick={confirmFulfill} className="flex-1 py-3 rounded-xl bg-[var(--brand-primary)] text-[var(--brand-on)] font-bold">Tasdiqlash</button>
            </div>
          </div>
        </div>
      )}

      {deleteId != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--text-primary)]/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-[var(--surface)] w-full max-w-sm rounded-3xl p-6 text-center">
            <p className="font-black text-lg text-[var(--text-primary)]">Mahsulot o&apos;chirilsinmi?</p>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl bg-[var(--surface-2)] text-[var(--text-secondary)] font-bold">{t("settings.cancel")}</button>
              <button onClick={confirmDelete} className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold">{t("firma.delete")}</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-[var(--surface)] font-semibold text-sm shadow-2xl bg-[var(--text-primary)]">✓ {toast}</div>
      )}

      <BottomNav />
      </>
      )}
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
