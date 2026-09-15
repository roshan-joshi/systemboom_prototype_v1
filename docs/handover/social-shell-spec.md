# SYSTEMBOOM shell — Social in one world (Phase 4.3)

How Social sits inside SYSTEMBOOM: what the shell owns, how the scales connect,
and what must not be duplicated. Companions: `systemboom-navigation-map.md`
(every destination), `README-for-developer.md` (how to port Social),
`circle-of-life-spec.md` (time), `social-visual-spec.md` (appearance).

## 1. The product sequence

```
COSMOS → SOLAR SYSTEM → EARTH → WORLD → PERSON → SOCIAL → LIFE → CIRCLE → ANCESTORS
  macro scale            place    the person's      human        time        before
                                   environment      activity                  this life
```

These are resolutions of one world, not separate applications. The continuity
is behavioural: the same tokens, the same type, the same restraint, the same
navigation grammar, one theme, and one brand control: the mark goes Home, one word states the context.
It is **not** achieved by putting space imagery behind content.

## 2. Public Cosmos → authenticated World

- `/` is the public Cosmos: the solar system, Earth approached spatially, and
  the identity gate above it (the gate is the only thing that may cover Cosmos).
- Entering through the gate writes the session and the signed-in view offers
  **Enter your World** → `/world`. That is the seam; it is a real link, not a
  promise.
- `/world` states the person's coordinate in the product's own grammar
  (name · `34y 10m 07d` · born `04 NOV 1991 · 06:42` · place · `day 12,731 of
  this life`) and offers the scales outward (Cosmos), human (Social) and time
  (Life). Without a session it says so plainly and points back to Cosmos.
- No fake single-page transition between the 3D world and the internal pages:
  these are separate routes by design (see §7).

## 3. Navigation hierarchy — one system

SYSTEMBOOM is one application (`docs/design/systemboom-application-architecture.md`,
`docs/design/systemboom-navigation-final.md`). There is exactly **one** navigation
implementation, `src/components/shell/Brand.tsx`, reading one model,
`destinations.ts`. My World defines no navigation of its own and shows no
destination row or menu at any width.

| Layer | Content | Where |
|---|---|---|
| **Global** | Home (the mark → Cosmos) + the context word (MY WORLD / LIFE) | the Brand, top-left, at every non-immersive destination |
| **Local** | Social's composer, hero and filters; the Circle's temporal coordinate; Cosmos's own ladder | owned by the destination |
| **Utility** | Search · Notifications · **Messages** · Account · Theme (in the account menu below ~672px) | the destination's own bar |

Rules: a destination appears once; unbuilt destinations are absent, not disabled;
`aria-current="page"` plus a red dot marks the current one; personal destinations
asked for without an identity are remembered and continued after the gate.

## 4. Top bar

- **My World** keeps its accepted Phase 4 bar, opening with the **Brand**
  (red plate mark → Home + MY WORLD) and otherwise carrying only utilities:
  search, Messages, notifications, theme, account ring — at every width; on
  narrow bars the theme toggle moves into the account menu (**Appearance**)
  so Messages stays reachable. The bar row spans the frame so the brand keeps
  the same viewport position as everywhere else.
  Messages opens recent conversations; choosing one opens the single desktop
  mini-chat dock (≥1024px) or the full Chat conversation (`/chat?c=<person>`)
  on smaller screens. Its unread dot is message-unread only — the bell's dot is
  notification-unread only; never a combined total
  (`people-chat-integration.md` §4).
  Light: flat white, 1px hairline. Dark: floating glass, the only glass.
- **Life** uses `WorldShell`: the same Brand at LIFE, the theme control, nothing else.
  `/social` is a compatibility redirect to `/world`, not a surface. `/chat`
  also uses `WorldShell` (Brand context CHAT) — a utility surface, never a
  navigation item.
  Light bar `#FFFFFF`, dark bar the page colour, both with one hairline.
- No icon soup: every icon-only control has an accessible name, and the bar
  never repeats a destination that the page already offers.

## 5. Mobile

- 360px is first class. The shell and Social both drop to a single disciplined
  nav row under the bar (12px), the same destinations in the same order.
- Search collapses to one icon; notifications open a full-width panel;
  Messages goes to `/chat` (list → full-screen conversation → back).
- The account menu carries **Appearance** (Deep Cosmos / Solar Observatory) and
  a real **Logout** (clear identity → Cosmos); on phones Appearance is the theme
  control.
- The primary Social action (the composer bar) is never hidden behind a menu.
- No five-tab bottom bar: it would duplicate the row above it and steal height
  from the stream.

## 6. Theme continuity

- One store: `localStorage["sb-theme"]`, applied before paint by the boot script
  in `src/app/layout.tsx` (`?theme=` wins for review tooling, then the saved
  choice, then dark). Never add a second theme store.
- Every internal surface paints its own ground: `.sb-social` for Social,
  `.sb-surface` for the shell (`--page`, `--bar`, `--hair`, `--card`). Light is
  the Solar Observatory field `#F5F5F6` with near-white sheets; dark is Deep
  Cosmos `#0A0D14`. Light is never dark inverted.
- Changing the theme anywhere changes it everywhere; no flash on entry, no
  reload, scroll position preserved.

## 7. Performance boundaries

- The 3D world is mounted **only** by `/` through `CosmosEntry`'s dynamic
  import. Social, World and Life mount no canvas and request no three.js
  bundle — asserted by the suite (`canvas` count 0, no `three|fiber|drei`
  script).
- Never keep Cosmos alive behind the feed for atmosphere. Atmosphere in Social
  comes from tokens and typography.
- Cleanup: leaving `/` unmounts the canvas with the route. If the live system
  later wraps both in one shell, the 3D subtree must still unmount when it is
  not visible, and must not run while a modal or another scale is on top.

## 8. Circle and Earth

- The Social sidebar's Circle module is a **glanceable instrument**: ring, the
  owner's day count or a visitor's band, an informational `today · DD MON YYYY`
  line, and **Open Life** → `/life`. It performs no time navigation.
- The Circle's own breadcrumb is a **local temporal control** labelled "Temporal
  coordinate", never global navigation.
- Earth is a place, not a menu item: it lives inside Cosmos. Social already
  carries place on every Moment; a future Social ↔ Earth integration (Moments
  on the globe) is Phase 6+, and nothing decorative anticipates it.

## 9. Ancestors

Personal life begins at birth. Navigation before birth does not belong to the
Circle of Life; it crosses into the Ancestor Tree. Ancestors therefore belongs
with Person, Life and Family — never in utility navigation. Documented in
`docs/design/circle-of-life.md` §14 and not implemented.

## 10. Transitions

| Change | Motion |
|---|---|
| Same scale (Social → Social state, tab, panel) | none or a fast crossfade; content replacement, no page theatre |
| Inward (Social → Life, Life level → level) | the Circle's own zoom: one orchestrated transformation |
| Outward (mark → Cosmos) | ordinary navigation; Cosmos runs its own entry |
| Reduced motion | direct state change or a 120 ms crossfade everywhere |

One dominant animation per interaction. Nothing animates on scroll or on
entering the viewport.

## 11. What not to duplicate

- A second navigation model (use `destinations.ts`) or a second navigation
  renderer (use `Brand`), any destination menu, and any persistent destination row.
- A second theme store.
- A second time navigator (the Circle owns time; the sidebar module is an
  entry, the composer's date field is input, nothing else navigates time).
- A second shell around Social (Social's accepted bar is the shell there).
- A second "post" model for the Circle — Moments are the only content objects.
