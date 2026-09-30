# SOCIAL BIBLE AUDIT — SCREENSHOT INDEX

**Phase 0 · evidence audit · 2026-09-16.**
**51 captures**, all under `references/social-bible-audit/evidence/`.
Machine-readable manifests: `_manifest-pass1.json`, `_manifest-pass2.json`.

---

## Capture method — stated honestly

| Fact | Detail |
|---|---|
| Product code changed | **none.** Read-only throughout. |
| Application | the repository's own unmodified source, served by `next dev` (Next.js 16.3.4, Turbopack) on port 3210 |
| Browser | headless Chromium 1194 via `puppeteer-core`, `deviceScaleFactor: 1` |
| Where it ran | **not on the owner's Mac.** The audit environment could not reach a browser on the device, so the source tree (`src/`, `public/mock`, `public/brand`, `public/fonts`, the config files and `package-lock.json`) was copied unmodified into the audit sandbox and `npm ci` was run there. **Nothing was written back into the repository except these PNGs and the audit documents.** |
| Data | the repository's **existing documented fixtures** — `SEED_MOMENTS` (23), `PEOPLE` (16), `SEED_NOTIFICATIONS` (9), `SEED_CONVERSATIONS` (3). **No data was fabricated for a screenshot.** |
| Harness | only review query parameters that already exist on the development alias (`?w=`, `?theme=`, `?viewer=`, `?bell=1`, `?composer=1`, `?harness=0`, `?pulse=`, `?lang=`). These are gated off the product route by `SocialPreview.tsx:448`. |
| Identity for product routes | the prototype's own demo session (`localStorage["sb-session"] = {identityId:"u-demo-001", …}`) — the same "Enter as Maya Rai (demo identity)" path the identity gate offers. No product code was altered to bypass the gate. |
| Clock | live. The captures read **16 SEP 2026**, `12,735 days`, `34y 10m 12d`. These values move; the *shapes* are the evidence. |

### Three honest caveats about what you are looking at

1. **The small dark circle at the lower-left of every capture is the Next.js dev-mode indicator**,
   not a product element. These are `next dev` captures, not a production build.
2. **Shot 44 is the Cosmos *fallback***, not the 3D scene. The audit sandbox has no GPU and the
   `public/cosmos/` textures were deliberately not copied (they are irrelevant to Social).
   `?cosmos=fallback` is the repository's own documented no-WebGL path (used by
   `prototype-tests/gate-fallback.js`). The 3D Cosmos is Phase 1 and outside this audit's scope.
3. **Mobile captures are the 360px design frame** (`?w=360`) inside a 420×900 viewport, which is
   how every accepted suite in this repository measures 360. They are not a physical-device run,
   and no safe-area, notch or virtual-keyboard behaviour is claimed — consistent with the
   repository's own honesty rule in `_capture-s7.js`.

---

## DESKTOP · LIGHT (1440×900, `?w=desktop&harness=0&theme=light`)

| File | Surface | What it evidences |
|---|---|---|
| `01-desktop-light-my-world-owner.png` | My World, owner | The whole owner hero: World Wall, Life Instrument, "MY WORLD" kicker, name + verified, `band 30–45 · 12,735 days  Life →`, the Born line, the **owner-only contact pill**, View as public / Change cover photo / Who can see your profile; sidebar counter + Circle module; composer entry bar |
| `02-desktop-light-almanac-moments.png` | The Almanac | Chronological stream, one date rule per day, the spine, media bleed, action row + presence line |
| `03-desktop-light-person-visitor.png` | Visitor view | Light-theme counterpart of shot 12 — no Born line, no contact, band-only Life |
| `04-desktop-light-people-panel.png` | People utility | Find someone · Requests (Wants to connect / Waiting on them) · Your people; per-state actions |
| `05-desktop-light-search.png` | Search | People · Moments · Photos · Places against the term "bou"; `data-sb-search-life` band text |
| `06-desktop-light-notifications.png` | Notifications | Day-grouped rows, the request row first with Accept / Decline, unread dots |
| `07-desktop-light-composer.png` | Composer | **Memory-first** body order: words first, then the one coordinate sentence, then feeling + counter, then kind chips. No boxed "WHERE THIS SITS" block (evidence for C-1) |
| `08-desktop-light-expression-horizon.png` | Expression picker | The Emotion Horizon in light: one vessel, six core objects, caption, More |
| `09-desktop-light-human-pulse-100.png` | Human Pulse | `?pulse=100mixed` — ≤3 equal lenses + "100 people" on the same 36px line |

## DESKTOP · DARK (1440×900)

