"use client";

/**
 * SOCIAL — Phase 4 final preview (style-lab only).
 * Light: the live system's white-on-grey foundation, refined — one white
 * sheet holds the feed, entries on the Almanac rule separated by hairlines,
 * sidebar modules as white cards, red returned to the chrome.
 * Dark: Deep Cosmos as built in 4.0 — entries on the page, glass on chrome.
 * Container queries: <@2xl phone · @2xl–@5xl tablet · ≥@5xl desktop.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MotionConfig } from "motion/react";
import { SystemboomLogo } from "@/components/ui/SystemboomLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { now } from "@/lib/clock";
import { PEOPLE, type Moment, type Person } from "./data";
import { Composer, draftFromMoment, emptyDraft } from "./Composer";
import { CircleModule } from "./CircleModule";
import { LifeCounter } from "./LifeCounter";
import { LifeCursor } from "./LifeCursor";
import { prefetchQuickArt } from "./expressions";
import { MomentEntry } from "./Moment";
import { ProfileHero } from "./ProfileHero";
import { NotificationsPanel, TopBar } from "./Chrome";
import { PersonIdentity } from "@/components/identity/PersonIdentity";
import { WorldProvider, useWorldMaybe } from "@/components/world/WorldProvider";
import { PersonCard } from "@/components/world/PersonCard";
import { MessagesPanel, MiniChat } from "@/components/world/Messages";
import { PeoplePanel } from "@/components/world/People";
import { Scrim, TransientSurface } from "@/components/world/TransientSurface";
import { SocialStore, dateKey, localISO, useSocial, type Draft, type ViewerMode } from "./store";
import { lifeViewFor, momentLifeFor, ringViewFor } from "./view-model";
import { useT } from "@/lib/i18n/LocaleProvider";

/**
 * "View as public" — Social Freeze Delta. A technical stand-in `viewer`, never rendered or
 * named anywhere: its only job is to make `viewer.id !== subject.id`, so `lifeViewFor` /
 * `personViewFor` / `ringViewFor` resolve the OWNER's own profile through the exact same
 * "other" branch a genuine stranger gets. No second privacy model is written for this.
 */
const PUBLIC_VIEWER: Person = { id: "sb-public-viewer", name: "", birthDate: "2000-01-01", birthTimeKnown: false, home: "" };

type Frame = "360" | "768" | "desktop";
const FRAME_PX: Record<Frame, string> = { "360": "360px", "768": "768px", desktop: "100%" };

