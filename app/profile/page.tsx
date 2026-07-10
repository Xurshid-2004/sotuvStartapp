"use client";

import { useCallback, useEffect, useState } from "react";
import BottomNav from "../components/BottomNav";
import LanguagePicker from "../components/LanguagePicker";
import LoadingScreen from "../components/ui/LoadingScreen";
import Toast from "../components/ui/Toast";
import { useLocale } from "../components/LocaleProvider";
import { useTheme, type Theme } from "../components/ThemeProvider";
import { LOCALE_META } from "../lib/locale";
import { api, logout } from "../lib/api";
import { useRequireAuth, type UserSession } from "../lib/session";

function initials(name: string) {
  const parts = (name || "?").trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

type Stats = { orders: number; unread: number; favorites: number };

function SettingRow({ href, icon, label, sub, badge, onClick, danger, trailing }: {
  href?: string; icon: React.ReactNode; label: string; sub?: string; badge?: number;
  onClick?: () => void; danger?: boolean; trailing?: React.ReactNode;
}) {
  const inner = (
    <>
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${danger ? "bg-[var(--danger-soft)] text-[var(--danger)]" : "bg-[var(--brand-primary-soft)] text-[var(--brand-primary-hover)]"}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className={`font-bold truncate ${danger ? "text-[var(--danger)]" : "text-[var(--text-primary)]"}`}>{label}</p>
        {sub && <p className="text-xs text-[var(--text-muted)] truncate">{sub}</p>}
      </div>
      {badge != null && badge > 0 && (
        <span className="min-w-[20px] h-5 px-1 rounded-full bg-[var(--accent-pink)] text-white text-[10px] font-extrabold flex items-center justify-center">{badge > 99 ? "99+" : badge}</span>
      )}
      {trailing}
      {!danger && !trailing && (
        <svg className="w-4 h-4 text-[var(--text-muted)]/40 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
      )}
    </>
  );
  const cls = "w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--brand-primary-soft)]/40 transition text-left";
  if (href) return <a href={href} className={cls}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface)] rounded-[20px] border border-[var(--soft-border)] shadow-[0_2px_12px_-4px_rgba(15,23,42,0.06)] overflow-hidden">
      <p className="px-4 pt-3.5 pb-1 text-[10px] font-extrabold uppercase tracking-widest text-[var(--text-muted)]">{title}</p>
      <div className="divide-y divide-[var(--soft-border)]">{children}</div>
    </div>
  );
}

