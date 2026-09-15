# SYSTEMBOOM — final navigation design (My World model)

Authoritative; supersedes the Compass-era design. Implementation:
`src/components/shell/destinations.ts` + `src/components/shell/Brand.tsx`.
Where an older document disagrees, this one and the accepted, tested behaviour
win — and the older document is corrected.

## 1. The user's model — and nothing more

The user never needs a map of SYSTEMBOOM's architecture. They need four facts:

1. **This is SYSTEMBOOM.**
2. **I begin in COSMOS** — the universal Home at `/`, explorable before identity:
   the solar system, the planets, Earth.
3. **I can enter MY WORLD** — the personal Home at `/world`, unlocked by
   identity. Its stream is my **MOMENTS**.
4. **Inside my World I have my LIFE** — the Circle of Life at `/life`.

Earth belongs to Cosmos exploration and never appears in signed-in navigation.
Ancestors exist only in the architecture (personal life begins at birth; earlier
is ancestral time) and appear nowhere until real. "Social" is capability
vocabulary — code keeps its names; the UI never uses the word.

## 2. The one persistent control: the brand

There is no destination menu, no tab row, no compass panel, no hamburger.

- **The SYSTEMBOOM mark goes Home**, the way every product's mark does: from My
  World or Life it links to `/`. At Cosmos it is inert identity.
- **One quiet word beside it states the context**: MY WORLD or LIFE (11px caps,
  muted). On phones it stays visible — the plate and utilities are sized so a
  360px bar still reads `SYSTEMBOOM · MY WORLD`.
- Its accessible name carries both facts: "SYSTEMBOOM — Home. You are in My
  World."

That is the entire global navigation. Everything else is local or utility.

## 3. Layers

| Layer | Content | Where |
|---|---|---|
| Global | the mark (→ Home) + the context word | top-left of every non-immersive destination |
| Local | Moments: composer, hero, filters, the compact Life entry; Life: the temporal coordinate; Cosmos: its own frozen ladder | owned by the destination |
| Utility | search · notifications · chat (later; steps aside on phones) · theme · account | the destination's own bar |

## 4. Routes

| Destination | URL | Identity | Notes |
|---|---|---|---|
| Cosmos | `/` | none | Home; the 3D world mounts only here. Earth is a state inside it (deep link `/?to=earth`, applied once, consumed; never a route). |
| My World | `/world` | required | the personal Home; one implementation (dev alias `/style-lab/social` keeps the review harness) |
| Life | `/life` | required | the Circle of Life (dev alias `/style-lab/circle`) |
| `/social` | → `/world` | — | compatibility only; "Social" is not a destination |

Style-lab paths never appear in product navigation.

## 5. Journeys

- **Public:** `/` → explore Cosmos (solar system, planets, Earth) → identity →
  **My World**. No launcher, no hub, no navigation decision: after identity the
  gate's one action is **Enter My World** (or **Continue to Life** when Life was
  the remembered request).
- **Returning:** `/` still opens Cosmos — identity never replaces the universe.
  A quiet bottom-right **Enter my world** continues inward; exploring stays
  primary.
- **From My World:** the hero's Circle row (`band 30–45 · 12,731 days · Life →`)
  and the sidebar Circle module's **Open Life** enter `/life`.
- **Outward:** the mark, from anywhere, returns to Cosmos.
- A personal URL without an identity goes Home, where identity lives; the
  request is remembered (`sessionStorage sb-intent`) and continued after.

## 6. Appearance is one preference — navigation never changes it

One store (`localStorage sb-theme`), applied before paint by the layout boot
script; default **dark**, so a first entry visually continues the Deep Cosmos
the person just left. Dark Cosmos → dark My World → dark Life, with not one
light frame (asserted per animation frame by `final-app.js`). Light is the
equally complete Solar Observatory and persists the same way.

## 7. Motion

Entering My World is the only signature cross-scale move: continuity of
darkness, brand persistence, a fast content replacement — no spectacle, no
planet-morphing, no white frame. Ordinary navigation is near-instant. Reduced
motion: direct state change.

## 8. Mobile

At 360 the bar is `SYSTEMBOOM · MY WORLD` + search, bell, theme, account (36px
targets; the inert chat placeholder steps aside below 672px). Then: compact
identity with the counter, the composer, and the first Moment within one
viewport (measured: first Moment top ≈ 785px at 360×800; the Life entry at
≈ 394px). The Circle card sits below the stream as orientation.

## 9. Performance

The 3D world mounts only at `/` and unmounts with the route; My World and Life
mount no canvas and load no three.js; Cosmos carries no hidden Moments stream.

## 10. Banned

A destination menu or tab row; a Compass panel; bottom tabs; a hamburger; a
World launcher; an Earth item in signed-in navigation; "Social" or "Dashboard"
as user-facing labels; `/earth`; style-lab paths in product navigation;
navigation that changes the theme; neon, HUD, glass-everywhere, monospace
decoration, fake telemetry.
