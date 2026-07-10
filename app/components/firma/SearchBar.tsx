"use client";

import { useLocale } from "../LocaleProvider";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSearch: () => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChange, onSearch, placeholder }: Props) {
  const { t } = useLocale();
  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSearch()}
          placeholder={placeholder || t("firma.searchOrders")}
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-sm font-medium outline-none focus:border-[var(--brand-primary)] focus:ring-1 focus:ring-[var(--brand-primary)]/30 transition"
        />
      </div>
      <button
        type="button"
        onClick={onSearch}
        className="px-4 py-2 rounded-lg bg-[var(--brand-primary)] hover:bg-[var(--brand-primary-hover)] text-[var(--brand-on)] text-xs font-bold transition active:scale-[0.98] shrink-0"
      >
        Qidirish
      </button>
    </div>
  );
}
