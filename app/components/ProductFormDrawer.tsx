"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Drawer } from "vaul";
import { categoryOptionsFor } from "../lib/categories";
import { useLocale } from "./LocaleProvider";

const LocationPickerMap = dynamic(() => import("./LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="h-44 w-full rounded-[14px] bg-[var(--soft-border)] animate-pulse flex items-center justify-center text-xs font-bold text-[var(--text-muted)]">
      Xarita yuklanmoqda...
    </div>
  ),
});

export type ProductFormData = {
  name: string;
  description: string;
  price: string;
  unit: string;
  stock: string;
  low_stock_threshold: string;
  category: string;
  producer_phone: string;
  location_address: string;
  latitude: string;
  longitude: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editId: number | null;
  form: ProductFormData;
  setForm: React.Dispatch<React.SetStateAction<ProductFormData>>;
  imagePreview: string;
  onImagePick: (e: React.ChangeEvent<HTMLInputElement>) => void;
  locationLoading: boolean;
  onPickLocation: () => void;
  saving: boolean;
  onSave: () => void;
};

const SNAP_POINTS = [0.78, 0.92, 1] as const;

const inputCls =
  "w-full px-4 py-3 rounded-[14px] bg-[var(--bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] border border-[var(--soft-border)] outline-none focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[var(--brand-primary)]/20 text-[15px] font-medium";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-[13px] font-bold text-[var(--text-secondary)]">{label}</label>
        {hint && <span className="text-[11px] font-medium text-[var(--text-muted)]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-[11px] font-extrabold uppercase tracking-widest text-[var(--brand-primary-hover)]">{title}</h4>
      <div className="space-y-3 rounded-[16px] bg-[var(--surface)] p-3.5 border border-[var(--soft-border)]">{children}</div>
    </section>
  );
}