const SCOPED_CSS = `
@font-face{font-family:"SB Devanagari";src:url("/fonts/noto-sans-devanagari/NotoSansDevanagari-VF.ttf") format("truetype");font-weight:400;font-variation-settings:"wght" 500;font-display:swap;}
@font-face{font-family:"SB Devanagari";src:url("/fonts/noto-sans-devanagari/NotoSansDevanagari-VF.ttf") format("truetype");font-weight:500;font-variation-settings:"wght" 600;font-display:swap;}
@font-face{font-family:"SB Devanagari";src:url("/fonts/noto-sans-devanagari/NotoSansDevanagari-VF.ttf") format("truetype");font-weight:600;font-variation-settings:"wght" 700;font-display:swap;}
.sb-social{
  font-family:var(--font-geist-sans),"SB Devanagari","Kohinoor Devanagari","Nirmala UI","Noto Sans SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
  /* the material bridge from Cosmos: the same quiet atmosphere, no stars */
  background:var(--bg-atmosphere,var(--page));
  --gutter:28px;--rule-x:13px;--bleed:16px;
  --page:var(--bg);--sheet:transparent;--sheet-bg:var(--bg);--sheet-solid:#10141e;--sheet-raised:var(--content);
  --hair:rgba(201,216,234,.14);--rule:rgba(201,216,234,.22);
  --navy:#8FB3D9;--unit-grey:#C9D8EA;
  --card:var(--surface);--card-edge:rgba(142,155,176,.18);--card-shadow:none;--sheet-shadow:none;--sheet-radius:0px;
}

[data-theme="light"] .sb-social{
  background:#F5F5F6;
  --page:#F5F5F6;--sheet:#FDFDFD;--sheet-bg:#FDFDFD;--sheet-solid:#FDFDFD;--sheet-raised:#FFFFFF;
  --hair:rgba(15,21,32,.14);--rule:rgba(15,21,32,.22);
  --navy:#3D678C;--unit-grey:#39454E;
  --card:#FDFDFD;--card-edge:transparent;--card-shadow:0 8px 28px -18px rgba(30,45,70,.25);--sheet-shadow:0 8px 28px -18px rgba(30,45,70,.25);--sheet-radius:24px;
}
.sb-social .sb-media{position:relative;}
.sb-social .sb-composer-shell{inset:0;}
/* S7: centred via inset+margin auto, NOT translateX(-50%) — Motion animates the shell's
   transform (its y-settle), and an inline transform would silently replace the CSS centring
   (the tablet capture caught the modal right-pinned mid/after animation). */
@container (min-width: 42rem){.sb-social .sb-composer-shell{inset:auto 0;top:2rem;margin-inline:auto;width:min(560px,92%);max-height:calc(100vh - 4rem);border-radius:24px;box-shadow:0 24px 64px -24px rgba(0,0,0,.45);}}
@keyframes sb-roll{from{transform:translateY(-0.55em);opacity:0}to{transform:translateY(0);opacity:1}}
.sb-social .sb-roll{animation:sb-roll 220ms var(--ease-out);}
@keyframes sb-land{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.sb-social .sb-land{animation:sb-land 220ms var(--ease-out);}
@keyframes sb-posting{from{width:0}to{width:100%}}
.sb-social .sb-posting{animation:sb-posting 900ms linear forwards;}
@keyframes sb-resolving{from{transform:translateX(-100%)}to{transform:translateX(300%)}}
.sb-social .sb-resolving{animation:sb-resolving 700ms linear infinite;}
@keyframes sb-arrive{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
.sb-social .sb-arrive{animation:sb-arrive 480ms var(--ease-out);}
@media (prefers-reduced-motion: reduce){.sb-social .sb-arrive{animation:none;}}
/* S6 — the quiet ground under a transient surface, per theme: a whisper in light, a real
   dimming in dark (where a 40% scrim over the atmosphere barely read at all). */
.sb-social{--surface-scrim:rgba(4,6,10,.42);}
[data-theme="light"] .sb-social{--surface-scrim:rgba(20,28,42,.14);}
/* S6 §65 — while the viewer perspective flips (My view ⇄ Public view) the Hero's own entry
   resolve must not replay: one primary event at a time (§52), and it is the same person. */
.sb-social [data-sb-perspective-switching] [data-sb-hero] *{animation-duration:0.01ms !important;animation-delay:0ms !important;}
/* S7 §55 — CJK is never letter-spaced: the small-caps tracking that gives Latin labels their
   instrument voice reads as broken kerning in 简体中文. Latin words inside a zh page (names,
   SYSTEMBOOM) keep their own spacing via their inline elements' computed style. */
:lang(zh-Hans) .sb-social [class*="tracking-"]{letter-spacing:0.02em;}
/* R3 — SYSTEMBOOM EXPRESSION LANGUAGE motion.
   Shared DNA: ENTRY → EMOTIONAL GESTURE → BOOM PULSE → SETTLE. Per-energy duration is
   set inline (quiet 300 · warm 380 · lively 460ms). Every keyframe is one-shot ("both"),
   plays only on the object the person just touched, and is collapsed to its final state by
   the global reduced-motion rule — where the POSE alone still carries the emotion. */
@keyframes sb-expr-in{0%{transform:scale(.6);opacity:0}58%{transform:scale(1.07);opacity:1}100%{transform:scale(1);opacity:1}}
.sb-social .sb-expr-in{animation-name:sb-expr-in;animation-timing-function:var(--ease-out);animation-fill-mode:both;}
/* the gesture layer: quiet settles straight, warm leans in, lively adds one small rock */
@keyframes sb-gesture-warm{0%{translate:0 2px}60%{translate:0 -2px}100%{translate:0 0}}
@keyframes sb-gesture-lively{0%{rotate:0deg}35%{rotate:-4deg}70%{rotate:3deg}100%{rotate:0deg}}
.sb-social .sb-energy-warm{animation-name:sb-expr-in,sb-gesture-warm;}
.sb-social .sb-energy-lively{animation-name:sb-expr-in,sb-gesture-lively;}
/* R3.2 §15 — the QUICK SIX each get their own emotional gesture on top of the shared DNA.
   Same grammar (anticipate → express → settle), six different temperaments. Amplitudes stay
   small on purpose: this is a heavy metal character, and the mass layer below already
   carries the weight — the gesture only says WHAT KIND of feeling arrived. */
@keyframes sb-g-care{0%{rotate:-3deg;translate:0 1px}52%{rotate:1deg;translate:0 -1px}100%{rotate:0deg;translate:0 0}}
@keyframes sb-g-joy{0%{translate:0 2px}54%{translate:0 -4px}100%{translate:0 0}}
@keyframes sb-g-laugh{0%{rotate:0deg}26%{rotate:-7deg}54%{rotate:5deg}78%{rotate:-2deg}100%{rotate:0deg}}
@keyframes sb-g-wow{0%{translate:0 0;rotate:0deg}18%{translate:0 3px;rotate:2deg}46%{translate:0 -5px;rotate:-3deg}100%{translate:0 0;rotate:0deg}}
@keyframes sb-g-celebrate{0%{translate:0 3px;rotate:0deg}30%{translate:0 -7px;rotate:-6deg}62%{translate:0 -2px;rotate:4deg}100%{translate:0 0;rotate:0deg}}
@keyframes sb-g-support{0%{translate:0 -2px}34%{translate:0 2px}72%{translate:0 0}100%{translate:0 0}}
.sb-social .sb-g-care{animation-name:sb-expr-in,sb-g-care;}
.sb-social .sb-g-joy{animation-name:sb-expr-in,sb-g-joy;}
.sb-social .sb-g-laugh{animation-name:sb-expr-in,sb-g-laugh;}
.sb-social .sb-g-wow{animation-name:sb-expr-in,sb-g-wow;}
.sb-social .sb-g-celebrate{animation-name:sb-expr-in,sb-g-celebrate;}
.sb-social .sb-g-support{animation-name:sb-expr-in,sb-g-support;}
/* R3.1 §28–§29 MASS. The character is a heavy metal bomb, not a rubber emoji, so the BODY
   impulse is its own layer: amplitude and rebound come from mass, not from the energy family.
   heavy barely overshoots and lands hard; light may bound once. */
@keyframes sb-mass-heavy{0%{transform:translateY(-3px) scaleY(1.015)}38%{transform:translateY(2px) scaleY(.964) scaleX(1.028)}64%{transform:translateY(0) scaleY(1.008)}100%{transform:none}}
@keyframes sb-mass-normal{0%{transform:translateY(-5px)}40%{transform:translateY(2px) scaleY(.972) scaleX(1.022)}72%{transform:translateY(-1px) scaleY(1.012)}100%{transform:none}}
@keyframes sb-mass-light{0%{transform:translateY(-9px)}32%{transform:translateY(2px) scaleY(.948) scaleX(1.042)}56%{transform:translateY(-4px) scaleY(1.03)}80%{transform:translateY(0) scaleY(.99)}100%{transform:none}}
.sb-social .sb-mass{display:block;height:100%;width:100%;transform-origin:50% 100%;animation-fill-mode:both;}
.sb-social .sb-mass-heavy{animation-name:sb-mass-heavy;animation-duration:300ms;animation-timing-function:cubic-bezier(.16,.86,.26,1);}
.sb-social .sb-mass-normal{animation-name:sb-mass-normal;animation-duration:360ms;animation-timing-function:var(--ease-out);}
.sb-social .sb-mass-light{animation-name:sb-mass-light;animation-duration:440ms;animation-timing-function:cubic-bezier(.22,1.02,.32,1);}
/* the Boom Pulse (§27, refined R3.1): spark → body impulse → PRESSURE RING. One thin ring
   leaving the character's own edge — displaced air, not a Material ripple and never a glow. */
@keyframes sb-boom-pulse{0%{transform:scale(.86);opacity:0}16%{opacity:.46}100%{transform:scale(var(--pulse-to,1.85));opacity:0}}
.sb-social .sb-boom-pulse{animation-name:sb-boom-pulse;animation-timing-function:var(--ease-out);animation-delay:70ms;animation-fill-mode:both;}
@keyframes sb-mark-in{0%{transform:scale(0);opacity:0}70%{transform:scale(1.16)}100%{transform:scale(1);opacity:1}}
.sb-social .sb-mark-in{animation:sb-mark-in 260ms 140ms var(--ease-out) both;}
/* the fuse: emotional charge, never an explosion metaphor (§34) */
@keyframes sb-fuse-lift{0%{transform:scale(.4) translateY(3px);opacity:0}55%{transform:scale(1.25) translateY(-2px);opacity:.95}100%{transform:scale(.9) translateY(-1px);opacity:.5}}
@keyframes sb-fuse-flare{0%{transform:scale(.5);opacity:0}40%{transform:scale(1.7);opacity:1}100%{transform:scale(1);opacity:.45}}
@keyframes sb-fuse-burst{0%{transform:scale(.4);opacity:0}35%{transform:scale(2);opacity:1}100%{transform:scale(1.1);opacity:.4}}
@keyframes sb-fuse-warm{0%{opacity:0}60%{opacity:.75}100%{opacity:.45}}
@keyframes sb-fuse-steady{0%{opacity:0}100%{opacity:.5}}
@keyframes sb-fuse-wobble{0%{transform:scale(.5) translateX(0);opacity:0}30%{transform:scale(1.2) translateX(-2px);opacity:.95}55%{transform:scale(1.05) translateX(2px);opacity:.8}80%{transform:scale(.95) translateX(-1px);opacity:.6}100%{transform:scale(.95);opacity:.5}}
.sb-social .sb-fuse{animation-duration:360ms;animation-timing-function:var(--ease-out);animation-fill-mode:both;}
.sb-social .sb-fuse-lift{animation-name:sb-fuse-lift;}
.sb-social .sb-fuse-flare{animation-name:sb-fuse-flare;}
.sb-social .sb-fuse-burst{animation-name:sb-fuse-burst;}
.sb-social .sb-fuse-warm{animation-name:sb-fuse-warm;}
.sb-social .sb-fuse-steady{animation-name:sb-fuse-steady;}
.sb-social .sb-fuse-wobble{animation-name:sb-fuse-wobble;}
@keyframes sb-spark{0%{transform:translate(-50%,-50%);opacity:.9}100%{transform:translate(calc(-50% + var(--sx)),calc(-50% + var(--sy))) scale(.4);opacity:0}}
.sb-social .sb-spark{animation:sb-spark 380ms var(--ease-out) both;}

/* R3.1 §19–§23 — THE QUICK DECK. Not a toolbar of flat icons: a dimensional deck of SEATS,
   each a shallow machined well the character sits in. Depth comes from real material
   (recess + rim light), never from glow. The rise on focus/hover is a transition, so the
   global reduced-motion rule ends it instantly while the state stays fully legible. */
.sb-social .sb-deck{background:linear-gradient(180deg,color-mix(in srgb,var(--sheet-raised) 96%,#fff 4%) 0%,var(--sheet-raised) 58%,color-mix(in srgb,var(--sheet-raised) 92%,#000 8%) 100%);}
.sb-social .sb-seat{background:linear-gradient(180deg,color-mix(in srgb,var(--sheet-raised) 78%,#000 22%) 0%,color-mix(in srgb,var(--sheet-raised) 92%,#000 8%) 62%,color-mix(in srgb,var(--sheet-raised) 84%,#fff 16%) 100%);box-shadow:inset 0 3px 5px -2px rgba(0,0,0,.55),inset 0 1px 0 rgba(0,0,0,.30),inset 0 -1px 0 color-mix(in srgb,var(--sheet-raised) 40%,#fff 60%);transition:background 140ms var(--ease-out),box-shadow 180ms var(--ease-out);}
.sb-social .sb-seat-art{position:relative;transition:transform 180ms var(--ease-out);will-change:transform;}
/* R3.2 self-critique (3D depth) — a real contact shadow on the seat floor, so the character
   RESTS in its well instead of floating over it. Material, not glow: it darkens, never lights. */
.sb-social .sb-seat-art::after{content:"";position:absolute;left:50%;bottom:-2px;width:64%;height:9%;transform:translateX(-50%);border-radius:50%;background:radial-gradient(closest-side,rgba(0,0,0,.38),transparent);pointer-events:none;transition:opacity 180ms var(--ease-out),transform 180ms var(--ease-out);}
.sb-social .sb-seat:hover .sb-seat-art::after,.sb-social .sb-seat:focus-visible .sb-seat-art::after,.sb-social .sb-seat[data-sb-previewing] .sb-seat-art::after{opacity:.55;transform:translateX(-50%) scale(.86);}
.sb-social .sb-seat:hover,.sb-social .sb-seat:focus-visible{background:color-mix(in srgb,var(--sheet-raised) 86%,#fff 14%);box-shadow:inset 0 2px 4px -1px rgba(0,0,0,.34),inset 0 -1px 0 color-mix(in srgb,var(--sheet-raised) 45%,#fff 55%),0 8px 18px -12px rgba(0,0,0,.62);}
.sb-social .sb-seat:hover .sb-seat-art,.sb-social .sb-seat:focus-visible .sb-seat-art{transform:translateY(-5px) scale(1.10);}
.sb-social .sb-seat:active .sb-seat-art{transform:translateY(0) scale(1.02);}
/* R3.2 §25 — a finger sliding across the deck PREVIEWS: the seat lights and the character
   lifts a little. It never plays the expression; only an intentional release commits. */
.sb-social .sb-seat[data-sb-previewing]{background:color-mix(in srgb,var(--sheet-raised) 86%,#fff 14%);box-shadow:inset 0 2px 4px -1px rgba(0,0,0,.34),inset 0 -1px 0 color-mix(in srgb,var(--sheet-raised) 45%,#fff 55%),0 8px 18px -12px rgba(0,0,0,.62);}
.sb-social .sb-seat[data-sb-previewing] .sb-seat-art{transform:translateY(-5px) scale(1.10);}
/* the OWNED seat (§24): the character has settled into its well — deeper recess, a floor
   tinted by its own accent, and one small Boom notch on the rim. Never a red circle. */
.sb-social .sb-seat-own{background:radial-gradient(120% 90% at 50% 108%,var(--seat-accent) 0%,transparent 62%),color-mix(in srgb,var(--sheet-raised) 84%,#000 16%);box-shadow:inset 0 3px 5px -1px rgba(0,0,0,.40),inset 0 -1px 0 color-mix(in srgb,var(--sheet-raised) 45%,#fff 55%);}
.sb-social .sb-seat-own .sb-seat-art{transform:translateY(-2px) scale(1.04);}

/* R3.1 §25–§26 — THE EXPRESSION LIBRARY. A considered room, not a settings grid: a domed
   ground, generous cells, and the emotional groups separated by air rather than by tabs. */
.sb-social .sb-lib{background:radial-gradient(130% 92% at 50% 0%,color-mix(in srgb,var(--sheet-raised) 90%,#fff 10%) 0%,var(--sheet-raised) 62%,color-mix(in srgb,var(--sheet-raised) 94%,#000 6%) 100%);}
.sb-social .sb-lib-cell{transition:background 140ms var(--ease-out),box-shadow 180ms var(--ease-out);}
.sb-social .sb-lib-cell .sb-seat-art{transition:transform 180ms var(--ease-out);}
.sb-social .sb-lib-cell:hover,.sb-social .sb-lib-cell:focus-visible{background:color-mix(in srgb,var(--sheet-raised) 86%,#fff 14%);box-shadow:0 10px 22px -16px rgba(0,0,0,.7);}
.sb-social .sb-lib-cell:hover .sb-seat-art,.sb-social .sb-lib-cell:focus-visible .sb-seat-art{transform:translateY(-4px) scale(1.08);}
.sb-social .sb-lib-cell-own{background:radial-gradient(120% 80% at 50% 106%,var(--seat-accent) 0%,transparent 60%),color-mix(in srgb,var(--sheet-raised) 88%,#000 12%);box-shadow:inset 0 2px 4px -1px rgba(0,0,0,.34);}
`;

