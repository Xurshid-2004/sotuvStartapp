"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getRole } from "../lib/api";

type Item = {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

function Icon({ path, fill = false }: { path: string; fill?: boolean }) {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill={fill ? "currentColor" : "none"} stroke="currentColor" strokeWidth={fill ? 0 : 2} strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  home: "M3 11l9-8 9 8M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10",
  heart: "M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z",
  plus: "M12 8v8M8 12h8M12 21a9 9 0 100-18 9 9 0 000 18z",
  chat: "M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z",
  user: "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z",
  orders: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRole(getRole());
    let alive = true;
    const poll = async () => {
      try {
        const r = (await api("/unread/")) as { unread: number };
        if (alive) setUnread(r.unread);
      } catch {
        /* ignore */
      }
    };
    poll();
    const t = setInterval(poll, 8000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [pathname]);

  // Asosiy sahifa rolga qarab
  const homeHref = role === "ishlab_chiqaruvchi" ? "/firma" : "/seler";

  const items: Item[] = [
    { key: "home", label: "Asosiy", href: homeHref, icon: <Icon path={ICONS.home} fill={pathname === homeHref} /> },
    { key: "fav", label: "Sevimli", href: "/favorites", icon: <Icon path={ICONS.heart} fill={pathname === "/favorites"} /> },
    {
      key: "create",
      label: role === "ishlab_chiqaruvchi" ? "Qo'shish" : "Buyurtmalar",
      href: role === "ishlab_chiqaruvchi" ? "/firma?tab=add" : "/orders",
      icon: <Icon path={role === "ishlab_chiqaruvchi" ? ICONS.plus : ICONS.orders} fill={pathname === "/orders"} />,
    },
    { key: "chat", label: "Chat", href: "/chat", icon: <Icon path={ICONS.chat} fill={pathname === "/chat"} />, badge: unread },
    { key: "profile", label: "Profil", href: "/profile", icon: <Icon path={ICONS.user} fill={pathname === "/profile"} /> },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-lg px-3 pb-3">
        <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_40px_-8px_rgba(124,58,237,0.35)] border border-violet-100 flex items-center justify-around px-2 py-2">
          {items.map((it) => {
            const active = pathname === it.href || (it.key === "home" && pathname === homeHref);
            return (
              <button
                key={it.key}
                onClick={() => router.push(it.href)}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition active:scale-90"
              >
                <span className={`relative flex items-center justify-center w-11 h-9 rounded-2xl transition ${active ? "bg-violet-100 text-violet-700" : "text-violet-400"}`}>
                  {it.icon}
                  {!!it.badge && it.badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                      {it.badge > 9 ? "9+" : it.badge}
                    </span>
                  )}
                </span>
                <span className={`text-[11px] font-semibold ${active ? "text-violet-700" : "text-violet-400"}`}>{it.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
