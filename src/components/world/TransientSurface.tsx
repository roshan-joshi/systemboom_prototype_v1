"use client";

/**
 * TRANSIENT SURFACE — S5/S6's one anchored-surface system for My World's
 * utilities (People, Notifications, Messages; Search results share the same
 * motion and scrim from inside the bar).
 *
 * A surface is BROUGHT FORWARD FROM MY WORLD, not a drawer from another app and
 * not a centred modal: it hangs from the top bar exactly where it was invoked
 * (desktop: anchored at the trailing edge beside the utility icons; phone: a
 * local sheet under the bar), My World stays perceptually underneath behind a
 * quiet scrim (rendered by the page, see `Scrim`), and it is gone with Escape,
 * the scrim, or the same utility control.
 *
 * Focus discipline: focus enters the surface on open and returns to the
 * control that opened it on close (never stranded). Escape here is bubble-
 * phase, so a layer above (the Person surface, the Composer) that owns Escape
 * in the capture phase closes itself first — one Escape, one layer.
 */

import { useEffect, useRef, type ReactNode } from "react";

export function TransientSurface({ id, label, onClose, returnTo, children }: { id: string; /** Accessible name announced when focus enters the surface (a group, not a second landmark — the section inside is the landmark). */ label: string; onClose: () => void; /** The control that opened this surface — focus returns here on close. */ returnTo?: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });
  useEffect(() => {
    const el = ref.current;
    // Focus enters the surface (not its first control: a phone must not pop the keyboard for
    // a list). Tab from here reaches the first control inside.
    el?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    const opener = returnTo ? document.querySelector<HTMLElement>(returnTo) : null;
    return () => {
      window.removeEventListener("keydown", onKey);
      // Return focus only if nothing above already claimed it (a Person surface opened from a
      // row takes focus itself; a control that vanished is skipped).
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active && active !== document.body && active.isConnected) return;
        opener?.focus({ preventScroll: true });
      });
    };
  }, [returnTo]);
  return (
    // focus-visible:!outline-none — the page's unlayered `:focus-visible` rule would otherwise
    // draw a ring around the whole surface after the programmatic focus above.
    <div ref={ref} tabIndex={-1} role="group" aria-label={label} data-sb-surface={id} className="sb-surface-in absolute top-full right-0 left-0 z-10 px-2 pt-1.5 focus-visible:!outline-none @2xl:left-auto @2xl:px-6 @2xl:pt-2">
      {children}
    </div>
  );
}

/** The quiet ground under any transient surface: My World becomes slightly quieter. Sits below the bar (z-20 < z-30) so the utility controls stay live; above the page. */
export function Scrim({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden
      onClick={onClose}
      data-sb-scrim
      className="sb-scrim-in fixed inset-y-0 left-1/2 z-[20] w-[var(--frame-w,100vw)] max-w-[100vw] -translate-x-1/2 cursor-default touch-none bg-[var(--surface-scrim,rgba(20,28,42,.14))]"
    />
  );
}
