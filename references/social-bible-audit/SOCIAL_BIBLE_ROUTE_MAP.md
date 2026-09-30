# SOCIAL BIBLE AUDIT — ROUTE MAP

**Phase 0 · evidence audit · 2026-09-16 · read-only.**
Every row is read from `src/app/**` and `src/components/shell/destinations.ts`, and confirmed
by loading the route in a real browser (see `SOCIAL_BIBLE_SCREENSHOT_INDEX.md`).
Nothing here was inferred from documentation.

---

## 1. The route table (verified, not assumed)

The Next.js App Router tree contains **exactly eight `page.tsx` files**. There are no route
groups, no dynamic segments, no `[id]` routes, no route handlers, no middleware
(`find src/app -type f` → 8 pages + `layout.tsx` + `globals.css` + `icon.png`).

| # | Route | File | Purpose | Audience | Redirect / gate | Main component | Major children | Verified |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` | `src/app/page.tsx` | COSMOS — the universal Home, the root of the application | public | none | `shell/CosmosRoot.tsx` | `cosmos/CosmosEntry` → `CosmosExperience` (R3F, `ssr:false`), `identity/IdentityGate`, `i18n/LanguageMenu` (signed-out only), "Enter my world" chip (signed-in only) | shot 44 (fallback) |
| 2 | `/world` | `src/app/world/page.tsx` | **MY WORLD** — the personal Home after identity; its stream is MOMENTS | authenticated (owner or visitor mode) | `PersonalDestination id="world"` → `router.replace("/?identity=1")` when `hydrated && !activeIdentity` | `style-lab/social/SocialPreview` with `product` | `Chrome/TopBar`, `ProfileHero`, `LifeCursor`, `MomentEntry[]`, `CircleModule`, `LifeCounter`, `Composer`, `WorldProvider`, `PersonCard`, `MiniChat`, `PeoplePanel`, `MessagesPanel`, `NotificationsPanel` | shots 40, 41, 48 |
| 3 | `/life` | `src/app/life/page.tsx` | LIFE — the Circle of Life, inside the person's World | authenticated | same `PersonalDestination` gate (`id="life"`) | `style-lab/circle/CirclePreview` with `product` | `CircleDial`, `CircleView`, `Readout`, `DayAlmanac`, `Composer` (date-seeded), `LifeRing` | shots 42, 49 |
| 4 | `/chat` | `src/app/chat/page.tsx` | CHAT — the conversation surface of My World; a **utility destination**, never navigation | authenticated | same `PersonalDestination` gate (`id="chat"`) | `world/ChatSurface` | `WorldShell` (Brand + ThemeToggle), `PersonIdentity`, `ConversationBody` | shots 43, 46 |
| 5 | `/social` | `src/app/social/page.tsx` | Compatibility only — "Social" is capability vocabulary, never a user-facing label | any | **`redirect("/world")`** (server-side `next/navigation`) | — | — | shot 47 (lands on My World) |
| 6 | `/style-lab` | `src/app/style-lab/page.tsx` | Phase 0 visual system lab | prototype only | none | `style-lab/StyleLab` | tokens / materials / type / motion demos | not captured |
| 7 | `/style-lab/social` | `src/app/style-lab/social/page.tsx` | Development alias of My World **plus the review harness** | prototype only | none | `SocialPreview` (no `product` prop) | same as `/world`, plus the harness bar and all review query params | shots 01–39, 50–52 |
| 8 | `/style-lab/circle` | `src/app/style-lab/circle/page.tsx` | Development alias of Life + harness | prototype only | none | `CirclePreview` (no `product`) | same as `/life` | shot 45 |

**Earth has no route.** `destinations.ts:57` — `export const EARTH_INTENT = "/?to=earth";`
Earth is a *state* inside Cosmos, entered by a one-shot effect in `cosmos/CosmosExperience.tsx`
that reads `?to=earth`, consumes it from the URL and calls `select("earth")` after 700 ms
(AGENTS.md authorised exception, 2026-09-12). `/earth` is asserted **not** to exist by
`prototype-tests/one-application.js`.

**There are no person/profile/search/notification routes.** Verified by exhaustive listing of
`src/app`. Every one of those surfaces is an in-page transient surface or a modal:

