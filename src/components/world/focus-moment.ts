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
