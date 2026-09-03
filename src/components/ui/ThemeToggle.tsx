"use client";

import { Moon, SunMedium } from "lucide-react";
import { setTheme, useTheme, type Theme } from "@/lib/use-theme";

/** Deep Cosmos ↔ Solar Observatory. Persists to localStorage. */
export function ThemeToggle({ labeled = false }: { labeled?: boolean }) {
  const theme: Theme = useTheme();
  const next: Theme = theme === "dark" ? "light" : "dark";
  const apply = () => setTheme(next);

  return (
    <button
      onClick={apply}
      aria-label={`Switch to ${next === "dark" ? "Deep Cosmos (dark)" : "Solar Observatory (light)"} mode`}
      className="sb-transition inline-flex min-h-11 items-center gap-2 rounded-full border border-edge bg-content px-4 text-sm font-medium text-muted transition-[background,color,border-color] hover:border-steel/50 hover:text-text"
    >
      {theme === "light" ? (
        <Moon size={17} strokeWidth={1.75} />
      ) : (
        <SunMedium size={17} strokeWidth={1.75} />
      )}
      {labeled && (
        <span className="hidden sm:inline">
          {theme === "light" ? "Deep Cosmos" : "Solar Observatory"}
        </span>
      )}
    </button>
  );
}
