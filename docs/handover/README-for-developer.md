# SYSTEMBOOM Social — README for the live-system developer

You are building the redesigned Social section of the live SYSTEMBOOM product
(Next.js App Router · React · TypeScript · Tailwind v4 · one token-based
`globals.css` · Radix UI · Lucide · Font Awesome · date-fns · TanStack Query ·
NestJS REST · Swagger · PostgreSQL · Drizzle · WebSockets). This prototype is your
**design reference**, not code to lift. Read this file, then the specs:

1. `social-visual-spec.md` — appearance, tokens, type, layout, motion, contrast
2. `social-interaction-spec.md` — every state machine, keyboard behaviour, the
   privacy data contract, live-update notes
3. `social-content-rules.md` — every sentence the interface speaks
4. `social-api-contract.md` — the data shapes the front end needs and the
   band-only privacy rule the server must enforce
5. `social-visual-qa.md` — the PASS / FAIL checklist to hold beside the live site
6. `social-reference-index.md` — which screenshot is authoritative for what
7. `../social-feature-parity.md` — every live feature classified A–E (scope)
8. `../design/social-wireframes.md`, `../design/composer-states.md` — the binding
   drawings and the composer state machine
9. `systemboom-navigation-map.md` — every destination, its route and its status.
   **Do not invent a navigation; this is it.**
10. `social-shell-spec.md` — how Social sits inside SYSTEMBOOM: scales, shell,
    theme continuity, 3D performance boundary, Circle and Earth relationships

Where a spec and this README disagree, the spec wins. Where the prototype and a
spec disagree, the spec wins (the docs were corrected last).

> **Scope for this month (owner decision):** the feed, the composer, the moment, and
> the profile header — in the accepted visual language, on top of the existing
> Social functions. `social-feature-parity.md` classifies every live feature; only
> class **A** items are launch scope.

---

## ⛔ DO NOT INVENT

The design is finished. When something in this list tempts you, the answer is in a
spec or in the prototype; if it truly is not, **surface the constraint to the owner
instead of substituting a conventional social-media pattern**. Do not invent:

1. **A different card structure** — no card per moment, no shadowed post boxes; one
   sheet, one rule, hairline separators.
2. **Alternate life-ring geometry** — ten arcs, 36° − 4° gap, birth at 12 o'clock,
   ice/steel opacities, the tick only on the viewer's own ring. Not a progress ring,
   not a pie, not eight bands.
3. **An alternate reaction set** — one reaction, the Respond ring mark; no hearts,
   thumbs, emoji, or "reaction types" in the payload.
4. **An additional reaction picker** — none exists; long-press does nothing.
5. **New kind colours** — kinds are words in one ink; no per-kind colour, badge or
   icon fill.
6. **Your own DOB privacy handling** — the band-only rule is server-side and total
   (`social-api-contract.md` §C). No "friends see exact age" tier, no CSS hiding,
   no client-side redaction.
7. **A different date grammar** — `DD MON YYYY`, `HH:MM`, `34y 10m 06d`, `30–45`.
   No relative times on moments, no locale formats, no slashes.
8. **A new light-mode palette** — the tokens are the contract (`#F5F5F6`,
   `#FDFDFD`, `#D92A20`, `#3D678C`, …). Do not "harmonise" them with the old theme.
9. **A different mobile composition** — hero (with counter) → Circle → sheet; the
   readout on two lines; media edge-to-edge; kind words kept; Respond word kept.
10. **Separate Circle / time models** — one band model (ten × 15 years, 150) drives
    the ring, the module, the readouts and the composer preview.
11. **Fake AI / photo detection behaviour** — if the upload pipeline gives no
    date/place, there is no "detected" state; never guess, never pretend.
12. **Functionality for the disabled "View in Life"** — it ships disabled and
    honest ("View in Life — later"); do not wire it to the pie chart, a modal or a
    stub page.
13. **New launch scope** — nothing that is not class A in the parity document.
14. **Milliseconds, "remaining" time, percentages of a life, adverts in the stream,
    monospace, glow, gradients, glass off the top bar.**
15. **Your own global navigation.** There is none to invent: the SYSTEMBOOM
    mark goes Home to Cosmos and one word states the context (`Brand.tsx`,
    `destinations.ts`). No destination menu, no tab row, no bottom tabs, no
    hamburger, no World launcher, no Earth item after sign-in, no `/earth`
    route, no `style-lab` path in product navigation — and "Social" is never a
    user-facing label (the personal Home is MY WORLD; the stream is MOMENTS).
16. **A clock time for a date-only Moment.** A backdated Moment has day precision
    (`atPrecision: "day"`); show the date, never a fabricated hour. Posting time is
    provenance only (Phase 5 §6 decision).
17. **A People tab or a Chat tab.** Actions live with objects: search rows,
    Moment authors and notification rows open the person surface; Message lives
    on the connected person; Messages is a utility control. One desktop
    mini-chat dock, never several; no typing indicators, read receipts or
    presence the backend does not provide; no life coordinates inside a
    conversation; no second unread total; no second login for Chat — the port
    owes it the shared SYSTEMBOOM session (`people-chat-integration.md`).
18. **A second avatar system.** Every identity surface (Profile, Moment,
    Search, Friend, Notification, Chat, Composer) renders from one
    `PersonIdentity` component — never bespoke avatar JSX per screen. Real
    photo → initials only (no illustrated/curated-avatar tier); a story ring,
    an online-presence ring, a verification ring or a friendship-coloured
    ring are all inventions this system forbids — the ring means Life, and
    only Life (`person-life-identity.md`).
19. **A second panel language, or a signal that is not an object.** Search
    results, People, Notifications and Messages are ONE transient surface
    brought forward from My World (anchored under the bar, quiet scrim, one
    `sb-surface-in` settle, Escape/scrim/control to leave, focus returned) —
    not a drawer, a command palette, a centred modal or a permanent sidebar.
    A Moment result or a Moment notification lands on THAT Moment; a person
    result opens THAT person. No trending, suggested people, recommendation
    ranking, notification-detail page, pulsing badges, sounds or simulated
    haptics (`s5-s6-discovery-motion.md`).

