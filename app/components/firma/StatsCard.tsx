import type { ReactNode } from "react";

type Variant = "primary" | "warning" | "revenue" | "alert";

const STYLES: Record<Variant, { accent: string; icon: string; label: string; value: string }> = {
  primary: {
    accent: "border-t-[var(--brand-primary)]",
    icon: "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]",
    label: "text-[var(--text-muted)]",
    value: "text-[var(--brand-primary-strong)]",
  },
  warning: {
    accent: "border-t-[var(--warning)]",
    icon: "bg-[var(--warning-soft)] text-[var(--warning)]",
    label: "text-[var(--text-muted)]",
    value: "text-[var(--warning)]",
  },
  revenue: {
    accent: "border-t-[var(--border)]",
    icon: "bg-[var(--surface-2)] text-[var(--text-secondary)]",
    label: "text-[var(--text-muted)]",
    value: "text-[var(--text-primary)]",
  },
  alert: {
    accent: "border-t-[var(--danger)]",
    icon: "bg-[var(--danger-soft)] text-[var(--danger)]",
    label: "text-[var(--text-muted)]",
    value: "text-[var(--danger)]",
  },
};

export default function StatsCard({
  label,
  value,
  variant,
  icon,
  highlight,
}: {
  label: string;
  value: string | number;
  variant: Variant;
  icon: ReactNode;
  highlight?: boolean;
}) {
  const s = STYLES[variant];
  return (
    <div
      className={`rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 min-h-[84px] flex flex-col justify-between border-t-[3px] shadow-sm ${s.accent} ${
        highlight ? "ring-1 ring-[var(--brand-primary)]/40 shadow-md shadow-[var(--brand-primary)]/10" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <p className={`text-[10px] font-bold uppercase tracking-wide leading-snug ${s.label}`}>{label}</p>
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${s.icon}`}>{icon}</span>
      </div>
      <p className={`text-xl sm:text-2xl font-extrabold leading-none mt-2 tabular-nums ${s.value}`}>{value}</p>
    </div>
  );
}
