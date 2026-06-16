"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveAuth, getRole } from "../lib/api";
import Logo from "../components/Logo";

const Sign_in = () => {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            // 1) ro'yxatdan o'tkazish
            await api("/auth/register/", {
                method: "POST",
                auth: false,
                body: { full_name: fullName, email, phone, password, role },
            });
            // 2) avtomatik login
            const data = (await api("/auth/login/", {
                method: "POST",
                auth: false,
                body: { email, password },
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
            const r = getRole();
            router.push(r === "ishlab_chiqaruvchi" ? "/firma" : "/seler");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Ro'yxatdan o'tishda xatolik");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen overflow-hidden flex items-center justify-center animated-bg relative px-2 py-2">
            <div className="relative z-10 w-full max-w-[420px] px-3 sm:px-4 py-2.5 bg-black/95 border border-yellow-500/30 rounded-[1.25rem] shadow-[0_0_40px_rgba(234,179,8,0.12)]">
                <div className="text-center mb-1.5">
                    <div className="flex justify-center mb-3">
                        <Logo size={48} showText={false} className="justify-center" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-extrabold mb-0.5 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                        Yangi hisob yaratish
                    </h2>
                    <p className="text-[10px] sm:text-[11px] font-medium text-yellow-500/80">Tez ro&apos;yxatdan o&apos;ting</p>
                </div>

                {error && (
                    <div className="mb-3 px-4 py-2 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-1.5" onSubmit={handleRegister}>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold ml-1 text-yellow-400">Ismingiz</label>
                        <input
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-yellow-500/60 rounded-lg text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40 text-sm"
                            placeholder="Ism va familiya"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold ml-1 text-yellow-400">Email manzilingiz</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-yellow-500/60 rounded-lg text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40 text-sm"
                            placeholder="ism@misol.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold ml-1 text-yellow-400">Telefon raqamingiz</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-yellow-500/60 rounded-lg text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40 text-sm"
                            placeholder="+998901234567"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold ml-1 text-yellow-400">Parol</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-yellow-500/60 rounded-lg text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40 text-sm"
                            placeholder="Kamida 8 ta belgi"
                            minLength={8}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold ml-1 text-yellow-400">Ro&apos;lni tanlang</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-900 border border-yellow-500/60 rounded-lg text-yellow-100 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40 appearance-none cursor-pointer text-sm"
                            required
                        >
                            <option value="" disabled className="text-yellow-600/60 bg-zinc-900">Tanlang...</option>
                            <option value="sotuvchi" className="bg-zinc-900 text-yellow-100">Sotuvchi</option>
                            <option value="ishlab_chiqaruvchi" className="bg-zinc-900 text-yellow-100">Ishlab chiqaruvchi</option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2 mt-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-extrabold text-sm rounded-lg shadow-[0_4px_20px_rgba(234,179,8,0.3)] transition-all duration-300 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Yuborilmoqda..." : "Ro'yxatdan o'tish"}
                    </button>
                </form>

                <div className="mt-1 text-center">
                    <p className="text-[11px] sm:text-xs font-medium text-green-400">
                        Allaqachon hisobingiz bormi?{" "}
                        <a href="/sign_up" className="font-bold text-blue-400 hover:text-blue-300 transition-colors duration-300">
                            Tizimga kiring
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Sign_in;
