# SAFE FIXES — NO PRODUCT DECISION NEEDED (§56)

Each of these fixes a defect, restores truth, or brings code in line with an already-accepted rule.
None of them changes what the product *is*. They are grouped by the slice that should carry them
(see [PHASE-4.4-IMPLEMENTATION-PLAN.md](PHASE-4.4-IMPLEMENTATION-PLAN.md)).

## Governance rules that still apply

These are rules, not decisions.

- **Frozen files.** `src/components/style-lab/social/**` is frozen: every edit there is a defect fix
  that needs **an `AGENTS.md` exception row plus a covering test** ("frozen does not preserve
  genuine defects").
- **Accepted suites.** An accepted-suite assertion may change only as a **recorded supersession**
  that strengthens the invariant. Three fixes below need one: C1, C14 and A15. They are marked ⚑.
- **Boom boundary.** `expressions.tsx` stays byte-identical. The Boom who-list guard (RX-18) is a
  real defect inside that boundary, so it is **not** in this list. It needs your explicit approval
  (D-26).
- **English.** Localisation fixes keep English **byte-identical**, so accepted selectors keep
  matching.
- **The Celestial fixes (X-series) touch files carrying your uncommitted Light-mode correction**
  (`ResonateControl.tsx`, `CelestialField.tsx`, `CelestialEnvironment.tsx`). Do them only after
  that pass is committed or set aside, so the two changes never mix.

## Slice 4.4-A — Moment and Respond truth

| # | Fix | Where | Row |
|---|---|---|---|
| A1 | **View as public covers the whole World — part 1.** While previewing, render the stream, conversation, menus and Life Cursor through `PUBLIC_VIEWER`, and drop the owner's only-me Moments. Extend `person-life-identity.js` §11 to assert no exact age and no only-me Moment in the stream. *Part 2 — friends-only and author filtering — follows D-2 and D-4 in 4.4-B* | `SocialPreview.tsx:516-519, 717, 737-746`; `store.tsx:113-119`; `Moment.tsx:103, 112`; `LifeCursor.tsx:76-77` | P0-3 |
| A2 | **Edit keeps time truth.** Same date → keep the original `at` and `atPrecision`. Moved date → `atPrecision:"day"` + `sharedAt`. Delete the dead `initialTime` | `Composer.tsx:220, 596-598` | P0-4 |
| A3 | **Edit keeps media.** The existing link title and description, video poster and duration, and photos outside LIBRARY survive unless the person changes them | `Composer.tsx:119, 128, 153, 209-212` | P0-4 |
| A4 | **Discard during Posting never posts.** Clear the 900 ms timer on discard and unmount, and make the body inert while posting | `Composer.tsx:201-246, 577` | P0-4 ✔ |
| A5 | **Phone thread Reply works.** Give `MomentConversation` its own `replyTo` state and render the same reply `NoteComposer` (`parentId`) used inline | `Moment.tsx:596, 599, 609` (pattern `:488, 498-502`) | P0-5 ✔ |
| A6 | Respond on the phone puts the cursor in the composer (don't focus the dialog container when a composer autofocuses) | `Moment.tsx:546-548, 609` | RS-02 ✔ |
| A7 | The Person card appears above the phone thread (raise its layer, or close-then-open) | `PersonCard.tsx:82`, `Moment.tsx:555`, `SocialPreview.tsx:673` | RS-18 ✔ |
| A8 | Phone thread: focus returns to the opener, the scrim is `touch-action:none`, Escape closes only the top-most layer, and a just-sent response is revealed | `Moment.tsx:421, 546-556, 609`; `PersonCard.tsx:54` | RS-16 |
| A9 | Kind fields are scoped to the posted kind; `moment` posts no `fields` | `Composer.tsx:220, 233` | CO-11 |
| A10 | Photos, video and link are mutually exclusive in the UI. This enforces the current one-type contract (the `Media` union, `social-api-contract.md` §D.2); D-20 only asks whether to *extend* it | `Composer.tsx:209-215, 460-551` | CO-05 |
| A11 | **Pre-birth refusal in the Composer.** Add a `min` plus the existing "That date is before this life began" sentence. Never render a negative age. This enforces the established Life rule (§33); D-17 covers only future ancestral records | `Composer.tsx:169-172, 381`; `DateField.tsx:30` | CO-09 |
| A12 | People present: never store an unmatched name as an id. An unknown id resolves to a neutral "unavailable person", never to `PEOPLE.m` | `Composer.tsx:671-675`; `store.tsx:271` | CO-13 |
| A13 | A Meeting names its people once | `Moment.tsx:89-90` vs `247-251` | MC-08 |
| A14 | Confirm before closing an Edit with changes (new copy, ×8 locales) | `Composer.tsx:180-183` | CO-20 |
| A15 ⚑ | **Truthful response time.** Show the date when a response is not from today (`sbDate`, `<time dateTime>`). Build fixture times with `localISO`, not `toISOString`. May supersede a time-text assertion; record it if so | `Moment.tsx:667`; `data.ts:738` | RS-23 |
| A16 | Responses keep line breaks and wrap long tokens; Edit uses a textarea | `Moment.tsx:645, 661` | RS-29 |
| A17 | IME guard: ignore Enter while `isComposing` | `Moment.tsx:741` | RS-29 |
| A18 | "Write a response" at zero responses focuses the composer | `Moment.tsx:378` | RS-01 |
| A19 | Copy link says "Link copied." only after `writeText` resolves (whether to remove it is D-12) | `Moment.tsx:350` | XC-32 |
| A20 | Menus: focus returns to the trigger; arrow/Home/End roving. After Hide or Delete, focus moves to the next Moment's readout and is announced | `Moment.tsx:416-460, 339, 349` | XC-16 |
| A21 | 44px phone targets for Reply and the response ⋯ (`@2xl` restores 28px) | `Moment.tsx:670, 675` | RS-30 |
| A22 | Response-author ring marked decorative (the name was announced twice); remove the stray sr-only spans | `Moment.tsx:632, 521-522` | RS-39 |
| A23 | Grid tiles 1–3 become non-interactive; the video play control is disabled until playback exists | `Media.tsx:54-66, 84-88` | MC-10 |
| A24 | Localise the Moment chrome. **Existing keys:** `moments.peopleInMoment` (`:254`) and `moments.more` (`:675`). **New keys:** age/band tooltips (`:195, :197`), "more/less" (`:281, :648`), "(you)" (`:644`), "Show fewer" (`Media.tsx:71`), `Life {band}` (`LifeCursor.tsx:77`), "Life instruments" / "Moments" (`SocialPreview.tsx:693, 716`) | files as listed | MC-37 |
| A25 | **Fixture truth.** `wonder` → `wow`. Notification fixtures: "left a note" → "responded to". nt3, nt5 and nt8 either get a matching response or are reworded. (Removing the "mentioned you" row waits on D-24) | `data.ts:643, 749-756` | RX-26, RS-22 |
| A26 | Announce failures in a live region (Composer, response send) | `Composer.tsx:556-561`; `Moment.tsx:759-764` | XC-18 |

## Slice 4.4-C — connection truth (relationships, Chat, notifications, Life links)

| # | Fix | Where | Row |
|---|---|---|---|
| C1 ⚑ | **Viewer-relative relationships.** Store requester/addressee, or key by viewer. The requester sees "Requested" + Cancel; only the addressee sees Accept. Supersedes `social-connection-final.js:184-191`, which currently asserts the requester can accept his own request. The invariant gets stronger | `world/model.ts:29-47`; `WorldProvider.tsx:47-57, 118-127`; `SocialPreview.tsx:509-512` | PF-03 |
| C2 | Visitor Hero "Message" opens a chat with the World's person, not with the viewer | `ProfileHero.tsx:112-113` | ID-03 |
| C3 | The request notification records its outcome when resolved, and is marked read wherever the same request is resolved (People, PersonCard, Hero) | `Chrome.tsx:524-529`; `People.tsx:97-101`; `PersonCard.tsx:113-117`; `ProfileHero.tsx:117-118` | CN-02, CN-03 |
| C4 | **Chat guard (prototype).** `?c=` opens only when `canMessage(c)` and `c !== me`. `send` refuses non-connected ids. An unknown or refused `?c=` says so honestly (the live product still needs the server guard). This enforces the accepted rule, messaging only between connected people (`model.ts:20-22`); CN-23's decision flag concerns conversations *after* Remove (D-18) | `ChatSurface.tsx:47-53`; `WorldProvider.tsx:58-79`; `Messages.tsx:141-160` | CN-23 |
| C5 | A failed chat send keeps the text (read `simulateFailure`, set `ChatMessage.failed`) | `model.ts:58-59`; `Messages.tsx:119-124`; `WorldProvider.tsx:72-79` | CN-24 |
| C6 | **Doorways.** Celestial who-resonated rows open the Person card. Chat headers open the Person card, and `ChatSurface` mounts one | `ResonateControl.tsx:359-363`; `Messages.tsx:194-197`; `ChatSurface.tsx:29-37, 114-117` | PF-15, CN-30 |
| C7 | Your own Search row: non-interactive, or scrolls to your Hero | `Chrome.tsx:357-363` | PF-23 |
| C8 | A notification target resolves through the Search visibility rule. A gone target says "This Moment is no longer available" instead of failing silently. CN-15's decision flag concerns where live notifications land (D-12) | `Chrome.tsx:463, 471-477`; `focus-moment.ts:14-15` | CN-15 |
| C9 | **Life links respect birth and today** (the established rule; see A11). `?c=` is bounded to [birth, today], with the existing refusal sentence. Hide "Record a moment on this day" on future days | `circle/model.ts:140-158, 176-184`; `DayAlmanac.tsx:48-52` | PL-08 |
| C10 | The full requested path + query survives identity. `/social` keeps its query | `intent.ts:12-18`; `PersonalDestination.tsx:26-27`; `IdentityGate.tsx:316-321, 330`; `CosmosRoot.tsx:41-42`; `app/social/page.tsx:9` | PL-14 |
| C11 | The latent visitor Circle link points to `/world` "My World", not the style-lab alias labelled "Social" | `CircleView.tsx:236-240` | PL-20 |
| C12 | Search Places are derived from viewer-visible Moment places (the static list stays only as the Composer datalist) | `Chrome.tsx:258`; `data.ts:334-349` | PL-02 |
| C13 | "Your people" rows show Friends / Family (existing keys) | `People.tsx:135-138` | PF-11 |
| C14 ⚑ | PersonCard Remove gets an inline confirm (the accepted Delete pattern). Update any suite that clicks `data-sb-remove-friend`, and record it | `PersonCard.tsx:136` | PF-10 |
| C15 | One shared 1024px mini-chat breakpoint with resize reactivity; close the mini chat when the viewport drops below it | `Messages.tsx:64`; `PersonCard.tsx:74`; `People.tsx:188`; `ProfileHero.tsx:112`; `ChatSurface.tsx:108` | CN-20 |
| C16 | Chat frame: a measured bar height instead of 57 px, `safe-area-inset-top` on `WorldShell`, and a reachable desktop Back | `ChatSurface.tsx:63, 105-113`; `WorldShell.tsx:18` | CN-20 |
| C17 | **Celestial notification path made honest:** the harness row is based on a Moment event with a `momentId`; the mark is gated on `useCelestialSurface("notifications")`; `celestial.notification.resonated` is rendered; the vacuous test is replaced | `store.tsx:224-233`; `ResonateControl.tsx:404-407`; `Chrome.tsx:542`; `celestial-s3-s6.js:183` | RX-22 |
| C18 | Localise Chat, notification day headers and coordinate dates. Existing keys: `chat.you`, `chat.noMessagesYet`, `chat.unreadN`, `chat.noConversations`, `common.today` | `ChatSurface.tsx`, `Messages.tsx`; `store.tsx:316-324`; `Chrome.tsx:304, 501, 554` | XC-13, XC-14 |
| C19 | IdentityGate's signed-in avatar uses `PersonIdentity` (or gains an `onError` fallback). `initialsFor` handles astral characters. IdentityGate is paused, not frozen. ID-14's decision flag concerns the frozen Cosmos chip (D-29), which C19 does not touch | `IdentityGate.tsx:202, 277`; `ui/Avatar.tsx:12-17, 40-47` | ID-14 |
| C20 | The visitor counter card gets a heading other than "MY LIFE IN" | `SocialPreview.tsx:696` | ID-12 |

## Celestial-only (X) — after the Light pass is resolved

| # | Fix | Where | Row |
|---|---|---|---|
| X1 | **The phone action row never loses the ⋯.** Proposed default: below the 700 px container, Resonate becomes a 44 px glyph doorway with "Resonate" kept in its accessible name. You may veto under D-5 | `ResonateControl.tsx:87-136`; `CelestialEnvironment.tsx` (phone container rule) | RX-01 ✔ |
| X2 | Desktop "1 response" no longer wraps: the summary root is full-width only inside ≤700 px | `ResonateControl.tsx:262` | RX-15 |
| X3 | The inline stage is height-capped with `overscroll-contain` (as Boom's who panel already is) | `ResonateControl.tsx:300-303` | RX-16 |
| X4 | A visible "Remove your resonance" in the Field (the key already exists) | `CelestialField.tsx:533-575` | RX-08 |
| X5 | Outside-pointer and scrim dismissal for the Field (`22-COMPONENT-ARCHITECTURE.md` §1) | `ResonateControl.tsx:51-72` | RX-07 |
| X6 | Accessible names: the selected Resonate label contains "Resonate"; the Who button includes "{n} people"; the summary template leads with the object ×8 | `ResonateControl.tsx:96, 268`; `en.ts:362` ×8 | RX-29 |
| X7 | The expanded constellation hears Escape at window level (or takes focus on open) | `ResonateControl.tsx:300-312` | XC-15 |

## Cross-cutting (Z)

| # | Fix | Where | Row |
|---|---|---|---|
| Z1 | **Performance.** The LifeCounter stops ticking while hidden (check the `social-final.js` counter selectors first). Identity photos get `loading="lazy" decoding="async"`, and the owner avatar a small variant (836 KB today). `--sb-bar-h` updates on resize, not on every scroll | `SocialPreview.tsx:695-698`, `LifeCounter.tsx:69-73`; `LifeRing.tsx:230`, `demo-user.ts:16`; `Chrome.tsx:98-110` | XC-20, XC-21 |
| Z2 | Search combobox semantics (`aria-expanded`, arrow keys). PersonCard traps Tab (reuse `useFocusTrap`). Arrow-key roving in the Composer kind group | `Chrome.tsx:285-304`; `PersonCard.tsx:48-60`; `Composer.tsx:426-447` | PF-19, XC-15, CO-24 |
| Z3 | Small identity defects: drop the trailing " — " when there is no label; track the failed avatar `src`, not a boolean; remove the redundant ternary; restrict the unused full-precision `lifePosition()`; `LifeCursor` uses the bar token, not `top-[52px]` | `LifeRing.tsx:76, 226`; `PersonCard.tsx:70`; `social/life.ts:32-49`; `LifeCursor.tsx:81` | ID-23 |
| Z4 | Orphan i18n keys (14 × 8): wire or remove. `docs/i18n/translation-status.md` still says 319 strings; the catalogs have 363. Update it and add the Celestial review flags | catalogs; `translation-status.md:17-24` | XC-12 |
| Z5 | Stale code comments corrected | `SocialPreview.tsx:504-505`; `PersonIdentity.tsx:18-21, 49`; `Chrome.tsx:94-97, 262-264`; `ProfileHero.tsx:64`; `PersonCard.tsx:90-91`; `data.ts:369` | — |
| Z6 | **Test hygiene** — these checks can never fail, or will fail on their own: `engraveOwner >= 0` (`my-world-2030.js:121`); `ok(notifOk \|\| true)` (`celestial-s3-s6.js:183`); the stale `12,731` in `person-life-identity.js` (live clock) | tests as listed | — |
| Z7 | **Docs follow accepted behaviour** (report, then fix the doc — never the behaviour). Files and what they get wrong: | | RS-40, PF-26, ID-24, CO-26/27 |

The documents Z7 corrects:

| Document | What to correct |
|---|---|
| `social-api-contract.md` | Drop `respond {count, byViewer}`; `with` holds PersonRef ids; add a Response entity |
| `social-interaction-spec.md` | Respond toggle, notes, ☺ ▣ glyphs, Chat placeholder, search groups |
| `social-content-rules.md` | Notes vocabulary; meeting line; readout heading |
| `social-feature-parity.md` | Friends in People; Chat is real |
| `people-chat-integration.md` | The People utility exists |
| `social-shell-spec.md` | Compass-era statements; People utility |
| `social-visual-spec.md` | Hero overlap; counter; search groups |
| `navigation-final.md` | Chat placeholder |
| `README-for-developer.md` | Chat placeholder; `/social` alias |
| `person-life-identity.md` | Photo count; density; scale table; preview; animation |
| `moment-expression-contract.md` | 18 ids, `wow`, families |
| `moment-conversation-model.md` | Resonate and the constellation in the action area |
| `architecture.md` | Ancestors `later` claim |
| `SOCIAL_BIBLE_AUDIT.md` | `/chat` test claim, kind union, Asha arithmetic, textarea label, Celestial "absent" |

## Verify intent before touching

These look like defects, but may be deliberate, so confirm first:

- The **"shared {when}" provenance** appears only on the day's first Moment (`Moment.tsx:175`).
- The **phone focused-surface threshold** counts top-level responses only (`Moment.tsx:163`),
  while the doc says "3+ responses".
- **Dead reducer cases** `respond` / `noteRespond` (`store.tsx:149-160, 198-202`) and the unused
  `useComposerSeed` (`Composer.tsx:692-695`). Remove them only after confirming no suite
  dispatches them.
