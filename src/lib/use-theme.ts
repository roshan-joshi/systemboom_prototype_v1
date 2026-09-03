"use client";

import { useSyncExternalStore } from "react";

export type Theme = "dark" | "light";

/** The theme lives on <html data-theme> — the DOM is the store. */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function read(): Theme {
  return (document.documentElement.dataset.theme as Theme) ?? "dark";
}

/** Current theme; "dark" during SSR. Re-renders on toggle. */
export function useTheme(): Theme {
  return useSyncExternalStore<Theme>(subscribe, read, () => "dark");
}

export function setTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  try {
    localStorage.setItem("sb-theme", theme);
  } catch {
    /* private mode — theme just won't persist */
  }
}
