"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveAuth, getToken, logout } from "./api";

export type UserRole = "sotuvchi" | "ishlab_chiqaruvchi";

export type AuthPayload = {
  access: string;
  refresh: string;
  role: string;
  full_name?: string;
  email?: string;
  phone?: string;
  user_id?: number;
};

export type UserSession = {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  role: UserRole;
};

/** DEBUG backendda demo hisob bilan tezkor kirish (test rejim). */
export async function loginAsTestRole(role: UserRole): Promise<AuthPayload> {
  const data = (await api("/auth/test-login/", {
    method: "POST",
    auth: false,
    body: { role },
  })) as AuthPayload;
  saveAuth(data);
  return data;
}

export function syncSessionToStorage(user: UserSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem("role", user.role);
  localStorage.setItem("full_name", user.full_name || "");
  localStorage.setItem("email", user.email || "");
  localStorage.setItem("phone", user.phone || "");
  localStorage.setItem("user_id", String(user.id));
}

export async function fetchSession(): Promise<UserSession> {
  const me = (await api("/auth/me/")) as UserSession;
  syncSessionToStorage(me);
  return me;
}

/** Backenddan tasdiqlangan sessiya — redirect qilmaydi */
export function useSession() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getToken()) {
        if (alive) {
          setUser(null);
          setLoading(false);
        }
        return;
      }
      try {
        const me = await fetchSession();
        if (alive) setUser(me);
      } catch {
        if (alive) setUser(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return { user, loading };
}

/** Himoyalangan sahifa: /auth/me orqali sessiyani tekshiradi */
export function useRequireAuth(requiredRole?: UserRole) {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!getToken()) {
        router.replace("/sign_up");
        return;
      }
      try {
        const me = await fetchSession();
        if (!alive) return;
        if (requiredRole && me.role !== requiredRole) {
          router.replace(me.role === "ishlab_chiqaruvchi" ? "/firma" : "/seler");
          return;
        }
        setUser(me);
        setLoading(false);
      } catch {
        if (!alive) return;
        logout();
      }
    })();
    return () => {
      alive = false;
    };
  }, [router, requiredRole]);

  return { user, loading };
}
