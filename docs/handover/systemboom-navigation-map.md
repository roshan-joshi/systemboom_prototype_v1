# SYSTEMBOOM — navigation map

Phase 4.3 · 2026-09-11. **One navigation model.** Every surface reads
`src/components/shell/destinations.ts`; this document is its human-readable
form. The live developer must not invent a second navigation: if a destination
is not listed as WORKING here, it does not exist yet and nothing links to it.

Vocabulary: **COSMOS** is the universal Home. **MY WORLD** is the signed-in
personal Home; its stream is **MOMENTS**; **LIFE** is the Circle of Life inside
it. "Social" and "Dashboard" are never user-facing. There is no destination
menu of any kind: the mark goes Home, one word states the context, Life is
entered contextually.

Architecture: `docs/design/systemboom-application-architecture.md`.
Navigation design: `docs/design/systemboom-navigation-final.md`.

## The destinations

| Destination | Route | Reached from | Auth | Status | Notes |
|---|---|---|---|---|---|
| **Cosmos** (Home; solar system; Earth inside it) | `/` | the SYSTEMBOOM mark, from anywhere | none | **WORKING** | The 3D world mounts only here. Signed-in visitors keep exploring; a quiet **Enter my world** chip continues inward. |
| **My World** (personal Home; Moments) | `/world` | identity → directly in; the chip; the mark's context | identity | **WORKING** | The accepted Phase 4 build. Dev alias `/style-lab/social`. |
| **Life** (Circle of Life) | `/life` | the hero's Circle row (`… · Life →`); the Circle module's **Open Life** | identity | **WORKING** | Phase 5, parked. Dev alias `/style-lab/circle`. |
| Earth (place) | *state inside Cosmos* (`/?to=earth`) | Cosmos exploration | none | **WORKING as a state** | Not a signed-in navigation item. Never invent `/earth`. |
| `/social` | redirect → `/world` | old review links | — | **COMPATIBILITY** | "Social" is capability vocabulary. |
| **Chat** (conversation surface) | `/chat` (`?c=<person>` deep link) | Messages utility; person → Message | identity | **WORKING** | A utility surface, never a navigation item. Same brand, theme, identity — no second login. |
| Ancestors | — | — | — | **NOT BUILT** | Personal life begins at birth; absent until real. |
| Style lab | `/style-lab` | direct URL only | none | **PROTOTYPE ONLY** | Never product navigation. |

## Local and utility

| Item | Belongs to | Status |
|---|---|---|
| Composer, profile hero, Moment controls, compact Life entry | My World | WORKING |
| Search · Notifications · **Messages** · Account · Theme (in the account menu on phones) | the destination's own bar | WORKING — Messages opens recent conversations → mini chat (desktop) or `/chat` (phone) |
| Circle temporal coordinate, Jump to date | Life — local, never global | WORKING |
| Person surface · relationship actions | Moment authors, search people, notifications | WORKING (see `people-chat-integration.md`) |
| Settings / Statistics / Weather / Exchange | account menu, marked "later" | PRESERVE EXISTING LIVE PAGES |
| "View in Life" | Phase 6; seam `?c=day:YYYY-MM-DD` | DEFERRED |

## Rules

1. One global control: the Brand (`Brand.tsx`), reading `destinations.ts`. No
   surface defines navigation of its own; no destination menu exists.
2. The mark always goes Home to Cosmos.
3. Navigation never changes the theme; the theme is one stored preference,
   default dark.
4. A personal destination requested without an identity is remembered and
   continued after the gate — the user never asks twice.
5. Never invent a route for a state (Earth); never link to what does not exist.
6. Canonical product routes: `/world`, `/life`. Style-lab paths are development
   aliases only.
