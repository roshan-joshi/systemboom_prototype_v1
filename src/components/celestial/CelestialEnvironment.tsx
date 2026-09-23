"use client";

import { useCelestialSurface } from "@/lib/celestial/flags";

/** THE EXISTING WORLD, INSIDE THE COSMOS.
 *
 * Celestial Social Universe pass — the page-wide environment. Two planes:
 *
 *   FAR FIELD  — the sky itself (environment-cosmos/solar[-portrait].svg), on a STICKY,
 *                viewport-sized layer, so the world SURVIVES SCROLL: the cosmos is still there
 *                at the fiftieth Moment, not only at the hero. Deliberately NOT
 *                `background-attachment: fixed` — iOS Safari ignores it (falling back to a
 *                `cover` crop of the whole multi-thousand-pixel page, i.e. a hugely upscaled
 *                sky), and elsewhere it repaints the background on every scroll frame (measured:
 *                401 paints across 200 scroll frames). A sticky layer is moved by the compositor —
 *                the same mechanism the accepted TopBar already uses inside this frame — and it
 *                is clipped to the frame, so harness frames crop correctly. Sized with `lvh`, so a
 *                collapsing mobile URL bar never resizes (and never re-rasterizes) the sky.
 *   MID FIELD  — entry atmosphere near the top of the page (scrolls with the content), so
 *                arrival reads as descending into the world.
 *
 * Portrait frames (≤700px, by CONTAINER query — the frame, not the window) get dedicated
 * portrait compositions rather than a narrow crop of the landscape sky.
 *
 * UI surfaces join the world through the existing card tokens (--card/--card-edge/--card-
 * shadow are retuned INSIDE this gate only), the sheet keeps its glass, the top bar and the
 * Life instrument cards receive material — never new semantics, never new geometry. No shared
 * token or mascot selector changes outside this :has() gate; removing the feature removes
 * this entire stylesheet, including the closed-page treatment. Life panels keep their TIME
 * meaning untouched (§37): material only.
 *
 * Also carried here: the RESONANCE CONSTELLATION's presentation (strip, stage, quiet arrival
 * and count-crossfade motion) so the whole celestial presentation lives — and dies — as one
 * stylesheet behind one flag.
 */