| File | Surface | What it evidences |
|---|---|---|
| `10-desktop-dark-my-world-owner.png` | My World, owner | **The primary owner-privacy exhibit.** Born `04 NOV 1991 · 06:42`, contact pill "ONLY YOU SEE THIS", counter `34 10 12` + `04 34 24`, "Your 13,000th day is in 265 days", Circle module `12,735 DAYS`, `band 30–45 · 2021–2036`, "4 moments recorded this month", red present tick on the ring |
| `11-desktop-dark-almanac-moments.png` | The Almanac | dark counterpart of 02 |
| `12-desktop-dark-person-visitor.png` | Visitor (Bikash → Maya) | **The primary visitor-privacy exhibit.** Brand reads `MAYA'S WORLD`; no Born line, no contact pill, no View-as-public, no composer; `Friends` + `Message`; "Circle band 30–45 — the exact age is theirs to share"; counter replaced by "A person's counter is theirs to see. Band 30–45"; Circle module shows `30–45 BAND` with no count and no tick. **And the correct positive control:** Bikash's own Moment shows *his* exact age `38y 01m 20d` while Ramesh's shows only `30–45` |
| `13-desktop-dark-people-panel.png` | People utility | dark counterpart of 04 |
| `14-desktop-dark-search.png` | Search | dark counterpart of 05 |
| `15-desktop-dark-notifications.png` | Notifications | dark counterpart of 06 |
| `16-desktop-dark-composer.png` | Composer | dark counterpart of 07 |
| `17-desktop-dark-expression-horizon.png` | Expression picker | **The current picker as implemented (R3.8/R3.9).** ONE vessel with a lit core in its chamber, six free-standing core objects on a shallow horizon, the caption naming the attended feeling ("Care"), More outside the scroller |
| `18-desktop-dark-messages-panel.png` | Messages utility | Conversation rows, message-unread dot, "Open Chat" |
| `19-desktop-dark-account-menu.png` | Account | The account popover — Appearance, the embedded Language menu, Logout |
| `20-desktop-dark-person-card.png` | Person surface | `PersonCard` opened from a Moment author: 56px identity, band-only life fact, one primary action |
| `21-desktop-dark-responses.png` | Responses | A Moment's written conversation expanded inline, with the response branch off the spine |
| `22-desktop-dark-view-as-public.png` | View as public | The owner previewing their own World through the exact visitor-safe model |
| `23-desktop-dark-quiet-kinds.png` | Health / Problem | The private record: no Respond, no Expression control, no Human Pulse, "only you". **Also the evidence for C-15** — the response affordance is still present |
| `24-desktop-light-visitor-life-module.png` | Visitor Life module | Band only, no counts, no tick, no "Open Life" |
| `25-desktop-dark-life-cursor.png` | Life Cursor | Active once genuine history (the 1983 Moment) has scrolled past the trigger line |
| `26-desktop-dark-expression-atlas.png` | Emotion Atlas | All **eighteen** expressions as named core objects in four family bands |
| `27-desktop-dark-expression-spectrum.png` | Expression Spectrum | Canonical order, truthful counts, **no bars, no percentages, no ranking** |
| `28-desktop-dark-moment-kinds.png` | Moment kinds | MEAL / ACTIVITY / PROJECT / MEETING readouts in the stream |

## MOBILE · the 360 design frame (viewport 420×900, `?w=360`)

| File | Surface |
|---|---|
| `30-mobile360-light-my-world-owner.png` | My World owner, first screen, light — the centred stack, cover at `h-[92px]`, Manage-profile disclosure |
| `31-mobile360-dark-my-world-owner.png` | same, dark |
| `32-mobile360-dark-person-visitor.png` | Visitor Person World at 360 |
| `33-mobile360-dark-first-moment.png` | The first Moment at 360 — edge-to-edge media bleed |
| `34-mobile360-dark-composer.png` | The Composer as a full-height sheet (`inset:0`) |
| `35-mobile360-dark-people.png` | People panel as a full-width sheet under the bar |
| `36-mobile360-dark-search.png` | The phone search sheet: Back · field · Clear |
| `37-mobile360-dark-expression.png` | The Emotion Horizon at 360 — vessel 88px, six cores at 36px in 46px hit targets |
| `38-mobile360-dark-notifications.png` | Notifications at 360 with 44px Accept / Decline |
| `39-mobile360-light-almanac.png` | The Almanac at 360, light |

## ROUTES (product, signed in as the demo identity)

