"use client";

import { Sparkles } from "lucide-react";

/** Pill / ContextChip — time-place context, filters, Life links. */
export function Pill({
  active = false,
  boom = false,
  onClick,
  children,
}: {
  active?: boolean;
  /** Boom pills mark NOW / current Circle position only. */
  boom?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const Tag = onClick ? "button" : "span";
  return (
    <Tag
      onClick={onClick}
      aria-pressed={onClick ? active : undefined}
      className={`sb-transition inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-medium transition-[background,color,border-color] ${
        boom
          ? "bg-boom text-white"
          : active
            ? "border border-steel/50 bg-content-raised text-text"
            : "border border-edge bg-content text-muted"
      } ${onClick ? "cursor-pointer hover:text-text" : ""}`}
    >
      {children}
    </Tag>
  );
}

/** Badge — unread / priority. Red means "this needs you". */
export function Badge({ count, label }: { count: number; label: string }) {
  if (count <= 0) return null;
  return (
    <span
      aria-label={label}
      className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-boom px-1.5 text-[11px] leading-none font-bold text-white"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

/** Skeleton — loading shimmer (freezes under reduced motion). */
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`sb-skeleton rounded-xl ${className}`} />
  );
}

/** EmptyState — a quiet invitation, never a dead end. */
export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-edge px-8 py-12 text-center">
      <span className="text-steel">{icon ?? <Sparkles size={28} strokeWidth={1.5} />}</span>
      <p className="font-semibold text-text">{title}</p>
      <p className="type-meta max-w-xs">{hint}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
