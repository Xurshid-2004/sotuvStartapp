type Icon = "inbox" | "search" | "box" | "heart" | "orders";

function IconSvg({ type }: { type: Icon }) {
  const cls = "w-10 h-10";
  if (type === "heart") {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "orders") {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "search") {
    return (
      <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
      <path d="M22 12h-6l-2 3H10l-2-3H2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function EmptyState({
  title,
  subtitle,
  actionLabel,
  onAction,
  icon = "inbox",
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: Icon;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-[20px] bg-[var(--surface)] border border-[var(--soft-border)] shadow-[var(--shadow-card)]">
      <div className="w-16 h-16 rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary-hover)] flex items-center justify-center mb-4">
        <IconSvg type={icon} />
      </div>
      <h3 className="text-[var(--text-primary)] text-base font-bold">{title}</h3>
      {subtitle && <p className="text-[var(--text-muted)] text-sm mt-2 max-w-[280px]">{subtitle}</p>}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="btn btn-primary mt-5">{actionLabel}</button>
      )}
    </div>
  );
}