| Surface a reader might expect to be a route | What it actually is | Where |
|---|---|---|
| Person / profile page | `ProfileHero` for the page subject; `PersonCard` (a `role="dialog" aria-modal` sheet) for anyone else | `social/ProfileHero.tsx`, `world/PersonCard.tsx:82` |
| Search | a `TransientSurface` hanging off the top bar | `social/Chrome.tsx:302–436` |
| Notifications | a `TransientSurface` | `social/Chrome.tsx:481` (`NotificationsPanel`) |
| People | a `TransientSurface` utility panel | `world/People.tsx:198` (`PeoplePanel`) |
| Messages | a `TransientSurface` + one fixed mini-chat dock ≥1024px | `world/Messages.tsx:55`, `:163` |
| A single Moment | never addressable; reached by `reveal` + `focusMoment` in the same page | `social/store.tsx:178–184`, `world/focus-moment.ts` |

---

## 2. The destination model

`src/components/shell/destinations.ts:37–45` is the single source of truth:

```ts
export const DESTINATIONS: Destination[] = [
  { id: "cosmos", label: "Cosmos", route: "/" },
  { id: "world",  label: "My World", route: "/world", devRoute: "/style-lab/social", personal: true },
  { id: "life",   label: "Life",     route: "/life",  devRoute: "/style-lab/circle", personal: true },
  { id: "chat",   label: "Chat",     route: "/chat",  personal: true },
];
```

- `byId(id)` **throws** on an unknown id — a link to a destination that does not exist fails loudly.
- `ROOT = byId("cosmos")` — the SYSTEMBOOM mark always returns here (`shell/Brand.tsx:59`).
- **There is no destination menu anywhere.** `Brand.tsx` renders a mark (a `Link` to `/`) plus one
  context word (`data-sb-context`). At `/` the mark is a non-link `<span>` (`Brand.tsx:50–56`).
- The context word is localized through `CONTEXT_KEY = { world: "world.context.my", life: "life.word" }`
  (`Brand.tsx:18`) and can be overridden by `label` so a visitor's bar reads **"{Name}'S WORLD"**
  instead of "MY WORLD" (verified in shot 12 — `MAYA'S WORLD`).

---

## 3. Redirect and gate behaviour (traced in code)

```
/social                     → server redirect → /world                       (app/social/page.tsx:9)
/world | /life | /chat      → if identity.hydrated && !identity.activeIdentity:
                               rememberIntent(id)  → sessionStorage["sb-intent"] = id
                               router.replace("/?identity=1")                (shell/PersonalDestination.tsx:23–28)
/?identity=1                → CosmosRoot consumes the param from the URL via history.replaceState
                               and opens the identity gate in "signin" view   (shell/CosmosRoot.tsx:30–38)
after identity              → CosmosRoot renders an "Enter my world" link whose href is
                               byId(intent === "life" ? "life" : "world").route
                               and sets sessionStorage["sb-arrive"] = "1"     (shell/CosmosRoot.tsx:41–42, 63–71)
arrival at /world           → SocialPreview reads and clears "sb-arrive" and plays one 480ms
                               `sb-arrive` resolve (none under reduced motion)
```

While the gate is pending, `/world` renders a holding state, **not** a blank page:
`<div data-sb-awaiting-identity="world">` with the sentence
`"{label} is yours once you have entered SYSTEMBOOM. Opening your identity…"`
(`PersonalDestination.tsx:32–36`). **That sentence is hardcoded English** — it is built by
template literal from `byId(id).label`, with no `useT`. Recorded as an i18n gap.

---

## 4. Theme and locale are route-independent

- Theme: one store, `localStorage["sb-theme"]`, applied as `<html data-theme>` by a pre-paint
  script (`app/layout.tsx:30`, injected at `:51`). Priority `?theme=` → saved → **dark**.
  `setTheme` has exactly three call sites, none of them in routing code
  (`ui/ThemeToggle.tsx:10`, `social/Chrome.tsx:180`, `cosmos/overlays.tsx:173`).
  Navigation therefore never changes the theme.