---

---

## A. How to run

```bash
npm install
npm run dev -- -p 3210
```

- `http://localhost:3210/` — **Cosmos, the universal Home** (Phase 1; frozen).
  Earth is a *state* inside Cosmos (`/?to=earth`), never a route and never a
  signed-in navigation item.
- `http://localhost:3210/world` — **MY WORLD, the personal Home** (identity
  required; a request without one is remembered and continued after the gate).
  `/social` redirects here — "Social" is capability vocabulary only.
- `http://localhost:3210/life` — **LIFE** (the Circle of Life)
- **`http://localhost:3210/style-lab/social` — the Social design reference** (a
  development alias of `/social` with the review harness; never product navigation).
  Controls at the top: width 360 / 768 / desktop · Viewer (Maya owner · Asha,
  no birth time · Bikash → Maya visitor · Asha → Maya visitor) · notifications
  density · simulate failure · Reset · theme. Add `?harness=0` to hide the strip.
  Useful deep links: `?w=360&theme=light`, `?viewer=visitor`, `?bell=1`.
- `http://localhost:3210/style-lab` — the Phase 0 visual system (tokens, materials)

Node 22, Next 16.3.4, React 19.2, Tailwind 4.3. The prototype has no backend; all
state is React memory. Nothing you see persists.

---

## B. Component map (prototype → live Social area)

| Prototype (path under `src/components/style-lab/social/`) | Informs / replaces in the live Social |
|---|---|
| `SocialPreview.tsx` | Page composition: hero · sidebar (counter, Circle) · the white **sheet** with the time rule · load more / end. Also the scoped tokens block (see Port notes › Tokens). |
| `Chrome.tsx` → `TopBar`, `NotificationsPanel` (search field and results panel are internal to `TopBar`) | The top bar: the **Brand** (the SYSTEMBOOM mark linking Home + MY WORLD), search, **Messages**, bell, theme (moves into the account menu as **Appearance** on narrow bars), avatar menu (with a real Logout) — **utilities only, no navigation row**; plus the search results panel and the notifications panel grouped by day |
| `world/model.ts`, `world/WorldProvider.tsx` | The relationship + conversation model of My World: `friend · family · request-in · request-out · none`, seeded conversations, one reducer powering the person card, notification request rows, search chips and chat coherently. **Design fixtures — the live backend already owns friends, the family tree and chat; map, don't rebuild** (`people-chat-integration.md`) |
| `world/PersonCard.tsx` | The person surface: dialog card with Life Ring (band-only), relationship word, one primary action, Message where connected, quiet Remove |
| `identity/PersonIdentity.tsx` | The one Person Identity component — real photo + Life Ring, resolved from the privacy view model for (viewer, subject). Every context above calls this; there is no second avatar system (`person-life-identity.md`) |
| `world/Messages.tsx` | `MessagesButton` (unread dot), `MessagesPanel` (recent conversations), `ConversationBody` (log + input, shared), `MiniChat` (the ONE desktop dock, ≥1024px, bottom-trailing) |
| `world/ChatSurface.tsx` + `src/app/chat/page.tsx` | Full Chat at `/chat` (`?c=<person>` deep link): desktop list + conversation, phone list → full-screen conversation. Same brand/theme/identity — **the live port owes Chat the shared SYSTEMBOOM session; no second login** |
| `ProfileHero.tsx` | The profile header (cover, ring-framed avatar, name + verified, Born/Circle/Contact for the owner; band panel for visitors) |
| `LifeCounter.tsx` | **MY LIFE IN** — the live product's counter, elevated: composite face + single-unit cycle, honesty rule, digit roll |
| `CircleModule.tsx` + `LifeRing.tsx` | The Circle of Life sidebar module (a ring, not the pie) and the ten-band ring used as every avatar frame |
| `Moment.tsx` → `MomentEntry`, `DateRule`, `Notes`, `NoteRow`, `NoteComposer`, `Popover`, `MenuItem` | A **moment** (the live system's "post") on the ledger: readout, kind line, body, media, foot (Respond, counts, ⋯), the note thread (the live system's "comments") |
| `Media.tsx` | Photo / multi-photo / video / link rendering at own aspect |
| `Composer.tsx` + `DateField.tsx` | Create / Edit moment (the live "Create Post" modal): the whole state machine, kind fields, media panel (Photos · Video · Link), the confirmable life readout, validation, posting/failure/discard |
| `view-model.ts` | **The privacy boundary** — what a viewer may render about a person (owner shape vs other shape). Mirrors the API contract in the interaction spec §10 |
| `src/components/shell/destinations.ts` | **The one navigation model** — every destination, its route and whether it exists. The Social bar, the World hub and the shell all read it |
| `src/components/shell/Brand.tsx` | The one persistent global control: the SYSTEMBOOM mark (→ Home) + the context word (MY WORLD / LIFE) |
| `src/components/shell/WorldShell.tsx`, `CosmosRoot.tsx` | The shared internal page frame and the World surface (`/world`) — the scale between Cosmos and Social |
| `life.ts`, `store.tsx`, `data.ts` | Mock arithmetic, mock state, mock content — do not port |
| `src/lib/life-time.ts`, `src/lib/identity/birth.ts` | Reference arithmetic for age / bands / `birthInstant()` precision — port the *rules*, not the files |

---

## C. Mock vs real

**MOCK — prototype-only, do not treat as behaviour to copy literally**

- All content (`data.ts`): people, moments, notes, notifications, the photo
  library. Photography is CC-licensed Wikimedia Commons material for the design
  review only (`public/mock/social/CREDITS.md`).
- Photo date/place "detection" — the library carries hand-written `takenAt` /
  `takenPlace`. In the real system this is EXIF/metadata on upload and is
  **optional**; the manual path must always exist.
