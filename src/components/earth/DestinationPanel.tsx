"use client";

/**
 * SYSTEMBOOM DESTINATION PANEL — arrival creates context.
 *
 * One provider-independent surface fed by DestinationContext:
 *   desktop — compact floating card, lower left, clear of attribution
 *   mobile  — compact bottom destination sheet (expandable, collapsible)
 *
 * It rises in after the camera settles ("I have arrived", not
 * "modal opened") and announces the arrival politely.
 */

import { useEffect, useRef, useState } from "react";
import { ChevronUp, X } from "lucide-react";
import { useChrome } from "@/components/cosmos/overlays";
import type { DestinationContext } from "@/lib/earth/destination";

export function DestinationPanel({
  destination,
  onClose,
  desktopOffsetClass = "sm:bottom-10",
}: {
  destination: DestinationContext | null;
  onClose: () => void;
  /** Literal Tailwind class for the desktop bottom offset (attribution clearance). */
  desktopOffsetClass?: string;
}) {
  if (!destination) return null;
  return (
    <PanelInner
      key={destination.id}
      d={destination}
      onClose={onClose}
      desktopOffsetClass={desktopOffsetClass}
    />
  );
}

function PanelInner({
  d,
  onClose,
  desktopOffsetClass,
}: {
  d: DestinationContext;
  onClose: () => void;
  desktopOffsetClass: string;
}) {
  const { panel } = useChrome();
  const [risen, setRisen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const rise = setTimeout(() => setRisen(true), 30);
    const focus = setTimeout(
      () => heading.current?.focus({ preventScroll: true }),
      420,
    );
    return () => {
      clearTimeout(rise);
      clearTimeout(focus);
    };
  }, []);

  // Secondary content collapses inside the mobile sheet until expanded.
  const more = expanded ? "" : "max-sm:hidden";

  return (
    <aside
      role="dialog"
      aria-label={`${d.name} — destination`}
      className={`fixed z-30 border backdrop-blur-xl transition-all duration-500 ease-out ${panel} max-sm:inset-x-0 max-sm:bottom-0 max-sm:rounded-t-3xl max-sm:border-x-0 max-sm:border-b-0 max-sm:px-5 max-sm:pt-3 max-sm:pb-6 sm:left-6 sm:w-[min(88vw,300px)] sm:rounded-2xl sm:p-5 ${desktopOffsetClass} ${
        risen ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      }`}
    >
      {/* sheet grip — mobile only */}
      <div className="mx-auto mb-2 h-1 w-9 rounded-full bg-white/20 sm:hidden" aria-hidden />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          {d.eyebrow && (
            <p className="text-[11px] font-semibold tracking-[0.18em] uppercase opacity-55">
              {d.eyebrow}
            </p>
          )}
          <h2
            ref={heading}
            tabIndex={-1}
            className="mt-0.5 text-lg leading-snug font-semibold !outline-none"
          >
            {d.name}
          </h2>
          {d.displayAddress ? (
            <p className="mt-1.5 text-xs leading-relaxed whitespace-pre-line opacity-75">
              {d.displayAddress}
            </p>
          ) : (
            d.country && <p className="mt-0.5 text-xs opacity-60">{d.country}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            aria-label={expanded ? "Show less" : "Show more"}
            className="rounded-full p-1.5 opacity-70 hover:bg-white/10 hover:opacity-100 focus-visible:outline-[#8fc2ff] sm:hidden"
          >
            <ChevronUp
              size={15}
              className={`transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </button>
          <button
            onClick={onClose}
            aria-label="Close destination details"
            className="rounded-full p-1.5 opacity-70 hover:bg-white/10 hover:opacity-100 focus-visible:outline-[#8fc2ff]"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {d.description && (
        <p className={`mt-2 text-xs leading-relaxed opacity-70 ${more}`}>{d.description}</p>
      )}
      {d.precisionNote && (
        <p className="mt-1.5 text-[11px] tracking-wide text-[#ffd08a]/70 uppercase">
          {d.precisionNote}
        </p>
      )}
      {/* Future Life bridge — honest placeholder only, no fabricated memories */}
      <p className={`mt-2.5 text-[11px] opacity-45 ${more}`}>
        Life moments here — arrives with SYSTEMBOOM Life.
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        Arrived at {d.name}
        {d.country ? `, ${d.country}` : ""}.
      </p>
    </aside>
  );
}
