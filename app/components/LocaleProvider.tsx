"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getStoredLocale, LOCALE_META, storeLocale, translate, type Locale } from "../lib/locale";

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  ready: boolean;
};

const LocaleContext = createContext<Ctx | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("uz");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = getStoredLocale();
    setLocaleState(stored);
    document.documentElement.lang = LOCALE_META[stored].htmlLang;
    setReady(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    storeLocale(next);
    document.documentElement.lang = LOCALE_META[next].htmlLang;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t, ready }), [locale, setLocale, t, ready]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