function ThemeSegmented() {
  const { theme, setTheme } = useTheme();
  const { t } = useLocale();
  const opts: { key: Theme; label: string; icon: React.ReactNode }[] = [
    { key: "light", label: t("theme.light"), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" strokeLinecap="round" /></svg> },
    { key: "dark", label: t("theme.dark"), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" strokeLinejoin="round" /></svg> },
    { key: "system", label: t("theme.system"), icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" strokeLinecap="round" /></svg> },
  ];
  return (
    <div className="px-3 py-3">
      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[var(--surface-2)]">
        {opts.map((o) => {
          const active = theme === o.key;
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => setTheme(o.key)}
              className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition ${
                active
                  ? "bg-[var(--surface)] text-[var(--brand-primary-strong)] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.12)]"
                  : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {o.icon}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useRequireAuth();
  const { locale, t } = useLocale();
  const [stats, setStats] = useState<Stats>({ orders: 0, unread: 0, favorites: 0 });
  const [toast, setToast] = useState("");
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const showToast = useCallback((m: string) => {
    setToast(m);
    window.setTimeout(() => setToast(""), 2200);
  }, []);

  useEffect(() => {
    if (!user) return;
    let alive = true;
    (async () => {
      try {
        const [reqs, unreadRes, favs] = await Promise.all([
          api("/requests/") as Promise<unknown[]>,
          api("/unread/") as Promise<{ unread: number }>,
          api("/favorites/") as Promise<unknown[]>,
        ]);
        if (!alive) return;
        setStats({
          orders: Array.isArray(reqs) ? reqs.length : 0,
          unread: unreadRes.unread ?? 0,
          favorites: Array.isArray(favs) ? favs.length : 0,
        });
      } catch { /* optional */ }
    })();
    return () => { alive = false; };
  }, [user]);

  if (authLoading || !user) return <LoadingScreen />;

  const u = user as UserSession;
  const isMaker = u.role === "ishlab_chiqaruvchi";
  const roleLabel = isMaker ? t("settings.manufacturer") : t("settings.seller");
  const panelHref = isMaker ? "/firma" : "/seler";
  const localeMeta = LOCALE_META[locale];

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg)]">
      <header className="brand-header px-4 pt-10 pb-8">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/25 flex items-center justify-center text-white text-xl font-extrabold shrink-0">{initials(u.full_name)}</div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-white/75">{t("settings.title")}</p>
            <h1 className="text-white text-lg font-bold truncate">{u.full_name || "Hisob"}</h1>
            <p className="text-white/80 text-xs truncate">{roleLabel} · ID #{u.id}</p>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 -mt-3 space-y-3">
        <SettingGroup title={t("settings.account")}>
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold text-[var(--text-muted)]">{t("settings.email")}</p>
              <p className="font-bold text-sm truncate">{u.email}</p>
            </div>
            <button type="button" onClick={() => navigator.clipboard.writeText(u.email).then(() => showToast(t("settings.emailCopied")))} className="btn btn-secondary btn-sm">{t("settings.copy")}</button>
          </div>
          {u.phone && (
            <div className="px-4 py-3.5 flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-[var(--text-muted)]">{t("settings.phone")}</p>
                <p className="font-bold text-sm">{u.phone}</p>
              </div>
              <a href={`tel:${u.phone}`} className="btn btn-secondary btn-sm">{t("settings.call")}</a>
            </div>
          )}
          <div className="px-4 py-3.5">
            <p className="text-[10px] font-bold text-[var(--text-muted)]">{t("settings.role")}</p>
            <p className="font-bold text-sm">{roleLabel}</p>
          </div>
        </SettingGroup>

        <SettingGroup title={t("settings.app")}>
          <SettingRow href={panelHref} label={isMaker ? t("settings.panelMaker") : t("settings.panelSeller")} sub={t("settings.panelSub")} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 11l9-8 9 8M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" /></svg>} />
          <SettingRow href="/orders" label={t("settings.orders")} sub={t("settings.ordersSub", { n: stats.orders })} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>} />
          <SettingRow href="/chat" label={t("settings.chats")} sub={t("settings.chatsSub")} badge={stats.unread} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7" /></svg>} />
          <SettingRow href="/favorites" label={t("settings.favorites")} sub={t("settings.favoritesSub", { n: stats.favorites })} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" /></svg>} />
          {!isMaker && <SettingRow href="/xaritadan" label={t("settings.mapSettings")} sub={t("settings.mapSub")} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" /></svg>} />}
          <SettingRow
            label={t("settings.language")}
            sub={t("settings.languageSub")}
            onClick={() => setLangOpen(true)}
            trailing={<span className="px-2.5 py-1 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary-hover)] text-xs font-bold">{localeMeta.flag} {localeMeta.native}</span>}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" /></svg>}
          />
        </SettingGroup>

        <SettingGroup title={t("settings.appearance")}>
          <div className="px-4 pt-3.5 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)]"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 3a9 9 0 100 18 4.5 4.5 0 010-9 4.5 4.5 0 000-9z" strokeLinejoin="round" /></svg></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[var(--text-primary)]">{t("settings.theme")}</p>
              <p className="text-xs text-[var(--text-muted)]">{t("settings.themeSub")}</p>
            </div>
          </div>
          <ThemeSegmented />
        </SettingGroup>

        <SettingGroup title={t("settings.security")}>
          <SettingRow label={t("settings.logout")} sub={t("settings.logoutSub")} danger onClick={() => setLogoutOpen(true)} icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>} />
        </SettingGroup>

        <p className="text-center text-[10px] font-bold text-[var(--text-muted)]/60 pb-2">{t("settings.version")}</p>
      </main>

      <LanguagePicker open={langOpen} onClose={() => setLangOpen(false)} onSaved={() => showToast(t("languagePicker.saved"))} />

      {logoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-[var(--text-primary)]/40" onClick={() => setLogoutOpen(false)} />
          <div className="relative bg-[var(--surface)] w-full max-w-sm rounded-[20px] p-5 border border-[var(--border)]">
            <p className="font-bold text-lg text-center">{t("settings.logoutConfirm")}</p>
            <p className="text-sm text-[var(--text-muted)] text-center mt-1">{t("settings.logoutDesc")}</p>
            <div className="flex gap-3 mt-5">
              <button type="button" onClick={() => setLogoutOpen(false)} className="btn btn-secondary flex-1">{t("settings.cancel")}</button>
              <button type="button" onClick={logout} className="btn btn-danger flex-1">{t("settings.logout")}</button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} />
      <BottomNav />
    </div>
  );
}