export default function ProductFormDrawer({
  open,
  onOpenChange,
  editId,
  form,
  setForm,
  imagePreview,
  onImagePick,
  locationLoading,
  onPickLocation,
  saving,
  onSave,
}: Props) {
  const { t } = useLocale();
  const [mapReady, setMapReady] = useState(false);
  const [snap, setSnap] = useState<number | string | null>(1);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setMapReady(false);
      return;
    }
    setSnap(1);
    const focusTimer = window.setTimeout(() => nameRef.current?.focus(), 280);
    const mapTimer = window.setTimeout(() => setMapReady(true), 180);
    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(mapTimer);
    };
  }, [open]);

  const isEdit = editId != null;
  const canSave =
    !!form.name.trim() &&
    !!form.category &&
    !!form.producer_phone.trim() &&
    !!form.latitude &&
    !!form.longitude;

  const set =
    (k: keyof ProductFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      shouldScaleBackground={false}
      setBackgroundColorOnScale={false}
      repositionInputs
      handleOnly
      dismissible
      modal
      snapPoints={[...SNAP_POINTS]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      fadeFromIndex={0}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-[60] bg-[var(--text-primary)]/40 backdrop-blur-[1px]" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-[60] mx-auto flex max-h-[96dvh] w-full max-w-lg flex-col rounded-t-[20px] bg-[var(--surface)] outline-none border border-[var(--border)] border-b-0 shadow-[var(--shadow-card)] md:inset-auto md:left-1/2 md:top-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:max-h-[min(90dvh,820px)] md:rounded-[20px] md:border-b"
          aria-describedby={undefined}
        >
          {/* Katta tortish zonasi — faqat handle orqali (handleOnly) */}
          <div className="shrink-0 flex flex-col items-center pt-2 pb-1 md:hidden touch-pan-y">
            <Drawer.Handle className="vaul-handle-brand" />
            <p className="text-[10px] font-semibold text-[var(--text-muted)] mt-2 select-none">Pastga tortib yopish yoki o‘lchamni o‘zgartirish</p>
          </div>

          <div className="flex items-start justify-between gap-3 px-5 pt-1 pb-3 md:pt-4 border-b border-[var(--soft-border)] shrink-0">
            <div className="min-w-0">
              <Drawer.Title className="text-lg font-bold text-[var(--text-primary)] tracking-tight">
                {isEdit ? "Mahsulotni tahrirlash" : "Yangi mahsulot"}
              </Drawer.Title>
              <Drawer.Description className="text-sm font-medium text-[var(--text-muted)] mt-0.5">
                {isEdit ? "Ma'lumotlarni yangilang" : "Katalogga qo'shing"}
              </Drawer.Description>
            </div>
            <Drawer.Close
              type="button"
              className="w-10 h-10 rounded-[12px] bg-[var(--bg)] border border-[var(--soft-border)] text-[var(--text-secondary)] flex items-center justify-center hover:bg-[var(--brand-primary-soft)] active:scale-95 transition shrink-0"
              aria-label="Yopish"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </Drawer.Close>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 space-y-4 no-sb scroll-smooth">
            <Section title="Asosiy">
              <Field label="Mahsulot nomi">
                <input ref={nameRef} value={form.name} onChange={set("name")} placeholder="Masalan: Un 1-sinf" className={inputCls} />
              </Field>
              <Field label="Tavsif" hint="Ixtiyoriy">
                <textarea
                  value={form.description}
                  onChange={set("description")}
                  placeholder="Qisqa tavsif..."
                  rows={2}
                  className={`${inputCls} resize-none min-h-[72px]`}
                />
              </Field>
              <Field label="Kategoriya">
                <select value={form.category} onChange={set("category")} className={`${inputCls} appearance-none`}>
                  <option value="">Tanlang</option>
                  {categoryOptionsFor(form.category).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </Field>
            </Section>

            <Section title="Rasm">
              <label className="group relative flex flex-col items-center justify-center gap-2 w-full min-h-[120px] rounded-[14px] border-2 border-dashed border-[var(--border)] bg-[var(--bg)] cursor-pointer overflow-hidden hover:border-[var(--brand-primary)]/50 transition">
                {imagePreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={imagePreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="w-11 h-11 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-hover)] flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M4 16l4.5-4.5a2 2 0 012.8 0L16 16M14 14l1-1a2 2 0 012.8 0L21 16M3 20h18a1 1 0 001-1V5a1 1 0 00-1-1H3a1 1 0 00-1 1v14a1 1 0 001 1z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm font-bold text-[var(--text-secondary)]">Rasm yuklash</span>
                  </>
                )}
                <input type="file" accept="image/*" onChange={onImagePick} className="hidden" />
              </label>
            </Section>

            <Section title="Aloqa va manzil">
              <Field label={t("settings.phone")}>
                <input value={form.producer_phone} onChange={set("producer_phone")} placeholder="+998901234567" className={inputCls} inputMode="tel" />
              </Field>
              <Field label="Manzil">
                <input value={form.location_address} onChange={set("location_address")} placeholder="Toshkent, Chilonzor..." className={inputCls} />
              </Field>
              <div className="rounded-[14px] bg-[var(--bg)] p-2 border border-[var(--soft-border)]">
                <div className="flex items-center justify-between gap-2 mb-2 px-1">
                  <span className="text-[12px] font-bold text-[var(--text-secondary)]">Xaritadan tanlash</span>
                  <button type="button" onClick={onPickLocation} disabled={locationLoading} className="btn btn-primary btn-sm">
                    {locationLoading ? "..." : "GPS"}
                  </button>
                </div>
                {mapReady ? (
                  <LocationPickerMap
                    value={form.latitude && form.longitude ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null}
                    onChange={(c) => setForm((s) => ({ ...s, latitude: String(c.lat), longitude: String(c.lng) }))}
                  />
                ) : (
                  <div className="h-44 rounded-[14px] bg-[var(--soft-border)] animate-pulse" />
                )}
              </div>
            </Section>

            <Section title="Narx va zaxira">
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Narx (so'm)">
                  <input value={form.price} onChange={set("price")} type="number" inputMode="decimal" placeholder="120000" className={inputCls} />
                </Field>
                <Field label="Birlik">
                  <input value={form.unit} onChange={set("unit")} placeholder="kg, dona..." className={inputCls} />
                </Field>
                <Field label="Zaxira">
                  <input value={form.stock} onChange={set("stock")} type="number" step="0.001" inputMode="decimal" placeholder="100" className={inputCls} />
                </Field>
                <Field label="Kam zaxira" hint="Ogohlantirish">
                  <input value={form.low_stock_threshold} onChange={set("low_stock_threshold")} type="number" step="0.001" inputMode="decimal" placeholder="10" className={inputCls} />
                </Field>
              </div>
            </Section>
          </div>

          <div className="shrink-0 border-t border-[var(--soft-border)] bg-[var(--surface)] px-5 py-4 pb-[max(1rem,env(safe-area-inset-bottom))] flex gap-3 shadow-[var(--shadow-card)]">
            <Drawer.Close type="button" className="btn btn-secondary flex-1 min-h-[48px]">
              {t("settings.cancel")}
            </Drawer.Close>
            <button type="button" onClick={onSave} disabled={saving || !canSave} className="btn btn-primary flex-[1.6] min-h-[48px]">
              {saving ? "Saqlanmoqda..." : isEdit ? "Yangilash" : t("nav.add")}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