- Identity switching (the Viewer control), Reset, "simulate failure".
- Link resolution (700 ms timer, one canned preview).
- Video: poster + duration only; no playback.
- Search results (filter over the mock arrays); Recent searches list.
- "View in Life" — reserved, disabled, honest. Phase 6.
- The `sb-*` `localStorage` keys used elsewhere in the prototype are irrelevant
  to Social.

**REAL DESIGN CONTRACT — build exactly this**

Layout and the white-sheet / time-rule structure · every token value (both
modes) · visual hierarchy of the readout (line one) and the kind line (line two)
· responsive states at 360 / 768 / desktop · media sized to its own aspect,
never letterboxed · motion table with its reduced-motion column · the privacy
presentation (owner vs visitor) · composer states and validation sentences ·
**feed ordering by the moment's own date** · Respond / notes / menus behaviour ·
typography (Geist + Noto Sans Devanagari, tabular numerals, no monospace) ·
spacing · the Circle presentation (ten bands, ring not pie, band-level for
others) · the counter (seven stops, honesty rule, colours as the ring's legend) ·
the date grammar `DD MON YYYY` everywhere, including inputs.

---

## D. Five things not to do

1. **Do not put a card around every moment.** The feed is one white sheet with
   a single vertical hairline; entries are separated by hairlines. If you find
   yourself adding a bordered/shadowed box per post, stop — that is the
   Facebook structure the redesign exists to leave.
2. **Do not send another person's birth-derived data to the browser.** No
   `birthDate`, `birthTime`, birth instant, exact age, day count or band
   calendar years in visitor payloads. The server computes the 15-year band and
   ships only that. Hiding a field with CSS is a failure, not a fix.
3. **Do not translate dark mode into light by inverting it.** Light is the live
   system's own look refined: `#F5F5F6` field, `#FDFDFD` sheet and cards, flat
   white nav with the red plate, generous radii, one soft shadow. No glass, no
   glow in light.
4. **Do not replace the life-position grammar with conventional metadata.** The
   first line of a moment is `name · 34y 10m 06d (own) | 30–45 (others) · place
   · time`, not "avatar · name · 3 hours ago". The date rule shows the moment's
   own date, and the ledger is ordered by it.
5. **Do not invent missing functionality or decoration.** Where the spec says
   "later" or "disabled, honest", ship it that way. No neon, glow, HUD frames,
   gradients, monospace, icon-only kind buttons, rainbow bands, "remaining"
   time, or adverts in the stream.

---

## E. Port notes

### Radix UI

Keep SYSTEMBOOM visuals and motion; use Radix for keyboard and screen-reader
robustness. Do not adopt Radix default styling or default motion.

| Prototype surface | Radix primitive | What Radix gives you for free | What our spec needs that Radix does NOT do |
|---|---|---|---|
| Composer (modal on ≥672px, full-height sheet below) | `Dialog` (`Dialog.Root/Portal/Overlay/Content`) | focus trap, Escape to close, focus return to trigger, `aria-modal`, scroll lock | the **two shells** (sheet vs modal by container width — style `Content`); Escape must close an open picker *first* and the dialog only when no picker is open (`onEscapeKeyDown` → `preventDefault` when a picker is open); the **discard confirm** on close when content exists (`onInteractOutside` / `onEscapeKeyDown` → route to CONFIRM.DISCARD); ⌘/Ctrl+Enter to post; the `Posting…` fill on the button |
| Moment ⋯ menu, note ⋯ menu, avatar menu | `DropdownMenu` (+ `RadioGroup`/`RadioItem` for Change privacy) | arrow-key navigation, typeahead, Escape, focus return, `menuitemradio` semantics | the **inline delete confirm** inside the menu (a `DropdownMenu.Item` that swaps to a two-button row without closing — use `onSelect` with `event.preventDefault()`); the "Now only you." confirmation line after a privacy change; disabled "View in Life — later" item text |
| Privacy selector in the composer | `Select` (or `DropdownMenu.RadioGroup` if you prefer one primitive) | listbox semantics, keyboard selection | the secondary descriptor per option (`anyone · your people · just you`); Health/Problem auto-switching to Only me and restoring on leaving the kind when the person did not touch privacy |
| Who-responded list (tap the count) | `Popover` | anchoring, outside-click close, focus management | nothing extra; keep the 24px life-ring per row |
| Feeling picker | `Popover` + `RadioGroup`, or `DropdownMenu` | as above | the two-column layout and the "none" row |
| Notifications panel | `Popover` or a `Dialog` on phones | as above | grouping by day on a small rule; "Mark all read"; scroll-to-moment on row activation |
| Search results | `Popover` anchored to the field (avoid `Combobox` libraries that impose their own list styling) | outside-click, Escape | Recent list when empty; three groups; the phone variant with its own field |
| Notes reply field, inline note edit | plain controlled inputs (no Radix needed) | — | Enter sends, Shift+Enter newline, Send button on phones, failed-send keep-text |
| Kind buttons | plain `button`s in a `role="group"` (or `ToggleGroup type="single"`) | if ToggleGroup: roving focus, `aria-pressed` | the **word under every button at every width**; choosing the same kind again clears it |
| Counter unit control | plain `button` | — | ←/→ cycling on the control, polite announcement "Showing <unit>." |
| Date fields | plain native `<input type="date">` under a styled display | native picker + accessibility | the display layer in `DD MON YYYY` (see date-fns below) |

Keyboard behaviours in the spec that no primitive provides and you must implement:
⌘/Ctrl+Enter posts · Escape closes the top-most layer only (picker before shell) ·
counter ←/→ · notes Enter/Shift+Enter · arrows reorder photo thumbnails ·
focus lands on the **new moment's readout** after posting (scroll to it; plain jump
under reduced motion).

### date-fns

Base format for every visible date: **`dd MMM yyyy`**, then uppercase the month
token in the rendered string → `10 SEP 2026`. Time: **`HH:mm`** (24-hour).

