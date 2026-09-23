"use client";

/**
 * LIFE CURSOR — Social 2030 Final Delta §3.
 *
 * The Life Ring says where a person is now. The Life Cursor says which part
 * of their recorded life the viewer is CURRENTLY BROWSING, as they scroll the
 * Almanac (the Moments stream). It only ever shows real, already-rendered
 * Moment data — a year, a viewer-safe life position, a place when the Moment
 * has one — never a fabricated coordinate.
 *
 * Restraint, deliberately: no scroll hijacking (a passive scroll listener
 * only ever READS position, rAF-throttled — nothing steers the page), no
 * sticky glass panel (solid sheet-coloured background, no blur, no shadow),
 * no HUD (an ordinary in-flow row, not a floating overlay), no timeline
 * scrubber, no ambient animation — content swaps instantly, reduced motion or
 * not (there was never anything to animate). It is silent for the CURRENT
 * year on purpose: stating "2026 · now" would repeat what every Moment in
 * that stretch already says. It only speaks once the viewer has scrolled
 * into genuine history — that is the "meaningful historical scrolling" gate,
 * driven by real dates, not a pixel count — which also guarantees it can
 * never occupy the first screen: the feed always opens on the present.
 *
 * Self-critique correction: the wrapper's height is fixed and always
 * rendered, whether or not it currently has anything to say. Mounting and
 * unmounting a variable-height row on scroll fed back into the very scroll
 * position it was reading — a real, measured layout-thrash bug this
 * component must never reintroduce.
 */

import { useEffect, useState } from "react";
import { now } from "@/lib/clock";
import type { Moment, Person } from "./data";
import { momentLifeFor } from "./view-model";
import { useT } from "@/lib/i18n/LocaleProvider";

const TRIGGER_LINE = 88; // just below the sticky top bar

export function LifeCursor({ viewer, feed, personOf }: { viewer: Person; feed: Moment[]; personOf: (id: string) => Person }) {
  const [topId, setTopId] = useState<string | null>(null);
  const { t } = useT();

  useEffect(() => {
    let raf = 0;
    const recompute = () => {
      raf = 0;
      // Moments render in chronological (document) order — the cursor is the LAST one whose top
      // edge has already scrolled past the trigger line, i.e. the one the viewer is now reading.
      const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-sb-sheet] [data-sb-moment]"));
      let current: HTMLElement | null = null;
      for (const n of nodes) {
        if (n.getBoundingClientRect().top <= TRIGGER_LINE) current = n;
        else break;
      }
      setTopId(current ? current.getAttribute("data-sb-moment") : null);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(recompute);
    };
    recompute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [feed.length]);

  const moment = topId ? feed.find((m) => m.id === topId) : null;
  const year = moment ? new Date(moment.at).getFullYear() : null;
  const currentYear = now().getFullYear();
  // Silence is the default: the current year needs no cursor, and there is nothing to show
  // until a Moment has actually scrolled past the trigger line.
  const active = !!moment && year !== null && year !== currentYear;

  const author = active && moment ? personOf(moment.authorId) : null;
  const life = active && moment && author ? momentLifeFor(viewer, author, new Date(moment.at)) : null;
  // Phase 4.4-A (A24): the band phrase routes through the catalog (en byte-identical: "Life 30–45").
  const position = life ? (life.exact ?? t("life.cursorBand", { band: life.band })) : null;

  return (
    <div
      className={`sticky top-[52px] z-10 h-[33px] overflow-hidden bg-[var(--sheet)] px-4 text-[12px] text-muted tabular-nums @2xl:px-6 ${active ? "border-b border-[var(--hair)]" : ""}`}
      data-sb-life-cursor={active ? "" : undefined}
      data-sb-life-cursor-year={active && year !== null ? year : undefined}
    >
      {active && moment && (
        <div className="flex h-full items-center">
          <span className="font-medium text-text">{year}</span>&nbsp;· {position}
          {moment.place && <span>&nbsp;· {moment.place}</span>}
        </div>
      )}
    </div>
  );
}
