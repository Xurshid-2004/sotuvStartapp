"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveAuth, getRole } from "../lib/api";

const Sign_up = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
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
                body: { email, password },
            })) as {
                access: string;
                refresh: string;
                role: string;
                full_name?: string;
                email?: string;
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
        <div className="h-screen overflow-hidden flex items-center justify-center animated-bg relative">
            <div className="relative z-10 w-full max-w-md p-6 bg-black border border-yellow-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(234,179,8,0.15)] transition-all duration-500 hover:shadow-[0_0_60px_rgba(234,179,8,0.25)]">
                <div className="text-center mb-4">
                    <h2 className="text-3xl font-extrabold mb-2 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-600">
                        Xush kelibsiz!
                    </h2>
                    <p className="text-sm font-medium text-yellow-500/80">O&apos;z hisobingizga kiring va davom eting</p>
                </div>

                {error && (
                    <div className="mb-3 px-4 py-2 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-sm text-center">
                        {error}
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleLogin}>
                    <div className="space-y-1">
                        <label className="text-sm font-semibold ml-1 text-yellow-400">Email manzilingiz</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-2.5 bg-zinc-900 border border-yellow-500/60 rounded-2xl text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="ism@misol.com"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-sm font-semibold text-yellow-400">Parol</label>
                        </div>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-2.5 bg-zinc-900 border border-yellow-500/60 rounded-2xl text-yellow-100 placeholder-yellow-600/60 outline-none transition-all duration-300 focus:border-yellow-400 focus:ring-2 focus:ring-yellow-500/40"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-2.5 mt-2 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 text-black font-extrabold text-lg rounded-2xl shadow-[0_4px_20px_rgba(234,179,8,0.3)] transform transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_6px_25px_rgba(234,179,8,0.5)] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {loading ? "Kirilmoqda..." : "Kirish"}
                    </button>
                </form>

                <div className="mt-5 text-center">
                    <p className="text-sm font-medium text-red-500">
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