```ts
import { format } from "date-fns";
export const sbDate = (d: Date) => format(d, "dd MMM yyyy").replace(/[a-z]{3}/i, (m) => m.toUpperCase());
export const sbTime = (d: Date) => format(d, "HH:mm");
```

Rules: never `toLocaleDateString()` for display; never `dd/MM/yyyy` or `MM/dd/yyyy`;
the **display layer of date inputs** also uses `sbDate` (style a label over the
native input; the native picker may open underneath). "TODAY" replaces the date on
the date rule for the current day, with the full date beside it in small type.
Backdated moments carry `shared today` / `shared dd mon yyyy` (lowercase) as
secondary provenance. Ages are `34y 10m 06d` (month and day zero-padded). Bands
use an en dash: `30–45`.

### Icons (Lucide first; custom marks stay custom)

| Prototype glyph | Live system |
|---|---|
| Search, Bell, MessageCircle (chat), Settings2, CalendarDays, MapPin, Image, Video, Link2, Users, Camera, BadgeCheck (verified — colour it navy), ChevronDown, Ellipsis (⋯), X, ArrowLeft/ArrowRight (thumbnail reorder), Smile (feeling), Play | same names in `lucide-react` |
| Kind glyphs — meal (bowl), activity (runner), problem (triangle), health (building + cross), project (checklist), meeting (handshake) | Lucide has close equivalents: `Soup`/`UtensilsCrossed`, `Footprints`/`Activity`, `TriangleAlert`, `Hospital`/`Cross`, `ListChecks`, `Handshake`. Acceptable — single ink, 17px, stroke 1.5–1.75. The **word** beneath is what identifies the kind; the glyph is secondary |
| **Life ring** (ten arcs, tick) | **CUSTOM — recreate exact geometry** from the visual spec §4 (arc math is 20 lines; do not substitute a progress ring component) |
| **Respond mark** (10px ring that fills red when pressed) | **CUSTOM — copy the SVG / recreate**; not a heart, not a thumb |
| **Hourglass** in the counter | **CUSTOM — copy the SVG** (Lucide's `Hourglass` is acceptable only if recoloured red and sized 18px; the prototype's has a filled lower bulb) |
| Red plate logo | your brand asset on a `#D92A20` plate, radius 14px |

Font Awesome is not needed for Social; if it is already global, do not mix its
weights with Lucide in the same row.

### Tokens

The custom properties in the prototype are part of the delivery. Merge strategy:

1. **Global palette** (`src/app/globals.css` in the prototype): `--bg`, `--surface`,
   `--content`, `--content-raised`, `--text`, `--muted`, `--edge`, `--divider`,
   `--steel`, `--ice`, `--boom`, `--boom-strong`, `--boom-soft`, `--success`,
   `--warning`, `--danger`, `--focus`, `--scrim`, plus motion `--m1..--m4`,
   `--ease-out`, `--ease-spatial`. Add these to your `globals.css` under the same
   `:root` / `[data-theme="light"]` scheme (or map onto your existing theme
   attribute).
2. **Social-scoped tokens** (declared on `.sb-social` in `SocialPreview.tsx`):
   `--page`, `--sheet`, `--sheet-bg`, `--sheet-solid`, `--sheet-raised`, `--hair`,
   `--rule`, `--navy`, `--unit-grey`, `--card`, `--card-edge`, `--card-shadow`,
   `--sheet-shadow`, `--sheet-radius`, `--gutter`, `--rule-x`, `--bleed`. Promote
   these to `globals.css` with a `--sb-` prefix if your file is flat, or keep them
   scoped to the Social root element as the prototype does.
3. **Likely collisions with an existing live `globals.css`** (check before merging):
   `--bg`, `--text`, `--muted`, `--surface`, `--card`, `--page`, `--focus`,
   `--danger`, `--success`, `--warning`, `--navy`, `--edge`. If a name already
   exists with a different meaning, prefix ours (`--sb-…`) rather than changing
   the values; the values are the contract.
4. Light Social values are **not** the global light palette (`--bg #e8ecf3`): the
   sheet is `#FDFDFD` on a `#F5F5F6` field by design. Keep both.

---

## F. Ordering and privacy — two server-side rules that are easy to get wrong

- **Feed order** = the moment's own `at` (date/time), newest first. Not
  `createdAt`. A moment backdated to 1983 sorts to 1983. Page cursors should be
  on `at`, not on the row id.
- **Visitor payloads** never contain birth-derivable fields (see interaction
  spec §10). The band string and index are the only life data about another
  person that leaves the server.

---

## G. Implementation order — one month, incremental, live stays working

One recommended sequence. Each step leaves the live Social usable; ship behind a
feature flag or route-level toggle if you need to. Do not attempt a big-bang rewrite.
Per step: **files** to inspect in the prototype · **replaces** in live · **API** data
needed (see `social-api-contract.md`) · **backend?** · **responsive** states ·
**a11y** · **accept** before moving on · **don't copy** (mock infrastructure).

### 1 · Tokens + typography
- files: `src/app/globals.css` (palette, motion), `SocialPreview.tsx` (`.sb-social` scoped tokens), `src/app/layout.tsx` + `public/fonts/noto-sans-devanagari/` (@font-face "SB Devanagari" with the weight offset)
- replaces: the live `globals.css` theme values for the Social area; the live font stack on Social pages
- API: none · backend? **no**
- responsive: none yet · a11y: focus ring tokens (`--focus`), contrast of `--muted` on `--sheet`
- accept: `social-visual-qa.md` LIGHT + DARK token lines pass on a blank Social page in both themes; Devanagari sample renders at the offset weight; no monospace loaded
- don't copy: the Phase 0 `--bg #e8ecf3` light field as the Social field (Social uses `--page #F5F5F6`); the `.sb-social` class name itself is optional

