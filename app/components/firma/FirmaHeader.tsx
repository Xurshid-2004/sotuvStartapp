"use client";

import Logo from "../Logo";
import { useLocale } from "../LocaleProvider";

type Props = {
  name: string;
  subtitle?: string;
  activeTab: "requests" | "products";
  requestsCount: number;
  productsCount: number;
  newOrdersBadge: number;
  onTabChange: (tab: "requests" | "products") => void;
  onAddProduct: () => void;
};

function initials(name: string) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function FirmaHeader({
  name,
  subtitle,
  activeTab,
  requestsCount,
  productsCount,
  newOrdersBadge,
  onTabChange,
  onAddProduct,
}: Props) {
  const { t } = useLocale();
  const tabs = [
    { id: "requests" as const, label: t("firma.tabOrders"), count: requestsCount, badge: newOrdersBadge },
    { id: "products" as const, label: t("firma.tabProducts"), count: productsCount, badge: 0 },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[var(--surface)]/90 backdrop-blur-lg border-b border-[var(--border)] shadow-sm">
      <div className="max-w-5xl mx-auto px-3 sm:px-4">
        <div className="flex items-center gap-2.5 py-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] flex items-center justify-center text-[var(--brand-on)] font-bold text-xs shrink-0 shadow-sm shadow-[var(--brand-primary)]/25 overflow-hidden">
            {name ? initials(name) : <Logo size={24} showText={false} />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-[var(--text-primary)] text-sm font-bold truncate leading-tight">
              {name || t("settings.manufacturer")}
            </h1>
            <p className="text-[var(--text-muted)] text-[10px] font-medium truncate">
              {subtitle || t("firma.dashboard")}
            </p>
          </div>
          <button
            type="button"
            onClick={onAddProduct}
            className="shrink-0 inline-flex items-center gap-1 h-8 px-2.5 sm:px-3 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-on)] text-xs font-bold transition active:scale-[0.97]"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
            <span className="hidden sm:inline">Mahsulot</span>
          </button>
        </div>

        <div className="flex gap-1 -mb-px">
          {tabs.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`relative flex-1 py-2 text-xs font-bold transition-colors ${
                  active ? "text-[var(--brand-primary-strong)]" : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                }`}
              >
                {tab.label}
                <span className={`ml-1 tabular-nums ${active ? "text-[var(--brand-primary)]/80" : "text-[var(--text-muted)]"}`}>
                  {tab.count}
                </span>
                {tab.badge > 0 && !active && (
                  <span className="absolute top-1 right-2 min-w-[14px] h-[14px] px-0.5 rounded-full bg-[var(--danger)] text-white text-[8px] font-extrabold flex items-center justify-center">
                    {tab.badge > 9 ? "9+" : tab.badge}
                  </span>
                )}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full bg-[var(--brand-primary)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
