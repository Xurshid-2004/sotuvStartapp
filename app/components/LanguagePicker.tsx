"use client";

import { LOCALES, LOCALE_META, type Locale } from "../lib/locale";
import { useLocale } from "./LocaleProvider";

export default function LanguagePicker({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}) {
  const { locale, setLocale, t } = useLocale();
  if (!open) return null;

  const pick = (code: Locale) => {
    if (code !== locale) {
      setLocale(code);
      onSaved?.();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--text-primary)]/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-md bg-[var(--surface)] rounded-[20px] border border-[var(--border)] shadow-xl overflow-hidden fade-up">
        <div className="brand-header px-5 py-4">
          <p className="text-white text-lg font-bold">{t("languagePicker.title")}</p>
          <p className="text-white/80 text-sm mt-0.5">{t("languagePicker.subtitle")}</p>
        </div>
        <div className="p-2">
          {LOCALES.map((code) => {
            const meta = LOCALE_META[code];
            const active = locale === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => pick(code)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] text-left transition ${
                  active ? "bg-[var(--brand-primary-soft)] ring-2 ring-[var(--brand-primary)]/30" : "hover:bg-[var(--soft-border)]/60"
                }`}
              >
                <span className="text-2xl">{meta.flag}</span>
                <div className="flex-1">
                  <p className="font-bold text-[var(--text-primary)]">{meta.native}</p>
                  <p className="text-xs text-[var(--text-muted)]">{meta.label}</p>
                </div>
                {active && (
                  <span className="w-6 h-6 rounded-full bg-[var(--brand-primary)] text-white flex items-center justify-center">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="px-4 pb-4">
          <button type="button" onClick={onClose} className="btn btn-ghost w-full">{t("settings.cancel")}</button>
        </div>
      </div>
    </div>
  );
}
