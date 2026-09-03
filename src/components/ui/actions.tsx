"use client";

import { forwardRef } from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * PrimaryAction — Boom energy. Reserved for meaningful commitment:
 * publish, create, enter, confirm. Never decorative.
 */
export const PrimaryAction = forwardRef<HTMLButtonElement, ButtonProps>(
  function PrimaryAction({ className = "", children, ...props }, ref) {
    return (
      <button
        ref={ref}
        {...props}
        className={`sb-transition inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-boom px-6 font-semibold text-white transition-[background,transform,box-shadow] hover:bg-boom-strong active:scale-[0.98] disabled:opacity-50 ${className}`}
      >
        {children}
      </button>
    );
  },
);

/** SecondaryAction — steel/ice structure. The everyday control. */
export const SecondaryAction = forwardRef<HTMLButtonElement, ButtonProps>(
  function SecondaryAction({ className = "", children, ...props }, ref) {
    return (
      <button
        ref={ref}
        {...props}
        className={`sb-transition inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-edge bg-content px-6 font-medium text-text transition-[background,transform,border-color] hover:border-steel/50 hover:bg-content-raised active:scale-[0.98] disabled:opacity-50 ${className}`}
      >
        {children}
      </button>
    );
  },
);

/** IconButton — 44px minimum hit area, quiet until needed. */
export const IconButton = forwardRef<
  HTMLButtonElement,
  ButtonProps & { label: string; active?: boolean }
>(function IconButton({ label, active = false, className = "", children, ...props }, ref) {
  return (
    <button
      ref={ref}
      aria-label={label}
      title={label}
      aria-pressed={active || undefined}
      {...props}
      className={`sb-transition inline-flex h-11 w-11 items-center justify-center rounded-full transition-[background,color,transform] active:scale-95 ${
        active
          ? "bg-boom/15 text-boom-strong"
          : "text-muted hover:bg-steel/15 hover:text-text"
      } ${className}`}
    >
      {children}
    </button>
  );
});
