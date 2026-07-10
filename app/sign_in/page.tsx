"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveAuth } from "../lib/api";
import Logo from "../components/Logo";
import LanguagePicker from "../components/LanguagePicker";
import { useLocale } from "../components/LocaleProvider";
import { LOCALE_META } from "../lib/locale";

const Sign_in = () => {
    const router = useRouter();
    const { t, locale } = useLocale();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [langOpen, setLangOpen] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await api("/auth/register/", {
                method: "POST",
                auth: false,
                body: { full_name: fullName, email, phone, password, role },
            });
            const data = (await api("/auth/login/", {
                method: "POST",
                auth: false,
                body: { email, password },
            })) as { access: string; refresh: string; role: string; full_name?: string; email?: string; phone?: string; user_id?: number };
            saveAuth(data);
            router.push(data.role === "ishlab_chiqaruvchi" ? "/firma" : "/seler");
        } catch (err) {
            setError(err instanceof Error ? err.message : t("auth.registerError"));
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        "w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/20";

    return (
        <div className="min-h-screen flex items-center justify-center relative px-3 py-6 bg-[var(--bg)]">
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
                <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-[var(--brand-primary-hover)]/15 blur-3xl" />
            </div>

            <button
                type="button"
                onClick={() => setLangOpen(true)}
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-bold shadow-[var(--shadow-card)] active:scale-95 transition"
            >
                <span>{LOCALE_META[locale].flag}</span>
                <span>{LOCALE_META[locale].label}</span>
            </button>

            <div className="relative z-10 w-full max-w-md p-6 sm:p-7 surface-card fade-up">
                <div className="text-center mb-5">
                    <div className="flex justify-center mb-3"><Logo size={52} showText={false} className="justify-center" /></div>
                    <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t("auth.registerTitle")}</h1>
                    <p className="text-sm font-medium text-[var(--text-muted)] mt-1">{t("auth.registerSub")}</p>
                </div>

                {error && (
                    <div className="mb-4 px-4 py-2.5 bg-[var(--danger-soft)] border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-sm text-center font-semibold">{error}</div>
                )}

                <form className="space-y-3" onSubmit={handleRegister}>
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold ml-1 text-[var(--text-secondary)]">{t("auth.name")}</label>
                        <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder={t("auth.namePlaceholder")} required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold ml-1 text-[var(--text-secondary)]">{t("auth.email")}</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder={t("auth.emailPlaceholder")} required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold ml-1 text-[var(--text-secondary)]">{t("auth.phone")}</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder={t("auth.phonePlaceholder")} required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold ml-1 text-[var(--text-secondary)]">{t("auth.password")}</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder={t("auth.passwordPlaceholder")} minLength={8} required />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-bold ml-1 text-[var(--text-secondary)]">{t("auth.selectRole")}</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputCls} appearance-none cursor-pointer`} required>
                            <option value="" disabled>{t("auth.choose")}</option>
                            <option value="sotuvchi">{t("auth.seller")}</option>
                            <option value="ishlab_chiqaruvchi">{t("auth.maker")}</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full !py-3 !text-base mt-1">
                        {loading ? t("auth.registering") : t("auth.register")}
                    </button>
                </form>

                <p className="mt-5 text-center text-sm font-medium text-[var(--text-muted)]">
                    {t("auth.hasAccount")}{" "}
                    <a href="/sign_up" className="font-bold text-[var(--brand-primary-strong)] hover:underline">{t("auth.loginLink")}</a>
                </p>
            </div>

            <LanguagePicker open={langOpen} onClose={() => setLangOpen(false)} />
        </div>
    );
};

export default Sign_in;