| File | Route | What it evidences |
|---|---|---|
| `40-route-world-dark.png` | `/world` | The product route renders the same My World as the development alias, **without** the harness bar |
| `41-route-world-light.png` | `/world` | light |
| `42-route-life-dark.png` | `/life` | The Circle of Life: ten bands, `AGE 34`, `YOUR LIFE 34y 10m 12d`, the red present tick, `30–45 · 2021–2036 · partly lived · 6 Moments`, "Turn · tap to look closer · Esc to come back" |
| `43-route-chat-dark.png` | `/chat` | The Chat surface under `WorldShell` (Brand + theme only) |
| `46-route-chat-deeplink.png` | `/chat?c=p-asha` | The conversation deep link resolves |
| `47-route-social-redirect.png` | `/social` | The compatibility redirect lands on My World |
| `48-route-world-mobile360.png` | `/world` at 390×844 | The product route on a phone viewport |
| `49-route-life-mobile360.png` | `/life` at 390×844 | The Circle on a phone viewport |
| `44-route-root-cosmos-fallback.png` | `/?cosmos=fallback` | The Cosmos root in its **documented no-WebGL fallback** — see caveat 2 above |
| `45-route-style-lab-circle.png` | `/style-lab/circle` | The Circle's development alias |

## LOCALE

| File | Locale | What it evidences |
|---|---|---|
| `50-desktop-dark-locale-ne.png` | `ne` नेपाली | **The single best i18n exhibit.** Localized: brand context (मेरो संसार), search placeholder, hero kicker, `ब्यान्ड 30–45 · 12,735 दिन जीवन →`, the contact pill, all three owner-footer actions, Respond (जवाफ दिनुहोस्), View in Life (जीवनमा हेर्नुहोस्), Write a response (उत्तर लेख्नुहोस्), MEAL→खाना, with 3→3 सँग, the date `10 सेप्टेम्बर 2026`, MY LIFE IN→मेरो जीवन, CIRCLE OF LIFE→जीवन चक्र, "यस महिना 4 क्षण दर्ता", Open Life→जीवन खोल्नुहोस्. **Still English (the documented carryovers, all visible on one screen):** the composer prompt's exact-age primitive `34y 10m 12d`, the counter's unit row `years · months · days`, and the whole sentence "Your 13,000th day is in 265 days" |
| `51-desktop-dark-locale-zh.png` | `zh-Hans` 简体中文 | CJK rendering with the `:lang(zh-Hans)` letter-spacing correction |
| `52-desktop-dark-locale-ru.png` | `ru` Русский | Cyrillic, including the plural forms |

---

## Coverage against the brief's minimum list

| Required | Provided |
|---|---|
| Desktop light: My World owner | 01 ✅ |
| Desktop light: Person visitor | 03 ✅ |
| Desktop light: Moment / Almanac | 02 ✅ |
| Desktop light: People | 04 ✅ |
| Desktop light: Search | 05 ✅ |
| Desktop light: Notifications | 06 ✅ |
| Desktop light: Composer | 07 ✅ |
| Desktop light: Expression open state | 08 ✅ |
| Desktop dark: the same core surfaces | 10–17 ✅ |
| Mobile 360: My World owner | 30, 31 ✅ |
| Mobile 360: Person | 32 ✅ |
| Mobile 360: first Moment | 33 ✅ |
| Mobile 360: Composer | 34 ✅ |
| Mobile 360: People / Search | 35, 36 ✅ |
| Mobile 360: Expression state | 37 ✅ |

**Extras beyond the minimum:** the four product routes, the `/social` redirect, the Circle of
Life, Chat + its deep link, View-as-public, the Health/Problem record, the Life Cursor, the
Emotion Atlas, the Expression Spectrum, Human Pulse at 100, the Person surface, the Messages
panel, the Account menu, the Moment-kind readouts, and three locales.

## Not captured, and why

| Missing | Reason |
|---|---|
| The real 3D Cosmos | No GPU in the audit sandbox and the `public/cosmos/` textures were out of scope. Phase 1, frozen, outside the Social audit. |
| Earth | A state inside Cosmos; same reason. |
| The identity gate | Phase 2, paused (not frozen); reachable but outside the Social surface. |
| Physical-device safe areas, notches, virtual keyboards | Cannot be claimed from a headless run. The repository's own `s7-device-mastery` evidence labels these SIMULATED; this audit does not restate them as verified. |
| Motion frame strips | The repository already holds real-speed and 5×-slowed strips under `prototype-evidence/social-r3-*`; re-capturing them would add nothing and the audit does not claim motion timings it did not measure. |
| `/style-lab` (Phase 0 lab) | Not part of the Social surface. |