export function SocialPreview({ product = false }: { product?: boolean }) {
  return (
    <SocialStore>
      <WorldProvider>
        <Inner product={product} />
      </WorldProvider>
    </SocialStore>
  );
}

function Inner({ product = false }: { product?: boolean }) {
  const { state, dispatch, me, profile, isOwnerView, feed, total, personOf } = useSocial();
  const world = useWorldMaybe();
  const { t, tp } = useT();
  const [frame, setFrame] = useState<Frame>("desktop");
  // S5/S6 — the utilities' transient surfaces: exactly one open at a time (Search included), all
  // hung from the bar, all over the same quiet scrim, all closed by Escape / the scrim / their own
  // control. Panel exclusivity is this one place.
  const [bell, setBell] = useState(false);
  const [messages, setMessages] = useState(false);
  const [people, setPeople] = useState(false);
  const [search, setSearch] = useState(false);
  const closeSurfaces = useCallback(() => { setBell(false); setMessages(false); setPeople(false); setSearch(false); }, []);
  const anySurface = bell || messages || people || search;
  // The Cosmos → My World arrival: one controlled resolve, once, then never again.
  const [arrived] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const v = sessionStorage.getItem("sb-arrive") === "1";
      sessionStorage.removeItem("sb-arrive");
      return v;
    } catch {
      return false;
    }
  });
  const [composer, setComposer] = useState<Draft | null>(null);
  const [harness, setHarness] = useState(!product);
  // "View as public" (Social Freeze Delta) — the owner previewing their own profile exactly as
  // a stranger would see it. Only ever meaningful while genuinely looking at your own profile.
  const [previewPublic, setPreviewPublic] = useState(false);
  const selfPreview = previewPublic && isOwnerView;
  // My World 2030 Visual Leap — harness-only: demonstrates the cover's theme-material fallback
  // without touching fixture data (every seeded person already has a real, credited cover).
  const [noCover, setNoCover] = useState(false);
  // S2 Person World — harness-only review overrides (never on the product route) so the Person
  // World can be exercised against name/photo/wall/relationship variants the fixtures don't hold:
  //   ?profileName=  a long / CJK / Devanagari name (§25)
  //   ?photo=bad|none|broken  ordinary portrait / initials fallback / broken image (§18,§19,§55)
  //   ?wall=bad|broken        an ordinary Wall / a broken Wall image (§18,§55)
  //   ?rel=none|request-out|request-in|friend|family  a visitor relationship state (§32,§67)
  const [profileName, setProfileName] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<"bad" | "none" | "broken" | null>(null);
  const [wallMode, setWallMode] = useState<"bad" | "broken" | null>(null);
  const [relOverride, setRelOverride] = useState<import("@/components/world/model").Relationship | null>(null);

  // R3.2 §54 — warm the Quick Six deck art once, on idle, after Social has settled.
  useEffect(() => { prefetchQuickArt(); }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    // The review harness belongs to the development alias only; the product
    // route is the page itself.
    if (product) return;
    const w = q.get("w");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot read of review params
    if (w === "360" || w === "768" || w === "desktop") setFrame(w);
    if (q.get("bell") === "1") setBell(true);
    const v = q.get("viewer");
    if (v === "maya" || v === "asha" || v === "visitor" || v === "ashaVisitor" || v === "prakashVisitor") dispatch({ type: "viewer", viewer: v });
    const nf = q.get("notifications");
    if (nf === "many" || nf === "empty") dispatch({ type: "notifications", mode: nf });
    if (q.get("fail") === "1") dispatch({ type: "simulateFailure", on: true });
    if (q.get("composer") === "1") setComposer(emptyDraft(localISO(now()).slice(0, 10), ""));
    if (q.get("harness") === "0") setHarness(false);
    if (q.get("nocover") === "1") setNoCover(true);
    const pn = q.get("profileName"); if (pn) setProfileName(pn);
    const ph = q.get("photo"); if (ph === "bad" || ph === "none" || ph === "broken") setPhotoMode(ph);
    const wl = q.get("wall"); if (wl === "bad" || wl === "broken") setWallMode(wl);
    const rl = q.get("rel"); if (rl === "none" || rl === "request-out" || rl === "request-in" || rl === "friend" || rl === "family") setRelOverride(rl);
  }, [dispatch, product]);

  const openComposer = useCallback(() => setComposer(state.draft ?? emptyDraft(localISO(now()).slice(0, 10), me.home)), [state.draft, me.home]);
  const editMoment = useCallback((m: Moment) => setComposer(draftFromMoment(m)), []);
  const closeComposer = useCallback(() => setComposer(null), []);

  const posNow = momentLifeFor(me, me, now());
  // Person + Life Identity pass (§8–§9): a visiting friend/family sees documented-memory
  // density from Moments visible to them; a stranger's ring stays band-geometry only. Routed
  // through the SAME WorldProvider relationship PersonCard uses (self-critique correction: two
  // separate "is this person connected" computations — one here, one in PersonCard — could have
  // drifted out of sync; there is now exactly one).
  const heroConnected = !isOwnerView && !!world?.canMessage(me.id);
  // Social 2030 Final Delta §1: ProfileHero's identity model gained RELATIONSHIP — the acting
  // viewer's relationship to the subject, shown only for the stable, symmetric states.
  const heroRelationship = !isOwnerView ? world?.relationshipOf(me.id) : undefined;
  // Same stand-in for both ProfileHero and the Circle sidebar module — one preview, one model,
  // reused by an unrelated frozen component (CircleModule.tsx) with zero changes to it: passing
  // a non-self viewer already makes it render its existing "visitor" branch.
  const heroViewer = selfPreview ? PUBLIC_VIEWER : me;
  // Must use heroViewer, not me: this feeds the sidebar's owner-only day-count counter, which
  // would otherwise leak the owner's exact life position while "viewing as public" (blocker #1).
  const profileLife = lifeViewFor(heroViewer, profile, now());
  // Final Social Connection pass §17–18: the global brand and the Hero must never disagree about
  // whose World this is. Owner: the destination's own "My World" (unchanged). Visitor: the actual
  // person's World, stated once, at the one place a person always looks first.
  const worldLabel = isOwnerView ? undefined : t("world.context.person", { name: profile.name.split(" ")[0] });
  // §19: a low-noise way back to the viewer's own World while visiting someone else's — present
  // only then, offered from the account control rather than a second navigation row.
  const onReturnHome = isOwnerView ? undefined : () => dispatch({ type: "viewer", viewer: "maya" });

  // S2 harness overrides — a cloned subject (id preserved, so owner/visitor scope is unchanged)
  // and a forced relationship, used ONLY by the review harness to exercise name/photo/wall/
  // relationship variants the fixtures don't contain. On the product route these are all null.
  const heroSubject = profileName || photoMode || wallMode
    ? {
        ...profile,
        ...(profileName ? { name: profileName } : {}),
        ...(photoMode === "bad" ? { avatar: "/mock/social/document.jpg" } : photoMode === "none" ? { avatar: undefined } : photoMode === "broken" ? { avatar: "/mock/social/__missing_portrait__.jpg" } : {}),
        ...(wallMode === "bad" ? { cover: "/mock/social/meal-thali.jpg" } : wallMode === "broken" ? { cover: "/mock/social/__missing_cover__.jpg" } : {}),
      }
    : profile;
  const heroRel = relOverride ?? heroRelationship;
  const heroConnectedEff = relOverride ? relOverride === "friend" || relOverride === "family" : heroConnected;

  // S6 §65 — My view → Public view is SAME WORLD, DIFFERENT VIEWER: the Person World re-settles
  // in place (one 200ms opacity pass, Web Animations — CSS-grade, no engine), nothing moves and
  // the page does not travel. Reduced motion: the state simply changes. The frozen Hero is not
  // touched; this wraps it.
  const heroWrap = useRef<HTMLDivElement>(null);
  const firstPerspective = useRef(true);
  useEffect(() => {
    if (firstPerspective.current) { firstPerspective.current = false; return; }
    const el = heroWrap.current;
    if (!el) return;
    // The Hero re-renders for the other viewer and would replay its own entry resolve; for the
    // duration of the flip that replay is collapsed (scoped CSS above) so the perspective settle
    // is the one motion. Attribute, not state: nothing re-renders for it.
    el.setAttribute("data-sb-perspective-switching", "");
    const t = window.setTimeout(() => el.removeAttribute("data-sb-perspective-switching"), 700);
    if (typeof el.animate === "function" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.animate([{ opacity: 0.55 }, { opacity: 1 }], { duration: 200, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    }
    return () => window.clearTimeout(t);
  }, [selfPreview]);

  const ringDensityProbe = useCallback(
    (subjectId: string, connected: boolean) => {
      const subject = personOf(subjectId);
      return ringViewFor(me, subject, now(), state.moments, connected).momentsByBand ?? [];
    },
    [me, personOf, state.moments],
  );
  /** Ground truth for a test to compare against: this subject's OWN full density (every one of their Moments, any privacy), independent of whoever `me` currently is. */
  const ringDensitySelfProbe = useCallback(
    (subjectId: string) => {
      const subject = personOf(subjectId);
      return ringViewFor(subject, subject, now(), state.moments).momentsByBand ?? [];
    },
    [personOf, state.moments],
  );

  // Dev hook: the keys a non-owner LifeView actually carries (the suite asserts nothing birth-derived is among them).
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      (window as unknown as { __SB_VM_OTHER_KEYS?: string[] }).__SB_VM_OTHER_KEYS = Object.keys(lifeViewFor(PEOPLE.bikash, PEOPLE.maya, now()));
      // Person + Life Identity pass: lets the suite probe ringViewFor's viewer-safe density
      // directly — which Moments actually feed a visitor's ring — without depending on SVG
      // paint values. Dev-only; never shipped.
      (window as unknown as { __SB_RING_DENSITY?: typeof ringDensityProbe }).__SB_RING_DENSITY = ringDensityProbe;
      (window as unknown as { __SB_RING_DENSITY_SELF?: typeof ringDensitySelfProbe }).__SB_RING_DENSITY_SELF = ringDensitySelfProbe;
    }
  });
  const endReached = feed.length >= total;

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-dvh bg-bg text-text">
        {/* ---- harness (not the design) ---- */}
        <div className={`sticky top-0 z-50 border-b border-divider bg-bg/95 px-4 py-2 text-[12px] backdrop-blur-sm ${harness ? "" : "hidden"}`}>
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2">
            <Link href="/style-lab" className="flex items-center gap-2 text-muted hover:text-text"><SystemboomLogo height={14} /> <span>Style lab · Social final</span></Link>
            <Seg label="Width" value={frame} onChange={(v) => setFrame(v as Frame)} options={["360", "768", "desktop"]} />
            <Seg label="Viewer" value={state.viewer} onChange={(v) => dispatch({ type: "viewer", viewer: v as ViewerMode })} options={["maya", "asha", "visitor", "ashaVisitor", "prakashVisitor"]} labels={{ maya: "Maya (owner)", asha: "Asha (no birth time)", visitor: "Bikash → Maya", ashaVisitor: "Asha → Maya", prakashVisitor: "Prakash → Maya" }} />
            <Seg label="Bell" value={state.notifications.length === 0 ? "empty" : state.notifications.length > 10 ? "many" : "seed"} onChange={(v) => dispatch({ type: "notifications", mode: v as "seed" | "many" | "empty" })} options={["seed", "many", "empty"]} />
            <label className="flex items-center gap-1.5 text-muted"><input type="checkbox" checked={state.simulateFailure} onChange={(e) => dispatch({ type: "simulateFailure", on: e.target.checked })} /> simulate failure</label>
            <label className="flex items-center gap-1.5 text-muted"><input type="checkbox" checked={noCover} onChange={(e) => setNoCover(e.target.checked)} /> no cover</label>
            <span className="ml-auto flex items-center gap-2">
              <button type="button" onClick={() => dispatch({ type: "reset" })} className="rounded-full border border-edge px-2.5 py-1 text-muted hover:text-text">Reset</button>
              <ThemeToggle />
            </span>
          </div>
        </div>

        {/* ---- the design ---- */}
        <div className="flex justify-center py-6">
          {/* Self-critique correction (Final Delta §3): this frame carried an unconditional
              `overflow-hidden`, there only to clip Moment.tsx's mobile media bleed
              (`-mx-[var(--bleed)]`, already 0 past @2xl — see `--bleed:0px` below) to an edge.
              Left on an ancestor of EVERYTHING, it silently defeated `position: sticky` for every
              descendant at every width, including the already-accepted TopBar — real,
              pre-existing, undetected because no prior suite scrolled and re-measured a sticky
              element's own position, only its `position` CSS value. The clip now lives exactly
              where the bleed does — around the sheet's own padded content, below — so it never
              touches the Life Cursor (a preceding sibling, outside that div) or TopBar (outside
              the sheet entirely) at any width. Not a Chrome.tsx change, no frozen prop, class, or
              test contract touched. */}
          <div data-sb-social-frame={frame} className="sb-social @container relative min-h-[900px] text-text" style={{ width: FRAME_PX[frame], maxWidth: "100%", boxShadow: frame === "desktop" ? undefined : "0 0 0 1px var(--edge)", ["--frame-w" as string]: frame === "desktop" ? "100vw" : FRAME_PX[frame] }}>
            <style>{SCOPED_CSS}</style>
            <div data-sb-social-inner className="@2xl:[--gutter:40px] @2xl:[--rule-x:19px] @2xl:[--bleed:0px]">
              {/* The quiet ground under any open surface — below the bar, above My World. */}
              {anySurface && <Scrim onClose={closeSurfaces} />}
              <TopBar
                onBell={() => { const v = !bell; closeSurfaces(); setBell(v); }}
                bellOpen={bell}
                messages={messages}
                onMessages={() => { const v = !messages; closeSurfaces(); setMessages(v); }}
                people={people}
                onPeople={() => { const v = !people; closeSurfaces(); setPeople(v); }}
                search={search}
                onSearch={(open) => { if (open) closeSurfaces(); setSearch(open); }}
                surface={
                  bell ? (
                    <TransientSurface id="notifications" label={t("notif.title")} onClose={() => setBell(false)} returnTo="[data-sb-bell]">
                      <NotificationsPanel onClose={() => setBell(false)} />
                    </TransientSurface>
                  ) : messages ? (
                    <TransientSurface id="messages" label={t("chat.title")} onClose={() => setMessages(false)} returnTo="[data-sb-messages]">
                      <MessagesPanel onClose={() => setMessages(false)} />
                    </TransientSurface>
                  ) : people ? (
                    <TransientSurface id="people" label={t("people.title")} onClose={() => setPeople(false)} returnTo="[data-sb-people]">
                      <PeoplePanel onClose={() => setPeople(false)} />
                    </TransientSurface>
                  ) : null
                }
                worldLabel={worldLabel}
                onReturnHome={onReturnHome}
              />

              <PersonCard />
              <MiniChat />
              <main className={`mx-auto max-w-[1120px] px-3 pt-4 pb-24 @2xl:px-6 @5xl:pt-6 ${arrived ? "sb-arrive" : ""}`}>
                <div ref={heroWrap} data-sb-perspective={selfPreview ? "public" : "own"}>
                <ProfileHero
                  viewer={heroViewer}
                  subject={heroSubject}
                  connected={heroConnectedEff}
                  moments={state.moments}
                  relationship={heroRel}
                  canPreviewPublic={isOwnerView && !previewPublic}
                  selfPreview={selfPreview}
                  onEnterPreview={() => setPreviewPublic(true)}
                  onExitPreview={() => setPreviewPublic(false)}
                  forceNoCover={noCover}
                />
                </div>

                <div className="mt-4 grid gap-4 @5xl:grid-cols-[minmax(0,1fr)_300px] @5xl:items-start @5xl:gap-6">
                  {/* sidebar (order first on phone/tablet, right on desktop) */}
                  <aside className="grid gap-4 @max-5xl:order-2 @5xl:sticky @5xl:top-20 @5xl:order-2" aria-label="Life instruments">
                    {/* C5.3: below desktop the hero carries the counter; the module exists only where there is a sidebar. */}
                    <section aria-labelledby="sb-counter-title" className="rounded-[24px] border border-[var(--card-edge)] bg-[var(--card)] px-4 py-5 shadow-[var(--card-shadow)] @max-5xl:hidden">
                      <h2 id="sb-counter-title" className="text-center text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{t("life.myLifeIn")}</h2>
                      {profileLife.scope === "owner" ? (
                        <LifeCounter life={profileLife} scale="module" showNextRound className="mt-3" />
                      ) : (
                        <p className="mt-3 text-center text-[13px] text-muted">{t("life.counterTheirs")}<br /><span className="text-text">{t("life.bandCapLabel", { band: profileLife.band })}</span></p>
                      )}
                    </section>
                    <section className="rounded-[24px] border border-[var(--card-edge)] bg-[var(--card)] px-4 py-5 shadow-[var(--card-shadow)]">
                      <CircleModule viewer={heroViewer} subject={profile} moments={state.moments} />
                    </section>
                  </aside>

                  {/* the sheet
                      Self-critique correction (Final Delta): `overflow-hidden` here — added to
                      clip the Life Cursor's edge-to-edge bleed to the sheet's rounded corners —
                      silently broke `position: sticky` on the cursor itself (any ancestor with a
                      non-visible overflow becomes the sticky containing block; here that ancestor
                      never independently scrolls, so the cursor just scrolled away with the page).
                      The cursor's own background matches the sheet's exactly, so nothing needs
                      clipping — it never carries content past the section's rounded edge. */}
                  <section aria-label="Moments" className="min-w-0 rounded-[var(--sheet-radius)] bg-[var(--sheet)] shadow-[var(--sheet-shadow)] @max-5xl:order-1 @5xl:order-1" data-sb-sheet>
                    <LifeCursor viewer={me} feed={feed} personOf={personOf} />
                    {/* overflow-hidden here (not on an ancestor of the cursor above) clips exactly
                        the mobile media bleed this div contains, at exactly the width it's live —
                        see the frame-level comment above for why this scope matters. */}
                    <div className="overflow-hidden px-4 pt-5 pb-6 @2xl:px-6">
                      <div className="relative">
                        {/* the vertical time rule — one line, the sheet's spine */}
                        <span aria-hidden className="absolute top-0 bottom-0 w-px bg-[var(--rule)]" style={{ left: "var(--rule-x)" }} />
                        {/* composer entry bar — hidden while previewing as public: no Composer for a stranger */}
                        {isOwnerView && !previewPublic && (
                          <div className="relative pl-[var(--gutter)]">
                            <span className="absolute top-[18px] -translate-x-1/2 -translate-y-1/2" style={{ left: "var(--rule-x)" }}>
                              <span className="block rounded-full bg-[var(--sheet-bg)] p-[2px]"><PersonIdentity viewer={me} subject={me} size={24} label={posNow.exact ?? ""} /></span>
                            </span>
                            <button type="button" onClick={openComposer} data-sb-open-composer className="sb-transition flex min-h-9 w-full items-center gap-3 pl-2 text-left text-[15px] text-muted hover:text-text focus-visible:outline-[var(--focus)]">
                              <span className="flex-1 truncate">{state.draft ? t("moments.draftKept") : t("moments.whatHappenedAt", { age: posNow.exact ?? "" })}</span>
                            </button>
                          </div>
                        )}

                        <div className={`${isOwnerView && !previewPublic ? "mt-8" : ""} flex flex-col gap-8`}>
                          {feed.map((m, i) => {
                            const prev = feed[i - 1];
                            const showDate = !prev || dateKey(m.at) !== dateKey(prev.at);
                            return (
                              <div key={m.id} className={i > 0 ? "border-t border-[var(--hair)] pt-6" : ""}>
                                <MomentEntry moment={m} showDate={showDate} onEdit={editMoment} />
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-8 border-t border-[var(--hair)] pt-5 pl-[var(--gutter)] text-[13px]">
                          {!endReached ? (
                            // Social 2030 §1/§9: "Load more" is the generic wording of an
                            // algorithmic feed; this is a chronological record, so the time leads.
                            <button type="button" onClick={() => dispatch({ type: "loadMore" })} data-sb-load-more className="sb-transition inline-flex min-h-9 items-center rounded-full border border-[var(--hair)] px-3 font-medium text-text hover:border-steel/60 focus-visible:outline-[var(--focus)]">
                              {tp("moments.earlierN", total - feed.length)} · {t("moments.loadMore")}
                            </button>
                          ) : (
                            <p className="text-muted" data-sb-end>{t("moments.endOfFeed")}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </main>

              {composer && <Composer open initial={composer} onClose={closeComposer} />}
              <span className="sr-only">{personOf(me.id).name}</span>
            </div>
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

function Seg({ label, value, onChange, options, labels }: { label: string; value: string; onChange: (v: string) => void; options: string[]; labels?: Record<string, string> }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="text-muted">{label}</span>
      <span role="radiogroup" aria-label={label} className="flex overflow-hidden rounded-full border border-edge">
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={value === o} onClick={() => onChange(o)} className={`px-2.5 py-1 ${value === o ? "bg-content-raised text-text" : "text-muted hover:text-text"}`}>
            {labels?.[o] ?? o}
          </button>
        ))}
      </span>
    </span>
  );
}
