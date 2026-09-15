# SYSTEMBOOM — S7 responsive contracts (handover)

Accepted 2026-09-14. This documents how every Social component RECOMPOSES per device
class. The tests (`prototype-tests/s7-device-mastery.js`) and evidence
(`prototype-evidence/s7-device-mastery/`, including `device-matrix.png` and
`layout-metrics.md`) are authoritative if prose and behaviour disagree. S7 changed
**presentation only** — no feature, route, data, relationship, search/notification
semantics, navigation (no bottom nav, no hamburger), and nothing hidden from any device.

## Breakpoint philosophy (§76)

Two CONTAINER breakpoints carry the product, because composition genuinely changes there —
plus a handful of real-constraint media queries. Nothing else.

| boundary | meaning |
|---|---|
| `@2xl` (42rem / 672px container) | PHONE ↔ everything else: bar becomes field-carrying, hero becomes the asymmetric row, surfaces become anchored panels, Composer becomes the centred capture surface |
| `@5xl` (64rem / 1024px container) | the support column (MY LIFE IN + Circle) earns permanent screen space; below it, Moments come FIRST and the Circle module follows the feed |
| `@media (max-height: 520px)` | HEIGHT is the constraint (phone landscape): Wall caps at 56px, the owner's contact/management rows compact behind Manage profile |
| `@media (min-width: 1024px)` (viewport) | mini-chat dock vs full Chat handoff (accepted S4/S5 behaviour, unchanged) |

## Per-component contracts

| component | phone (<672) | tablet (672–1023) | desktop (≥1024) |
|---|---|---|---|
| **Chrome / TopBar** | one row, never wraps: mark + context word (shrinks FIRST — `Brand` is `min-w-0`, the word truncates before any utility yields; all six utilities live down to 320) + Search toggle grouped with the utilities; 36px utility targets, `gap-0`; sticky, safe-area top inset | the real search field appears (≤360px), utilities 40px | same, `gap-1`, field ≤360px |
| **ProfileHero** (S2 frozen; composition only) | centred stack; Wall 92px; contact + management behind Manage profile | asymmetric row (accepted S2 §22); Wall 150px; contact pill + plain management row | same; at max-height ≤520px the contact pill and management row compact behind Manage profile (landscape phones) |
| **Moment** | full-width measure, media bleeds to the edge (`--bleed`), place/feeling on their own line, Respond 44px | gutter measure, media inside the column, Respond 36px | same; column 640–760px (§44) |
| **Composer** | full-viewport sheet (`inset:0`), memory-first order, kind chips 36px in a masked scroll row, Post 44px, footer clears the home indicator | centred capture surface `min(560px,92%)`, `top:2rem`, centred by `inset+margin:auto` (**never** `translateX` — Motion animates the shell's transform) | same; `max-height: calc(100vh - 4rem)`, body scrolls inside |
| **TransientSurface** (Search results / People / Notifications / Messages) | full-width sheet under the bar, capped `min(100dvh − bar − inset-bottom)`; the SECTION is the one scroll owner (`overscroll-contain`); scrim is `touch-action:none` | anchored panel at the trailing edge (360–440px) | same, plus a 42rem height cap so a long list never becomes a full-height column |
| **People** | rows 40/48px identity, request actions 44px under the person, Message 40px | anchored 400px panel | same, actions 32px |
| **Search** | local sheet: Back · field (auto-focus) · Clear; results scroll in the remaining viewport | anchored 440px under the field | same |
| **Notifications** | full-width sheet, Accept/Decline 44px, thumbnails 36px | anchored 420px | same |
| **Life support column** | after the feed (order-2) | after the feed — Moments always come first below `@5xl` | permanent right column, sticky |

## Device reality (honest notes)

- **Safe areas**: the bar pads by `env(safe-area-inset-top)`; Composer footer, PersonCard
  sheet, MiniChat and every surface cap add `env(safe-area-inset-bottom)`. Verified
  structurally + simulated — no physical-notch Safari run is claimed.
- **Dynamic viewport**: surface caps use `dvh`; page shells use `min-h-dvh`. The Composer
  overlay is `fixed inset-y-0` (layout viewport) with an internal scroll body + pinned
  footer, so a collapsing URL bar or virtual keyboard shrinks the middle, never the actions.
  Virtual keyboards are simulated as reduced viewport height (360×420) — `layout-metrics.md`
  records field/action visibility per surface.
- **Zoom**: the viewport meta never disables user scaling. 200% desktop passes with body-zoom
  simulation; 200% phone is verified as WCAG-reflow equivalence (a 320px CSS viewport — the
  matrix's 320 column), since body-zoom inside a fixed 360px window is not how real page zoom
  behaves.
- **Images**: mock assets are single-size files; srcset variants belong to the live build.
  Guaranteed here: lazy + async decode on list/feed images, aspect-ratio declared before
  decode (no layout shift), SafeImg text fallback on failure, identity resolves to initials
  while a portrait loads (slow-network evidence 58–60).
- **Browser Back**: transient surfaces and popovers never push history; Chat navigation and
  scroll restoration are the accepted S4/S5 behaviour (`complete-my-world.js` §5).
- **CJK**: `:lang(zh-Hans)` collapses the Latin small-caps letter-spacing on labels (§55).

## Utility priority at 360 (§81, recorded reasoning)

Ranked by frequency × urgency, left→right: **the person's own context** (brand word — orients
every visit), **Search** (the most frequent deliberate act: reach something), **People**
(regular, relationship-driven), **Messages** (frequent, conversation re-entry), **Notifications**
(urgent when real — its red mark outranks its position), **Account** (rare, anchors the edge).
Visual weight is flat by design — the red marks, not icon prominence, carry urgency; People's
pending-request indicator is steel because the same event already owns red on the bell (§14).
