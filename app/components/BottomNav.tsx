"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "../lib/api";
import { useSession } from "../lib/session";
import { useLocale } from "./LocaleProvider";
import { useCart } from "./CartProvider";

function Icon({ path, fill = false, size = 20 }: { path: string; fill?: boolean; size?: number }) {
  return (
    <svg className="shrink-0" width={size} height={size} viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={fill ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

function PlusIcon({ size = 24 }: { size?: number }) {
  return (
    <svg className="shrink-0" width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth={2.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

const ICONS = {
  home: "M3 11l9-8 9 8M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10",
  heart: "M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z",
  plus: "M12 8v8M8 12h8",
  chat: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  settings: "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  orders: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
  map: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
  cart: "M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4H6zM3 6h18M16 10a4 4 0 01-8 0",
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSession();
  const { t } = useLocale();
  const { count: cartCount } = useCart();
  const [unread, setUnread] = useState(0);
  const role = user?.role ?? null;
  const isMaker = role === "ishlab_chiqaruvchi";
  const homeHref = isMaker ? "/firma" : "/seler";

  useEffect(() => {
    if (!user) return;
    let alive = true;
    const poll = async () => {
      try {
        const r = (await api("/unread/")) as { unread: number };
        if (alive) setUnread(r.unread);
      } catch { /* ignore */ }
    };
    poll();
    const timer = setInterval(poll, 8000);
    return () => { alive = false; clearInterval(timer); };
  }, [pathname, user]);

  const items = isMaker
    ? [
        { key: "home", label: t("nav.home"), href: homeHref, icon: ICONS.home },
        { key: "fav", label: t("nav.favorites"), href: "/favorites", icon: ICONS.heart },
        { key: "create", label: t("nav.add"), href: "/firma?tab=add", icon: ICONS.plus, isCreate: true },
        { key: "chat", label: t("nav.chat"), href: "/chat", icon: ICONS.chat, badge: unread },
        { key: "settings", label: t("nav.settings"), href: "/profile", icon: ICONS.settings },
      ]
    : [
        { key: "home", label: t("nav.home"), href: homeHref, icon: ICONS.home },
        { key: "fav", label: t("nav.favorites"), href: "/favorites", icon: ICONS.heart },
        { key: "cart", label: t("nav.cart"), href: "/cart", icon: ICONS.cart, isCreate: true, badge: cartCount },
        { key: "orders", label: t("nav.order"), href: "/orders", icon: ICONS.orders },
        { key: "chat", label: t("nav.chat"), href: "/chat", icon: ICONS.chat, badge: unread },
        { key: "settings", label: t("nav.settings"), href: "/profile", icon: ICONS.settings },
      ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)] pointer-events-none">
      <div className="mx-auto max-w-lg px-3 pb-1.5 pointer-events-auto">
        <div className="bottom-nav-shell rounded-2xl overflow-hidden">
          <div className="h-0.5 bg-gradient-to-r from-[var(--nav-accent)] to-[var(--nav-accent-hover)]" aria-hidden />
          <div className="flex items-stretch justify-around px-0.5 py-0.5">
          {items.map((it) => {
            const active = pathname === it.href || (it.key === "home" && pathname === homeHref);
            const filled = active && !it.isCreate;
            return (
              <button
                key={it.key}
                type="button"
                onClick={() => router.push(it.href)}
                className={`relative flex flex-col items-center justify-center gap-0 px-0.5 py-1 rounded-xl transition active:scale-95 min-w-0 flex-1 ${it.isCreate ? "-mt-2" : ""}`}
              >
                <span
                  className={`relative flex items-center justify-center transition-all ${
                    it.isCreate
                      ? "w-10 h-10 rounded-xl bottom-nav-create"
                      : `w-7 h-7 rounded-lg ${active ? "bottom-nav-active" : "text-[var(--text-muted)]"}`
                  }`}
                >
                  {it.isCreate ? (
                    it.key === "cart" ? (
                      <Icon path={it.icon} size={22} />
                    ) : (
                      <PlusIcon size={24} />
                    )
                  ) : (
                    <Icon path={it.icon} fill={filled} size={17} />
                  )}
                  {!!it.badge && it.badge > 0 && (
                    <span className="absolute -top-0.5 -right-1 min-w-[14px] h-[14px] px-0.5 rounded-full bg-rose-500 text-white text-[8px] font-extrabold flex items-center justify-center ring-1 ring-white">
                      {it.badge > 9 ? "9+" : it.badge}
                    </span>
                  )}
                </span>
                <span
                  className={`text-[9px] font-semibold truncate w-full text-center leading-tight mt-0.5 ${
                    active ? "text-[var(--nav-accent-strong)]" : "text-[var(--text-muted)]"
                  }`}
                >
                  {it.label}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </nav>
  );
}
