import { getStoredLocale, LOCALE_META, type Locale } from "./locale";

function numberLocale(loc?: Locale) {
  const l = loc ?? (typeof window !== "undefined" ? getStoredLocale() : "uz");
  return LOCALE_META[l].numberLocale;
}

export function fmtPrice(value: string | number, loc?: Locale) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return Math.round(n).toLocaleString(numberLocale(loc));
}

export function fmtQty(value: string | number, loc?: Locale) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString(numberLocale(loc), { maximumFractionDigits: 3 });
}