### 2 · Global Social shell / chrome
- files: `Chrome.tsx` (`TopBar`, `NotificationsPanel`), `SocialPreview.tsx` (page grid), `social-visual-spec.md` §3, §5.1, §5.9, §5.10
- replaces: the live top bar (Dashboard → **World**), search field, bell, avatar menu; the page grid under it
- API: current viewer (§A), unread count; search and notifications keep their existing endpoints · backend? **no** (rename only)
- responsive: nav inline (desktop) / row under the bar (≤1023); search → icon on phones; sidebar exists only ≥1024
- a11y: `aria-current="page"` on World; bell `aria-expanded`; Escape closes panels; focus returns
- accept: QA GLOBAL nav lines + LIGHT "flat white nav" + DARK "glass on the top bar only" pass; no horizontal scroll at 360
- don't copy: `href="#"` nav links, the harness strip, `?w=` frame widths, the `--frame-w` variable, the `data-sb-*` attributes

### 3 · Profile hero
- files: `ProfileHero.tsx`, `LifeRing.tsx` (`RingAvatar`), `view-model.ts`, visual spec §5.2, content rules §7
- replaces: the live profile header (cover, avatar, name, cake-icon birthday, contact)
- API: §B for oneself, §C for others; **the server must already return the band-only visitor shape** · backend? **yes — the privacy split (§12 depends on it; start it now)**
- responsive: cover max-h 160/260; avatar 72/96; the counter lives here below 1024 (step 10 fills it — leave the box empty or hide until then)
- a11y: name is the page `h1`; readout is a `<dl>` for the owner only; ring decorative (`aria-hidden`) with the position in the label
- accept: QA PROFILE — OWNER and PROFILE — VISITOR pass except the counter lines; DOM search for another person's DOB finds nothing
- don't copy: `PEOPLE` fixtures, `viewer`/`ashaVisitor` modes, `now()` from `src/lib/clock.ts`

### 4 · Almanac feed structure
- files: `SocialPreview.tsx` (sheet, rule, composer bar row, load more / end), `Moment.tsx` → `DateRule`, `store.tsx` → `orderFeed`, `dateKey`, interaction spec §8, wireframes §1, §2, §6
- replaces: the live card list with relative times
- API: §D list ordered by `at` desc with cursor + remaining (§G) · backend? **yes — ordering by the moment's own date and `sharedAt` provenance**
- responsive: gutter 28/40, rule x 13/19, sheet radius 24 (light) / none (dark)
- a11y: the ledger is a list; date rules are headings (`h3`); "Load more" is a button with the count
- accept: QA FEED lines pass with real data: one rule per day, TODAY label, backdated moment at its own date with "shared …", end sentence
- don't copy: `visible: 8` paging in React state, `SEED_MOMENTS`, `orderFeed`'s in-memory sort (the server orders)

### 5 · Moment base component
- files: `Moment.tsx` → `MomentEntry` (readout, place line, body, foot), `view-model.ts` → `momentLifeFor`, `personViewFor`, visual spec §5.5, content rules §3
- replaces: the live post header/body
- API: §D fields `author`, `at`, `place`, `feeling`, `body`, `privacy`, `edited`, `lifeAtMoment` · backend? **yes — `lifeAtMoment` exact for own / band for others**
- responsive: one-line readout ≥672 (place truncates), two lines on phones; body 16/17
- a11y: readout is the focus target after posting (`tabIndex=-1`); time in a `<time>` element; "more"/"less" is a button with `aria-expanded`
- accept: QA MOMENT lines 1–4 pass; another person's exact age appears nowhere
- don't copy: `formatDate` / `formatTime` helpers (use date-fns per §E), `data-sb-at`

### 6 · Media
- files: `Media.tsx` (`MediaBlock`), visual spec §3 "Media extent / sizing", `public/mock/social/` for aspect variety
- replaces: the live cropped/fixed-height post images and video card
- API: §D.2 with `width`/`height` on every photo and poster · backend? **yes if the upload pipeline does not store dimensions**
- responsive: bleed to the sheet edge at <672 (radius 0); gutter → edge radius 4 above; Health/Problem inset always
- a11y: alt text; the play disc is a button; "+N" tile is a button; lazy loading
- accept: QA MEDIA passes on portrait, panorama, 9:16 video, ten photos, link — nothing letterboxed or cropped
- don't copy: `LIBRARY` / `takenAt`, the CC photo set (licensed for design review only), `example.org` link resolution

### 7 · Respond / Notes / menus
- files: `Moment.tsx` → `RespondMark`, `Notes`, `NoteRow`, `NoteComposer`, `Popover`, `MenuItem`; interaction spec §3, §4; content rules §8, §9
- replaces: heart/thumbs reaction, comments list, share button, ⋯ menus
- API: §D `respond`, `notes`, `viewer` permissions; §D.4 notes with one reply level · backend? **only if the live comments API lacks reply-parent or per-note respond** (keep existing endpoints otherwise)
- responsive: Respond word always visible; Send button on phones; View in Life in ⋯ only on phones
- a11y: Respond `aria-pressed`; who-list is a dialog/popover with Escape; menus via Radix `DropdownMenu`; delete confirm inline
- accept: QA RESPOND + NOTES pass; Health/Problem show no Respond
- don't copy: `systemboom.example` copy-link URL, `say()` toasts' timings as spec (1800ms is fine but not contractual), `fortyNotes()`

### 8 · Composer
- files: `Composer.tsx` (whole machine), `DateField.tsx`, `docs/design/composer-states.md`, interaction spec §2, content rules §10
- replaces: the live "Create Post" modal
- API: create/edit moment (§D shape), upload returning `width/height` (+ optional `takenAt/takenPlace`), link preview endpoint if one exists · backend? **yes — `at` + `sharedAt` on create, kind fields, privacy default for health/problem**
- responsive: modal 560 ≥672 / full-height sheet below; kind row scrolls at 360 with words
- a11y: Radix `Dialog`; focus enters the text area; Escape layer rule; ⌘/Ctrl+Enter; discard confirm; Posting… state announced
- accept: QA COMPOSER passes; the backdated flow lands the moment at its date with "shared today" and focus on its readout
- don't copy: the 900ms fake posting timer, `simulateFailure`, the 700ms link shimmer's timing as network truth, `T12:00:00` preview instant (see the open question in `social-feature-parity.md` §Open)

