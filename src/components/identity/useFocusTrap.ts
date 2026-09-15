"use client";

import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

interface Options {
  /** Receives focus on activation (falls back to the container). */
  initial?: RefObject<HTMLElement | null>;
  onEscape: () => void;
  /** Focus returns here on deactivation when still connected. */
  returnTo: HTMLElement | null;
}

/**
 * Modal focus discipline for the identity gate: initial focus, Tab / Shift+Tab
 * wrap, Escape owned in the CAPTURE phase (stopImmediatePropagation, so the
 * Cosmos Escape ladder never sees it), and focus return on close.
 * `inert` on the Cosmos wrapper is the primary barrier; this is the belt.
 */
export function useFocusTrap(
  active: boolean,
  container: RefObject<HTMLElement | null>,
  options: Options,
) {
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  useEffect(() => {
    if (!active) return;
    const el = container.current;
    if (!el) return;
    const returnTo = optionsRef.current.returnTo;

    const frame = requestAnimationFrame(() => {
      (optionsRef.current.initial?.current ?? el).focus({ preventScroll: true });
    });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        optionsRef.current.onEscape();
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = [...el.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (n) => n.getClientRects().length > 0,
      );
      if (nodes.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const inside = !!current && el.contains(current);
      if (e.shiftKey) {
        if (!inside || current === first || current === el) {
          e.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey, { capture: true });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey, { capture: true });
      const target =
        returnTo && returnTo.isConnected
          ? returnTo
          : document.querySelector<HTMLElement>("[data-sb-gate-opener]");
      target?.focus({ preventScroll: true });
    };
  }, [active, container]);
}