export function CelestialEnvironment() {
  const enabled = useCelestialSurface("moment");
  if (!enabled) return null;
  return <>
    <span hidden data-sb-celestial-environment><style>{`
/* ───────────────────────── DEEP COSMOS — the dark world ───────────────────────── */
.sb-social:has([data-sb-celestial-environment]) {
  --sb-cel-you:#E8C27E;
  --card:#0e1626f2; --card-edge:#b9c9ef21; --card-shadow:0 24px 60px -34px rgba(2,6,18,.9);
  /* A solid ground stays under everything: contrast resolution, and a graceful fallback if
     the sky never loads (the accepted --bg-atmosphere radial beneath it remains, unchanged). */
  background-color:#0A0D14;
  /* One stacking context, so the sky's z-index:-1 sits above this ground and below content. */
  isolation:isolate;
}
/* The far field. The wrapper spans the frame and scrolls with it; the sky inside is sticky
   at the viewport top for the frame's whole height. Nothing here takes layout space. */
[data-sb-celestial-sky]{position:absolute;inset:0;z-index:-1;pointer-events:none;}
.sb-cel-sky{position:sticky;top:0;display:block;width:100%;height:100vh;height:100lvh;overflow:hidden;}
/* Layers, top to bottom: the crescent and the galaxy — each centred in its real gutter beside
   the 1072px content column, from the viewport EDGE (a cover crop moves with the window's
   aspect ratio, so bodies baked into the sky land in different places at every desktop size)
   — then the ambient sky as a cover layer. The first declaration is the fallback for a
   browser without container units: the sky alone, never nothing. */
.sb-cel-sky::before{
  content:"";position:absolute;inset:-28px 0;
  background:url('/celestial/environment-cosmos.svg') center top / cover no-repeat;
  background:
    url('/celestial/environment-cosmos-crescent.svg') left max(6px, calc((100cqw - 1072px) / 4 - 60px)) top 196px / 120px 120px no-repeat,
    url('/celestial/environment-cosmos-galaxy.svg') right max(0px, calc((100cqw - 1072px) / 4 - clamp(64px, calc((100cqw - 1112px) / 4), 136px))) top 168px / clamp(128px, calc((100cqw - 1112px) / 2), 272px) auto no-repeat,
    url('/celestial/environment-cosmos.svg') center top / cover no-repeat;
  transform:translate3d(0,0,0);will-change:transform;
  transition:transform 680ms cubic-bezier(.22,1,.36,1);
}
/* The mid field: entry atmosphere at the top of the page, above the sky, scrolling away. */
[data-sb-celestial-sky]::after{
  content:"";position:absolute;inset:0 0 auto;height:1100px;pointer-events:none;
  background:
    radial-gradient(ellipse 120% 620px at 50% -120px,#1b2544b3,transparent 74%),
    radial-gradient(ellipse 90% 900px at 0% 280px,#23335e44,transparent 78%);
}
@container (max-width:700px){
  .sb-cel-sky::before{background:url('/celestial/environment-cosmos-portrait.svg') center top / cover no-repeat;}
}
/* Interaction-driven depth: attending / opening the Resonate doorway settles the whole sky a
   breath — the world answers, quietly. A transform on a composited layer: no repaint. */
.sb-social:has([data-sb-resonate-attending="1"]) .sb-cel-sky::before{transform:translate3d(0,-8px,0) scale(1.012);}
.sb-social:has([data-sb-resonate-open="1"]) .sb-cel-sky::before{transform:translate3d(0,-20px,0) scale(1.03);}
/* The dark sheet answers the key light (upper left) like a physical surface: a cool lift on
   its lit corner, a starlit top edge — never a glow. */
.sb-social:has([data-sb-celestial-environment]) [data-sb-sheet] {
  background:radial-gradient(110% 38% at 0% 0%,#1d2c4f52,transparent 62%),linear-gradient(135deg,#101929de,#0a111ee8 58%,#15182cde);
  box-shadow:0 1px 0 #b4c7ee1c inset,0 0 0 1px #b9c9ef12,0 24px 70px #03071422;
}
/* The top bar belongs to the cosmos: deeper glass, a faint starlit rim. Usability untouched. */
.sb-social:has([data-sb-celestial-environment]) [data-sb-topbar] .material-floating{
  /* More opaque than the accepted .66 glass, never less: content scrolling beneath the bar
     must not read through it. */
  background:rgba(9,13,22,.76);
  border-color:#b9c9ef26;
  box-shadow:0 1px 0 #cddcff14 inset,0 18px 44px -24px #02040ac0;
}
/* The Life instruments (time, not feeling — §37) take the celestial material through the
   card tokens above. No backdrop-filter: over a moving sky it would re-blur every scroll
   frame, and behind a 95%-opaque card it would buy nothing visible. */
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment] { isolation:isolate; }
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {
  content:"";position:absolute;inset:-12px -18px;z-index:-1;pointer-events:none;
  background:radial-gradient(ellipse at 8% 83%,#8c4ea65c,transparent 66%),radial-gradient(ellipse at 94% 64%,#367da54d,transparent 70%),radial-gradient(ellipse at 50% 100%,#294a7966,transparent 80%);
  mask-image:linear-gradient(transparent,#000 10%,#000 86%,transparent);
  box-shadow:none;
  opacity:0;transition:opacity 420ms ease-out;
}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]:has([data-sb-resonate-open="1"])::before {opacity:1;}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]:has([data-sb-resonate-attending="1"])::before {opacity:.42;}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]:has([data-sb-resonate-pressing="1"])::before {opacity:.7;}
.sb-celestial-field{--sb-depth-x:0px;--sb-depth-y:0px;}
.sb-celestial-field [data-sb-depth-sky]{transform:translate3d(calc(var(--sb-depth-x) * .7),calc(var(--sb-depth-y) * .7),0);transition:transform 300ms cubic-bezier(.22,1,.36,1);}

/* ─────────────────────── SOLAR OBSERVATORY — the light world ─────────────────────── */
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) {
  --sb-cel-you:#8A6420;
  --card:#fdfcf8f2; --card-edge:rgba(171,140,80,.16); --card-shadow:0 10px 32px -20px rgba(96,74,34,.28);
  background-color:#F5F5F6;
}
/* The observatory's walls: one window frame hugging each viewport edge, at room height, over
   the daylight room (sky, sun, mountains, marble floor) as a cover layer. */
html[data-theme="light"] .sb-cel-sky::before{
  background:url('/celestial/environment-solar.svg') center top / cover no-repeat;
  background:
    url('/celestial/environment-solar-frame-left.svg') left top / auto 100% no-repeat,
    url('/celestial/environment-solar-frame-right.svg') right top / auto 100% no-repeat,
    url('/celestial/environment-solar.svg') center top / cover no-repeat;
}
html[data-theme="light"] [data-sb-celestial-sky]::after{
  background:
    radial-gradient(ellipse 110% 520px at 24% -80px,#ffffffb8,transparent 70%),
    linear-gradient(180deg,#e9f2f855,transparent 520px);
}
@container (max-width:700px){
  html[data-theme="light"] .sb-cel-sky::before{background:url('/celestial/environment-solar-portrait.svg') center top / cover no-repeat;}
}
/* Pearl, not paper: the sheet is the same warm material as the hero and the Life cards, lit
   from the upper left, with a champagne edge where the room's gold meets it. */
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) [data-sb-sheet] {
  background:radial-gradient(110% 34% at 0% 0%,#fffdf6,transparent 60%),linear-gradient(165deg,#fffefbf2,#fcf9f2ee 55%,#f8f4eaee);
  box-shadow:0 1px 0 #fff inset,0 0 0 1px rgba(176,142,80,.2),0 18px 48px -28px rgba(96,74,34,.34);
}
/* The bar is part of the room: pearl glass that lets the daylight and the gold frames glow
   through it (blurred — the bar's own text stays crisp), a warm champagne hairline beneath. */
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) [data-sb-topbar]{
  background:linear-gradient(180deg,rgba(255,255,255,.74),rgba(252,249,241,.68));
  backdrop-filter:blur(18px) saturate(1.35);
  box-shadow:inset 0 1px 0 #fff,inset 0 -1px 0 rgba(176,142,80,.26),0 12px 28px -22px rgba(60,48,20,.32);
}
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {
  background:radial-gradient(ellipse at 8% 78%,#f2ce8260,transparent 62%),radial-gradient(ellipse at 94% 50%,#9dcbe64d,transparent 68%),linear-gradient(165deg,#ffffff00,#fffffff0 55%,#e4edf299);
  box-shadow:none;
}

/* ──────────────── THE SHARED RESONANCE CONSTELLATION (strip + stage) ──────────────── */
/* Present meanings sit as fixed points on ONE fine shared horizon — a constellation of
   human signals, never a reaction bar. Equal Seals; counts are quiet facts about people. */
.sb-cel-strip{position:relative;display:inline-flex;flex-wrap:wrap;align-items:flex-start;gap:6px 10px;padding:2px 3px 0;}
/* Phones (§49): never cram eight into a clipped row. The constellation takes its own full line
   under the Boom pulse and responses (the frozen presence row, re-flowed only while the flag is
   on); at the narrowest frames the eight become two balanced rows of four, each row carrying
   its own horizon. Desktop is untouched. */
@container (max-width:700px){
  .sb-social:has([data-sb-celestial-environment]) [data-sb-presence]:has([data-sb-resonance-summary]){flex-wrap:wrap;row-gap:8px;}
  .sb-social:has([data-sb-celestial-environment]) [data-sb-presence] > [data-sb-resonance-summary]{order:3;}
  /* Five or more meanings: balanced rows of four in canonical order (never a 7 + 1 orphan). */
  .sb-cel-strip:has(> :nth-child(5)){display:grid;grid-template-columns:repeat(4,max-content);gap:8px 12px;}
  .sb-cel-strip:has(> :nth-child(5))::before{display:none;}
  .sb-cel-strip:has(> :nth-child(5)) > .sb-cel-node::after{content:"";position:absolute;top:12px;left:-7px;right:-7px;height:1px;z-index:-1;pointer-events:none;background:#9fb4d97d;opacity:.5;}
  html[data-theme="light"] .sb-cel-strip:has(> :nth-child(5)) > .sb-cel-node::after{background:#b3985f8a;}
}
.sb-cel-strip::before{
  content:"";position:absolute;left:1px;right:1px;top:12px;height:1px;pointer-events:none;
  background:linear-gradient(90deg,transparent,#9fb4d97d 14%,#9fb4d97d 86%,transparent);
  opacity:.55;
}
html[data-theme="light"] .sb-cel-strip::before{background:linear-gradient(90deg,transparent,#b3985f8a 14%,#b3985f8a 86%,transparent);opacity:.6;}
.sb-cel-node{position:relative;display:inline-flex;flex-direction:column;align-items:center;gap:2px;min-width:24px;}
.sb-cel-count{font-size:10.5px;line-height:1;letter-spacing:.02em;opacity:.85;}
/* The viewer's own signal: a fine personal orbit — position, never importance. */
.sb-cel-your-ring{
  position:absolute;left:50%;top:13px;width:30px;height:30px;transform:translate(-50%,-50%);
  border-radius:50%;pointer-events:none;
  border:1px solid color-mix(in srgb, var(--sb-cel-you, #C9A25E) 85%, transparent);
  box-shadow:0 0 10px -3px color-mix(in srgb, var(--sb-cel-you, #C9A25E) 55%, transparent);
}
.sb-cel-your-ring-stage{left:12px;top:12px;width:32px;height:32px;transform:translate(-50%,-50%);}
/* The expanded stage: a quiet celestial ground, one hairline per meaning, no bars, no ranks. */
.sb-social:has([data-sb-celestial-environment]) [data-sb-resonance-who-panel]{
  background:linear-gradient(160deg,#0d1526f2,#0a101ceb 60%,#121a2eee);
  border-color:#b4c7ee24;
  box-shadow:0 1px 0 #c6d6ff10 inset,0 18px 44px -26px #020510c8;
}
html[data-theme="light"] .sb-social:has([data-sb-celestial-environment]) [data-sb-resonance-who-panel]{
  background:linear-gradient(160deg,#fffffff5,#fdfaf2f0 62%,#f7fbfcf2);
  border-color:rgba(171,140,80,.2);
  box-shadow:0 1px 0 #fff inset,0 14px 36px -26px rgba(96,74,34,.4);
}
.sb-cel-group + .sb-cel-group{border-top:1px solid color-mix(in srgb, currentColor 9%, transparent);}
/* While the constellation is open it grows tall; the frozen presence row centres its items, which
   would float the Boom pulse and the responses count to the panel's middle. Hold them on the
   strip's own line instead. */
.sb-social:has([data-sb-celestial-environment]) [data-sb-presence]:has([data-sb-resonance-who-panel]){align-items:flex-start;}
/* One-shot, localized motion: a NEW meaning settles into its canonical position; a changed
   count crossfades. Never fireworks, never a loop, nothing for merely watching. */
@keyframes sb-cel-node-in{0%{opacity:0;transform:translateY(3px)}100%{opacity:1;transform:none}}
.sb-cel-node-new{animation:sb-cel-node-in 240ms cubic-bezier(.22,1,.36,1) both;}
@keyframes sb-cel-count-in{0%{opacity:0}100%{opacity:.85}}
.sb-cel-count-in{animation:sb-cel-count-in 180ms ease-out both;}
@keyframes sb-cel-stage-in{0%{opacity:0;transform:translateY(4px)}100%{opacity:1;transform:none}}
[data-sb-resonance-who-panel]{animation:sb-cel-stage-in 200ms cubic-bezier(.22,1,.36,1) both;}

@media(prefers-reduced-motion:reduce){
/* No sky travel at all under reduced motion — the world stays exactly where it is (§58). */
.sb-cel-sky::before, .sb-social:has([data-sb-resonate-attending="1"]) .sb-cel-sky::before, .sb-social:has([data-sb-resonate-open="1"]) .sb-cel-sky::before{transform:none;transition:none;}
.sb-social:has([data-sb-celestial-environment]) [data-sb-moment]::before {transition:opacity 150ms linear;}
.sb-celestial-field *, .sb-resonate * {animation:none!important;transition-duration:150ms!important;}
.sb-cel-constellation, .sb-cel-constellation *, [data-sb-resonance-who-panel]{animation:none!important;transition-duration:150ms!important;}
}
`}</style></span>
    <div aria-hidden data-sb-celestial-sky><span className="sb-cel-sky" /></div>
  </>;
}
