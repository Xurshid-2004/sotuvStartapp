"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, saveAuth } from "../lib/api";
import { loginAsTestRole, type UserRole } from "../lib/session";
import Logo from "../components/Logo";
import LanguagePicker from "../components/LanguagePicker";
import { useLocale } from "../components/LocaleProvider";
import { LOCALE_META } from "../lib/locale";

const Sign_up = () => {
    const router = useRouter();
    const { t, locale } = useLocale();
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState<UserRole | null>(null);
    const [langOpen, setLangOpen] = useState(false);

    const enterAsRole = async (role: UserRole) => {
        setError("");
        setTestLoading(role);
        try {
            await loginAsTestRole(role);
            router.replace(role === "ishlab_chiqaruvchi" ? "/firma" : "/seler");
        } catch (err) {
            setError(err instanceof Error ? err.message : t("auth.testError"));
        } finally {
            setTestLoading(null);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            const data = (await api("/auth/login/", {
                method: "POST",
                auth: false,
                body: { email, phone, password },
            })) as { access: string; refresh: string; role: string; full_name?: string; email?: string; phone?: string; user_id?: number };
            saveAuth(data);
            router.replace(data.role === "ishlab_chiqaruvchi" ? "/firma" : "/seler");
        } catch (err) {
            setError(err instanceof Error ? err.message : t("auth.loginError"));
        } finally {
            setLoading(false);
        }
    };

    const inputCls =
        "w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none transition focus:border-[var(--brand-primary)] focus:ring-4 focus:ring-[var(--brand-primary)]/20";

    const RolePill = ({ role, emoji, label }: { role: UserRole; emoji: string; label: string }) => (
        <button
            type="button"
            disabled={!!testLoading || loading}
            onClick={() => enterAsRole(role)}
            className="w-full max-w-[220px] lg:max-w-[150px] shrink-0 py-4 px-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] font-extrabold text-sm shadow-[var(--shadow-card)] hover:border-[var(--brand-primary)] hover:-translate-y-0.5 active:scale-95 transition flex flex-col items-center gap-2.5 disabled:opacity-60"
        >
            <span className="w-12 h-12 rounded-xl bg-[var(--brand-primary-soft)] flex items-center justify-center text-2xl">{emoji}</span>
            {testLoading === role ? t("auth.loggingIn") : label}
        </button>
    );

    return (
        <div className="min-h-screen flex items-center justify-center relative px-3 py-6 bg-[var(--bg)]">
            {/* Branded gold glow background */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[var(--brand-primary)]/20 blur-3xl" />
                <div className="absolute -bottom-32 -right-16 w-[28rem] h-[28rem] rounded-full bg-[var(--brand-primary-hover)]/15 blur-3xl" />
            </div>

            {/* Language switcher */}
            <button
                type="button"
                onClick={() => setLangOpen(true)}
                className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-sm font-bold shadow-[var(--shadow-card)] active:scale-95 transition"
            >
                <span>{LOCALE_META[locale].flag}</span>
                <span>{LOCALE_META[locale].label}</span>
            </button>

            <div className="relative z-10 w-full max-w-4xl flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-5">
                <div className="hidden lg:block order-1"><RolePill role="sotuvchi" emoji="🛒" label={t("auth.seller")} /></div>

                <div className="order-2 w-full max-w-md p-6 sm:p-7 surface-card fade-up">
                    <div className="text-center mb-5">
                        <div className="flex justify-center mb-3"><Logo size={56} showText={false} className="justify-center" /></div>
                        <h1 className="text-2xl font-black tracking-tight text-[var(--text-primary)]">{t("auth.welcome")}</h1>
                        <p className="text-sm font-medium text-[var(--text-muted)] mt-1">{t("auth.welcomeSub")}</p>
                    </div>

                    {error && (
                        <div className="mb-4 px-4 py-2.5 bg-[var(--danger-soft)] border border-[var(--danger)]/30 rounded-xl text-[var(--danger)] text-sm text-center font-semibold">{error}</div>
                    )}

                    <form className="space-y-3" onSubmit={handleLogin}>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold ml-1 text-[var(--text-secondary)]">{t("auth.email")}</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder={t("auth.emailPlaceholder")} required />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold ml-1 text-[var(--text-secondary)]">{t("auth.phone")}</label>
                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder={t("auth.phonePlaceholder")} />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold ml-1 text-[var(--text-secondary)]">{t("auth.password")}</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder={t("auth.passwordHint")} required />
                        </div>
                        <button type="submit" disabled={loading} className="btn btn-primary w-full !py-3 !text-base mt-1">
                            {loading ? t("auth.loggingIn") : t("auth.login")}
                        </button>
                    </form>

                    <div className="relative my-4 text-center">
                        <span className="relative z-10 px-3 text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] bg-[var(--surface)]">{t("auth.testMode")}</span>
                        <span className="absolute left-0 right-0 top-1/2 h-px bg-[var(--border)]" />
                    </div>
                    <div className="flex lg:hidden gap-3">
                        <RolePill role="sotuvchi" emoji="🛒" label={t("auth.seller")} />
                        <RolePill role="ishlab_chiqaruvchi" emoji="🏭" label={t("auth.maker")} />
                    </div>

                    <p className="mt-5 text-center text-sm font-medium text-[var(--text-muted)]">
                        {t("auth.noAccount")}{" "}
                        <a href="/sign_in" className="font-bold text-[var(--brand-primary-strong)] hover:underline">{t("auth.registerLink")}</a>
                    </p>
                </div>

                <div className="hidden lg:block order-3"><RolePill role="ishlab_chiqaruvchi" emoji="🏭" label={t("auth.maker")} /></div>
            </div>

            <LanguagePicker open={langOpen} onClose={() => setLangOpen(false)} />
        </div>
    );
};

export default Sign_up;
