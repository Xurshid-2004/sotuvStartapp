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
  phone?: string;
  user_id?: number;
}) {
  if (typeof window === "undefined") return;
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  localStorage.setItem("role", data.role);
  localStorage.setItem("full_name", data.full_name || "");
  localStorage.setItem("email", data.email || "");
  localStorage.setItem("phone", data.phone || "");
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

function parseApiError(data: unknown, status: number): string {
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    if (typeof obj.detail === "string") return obj.detail;
    const parts: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      const msg = Array.isArray(val) ? val.join(", ") : String(val);
      parts.push(`${key}: ${msg}`);
    }
    if (parts.length) return parts.join("; ");
  }
  return `Xatolik: ${status}`;
}

async function parseResponse(res: Response) {
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
    throw new Error(parseApiError(data, res.status));
  }
  return data;
}

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

  return parseResponse(res);
}

/** Galereyadan rasm yuklash (multipart/form-data) */
export async function apiForm(
  path: string,
  opts: { method?: string; body: FormData; auth?: boolean } = { body: new FormData() }
) {
  const { method = "POST", body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body,
  });

  return parseResponse(res);
}
