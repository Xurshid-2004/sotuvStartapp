"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveAuth, getRole } from "../lib/api";
import Logo from "../components/Logo";

const Sign_up = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = (await api("/auth/login/", {
                method: "POST",
                auth: false,
                body: { email, phone, password },
            })) as {
                access: string;
                refresh: string;
                role: string;
                full_name?: string;
                email?: string;
                phone?: string;
                user_id?: number;
            };
            saveAuth(data);
            const role = getRole();
            router.push(role === "ishlab_chiqaruvchi" ? "/firma" : "/seler");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Kirishda xatolik");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden flex items-center justify-center animated-bg relative px-3 py-4">
            <div className="relative z-10 w-full max-w-md p-4 sm:p-5 bg-slate-950/95 border border-emerald-400/25 rounded-[1.5rem] shadow-[0_0_50px_rgba(16,185,129,0.18)]">
                <div className="text-center mb-3">
                    <div className="flex justify-center mb-3">
                        <Logo size={60} showText={false} className="justify-center" />
                    </div>
                    <h2 className="text-2xl font-extrabold mb-1 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-teal-300 to-cyan-400">
                        Xush kelibsiz!
                    </h2>
                    <p className="text-xs font-medium text-emerald-300/80">Hisobingizga tez kiring va davom eting</p>
                </div>

                {error && (
                    <div className="mb-3 px-4 py-2 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-2.5" onSubmit={handleLogin}>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold ml-1 text-emerald-300">Email manzilingiz</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-emerald-400/45 rounded-xl text-emerald-50 placeholder-emerald-300/40 outline-none transition-all duration-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/35"
                            placeholder="ism@misol.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm font-semibold ml-1 text-emerald-300">Telefon raqamingiz</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-emerald-400/45 rounded-xl text-emerald-50 placeholder-emerald-300/40 outline-none transition-all duration-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/35"
                            placeholder="+998901234567"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-semibold text-emerald-300">Parol</label>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2.5 bg-slate-900 border border-emerald-400/45 rounded-xl text-emerald-50 placeholder-emerald-300/40 outline-none transition-all duration-300 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-400/35"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 mt-1 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-base rounded-xl shadow-[0_4px_20px_rgba(16,185,129,0.35)] transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Kirilmoqda..." : "Kirish"}
                    </button>
                </form>

                <div className="mt-3 text-center">
                    <p className="text-xs sm:text-sm font-medium text-red-500">
                        Hali ro&apos;yxatdan o&apos;tmaganmisiz?{" "}
                        <a href="/sign_in" className="font-bold text-blue-400 hover:text-blue-300 transition-colors duration-300">
                            Bu yerdan ro&apos;yxatdan o&apos;ting
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sign_up;
