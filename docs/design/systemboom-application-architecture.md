# SYSTEMBOOM is one application

Binding architecture. The navigation design itself is
`docs/design/systemboom-navigation-final.md` (My World model); the single
implementation is `src/components/shell/destinations.ts` + `Brand.tsx`.

## 1. The claim

SYSTEMBOOM is **one product**. Cosmos is its universal Home, not a marketing
page; identity does not replace it — it unlocks the personal layers of the same
universe. One product does not mean one menu: the user's model is four facts —
this is SYSTEMBOOM · I begin in Cosmos · I can enter My World · inside it are my
Moments and my Life.

```
SYSTEMBOOM
  └ COSMOS      the universal Home — solar system, planets, Earth        /
      └ MY WORLD    the personal Home after identity                     /world
          ├ MOMENTS     the human stream (the accepted Phase 4 build)
          └ LIFE        the Circle of Life                               /life
              └ ANCESTORS   before this life began (not built)
```

Earth is a state inside Cosmos (deep link `/?to=earth`; never a route, never a
signed-in navigation item). `/social` is a compatibility redirect to `/world`:
"Social" is capability vocabulary, not a product surface.

## 2. Destination ≠ route

| Destination | How it is reached | Route |
|---|---|---|
| Cosmos | the mark, from anywhere; the application root | `/` |
| My World | identity → directly in; the Enter-my-world chip; a remembered request | `/world` (dev alias `/style-lab/social`) |
| Life | the hero's Circle row and the Circle module inside My World | `/life` (dev alias `/style-lab/circle`) |
| Earth | a state inside Cosmos, applied once from `?to=earth` and consumed | none — never invent one |
| Ancestors | not built; absent everywhere | none |

## 3. Shell responsibilities

`src/components/shell/`:

| File | Owns |
|---|---|
| `destinations.ts` | the destination model: labels, canonical routes, dev aliases, identity requirement |
| `Brand.tsx` | the one persistent global control: the mark that goes Home + the context word |
| `WorldShell.tsx` | the page frame for non-immersive destinations: brand, theme |
| `CosmosRoot.tsx` | the root destination: the frozen Cosmos untouched, the `?identity=1` gate seam, the Enter-my-world chip |
| `PersonalDestination.tsx` + `intent.ts` | a personal destination without an identity: remember the request, go Home, continue after |

The shell owns **no** feed, ring, renderer or page logic. Social keeps its
accepted Phase 4 bar and opens it with the **Brand** — the same component Life
wears — so there is exactly one global control in the product and no destination
row or menu anywhere.

## 4. Modes of the same application

- **Immersive (Cosmos, Earth).** The shell chrome is absent; the root experience
  carries its own minimal controls (the identity chip). The application state —
  destination model, theme, identity — is unchanged underneath. This is a
  full-screen mode, not a different site.
- **Social mode.** Information-dense, so the frame is explicit: mark, search,
  the one navigation, utilities. Same logo treatment, same theme, same model.
- **Life / Circle mode.** The same frame. The Circle's breadcrumb
  (`Life / 30–45 / Age 34 / SEP / 10`) is a **local temporal control**, never
  global navigation; it is labelled "Temporal coordinate" precisely so the two
  are never confused.

## 5. Global, local, utility

| Layer | Answers | Where |
|---|---|---|
| **Global** | where am I, and how do I go Home? | the Brand: the mark → Cosmos, one context word — top-left at every non-immersive destination |
| **Local** | what can I do inside this destination? | owned by the destination — Social's composer, hero, filters; the Circle's temporal coordinate |
| **Utility** | search, notifications, messages, account, theme | the Social bar; theme in every frame |

They never carry equal weight, and no destination appears in two layers.

## 6. Theme

One store (`localStorage["sb-theme"]`), applied before paint by the boot script
in `src/app/layout.tsx`. Dark is Deep Cosmos, light is Solar Observatory. Every
destination reads it; immersive destinations may interpret it differently, but
the setting is singular and never resets between routes.

## 7. Performance boundaries

- The 3D world mounts **only** at `/`, behind `dynamic(..., { ssr: false })` in
  `CosmosEntry`, and unmounts with the route.
- Social, World and Life mount no canvas and request no three.js bundle — the
  suites assert both.
- Route-level code splitting is the boundary. Never keep Cosmos alive behind the
  feed "for atmosphere".

## 8. Transition classes

| Class | Example | Motion |
|---|---|---|
| A — same destination, local action | opening the composer, a Social filter | near-instant |
| B — same scale, different destination | Social → Life through the navigation | fast content replacement, no page theatre |
| C — scale change | Cosmos → World, Life level → level | one controlled spatial transition (the Circle's zoom; Cosmos's own entry) |

Reduced motion replaces class C with a direct state change or a short crossfade.

## 9. Browser behaviour

Routes are real: Back, Forward, refresh, deep links and open-in-new-tab all
work, and the Circle keeps its `?c=` coordinate in history. Application
continuity never comes at the cost of web correctness.

## 10. Live-port route migration

The prototype paths are scaffolding and must not enter the product's information
architecture:

| Prototype | Live product |
|---|---|
| `/world` | `/world` — MY WORLD, the canonical personal Home |
| `/life` | `/life` (already canonical) |
| `/social` | a redirect to `/world`; drop it once no old review links remain |
| `/style-lab/social`, `/style-lab/circle` | development aliases — keep out of product navigation |
| `/` | `/` |

Change them in `destinations.ts` only; every surface follows. The word
"style-lab" must never appear in product navigation.

## 11. World semantics (final)

- **Cosmos** — the universal Home, the outermost scale.
- **MY WORLD** — the signed-in personal Home at `/world`: the person, their
  Moments, their Life context.
- **MOMENTS** — the human stream inside My World (the accepted Phase 4 build).
- **"Social"** — capability vocabulary only. Never a user-facing label, never a
  destination.

## 12. Ancestors (future seam)

Personal life begins at birth. Moving earlier than the person's birth leaves
personal time and enters **ancestral time** — the existing Ancestor Tree, when
it exists in the product. It belongs with Person, Life and Family, never in
utility navigation, and is in the destination model as a `later` destination so
it can be connected without redesigning anything.
