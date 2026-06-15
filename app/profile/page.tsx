"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRole, getFullName, logout } from "../lib/api";
import BottomNav from "../components/BottomNav";

function initials(name: string) {
  const parts = (name || "?").trim().split(" ");
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function ProfilePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const r = getRole();
    if (!r) {
      router.push("/sign_up");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRole(r);
    setName(getFullName());
    setEmail(typeof window !== "undefined" ? localStorage.getItem("email") || "" : "");
  }, [router]);

  const roleLabel = role === "ishlab_chiqaruvchi" ? "Ishlab chiqaruvchi" : "Sotuvchi";

  return (
    <div className="min-h-screen pb-28" style={{ background: "var(--bg)" }}>
      <header className="bg-gradient-to-br from-violet-700 to-violet-600 px-4 pt-10 pb-16 rounded-b-[2.5rem]">
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur border-4 border-white/30 flex items-center justify-center text-white text-3xl font-black">
            {initials(name)}
          </div>
          <h1 className="text-white text-2xl font-black mt-3">{name || "Foydalanuvchi"}</h1>
          <span className="mt-1 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold">{roleLabel}</span>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M4 4h16v16H4zM4 8l8 5 8-5" strokeLinejoin="round" /></svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-violet-400">Email</p>
              <p className="font-semibold truncate" style={{ color: "var(--ink)" }}>{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 border-t border-violet-50 pt-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinejoin="round" /></svg>
            </div>
            <div>
              <p className="text-xs text-violet-400">Rol</p>
              <p className="font-semibold" style={{ color: "var(--ink)" }}>{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl mt-3 overflow-hidden">
          <button onClick={() => router.push("/chat")} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-violet-50 transition text-left">
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" strokeLinejoin="round" /></svg>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>Suhbatlar</span>
            <svg className="w-5 h-5 text-violet-300 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
          </button>
          <button onClick={() => router.push("/favorites")} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-violet-50 transition text-left border-t border-violet-50">
            <svg className="w-5 h-5 text-violet-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" strokeLinejoin="round" /></svg>
            <span className="font-semibold" style={{ color: "var(--ink)" }}>Sevimlilar</span>
            <svg className="w-5 h-5 text-violet-300 ml-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" strokeLinecap="round" /></svg>
          </button>
        </div>

        <button onClick={logout} className="w-full mt-3 py-3.5 rounded-2xl bg-rose-50 text-rose-600 font-bold active:scale-[0.98] transition">
          Chiqish
        </button>
      </main>
      <BottomNav />
    </div>
  );
}
