"use client";

/**
 * /style-lab/circle — the Circle of Life reference page.
 *
 * Harness (not the design): ?w=360|390|768|desktop · ?theme=light|dark (layout boot
 * script) · ?viewer=maya|asha|visitor|ashaVisitor (the Social store's viewer modes —
 * visitor modes view Giulia's Circle at band resolution) · ?entry=ring (start from the
 * compressed Life Ring and expand) · ?c=<coordinate> · ?harness=0.
 *
 * The Circle reads the accepted Social store (frozen) as its content source:
 * Moments are the canonical objects; there is no second "Circle post" model.
 */

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { now } from "@/lib/clock";
import { useReducedMotionPref } from "@/lib/use-reduced-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SystemboomLogo } from "@/components/ui/SystemboomLogo";
import { WorldShell } from "@/components/shell/WorldShell";
import { Composer, emptyDraft } from "../social/Composer";
import { LifeRing } from "../social/LifeRing";
import { SocialStore, useSocial, type Draft } from "../social/store";
import { lifeViewFor, personViewFor, ringViewFor } from "../social/view-model";
import { CircleView } from "./CircleView";
import { circleViewFor, decodeCoord, type Coord } from "./model";
import { PEOPLE } from "../social/data";

type Frame = "360" | "390" | "768" | "desktop";
const FRAME_PX: Record<Frame, string> = { "360": "360px", "390": "390px", "768": "768px", desktop: "100%" };

/* The Social scoped tokens, so the day-level Almanac renders with the accepted Moment components.
   In the live system these live once in globals.css (README §E Tokens). */
const SCOPED_CSS = `
@font-face{font-family:"SB Devanagari";src:url("/fonts/noto-sans-devanagari/NotoSansDevanagari-VF.ttf") format("truetype");font-weight:400;font-variation-settings:"wght" 500;font-display:swap;}
@font-face{font-family:"SB Devanagari";src:url("/fonts/noto-sans-devanagari/NotoSansDevanagari-VF.ttf") format("truetype");font-weight:500;font-variation-settings:"wght" 600;font-display:swap;}
@font-face{font-family:"SB Devanagari";src:url("/fonts/noto-sans-devanagari/NotoSansDevanagari-VF.ttf") format("truetype");font-weight:600;font-variation-settings:"wght" 700;font-display:swap;}
.sb-circle-page,.sb-social{
  font-family:var(--font-geist-sans),"SB Devanagari","Kohinoor Devanagari","Nirmala UI",sans-serif;
  --gutter:28px;--rule-x:13px;--bleed:16px;
  --page:var(--bg);--sheet:transparent;--sheet-bg:var(--bg);--sheet-solid:#10141e;--sheet-raised:var(--content);
  --hair:rgba(201,216,234,.14);--rule:rgba(201,216,234,.22);
  --navy:#8FB3D9;--unit-grey:#C9D8EA;
  --card:var(--surface);--card-edge:rgba(142,155,176,.18);--card-shadow:none;--sheet-shadow:none;--sheet-radius:0px;
}
.sb-circle-page{background:var(--page);}
[data-theme="light"] .sb-circle-page,[data-theme="light"] .sb-social{
  --page:#F5F5F6;--sheet:#FDFDFD;--sheet-bg:#FDFDFD;--sheet-solid:#FDFDFD;--sheet-raised:#FFFFFF;
  --hair:rgba(15,21,32,.14);--rule:rgba(15,21,32,.22);
  --navy:#3D678C;--unit-grey:#39454E;
  --card:#FDFDFD;--card-edge:transparent;--card-shadow:0 8px 28px -18px rgba(30,45,70,.25);--sheet-shadow:0 8px 28px -18px rgba(30,45,70,.25);--sheet-radius:24px;
}
.sb-social .sb-media{position:relative;}
.sb-social .sb-composer-shell{inset:0;}
@container (min-width: 42rem){.sb-social .sb-composer-shell{inset:auto;top:2rem;left:50%;transform:translateX(-50%);width:min(560px,92%);max-height:calc(100vh - 4rem);border-radius:24px;box-shadow:0 24px 64px -24px rgba(0,0,0,.45);}}
@keyframes sb-land{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.sb-social .sb-land{animation:sb-land 220ms var(--ease-out);}
@keyframes sb-posting{from{width:0}to{width:100%}}
.sb-social .sb-posting{animation:sb-posting 900ms linear forwards;}
@keyframes sb-resolving{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
.sb-social .sb-resolving{animation:sb-resolving 700ms linear infinite;}
`;

