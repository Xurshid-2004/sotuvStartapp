"use client";

// Django backend manzili. Ishlab chiqarishda .env.local ga qo'ying:
// NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

// ---- Token saqlash (localStorage) ----
export function saveAuth(data: {
  access: string;
  refresh: string;
  role: string;
  full_name?: string;
  email?: string;
  user_id?: number;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("role", data.role);
  localStorage.setItem("full_name", data.full_name || "");
  localStorage.setItem("email", data.email || "");
  if (data.user_id != null) localStorage.setItem("user_id", String(data.user_id));
}

export function getUserId(): number | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("user_id");
  return v ? Number(v) : null;
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access");
}

export function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function getFullName() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("full_name") || "";
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.clear();
  window.location.href = "/sign_up";
}

// ---- Asosiy fetch wrapper ----
type ApiOptions = {
  method?: string;
  body?: unknown;
  auth?: boolean;
};

export async function api(path: string, opts: ApiOptions = {}) {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data &&
        typeof data === "object" &&
        ((data as Record<string, unknown>).detail as string)) ||
      `Xatolik: ${res.status}`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(data));
  }
  return data;
}
