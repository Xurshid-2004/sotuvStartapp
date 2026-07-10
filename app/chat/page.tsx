"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "../lib/api";
import { useRequireAuth } from "../lib/session";
import BottomNav from "../components/BottomNav";
import PageHeader from "../components/PageHeader";
import EmptyState from "../components/ui/EmptyState";
import { useLocale } from "../components/LocaleProvider";

type OtherUser = { id: number; full_name: string; email: string; role: string };
type Conversation = {
  id: number;
  other_user: OtherUser;
  last_message: { text: string; created_at: string; sender_id: number } | null;
  unread_count: number;
  product_name: string | null;
  updated_at: string;
};
type Message = {
  id: number;
  text: string;
  is_mine: boolean;
  sender_name: string;
  created_at: string;
};

function initials(name: string) {
  const parts = (name || "?").trim().split(" ");
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}
function timeShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

function ChatInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { user, loading: authLoading } = useRequireAuth();
  const { t } = useLocale();
  const [convs, setConvs] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loadingList, setLoadingList] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    try {
      const r = (await api("/conversations/")) as Conversation[];
      setConvs(r);
    } catch {
      /* ignore */
    } finally {
      setLoadingList(false);
    }
  }, []);

  const loadMessages = useCallback(async (id: number) => {
    try {
      const r = (await api(`/conversations/${id}/messages/`)) as Message[];
      setMessages(r);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConvs();
    const c = params.get("c");
    if (c) setActiveId(Number(c));
  }, [authLoading, user, loadConvs, params]);

  // active suhbat xabarlarini polling
  useEffect(() => {
    if (activeId == null) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeId), 4000);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || activeId == null) return;
    setSending(true);
    setDraft("");
    // optimistik
    setMessages((m) => [
      ...m,
      { id: Date.now(), text, is_mine: true, sender_name: "", created_at: new Date().toISOString() },
    ]);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 30);
    try {
      await api(`/conversations/${activeId}/send/`, { method: "POST", body: { text } });
      loadMessages(activeId);
      loadConvs();
    } catch {
      /* ignore */
    } finally {
      setSending(false);
    }
  };

  const active = convs.find((c) => c.id === activeId);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-10 h-10 border-4 border-[var(--brand-primary-soft)] border-t-[var(--brand-primary)] rounded-full animate-spin" />
      </div>
    );
  }

  // ===== Suhbat ko'rinishi (thread) =====
  if (activeId != null) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
        <header className="sticky top-0 z-20 brand-header px-4 py-3 flex items-center gap-3 shadow-lg">
          <button onClick={() => { setActiveId(null); router.push("/chat"); }} className="text-white p-1 active:scale-90 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.4} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-black text-sm shrink-0">
            {initials(active?.other_user.full_name || "")}
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold leading-tight truncate">{active?.other_user.full_name || "Suhbat"}</p>
            <p className="text-white/80 text-xs truncate">
              {active?.other_user.role === "ishlab_chiqaruvchi" ? "Ishlab chiqaruvchi" : "Sotuvchi"}
              {active?.product_name ? ` · ${active.product_name}` : ""}
            </p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
          {messages.length === 0 && (
            <div className="text-center text-[var(--text-muted)] text-sm mt-10">Hali xabar yo&apos;q. Birinchi bo&apos;lib yozing 👋</div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-snug fade-up ${
                m.is_mine
                  ? "bg-[var(--brand-primary-hover)] text-white rounded-br-md"
                  : "bg-[var(--surface-2)] text-[var(--text-primary)] rounded-bl-md shadow-sm"
              }`}>
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`text-[10px] mt-1 ${m.is_mine ? "text-white/70" : "text-[var(--text-muted)]"}`}>{timeShort(m.created_at)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </main>

        <div className="sticky bottom-0 bg-[var(--surface)] border-t border-[var(--border)] px-3 py-2.5 flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            rows={1}
            placeholder="Xabar yozing..."
            className="flex-1 resize-none px-4 py-2.5 rounded-2xl bg-[var(--surface-2)] outline-none focus:ring-2 focus:ring-[var(--brand-primary-muted)] text-sm max-h-32"
            style={{ color: "var(--ink)" }}
          />
          <button
            onClick={send}
            disabled={sending || !draft.trim()}
            className="w-11 h-11 rounded-full bg-[var(--brand-primary-hover)] text-white flex items-center justify-center active:scale-90 transition disabled:opacity-40 shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </div>
    );
  }

  // ===== Suhbatlar ro'yxati =====
  return (
    <div className="min-h-screen pb-24 bg-[var(--bg)]">
      <PageHeader title={t("pages.chat")} />

      <main className="max-w-lg mx-auto px-4 py-4">
        {loadingList ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 bg-[var(--surface)] rounded-[20px] border border-[var(--soft-border)] p-3">
                <div className="skeleton w-12 h-12 rounded-full" />
                <div className="flex-1"><div className="skeleton h-4 w-1/2 rounded mb-2" /><div className="skeleton h-3 w-3/4 rounded" /></div>
              </div>
            ))}
          </div>
        ) : convs.length === 0 ? (
          <EmptyState title={t("chat.empty")} subtitle={t("chat.emptySub")} icon="inbox" />
        ) : (
          <div className="space-y-2">
            {convs.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className="w-full flex items-center gap-3 bg-[var(--surface)] rounded-2xl p-3 text-left card-hover"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-primary-hover)] flex items-center justify-center text-white font-black shrink-0">
                  {initials(c.other_user.full_name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-bold truncate text-[var(--text-primary)]">{c.other_user.full_name || c.other_user.email}</p>
                    {c.last_message && <span className="text-[11px] text-[var(--text-muted)] shrink-0">{timeShort(c.last_message.created_at)}</span>}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[var(--text-muted)] truncate">{c.last_message?.text || "Suhbatni boshlang"}</p>
                    {c.unread_count > 0 && (
                      <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[var(--brand-primary-hover)] text-white text-[11px] font-black flex items-center justify-center shrink-0">{c.unread_count}</span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: "var(--bg)" }} />}>
      <ChatInner />
    </Suspense>
  );
}
