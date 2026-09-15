"use client";

/**
 * CIRCLE OF LIFE — the compact sidebar instrument. A ring, not a pie.
 * Renders from the privacy view model: the OWNER sees the day count inside,
 * the red now-tick, band calendar years and the next-round line; a VISITOR
 * sees the ring at band level only — the centre reads the band, there is no
 * day count, no tick and no calendar years (they would reveal the birth year).
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { Settings2 } from "lucide-react";
import { now } from "@/lib/clock";
import { CIRCLE_BANDS } from "@/lib/life-time";
import type { Moment, Person } from "./data";
import { LifeRing } from "./LifeRing";
import { formatInt } from "./life";
import { localISO } from "./store";
import { lifeViewFor, personViewFor, ringViewFor } from "./view-model";
import { useT } from "@/lib/i18n/LocaleProvider";
import { formatNumberLocale, sbDate } from "@/lib/i18n/format";

export function CircleModule({ viewer, subject, moments, compact = false }: { viewer: Person; subject: Person; moments: Moment[]; compact?: boolean }) {
  const { t, tp, locale } = useT();
  const at = now();
  const life = useMemo(() => lifeViewFor(viewer, subject, at), [viewer, subject, at]);
  const person = useMemo(() => personViewFor(viewer, subject), [viewer, subject]);
  const ring = useMemo(() => ringViewFor(viewer, subject, at, moments), [viewer, subject, at, moments]);
  const [band, setBand] = useState<number | null>(null);
  const own = life.scope === "owner";

  const thisMonth = moments.filter((m) => m.authorId === subject.id && m.at.slice(0, 7) === localISO(at).slice(0, 7)).length;
  const size = compact ? 96 : 220;
  const shown = band ?? life.bandIndex;
  const counts = ring.momentsByBand ?? [];

  return (
    <section aria-labelledby="sb-circle-title" className={`flex ${compact ? "flex-row items-center gap-4" : "flex-col items-center"}`} data-sb-circle={own ? "owner" : "visitor"}>
      <h2 id="sb-circle-title" className={`text-[11px] font-semibold tracking-[0.14em] text-muted uppercase ${compact ? "sr-only" : ""}`}>
        {t("life.circleOfLife")}
      </h2>
      <div className={compact ? "" : "mt-4"}>
        <LifeRing person={person} ring={ring} size={size} positionLabel={own ? life.exact : t("life.circleBand", { band: life.band })} interactive={!compact} bandYears={own ? life.bandYears : undefined} onBand={setBand}>
          {!compact && (
            <span className="flex flex-col items-center leading-none">
              {own ? (
                <>
                  <span className="text-[30px] font-semibold tracking-[-0.02em] text-text tabular-nums">{formatInt(life.totalDays)}</span>
                  <span className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("life.daysUnit")}</span>
                </>
              ) : (
                <>
                  <span className="text-[28px] font-semibold tracking-[-0.02em] text-text tabular-nums">{life.band}</span>
                  <span className="mt-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("life.bandUnit")}</span>
                </>
              )}
            </span>
          )}
        </LifeRing>
      </div>
      <div className={`flex flex-col ${compact ? "items-start" : "mt-4 items-center"} gap-1 text-[13px] tabular-nums`}>
        {compact && <span className="text-[16px] font-semibold text-text">{own ? tp("life.daysN", life.totalDays, { n: formatNumberLocale(locale, life.totalDays) }) : t("life.band", { band: life.band })}</span>}
        <p className="text-muted" data-sb-band-readout>
          {own ? (
            band === null ? (
              <>{t("life.bandUnit")} <span className="text-text">{life.band}</span> · {life.bandYears(shown)[0]}–{life.bandYears(shown)[1]}</>
            ) : (
              <>{t("life.bandUnit")} <span className="text-text">{CIRCLE_BANDS[shown]}</span> · {life.bandYears(shown)[0]}–{life.bandYears(shown)[1]} · {counts[shown] ? tp("life.momentsN", counts[shown]) : shown > life.bandIndex ? t("life.unwritten") : t("life.noMomentsRecorded")}</>
            )
          ) : band === null ? (
            <>{t("life.bandUnit")} <span className="text-text">{life.band}</span></>
          ) : (
            <>{t("life.bandUnit")} <span className="text-text">{CIRCLE_BANDS[shown]}</span> · {shown > life.bandIndex ? t("life.unwritten") : t("life.lived")}</>
          )}
        </p>
        {/* Social Freeze Delta defect fix: this exact monthly count rendered for ANY viewer,
            unconditionally — a density leak outside the ring's own privacy gating (band-only
            readout above already correctly hid it for a visitor; this sibling line did not). */}
        {own && <p className="text-muted">{thisMonth === 0 ? t("life.noMomentsThisMonth") : tp("life.momentsThisMonthN", thisMonth)}</p>}
      </div>
      {!compact && own && (
        <>
          {/* Phase 5 §24: the compact module is a glanceable instrument — the date is informational; the full Circle owns time navigation. */}
          <div className="mt-4 flex items-center gap-2 text-[13px] text-muted tabular-nums">
            <span>{t("life.todayLabel")} · <span data-sb-date-display className="text-text">{sbDate(locale, localISO(at))}</span></span>
            <button type="button" aria-label="Circle settings" className="sb-transition inline-flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-steel/15 hover:text-text focus-visible:outline-[var(--focus)]">
              <Settings2 size={16} strokeWidth={1.75} />
            </button>
          </div>
          <Link href="/life" className="sb-transition mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--hair)] px-3 text-[13px] font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]" data-sb-open-life>
            <span aria-hidden className="h-2.5 w-2.5 rounded-full border border-steel" />
            {t("life.openLife")}
          </Link>
        </>
      )}
    </section>
  );
}
