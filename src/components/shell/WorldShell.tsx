"use client";

/**
 * THE APPLICATION FRAME — the page frame a non-immersive destination wears.
 *
 * It owns global concerns only: the SYSTEMBOOM brand (top left — the mark goes
 * Home, one quiet word says where you are), the theme. No feed, no ring, no
 * renderer: those mount as destination content and unmount with the route.
 */

import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Brand } from "./Brand";

export function WorldShell({ current, context, children }: { current: string; context?: ReactNode; children: ReactNode }) {
  return (
    <div className="sb-surface min-h-dvh text-text" data-sb-shell={current}>
      <header className="sticky top-0 z-30 border-b border-[var(--hair)] backdrop-blur-sm" style={{ background: "var(--bar)" }} data-sb-shell-bar>
        <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
          <Brand current={current} />
          {context && <span className="min-w-0 truncate text-[12px] text-muted">{context}</span>}
          <span className="ml-auto flex items-center gap-1">
            <span className="[&>button]:h-10 [&>button]:min-h-0 [&>button]:w-10 [&>button]:border-0 [&>button]:bg-transparent [&>button]:px-0">
              <ThemeToggle />
            </span>
          </span>
        </div>
      </header>
      {children}
    </div>
  );
}