- Locale: resolved **server-side** per request (`lib/i18n/server.ts` → `app/layout.tsx:40`),
  rendered into `<html lang dir>`, then owned by `LocaleProvider`. Switching language is React
  state + cookie + `localStorage["sb-locale"]` — **never** a route change. There is no
  `/[lang]/...` segment; this is a recorded, deliberate divergence from the Next.js
  recommendation (`docs/i18n/architecture.md` §5).

---

## 5. Prototype-only routes and how the harness is gated

`/style-lab`, `/style-lab/social` and `/style-lab/circle` are prototype surfaces. The review
harness (the sticky control bar and **every** review query parameter) is gated by one boolean:

```tsx
// src/app/world/page.tsx:17
<SocialPreview product />
// src/app/style-lab/social/page.tsx:10
<SocialPreview />          // product defaults to false
```

```ts
// src/components/style-lab/social/SocialPreview.tsx:444–448
useEffect(() => {
  const q = new URLSearchParams(window.location.search);
  if (product) return;                     // ← the entire gate, before every q.get()
  ...
}, [dispatch, product]);
```

All 15 review params — `w`, `bell`, `viewer`, `pulse`, `pulseMoment`, `notifications`, `fail`,
`composer`, `harness`, `nocover`, `profileName`, `photo`, `wall`, `rel`, `worldlight` — sit
behind that return, and `const [harness, setHarness] = useState(!product)` hides the harness
chrome. **The gate is behaviourally sound** (verified: no other reader of these params exists in
`src`). Two honest caveats are recorded in `SOCIAL_BIBLE_AUDIT.md` §26:
the harness fixtures are still *bundled* into `/world`, and the safe default is the permissive one.

---

## 6. Route-level risks recorded (no action taken)

| ID | Route | Finding | Evidence |
|---|---|---|---|
| R-1 | `/chat` | Hardcoded header height: `h-[calc(100dvh-57px)]`, the only such literal in `src`. `WorldShell` never declares 57px; `TopBar` solves the same problem properly by publishing `--sb-bar-h`. | `world/ChatSurface.tsx:63`; cf. `social/Chrome.tsx:97–109` |
| R-2 | `/chat` | `WorldShell` does not honour `env(safe-area-inset-top)` the way `TopBar` does, so on a notched device the chat column can overflow. | `shell/WorldShell.tsx:18`; cf. `social/Chrome.tsx:118` |
| R-3 | `/chat` | The `?c=` deep link is read **once**, imperatively, from `window.location.search` — not `useSearchParams`. `active` is never written back to the URL, so choosing a conversation does not change the address and Back does not step through conversations. | `world/ChatSurface.tsx:47–53` |
| R-4 | `/chat` | The mobile Back button contains an unreachable desktop branch (`router.push("/world")` inside an element classed `lg:hidden`). | `world/ChatSurface.tsx:105–113` |
| R-5 | `/world` ↔ `/chat` | `SocialPreview` and `ChatSurface` each mount their **own** `SocialStore` + `WorldProvider`, and nothing is persisted (`store.tsx:4–6`). A phone user who taps Message navigates to `/chat` and lands in freshly seeded state: a request accepted seconds earlier, a message just sent and all read state are gone. Desktop hides this because the mini dock never leaves the route. | `social/store.tsx:5`, `world/ChatSurface.tsx:30–36`, `world/WorldProvider.tsx:7–9` |
| R-6 | all personal routes | Identity is client-side only. `PersonalDestination` is a **UX** gate, not a security boundary — `docs/handover/my-world-product-completeness.md` classifies server-side guarding of `/world` `/life` `/chat` as a **P1** live-port obligation. | `shell/PersonalDestination.tsx`, `lib/identity/store.ts` |
| R-7 | `/world` | The awaiting-identity sentence is hardcoded English. | `shell/PersonalDestination.tsx:34` |

---

## 7. Counts

- Routes defined: **8** (`page.tsx` files).
- Product routes: **4** (`/`, `/world`, `/life`, `/chat`) + **1** compatibility redirect (`/social`).
- Prototype-only routes: **3** (`/style-lab`, `/style-lab/social`, `/style-lab/circle`).
- Routes relevant to the Social / My World audit: **6** (`/`, `/world`, `/life`, `/chat`, `/social`, `/style-lab/social`).
- Destinations in the model: **4**. Destinations with `devRoute`: **2**. Destinations marked `later`: **0**.
