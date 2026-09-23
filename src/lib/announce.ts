/**
 * ANNOUNCE — one polite live region for outcomes whose own element is gone (Phase 4.4-A).
 *
 * A Moment that is hidden or deleted takes its local `role=status` toast with it, so the outcome
 * would otherwise be silent. This speaks through a persistent visually-hidden region. When focus
 * is inside an open `aria-modal` dialog, a region INSIDE that dialog is used (`[data-sb-announcer]`
 * rendered by the dialog): content outside a modal dialog is pruned from the accessibility tree,
 * so a document-level region would not be read there. Text only; callers pass localised words.
 */
export function announce(text: string) {
  if (typeof document === "undefined") return;
  const modal = (document.activeElement as HTMLElement | null)?.closest?.<HTMLElement>('[aria-modal="true"]');
  let el = modal?.querySelector<HTMLElement>("[data-sb-announcer]") ?? document.querySelector<HTMLElement>("body > [data-sb-announcer]");
  if (!el) {
    el = document.createElement("div");
    el.setAttribute("data-sb-announcer", "");
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    el.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0";
    document.body.appendChild(el);
  }
  // Clear first so the same sentence twice is still announced twice.
  el.textContent = "";
  const region = el;
  requestAnimationFrame(() => {
    region.textContent = text;
  });
}
