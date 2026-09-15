"use client";

/**
 * THE SYSTEMBOOM BRAND — the product's one persistent global control.
 *
 * The mark goes Home, the way every product's mark does: from My World or Life
 * it returns to Cosmos. Beside it, one quiet word says where the person is
 * (MY WORLD, LIFE). Nothing opens, nothing lists the architecture: the user
 * never needs a map of SYSTEMBOOM to move through it.
 */

import Link from "next/link";
import { SystemboomLogo } from "@/components/ui/SystemboomLogo";
import { useT } from "@/lib/i18n/LocaleProvider";
import { byId, ROOT } from "./destinations";

/** The persistent context word is localized per destination; anything else keeps its own label. */
const CONTEXT_KEY: Record<string, string> = { world: "world.context.my", life: "life.word" };

export function Brand({ current, tone = "surface", label: labelOverride }: { current: string; tone?: "surface" | "immersive"; /** Final Social Connection pass §17–18: overrides the destination's own static label — used only so "whose World" (My World vs a visitor's own {Name}'s World) is never ambiguous. The mark's Home behaviour and `current` (routing/highlight) are untouched. */ label?: string }) {
  const { t } = useT();
  const here = byId(current);
  const atRoot = current === ROOT.id;
  const immersive = tone === "immersive";
  const shell = immersive ? "bg-[rgba(10,13,20,.55)] backdrop-blur-md hover:bg-[rgba(10,13,20,.72)]" : "hover:bg-steel/10";
  // The visible context word is localized (§16): "My World" / "Life" render in the active
  // locale (en stays byte-identical — the accepted brand assertion reads MY WORLD). A visitor's
  // "{Name}'s World" override is a person's own name + a localized template, never auto-translated.
  const shownLabel = labelOverride ?? (CONTEXT_KEY[current] ? t(CONTEXT_KEY[current]) : here.label);
  const label = atRoot ? t("nav.brandRootAria") : t("nav.brandHomeAria", { where: shownLabel });

  const inner = (
    <>
      <span className="inline-flex shrink-0 items-center rounded-[11px] bg-[var(--boom)] px-2 py-[5px]">
        <SystemboomLogo height={14} />
      </span>
      <span
        className={`max-w-[46vw] truncate text-[11px] font-semibold tracking-[0.12em] uppercase @2xl:max-w-none ${immersive ? "text-[#EEF2F8]/70" : "text-muted"}`}
        data-sb-context
      >
        {shownLabel}
      </span>
    </>
  );

  // S7: the brand may SHRINK under pressure (its context word truncates via the span's own
  // max-w + truncate) instead of pushing the utilities off a 320px screen — the word is the
  // first thing to give, never the mark and never a utility. At comfortable widths nothing
  // changes: with free space, flex never shrinks it.
  if (atRoot) {
    return (
      <span aria-label={label} className={`inline-flex min-w-0 items-center gap-2 rounded-[14px] py-1 pr-2.5 pl-1 ${immersive ? "bg-[rgba(10,13,20,.55)] backdrop-blur-md" : ""}`} data-sb-brand data-sb-brand-at={current}>
        {inner}
      </span>
    );
  }
  return (
    <Link
      href={ROOT.route}
      aria-label={label}
      title="SYSTEMBOOM — Home"
      className={`sb-transition inline-flex min-w-0 items-center gap-2 rounded-[14px] py-1 pr-2.5 pl-1 focus-visible:outline-[var(--focus)] ${shell}`}
      data-sb-brand
      data-sb-brand-at={current}
    >
      {inner}
    </Link>
  );
}