### 9 · Moment kinds
- files: `Composer.tsx` → `KINDS`, `KIND_FIELDS`; `Moment.tsx` kind line, `QUIET_KINDS`; content rules §3 table
- replaces: the live seven icon buttons and their post variants
- API: §D.3 field sets · backend? **yes if any field (e.g. project `since`, meeting `with[]`) is not stored today**
- responsive: kind fields 2 columns ≥672 / 1 column below
- a11y: kind buttons `aria-pressed` in a `role="group"`; required fields announced via the "Needed: …" line
- accept: QA KINDS passes; Health/Problem default Only me and restore on leaving
- don't copy: nothing specific — the field definitions are the contract

### 10 · MY LIFE IN
- files: `LifeCounter.tsx`, `life.ts` (`UNITS`, `availableUnits`, `unitTotal`, `compositeFace`, `digitSize`, `nextRoundDays`), `src/lib/life-time.ts` (`computeLifeTime`), visual spec §5.3, content rules §5
- replaces: the live MY LIFE IN card (keep its function; elevate its presentation)
- API: §E for the viewer (precision decides the honesty rule) · backend? **no if the viewer's birth instant is already client-side; yes if you choose server-derived `secondsLived`**
- responsive: hero scale (×0.68) below 1024, module at desktop — exactly one instance
- a11y: unit control ←/→, polite live region "Showing <unit>."; digits not announced every second (`aria-live` off on the face)
- accept: QA COUNTER passes; seven faces; no milliseconds; unknown birth time stops at days; one counter per breakpoint
- don't copy: `useSyncExternalStore` hydration gate as-is (fine to reuse), the harness "Asha (no birth time)" identity

### 11 · Circle sidebar module
- files: `CircleModule.tsx`, `LifeRing.tsx` (interactive arcs), `view-model.ts` → `ringViewFor`, `life.ts` → `bandCalendarYears`, visual spec §4, §5.4, content rules §6
- replaces: the live 3-D pie chart card (date picker, gear, drill-down link) — the date picker becomes an informational `today · DD MON YYYY` line; time navigation belongs to the full Circle (`circle-of-life-spec.md`)
- API: §B `circle` (owner) / §C `circle` (visitor) · backend? **yes — `momentsByBand`, `momentsThisMonth`, and the band-only visitor shape**
- responsive: 220px ring in the card at every width; compact variant unused in the accepted page
- a11y: arcs focusable with the announced label (owner: years + count; visitor: band + lived/unwritten, no count)
- accept: QA CIRCLE passes for owner and visitor; "Open Life" links to the Circle of Life route
- don't copy: nothing here re-renders history — the module is glanceable only

### 12 · Owner / visitor privacy contract (end-to-end)
- files: `view-model.ts`, `prototype-tests/social-final.js` section 2 (the assertions to reproduce), interaction spec §10, visual spec §10, `social-api-contract.md` §C
- replaces: any current endpoint that returns another user's `dob`, birthday or age
- API: every payload carrying a person uses `PersonRef` (band only) · backend? **yes — this is the one non-negotiable backend change**
- responsive: n/a · a11y: n/a
- accept: an automated test logs in as a visitor and asserts the owner's DOB string, birth time and day count appear in **no** response body and **no** DOM in both themes at desktop and 360; reverse direction too
- don't copy: `FORBIDDEN_ON_OTHER` as a runtime filter — the server must not produce the fields in the first place

### 13 · Mobile + tablet
- files: every component's `@2xl:` / `@5xl:` / `@max-*` variants; visual spec §6; wireframes §2
- replaces: the live responsive layout of Social
- API: none · backend? **no**
- responsive: the whole §6 table; verify with container queries or media queries at 672 and 1024
- a11y: touch targets ≥ 36px; the kind row scroll is keyboard-reachable
- accept: QA 360 MOBILE + TABLET pass; no horizontal page scroll; one counter per breakpoint
- don't copy: the `@container` harness frame — in live the container is the page

### 14 · Accessibility + reduced motion
- files: `useFocusTrap`-style behaviour inside `Composer.tsx`, `MotionConfig reducedMotion="user"` in `layout.tsx`, the `sb-roll` / `sb-land` keyframes and their `prefers-reduced-motion` handling in `LifeCounter.tsx` / `Moment.tsx`
- replaces: whatever the live modal/menu code does today
- API: none · backend? **no**
- responsive: n/a · a11y: everything in QA ACCESSIBILITY + REDUCED MOTION
- accept: those two QA sections pass with a screen reader pass on the composer, a menu and the counter
- don't copy: `emulateMediaFeatures` test plumbing

### 15 · Final parity / QA
- files: `docs/handover/social-visual-qa.md`, `social-reference-index.md`, `social-feature-parity.md`
- replaces: nothing — verification
- API: n/a · backend? **no**
- accept: every QA line PASS in light and dark at 360 / 768 / desktop; every class-A parity item present; the "change the logo" question answered NO on the feed, the hero and the composer
- don't copy: the prototype's screenshots as pixel targets for content — copy structure, tokens, type and rhythm; the content is mock

---

## H. Component contract table

