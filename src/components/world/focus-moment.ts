/**
 * S5 — "I was told something changed → here is that exact thing."
 *
 * A Search result or a Notification names a Moment; this takes the reader
 * straight to it in the Almanac: scroll it into view, put focus on its readout
 * (the same landing a just-posted Moment gets), and let it settle once
 * (`data-sb-focused` → `sb-target-settle`). No intermediate page, no state
 * beyond one attribute that removes itself. The caller has already dispatched
 * `reveal` so the Moment is loaded; two frames later it is in the DOM.
 */
export function focusMoment(id: string) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-sb-moment="${id}"]`);
      if (!el) return;
      const reduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      // Far away → jump, near → glide (the same rule the posted-Moment landing uses).
      const distance = Math.abs(el.getBoundingClientRect().top - window.innerHeight / 2);
      el.scrollIntoView({ block: "center", behavior: reduced || distance > window.innerHeight * 2.5 ? "auto" : "smooth" });
      el.querySelector<HTMLElement>("[data-sb-readout]")?.focus({ preventScroll: true });
      el.setAttribute("data-sb-focused", "");
      const clear = () => el.removeAttribute("data-sb-focused");
      el.addEventListener("animationend", clear, { once: true });
      window.setTimeout(clear, 1200);
    }),
  );
}

/**
 * S4 — "someone replied / mentioned you / felt something about your response → here is that
 * exact response." Scrolls the Moment in (the conversation may not be mounted yet), then asks
 * it — via one window event the Moment itself listens for — to open its conversation on that
 * response. The Moment owns HOW (inline notes on a wide screen, the focused surface on a
 * phone) exactly as if the reader had opened it by hand.
 */
export function focusNote(momentId: string, noteId: string) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-sb-moment="${momentId}"]`);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "auto" });
      window.dispatchEvent(new CustomEvent("sb-focus-note", { detail: { momentId, noteId } }));
    }),
  );
}

/** The retrying reveal both conversation shapes share: find the row, land on it, settle once. */
export function settleOnNote(scope: HTMLElement | null, noteId: string, done?: () => void, attempts = 16) {
  const el = scope?.querySelector<HTMLElement>(`[data-sb-note="${noteId}"]`);
  if (el) {
    el.scrollIntoView({ block: "center" });
    el.setAttribute("tabindex", "-1");
    el.focus({ preventScroll: true });
    el.setAttribute("data-sb-focused", "");
    window.setTimeout(() => el.removeAttribute("data-sb-focused"), 1200);
    done?.();
    return;
  }
  if (attempts > 0) requestAnimationFrame(() => settleOnNote(scope, noteId, done, attempts - 1));
  else done?.();
}
