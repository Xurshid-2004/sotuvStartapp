"use client";

import { useLocale } from "../LocaleProvider";

export type ReqFilter = "all" | "yangi" | "jarayonda" | "yakunlangan";

const LABEL_KEYS: Record<ReqFilter, string> = {
  all: "orders.filterAll",
  yangi: "orders.filterPending",
  jarayonda: "orders.filterActive",
  yakunlangan: "orders.filterDone",
};

const FILTERS: ReqFilter[] = ["all", "yangi", "jarayonda", "yakunlangan"];

type Props = {
  value: ReqFilter;
  onChange: (f: ReqFilter) => void;
};

export default function FilterChips({ value, onChange }: Props) {
  const { t } = useLocale();
  return (
    <div className="flex gap-1.5 overflow-x-auto no-sb pb-0.5">
      {FILTERS.map((f) => {
        const active = value === f;
        return (
          <button
            key={f}
            type="button"
            onClick={() => onChange(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              active
                ? "bg-[var(--brand-primary)] text-[var(--brand-on)] shadow-sm"
                : "bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-primary-muted)] hover:text-[var(--brand-primary-strong)]"
            }`}
          >
            {t(LABEL_KEYS[f])}
          </button>
        );
      })}
    </div>
  );
}