| Prototype component (path under `src/components/style-lab/social/`) | Live responsibility | Required props / data | Owner-only data | Visitor-safe data | Important events | Radix primitive | Mobile difference | Do not change |
|---|---|---|---|---|---|---|---|---|
| `ProfileHero.tsx` → `ProfileHero({ viewer, subject })` | Profile header (owner and visitor) | `PersonView` (name, avatar, cover, home, verified, contact?) + `LifeView` (`OwnerLife` \| `OtherLife`) + `RingView` | Born row, birth time / "birth time unknown", day count, contact pill, counter (below desktop), cover/avatar edit actions | name, verified, home, cover, band label, band-level ring | edit cover / avatar (owner) | none | avatar 72, cover ≤160, counter box present; radius 24 | visitor has no `<dl>`, no tick; counter never at desktop |
| `Moment.tsx` → `MomentEntry({ moment, showDate, onEdit })` + `DateRule` | One moment on the ledger + its day rule | `Moment` (§D), the viewer id, `momentLifeFor` result (`exact?`, `band`) | exact age on own moments; Edit / Change privacy / Delete | band, name, ring, place, time, feeling, body, media, counts | Respond, open who-list, expand notes, ⋯ actions, more/less, edit | `DropdownMenu` (⋯), `Popover` (who-list) | readout two lines; media bleeds; View in Life in ⋯ only; foot wraps | line-1 grammar and order; no card; Respond word visible; Health/Problem no Respond |
| `LifeRing.tsx` → `LifeRing({ person, ring, size, positionLabel, interactive?, bandYears?, onBand? })`, `RingAvatar` | Every avatar frame + the 220px Circle ring | `PersonView`, `RingView` (`bandIndex`, `fraction?`, `momentsByBand?`) | `fraction` → red tick and split band | `bandIndex` (+ optional activity counts) | band hover/focus (interactive only) | none | stroke by size (2/3/10) | geometry, opacities, tick rule, ten bands |
| `LifeCounter.tsx` → `LifeCounter({ life: OwnerLife, scale, showNextRound })` | MY LIFE IN | `OwnerLife` (birth truth or server-derived seconds + precision) | everything — the component never receives another person | none (visitors get a sentence card at desktop, nothing below) | unit cycle (tap, ←/→), announce "Showing <unit>." | none | hero scale ×0.68 below desktop | seven faces, no ms, honesty rule, unit colours, digit roll |
| `CircleModule.tsx` → `CircleModule({ viewer, subject, moments })` | Circle of Life sidebar card | `LifeView`, `RingView`, activity counts | day count, calendar years, date field, settings, Open Life | band label/index, activity counts | band hover/focus, date change (owner), Open Life (disabled) | none (`Popover` if the date picker is custom) | card full width; same ring size | ring not pie; visitor band-only, no tick, no years |
| `Composer.tsx` → `Composer({ open, onClose, initial })` + `DateField.tsx` → `DateField({ value, onChange, max, label })` | Create / edit a moment | `Draft` (text, kind, fields, privacy, feeling, date, place, media, editingId), viewer home, viewer birth instant (preview), library/upload results | the age preview ("This moment will sit at …") | n/a (owner-only surface) | post, save, cancel, discard/keep, kind change (privacy auto-switch), media add/remove/reorder, detection confirm/change, link resolve | `Dialog`; `Select`/`DropdownMenu.RadioGroup` (privacy); `Popover` (feeling); `ToggleGroup` optional (kinds) | full-height sheet; kind row scrolls with words; Send/Post 40px | body order (readout first), validation sentences, date grammar, 2,000 limit, 10 photos, no icons-only kinds |
| `Chrome.tsx` → `TopBar({ onBell, bellOpen, active })`, `NotificationsPanel({ onClose })` | Top bar, nav, search, bell, avatar menu, notifications | viewer `PersonView`, unread count, nav active item, search results (photos/people/places), notifications grouped by day | own avatar ring (with tick) | people in search/notifications as `PersonRef` (band ring, no age) | open/close panels, mark read, mark all read, theme toggle, logout | `Popover` (search, notifications), `DropdownMenu` (avatar) | nav row under bar; search → icon; panel full width | nav names (World), flat white light bar, glass only in dark |
| feed / day rule (`SocialPreview.tsx` ledger + `DateRule`) | The sheet, the rule, ordering, day rules, load more / end | ordered moments (`at` desc), `sharedAt`, cursor + remaining | composer bar (owner) | everything else | load more, settle on posted moment | none | gutter 28 / rule 13; sheet radius 24 top | one rule per day; own-date ordering; end sentence |
| Respond interaction (`Moment.tsx` → `RespondMark`, foot button, who-list `Popover`) | The one reaction | `respond { count, byViewer }`, responders as `PersonRef[]` | own pressed state | count, responders (band rings) | toggle, open who-list | `Popover` | word always visible | one reaction, ring mark, no picker, absent on Health/Problem |
| Notes (`Moment.tsx` → `Notes`, `NoteRow`, `NoteComposer`) | Thread of notes with one reply level | notes (§D.4), viewer permissions | "(you)", Edit/Delete on own notes | text, author `PersonRef`, time, counts | send (Enter), reply, edit, delete, respond, view more/collapse, retry | `DropdownMenu` (⋯) | Send button visible; helper hidden | depth one; ring only, no age; failed-send keeps text |
| share / menu surfaces (`Moment.tsx` → `MenuItem`, `Popover`; avatar menu in `Chrome.tsx`) | ⋯ menus, privacy radio, delete confirm, Report/Hide/Copy link, account menu | permissions, current privacy | Edit, Change privacy, Delete | Report, Hide, Copy link | select, confirm, cancel | `DropdownMenu` + `RadioGroup` | same | inline delete confirm; confirmation sentences; "View in Life — later" disabled |
| search / profile result identity presentation (`Chrome.tsx` search results, who-list rows, notification rows) | How a person appears anywhere outside their own hero | `PersonRef` (id, name, avatar?, bandIndex, bandLabel) | none | all of it | navigate to profile | `Popover` | list rows unchanged | 24px band-level ring, name, nothing about age |

---

## I. Portability — prototype-only infrastructure that must not escape to live

These exist so the prototype can run without a backend or be driven by tests. Each is
useful here and wrong in production. Label, do not copy.

