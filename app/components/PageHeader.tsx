"use client";

import type { ReactNode } from "react";

export default function PageHeader({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 brand-header shadow-[var(--shadow-brand)]">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="w-10 h-10 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0">{icon}</span>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="text-white text-xl font-bold truncate">{title}</h1>
            {subtitle && <p className="text-white/80 text-sm truncate mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </header>
  );
}
