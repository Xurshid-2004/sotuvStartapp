type Props = {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: "inbox" | "search" | "box";
};

function EmptyIcon({ type }: { type: Props["icon"] }) {
  if (type === "search") {
    return (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "box") {
    return (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" strokeLinejoin="round" />
        <path d="M3.3 7.3L12 12l8.7-4.7M12 22V12" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" strokeLinejoin="round" />
    </svg>
  );
}

export default function EmptyState({ title, subtitle, actionLabel, onAction, icon = "inbox" }: Props) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-5 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-sm">
      <div className="w-12 h-12 rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-strong)] flex items-center justify-center mb-3">
        <EmptyIcon type={icon} />
      </div>
      <h3 className="text-[var(--text-primary)] text-base font-bold">{title}</h3>
      {subtitle && (
        <p className="text-[var(--text-muted)] text-sm font-medium mt-2 max-w-[280px] leading-relaxed">{subtitle}</p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 btn btn-primary"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