| Prototype assumption | Where | What live does instead |
|---|---|---|
| Identity is a mock `Person` from `PEOPLE` (Maya, Asha, Bikash, …) selected by the harness `Viewer` control; `visitor` / `ashaVisitor` modes | `data.ts`, `store.tsx` (`ViewerMode`, `viewerPerson`, `profilePerson`, `actingPerson`) | the signed-in user from the existing auth; the profile subject from the route |
| The prototype's global identity gate stores a created identity in `localStorage` (`sb-identity`, `sb-session`) — **Social itself reads none of it** | `src/lib/identity/store.ts` (Phase 2) | existing session handling; nothing in Social touches storage |
| All state is an in-memory reducer (`SocialStore`); posting, editing, notes, hide, respond, mark-read are local; Reset restores the seed | `store.tsx` | REST calls + optimistic updates; the reducer's action list is a good checklist of mutations |
| Moment creation timestamps: `at = date + current clock time`; `sharedAt = now` when backdated; `id = m-new-<n>` | `Composer.tsx`, `store.tsx` | server assigns ids and `sharedAt`; see the open question on backdated time in `social-feature-parity.md` |
| Mock photo metadata `takenAt` / `takenPlace` hand-written on `LIBRARY` entries drives the DETECTED readout | `data.ts`, `Composer.tsx` | EXIF/metadata from the upload pipeline, optional |
| 28 CC-licensed Wikimedia photos and one cropped poster | `public/mock/social/`, `CREDITS.md` | the user's own uploads; the CC set is for design review only |
| Fixed link resolution: 700ms timer, `example.org` → canned preview | `Composer.tsx` | a real unfurl endpoint or none (plain text) |
| Fixed posting delay 900ms and `simulateFailure` toggle | `Composer.tsx`, harness | real network; the failure state is the design, the toggle is not |
| The clock is injectable (`src/lib/clock.ts` `now()`, `NEXT_PUBLIC_SB_FIXED_NOW`) | everywhere dates are computed | `new Date()` / server time |
| Page size 8, `visible` counter, 24 seed moments, 40-note thread, 21 visible after filtering | `store.tsx`, `data.ts` | server pagination (§G); counts are fixture facts, not requirements |
| Dev hooks `window.__SB_VM_OTHER_KEYS` (and the Phase 1/2 `__SB_STATE`, `__SB_CAM`, `__SB_IDENTITY`) | `SocialPreview.tsx`, Cosmos | none |
| `data-sb-*` attributes (`data-sb-moment`, `data-sb-at`, `data-sb-readout`, `data-sb-ring`, `data-sb-hero`, `data-sb-circle`, `data-sb-counter*`, `data-sb-date-rule`, `data-sb-date-display`, `data-sb-kind-row`, …) | every component | test hooks — keep your own `data-testid`s; they are not semantics. The a11y attributes (`aria-*`, roles) **are** part of the design |
| Route `/style-lab/social`, the harness strip, `?w=360|768|desktop`, `?theme=`, `?viewer=`, `?bell=`, `?notifications=`, `?fail=1`, `?harness=0`, the `@container` frame and `--frame-w` | `src/app/style-lab/social/page.tsx`, `SocialPreview.tsx` | the real Social route; the viewport is the container |
| Copy-link writes `https://systemboom.example/m/<id>` | `Moment.tsx` | the real canonical URL |
| Search filters the mock arrays; Recent searches are a constant | `Chrome.tsx`, `data.ts` | existing search API |
| The Circle module's `today · DD MON YYYY` line is informational; the full Circle's Jump to date is the only date control | `CircleModule.tsx`, `circle/CircleView.tsx` | one time model — do not reintroduce a sidebar date picker |
| "View in Life", Chat, Statistics/Weather/Exchange/Settings are disabled placeholders; "Open Life" links to the Circle of Life | `Moment.tsx`, `CircleModule.tsx`, `Chrome.tsx` | keep the placeholders disabled and honest until their phases; Open Life routes to the Circle (Phase 5) |

---

## J. Internationalization (Phase S1 — Global Language Foundation)

SYSTEMBOOM is a multilingual global product. The full contract is in
`docs/i18n/architecture.md`; the binding live-port obligations are in
`docs/handover/i18n-live-contract.md`. In brief:

- **8 first-class locales** (en, es, it, nl, ru, hi, ne, zh-Hans), native names, **no
  country flags**. Source of truth: `src/lib/i18n/config.ts`.
- **Routes never change with language.** Language is a product-wide preference resolved
  from cookie + headers (`src/lib/i18n/server.ts` → `resolveRequestLocale()`), not the
  URL. Priority (binding): **profile → manual-device → browser → region → English.**
  User choice always wins; location is never proof of language.
- **Flash-free first paint**: SSR renders the resolved locale and `<html lang dir>`
  before paint; the client is seeded with the same locale. No wrong-language flash, no
  hydration mismatch. **`Intl` month names are shipped (not read from ICU) and all
  formatters are pinned to `numberingSystem: "latn"`** so SSR and any browser agree —
  do not regress this (see the live contract).
- **System text is localized; human text (Moment words, names, places, chat) is never
  auto-translated** and never sent to a translation service.
- **One selector** (`src/components/i18n/LanguageMenu.tsx`), mounted pre-login in Cosmos
  and inside the Account menu when authenticated — never a top-bar icon.
- Messages: dotted-key catalogs (`src/lib/i18n/catalogs/<locale>.ts`), meaning-keys,
  CLDR-ordered plural forms (Russian one/few/many), English fallback. English values are
  byte-identical to the product's canonical strings, so the accepted S0 suites are
  unaffected; only non-English output differs.
- Every non-English catalog is **`draft — awaiting native review`**
  (`docs/i18n/translation-status.md`). Do not present a locale as complete before review.
- Tests: `prototype-tests/locale-resolution.js` (the §5 matrix, Node) and
  `prototype-tests/i18n.js` (browser: first paint, no hydration error in a limited-ICU
  browser, deterministic formatting, human-content-untranslated, context-preserving
  switch). Evidence: `prototype-evidence/i18n-s1/**`.