export function CirclePreview({ product = false }: { product?: boolean }) {
  return (
    <SocialStore>
      <Inner product={product} />
    </SocialStore>
  );
}

function Inner({ product = false }: { product?: boolean }) {
  const { state, dispatch, me, profile } = useSocial();
  const reduced = useReducedMotionPref();
  const [frame, setFrame] = useState<Frame>("desktop");
  const [harness, setHarness] = useState(!product);
  const [entry, setEntry] = useState<"ring" | "circle">("circle");
  const [initialCoord, setInitialCoord] = useState<Coord | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const [composer, setComposer] = useState<Draft | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    // The review harness belongs to the development alias only.
    const w = product ? null : q.get("w");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of review params
    if (w === "360" || w === "390" || w === "768" || w === "desktop") setFrame(w);
    const v = product ? null : q.get("viewer");
    if (v === "maya" || v === "asha" || v === "visitor" || v === "ashaVisitor") dispatch({ type: "viewer", viewer: v });
    if (!product && q.get("harness") === "0") setHarness(false);
    if (!product && q.get("entry") === "ring") setEntry("ring");
    setInitialCoord(decodeCoord(q.get("c")));
    setReady(true);
  }, [dispatch, product]);

  // Dev hook (prototype only): lets the acceptance suite evaluate the temporal model for edge-case
  // births (newborn, over ninety, 29 FEB, date-only precision) without shipping fixture identities.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    (window as unknown as { __SB_CIRCLE?: unknown }).__SB_CIRCLE = {
      viewFor(birthDate: string, birthTime: string | null, coord: string, nowISO?: string) {
        const subject = { ...PEOPLE.maya, id: "probe", birthDate, birthTime: birthTime ?? undefined, birthTimeKnown: !!birthTime };
        const v = circleViewFor(subject, subject, decodeCoord(coord), nowISO ? new Date(nowISO) : now(), state.moments, []);
        return { level: v.level, precision: v.precision, nowAngle: v.nowAngle, readout: v.readout, ringState: v.ringState, segments: v.segments.map((x) => ({ key: x.key, label: x.label, state: x.state, lived: Number(x.lived.toFixed(4)), count: x.count, enterable: x.enterable, isNow: x.isNow })) };
      },
    };
  }, [state.moments]);

  const own = me.id === profile.id;
  const at = now();
  const life = lifeViewFor(me, profile, at);
  const onRecordAt = useCallback((date: string) => setComposer(emptyDraft(date, me.home)), [me.home]);
  const containerW = frame === "desktop" ? "100vw" : FRAME_PX[frame];

  return (
    <MotionConfig reducedMotion="user">
      <style dangerouslySetInnerHTML={{ __html: SCOPED_CSS }} />
      <div className="min-h-dvh bg-bg text-text">
        {/* ---- harness (not the design) ---- */}
        <div className={`sticky top-0 z-50 border-b border-divider bg-bg/95 px-4 py-2 text-[12px] backdrop-blur-sm ${harness ? "" : "hidden"}`} data-sb-harness>
          <div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/style-lab" className="flex items-center gap-2 text-muted hover:text-text">
              <SystemboomLogo height={14} /> <span>Style lab · Circle of Life</span>
            </Link>
            <span className="flex items-center gap-1 text-muted">
              Width
              <span className="ml-1 inline-flex overflow-hidden rounded-full border border-divider">
                {(["360", "390", "768", "desktop"] as Frame[]).map((f) => (
                  <button key={f} type="button" onClick={() => setFrame(f)} aria-pressed={frame === f} className={`px-2.5 py-1 ${frame === f ? "bg-content text-text" : "text-muted hover:text-text"}`}>
                    {f}
                  </button>
                ))}
              </span>
            </span>
            <span className="flex items-center gap-1 text-muted">
              Viewer
              <span className="ml-1 inline-flex overflow-hidden rounded-full border border-divider">
                {(
                  [
                    ["maya", "Giulia (owner)"],
                    ["asha", "Sofia (no birth time)"],
                    ["visitor", "Luca → Giulia"],
                    ["ashaVisitor", "Sofia → Giulia"],
                  ] as const
                ).map(([v, label]) => (
                  <button key={v} type="button" onClick={() => dispatch({ type: "viewer", viewer: v })} aria-pressed={state.viewer === v} className={`px-2.5 py-1 ${state.viewer === v ? "bg-content text-text" : "text-muted hover:text-text"}`}>
                    {label}
                  </button>
                ))}
              </span>
            </span>
            <button type="button" onClick={() => setEntry("ring")} className="rounded-full border border-divider px-2.5 py-1 text-muted hover:text-text">
              Entry from ring
            </button>
            <span className="ml-auto flex items-center gap-2">
              <Link href="/style-lab/social" className="rounded-full border border-divider px-2.5 py-1 text-muted hover:text-text">
                Social
              </Link>
              <ThemeToggle />
            </span>
          </div>
        </div>

        <WorldShell current="life">
        <div className="mx-auto flex justify-center">
          <div data-sb-circle-frame={frame} className="sb-circle-page @container relative min-h-[900px] overflow-x-hidden text-text" style={{ width: FRAME_PX[frame], maxWidth: "100%", boxShadow: frame === "desktop" ? undefined : "0 0 0 1px var(--edge)", ["--frame-w" as string]: containerW }}>
            <main className="mx-auto max-w-[1120px] px-4 pt-4 pb-24 @2xl:px-6 @5xl:pt-8">
              {/* ---- the person row: the compressed Life Ring — the Circle at its smallest resolution ---- */}
              <div className="flex items-center gap-3">
                <AnimatePresence initial={false} mode="popLayout">
                  {entry === "ring" ? (
                    <motion.button
                      key="ring"
                      type="button"
                      layoutId={reduced ? undefined : "life-geometry"}
                      onClick={() => setEntry("circle")}
                      className="group flex items-center gap-4 rounded-full py-2 pr-4 text-left focus-visible:outline-[var(--focus)]"
                      exit={reduced ? { opacity: 0 } : undefined}
                      data-sb-entry-ring
                    >
                      <span className="block rounded-full bg-[var(--page)] p-[3px]">
                        <LifeRing person={personViewFor(me, profile)} ring={ringViewFor(me, profile, at)} size={96} positionLabel={life.scope === "owner" ? life.exact : `Circle band ${life.band}`} />
                      </span>
                      <span className="leading-tight">
                        <span className="block text-[17px] font-semibold text-text">{profile.name}</span>
                        <span className="block text-[13px] text-muted tabular-nums">{life.scope === "owner" ? `age ${life.years} · ${life.exact}` : `band ${life.band}`}</span>
                        <span className="mt-1 block text-[12px] font-medium text-[var(--boom)] group-hover:underline">Look closer</span>
                      </span>
                    </motion.button>
                  ) : (
                    <motion.div key="person" className="flex items-center gap-3" initial={reduced ? { opacity: 0 } : false} animate={{ opacity: 1 }} data-sb-person-row>
                      <span className="block rounded-full bg-[var(--page)] p-[2px]">
                        <LifeRing person={personViewFor(me, profile)} ring={ringViewFor(me, profile, at)} size={32} positionLabel={life.scope === "owner" ? life.exact : `Circle band ${life.band}`} />
                      </span>
                      <span className="text-[14px] font-medium text-text">{profile.name}</span>
                      {life.scope === "other" && <span className="text-[12px] text-muted tabular-nums">band {life.band}</span>}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---- the full Circle: the same geometry, expanded ---- */}
              <AnimatePresence initial={false}>
                {entry === "circle" && ready && (
                  <motion.div key="circle" layoutId={reduced ? undefined : "life-geometry"} initial={reduced ? { opacity: 0 } : { opacity: 0 }} animate={{ opacity: 1 }} transition={reduced ? { duration: 0.12 } : { duration: 0.48, ease: [0.32, 0.72, 0, 1] }} className="mt-3 rounded-[32px]">
                    <CircleView viewer={me} subject={profile} moments={state.moments} hidden={state.hidden} initialCoord={own ? initialCoord : { level: 0 }} onRecordAt={own ? onRecordAt : undefined} />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
            {composer && (
              <div className="sb-social">
                <Composer open initial={composer} onClose={() => setComposer(null)} />
              </div>
            )}
          </div>
        </div>
        </WorldShell>
      </div>
    </MotionConfig>
  );
}
