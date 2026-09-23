# APPENDIX — Per-subsystem audit method (§46)

The ten §46 headings for each of the nine subsystems, as returned by the subsystem auditors. Every item cites `file:line` evidence. This appendix is the raw working record behind the synthesis documents. Where it and a synthesis document disagree, **the synthesis document wins**, because it carries the 4.3 runtime verification. Specifically:

- The phone action-row overflow, the phone thread defects (Reply, composer focus, Person-card stacking) and Discard-while-posting are **runtime-verified** (`evidence/results.json` K, V1–V4).
- Priorities were re-set in [SOCIAL-COMPLETION-PRIORITIES.md](SOCIAL-COMPLETION-PRIORITIES.md).
- Owner decisions are consolidated and numbered D-1 … D-36 in [OWNER-DECISIONS-REQUIRED.md](OWNER-DECISIONS-REQUIRED.md).
- Safe fixes are consolidated and de-duplicated in [SAFE-FIXES-NO-DECISION.md](SAFE-FIXES-NO-DECISION.md).

Everything described is **prototype** behaviour (client reducers + fixtures, no server) unless it says *contract* or *live*.

Contents: [Moment core (object · feed · media · links · overflow)](#mc) · [Respond / conversation](#rs) · [Boom + Celestial (combined action experience)](#rx) · [Person identity / profile / Life Ring](#id) · [People · Friends · Relationships · Search](#pf) · [Chat · Notifications](#cn) · [Composer · people present · visibility](#co) · [Place · Life · Cosmos](#pl) · [Cross-cutting (privacy · safety · i18n · a11y · mobile · performance · themes · terminology · states)](#xc)

**Where each §50 subsystem is answered.** The auditors worked in nine lenses. The table maps every
§50 subsystem to its lens and rows; the synthesis documents cover each one individually.

| §50 subsystem | Appendix lens | Master-table rows | Synthesis document |
|---|---|---|---|
| My World | PL (the `/world` hierarchy), MC (feed), ID | PL-22…28, MC-30…33, ID-06 | SOCIAL-SYSTEM-MAP.md §3 |
| Profile | ID | ID-01…24 | PEOPLE-FRIENDS-RELATIONSHIP-AUDIT.md §1–2 |
| Moment | MC | MC-01…38 | MOMENT-ANATOMY.md |
| Composer | CO | CO-01…28 | MOMENT-ANATOMY.md §9 |
| Respond | RS | RS-01…41 | RESPOND-CONVERSATION-AUDIT.md |
| Boom | RX | RX-04, 05, 12, 17, 18, 26, 30 | MOMENT-ANATOMY.md §3–4, §8 |
| Celestial | RX | RX-01…03, 06…11, 13…16, 22, 24, 27, 29 | MOMENT-ANATOMY.md §3–4, §6 |
| People · Friends · Search | PF | PF-01…26 | PEOPLE-FRIENDS-RELATIONSHIP-AUDIT.md §3–6 |
| Notifications · Chat | CN | CN-01…17 · CN-18…33 | CHAT-NOTIFICATIONS-SEAM-AUDIT.md |
| Place · Life · Cosmos seams | PL | PL-01…03 · PL-04…11 · PL-12…21 | PLACE-LIFE-COSMOS-SEAM-AUDIT.md |
| Media | MC, XC | MC-10…14, XC-24 | MOMENT-ANATOMY.md §7 |
| Privacy | XC, ID | XC-01…06, ID-01, ID-10, ID-23 | SOCIAL-PRIVACY-SAFETY-AUDIT.md §1–4 |
| Safety | XC | XC-07…10 | SOCIAL-PRIVACY-SAFETY-AUDIT.md §5 |
| i18n | XC | XC-11…14 | SOCIAL-COMPLETION-AUDIT.md §6 |
| Accessibility | XC | XC-15…18 | SOCIAL-COMPLETION-AUDIT.md §6 |
| Mobile | XC | XC-19 (+ RX-01, RS-02, RS-05, RS-18) | SOCIAL-COMPLETION-AUDIT.md §3 K, §6 |
| Performance | XC | XC-20…23 | SOCIAL-COMPLETION-AUDIT.md §6 |
| Themes | XC | XC-25…26 | SOCIAL-COMPLETION-AUDIT.md §6 |

<a id="mc"></a>
## MC — Moment core (object · feed · media · links · overflow)
**Overall: PARTIAL** · master-table rows `MC-01` … `MC-38`

### WHAT THE PRODUCT NEEDS
- Moment readout grammar: name · exact age (own) / band (others) · place · feeling · privacy · edited · time; plus a kind line with fields (docs/handover/social-content-rules.md §3:36-59; social-visual-spec.md §5.5:247-261)
- Chronology is the ordering truth: sort by the Moment's own `at`, newest first, never by sharedAt; one date rule per calendar day; a backdated Moment shows 'shared <when>' as provenance (social-api-contract.md §G:192-204; social-interaction-spec.md §8:146-158; social-wireframes.md §6:157-179)
- Temporal honesty: never invent a clock time; day-precision Moments show no time; `atPrecision` stored explicitly (social-api-contract.md §D:91-92, 119-121; social-feature-parity.md:152-159; content-rules §4:61-69)
- Media at own aspect ratio inside 480px, never cropped or letterboxed; grid with +N; video poster with duration and caption chip; link card (social-visual-spec.md §3:129-142, §9:363-364; social-api-contract.md §D.2:130-141). Video playback is explicitly out of prototype scope (social-interaction-spec.md §3:81)
- Owner menu: Edit · Change privacy · Delete (inline confirm) · View in Life — later; other's menu: Report · Hide · Copy link (social-interaction-spec.md §3:77-78; social-content-rules.md §9:125-133; social-feature-parity.md §4:89-90)
- Edit reopens the same composer prefilled, Save marks 'edited' (social-interaction-spec.md §2:22, 52; social-feature-parity.md §3:73)
- RESPOND is the verb that writes (opens the conversation); the anonymous tap is retired; Health/Problem have no Respond, no Expression, no aggregate, no conversation (docs/handover/moment-conversation-model.md §7:99-105, §8:108-115)
- Life privacy: another person's Moments show the band only; payloads for others must not contain birth data or anything from which the birth date can be derived (social-interaction-spec.md §10:168-190; social-api-contract.md §C:66-82, §F:186-190; social-visual-spec.md §10:371-392). Per-age-band counts of another person's dated Moments narrow the birth date (docs/design/circle-of-life.md:96-101)
- Only-me Moments of others never delivered (server filter); three-value privacy public/friends/onlyme; if the backend has no friends privacy, surface the gap (social-api-contract.md §D:115; social-feature-parity.md §3:60, §4:92)
- View as public shows exactly what a genuine visitor receives (moment-conversation-model.md:104; person-life-identity.md §9:133-150)
- Visitor profile feed = the subject's own Moments, onlyme excluded (social-api-contract.md §G:204; social-feature-parity.md §6:121)
- View in Life reserved slot, disabled and honest until Phase 6 (social-api-contract.md §D:107; social-feature-parity.md §4:93)
- Copy link only, no re-share; systemboom.example host is prototype-only (social-feature-parity.md §4:90, 96, §7:137)
- Pagination: 8 per page, 'n earlier · Load more', end sentence; live = cursor keyed on (at, id) with an until/aroundId request (content-rules §8:122-123; social-api-contract.md §G:196-203)
- Focus returns to the control that opened a layer; Escape closes top-most layer only (social-interaction-spec.md §1:13-16)
- Live updates candidates: note arrives, edit/delete/privacy change in place, never birth data on sockets (social-api-contract.md §H:206-222)

### WHAT EXISTS NOW
- Moment type: id, authorId, at, sharedAt, atPrecision, place (free string), text, kind, fields, feeling, privacy, media, retired responses/responders/respondedByViewer, notes, edited, expressions, resonances — src/components/style-lab/social/data.ts:66-100
- 23 seed Moments incl. backdated (m-1983, m-tenphotos, m-wedding), day-precision (m-1983:398, m-wedding:670), 600-word body (m-600), ten photos, 40-note thread (m-forty), link, video, Devanagari, no-place — data.ts:377-681
- MomentEntry renders date rule → readout → phone place line → kind line → body → media → action row → resonance anchor → presence line → response preview → conversation — Moment.tsx:102-399
- Author identity via PersonIdentity (photo + Life Ring at the Moment's date, 24px) and a name button opening the Person surface — Moment.tsx:181, 186-192
- Life position: exact for own Moments, band-at-Moment-date for others — Moment.tsx:112, 194-198; view-model.ts:80-85, 110-113
- Time shown only when atPrecision !== 'day' — Moment.tsx:215; HH:MM formatter store.tsx:311-314
- DateRule with TODAY + date and 'shared <when>' provenance — Moment.tsx:33-48; one rule per day via dateKey — SocialPreview.tsx:740
- Kind line for meal/activity/project/meeting/health/problem — Moment.tsx:52-98, 229-244
- fields.with people button + popover opening Person surfaces — Moment.tsx:121, 247-272
- Body truncation at 420 chars with more/less — Moment.tsx:28, 169-170, 276-285
- MediaBlock: single photo Frame, 2-col grid with +N expand, video poster with a play button, link card; SafeImg load-failure fallback — Media.tsx:15-113
- Action row: Respond (opens conversation, cursor in composer), Boom ExpressionControl, Celestial ResonateControl — Moment.tsx:162-167, 290-305
- Celestial Resonance is flag-gated, default OFF everywhere — src/lib/celestial/flags.tsx:30-39; ResonateControl.tsx:36, 74
- View in Life: disabled pill (≥@2xl) + disabled menu item — Moment.tsx:307-310, 344, 351
- Overflow menu own: Edit · Change privacy (radio) · Delete inline confirm · View in Life (disabled) — Moment.tsx:317-345; other: Report (toast only) · Hide · Copy link (fabricated URL) · View in Life (disabled) — Moment.tsx:347-352
- Presence line: Human Pulse (ExpressionSummary, null at zero — expressions.tsx:1075), ResonanceSummary, responses count/Write a response — Moment.tsx:371-385
- Conversation: inline Notes (3 shown, view more, one reply level, edit/delete/report), focused phone surface for >2 top-level responses, NoteComposer with simulated failure + Retry — Moment.tsx:157-167, 464-525, 536-614, 616-696, 698-772
- Reducer actions post/edit/delete/privacy/hide/note/noteEdit/noteDelete/loadMore/reveal/simulateFailure/landed; dead: respond, noteRespond — store.tsx:130-244
- orderFeed: hides hidden ids, filters others' onlyme, sorts by `at` desc — store.tsx:113-119
- Feed: visible=8, loadMore +8, '{n} earlier · Load more', end sentence — store.tsx:95, 203-204; SocialPreview.tsx:590, 749-758
- In-page Moment landing from Search/Notifications: reveal + focusMoment — store.tsx:205-210; world/focus-moment.ts:11-27; Chrome.tsx:265-270, 471-476
- Post landing: justPosted → scroll + focus readout — Moment.tsx:128-144; store.tsx:137-142
- LifeCursor sticky row showing the year + viewer-safe position + place of the top historical Moment — LifeCursor.tsx:38-93, mounted SocialPreview.tsx:717
- Edit path: draftFromMoment → Composer Save → dispatch edit — Composer.tsx:118-134, 219-220; store.tsx:143-144
- Routes: src/app has chat, life, social (redirect), style-lab, world — no Moment permalink route; /life honours ?c=day:YYYY-MM-DD on the product route — src/components/style-lab/circle/CirclePreview.tsx:94

### WHAT IS COMPLETE
- Author identity on the readout (photo + ring + name → Person surface) — Moment.tsx:181, 186-192
- Chronological ordering by the Moment's own `at` (C3) — store.tsx:113-119
- One date rule per calendar day with TODAY treatment — Moment.tsx:33-48; SocialPreview.tsx:738-746
- Day-precision Moments show no clock on the readout — Moment.tsx:215
- Kind lines incl. PROJECT progress hairline — Moment.tsx:52-98
- Body truncation/expand — Moment.tsx:169-170, 276-285 (strings aside)
- Own-aspect media sizing, no crop/letterbox, grid +N — Media.tsx:29-76
- Image load-failure fallback keeping layout and alt words — Media.tsx:15-27
- Respond as the writing verb (opens conversation, focuses composer) — Moment.tsx:162-167, 293-303
- Boom Expression control + Human Pulse on non-quiet Moments (preservation boundary) — Moment.tsx:304, 372
- Change privacy (prototype) with toast — Moment.tsx:320-332; store.tsx:147-148
- Others' only-me Moments filtered from feed and search — store.tsx:117; Chrome.tsx:253
- Paging with '{n} earlier · Load more' and the end sentence — SocialPreview.tsx:749-758
- Posted/backdated Moment lands at its chronological index with focus + one rise — store.tsx:137-142; Moment.tsx:131-144
- Dark/light tokens for sheet, rule, hairlines, raised surfaces — SocialPreview.tsx:54-71
- Response send failure keeps text with Retry — Moment.tsx:706-723, 759-764

### WHAT IS PARTIAL
- Moment as a central object: rich in-feed anatomy, but no identity outside the feed (no URL), place is inert free text, people-present only via kind fields, Life seam disabled — data.ts:66-100; Moment.tsx:199-204, 307-310, 350
- sharedAt provenance renders only on the day's FIRST Moment (the DateRule), so a backdated Moment that shares a day with others loses its 'shared <when>' label or the label is misattributed to the whole day — Moment.tsx:175, 45; SocialPreview.tsx:740
- fields.with: only meal/meeting kinds carry people; the MEETING line prints 'with <names>' AND a separate 'with N' button (duplicate) — Moment.tsx:89-90 + 247-252
- Multi-photo grid: every tile is a <button> but only the last '+N' tile does anything; single photos are not interactive; no lightbox/fullscreen/zoom/gestures/download — Media.tsx:47, 53-67
- Video: poster + play button with NO onClick (documented out of prototype scope) — Media.tsx:84-88; social-interaction-spec.md §3:81
- Alt text: required in the fixture type, but the Composer offers no alt authoring (alt copied from LIBRARY fixtures) — data.ts:32; Composer.tsx:214
- Report: toast only, no reason, nothing recorded — Moment.tsx:348, 686
- Hide: session-only reducer entry, no undo, no confirmation, reset by viewer switch/Reset — store.tsx:190-191, 135-136
- Delete: works in memory but no undo, no confirmation line, focus falls to <body>, Notifications that point at the deleted Moment remain and become silent no-ops — Moment.tsx:339; store.tsx:145-146; focus-moment.ts:14-15
- Owner cannot Copy link to their own Moment (only others' menu has it) — Moment.tsx:317-345 vs 350
- Conversation: inline works; focused phone surface is aria-modal without focus trap and returns no focus on close — Moment.tsx:557-563, 546-552
- Keyboard: Popover uses role=menu but has no arrow-key navigation and does not return focus to the ⋯ / 'with N' trigger on close — Moment.tsx:416-442
- Mobile: Respond is 44px on phones (Moment.tsx:297) but the ⋯ trigger stays 36px (Moment.tsx:312) and the responses toggle min-h-9 (Moment.tsx:379)
- Life Cursor: switches between different AUTHORS' life positions in a mixed-author stream, uses `me` even in View-as-public, hardcoded 'Life ' prefix and hardcoded top-[52px] bar height — LifeCursor.tsx:75-77, 81; SocialPreview.tsx:717
- Localization inside the subsystem: hardcoded English 'more'/'less' (Moment.tsx:281, 649), '(you)' (644), NoteRow aria-label 'More' (675), popover label 'People in this Moment' (254, although en.ts:83 key moments.peopleInMoment exists), readout titles (195, 197), 'Show fewer' (Media.tsx:71), section aria-labels 'Moments'/'Life instruments' (SocialPreview.tsx:716, 693)
- Copy link confirmation 'Link copied.' is shown even when the clipboard API is missing or rejects — Moment.tsx:350
- Loading/empty states: images reserve aspect and lazy-load (Media.tsx:26, 34) but there is no feed loading, pagination loading, or designed first-Moment empty state — only the end sentence (SocialPreview.tsx:756-758)

### WHAT IS MISSING
- Moment permalink / stable URL: no route under src/app (chat, life, social, style-lab, world only); Copy link writes the fabricated `https://systemboom.example/m/<id>` — Moment.tsx:350
- Server-side privacy enforcement for a Moment link (onlyme/friends/hidden/deleted must not resolve or reveal existence) — no route exists, contract absent from social-api-contract.md
- Place as an object: Moment.place is free text (data.ts:78); place spans are inert (Moment.tsx:199-204, 221-227); no link to Earth, search or a Place surface
- Event timezone/offset: `at` is a zone-less local ISO string parsed in the viewer's zone (data.ts:70; store.tsx:303, 311-314); social-api-contract.md §D:90 specifies no offset
- Video playback, photo lightbox/fullscreen, pinch/swipe gestures, download — Media.tsx:45-93
- Alt-text authoring in the Composer — Composer.tsx:209-215, 492-508
- Feed load / pagination / edit / delete / privacy / hide failure states (reducer actions always succeed) — store.tsx:143-148, 190-191, 203-204
- Undo for Delete and Hide — Moment.tsx:339, 349
- Live updates (note arrival, edit/delete in place) — store.tsx:4-6 in-memory only; social-api-contract.md §H
- Tagging consent / notification for people named in fields.with — Moment.tsx:247-272; no doc covers it
- Responsive image sources (srcset) — Media.tsx:26 (recorded S7 carryover, live-CDN concern)

### WHAT IS BROKEN
- Owner EDIT corrupts the event time: the patch always writes `${effDate}T12:00:00` (initialTime() returns 'T12:00:00' from both branches) and never updates atPrecision, so editing a minute-precision Moment (e.g. m-nepali-1 06:10) displays a fabricated '12:00' and moves it in chronology — Composer.tsx:220, 596-598; Moment.tsx:215. social-final.js:509-520 only checks the 'edited' marker, so it stays green
- Edit regenerates media for video/link Moments from composer fixtures (poster '/mock/social/video-poster-9x16.jpg', duration '0:42', link description 'Bells, prayer wheels…', image LIBRARY[4]) and drops photos not found in LIBRARY — Composer.tsx:119, 209-212
- View as public does NOT apply to the Moments stream: the feed, readouts and Life Cursor still render with the owner as viewer, so the 'public' preview shows the owner's only-me Health/Problem records (m-health, m-problem), exact ages on own Moments and owner menus — SocialPreview.tsx:516 (heroViewer used only by Hero/Circle), 717, 737-746; Moment.tsx:103, 112; store.tsx:274. Contradicts moment-conversation-model.md:104. person-life-identity.js §11 checks only Hero/Circle and three strings (04 NOV 1991, 06:42, 12,731), not the exact-age string or only-me Moments. Corroborated by references/social-bible-audit/evidence/22-desktop-dark-view-as-public.png (feed renders under the banner)
- Reply is a dead button in the focused phone conversation (the only place deep threads live on a phone): NoteRow receives onReply={() => {}} — Moment.tsx:596, 599
- Composer 'with' field stores raw typed names when none match (and silently drops unmatched names when some match); personOf() falls back to PEOPLE.m for any unknown id, so such a Moment renders 'with …' people as the fixture person 'M' and opens M's Person surface — Composer.tsx:672-674; store.tsx:271; Moment.tsx:121, 256-266
- Fixture expression id 'wonder' (renamed 'wow' in R3) is silently dropped, so m-panorama shows 2 of 3 seeded expressions — data.ts:643

### WHAT IS DISCONNECTED
- View in Life: the Moment pill and menu item are disabled (Moment.tsx:307-310, 344, 351) while /life already resolves `?c=day:YYYY-MM-DD` to a DayAlmanac on the product route (CirclePreview.tsx:94; CircleView.tsx:248-252) — for the owner's own Moments the destination exists but is not linked
- Celestial Resonance control/summary/field are wired into the Moment (Moment.tsx:305, 362, 373) but render nothing on /world by default (flags.tsx:30-39; ResonateControl.tsx:74, 243) — enable path is ?celestial=1 / localStorage (flags.tsx:43-78)
- Retired Respond-tap data (responses, responders, respondedByViewer) and reducer cases `respond`/`noteRespond` remain with no dispatcher — data.ts:85-87; store.tsx:149-160, 198-202
- Search and Notifications land on a Moment only in-page (reveal + focusMoment); not URL-addressable, no history entry, lost on reload — store.tsx:205-210; focus-moment.ts:11-27

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- LIFE PRIVACY: circle-of-life.md:96-98 states a single dated Moment's AGE band narrows the birth date ('a 2019 Moment in 30–45 means born before 1989') and removed density for that reason — yet every other author's Moment readout, ring, Life Cursor and conversation header show the band AT THE MOMENT'S DATE (Moment.tsx:112, 181, 194-198, 543, 574; LifeCursor.tsx:76; view-model.ts:80-85, 110-113), as mandated by social-content-rules.md §3:40-41 and social-api-contract.md §D:106 (lifeAtMoment {bandLabel}). Two Moments straddling a 15-year boundary bound the birthday to the gap between them (e.g. Sunita: m-wedding 2022-10-17 → 30–45, m-tenphotos 2026-04-13 → 45–60)
- Respond: social-api-contract.md §D:103 `respond { count, byViewer }`, social-interaction-spec.md §3:73-76 (toggle + who-list), social-visual-spec.md §5.5:253-256, social-feature-parity.md §4:86, social-wireframes.md:8, 32, 37 vs code Moment.tsx:162-167, 293-303 (Respond writes; tap retired per moment-conversation-model.md:108-115)
- Notes vs Responses: social-content-rules.md §8:110-123, §12:188-189; social-interaction-spec.md §4:88-105 (incl. ☺ ▣ glyphs and per-note Respond) vs en.ts:332-344 conv.* and Moment.tsx:750-757 (glyphs removed), NoteRow has no per-response respond (Moment.tsx:666-691)
- fields.with type: social-api-contract.md §D.3:147 meal `with?: number` vs data.ts:43 `with?: string[]` rendered as real people (Moment.tsx:247-272); social-wireframes.md §3:108 says 'with 3 is a link to the who-list' vs code opens the referenced people
- Visitor feed scope: social-api-contract.md §G:204 and social-feature-parity.md §6:121 ('hero + that person's moments') vs orderFeed with no author filter (store.tsx:113-119) — Bikash visiting Maya's World sees every author's Moments. social-wireframes.md §1:28-38 shows the OWNER sheet mixing Maya and Bikash, so the owner stream being multi-author matches the drawing; the visitor stream does not match any doc
- friends privacy: social-api-contract.md §D:101 three-value privacy + social-feature-parity.md §3:60 vs feed/search withholding only onlyme (store.tsx:117; Chrome.tsx:253) while the ring deliberately withholds friends (view-model.ts:138-150) — same Moment readable but not counted
- View as public: moment-conversation-model.md:104 'shows exactly what a genuine visitor receives' vs SocialPreview.tsx:717, 737-746 (feed rendered as owner)
- Health/Problem conversation: moment-conversation-model.md:103 'no conversation' vs Moment.tsx:374-395 (Write a response + composer + preview not gated by quiet); visible in references/social-bible-audit/evidence/23-desktop-dark-quiet-kinds.png
- Posting landing order: social-interaction-spec.md §2:50 'appears on the rule at (sharedAt ?? date)' and the code comment data.ts:369 'feed order = sharedAt ?? at' vs social-interaction-spec.md §8:150 and store.tsx:113-118 (ordered by `at` only)
- Focus return: social-interaction-spec.md §1:15-16 'closing returns focus to the control that opened it' vs Popover (Moment.tsx:416-442), MomentConversation (536-614) and Delete/Hide (339, 349) which return no focus
- Alt text: social-api-contract.md §D.2:133 `alt?` optional vs data.ts:32 required and Media.tsx:20-21, 26 relying on it for the fallback and accessible name
- Edit semantics: social-api-contract.md §D:119-121 'Never invent a clock time' vs Composer.tsx:220, 596-598 (edit writes 12:00 with minute precision)

### WHAT REQUIRES OWNER DECISION
- Life position on OTHER people's Moments (privacy hard rule): (a) keep the band at the Moment's date (current; bounds the birthday across Moments), (b) show the author's CURRENT band on all their Moments, (c) show no life position on other people's Moments (identity + ring only), or (d) band-at-Moment only for Moments older than a coarsening threshold. This also decides social-api-contract.md §D `lifeAtMoment`.
- friends privacy contract (feed, search, ring density together): does a friend/family relationship gate a privacy:'friends' Moment — (a) friend + family, (b) friend only, (c) ship Public / Only me until the backend verifies friends (social-feature-parity.md §3:60)?
- Whose Moments does the Almanac hold: (a) the subject's own life record only, (b) subject + their connections for everyone, (c) owner sees own + connections, a visitor sees the subject's Moments only (social-api-contract.md §G:204)? This also defines what the Life Cursor means.
- Health/Problem conversation: may a Health/Problem record carry responses at all — (a) no: remove the response affordance (moment-conversation-model.md:103), or (b) yes: correct the contract sentence?
- Moment permalink: (a) build a URL (e.g. /world?m=<id> or /m/<id>) resolved server-side with privacy, or (b) remove Copy link until it exists; and should owners get Copy link on their own Moments?
- What does tapping a Place do: (a) nothing (current), (b) open Search narrowed to that place, (c) open Earth at that place (/?to=earth + coordinate), (d) a Place surface — and does Place become a structured object (id + coordinates) instead of free text?
- View in Life: (a) keep the disabled pill visible, (b) hide it until built, or (c) link own Moments now to /life?c=day:<date>; what, if anything, should it do on another person's Moment (visitor Life resolves to band level only)?
- Media scope for launch: lightbox/fullscreen and swipe between photos (yes/no), in-feed video playback (yes/no), download allowed (yes/no/owner-only)?
- Delete and Hide: (a) immediate as now, (b) with an undo window; is Hide persisted server-side per viewer?
- People named in a Moment (fields.with): (a) any person, (b) only connections, (c) with consent/notification to the tagged person?

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Preserve the original clock time on edit when the date is unchanged and set atPrecision:'day' when the date is changed; delete the dead initialTime() — Composer.tsx:220, 596-598
- On edit, keep the Moment's existing video/link media unless the person changed it; do not map photos through LIBRARY-only lookup — Composer.tsx:119, 209-212
- Wire Reply in the focused phone conversation (replyTo state + NoteComposer parentId), mirroring Notes — Moment.tsx:596, 599 (pattern at 488, 498-502)
- Render the Moments stream through the same stand-in viewer while selfPreview is on (orderFeed filter, momentLifeFor, menus, LifeCursor viewer), so View as public matches moment-conversation-model.md:104 — SocialPreview.tsx:516, 717, 737-746; store.tsx:274 (record as a frozen-zone defect fix)
- Return focus to the opener when Popover / MomentConversation close, and move focus to the next Moment's readout after Delete/Hide — Moment.tsx:416-442, 546-552, 339, 349
- Add arrow-key navigation to the role=menu Popover — Moment.tsx:416-460
- Do not store raw names as person ids in the 'with' field and stop personOf() resolving unknown ids to PEOPLE.m — Composer.tsx:672-674; store.tsx:271
- Remove the duplicate MEETING 'with' (text part vs 'with N' button) — Moment.tsx:89-90, 247-252
- Fix fixture id 'wonder' → 'wow' — data.ts:643
- Show 'shared <when>' provenance on the backdated Moment itself when it is not the first Moment of its day — Moment.tsx:175, 45; SocialPreview.tsx:740
- Only confirm 'Link copied.' after writeText resolves — Moment.tsx:350
- Make non-actionable grid tiles non-interactive (not <button>) and mark the no-op video play control disabled until playback exists — Media.tsx:54-66, 84-88
- Localize hardcoded strings with existing/added keys: Moment.tsx:195, 197, 254 (use moments.peopleInMoment, en.ts:83), 281, 644, 649, 675; Media.tsx:71; LifeCursor.tsx:77; SocialPreview.tsx:693, 716
- Use the published bar height token instead of top-[52px] — LifeCursor.tsx:81
- Correct the stale comment 'feed order = sharedAt ?? at' — data.ts:369; and interaction-spec §2:50
- Correct stale docs to accepted behaviour (Respond writes, Responses vocabulary, fields.with as person refs, no per-response respond, no ☺ ▣ glyphs) — social-api-contract.md §D:103-104, §D.3:147, §D.4:157-159; social-interaction-spec.md §3:73-76, §4:98-100; social-content-rules.md §8; social-feature-parity.md §4:86, 88; social-wireframes.md §3:101-108
- Remove dead reducer cases respond/noteRespond — store.tsx:149-160, 198-202

<a id="rs"></a>
## RS — Respond / conversation
**Overall: PARTIAL** · master-table rows `RS-01` … `RS-41`

### WHAT THE PRODUCT NEEDS
- RESPOND is the primary human verb and it WRITES: it opens this Moment's conversation with the cursor in the composer — moment-conversation-model.md:25; AGENTS.md R3 §41–§44
- RESPONSES is the user-facing name of Note[]; NOTE is retired from UI in every locale — moment-conversation-model.md:26-28; docs/i18n/systemboom-glossary.md:112-121
- REPLY = a direct reply to an existing response, ONE level deep via parentId; a reply to a reply is written under the same parent — moment-conversation-model.md:27; social-interaction-spec.md:90-93
- Retired anonymous Respond tap is NOT part of the live contract (responses/responders/respondedByViewer must not be ported as a like counter) — moment-conversation-model.md:29, 114-115
- No reaction under a response (per-response acknowledgement retired) — moment-conversation-model.md:75-77; AGENTS.md R3 §56–§57
- Ordering is truthful chronology; no Top/Best/Most relevant/AI ranking; server-truthful, client adds none — moment-conversation-model.md:82, 113; moment-expression-contract.md:80-82
- Adaptive depth: 0 → composer inline; 1–2 inline; 3+ on phone (<672px) a focused Moment Conversation surface with a MEMORY HEADER (back, author photo+ring, safe life position, date · place, excerpt, thumb), responses, composer above the keyboard with home-indicator inset; desktop stays inline — moment-conversation-model.md:48-62
- Response Branch: one hairline from the Almanac spine; no thread trees, bubbles, comment cards — moment-conversation-model.md:64-69
- A response = small real photo + compressed Life Ring, name, words; metadata (time, edited) subordinate; actions Reply + ⋯ (own edit/delete, others Report); author opens Person World — moment-conversation-model.md:71-80
- Composer: avatar · input · Send; native OS emoji; no custom picker; failure never discards typed text (Retry); just-sent response settles once — moment-conversation-model.md:84-92
- Note.expression sticker is NOT faked; text only until schema exists — moment-conversation-model.md:94-97
- Privacy: responses inherit the Moment's visibility; Health/Problem have no conversation; View as public shows exactly what a visitor receives — moment-conversation-model.md:99-105
- Note author payloads must never carry birth data / exact age / day count; PersonRef {id,name,avatarUrl,bandIndex,bandLabel} only — social-api-contract.md:66-82, 123-128; social-interaction-spec.md:107-108, 168-190
- Layering: Escape closes the top-most layer only; closing returns focus to the opener — social-interaction-spec.md:13-15
- Live seams: POST /moments/{id}/responses {text,parentId?}, PATCH/DELETE /responses/{id}; response events may surface through the existing notification model; live arrival over WebSocket — moment-conversation-model.md:107-115; social-api-contract.md:206-222
- Thread fetched on expand, rest fetched on 'View n more' — social-api-contract.md:161-162
- Launch-safety: report/block decision; person-level block is a P1 launch safety item if absent — my-world-product-completeness.md:34

### WHAT EXISTS NOW
- Respond button (not on Health/Problem) calls openConversation(true); no dispatch — Moment.tsx:293-303, 162-167
- Presence-line responses control: 'Write a response' / '{n} responses' — Moment.tsx:374-384 (count = all notes incl. replies, :382)
- One-line preview of the most recent top-level response under the presence line — Moment.tsx:387-394
- Inline conversation (Notes): Response Branch, empty sentence, first 3 top-level + 'View N more' / 'Collapse', nested replies at pl-8, reply composer, main composer — Moment.tsx:464-525
- Focused phone surface MomentConversation (dialog, aria-modal, memory header, full list, bottom composer with safe-area inset) — Moment.tsx:536-614
- Adaptive threshold INLINE_DEPTH=2 counting top-level responses, frame width <672 — Moment.tsx:157-167
- NoteRow: PersonIdentity 20px ring at note.at, author name button → Person surface, '(you)', 280-char more/less, inline edit form, HH:MM time, 'edited', Reply on depth 1 only, ⋯ menu (own: Edit/Delete; other: Report toast) — Moment.tsx:616-696
- NoteComposer: textarea, Enter sends / Shift+Enter newline, 350ms simulated send, simulateFailure keeps text + Retry, double-send/blank blocked — Moment.tsx:698-772
- Reducer: note appends, noteEdit sets edited, noteDelete removes note AND its replies — store.tsx:192-197
- Dead reducer cases for the retired tap: respond (store.tsx:149-160), noteRespond (store.tsx:198-202) — no dispatcher
- Note type {id, authorId, text, at, parentId?, responses, respondedByViewer?, edited?} — data.ts:55-64; Moment still carries retired responses/responders/respondedByViewer — data.ts:85-88
- Fixtures: m-forty with 40 notes (every third a reply) — data.ts:614-627, 687-741; m-meeting 6 notes — data.ts:504-518; single-note Moments m-rain/m-1983/m-600 — data.ts:391, 407, 553
- Notifications are fixtures only; none generated at runtime (store.tsx:225-226); response-ish rows nt1/nt3/nt4/nt5/nt8 — data.ts:749-756; a Moment row lands on the Moment readout only — Chrome.tsx:471-477, focus-moment.ts:11-30
- Person surface from a response author: Message only for friend/family, opening MiniChat (≥1024) or /chat?c= — PersonCard.tsx:72-76, 131-135; Chat carries no Moment context — WorldProvider.tsx:27-39
- Privacy view model: band-only for others, exact only for self — view-model.ts:71-78, 110-113, 158-173; PersonIdentity resolves ring at the passed instant — PersonIdentity.tsx:61-65
- Localized conversation chrome conv.* ×12 + moments.writeResponse/responsesN — catalogs/en.ts:72-75, 332-344
- Life day view renders MomentEntry without a WorldProvider — circle/DayAlmanac.tsx:60; app/life/page.tsx:11-17

### WHAT IS COMPLETE
- Respond verb writes on desktop and in shallow (≤2 top-level) conversations: conversation opens and the composer is focused via rAF — Moment.tsx:165-166; asserted social-final.js:250-253
- Multiple people can write responses (any acting viewer; fixture threads with 8 distinct authors) — store.tsx:120-128, 192-193; data.ts:688
- One reply level inline: Reply on depth-1 rows only, reply composer 'Reply to {name}…', reply nests at depth 2 — Moment.tsx:485-502, 669-673; social-final.js:278-283
- Edited marker on responses — Moment.tsx:668; store.tsx:195
- Chronological order with no ranking: array insertion order, append on send — store.tsx:193; Moment.tsx:171, 474, 485
- Response Branch geometry — Moment.tsx:481
- Collapsed-feed preview of the most recent top-level response — Moment.tsx:387-394
- Empty state sentence — Moment.tsx:482; en.ts:333
- Send failure keeps text with Retry — Moment.tsx:710-715, 760-764; social-final.js:306-310
- Response author opens their Person surface inline (desktop and shallow phone) — Moment.tsx:637-640; social-r2-expression.js:129-130
- No reaction under a response; no aria-pressed control on rows — Moment.tsx:666-691; social-r3-3d-expression.js:133
- No Life text in response rows for other people (band-only ring, no age text); focused-surface header uses momentLifeFor (exact only for self) — Moment.tsx:632, 574; view-model.ts:110-113
- Memory header in the focused surface (author, safe life position, date · place, excerpt, thumbnail) — Moment.tsx:566-587; social-r3-3d-expression.js:145-153

### WHAT IS PARTIAL
- Edit own response: works, but uses a single-line <input> that strips line breaks, has no Escape handling, silently cancels on empty, and has no failure path — Moment.tsx:653-665
- Delete own response: immediate, no confirm (unlike the Moment's own inline confirm at Moment.tsx:333-343), no undo, no failure path, and CASCADES other people's replies — Moment.tsx:683; store.tsx:197; documented at social-interaction-spec.md:101
- Report another's response: a toast claiming 'someone will look' (en.ts:96) — nothing is recorded, nothing hidden — Moment.tsx:686
- Long-thread collapse (desktop inline): shows the OLDEST 3 top-level (Moment.tsx:474) while the preview shows the NEWEST (Moment.tsx:391-392), so the previewed response disappears behind 'View N more'; 'View N more' reveals all at once; hiddenCount ignores replies (Moment.tsx:475); sending expands the whole thread (Moment.tsx:519); chevron suppressed for deep threads at all widths (Moment.tsx:383)
- Focused phone surface: no focus return on close and scrim not touch-none (Moment.tsx:546-556, vs TransientSurface.tsx:38-46, 68); all 40 responses render at once (Moment.tsx:592-605); a just-sent response is appended off-screen with no reveal/settle (Moment.tsx:609 passes no onSent)
- Mobile composer: safe-area inset and autoFocus exist (Moment.tsx:608-609) but keyboard avoidance is simulated only (layout.tsx:18-25 has no interactive-widget; s7-device-responsive-contracts.md:43-44); Reply and ⋯ are 28px on phone (Moment.tsx:670, 675)
- Keyboard: Enter/Shift+Enter work, but advertised new lines are not rendered (Moment.tsx:645 lacks whitespace-pre-line; Chat does it at Messages.tsx:133); Popover has no focus return (Moment.tsx:416-442)
- Timestamps: HH:MM only, no date, not a <time> element — Moment.tsx:667; store.tsx:311-314
- Respond → Chat: reachable only via author → PersonCard → Message and only for friend/family; no Moment context travels — PersonCard.tsx:131-135; WorldProvider.tsx:27-39
- Permissions: every viewer who can see a Moment gets the composer (Moment.tsx:517-520); no canRespond/relationship rule; prototype does not enforce 'friends' visibility for the Moment itself (store.tsx:113-119)
- Localization: '(you)' (Moment.tsx:644), 'more'/'less' (Moment.tsx:648) and aria-label 'More' (Moment.tsx:675) are hardcoded English although moments.more exists (en.ts:101); ring aria 'Circle band …' hardcoded (PersonIdentity.tsx:65); name announced twice per row (LifeRing.tsx:76, 101 + button)
- Privacy hardening: response-author ring band is computed at note.at (Moment.tsx:632 → PersonIdentity.tsx:61-65 → view-model.ts:80-85); a series of timestamped bands across a 15-year boundary brackets the birthday; contract PersonRef does not specify the instant (social-api-contract.md:123-128)

### WHAT IS MISSING
- Moment-owner stewardship of other people's responses (hide/remove on their own Moment) — the ⋯ menu branches only on note authorship, never on moment.authorId === me.id — Moment.tsx:680-687
- Real report pipeline (reason, record, hide-pending-review) — Moment.tsx:686
- Person-level block/mute reachable from a response — my-world-product-completeness.md:34
- Runtime notifications for responses: 'responded to your Moment', 'replied to your response', mention; Notification has no noteId or response/reply kind (data.ts:102-115); posting a note touches no notification (store.tsx:192-193); landing goes to the Moment, not the response, and does not open the conversation (Chrome.tsx:471-477)
- Mentions (@person): no parsing, no model — yet fixture nt4 claims one (data.ts:752)
- Attachments / media / link previews in responses (by design text-only — moment-conversation-model.md:84-97); URLs are not linkified and there is no overflow-wrap for long tokens (Moment.tsx:635, 645; no rule in globals.css)
- Pagination / fetch-on-expand / loading and fetch-error states for threads — social-api-contract.md:161-162; all notes are in memory (data.ts:626)
- Length limit and rate limit: textarea has no maxLength; NOTE_LIMIT=280 is display truncation only — Moment.tsx:29, 627-628, 730-749
- Live arrival of responses (WebSocket candidate) — social-api-contract.md:210; prototype none
- Timezone-bearing response instants: notes are local ISO strings with no zone — data.ts:59; store.tsx:305
- Response → Person surface on the Life route (no WorldProvider; author renders as text) — circle/DayAlmanac.tsx:60; Moment.tsx:637

### WHAT IS BROKEN
- Reply is dead in the phone focused surface — the only place deep threads live on a phone: rows are passed onReply={() => {}} while the Reply button still renders — Moment.tsx:596, 599, 669-673; the surface composer has no parentId — Moment.tsx:609 (also SOCIAL_BIBLE_AUDIT.md:506-507 E-6)
- Respond on a deep Moment on a phone does NOT put the cursor in the composer: openConversation only sets focusedConv (Moment.tsx:164), NoteComposer's autoFocus (Moment.tsx:609, 734) is applied at commit, then MomentConversation's passive effect focuses the dialog container (Moment.tsx:546-548). The R3 capture script has to force focus manually (prototype-tests/_capture-r3.js:126). Code-inferred; not asserted by any suite
- Escape inside the focused surface closes more than the top-most layer: MomentConversation (Moment.tsx:549-550), Popover (Moment.tsx:419-428) and PersonCard (PersonCard.tsx:52-58) all register capture keydown on window and call stopPropagation, which does not stop other listeners on the same target — Escape on a response's ⋯ menu or on a PersonCard opened from the surface also closes the conversation (violates social-interaction-spec.md:14)
- Opening a response author from the phone focused surface likely renders the PersonCard BEHIND the surface: both are fixed z-[60] in the same stacking context, PersonCard is earlier in DOM (SocialPreview.tsx:673 vs the sheet at :716; PersonCard.tsx:82; Moment.tsx:555), and PersonCard's focus effect moves keyboard focus into it — code-inferred, needs browser verification
- Temporal honesty: a response shows only HH:MM (Moment.tsx:667), so the 2026 response on the 1983 Moment reads '09:40' under the '06 FEB 1983' date rule (data.ts:397-407)
- Fixture clock defect: fortyNotes() builds times with toISOString() (UTC) — data.ts:738 — so in Nepal time the responses are stamped ~5h45m BEFORE the Moment (evidence prototype-evidence/social-r3-3d-expression/19-focused-conversation-mobile.png shows 11:18 under a 16:40 Moment, 18-deep-collapsed.png)
- Line breaks: Shift+Enter is advertised (en.ts:341) but responses render collapsed (Moment.tsx:645) and editing via <input> destroys them (Moment.tsx:661)
- Stray DOM: an sr-only span reads the viewer's own name at the end of every open conversation, plus a hidden span printing dispatch.name — Moment.tsx:521-522
- No IME composition guard on Enter-to-send (Moment.tsx:740-745; no isComposing anywhere in src) — confirming a zh-Hans/Devanagari IME candidate with Enter can send a half-written response (plausible; not browser-verified)

### WHAT IS DISCONNECTED
- Response notifications are disconnected from responses: three fixtures say 'responded to your …' for Moments with zero responses (data.ts:751 → m-panorama data.ts:640-652; :753 → m-nepali-1 data.ts:566-578; :756 → m-snow data.ts:653-665) — the retired-tap meaning; nt4 'mentioned you in a note' (data.ts:752) points at m-video where the 20:30 note is Maya's own reply (data.ts:475)
- Notification → exact response: no noteId, landing stops at the Moment readout, conversation not opened — Chrome.tsx:471-477; focus-moment.ts:11-30
- Response → Chat: no Moment context; strangers get only Add friend — PersonCard.tsx:121-135; WorldProvider.tsx:27-39
- Life route: responses in DayAlmanac have no Person surface (no WorldProvider) — circle/DayAlmanac.tsx:60; Moment.tsx:637
- View as public swaps only the Hero/Circle viewer (SocialPreview.tsx:516); the Almanac's conversation keeps the owner perspective (composer, '(you)', own Edit/Delete) because MomentEntry reads `me` from the store (Moment.tsx:103; SocialPreview.tsx:737-743)

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- Retired tap still in the API contract: social-api-contract.md:103-105 (moment respond {count, byViewer}, notes {count}, viewer.canNote), :157-158 (note respond {count, byViewer}), :210-212 (Respond count live update) vs moment-conversation-model.md:29, 114-115 ('not part of the live contract; do not port them as a like counter') and code Moment.tsx:293-303 (Respond dispatches nothing). Registered as C-2 in SOCIAL_BIBLE_CONTRADICTIONS.md:16
- Stale interaction spec: social-interaction-spec.md:73-76 (Respond toggles ±1, who-responded popover, 'n notes'), :98 (composer '☺ ▣'), :100 ('Respond (+count)' on each note) vs code Moment.tsx:293-303, 750-757, 666-691 and moment-conversation-model.md:23-29, 75-77
- Stale copy rules: social-content-rules.md:113-120 ('n notes', 'Write a note', 'A note stays with the moment', 'View n more notes') and :188-189 ('comment (it is a note)') vs en.ts:332-344 and glossary systemboom-glossary.md:121 (C-7)
- Stale parity doc: social-feature-parity.md:86 (one reaction + who-list) and :88 ('respond on notes') vs moment-conversation-model.md:23-29, 75-77
- Health/Problem conversation: moment-conversation-model.md:102-103 says 'no conversation' vs Moment.tsx:371-395 where only the summaries are gated — the responses control, preview, Notes and composer are not (C-15; SOCIAL_BIBLE_AUDIT.md:502-505)
- Adaptive-depth threshold: moment-conversation-model.md:54 says '3+ responses' vs Moment.tsx:163 which counts TOP-LEVEL responses only (2 top-level + any number of replies stays inline on a phone)
- View as public: moment-conversation-model.md:104 ('shows exactly what a genuine visitor receives') vs SocialPreview.tsx:516, 737-743 + Moment.tsx:103 (conversation region stays owner-perspective in preview)
- Focus/Escape layering: social-interaction-spec.md:13-15 vs Moment.tsx:546-552 (no focus return), 419-428 + 549 + PersonCard.tsx:52-58 (Escape closes multiple layers)
- Notification vocabulary: moment-conversation-model.md:28 retires NOTE vs data.ts:749, 752 rendered verbatim at Chrome.tsx:542 (C-7, E-8)

### WHAT REQUIRES OWNER DECISION
- Moment-owner stewardship: may the author of a Moment (a) hide another person's response from everyone, (b) delete it, or (c) both — and is the response's author told? Options: hide-only (reversible, author sees 'hidden by {owner}') / delete / hide + report-to-review.
- Deleting a response that has replies: keep today's cascade (removes other people's words — store.tsx:197), replace with a tombstone ('Response removed') that keeps the replies, or disallow delete once replied to?
- Who may respond to a public Moment: anyone signed in who can see it, or connected people (friend/family) only? And may an owner turn responses off for one Moment?
- Health/Problem (C-15): may a private record carry responses at all (e.g. the owner's own annotations, or trusted people when shared as Friends), or is it strictly 'no conversation'?
- Collapsed-thread window: keep 'first 3 oldest' (current + social-api-contract.md:161) or show the latest 2–3 with 'N earlier responses' above — matching the preview (Moment.tsx:391) and the composer at the bottom?
- Mentions: build @mentions (visible only when the mentioned person can already see the Moment, with a notification) or not — and until then remove the 'mentioned you' notification fixture (data.ts:752)?
- Response → Chat: should 'Message' opened from a response carry a quiet reference to the Moment into Chat, or stay context-free (Chat is a separate product — moment-conversation-model.md:61-62)?
- Person-level block/mute for launch (my-world-product-completeness.md:34): required at launch (P1 safety) or deferred?
- Reply-to-a-reply: keep 'Reply only on top-level rows' (Moment.tsx:669) or add Reply on depth-2 rows that still writes under the same parent with a visible 'to {name}' addressee (depth stays one)?

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Wire Reply in the focused surface: give MomentConversation its own replyTo state and render the same reply NoteComposer (parentId) used inline — Moment.tsx:596, 599 (pattern at Moment.tsx:498-502)
- Keep the cursor in the composer on the phone path: do not focus the dialog container when a composer autoFocuses, or focus the textarea after the dialog — Moment.tsx:546-548, 609
- Return focus to the opener (Respond / responses control) and make the conversation scrim touch-none, mirroring TransientSurface — Moment.tsx:546-556 (reference TransientSurface.tsx:38-46, 68)
- Escape closes the top-most layer only: use stopImmediatePropagation (or a layer stack) in Popover and PersonCard and have MomentConversation ignore Escape while a child layer is open — Moment.tsx:421, 549; PersonCard.tsx:54
- Verify, then fix, PersonCard stacking above the conversation surface (raise PersonCard above z-60 or mount order) — PersonCard.tsx:82; SocialPreview.tsx:673; Moment.tsx:555
- Reveal a just-sent response in the focused surface (pass onSent, scroll it into view, sb-reveal) — Moment.tsx:609
- Temporal honesty: render the response's date when it is not today, using the existing sbDate grammar (never relative time — social-feature-parity.md:94), inside a <time dateTime> — Moment.tsx:667
- Fix the fixture clock: build fortyNotes times with localISO instead of toISOString — data.ts:738
- Preserve line breaks and wrap long tokens: whitespace-pre-line + break-words on the response text; edit with a textarea — Moment.tsx:645, 661
- IME guard: ignore Enter while e.nativeEvent.isComposing (or keyCode 229) — Moment.tsx:741
- Localize '(you)', 'more'/'less' and the ⋯ aria-label via the catalog (moments.more already exists, en.ts:101; English byte-identical keeps social-final.js:287, 298 selectors) — Moment.tsx:644, 648, 675
- Remove the stray sr-only viewer-name span and hidden dispatch.name span — Moment.tsx:521-522
- Mark the response-author ring decorative (label="") so the name is not announced twice — Moment.tsx:632 (supported by PersonIdentity.tsx:53)
- Phone touch targets: min-h-11 for Reply and the response ⋯ with @2xl restoring 28px — Moment.tsx:670, 675 (S7 pattern)
- 'Write a response' with zero responses should focus the composer — Moment.tsx:378 (openConversation(true) when notes.length === 0); show the disclosure chevron on desktop deep threads — Moment.tsx:383
- Correct notification fixture truth/vocabulary: 'left a note' → 'responded to'; give nt3/nt5/nt8 a matching response or reword; drop or reword the 'mentioned you in a note' row pending the mentions decision — data.ts:749, 751-753, 756
- Correct the stale docs to the accepted R3 behaviour (per AGENTS.md rule: fix the document, not the behaviour): social-api-contract.md:103-105, 157-162, 210-212; social-interaction-spec.md:73-76, 98-101; social-content-rules.md:113-120, 188-189; social-feature-parity.md:86, 88; moment-conversation-model.md:54 (top-level count)
- Specify in the live contract that a response author's PersonRef band is the CURRENT band (not a band at the response instant), so timestamped bands cannot bracket a birthday — social-api-contract.md:123-128; prototype equivalent Moment.tsx:632 (drop at=)
- Add a Response entity to the live contract: id, momentId, parentId?, author PersonRef, text (define max length), createdAt instant with zone, editedAt?, viewer {canEdit, canDelete, canReport}, cursor pagination on (createdAt,id), report endpoint — social-api-contract.md:154-162 (moderation fields await the owner decision)

<a id="rx"></a>
## RX — Boom + Celestial (combined action experience)
**Overall: PARTIAL** · master-table rows `RX-01` … `RX-34`

### WHAT THE PRODUCT NEEDS
- Three distinct systems on one Moment. RESPOND is the primary verb and it writes (docs/handover/moment-conversation-model.md:25). BOOM is one mascot Expression per viewer per Moment (docs/handover/moment-expression-contract.md:12-26). CELESTIAL Resonance is separate and additive, allows one per viewer, and is independent of Boom in both directions (references/celestial-resonance-bible/22-OWNER-DECISION-MASCOT-PRESERVED.md §1.2, §1.5-§1.6; 22-DATA-CONTRACT.md §9)
- The mascot is a preservation boundary: no rename, no paired 'Express' label, no redesign (22-OWNER-DECISION-MASCOT-PRESERVED.md §1.1-§1.2; 22-COMPONENT-ARCHITECTURE.md §11)
- RESPOND stays the primary visible verb (AGENTS.md R2 section: 'RESPOND stays the primary visible verb')
- The action row never wraps at 320/360. The presence line is information, not actions (moment-conversation-model.md §2, lines 41-46)
- Boom Human Pulse: at most 3 equal lenses plus '{n} people', no per-expression counts in the feed, a 36px line at every scale, static. The Spectrum is in canonical order with no bars or percentages. The who-list is identity-only at 40px and batched (docs/handover/human-pulse-contract.md §3-§5)
- Celestial counts stay visible under guardrails: canonical order, equal size, no totals on a Moment, '1.0k' at 1,000 and above, zero shown as '—' in Human Pulse, and no count animation for other people's commits (references/celestial-resonance-bible/COUNT-TRANSITION-RULES.md §0-§2)
- Celestial disambiguates the 8 shared words inside Celestial: OBJECT · MEANING + phrase, never the bare word. The accessible name is 'Celestial Resonance: Mercury, Curious. Tell me more.' (22-OWNER-DECISION-MASCOT-PRESERVED.md §1.3-§1.4; 22-COMPONENT-ARCHITECTURE.md §5)
- Learning states NEW/LEARNING/LEARNED come from caller-supplied local progress (22-COMPONENT-ARCHITECTURE.md §5; LEARNING-LAYER.md §2-§4)
- Health/Problem get no Expression control and no aggregate (moment-conversation-model.md §7; AGENTS.md R3.1 carryovers). Celestial is described as 'serious-context-capable' (21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:350)
- Notifications: Celestial uses the Signal tier only, is privacy-safe and stays inside the Moment's audience (21-CELESTIAL-RESONANCE-FINAL-BIBLE.md ch.16; 22-COMPONENT-ARCHITECTURE.md §8). A Boom first-Expression notification MAY exist (moment-expression-contract.md §4, lines 75-76)
- Visibility is inherited from the Moment. Who-lists never carry exact Life precision (moment-expression-contract.md:67-69; human-pulse-contract.md §5; 22-DATA-CONTRACT.md §5)
- The feed is still: no passive animation, and events stay local to the Moment, never the screen (systemboom-expression-language.md:86-89, 193-207)
- Live API seams: PUT/DELETE/GET expressions, server aggregates, and a paged who-list (moment-expression-contract.md §4; human-pulse-contract.md §9). ResonanceEvent carries no Life fields (22-DATA-CONTRACT.md §5-§8)
- Celestial ships dark. boomEnabled is pinned true (22-FEATURE-FLAG-ROLLOUT.md; 23-FEATURE-FLAG-STATE.md)

### WHAT EXISTS NOW
- Action row (data-sb-actions) holds: Respond pill (src/components/style-lab/social/Moment.tsx:293-303), Boom ExpressionControl (Moment.tsx:304), Celestial ResonateControl (Moment.tsx:305), a disabled desktop-only 'View in Life' (Moment.tsx:307-310), and the ⋯ overflow (Moment.tsx:311-356)
- The Celestial Field mounts by portal into an anchor below the row (Moment.tsx:362; src/components/celestial/ResonateControl.tsx:51-55, 137-151)
- Presence line (Moment.tsx:371-385): Boom ExpressionSummary (372), ResonanceSummary (373), and a responses toggle that reads 'Write a response' at zero (374-384). Below it: the last-response preview (387-394), the inline Notes (395) and the phone focused surface (396)
- Boom trigger: icon-only 44/40px lens with aria-label and title 'Express how this moment felt' (src/components/style-lab/social/expressions.tsx:895-919; src/lib/i18n/catalogs/en.ts:301). It shows DormantLens when empty and the owned BoomLens when selected (expressions.tsx:912-918)
- Boom Emotion Horizon: one vessel and six unlabeled core orbs. A caption names only the attended, performing or owned core (expressions.tsx:752-774, 861-878, 948-974). Emotion Atlas lists 18 named cores in 4 family bands (expressions.tsx:776-799, 976-1001). There is a visible Remove (880-884). Commit choreography is at 663-692
- Boom Human Pulse: at most 3 equal 22px lenses, viewer first, then the most represented types, plus '{n} people' (expressions.tsx:1040-1048, 1087-1107). Spectrum is canonical-order with counts (1109-1141). Who-list is PersonIdentity 40px with a raw person.name (1143-1189, name at 1164)
- Resonate doorway: a labeled 'Resonate' pill with a gold border and glow (ResonateControl.tsx:87-136). When selected, aria-label switches to the full resonance name (96) and the viewer's Seal replaces the mark (133)
- Celestial Field: 8 objects, radiogroup, roving tabindex, arrows/Home/End/Escape, OBJECT · MEANING labels always shown, phrase only in a shared aria-live readout, remove by re-selecting the chosen object (src/components/celestial/CelestialField.tsx:98, 175-215, 533-573, 619-681), close trigger with inert (690-714)
- Resonance Constellation: every present meaning in canonical order, equal 22px Seals, per-type counts when total>1, plus '{n} people' (ResonateControl.tsx:262-295). The expanded stage renders inline, listing up to 24 names per meaning, with an unresolvable-person fallback (300-389, 332-339)
- One pure aggregation rule in canonical order (src/lib/celestial/resonance-summary.ts:17-43). Registry of Primary 8 with seriousContextSafe flags (src/lib/celestial/registry.ts:13-103)
- Reducers: express (src/components/style-lab/social/store.tsx:171-179) and resonate (store.tsx:180-189), each one per viewer and independent. Harness sims exist (store.tsx:161-170)
- Flags: every Celestial surface defaults off. Local enable is ?celestial=1 (src/lib/celestial/flags.tsx:30-39, 53-77, 111-117)
- Celestial notification row renderer (src/components/style-lab/social/Chrome.tsx:547-551; ResonateControl.tsx:404-407). Notification.kind 'resonance' exists (src/components/style-lab/social/data.ts:111-114). Rows are produced only by the harness mode 'celestial' (store.tsx:224-232)
- Phone reflow: when Celestial is on, the constellation takes its own presence row, with 2×4 rows at 5+ meanings (src/components/celestial/CelestialEnvironment.tsx:185-193)

### WHAT IS COMPLETE
- One active Boom Expression per viewer per Moment: select, replace and remove. Prototype reducer (store.tsx:171-179; expressions.tsx:663-692)
- One active Celestial Resonance per viewer per Moment, bidirectionally independent of Boom (store.tsx:180-189; 22-DATA-CONTRACT.md §9)
- Boom Human Pulse, Spectrum and who-list as specified: equal-size lenses, canonical Spectrum, no bars or percentages, batched who-list (expressions.tsx:1020-1189; human-pulse-contract.md §3-§5)
- Celestial Field keyboard model, close-trigger inert handling and reduced-motion path (CelestialField.tsx:116-127, 200-215, 690-714)
- Life privacy inside both who-lists and the aggregates: no exact age, day count, birth data or Life fraction is rendered. Identity goes through PersonIdentity/view-model (view-model.ts:71-78, 87-88; expressions.tsx:1163; ResonateControl.tsx:336, 361). Relationship does not raise precision
- Canonical ordering and equal size for the Celestial constellation, with no winner, crown or size-by-count (resonance-summary.ts:28-37; ResonateControl.tsx:285)
- Both systems are gated off on Health/Problem (Moment.tsx:304-305, 372-373)
- Feed-level summaries of both systems are static. Motion is event-driven only, and reduced motion is honoured (expressions.tsx:1098-1104; CelestialEnvironment.tsx:239-242)
- Celestial flags default dark. boomEnabled is pinned true (flags.tsx:30-39, 100)

### WHAT IS PARTIAL
- Boom trigger learnability: no visible text. The name exists only as an aria-label and a mouse-hover title (expressions.tsx:900-901), so touch users get no label (touches the preservation boundary)
- On touch, the Boom quick horizon names a core only after commit. The caption shows the performing id, or the name appears via the hidden drag-preview gesture or in the Atlas (expressions.tsx:735-739, 803, 877-878)
- Disambiguating the 8 shared words is Celestial-only and word-level (CelestialField.tsx:619-634; ResonateControl.tsx:352; en.ts:353). At feed level both presence summaries are wordless, and both end in the identical string '{n} people' (en.ts:318 vs en.ts:356)
- Celestial Field dismissal: no outside-click or scrim close, so the Field can stay open beside an open Boom deck, and several Moments can have Fields open at once (ResonateControl.tsx:51-72; CelestialField.tsx:200-202). 22-COMPONENT-ARCHITECTURE.md §1 lists a CelestialFieldScrim
- Celestial removal is undiscoverable. The only way is re-tapping the selected object (CelestialField.tsx:177), and the key celestial.field.remove (en.ts:351) is unused
- The Celestial expanded stage is inline and uncapped, with up to 8 × 24 names in the feed (ResonateControl.tsx:202, 300-389; evidence prototype-evidence/celestial-social-universe/phone-dark-360-expanded.png). Boom's equivalent is a capped popover (expressions.tsx:1119, 1158)
- The Celestial selected state is subtle: the visible pill text stays 'Resonate' and only the 22px mark changes (ResonateControl.tsx:133-135)
- Accessibility naming: when selected, the Resonate button's accessible name ('Celestial Resonance: …') does not contain its visible text 'Resonate' (ResonateControl.tsx:96). The 'Who resonated' button name omits the visible '{n} people' (ResonateControl.tsx:268, 294). Both are WCAG 2.5.3 label-in-name issues
- Long-feed calm: hovering or opening Resonate shifts the page-wide sky and highlights the Moment (CelestialEnvironment.tsx:82-83, 109-111). That is screen-level feedback for a Moment-local action. Every Moment's Resonate also carries a persistent static gold glow (ResonateControl.tsx:114-120)
- The 'View in Life' seam occupies a desktop footer slot while disabled, and also appears disabled in ⋯ (Moment.tsx:307-310, 344, 351)

### WHAT IS MISSING
- Onboarding or first-use explanation of RESPOND vs BOOM vs RESONATE. No code exists. 19-LEARNABILITY-USABILITY.md §4 and 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md ch.36 list this as an unvalidated real-user question
- Celestial learning progression. ResonateControl never passes learningState, so the Field is permanently NEW (ResonateControl.tsx:139-147; CelestialField.tsx:88). The LEARNING-LAYER.md §4 long-press/tooltip sheet does not exist
- Tooltips or labels on constellation Seals and Boom pulse lenses in the feed. Both are decorative with no title (ResonateControl.tsx:285; ResonanceMark.tsx:61-64; expressions.tsx:1098-1104)
- Boom Expression notifications. This is a documented MAY seam, and the Notification.kind union has no expression kind (moment-expression-contract.md:75-76; data.ts:111)
- Live backend for both systems: aggregates, paged who-lists, audience inheritance, block/hidden-person filtering and real-time updates. Only contracts exist (moment-expression-contract.md §4; human-pulse-contract.md §9; 22-DATA-CONTRACT.md §5-§8)
- Celestial owner count-display preference (21-CELESTIAL-RESONANCE-FINAL-BIBLE.md ch.14)
- Id migration for renamed Boom ids (wonder → wow). No contract text covers it (moment-expression-contract.md:18 still lists 'wonder')
- A Celestial contract in docs/handover/, where the live developer ports from. Celestial docs exist only under references/celestial-resonance-bible/, and AGENTS.md has zero Celestial mentions

### WHAT IS BROKEN
- Action-row overflow when Resonate is present at phone widths. Respond + Boom + Resonate + ⋯ exceed the Moment column. In the phone captures the ⋯ overflow (Report/Hide/Edit/Delete/Privacy) is absent inside the Moment at 360 and cut at the edge at 390 (evidence prototype-evidence/celestial-social-universe/phone-light-360.png, phone-dark-360.png, phone-dark-390.png; row at Moment.tsx:290-358). This contradicts 'never wraps at 320/360' in moment-conversation-model.md:41. It only affects the flag-on state
- Desktop presence line: '1 response' wraps onto two lines and is pushed to the far right. Cause: ResonanceSummary root is w-full (ResonateControl.tsx:262) inside the non-wrapping presence flex row (Moment.tsx:371), and the reflow rule is phone-only (CelestialEnvironment.tsx:186-188). Evidence: prototype-evidence/celestial-social-universe/page-light-multi-8p.png, page-dark-all8-16p.png
- Stale Boom fixture id: m-panorama seeds 'p-krishna': 'wonder' (data.ts:643). 'wonder' was renamed to 'wow' in R3, so expressionEntries silently drops it (expressions.tsx:485-488) and the Moment shows 2 people where the R2 record says 3
- Boom who-list identity path renders raw person.name (expressions.tsx:1164). personOf falls back to fixture PEOPLE.m for any unknown id (store.tsx:271), so an unresolvable id would render as the real fixture person 'M'. The Celestial list guards this correctly (ResonateControl.tsx:334-339). This is a prototype edge case and the fix sits inside the preservation boundary
- Vacuous test assertion for the Celestial notification surface: ok(notifOk || true, ...) at prototype-tests/celestial-s3-s6.js:183

### WHAT IS DISCONNECTED
- Celestial notification rows are DISCONNECTED. The renderer exists (Chrome.tsx:547-551), but the only producer is harness mode 'celestial' (store.tsx:224-232), which no UI and no test dispatches (SocialPreview.tsx:487, 601 dispatch only seed/many/empty). The harness rows are cloned from the friend-request fixture with no momentId, so they cannot land on a Moment. They render fixture English 'resonated with your moment' instead of the unused key celestial.notification.resonated (en.ts:359). ResonanceNotificationMark does not check useCelestialSurface('notifications') (ResonateControl.tsx:404-407)
- The Celestial serious-context path is dead code. ResonateControl defines SERIOUS_KINDS and passes seriousContext (ResonateControl.tsx:33, 142), but Moment.tsx:305 never mounts it on Health/Problem, so the registry's seriousContextSafe filtering (registry.ts:45, 66; CelestialField.tsx:98) never runs
- Unused i18n keys: celestial.system, celestial.field.remove, celestial.summary.youAndN, celestial.notification.resonated, expr.summaryN, expr.whoTitle (en.ts:347, 351, 357, 359, 306-307). The system name 'Celestial Resonance' is never shown visually

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- Count totals: COUNT-TRANSITION-RULES.md §1.8 says 'No totals on a Moment; the per-object counts are the only numbers'. Code shows '{n} people' beside the per-type counts (ResonateControl.tsx:294)
- Compact numerals: COUNT-TRANSITION-RULES.md §2 wants '1.0k' at 1,000 and above. Code renders full locale numerals (ResonateControl.tsx:246), matching human-pulse-contract.md:62-63 ('no invented 1K'). The two docs disagree
- Zero states: COUNT-TRANSITION-RULES.md §2 and 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:273 want Human Pulse to show all eight, with '—' for zero. Code omits absent meanings (resonance-summary.ts:29). Bible ch.14 also describes a chronological or relationship-ordered people list with owner-gated counts. Code shows a count-bearing constellation strip with no owner gate
- Count animation: COUNT-TRANSITION-RULES.md §1.7 and §2 allow no animation for other people's commits. Code crossfades the count and settles new nodes on any single-person live change, including other people's (ResonateControl.tsx:227-240)
- Cross-system count policy: human-pulse-contract.md:69 says 'No per-expression counts in the feed' (Boom). The Celestial constellation shows per-type counts in the same presence line (ResonateControl.tsx:286-290), per the COUNT-TRANSITION-RULES.md §0 owner decision. Opposite anti-popularity rules sit side by side
- Boom representatives: moment-expression-contract.md:28-29 says 'the aggregate is registry-ordered marks + one count' and systemboom-expression-language.md:27 calls that contract 'still current'. human-pulse-contract.md:65-67 and code (expressions.tsx:1040-1048) select the 'most represented' types, viewer first
- moment-expression-contract.md:18, 34-41 lists 6 ids including 'wonder', with obsolete accents (celebrate as boom red). Code has 18 ids, 'wow', and four colour families (expressions.tsx:53-56, 141-203)
- Hierarchy: AGENTS.md R2 ('RESPOND stays the primary visible verb') and moment-conversation-model.md:25 vs the Resonate pill's gold border, gradient and glow, which make it the most prominent footer element (ResonateControl.tsx:104-131; evidence page-light-multi-8p.png)
- moment-conversation-model.md §2 (lines 36-46) describes the action area as '[Respond] [mascot Expression] … [View in Life] [⋯]' and presence as at most three mascot expressions plus the response count. Code adds Resonate and the Resonance Constellation (Moment.tsx:305, 373)
- 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:251 says a Moment has 'exactly three actions: Respond, Resonate, and a view into Human Pulse'. Code has Respond, Boom, Resonate, View in Life (disabled) and ⋯ (Moment.tsx:293-356)
- 19-LEARNABILITY-USABILITY.md:19 and 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:245 assume 'Boom's tray … always shows a label and a color dot'. The R3.8 horizon shows unlabeled orbs, and the caption names only the attended core (expressions.tsx:752-774, 877-878)
- 22-COMPONENT-ARCHITECTURE.md §5 and 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:497 say NEW shows the phrase with every label. Code deliberately shows the phrase only in the shared readout (CelestialField.tsx:607-617)
- Serious context: 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:350 calls Celestial 'serious-context-capable', COUNT-TRANSITION-RULES.md §1.10 keeps counts in serious contexts, and registry.ts carries seriousContextSafe. Code never offers Celestial on Health/Problem (Moment.tsx:305)
- Health/Problem conversation: moment-conversation-model.md:102-103 says 'no conversation'. Code and the accepted test keep responses on quiet kinds: Moment.tsx:374-395 is not gated, and prototype-tests/social-shell.js:288-289 asserts 'its responses intact'. Already registered as references/social-bible-audit/SOCIAL_BIBLE_CONTRADICTIONS.md C-15
- Governance: 22-REPOSITORY-INTEGRATION-AUDIT.md:51, 79 and 22-COMPONENT-ARCHITECTURE.md §3 state Moment.tsx is 'not in any frozen zone'. AGENTS.md freezes src/components/style-lab/social/**, yet Stage 23 edited Moment.tsx (21, 305, 359-362, 373), store.tsx (164-170, 180-189), data.ts (94-99, 110-114), Chrome.tsx (27, 547-551) and SocialPreview.tsx (36-37, 434, 480-485, 607, 641) with no exception rows in AGENTS.md
- references/social-bible-audit/SOCIAL_BIBLE_AUDIT.md:1222 says Celestial Resonance is 'absent from this repository' (zero occurrences). Code now contains src/components/celestial/** and src/lib/celestial/**
- Notification fixture vocabulary: data.ts:749 ('left a note') and 752 ('mentioned you in a note') use NOTE, which moment-conversation-model.md:28 removed from user-facing vocabulary. data.ts:751 says Bikash 'responded to your Mustang panorama', but m-panorama has no responses (data.ts:641-652). The text is a relic of the retired anonymous tap
- Locale drift in the shared-word overlap: en and es use identical Boom and Celestial words for all 8 meanings. ne and zh-Hans differ for Joy, Touched and Laugh (e.g. ne expr.joy 'खुसी' vs celestial.meaning.joy 'आनन्द'). So whether the word itself disambiguates depends on locale, with no rule behind it (src/lib/i18n/catalogs/ne.ts, zh-Hans.ts, es.ts)

### WHAT REQUIRES OWNER DECISION
- Is Celestial Resonance on Moments part of Social completion? Options: (a) launch My World with Boom only and Celestial flag-off; (b) launch both side by side, which makes the phone overflow and hierarchy items blocking; (c) enable Celestial only on some surfaces or contexts
- Which control leads the Moment footer visually? Options: (a) Respond leads, per R2/R3 docs, and Resonate is toned down to the same visual weight; (b) Resonate stays the most prominent (current gold glow); (c) Respond and Boom are primary and Resonate is a secondary doorway
- One count policy for the presence line? Options: (a) keep the divergence: Boom has no per-type counts in the feed, Celestial keeps per-type counts per the COUNT-TRANSITION-RULES §0 decision; (b) Celestial adopts the Human Pulse grammar (at most 3 Seals + '{n} people', per-type counts one step deeper); (c) Boom adopts per-type counts. Also decide whether the Celestial '{n} people' total is allowed (COUNT-TRANSITION-RULES §1.8 forbids totals)
- How should two presence summaries read? Options: (a) keep two separate '{n} people' facts; (b) add a visible system cue to each (e.g. the Celestial object name, or the system names); (c) one combined human-presence line that opens either system's detail
- How does a first-time user learn Respond / Boom / Resonate? Options: (a) labels only (status quo); (b) a one-time inline explainer; (c) Boom-as-guide first-run teaching (Bible ch.20); (d) the LEARNING-LAYER long-press/tooltip sheet. Also: may the Boom trigger gain a visible label, given the mascot preservation boundary?
- Should Celestial be offered on Health/Problem Moments? Options: (a) no, keep parity with Boom (current); (b) yes, quiet register only, excluding Laugh and Celebrate as the registry already encodes
- May a Health/Problem record carry responses at all? (SOCIAL_BIBLE_CONTRADICTIONS C-15.) Options: (a) yes, and fix the doc to match the accepted test; (b) no, and gate Moment.tsx:374-395, updating social-shell.js with a recorded supersession
- Notification policy across the three systems. Options for Boom: notify on first Expression, or never. When one person Responds + Expresses + Resonates on one Moment: three rows, or one grouped row. Should either system be mutable per person?
- Who-list visibility on a public Moment. Options: (a) any viewer sees every expresser's or resonator's name (current, both systems); (b) connections by name, everyone else aggregated as '+N people' (the Celestial 'unnamed' path already supports this); (c) owner-only names. Block and hidden-person handling is needed in all cases
- May a person Boom and/or Resonate on their own Moment, and does it count toward '{n} people'? Current code allows both on own Moments (Moment.tsx:304-305)

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Stop the desktop '1 response' wrap. Make ResonanceSummary's root full-width only inside the ≤700px container (drop w-full / use flex-1 min-w-0 above it) at src/components/celestial/ResonateControl.tsx:262, alongside src/components/celestial/CelestialEnvironment.tsx:186-188. Optionally add whitespace-nowrap to the responses button (Moment.tsx:379, a frozen-file defect fix to record in AGENTS.md)
- Make the phone action row fit with Resonate present, e.g. compact Resonate padding or label below @2xl, or Celestial's phone container rule letting the ⋯ keep its slot. Touch only Celestial files: ResonateControl.tsx:104 and CelestialEnvironment.tsx. Then re-run prototype-tests/s7-device-mastery.js §1 with ?celestial=1
- Fix the stale fixture id at src/components/style-lab/social/data.ts:643 ('wonder' → 'wow'). This is a frozen-file defect fix; record it in the AGENTS.md table
- Gate ResonanceNotificationMark on useCelestialSurface('notifications') (ResonateControl.tsx:404-407). Render celestial.notification.resonated (en.ts:359) instead of fixture text. Give the harness rows a momentId (store.tsx:227-231) and a UI or test dispatch path. Replace the vacuous 'ok(notifOk || true, …)' at prototype-tests/celestial-s3-s6.js:183
- Accessibility name fixes: make the selected Resonate aria-label contain the visible word, e.g. 'Resonate — {full name}' (ResonateControl.tsx:96), and include the visible '{n} people' in the Who button's name (ResonateControl.tsx:268)
- Cap the inline Resonance stage with max-height plus overscroll-contain, matching Boom's who panel (ResonateControl.tsx:300-303; compare expressions.tsx:1158)
- Add a visible 'Remove your resonance' control to the Field using the existing key (en.ts:351) near the readout (CelestialField.tsx:533-575)
- Add outside-pointer and scrim dismissal to the Celestial Field, per 22-COMPONENT-ARCHITECTURE.md §1 (ResonateControl.tsx:51-72)
- Boom who-list: read the name via personViewFor and skip unresolvable ids, as the Celestial list does (expressions.tsx:1159-1165; pattern at ResonateControl.tsx:334-339). This is a defect fix inside the preservation boundary, not a redesign; record it in AGENTS.md
- Doc corrections to match accepted behaviour. moment-expression-contract.md:18, 34-41 (18 ids, wow, families). moment-conversation-model.md:36-46 (add Resonate/Constellation) and :102-103 (quiet kinds keep responses, per social-shell.js:288-289). 19-LEARNABILITY-USABILITY.md:19 and 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:245, 251 (the stale Boom-tray premise and the 'exactly three actions' line). references/social-bible-audit/SOCIAL_BIBLE_AUDIT.md:1222 (Celestial is no longer absent)
- Record the Stage 23 Celestial edits to frozen Social files as rows in the AGENTS.md exception table (Moment.tsx:21, 305, 359-362, 373; store.tsx:164-170, 180-189; data.ts:94-99, 110-114; Chrome.tsx:27, 547-551; SocialPreview.tsx:36-37, 434, 480-485, 607, 641). Add a docs/handover pointer to the Celestial contracts
- Update notification fixture vocabulary 'note' → 'response' at data.ts:749 and 752, and fix nt3 (data.ts:751), which claims a response on a Moment that has none
- Reorder the screen-reader summary template so the object or system name leads, e.g. 'Venus, Love: 3 people', in celestial.summary.typeCount (en.ts:362 plus the 7 other catalogs)

<a id="id"></a>
## ID — Person identity / profile / Life Ring
**Overall: PARTIAL** · master-table rows `ID-01` … `ID-24`

### WHAT THE PRODUCT NEEDS
- One identity component for every person surface, drawing a real photo inside the Life Ring; no second avatar system anywhere (docs/handover/person-life-identity.md §1, §11; AGENTS.md 'Person + Life Identity'; PersonIdentity.tsx:10 claim)
- Fallback order is real photo → initials only. No illustrated or curated tier. A failed photo falls back to initials, never a broken-image icon (person-life-identity.md §2)
- The Life Ring shows band level for anyone except the owner. Only the owner gets the red now-tick. Relationship and presence are never drawn in ring geometry (person-life-identity.md §3, §5)
- A visitor never receives birthDate, birthTime, birthTimeKnown, a birth instant, exact age, years/months/days, totalDays, next-round data, the Circle fraction or band calendar years. The server ships bandIndex + bandLabel only. 'There is no friends may see exact age tier' (social-api-contract.md §C, §F; view-model.ts:1-15)
- PersonRef = { id, name, avatarUrl?, bandIndex, bandLabel }. Nothing else (social-api-contract.md §D.1)
- lifeAtMoment is exact only when author == viewer; otherwise { bandLabel } (social-api-contract.md §D)
- Aggregation rationale: counts of another person's dated Moments per age band narrow their birth date ('a 2019 Moment in 30–45 means born before 1989'), so visitors get no density (docs/design/circle-of-life.md:97-101)
- Visitor density on the ring counts public Moments only; `connected` stays threaded but unused until the backend contract is verified (person-life-identity.md §10; AGENTS.md Social Freeze Delta)
- Owner hero: Born row, day count, contact pill labelled 'ONLY YOU SEE THIS'. Visitor hero: name, place, 'Circle band X', a band panel, a tick-less ring, no Born row (social-content-rules.md §7; social-feature-parity.md:42-52)
- Relationship states friend · family · request-in · request-out · none, each with its actions. Message only for connected people (people-chat-integration.md §2-§3)
- View as public renders the owner's World through the same visitor-safe model (person-life-identity.md §9)
- A visitor's profile feed is the same shape filtered to one author, with onlyme excluded (social-api-contract.md:204; social-feature-parity.md:121)
- The person surface maps to the live profile page (my-world-product-completeness.md:17; people-chat-integration.md §3)
- The owner's ring enters Life (/life); a visitor's ring is inert (person-life-identity.md §7)
- Owner cover and photo actions have real live functions behind them (social-feature-parity.md:44)
- Person-level block is a P1 launch-safety decision if the live product lacks it (my-world-product-completeness.md:34, :48-50)

### WHAT EXISTS NOW
- PersonIdentity resolves personViewFor + ringViewFor + momentLifeFor for each (viewer, subject) pair and renders one LifeRing (src/components/identity/PersonIdentity.tsx:61-66)
- RingAvatar shows the photo when person.avatar is set, falls back to initials, and swaps to initials on onError (src/components/style-lab/social/LifeRing.tsx:225-237)
- LifeRing: the tick renders only when ring.fraction is set (owner). For others the current band is drawn whole (LifeRing.tsx:65, 72, 149-152, 198-205). Instrument treatment applies at size ≥140 (LifeRing.tsx:33, 66)
- Privacy view model: OtherLife = {scope, band, bandIndex}. Contact is owner-only. bandYears is owner-only (view-model.ts:54-58, 71-78, 87-107). FORBIDDEN_ON_OTHER list at view-model.ts:176
- Visitor density counts public Moments only and excludes health/problem. `connected` is unused (view-model.ts:164-171)
- PersonIdentity defaults `connected = false`, so any call site that passes `moments` enters the visitor-density branch (PersonIdentity.tsx:36, 63; view-model.ts:164)
- ProfileHero owner branch: ring links to /life (:185), change-photo button (:196), 'band · N days · Life →' link (:259-267), Born date · time or 'unknown' (:278-285), contact pill (desktop :286-292, mobile disclosure :325-344), View as public (:303-312), Change cover and Who can see (:314-323)
- ProfileHero visitor branch: kicker '{Name}'s World' (:166), inert ring (:188-190), five relationship states + actions (:212-251), band panel 'Circle band X — the exact age is theirs to share' (:268-272)
- View as public: PUBLIC_VIEWER stand-in (SocialPreview.tsx:45). heroViewer feeds ProfileHero, CircleModule and the counter only (:516, 519, 678, 704). Composer is hidden (:726)
- LifeCounter accepts OwnerLife only (LifeCounter.tsx:54). Visitor sees 'A person's counter is theirs to see. Band X' under the heading 'My life in' (SocialPreview.tsx:696-701)
- CircleModule visitor: band-only centre and readout. The month count is owner-gated (CircleModule.tsx:44-80)
- PersonCard: 56px PersonIdentity with moments + connected (public-only density). 'Circle band X · <relationship word>' plus actions for all 5 states (world/PersonCard.tsx:63-141)
- Moment readout: exact age for the viewer's own Moments, otherwise the author's band AT THE MOMENT'S DATE. The author ring also uses at=moment time (Moment.tsx:109-112, 181, 194-198)
- Response/note author ring at note time, name opens the person surface (Moment.tsx:632-642). Deep-conversation header shows exact age or band · date · place (Moment.tsx:570-576)
- Life Cursor: year · (exact | 'Life <band at moment>') · place, computed with the store viewer `me` (LifeCursor.tsx:75-88; SocialPreview.tsx:717)
- Search people rows: 28px identity, exact age or band, then relationship chip or home town (Chrome.tsx:367-377). Search Moments: 22px identity, name · date · place (:391-393). Search and feed hide only `onlyme` (Chrome.tsx:253; store.tsx:113-118)
- Notifications: request row 32px identity-only with Accept/Decline (Chrome.tsx:512-524). Moment row 24px identity + Moment date · place (:540-554)
- People panel rows: 40/48px identity, exact age or 'Circle band X' (+ town for requests) (world/People.tsx:121-137)
- Messages / MiniChat / full Chat: PersonIdentity with label='' at 28/24/26px, no life text (Messages.tsx:88, 195; ChatSurface.tsx:84, 115)
- Celestial resonance people: 20px PersonIdentity + personViewFor name, not clickable (celestial/ResonateControl.tsx:333-363). Boom who-expressed: 40px PersonIdentity + raw name, not clickable (expressions.tsx:1161-1165)
- Legacy `Avatar` (no Life Ring, no onError fallback) is still used for the signed-in person in IdentityGate.tsx:202, 277 and the frozen cosmos/overlays.tsx:198 (ui/Avatar.tsx:19-60)
- Relationship and conversation state is a single map from Maya's perspective, whoever the acting viewer is (world/model.ts:29-46; WorldProvider.tsx:119-127)
- The /world product route renders only the fixture owner: harness viewer params are ignored when `product` is set (SocialPreview.tsx:465). SocialStore always resolves PEOPLE.maya/asha (store.tsx:104-110). The gate identity is used only for gating and logout (PersonalDestination.tsx:16-38; Chrome.tsx:84, 198)
- Every fixture person's birthDate is in the client bundle (data.ts:135-157; synthPerson data.ts:184). A prototype mirror only; view-model.ts:11-14 says the server must do this

### WHAT IS COMPLETE
- Single identity component on every Social / People / Chat / Celestial / Boom person surface. No raw <img> avatars inside Social (grep: every person render goes through PersonIdentity; the other <img> elements are Moment media or expression art)
- Real photo → initials fallback with an onError swap (LifeRing.tsx:225-237). Photos present for Maya, Krishna and 8 cast members; initials for Asha, Bikash, Ramesh, Sunita, Prakash, M and sim- people (data.ts:122-157)
- Structural privacy of the owner-vs-other life shape: exact age, day count, fraction/tick, birth date/time and band calendar years are ABSENT for non-owners (view-model.ts:87-107, 158-173; LifeRing.tsx:65, 198)
- Relationship never raises precision: lifeViewFor never reads relationship, and ringViewFor keeps `connected` unused (view-model.ts:87-88, 164-171). PersonCard and ProfileHero are band-only whatever the relationship (PersonCard.tsx:92-106; ProfileHero.tsx:268-272)
- Relationship never in ring geometry: data-sb-ring is only own/other (LifeRing.tsx:101)
- Owner hero content: Born row, day count, owner-only contact, Life entry, ring → /life (ProfileHero.tsx:185, 259-292)
- Visitor hero content: band panel, no Born row, no contact, inert ring, '{Name}'s World' kicker, brand label agreeing (ProfileHero.tsx:166, 188-190, 268-272; SocialPreview.tsx:523)
- Relationship state + action row covering all five states on the Hero and on PersonCard. Message only when connected (ProfileHero.tsx:212-251; PersonCard.tsx:110-141)
- CircleModule visitor branch: band only, no counts, no calendar years, no month count (CircleModule.tsx:44-80)
- LifeCounter owner-only by type (LifeCounter.tsx:54)
- Chat surfaces carry no life text (Messages.tsx:88-93; ChatSurface.tsx:84-87)

### WHAT IS PARTIAL
- View as public: faithful for the Hero, CircleModule and counter only. The Moment stream and Life Cursor still render as the owner (see broken)
- Visitor Person World works only in the style-lab harness (?viewer=visitor|ashaVisitor|prakashVisitor). In visitor modes the top bar's Notifications, Messages and People show Maya's data to the acting visitor, and 'Return to My World' switches the acting person to Maya (SocialPreview.tsx:526; WorldProvider.tsx:119-120)
- Accessible and tooltip labels have hard-coded English: PersonIdentity.tsx:65 `Circle band ${band}`, LifeCursor.tsx:77 `Life ${band}`, Moment.tsx:195, 197 titles, LifeRing.tsx:109, 185 aria, CircleModule.tsx:87 'Circle settings', ProfileHero.tsx:121 '— profile', SocialPreview.tsx:693 'Life instruments', Messages.tsx 'Open in Chat' / 'Chat with'
- Visitor sidebar card is titled 'MY LIFE IN' on someone else's World (SocialPreview.tsx:696; evidence prototype-evidence/s2-person-world/10-visitor-desktop-light.png, 33-view-as-public.png)
- Celestial resonance people list and Boom who-expressed list show correct identities but do not open the person surface, unlike Moment author, note author, with-people, Search, People and Notifications (ResonateControl.tsx:359-363; expressions.tsx:1161-1165)
- RingAvatar's failed state is a boolean that never resets when the src changes, so a new photo after a failure stays as initials (LifeRing.tsx:226). ProfileHero's cover already tracks the failed source correctly (ProfileHero.tsx:105-106)
- label='' makes the ring's aria read 'Name — ' with a trailing dash (LifeRing.tsx:76; call sites Messages.tsx:88, 195; ChatSurface.tsx:84, 115; ResonateControl.tsx:361; Chrome.tsx:391)

### WHAT IS MISSING
- About/bio on the Person World. demoUser.bio exists (lib/mock/demo-user.ts:18) but Person has no bio field (data.ts:11-23) and ProfileHero renders none. No approved doc requires one
- Any home-place or profile visibility model. Home is always shown to every viewer (view-model.ts:72; ProfileHero.tsx:205; PersonCard.tsx:96; People.tsx:122). The 'Who can see your profile' control has no behaviour (ProfileHero.tsx:320, 340)
- Photo and cover upload flows. 'Change your photo' (ProfileHero.tsx:196) and 'Change cover photo' (:316, :336) have no onClick
- Friends/family list, mutual people and shared Moments/Places on a Person World: nothing in code
- A product route to another person's World. PersonCard has no 'open their World' action (PersonCard.tsx:110-141). /world is owner-only (SocialPreview.tsx:465)
- Person-level block/report on PersonCard or the Person World: only Moment-level Report/Hide exists (my-world-product-completeness.md:34)
- Real-photo rule enforcement. `?photo=bad` renders a document photo inside the ring unchallenged (SocialPreview.tsx:535). The policy is stated in person-life-identity.md §2 but nothing enforces it
- A viewer-relative relationship and conversation model in the data contract. social-api-contract.md §C profileVisitor has no relationship/canMessage field; the prototype map is one-perspective (model.ts:29-46)

### WHAT IS BROKEN
- Relationship direction is inverted on the visitor Hero. heroRelationship = world.relationshipOf(me.id) (SocialPreview.tsx:512) reads Maya's map. RELATIONSHIPS[prakash]='request-in' means Prakash asked Maya (model.ts:34; notification data.ts:748). In ?viewer=prakashVisitor (store.tsx:126) Prakash, the requester, is shown 'Wants to connect' + Accept/Decline for his own request, and Accept dispatches accept for viewer.id (ProfileHero.tsx:117, 235-249). The accepted test asserts this behaviour (prototype-tests/social-connection-final.js:184-189). Contradicts people-chat-integration.md §2 ('request-in: they asked; I can Accept')
- The visitor Hero's Message opens a chat with the visitor themself. message() dispatches openMini with id=viewer.id (ProfileHero.tsx:112-113). MiniChat's header renders personOf(mini.personId), which is the visitor's own name and photo (Messages.tsx:177, 195-197), over Maya's conversation keyed by the visitor
- View as public misrepresents what the public sees. Only the Hero, Circle and counter get PUBLIC_VIEWER (SocialPreview.tsx:516, 678, 704). The stream still uses the store `me` (Moment.tsx:103, 112; store.tsx:274), so Maya's own Moments show exact ages, her onlyme Health/Problem Moments (m-health, m-problem; data.ts:452-459, 520-527) stay in the list, and owner edit menus stay live. The Life Cursor gets viewer=me (SocialPreview.tsx:717). The test checks only the hero's shape and three literal strings, one of them the live-clock-fragile '12,731' (person-life-identity.js:320-343)

### WHAT IS DISCONNECTED
- Visitor Person World is not reachable in the product. The visitor ProfileHero branch renders only through harness viewer modes (SocialPreview.tsx:465-471). The live requirement is 'map to the live profile page' (my-world-product-completeness.md:17)
- My World does not render the signed-in identity. SocialStore always resolves the fixture Maya/Asha (store.tsx:104-110, 263-264). PersonalDestination only gates (PersonalDestination.tsx:16-38). A newly created gate identity enters a World showing Maya Rai's photo, birth date/time and contact as its own
- Owner management controls are inert: change photo, change cover, who can see (ProfileHero.tsx:196, 316, 320, 336, 340). The CircleModule settings button is inert (CircleModule.tsx:87)
- Chat deep link ?c= opens a conversation with any existing person, including relationship 'none' (ChatSurface.tsx:51), while the product rule is Message for connected people only (people-chat-integration.md §2). This needs a server-side guard (a P1 already named in my-world-product-completeness.md:48-50)

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- PRIVACY (new): per-Moment band on dated Moments narrows birth dates. The code shows another author's band at the Moment's own date in the readout (Moment.tsx:112, 197), the author ring (Moment.tsx:181, at=moment), the conversation header (Moment.tsx:570-574), note authors (Moment.tsx:632, at=note.at) and the Life Cursor (LifeCursor.tsx:76-77). social-api-contract.md §D mandates `lifeAtMoment: {bandLabel}` for others. That conflicts with docs/design/circle-of-life.md:97-98 (a band on a dated Moment narrows the birth date; the doc's own example) and with the hard rule of no birth-derived calendar precision. Fixture proof: Sunita (born 1979-11-02, data.ts:138) shows '30–45' on m-wedding 2022-10-17 and '45–60' on m-tenphotos 2026-04-13, both visible to visitor Bikash. That brackets her 45th birthday, narrowing her birth from a 15-year window to about 3.5 years. Dense Moments across any band edge narrow it to days. references/social-bible-audit/SOCIAL_BIBLE_PRIVACY_MATRIX.md §4 and person-life-identity.md:62-63 wrongly state this 'cannot narrow a birth date'
- Visitor ring density and engraving. The code renders public-only density and instrument engraving on a visitor's ring (view-model.ts:164-171; LifeRing.tsx:86-87, 149-155; ProfileHero.tsx:189 passes moments+connected; my-world-2030.js:128-131 asserts friend == stranger engraving). LifeRing.tsx:18-21 header and the AGENTS.md My World 2030 row say engraving is 'owner only'. circle-of-life.md:99-101 says visitors get no density in the Life Ring. Related to bible C-5
- social-api-contract.md §C lists `momentsThisMonth` in profileVisitor. CircleModule.tsx:80 and AGENTS.md (Social Freeze Delta) treat a visitor month count as a density leak and gate it owner-only
- Visitor feed: social-api-contract.md:204 and social-feature-parity.md:121 say it is filtered to one author. store.tsx:113-118 and SocialPreview.tsx:738 show the visitor the same mixed stream (all authors), with every friends-privacy Moment (bible C-14 / P-1)
- 'No second avatar system anywhere' (PersonIdentity.tsx:10; person-life-identity.md §11) vs the legacy ui/Avatar still drawing the signed-in person in IdentityGate.tsx:202, 277 and cosmos/overlays.tsx:198
- person-life-identity.md:27-30 says only two fixtures carry a photo. data.ts:122-157 has ten (Maya, Krishna + 8 cast)
- person-life-identity.md:56-60, 66-68 (friends count when connected) vs its own §10 :169-171 and view-model.ts:169 (public only). Already bible C-5
- person-life-identity.md:80-84 scale table gives ProfileHero 72/96px. ProfileHero.tsx:44-46 uses 168/116 (instrument)
- person-life-identity.md:93-97 says there is no separate public-preview mode. Its own §9 and SocialPreview.tsx:437-438 implement View as public
- person-life-identity.md:98-99 says no animation. LifeRing.tsx:106, 168, 201, 209 + ProfileHero.tsx:186, 189 animateEntry. Already bible C-10
- social-visual-spec.md:106-110, 195-197 and social-feature-parity.md:51 say the hero carries the counter below desktop. ProfileHero.tsx has no LifeCounter; the only counter is SocialPreview.tsx:695-702 (@max-5xl:hidden), so there is no counter below @5xl (removal owner-approved in AGENTS.md My World 2030)
- social-visual-spec.md:191-193 says the ring-framed avatar overlaps the cover. ProfileHero.tsx:143-179 has no overlap (AGENTS.md bans the overlap grammar)
- social-content-rules.md:103 and social-feature-parity.md:47 give the Born row as '04 NOV 1991 · 06:42 · Kathmandu'. ProfileHero.tsx:282 renders date · time with no city (city is shown separately at :205)
- social-content-rules.md:104-105 gives the visitor band panel as '… years — the exact age is theirs to share'. en catalog life.exactAgeTheirs / ProfileHero.tsx:270 render 'Circle band X — the exact age is theirs to share'
- Wording drift across surfaces for the same state: PersonCard 'Add Friend' (person.addFriend) vs Hero 'Add friend' (rel.addFriend); PersonCard request-in 'Asked to be your friend' vs Hero 'Wants to connect' (en.ts:57, 67, 69, 288)

### WHAT REQUIRES OWNER DECISION
- Life position on OTHER people's dated Moments (readout, author ring at Moment time, note authors, Life Cursor). Options: (a) keep band-at-Moment and accept birth-date inference at band edges; (b) show the subject's CURRENT band only; (c) show no life position on others' Moments (identity ring at current band only); (d) have the server suppress or round the band near the subject's band boundary
- Visitor ring density/engraving on Hero and PersonCard. Options: (a) public-only density as coded; (b) no visitor density at all (circle-of-life.md §6 / Phase 5 §23); (c) friends-visible density once the friends contract is verified
- privacy:'friends' enforcement across feed, search and density together (bible C-14). Options: (a) friend+family gate friends Moments; (b) friend only; (c) ship Public / Only me until the backend confirms (social-feature-parity.md:60)
- What a visitor's Person World stream contains. Options: (a) only that person's Moments, onlyme excluded (social-api-contract.md:204); (b) the mixed stream as the prototype shows
- About/bio on a Person World. Options: (a) none (current); (b) a short owner-edited bio with its own visibility
- Home place visibility. Options: (a) always public (current code + contract §C); (b) owner-controlled public / friends / only me; (c) city-level only
- What 'Who can see your profile' controls. Options: (a) remove the control; (b) profile-level visibility (public / friends); (c) per-field visibility (home, cover, Moments)
- Social context on a Person World. Options: (a) none; (b) mutual people only; (c) a friends/family list with owner control
- Person-level block/report on PersonCard / Person World for launch. Options: (a) ship as P1 launch safety; (b) defer with explicit sign-off (my-world-product-completeness.md:34)
- Real-photo rule enforcement. Options: (a) policy text only; (b) an upload-time check; (c) moderation/report path only
- Signed-in identity surfaces using the legacy Avatar. Options: (a) authorize migrating the frozen Cosmos chip (cosmos/overlays.tsx:198) and IdentityGate to PersonIdentity; (b) keep the legacy Avatar for entry surfaces and correct the 'no second avatar system' claim

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Fix visitor relationship perspective in the prototype: invert request-in ↔ request-out when the acting viewer is not the map owner, and key the Hero Message on the profile subject rather than viewer.id (SocialPreview.tsx:509-512; ProfileHero.tsx:112-118; Messages.tsx:177). This needs the superseded assertion recorded in AGENTS.md (social-connection-final.js:184-189)
- Make View as public cover the stream: pass the public stand-in to LifeCursor (SocialPreview.tsx:717) and resolve MomentEntry/orderFeed through it while previewing (store.tsx:113-118, 274; Moment.tsx:103-112). Extend person-life-identity.js:342-343 with the exact-age regex and replace the live-clock '12,731' literal
- Use a non-'My' heading for the visitor counter card (SocialPreview.tsx:696)
- Route the hard-coded English labels through the catalog with en byte-identical: PersonIdentity.tsx:65, LifeCursor.tsx:77, Moment.tsx:195, 197, LifeRing.tsx:109, 185, CircleModule.tsx:87, ProfileHero.tsx:121, SocialPreview.tsx:693, Messages.tsx MiniChat aria
- Drop the trailing ' — ' when positionLabel is empty (LifeRing.tsx:76)
- Track the failed avatar src instead of a boolean, mirroring ProfileHero.tsx:105-106 (LifeRing.tsx:226)
- Remove the redundant ternary `life.scope === 'owner' ? life.band : life.band` (PersonCard.tsx:70)
- Remove or restrict the uncalled, full-precision lifePosition() export (social/life.ts:32-49; bible P-3)
- Make initialsFor handle astral characters (Array.from / Intl.Segmenter) (ui/Avatar.tsx:12-17)
- Migrate IdentityGate's signed-in avatar to PersonIdentity (self) or give ui/Avatar an onError fallback (IdentityGate.tsx:202, 277; ui/Avatar.tsx:40-47). IdentityGate is Phase 2 paused, not frozen
- Let resonance people rows open the person surface like every other people list (ResonateControl.tsx:359-363). The Boom who-expressed list (expressions.tsx:1161-1165) is a preservation boundary: report only
- Make the Chat conversation header name open the person surface (ChatSurface.tsx:117)
- Correct stale docs: person-life-identity.md §2 (:27-30), §4 (:56-68), §6 (:80-84), §7 (:93-99), and :62-63 plus SOCIAL_BIBLE_PRIVACY_MATRIX.md §4 ('density cannot narrow a birth date'); social-visual-spec.md:106-110, 191-197; social-feature-parity.md:47, 51; social-api-contract.md §C momentsThisMonth; LifeRing.tsx:18-21 'owner only' comment
- Unify relationship wording: 'Add Friend' vs 'Add friend' and 'Asked to be your friend' vs 'Wants to connect' (en.ts:57, 67, 69, 288)
- Test hygiene: replace the vacuous `engraveOwner >= 0` (my-world-2030.js:121)

<a id="pf"></a>
## PF — People · Friends · Relationships · Search
**Overall: PARTIAL** · master-table rows `PF-01` … `PF-26`

### WHAT THE PRODUCT NEEDS
- Five relationship states friend · family · request-in · request-out · none; actions Add Friend (none→request-out), Cancel, Accept/Decline (request-in→friend/none), Remove (→none); Message only between connected people (friend or family); the live state machine must be verified against the backend — docs/handover/people-chat-integration.md:18-26; AGENTS.md 'People and Chat (accepted 2026-09-12)'
- Actions live with objects: find a person via Search, a Moment author's name, or a Notification row, all leading to the person surface. No People tab, no Chat tab, no 'request centre' — people-chat-integration.md:7-16, 83-89
- People is a utility beside Search/Messages/Notifications/Account (not a tab) with Find someone · Requests (only while real ones exist) · Your People; no suggested people, no 'people you may know', no follower counts — AGENTS.md Final Social Connection row (2026-09-13, §0, §3–§8)
- Person surface: band-only Life Ring, name, home, 'Circle band X · <relationship>', ONE primary action + Message where permitted, a quiet Remove, and the line 'The exact position in their life is theirs to share.' In the live product this grammar heads the existing profile page — people-chat-integration.md:28-34
- Friendship never raises Life precision. Other people get bandIndex/bandLabel only, in every payload including search People and people lists — people-chat-integration.md:33; social-api-contract.md:66-82, 186-190
- Search finds four object types, in the order People · Moments · Photos · Places. Person rows show real photo + Life Ring, name, safe band and relationship chip. Zero state is one hint + Recent ('the person's own recent searches'). No results gives the honest sentence + Clear. Phone gets a local sheet with Back · field · Clear — docs/handover/s5-s6-discovery-motion.md:32-51
- Friends exists live. Friends (state, add, remove) and requests are READY WITH LIVE PORT. The Friends/Family pages (tabs, grid, Unfriend) are PRESERVE EXISTING LIVE BEHAVIOUR. P1: map the friends/requests state machine to the real backend — docs/handover/my-world-product-completeness.md:18-22, 48-51; docs/social-feature-parity.md:115
- Visitor profile page (hero + that person's Moments) is class A. The visitor feed is 'filtered to one author, onlyme excluded' — social-feature-parity.md:121; social-api-contract.md:204
- Three-value privacy public · friends · onlyme; if the backend lacks `friends`, ship Public/Only me and surface the gap — social-api-contract.md:101; social-feature-parity.md:60
- Chat needs the shared SYSTEMBOOM session and messaging limited to connected people (live contract) — people-chat-integration.md:20-26, 54-60
- No recommendations, trending, suggested people or followers — s5-s6-discovery-motion.md:8-11

### WHAT EXISTS NOW
- Relationship union and the connected predicate: src/components/world/model.ts:27, 49. Semantics comment: model.ts:11-23. Seed map (Maya's perspective only): model.ts:29-47, with Prakash as the only request-in at model.ts:34
- One relationship reducer: add→request-out, accept→friend, decline|cancel|remove→none, with no transition validation — src/components/world/WorldProvider.tsx:47-57. relationshipOf defaults to 'none': WorldProvider.tsx:126. canMessage = connected: WorldProvider.tsx:127
- openMini and send have no relationship guard — WorldProvider.tsx:58-65, 72-79
- People utility: PeopleButton with a steel pending dot — src/components/world/People.tsx:44-66. RelationshipAction per state: People.tsx:73-114. PersonRow at 40/48px: People.tsx:116-149. Panel with Find someone / Requests (Wants to connect, Waiting on them) / Your people: People.tsx:163-258. Mounted from TopBar: src/components/style-lab/social/Chrome.tsx:130; SocialPreview.tsx:663-666
- Person surface dialog: src/components/world/PersonCard.tsx:40-145. State words: PersonCard.tsx:32-38. Actions per state: PersonCard.tsx:110-141. Remove has no confirm: PersonCard.tsx:136. Mounted once: SocialPreview.tsx:673
- ProfileHero shows the relationship state + action for a visitor in all 5 states — src/components/style-lab/social/ProfileHero.tsx:212-251. It dispatches against viewer.id: ProfileHero.tsx:108-118. Its inputs come from world.relationshipOf(me.id) and canMessage(me.id): SocialPreview.tsx:509-512
- Search: SearchField at Chrome.tsx:222-440. People via matchPeople(term, undefined, 4) at Chrome.tsx:257 (name-substring only: data.ts:277-282). Moments/Photos match text or place at Chrome.tsx:254-256. Places come from the fixed PLACES list (data.ts:334-349) at Chrome.tsx:258-259. Zero state + static RECENT_SEARCHES: Chrome.tsx:331-340, data.ts:759. No results: Chrome.tsx:341-347. Phone sheet: Chrome.tsx:308-330. A Moment result lands via reveal + focusMoment: Chrome.tsx:266-270
- Notification request row with Accept/Decline in place and a binary outcome chip — Chrome.tsx:505-533 (outcome at 529). Seed request: data.ts:748
- Moment → person: author name at Moment.tsx:186-189; 'with N' people at Moment.tsx:247-270; response author at Moment.tsx:637-640. All open PersonCard (the dialog), not a World
- Viewer modes (harness only, gated by !product at SocialPreview.tsx:465): actingPerson at store.tsx:120-128. profilePerson is always Maya/Asha: store.tsx:108-110. Feed filter withholds only onlyme (no author filter, no relationship filter): store.tsx:113-119, 274
- Life privacy view model: momentLifeFor gives exact for self only (view-model.ts:110-112). Ring density for non-owners is public-only even when connected (view-model.ts:158-169)
- Chat: /chat mounts its own SocialStore + WorldProvider (src/components/world/ChatSurface.tsx:29-37). ?c= accepts any PEOPLE id (ChatSurface.tsx:49-51)

### WHAT IS COMPLETE
- Relationship vocabulary exists as one five-state union with one derived 'connected' predicate (model.ts:27, 49) and one shared store. Search chip, People rows, PersonCard, notification row and Hero all read the same map (WorldProvider.tsx:118-127; Chrome.tsx:352, 506; People.tsx:120; PersonCard.tsx:69; SocialPreview.tsx:512) — within one route
- Owner-side friend request flow in the prototype. Add from PersonCard (PersonCard.tsx:121-125), People (People.tsx:77-83) or Hero (ProfileHero.tsx:220-224) gives request-out. Requested + Cancel: People.tsx:84-93, PersonCard.tsx:126-130. An incoming request can be answered in the notification row (Chrome.tsx:522-526), People (People.tsx:94-105) or PersonCard (PersonCard.tsx:111-120), and resolves everywhere at once
- Message is offered only for friend/family in the UI — PersonCard.tsx:131-134; People.tsx:106-113; ProfileHero.tsx:99, 215-219
- Life privacy on every people surface: search rows use momentLifeFor (Chrome.tsx:375); People rows likewise (People.tsx:121, 136); PersonCard is band-only with the 'theirs to share' sentence (PersonCard.tsx:68-70, 101-106); the visitor Hero shows a band panel (ProfileHero.tsx:269-271). Relationship does not raise precision: ring density is public-only (view-model.ts:164-169)
- No follower/following model and no friend counts. A grep of src finds only the prohibiting comments (People.tsx:17-18) and 'people not popularity' comments. Search people order is fixture insertion order, not ranked (data.ts:280)
- Search object model: four groups in order People · Moments · Photos · Places (Chrome.tsx:349-434). Each result is the real photo + Life Ring via PersonIdentity (Chrome.tsx:367, 391). Only-me content from others is withheld from results and place tallies (Chrome.tsx:253, 259)
- Search states: zero hint (Chrome.tsx:334), honest no-results + Clear (Chrome.tsx:341-347). The phone sheet has Back · auto-focused field · Clear (Chrome.tsx:308-330). Escape leaves without wiping the words (Chrome.tsx:294, 319). Focus returns without re-opening (Chrome.tsx:240, 290)
- Moment → people: author name, 'with N' referenced people and response authors all open the Person surface (Moment.tsx:186-189, 247-270, 637-640)

### WHAT IS PARTIAL
- Relationship semantics are single-perspective. There is ONE map, always the owner's (Maya's) view (WorldProvider.tsx:118-120; model.ts:29-47). Nothing is keyed by viewer–subject pair or stores request direction, so any non-owner viewer reads Maya's relationships as their own (SocialPreview.tsx:509-512)
- Family is seed-only: accept always yields friend (WorldProvider.tsx:50-51). Family can be Removed to none from PersonCard with no way back (PersonCard.tsx:131-139)
- People 'Your people' merges friends and family with no state word on the row. PersonRow prints only the band (+ town for requests) (People.tsx:133-139, 175); evidence prototype-evidence/social-connection-final/07-people-surface-desktop.png shows family (Sunita, Krishna) identical to friends. There is no friends/family filter or tabs
- Remove is destructive with no confirmation (PersonCard.tsx:136). The Moment ⋯ Delete elsewhere uses an inline confirm
- Search Recent is a static fixture nothing writes (data.ts:759; Chrome.tsx:336-338). The doc promises 'the person's own recent searches' (s5-s6-discovery-motion.md:49)
- Search matching is shallow. People match on name substring only: no home/place, no diacritic folding, no transliteration (data.ts:277-282). Moments match text/place only, so searching a person's name finds the person, not their Moments (Chrome.tsx:254). Places come from a fixed list with exact-string tallies (data.ts:334-349; Chrome.tsx:259)
- Search keyboard is Tab-only. The input has aria-controls but no aria-expanded or combobox role, there is no arrow-key/listbox navigation, and Enter does not choose a result (Chrome.tsx:285-298). The results region aria-label 'Search results' is hardcoded English (Chrome.tsx:304)
- Relationship wording differs by surface for the same state. request-in reads 'Wants to connect' (Hero/People), 'Asked to be your friend' (PersonCard) or 'Asked you' (search chip). request-out reads 'Requested' or 'Request sent'. The button reads 'Add friend' or 'Add Friend' (src/lib/i18n/catalogs/en.ts:57-70, 151-152, 288)
- PersonCard is aria-modal and focuses its first control, but it does not contain Tab (PersonCard.tsx:48-60, 82)
- The 'with N' popover label 'People in this Moment' (Moment.tsx:254) and the '(you)' marker (Moment.tsx:644) are hardcoded English

### WHAT IS MISSING
- Relationship/request DATA CONTRACT. social-api-contract.md has no relationship field, no request endpoints, and no directional request model (requester/addressee). PersonRef is '{ id, name, avatarUrl?, bandIndex, bandLabel } Nothing else' (social-api-contract.md:123-128), yet the UI needs relationship + home per person (Chrome.tsx:352, 376; People.tsx:123, 137; PersonCard.tsx:96, 104)
- Profile opening. No surface opens another person's World: PersonCard has no 'Open {Name}'s World' action (PersonCard.tsx:110-141), and the product route cannot show anyone but the owner, because viewer modes are harness-only (SocialPreview.tsx:465) and profilePerson is fixed (store.tsx:108-110). The live visitor profile page is class A (social-feature-parity.md:121)
- Shared connections / mutual friends: not modelled. It cannot be, because the relationship map holds one perspective only (model.ts:29-47)
- Recent people (recently viewed or messaged people) in People: absent (People.tsx:163-258)
- People from Places (who else recorded life at a place): absent. A place result only narrows the query (Chrome.tsx:424)
- A search-history (Recent) storage contract: absent from social-api-contract.md
- Chat → Person: the conversation header name/identity opens nothing, and PersonCard is not mounted in /chat (ChatSurface.tsx:104-118)
- Relationship notification kinds for the other party ('accepted your request') do not exist; the Notification kind union is 'request' | 'resonance' (data.ts:111). Person-level block/mute is UNKNOWN (my-world-product-completeness.md:34)

### WHAT IS BROKEN
- Visitor-mode request direction is inverted. As prakashVisitor, Prakash is the person who SENT the request (model.ts:34 is Maya's 'request-in'), yet Maya's World Hero shows HIM 'Wants to connect' + Accept/Decline (SocialPreview.tsx:512 → ProfileHero.tsx:235-248), and he can accept his own request. The accepted test asserts this (prototype-tests/social-connection-final.js:184-191)
- Visitor-mode surfaces disagree about the same pair. As Bikash (visitor), the Hero says 'Friends' + Message (relationshipOf(bikash) = friend), while PersonCard, People and Search show Maya as 'Not connected' + Add friend. Maya has no key in the owner-perspective map and defaults to none (WorldProvider.tsx:126; model.ts:29-47; PersonCard.tsx:69; People.tsx:171-175)
- Your own row in Search is a dead click: matchPeople is called without excludeId (Chrome.tsx:257), and clicking self only closes search (Chrome.tsx:357-363). Recorded as E-12 in SOCIAL_BIBLE_AUDIT.md:756-759
- Accepting or declining from People, PersonCard or the Hero leaves the request notification unread, so the bell dot stays red for a resolved request. Only the notification row dispatches 'read' (Chrome.tsx:524-525 vs People.tsx:97-101, PersonCard.tsx:113-117, ProfileHero.tsx:117-118; unread from Chrome.tsx:89)
- The notification outcome chip is binary, `rel === "friend" ? Now friends : Declined` (Chrome.tsx:529). After Accept → Remove, or Decline → Add friend, the row reads 'Declined' — untrue
- personOf falls back to PEOPLE.m for any unknown id (store.tsx:271), so an unresolvable author or notification actor renders as a different real fixture person ('M')

### WHAT IS DISCONNECTED
- Live Friends page (tabs, search, grid, Unfriend) and Family tree: no entry point from People or PersonCard (People.tsx:163-258; PersonCard.tsx:110-141). The parity doc still says 'Friends inside People (not built)' (social-feature-parity.md:32) and 'Friends page … nav entry only' (:115), but no such nav entry exists (Brand-only bar, Chrome.tsx:127-208)
- Who-expressed people (expressions.tsx:1159-1167) and Resonance people (src/components/celestial/ResonateControl.tsx:359-364) render real people as inert rows that do not open the Person surface. People reached from a Moment's feeling layers are dead ends
- /chat builds a fresh SocialStore + WorldProvider (ChatSurface.tsx:29-37), so a relationship or conversation change in /world is lost on navigating to /chat (prototype in-memory only)
- Messaging is gated only by hiding buttons. /chat?c=<any PEOPLE id> opens a sendable thread with a stranger (ChatSurface.tsx:49-51), and the reducer's openMini/send never check `connected` (WorldProvider.tsx:58-79). A removed friend's conversation stays sendable in Messages
- Visitor World feed is not the visitor profile page: in visitor modes the stream shows every author's Moments (store.tsx:113-119, 274), not the subject's Moments only (social-api-contract.md:204)

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- Doc vs code: people-chat-integration.md:9-16 ('find a person → Search') and :87 ('What not to invent: … a request centre') vs People.tsx:163-258, a People utility with a Requests section (AGENTS.md Final Social Connection row). The integration doc was never updated
- Doc vs code: social-feature-parity.md:32 'Friends inside People (not built)' vs People.tsx, which exists
- Doc vs code: social-shell-spec.md:47, 57 list the utilities without People vs Chrome.tsx:130 PeopleButton (also SOCIAL_BIBLE_CONTRADICTIONS.md C-8)
- Doc vs code: social-visual-spec.md:302-304 'Recent · Photos · People (24px rings) · Places', with no Moments group, vs Chrome.tsx:349-434 People · Moments · Photos · Places with 28px person rings (Chrome.tsx:367), matching s5-s6-discovery-motion.md:51
- Doc vs code: social-interaction-spec.md:138 'grouped results (Photos · People · Places)' vs the four groups in Chrome.tsx:349-434
- Doc vs doc: s5-s6-discovery-motion.md:37-39 says focus returns to the search field, 'whose focus re-opens the same results'; the same doc at :93-94 says it 'does not re-open the results'. Code follows :93-94 (Chrome.tsx:240, 290), but the in-code comment Chrome.tsx:262-264 still says it re-opens
- Doc vs code: my-world-product-completeness.md:20 Family is 'display context only; tree editing untouched' vs PersonCard.tsx:131-139, which offers Remove on a family member (→ none)
- Doc vs UI need: social-api-contract.md:126-128 PersonRef 'Nothing else' vs the relationship chip, state and home the UI renders for every person (Chrome.tsx:352, 376; People.tsx:137; PersonCard.tsx:96, 104)
- Doc vs code: social-api-contract.md:204 visitor feed 'filtered to one author' vs store.tsx:113-119 (no author filter)
- Privacy doc vs code: social-api-contract.md:101 and social-feature-parity.md:60 define three privacy values, but `friends` is not gated by relationship in the feed (store.tsx:117) or in search (Chrome.tsx:253), while the ring withholds it (view-model.ts:164-169) — C-14. Concrete: Prakash is request-in, not connected (model.ts:34), yet his friends-only m-project and m-face (data.ts:478-490, 530-541) show in Maya's feed and search
- Fixture vs fixture: Prakash is request-in (model.ts:34), yet Maya (u-demo-001) is among the responders of his friends-only Moments (data.ts:489, 540). That implies a prior connection the relationship map denies
- Accepted test vs relationship semantics: social-connection-final.js:184-191 asserts the requester (Prakash) sees Accept on the addressee's World. That contradicts model.ts:16 ('request-in: they asked; I can Accept') and people-chat-integration.md:21-23
- Audit doc vs code: SOCIAL_BIBLE_AUDIT.md:720-722 (E-10) calls ProfileHero's viewer.id dispatch 'Correct today', but the request-in/out direction is already wrong in prakashVisitor today (SocialPreview.tsx:512; ProfileHero.tsx:235-248)
- Doc vs code: my-world-product-completeness.md:19 '✓ 36px actions' vs Chrome.tsx:524-525 min-h-11 (44px phone, S7 row)
- Doc vs code: systemboom-navigation-map.md:37 lists person-surface entries as 'Moment authors, search people, notifications', omitting the People utility, 'with N' (Moment.tsx:247-270) and response authors (Moment.tsx:637-640)
- AGENTS.md vs code: the R2 row says 'a response author opens their Person World' vs Moment.tsx:637-638, which opens the PersonCard dialog (no World exists to open)
- In-code stale docs: ProfileHero.tsx:64 prop doc says 'request/none states stay silent here' vs ProfileHero.tsx:212-250, which renders all five. PersonCard.tsx:90-91 says 'a friend/family viewer sees density from Moments visible to them' vs view-model.ts:164-169 (public-only)

### WHAT REQUIRES OWNER DECISION
- Friends-privacy contract, applied once to feed, search AND ring density: does a friend/family relationship unlock `privacy:"friends"` Moments, and does Family count as Friends for that audience? Options: (a) friends + family see friends-only Moments; (b) friends only; (c) ship Public / Only me until the backend confirms (social-feature-parity.md:60)
- Canonical relationship wording: one term per state across Hero, People, PersonCard, Search and notifications. Options: (a) unify (e.g. 'Wants to connect' / 'Requested' / 'Add friend'), recorded as an owner-superseded en assertion; (b) keep per-surface variants as accepted
- Family on the Person surface: options (a) hide Remove for family, so family is edited only in the live Family tree; (b) keep Remove → none (current); (c) Remove family → friend. Also decide whether Accept can ever create 'family'
- People utility vs the live Friends/Family pages: options (a) People replaces the live Friends page; (b) People gains a 'See all' link to the live Friends/Family pages; (c) re-skin the live pages and keep People as a quick utility only
- Person surface → Person World: options (a) add an 'Open {Name}'s World' action to PersonCard backed by a visitor-profile route (live profile URL or /world/<id>); (b) keep PersonCard terminal until the live port maps it onto the existing profile page
- Conversation after Remove / Decline / Cancel: options (a) keep history read-only; (b) keep it sendable (current prototype); (c) hide it
- Shared connections: options (a) never show mutual friends; (b) show a count only; (c) show names only of mutual people the viewer is already connected to
- Recent searches: options (a) server-side per account; (b) per-device local; (c) drop Recent and keep only the zero-state hint
- Band at a Moment's own date for OTHER people (Moment.tsx:109-112; Search Moment rows at Chrome.tsx:391; social-api-contract.md:106) lets a viewer bound someone's birth date between two Moments that straddle a band boundary. Options: (a) accept, as contracted; (b) show only the current band for others; (c) show the band-at-Moment only to connected viewers

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Chrome.tsx:529: derive the request-row outcome from the real state ('Now friends' only for friend/family; 'Declined' only when declined; neutral text otherwise) instead of the binary ternary
- People.tsx:97-101, PersonCard.tsx:113-117, ProfileHero.tsx:117-118: when a request is accepted or declined anywhere, also mark the matching `kind:"request"` notification read (or derive that row's unread from the relationship), so the bell does not stay red for a resolved request
- Chrome.tsx:357-363: give your own search row a destination (e.g. close and scroll to your Hero) or render it non-interactive; inclusion itself is recorded behaviour and stays
- People.tsx:135-138: add the relationship word (rel.friends / rel.family) to 'Your people' rows so family is distinguishable (existing catalog keys, no new copy)
- Localise hardcoded strings with catalog keys: Chrome.tsx:304 'Search results'; Moment.tsx:254 'People in this Moment'; Moment.tsx:644 '(you)'; ChatSurface.tsx:66-68, 88, 103, 107, 122-123
- Search a11y (additive): aria-expanded on the input plus arrow-key/listbox navigation over results (Chrome.tsx:285-304). PersonCard: contain Tab inside the aria-modal dialog (PersonCard.tsx:48-60)
- store.tsx:271: resolve unknown ids to a neutral 'unavailable person' identity instead of PEOPLE.m
- Defect fix with a recorded suite update (frozen does not preserve defects): make the prototype relationship viewer-relative (keyed by viewer, or storing requester/addressee) so visitor modes stop inverting request direction and stop disagreeing across Hero/PersonCard/People/Search. Record the change to social-connection-final.js:184-191 in AGENTS.md
- Prototype guard: ChatSurface.tsx:49-51 and WorldProvider.tsx:58-79 should refuse to open or send to a non-connected person with no existing conversation. The live port still needs the server guard
- Share the 1024px mini-chat breakpoint as one constant (People.tsx:188, PersonCard.tsx:74, ProfileHero.tsx:112; E-11)
- Update stale comments: Chrome.tsx:262-264, ProfileHero.tsx:64, PersonCard.tsx:90-91; remove the dead ternary at PersonCard.tsx:70
- Update stale docs to match accepted code: people-chat-integration.md §1/§8 (People utility, Requests), social-feature-parity.md:32, social-shell-spec.md:47/57, social-visual-spec.md:302-304, social-interaction-spec.md:138, systemboom-navigation-map.md:37, s5-s6-discovery-motion.md:37-39, my-world-product-completeness.md:19
- Remove confirmation: add an inline confirm to PersonCard Remove (PersonCard.tsx:136), reusing the accepted Moment Delete confirm pattern. Update any suite that clicks data-sb-remove-friend and record the change

<a id="cn"></a>
## CN — Chat · Notifications
**Overall: PARTIAL** · master-table rows `CN-01` … `CN-33`

### WHAT THE PRODUCT NEEDS
- Actions live with objects: a request arrives as a Notification and is answered with Accept / Decline in the row; any person leads to the person surface; a connected person offers Message. No People tab and no Chat tab. (docs/handover/people-chat-integration.md:7-16)
- Messaging is offered only to connected people (friend or family). A stranger's card has no Message action. (people-chat-integration.md:23-25; src/components/world/model.ts:20-22)
- Two unread truths from two sources, never a combined total: the Messages dot counts unread messages only, the bell counts unread notifications only. (people-chat-integration.md:38-40)
- Desktop (>=1024px): exactly ONE mini-chat dock, which can be minimised, with managed focus. Phone and tablet: no dock, go to /chat (list, then full-screen thread, Back). /chat?c=<person> deep-links a thread. Chat shows no ages, no life coordinates, and HH:MM times only. (people-chat-integration.md:41-52)
- Chat must share the SYSTEMBOOM session (SSO / trusted handoff) so there is no second login. Do not invent client-side security. (people-chat-integration.md:54-60; my-world-product-completeness.md:27,48-51, P1)
- Only band-level life data wherever a person appears: search rows, person card, chat identities, notification rows. Only-me content never feeds anything a visitor sees. (people-chat-integration.md:62-66; social-api-contract.md:64-82, which names notification payloads and mentions explicitly)
- A failed chat send keeps its text. Offline/reconnect behaviour must come from the backend contract. (people-chat-integration.md:76-81; my-world-product-completeness.md:28)
- Do not invent: typing indicators, read receipts, presence, multiple chat windows, a request centre, or a second unread total. (people-chat-integration.md:83-89)
- Notifications: a request resolves in place ('Now friends' / 'Declined'). A Moment event shows the person, what changed, the Moment's date and place and its own image; selecting it marks it read, closes the panel and lands on THAT Moment. Read state is a 2px mark plus 80% opacity; no pulse. (docs/handover/s5-s6-discovery-motion.md:53-60)
- Vocabulary: RESPOND writes, RESPONSES is the written conversation, REPLY is one level deep, and NOTE is removed from user-facing text. The anonymous Respond tap is retired and its fields are not surfaced. (docs/handover/moment-conversation-model.md:24-29, 108-115)
- Boom Expression events MAY surface through the existing notification model by adding a kind; this is a documented seam, not faked. (docs/handover/moment-expression-contract.md:75-76)
- Celestial: a notification is Signal-tier only, names the person AND the Resonance, never previews private Moment content, and never notifies anyone outside the Moment's audience. (references/celestial-resonance-bible/21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:291-293)
- Celestial payload shape: kind 'resonance' with actorPersonId, resonanceId, subjectType 'moment' | 'chat-message', subjectId and privacySafePreview, drawn by its own row renderer. (22-COMPONENT-ARCHITECTURE.md:138-152)
- Chat Quick Resonance is actor-aware: one per person per message, stored as {resonanceId, at} only, rendered as static Seals. (22-COMPONENT-ARCHITECTURE.md:130-136; 22-DATA-CONTRACT.md §6)
- Each Celestial sub-flag gates exactly one adapter at its single mount point. Flag OFF must reproduce existing behaviour. (22-FEATURE-FLAG-ROLLOUT.md:52-54)
- Any notification or prompt must trace to a meaningful-return category. No engagement-bait cadence. (21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:427; 12-ENGAGEMENT-SYSTEM.md:41)
- P1 live obligations: real sources for message and notification unread counts; the friends/requests state machine mapped to the backend; server-side guarding of /world, /life and /chat. (my-world-product-completeness.md:48-51)

### WHAT EXISTS NOW
- The Notification type is {id, whoId, text, at, unread, momentId?, kind?: 'request' | 'resonance', resonanceId?} (src/components/style-lab/social/data.ts:102-115). There is no subject type, no response or reply id, and no audience field.
- SEED_NOTIFICATIONS holds 9 fixtures: 1 request (data.ts:748) and 8 free-text English Moment events (data.ts:749-756).
- No action generates a notification anywhere. The store's post, note, express, resonate and respond reducers never touch `notifications` (store.tsx:137-202). The WorldProvider's accept/add/send reducers never do either (WorldProvider.tsx:50-79). The store itself says so (store.tsx:225-226).
- Harness notification modes exist: seed, many and empty (store.tsx:221-242), plus 'celestial' (store.tsx:224-233), which nothing ever dispatches (SocialPreview.tsx:487 accepts only many/empty; the Bell selector at SocialPreview.tsx:601 offers seed/many/empty).
- NotificationsPanel groups rows by calendar day only (Chrome.tsx:464-468). The request row: 32px PersonIdentity, Accept / Decline (Chrome.tsx:505-533), and an outcome chip derived from the live relationship (Chrome.tsx:529). The Moment row: 24px identity, free text, formatDate + place of the target (Chrome.tsx:552-557), thumbnail (Chrome.tsx:535-536, 560-565) and an unread dot (Chrome.tsx:566).
- Read/unread: activating a row marks it read (Chrome.tsx:472, 510). Accept and Decline mark it read (Chrome.tsx:524-525). 'Mark all read' exists (Chrome.tsx:491; store.tsx:211-212). The bell count and dot read state.notifications (Chrome.tsx:89, 138-141).
- Notification to Moment landing: `reveal` widens the visible window (store.tsx:205-210), then focusMoment double-rAF scrolls, focuses the readout and sets data-sb-focused (focus-moment.ts:11-27). It returns silently when the element is missing (focus-moment.ts:14-15).
- Celestial mark on a notification row: `n.kind === 'resonance' && n.resonanceId` renders ResonanceNotificationMark (Chrome.tsx:547-551), a decorative ResonanceSignal (ResonateControl.tsx:404-407; ResonanceMark.tsx:40-43, 61-64). It is not wrapped in useCelestialSurface('notifications'), and nothing in src reads that surface flag (flags.tsx:111-117 is the only reference).
- MessagesButton shows a message-unread dot fed by world.unreadMessages (Messages.tsx:31-48; WorldProvider.tsx:143).
- MessagesPanel lists conversations. Choosing one calls openMini at >=1024px or router.push('/chat?c=') otherwise (Messages.tsx:56-106).
- ConversationBody is a text log plus input (Messages.tsx:109-163). MiniChat is the one fixed dock (`hidden ... lg:flex`) with Open in Chat, Minimise and Close (Messages.tsx:166-211).
- /chat: the page wraps PersonalDestination id='chat' (src/app/chat/page.tsx:16-21). ChatSurface mounts its OWN SocialStore + WorldProvider (ChatSurface.tsx:29-37), reads `?c=` once (ChatSurface.tsx:46-53), marks the active thread read (ChatSurface.tsx:55-57), uses a hard-coded 57px height (ChatSurface.tsx:63), shows the list or the thread (ChatSurface.tsx:66-125), and has a Back button classed lg:hidden (ChatSurface.tsx:105-113). The frame is WorldShell: brand and theme only, no bell, no account (WorldShell.tsx:15-31).
- Chat model: ChatMessage {id, from, text, at: 'HH:MM', failed?, resonances?} (model.ts:51-68). Conversation {personId, messages, unread} is one-to-one (model.ts:70-74). There are 3 seeded threads with hand-set unread counts (model.ts:77-103).
- WorldProvider actions: accept, decline, add, cancel, remove, openMini, closeMini, minimise, read, send, resonate (WorldProvider.tsx:26-39). `send` always appends from 'me' with no guard (WorldProvider.tsx:72-79). canMessage = friend or family (WorldProvider.tsx:127; model.ts:49).
- Chat Quick Resonance: gated by useCelestialSurface('chat') (ChatQuickResonance.tsx:31, 53). The actor is hard-coded ACTOR = 'me' (ChatQuickResonance.tsx:28). Static Seals are sorted in canonical order (ChatQuickResonance.tsx:85-101). The pure rule lives in src/lib/celestial/chat-resonance.ts:26-36 and the reducer in WorldProvider.tsx:80-95. The flag defaults to false (flags.tsx:34).
- Chat identities use PersonIdentity (real photo + Life Ring, band geometry for others, label='') at Messages.tsx:88 and 195 and ChatSurface.tsx:84 and 115 (PersonIdentity.tsx:61-66).
- Paths from a response to Chat: the response author's name opens PersonCard (Moment.tsx:637-640). So do the Moment author (Moment.tsx:187) and the 'with N' list (Moment.tsx:250-260). PersonCard's Message button appears only for friend/family (PersonCard.tsx:72-76, 131-135).
- The Boom who-expressed rows (expressions.tsx:1162-1166) and the Celestial who-resonated rows (ResonateControl.tsx:359-363) are inert spans/list items: they do not open a person.
- Tests: complete-my-world.js loads /chat, /chat?c=, the phone list-to-thread flow and person-to-Message (complete-my-world.js:254-296, 409). celestial-s3-s6.js checks the chat Resonance rule (celestial-s3-s6.js:143-159). Its notification check is vacuous: `ok(notifOk || true, ...)` (celestial-s3-s6.js:183).

### WHAT IS COMPLETE
- Friend-request notification (prototype): the row resolves in place with Accept / Decline, and the WorldProvider's relationship map keeps the notification, PersonCard, People and Search in agreement within one route (Chrome.tsx:505-533; WorldProvider.tsx:50-57).
- Read/unread in memory: per-row read on activation, mark-all-read, bell count and dot, unread aria text (Chrome.tsx:89, 138-141, 472, 491, 510, 524-525, 566; store.tsx:211-214).
- Notification to Moment landing for a Moment that is loaded or revealable and visible (Chrome.tsx:471-477; store.tsx:205-210; focus-moment.ts:11-27).
- Life privacy on notification rows: identity only through PersonIdentity, band geometry for others, no band or age text (Chrome.tsx:512, 540; PersonIdentity.tsx:61-66).
- Two separate unread truths: the Messages dot comes from WorldProvider.unreadMessages and the bell from state.notifications. Chat messages never become bell notifications, by design (WorldProvider.tsx:143; Chrome.tsx:89; people-chat-integration.md:38-40).
- Chat person identity: real photo plus Life Ring in the panel, the dock, the /chat list and the thread header, band geometry only, no ages or coordinates in the log (Messages.tsx:88, 195; ChatSurface.tsx:84, 115).
- One desktop mini-chat dock with minimise, close and focus management; phones navigate to /chat (Messages.tsx:64-65, 166-211; PersonCard.tsx:74-75).
- /chat list and thread, desktop split, phone stack, and the ?c= deep link (ChatSurface.tsx:46-53, 66-125). Covered by complete-my-world.js:254-296.
- Celestial Quick Resonance in chat, behind a flag that ships dark: actor-aware map, static Seals, no Life data (ChatQuickResonance.tsx; chat-resonance.ts:26-36; WorldProvider.tsx:80-95; flags.tsx:34).

### WHAT IS PARTIAL
- The notification kind model covers only 'request' and 'resonance' (data.ts:111). Every other event is kind-less free-text English (data.ts:749-756): no response, reply, mention, inclusion, Boom or request-accepted kinds, and no noteId or subjectType.
- 'Responded to your Moment' exists only as fixture text. Three of the four 'responded' fixtures (nt3, nt5, nt8 at data.ts:751, 753, 756) land on Moments with `notes: []` (m-panorama data.ts:641-652, m-nepali-1 567-578, m-snow 654-665, defaulted by M() at data.ts:371-375). They refer to the retired Respond tap's `responders` data, not to written Responses.
- 'Included you in a Moment' exists only as fixture nt7 (data.ts:755), which matches m-meeting's `with` field (data.ts:511). There is no kind, and a Moment composed with `with` people notifies no one.
- Notification landing: it lands on the Moment readout, not on the specific Response (Notification has no noteId, data.ts:102-115). It is a silent no-op when the target was deleted, hidden, or is only-me and not visible (store.tsx:208-209; focus-moment.ts:14-15). In those cases the panel closes and nothing happens (Chrome.tsx:474-476).
- Notification privacy guard: the coordinate and thumbnail come from the full client Moment via momentOf (Chrome.tsx:463, 535-536) with no visibility filter, unlike Search (Chrome.tsx:253). No current fixture leaks, but nothing structurally prevents it, and no audience or preview payload is defined.
- Notification i18n: the day header uses English dayLabel ('Today'/'Yesterday', store.tsx:316-324, used at Chrome.tsx:501). The coordinate uses English formatDate (Chrome.tsx:554). Event text is English fixture text, a recorded carryover.
- Messaging permission is enforced in the UI only (PersonCard.tsx:131; ProfileHero.tsx:99). The /chat deep link and the send reducer are unguarded (ChatSurface.tsx:51; WorldProvider.tsx:72-79).
- Phone Chat works but lives in its own store: /world and /chat each mount a separate SocialStore + WorldProvider (SocialPreview.tsx:397-401; ChatSurface.tsx:29-37). An accepted request, a just-sent message, read state and a just-written Response are lost across navigation. This is prototype only; the live product is server-backed.
- Mini dock responsiveness: five one-shot matchMedia('(min-width: 1024px)') reads (Messages.tsx:64; PersonCard.tsx:74; People.tsx:188; ProfileHero.tsx:112; ChatSurface.tsx:108) with no resize handling. The dock is CSS-hidden below lg (Messages.tsx:188) while world.mini stays set.
- Chat time model: ChatMessage.at is 'HH:MM' only (model.ts:56-57; WorldProvider.tsx:41-45). There is no date, so messages cannot be separated or ordered by day.
- Chat i18n: ConversationBody, MiniChat and ChatSurface strings are hard-coded English (Messages.tsx:128-129, 152-157, 187, 198-204; ChatSurface.tsx:66-68, 88, 92, 103, 107, 122-123), even though chat.you and chat.noMessagesYet already exist (src/lib/i18n/catalogs/en.ts:290-291).
- Celestial in chat: Seals carry the resonance name but not who resonated (ChatQuickResonance.tsx:95-99). The key celestial.chat.who (en.ts:361) is unused. The actor is hard-coded 'me' (ChatQuickResonance.tsx:28).
- Respond to Chat: reachable only as response author name, then PersonCard, then Message (Moment.tsx:637-640; PersonCard.tsx:131-135), for friend/family only. No Moment context is carried into the conversation.
- Visitor harness modes (Bikash, Asha or Prakash viewing Maya): the chrome still shows Maya's notifications, conversations and requests. SEED_NOTIFICATIONS is seeded for every viewer (store.tsx:90-101) and WorldProvider is not viewer-aware (WorldProvider.tsx:117-122). The Hero's Message opens a thread keyed by viewer.id (ProfileHero.tsx:112-113). The harness is not evidence of what a visitor's own chrome looks like.

### WHAT IS MISSING
- Notifications generated by actions: none. Every notification is a fixture (store.tsx:225-226). The live product needs server-generated events (my-world-product-completeness.md:51).
- A 'replied to your Response' kind or fixture. Replies exist as Note.parentId (data.ts:60) but produce no event.
- A Boom Expression notification kind. This is a documented seam, correctly not faked (moment-expression-contract.md:75-76).
- A 'your request was accepted' notification. Request-out relationships (m, nadia, sofia at model.ts:36, 45-46) never resolve.
- A mention model. Fixture nt4 'mentioned you in a note' (data.ts:752) points at m-video, whose responses contain no mention (data.ts:473-476). No mention capability exists anywhere in src.
- Grouping and noise control: no actor or per-Moment aggregation ('Asha, Bikash and 3 others…'), no caps, no mute. Grouping is by day only (Chrome.tsx:464-468). The 'many' harness mode shows 26 flat rows (store.tsx:234-241).
- A notification and chat data contract in the API handover. social-api-contract.md sections A-H define no Notification payload, no Chat payload and no Moment-by-id fetch. It has only the privacy clause (social-api-contract.md:72, 80) and the line 'existing behaviour' (:213).
- The shared SYSTEMBOOM session for Chat: documented P1, not built. Prototype identity is a UX gate only (people-chat-integration.md:54-60; src/app/chat/page.tsx:10-15).
- Failed chat send state. ChatMessage.failed is declared (model.ts:58-59) and never written or read. ConversationBody clears the text on every send (Messages.tsx:119-124). The simulateFailure toggle is not read by chat.
- Inbound messages and real unread counts. Nothing ever arrives, and unread counts are hand-set fixture numbers (model.ts:80, 90, 98).
- Multi-person chat. Conversation is keyed by a single personId (model.ts:70-74).
- A Moment deep link or 'share a Moment' in chat. ChatMessage carries text only (model.ts:51-68) and there is no Moment route; copy-link is a placeholder (README-for-developer.md:495).
- Chat to Person: the dock and thread headers are plain text (Messages.tsx:194-197; ChatSurface.tsx:114-117), and /chat does not mount PersonCard (ChatSurface.tsx:29-37).
- Notifications and account access from /chat: WorldShell has brand and theme only (WorldShell.tsx:15-31). On desktop there is no in-surface way back to /world (ChatSurface.tsx:105-113 is lg:hidden).
- Chat offline, reconnect and delivery states: not simulated; UNKNOWN pending the backend contract (my-world-product-completeness.md:28).

### WHAT IS BROKEN
- Request outcome chip is binary: `rel === 'friend' ? nowFriends : declined` (Chrome.tsx:529). Accept Prakash in the row, then Remove him in PersonCard (PersonCard.tsx:136): the resolved request now reads 'Declined', which is false.
- Resolving a request outside the notification does not mark it read. Accept/Decline in PersonCard (PersonCard.tsx:113-118), People (People.tsx:97-101) or ProfileHero (ProfileHero.tsx:117-118) dispatches only to WorldProvider. The request notification stays unread and the bell dot and count persist for a request that is already resolved.
- The /chat deep link bypasses the messaging rule: `if (c && personOf(c)) setActive(c)` (ChatSurface.tsx:51) accepts any PEOPLE id. /chat?c=p-ramesh (relationship none), /chat?c=p-prakash (request-in) and /chat?c=u-demo-001 (yourself) all open a sendable thread, and `send` appends without a check (WorldProvider.tsx:72-79). This contradicts model.ts:20-22 and people-chat-integration.md:23-25. A conversation with a removed friend also stays sendable.
- The harness-only Celestial notification fixture is malformed: it spreads SEED_NOTIFICATIONS[0], the Prakash request with no momentId (store.tsx:227-231), so a resonance row would have no coordinate, no thumbnail and a no-op landing (Chrome.tsx:473). The actor is also a non-friend requester.
- The resonance row does not name the Resonance for screen readers: the mark is `decorative` (ResonanceNotificationMark at ResonateControl.tsx:406), and the row text is the generic 'resonated with your moment' (store.tsx:229-230). ResonanceMark.tsx:40-43 assumes the row text names it. Unreachable today because the harness mode is never dispatched.

### WHAT IS DISCONNECTED
- The Celestial notification path cannot be reached: the 'celestial' harness mode is never dispatched (store.tsx:224-233 vs SocialPreview.tsx:487, 601); `useCelestialSurface('notifications')` has no caller (flags.tsx:111-117); and the row mark at Chrome.tsx:547-551 is not flag-gated. The `notificationsIntegration` flag (flags.tsx:35, 73) controls nothing.
- Celestial chat Resonance never reaches Notifications: Notification has no subjectType or chat-message subject (data.ts:102-115), unlike the contract (22-COMPONENT-ARCHITECTURE.md:143-149).
- Two stores own one human event: notification read state lives in SocialStore (store.tsx:211-214) while relationship state lives in WorldProvider (WorldProvider.tsx:50-57), with no bridge. This causes the unread-after-resolve defect above.
- The /world and /chat routes each create fresh stores (SocialPreview.tsx:397-401; ChatSurface.tsx:29-37). Phone Message taps (Messages.tsx:65; PersonCard.tsx:75; People.tsx:189; ProfileHero.tsx:113) discard in-session state, including a Response just written in the phone conversation surface before tapping its author and then Message (Moment.tsx:555, 637-640).
- Chat to Person and Chat to Moment: no doorway from any chat header (Messages.tsx:194-197; ChatSurface.tsx:114-117), and no Moment reference in ChatMessage (model.ts:51-68).
- Human Pulse people to Person/Chat: the who-expressed rows (expressions.tsx:1162-1166, under the Boom preservation boundary) and the who-resonated rows (ResonateControl.tsx:359-363) are not doorways, although response authors are (Moment.tsx:637-640, the R2 §44 pattern).
- A live-arrival harness exists with no signal: `resonance-arrive` adds another person's Resonance to Maya's m-rain (store.tsx:168-170; SocialPreview.tsx:607-618) but produces no notification row.
- Orphaned i18n key: celestial.chat.who (en.ts:361) has no component reference.

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- Vocabulary. moment-conversation-model.md:28 says 'NOTE ... removed from the user-facing vocabulary'. The fixtures still render 'left a note on your Thamel moment' (data.ts:749) and 'mentioned you in a note' (data.ts:752) verbatim at Chrome.tsx:542. Already logged as C-7 in references/social-bible-audit/SOCIAL_BIBLE_CONTRADICTIONS.md:21, whose line refs data.ts:682/685 are now stale.
- Respond semantics. moment-conversation-model.md:25-29 and AGENTS.md R3 §41-44 say RESPOND writes and the tap is retired, with its fields not surfaced. Fixtures nt3, nt5 and nt8 ('responded to your …', data.ts:751, 753, 756) point at Moments with zero Responses (data.ts:641-665, 567-578) and are backed only by the retired `responders` arrays.
- Feature flags. 22-FEATURE-FLAG-ROLLOUT.md:54 says 'Each sub-flag ... gates exactly one adapter ... at its single mount point'. notificationsIntegration is read nowhere, and the resonance mark renders ungated (Chrome.tsx:547-551).
- Test claim. 23-CONTROLLED-IMPLEMENTATION.md:16 reports '6 — Notification Signal | PASS'. The assertion is vacuous (`ok(notifOk || true, …)`, celestial-s3-s6.js:183), and the privacy scan over [data-sb-notification-resonance] (celestial-s3-s6.js:192, 205) matches zero elements because no resonance row can be rendered.
- Naming the Resonance. 21-CELESTIAL-RESONANCE-FINAL-BIBLE.md:293 says a notification 'names the person and the Resonance'. The row text does not name it (store.tsx:229-230) and the mark is decorative (ResonateControl.tsx:406).
- Row renderer and payload. 22-COMPONENT-ARCHITECTURE.md:140-150 specifies a new row renderer and a payload with subjectType and privacySafePreview. The code reuses the generic Moment row plus a mark (Chrome.tsx:537-569), and the type has neither field (data.ts:102-115).
- Failed send. people-chat-integration.md:76-77 says 'a failed send keeps the text (accepted Notes pattern applies to chat sends)'. ChatMessage.failed is unused (model.ts:58-59), and the text is always cleared (Messages.tsx:122-123).
- Who may be messaged. model.ts:20-22 and people-chat-integration.md:23-25 say 'Messaging is permitted between connected people'. The /chat?c= deep link accepts any person, including self (ChatSurface.tsx:51), and send is unguarded (WorldProvider.tsx:72-79).
- Stale 'Chat is a placeholder' docs. README-for-developer.md:498 ('Chat ... disabled placeholders'), social-interaction-spec.md:143 ('the inert chat placeholder') and docs/social-feature-parity.md:34, 116 ('Chat icon ... icon only; Chat is Phase 7') contradict the real Messages utility, dock and /chat (Chrome.tsx:130-133; Messages.tsx; ChatSurface.tsx). Partly covered by bible C-8.
- Bible audit test claim. SOCIAL_BIBLE_AUDIT.md:75 says '/chat ... No suite loads the route'. complete-my-world.js:254-296 and 409 load /chat, /chat?c=p-bikash, /chat?c=p-asha and the phone flow.
- Bible audit unread claim. SOCIAL_BIBLE_AUDIT.md:806-808 says Asha's thread 'has three inbound messages after the viewer's last reply but declares unread: 2'. The fixture has exactly two inbound messages after the viewer's c-a2 (c-a3, c-a4 at model.ts:82-85), so unread: 2 is consistent. The counts are still hand-set.
- Bible audit type claim. SOCIAL_BIBLE_AUDIT.md:765-766 says the kind union is '"request" | undefined'. It is now 'request' | 'resonance' (data.ts:111), so the audit is stale.
- Launch classification. my-world-product-completeness.md:24 rates Notifications 'READY'. No notification payload or kind contract exists in social-api-contract.md (sections A-H), and the event vocabulary contradicts R3 (above). READY is defensible only as 'preserve live notification function, apply visuals'.

### WHAT REQUIRES OWNER DECISION
- Notification kinds: which human events notify the Moment author? Options for each of (a) a Response, (b) a reply to your Response, (c) Boom Expression, (d) Celestial Resonance, (e) inclusion in a Moment's `with`, (f) mention, (g) request accepted, (h) 'X shared a moment': notify every event / first only / aggregated only / never. (h) is feed-broadcast grammar (data.ts:750, 754) that SYSTEMBOOM's non-feed model may not want.
- Aggregation grammar: one row per person per event, a people-first per-Moment aggregate ('Asha, Bikash and 3 others responded to your Mustang Moment', matching Human Pulse 'N people'), or a daily digest? Should Boom and Resonance ever produce a row per person at scale?
- Mentions: build a mention model (which surfaces, and privacy toward non-audience people), or drop the nt4 fixture (data.ts:752)?
- Notification fixture vocabulary: correct the 'note' and retired-tap 'responded' fixtures now (data.ts:749-756, frozen Phase 4 data, would be a recorded exception), or leave them to the backend event contract? (Same question as bible C-7.)
- Group chat: 1:1 only for launch, map the live Chat's existing group capability (unknown), or defer? This affects Conversation (model.ts:70-74) and the actor-aware Resonance map.
- Moment in Chat: may a person share or reference a Moment in a conversation? Options: allowed, requiring a Moment permalink route plus a server audience check; or not allowed, keeping 'Chat remains a separate product' (moment-conversation-model.md:62). Should a Message started from a Moment author or Response author carry that Moment as context?
- Conversations after a relationship ends (Remove / unfriend): keep them read-only, hide them, or keep them messageable? (Today they stay sendable.)
- Where a notification about another person's Moment lands in the live product: in-stream (as the prototype does), that person's World, or a Moment permalink? (No Moment route exists.)
- Human Pulse who-lists as person doorways: the Boom who-expressed list sits under the preservation boundary (expressions.tsx:1162-1166). Allow a doorway there, or only on the Celestial who-resonated list (ResonateControl.tsx:359-363)?

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Resolve the notification target with the Search visibility rule (`authorId === me.id || privacy !== 'onlyme'`, Chrome.tsx:253) instead of all state.moments (Chrome.tsx:463). Show nothing for an unresolvable target instead of a silent no-op landing (Chrome.tsx:471-477).
- Record the outcome on the request notification when it is resolved, instead of deriving it from the live relationship (Chrome.tsx:529). Also mark the matching request notification read when the same request is resolved in PersonCard (PersonCard.tsx:113-118), People (People.tsx:97-101) or ProfileHero (ProfileHero.tsx:117-118).
- Guard the /chat deep link and the composer: require world.canMessage(c) and c !== me.id (ChatSurface.tsx:51); hide or disable the input when !canMessage (Messages.tsx:141-160); refuse `send` for non-connected ids (WorldProvider.tsx:72-79).
- Honour the failed-send contract: read simulateFailure, set ChatMessage.failed, and keep the text on failure (model.ts:58-59; Messages.tsx:119-124; WorldProvider.tsx:72-79).
- Celestial notification path: base the 'celestial' fixture on a Moment-event row with a momentId and a connected actor (store.tsx:227-231); expose it via ?notifications=celestial and the Bell selector (SocialPreview.tsx:487, 601); gate the mark with useCelestialSurface('notifications') (Chrome.tsx:547); name the Resonance in the row text or make the mark non-decorative (ResonateControl.tsx:406); replace the vacuous `notifOk || true` (celestial-s3-s6.js:183).
- Localise the notification day header and coordinate date through the catalog and sbDate (store.tsx:316-324; Chrome.tsx:501, 554), keeping English byte-identical.
- Localise the ConversationBody, MiniChat and ChatSurface strings, reusing chat.you and chat.noMessagesYet (Messages.tsx:128-129, 152-157, 187, 198-204; ChatSurface.tsx:66-68, 88, 92, 103, 107, 122-123).
- Replace the 57px literal with a measured bar height (ChatSurface.tsx:63); add safe-area-inset-top to WorldShell (WorldShell.tsx:18); make the desktop Back path reachable (ChatSurface.tsx:105-113).
- One shared 1024px breakpoint helper with resize reactivity for the five sites (Messages.tsx:64; PersonCard.tsx:74; People.tsx:188; ProfileHero.tsx:112; ChatSurface.tsx:108). Close or clear world.mini when the viewport drops below lg (Messages.tsx:188).
- Make chat headers a Person doorway (openPerson) and mount PersonCard in ChatSurface (Messages.tsx:194-197; ChatSurface.tsx:29-37, 114-117). This follows the accepted 'actions live with objects' rule.
- Attribute chat Seals to a person, e.g. use the unused celestial.chat.who key as the Seal title (ChatQuickResonance.tsx:95-99; en.ts:361), or delete the orphaned key.
- Update the stale docs to match accepted code: README-for-developer.md:498, social-interaction-spec.md:143, social-feature-parity.md:34 and 116 (Chat is real); SOCIAL_BIBLE_AUDIT.md:75, 765-766, 806-808 (the /chat test claim, the kind union, the Asha unread arithmetic).

<a id="co"></a>
## CO — Composer · people present · visibility
**Overall: PARTIAL** · master-table rows `CO-01` … `CO-28`

### WHAT THE PRODUCT NEEDS
- One composer state machine in two shells (desktop modal no wider than 560px, phone full-height sheet), MEMORY-FIRST order: header (author + privacy) → words → one coordinate sentence `today · DD MON YYYY · <age> · ⌖ place` → feeling + counter → seven kind chips → kind fields → media — docs/design/composer-states.md:3-11; AGENTS.md S5/S6 Part A row
- Prompt 'What happened at <exact age>?' and 'Draft kept — continue your moment' — docs/handover/social-content-rules.md:20-28
- Seven kinds with fixed field sets (meal what*/venue/with; meeting with*/venue/duration; health measurement*/value*; problem title*/status; project name*/progress/since; activity what*/measure/duration) — composer-states.md:35-45; social-interaction-spec.md:55-58
- Posted `fields` must carry only the keys of the Moment's own kind — docs/handover/social-api-contract.md:100
- Temporal honesty: a backdated Moment has day precision, gets sharedAt = now, and never shows an invented clock. Only a Moment recorded today, a trusted capture time or an explicit event time gets minute precision — social-api-contract.md:90-93, 119-121; social-interaction-spec.md:44; AGENTS.md Phase 5 §6 row; docs/social-feature-parity.md:155-157
- Photo detection is optional; Post stays disabled until Confirm or Change; the manual path always exists — composer-states.md:56-60; social-api-contract.md:139-141
- A date before birth is refused honestly and no negative age is ever shown — docs/handover/circle-of-life-spec.md:136-141; docs/design/circle-of-life.md:236-243
- Privacy scopes Public / Friends / Only me (hints: anyone / your people / just you). Default is Public; Health/Problem default to Only me unless the person has set privacy, and the earlier value comes back when they leave those kinds — composer-states.md:22, 39-40, 67; social-content-rules.md:151-154; social-api-contract.md:101, 116-117
- Only-me Moments of other people are never delivered, filtered server-side — social-api-contract.md:115; social-interaction-spec.md:84-86
- Validation: over limit, future date, required field, media kind with no media, detection not confirmed. Failure message 'Couldn't post. Your draft is kept.' with Retry — composer-states.md:70-84; social-content-rules.md:166-170
- Discard confirmation with Keep draft / Discard / Back; POSTING disables every control — composer-states.md:77-82
- Keyboard: arrow keys move within the kind group; ⌘/Ctrl+Enter posts; Escape closes the top-most layer — composer-states.md:89-95
- People in a Moment are only real references, never inferred — Moment.tsx:245-246 (Final Social Connection §16 row in AGENTS.md)
- Any person in any payload is a band-only PersonRef, including 'people' lists — social-api-contract.md:66-80, 123-127
- The retired Respond tap fields are not part of the live contract — docs/handover/moment-conversation-model.md:113-114; Resonance is a sibling map that never cross-writes Boom — references/celestial-resonance-bible/22-DATA-CONTRACT.md:68-69, 83

### WHAT EXISTS NOW
- Composer machine + shells: src/components/style-lab/social/Composer.tsx:143-594; shell CSS src/components/style-lab/social/SocialPreview.tsx:73,77; mounted at SocialPreview.tsx:766 (entry bar :726-735, openComposer :499, edit :500), Circle 'record at date' src/components/style-lab/circle/CirclePreview.tsx:114,215
- Draft type: src/components/style-lab/social/store.tsx:24-37; stored in memory only (store.tsx:4-5, 217-218); cleared on post (store.tsx:141)
- Moment model: data.ts:66-100 — at/sharedAt/atPrecision :70-77, place string :78, kind :80, fields :81, privacy :83, media single-type union :35-38 and :84, legacy responses/responders/respondedByViewer :85-87, notes :88, expressions :93, resonances :99
- KindFields.with?: string[] (person ids) data.ts:43; fixtures m-meal with 3 ids data.ts:416, m-meeting data.ts:511; fixture-only notification nt7 'added you to a meeting' data.ts:755
- Kinds and fields: Composer.tsx:47-55, 76-105 ('with' only on meal :80 and meeting :101)
- People input: a free-text comma-separated datalist over ALL PEOPLE, resolved on blur by first-name prefix — Composer.tsx:659-682 (resolution :671-675, datalist :679)
- Privacy picker Public/Friends/Only me with hints: Composer.tsx:308-323; labels en.ts:108-110, 181-184; default public Composer.tsx:115; Health/Problem auto Only me + restore Composer.tsx:185-199
- Coordinate sentence (date instrument, exact age, place input with PLACES datalist): Composer.tsx:355-398; DateField src/components/style-lab/social/DateField.tsx:14-36 (max only, no min)
- Backdating: at = date+T12:00, sharedAt = now, atPrecision 'day' — Composer.tsx:218, 228-229; readout hides clock for day precision Moment.tsx:215
- Photo detection from LIBRARY takenAt/takenPlace: data.ts:286-323; Composer.tsx:164-168, 357-372
- Media: mock library grid + reorder/remove Composer.tsx:484-520; video checkbox stand-in :470-474, 521-534; link simulation :262-272, 535-551; hardcoded link title :153 and description :212
- Validation and failure: canPost Composer.tsx:175-178; messages :399-400, 554-561; simulateFailure store.tsx:215-216, harness SocialPreview.tsx:488, 602
- Discard / Keep draft / Back: Composer.tsx:180-183, 565-571
- Edit: draftFromMoment Composer.tsx:118-134; edit dispatch :220; initialTime :596-598; reducer edit store.tsx:143-144
- Change privacy after posting: Moment.tsx:320-332; reducer store.tsx:147-148
- People-present rendering: kindLine meeting names Moment.tsx:89-90; 'with N' button + people popover Moment.tsx:121, 247-272 (label hardcoded English :254)
- Feed visibility filter removes only-me only: store.tsx:113-119 (:117); search the same Chrome.tsx:253
- Unknown person-id fallback returns fixture person 'M': store.tsx:271
- Separate relationship stores: present = fields.with (data.ts:43); responded = notes[].authorId (data.ts:55-64, 88; Moment.tsx:698-723); Boom = expressions map (store.tsx:171-179); Celestial = resonances map (store.tsx:180-189); legacy tap responders, whose reducer case `respond` store.tsx:149-160 no UI dispatches (Respond now opens the conversation, Moment.tsx:293-302)

### WHAT IS COMPLETE
- Text entry: 2,000-character limit with a danger counter, large focused textarea with an sr-only label (Composer.tsx:64, 334-349, 421) — prototype
- Memory-first body order as accepted in S5/S6 (Composer.tsx:9-26, 332-457)
- Create-path temporal honesty: backdated → day precision + sharedAt, today → minute (Composer.tsx:218, 228-229; Moment.tsx:215) — matches social-api-contract.md:119-121
- Future date refused (Composer.tsx:169-170, 399; canPost :178)
- Photo detection with Confirm/Change gating Post (Composer.tsx:166, 178, 357-372)
- Privacy picker UI and the Health/Problem Only-me default with restore (Composer.tsx:185-199, 308-323)
- Change privacy on an existing own Moment (Moment.tsx:320-332)
- Discard confirmation + Keep draft + restore on next open (Composer.tsx:565-571; SocialPreview.tsx:499, 732) — in memory
- Failure keeps the in-component draft and offers Retry (Composer.tsx:205-207, 556-561)
- Mobile full-height sheet, safe-area footer, 44px Post on phone, transform-free centring (SocialPreview.tsx:73, 77; Composer.tsx:564, 579; AGENTS.md S7 rows)
- Data-model separation of present / responded / expressed / resonated as distinct keys with no cross-writes (data.ts:43, 88, 93, 99; store.tsx:164-189)

### WHAT IS PARTIAL
- People present: can only be added on MEAL and MEETING (Composer.tsx:80, 101). A plain Moment, the default kind, has no way to record who was there. Entry is a free-text 'Names, comma-separated' field (en.ts:216) resolved silently on blur by prefix (Composer.tsx:671-675). There are no chips, the person never sees who their text resolved to, and there is no relationship filter: the datalist offers everyone in PEOPLE (Composer.tsx:679). No suite ever types into this field; only fixture rendering is tested (prototype-tests/social-connection-final.js:248-253)
- Photos come only from the mock LIBRARY, with no upload pipeline (Composer.tsx:484-520; data.ts:303-323). Video is a checkbox with a fixed poster and duration (Composer.tsx:210, 472). Link preview is a 700ms simulation keyed on 'example.org' with a hardcoded title and description (Composer.tsx:153, 212, 271)
- Place is a free-text string with a curated datalist (Composer.tsx:390-395; data.ts:334-349). There is no place entity or link to the Earth/SPACE layer (the API contract makes it free text, social-api-contract.md:95)
- Photo detection keeps the file's DATE only (Composer.tsx:167). A trusted capture time (e.g. takenAt 07:31, data.ts:304) is thrown away and the Moment gets noon + day precision, or 'now' when it is today, although the contract allows minute precision from a trusted capture time (social-api-contract.md:120-121)
- POSTING disables only Post (Composer.tsx:178, 577). composer-states.md:82 requires every control disabled; text typed during the 900ms is lost because submit captured `d` when clicked
- Kind group has no arrow-key roving (Composer.tsx:426-447; no key handler besides :344), required by composer-states.md:91
- Validation, failure and 'Posting…' are not announced: no role=status/alert/aria-live in Composer.tsx (only aria-busy :578). README-for-developer.md:391 requires the Posting… state to be announced
- Drafts live in memory only (store.tsx:4-5) and are lost on reload. A failed post is not written to the store (bible E-4, SOCIAL_BIBLE_AUDIT.md:460-461); it survives only while mounted
- Friends privacy is a display glyph only in the prototype: every viewer receives friends Moments (store.tsx:117; Chrome.tsx:253); enforcement is a live-server requirement
- i18n: the people popover label 'People in this Moment' is hardcoded English (Moment.tsx:254); the mock link title, description and video alt are English (Composer.tsx:153, 210, 212)

### WHAT IS MISSING
- A kind-independent 'people present' relationship on the Moment. It exists only as kind-scoped `fields.with` (data.ts:43)
- Consent, notification, visibility and self-removal for people named in a Moment. A named person is never asked, is not notified (the only precedent is fixture nt7, data.ts:755), cannot remove themselves, and appears to every viewer of the Moment (Moment.tsx:247-272)
- Non-account 'present' labels (e.g. 'Aama'). There is no representation for someone who has no account (see the BROKEN fallback)
- An explicit event time for a past Moment. There is no time field anywhere (SOCIAL_BIBLE_AUDIT.md:432-433). This is documented as optional future (social-feature-parity.md:156-157)
- A lower date bound: no `min` on DateField (DateField.tsx:30; Composer.tsx:381) and no before-birth check (Composer.tsx:169-172)
- A server-side contract for the `friends` audience (social-api-contract.md:115 covers only-me only; the view-model marks FRIENDS PRIVACY BACKEND CONTRACT as unverified, view-model.ts:138-139)
- Live upload pipeline with width/height plus optional takenAt/takenPlace, and a link-preview endpoint (README-for-developer.md:389; social-api-contract.md:130-141). Nothing server-side exists in this repo

### WHAT IS BROKEN
- EDIT destroys time truth. Composer.tsx:220 writes `${effDate}` + initialTime(), and initialTime (Composer.tsx:596-598) returns 'T12:00:00' from both branches. `atPrecision` and `sharedAt` are never patched. Editing m-rain (07:40, minute precision) makes its readout show '12:00', an invented clock time (Moment.tsx:215), which violates social-api-contract.md:119-121. Confirms bible E-2/ED-2 (SOCIAL_BIBLE_AUDIT.md:452-457, 1276)
- EDIT rebuilds media from mock constants. Link title resets to the hardcoded 'Boudha morning kora…' (Composer.tsx:153, 212) because draftFromMoment does not carry media.title (Composer.tsx:128). Video is rebuilt with a fixed poster and '0:42' (Composer.tsx:210)
- Cross-kind field leak. setKind never clears fields (Composer.tsx:188-197) and post sends the whole `d.fields` (Composer.tsx:233); edit does the same (:220). Choosing Meal, adding With, then switching to Activity or Health posts `with` too. Moment.tsx:121 + 247 then shows 'with N' on an Activity or Health Moment that never had a With field. Violates 'only the keys of that kind' (social-api-contract.md:100)
- Silent media loss. The UI lets photos, video and link be attached together (Composer.tsx:502-551), but submit keeps only one, by precedence video > link > photos (Composer.tsx:209-215). The rest are discarded without a word (Media is a single-type union, data.ts:35-38)
- Unresolved people are mis-attributed to a real fixture person. If no typed name matches, the raw strings are stored as ids (Composer.tsx:674). personOf falls back to PEOPLE.m (store.tsx:271), so the Moment reads 'with M', and the popover shows M's identity and opens M's person surface (Moment.tsx:59, 121, 260). With mixed input ('Asha, Grandma') the unmatched names are dropped silently (Composer.tsx:673-674). Prefix matching picks the first hit silently (e.g. 'S' → Sunita)
- Pre-birth dates are accepted and show a negative age. The Composer checks only 'future' (Composer.tsx:169-170). momentLifeFor → computeLifeTime has no clamp (src/lib/life-time.ts:20-33), so a 1983 date for Maya (born 1991-11-04, src/lib/mock/demo-user.ts:11) reads about '-9y 03m 02d' and can be posted. The Circle refuses the same date ('That date is before this life began.', src/components/style-lab/circle/CircleView.tsx:130), and the spec forbids negative ages (circle-of-life-spec.md:141)
- 'Viewing as public' misrepresents visibility. The public stand-in is applied to the Hero and Circle only (SocialPreview.tsx:516). The feed below still comes from the owner's store view (SocialPreview.tsx:406, 737-746; store.tsx:117), so the owner's Only-me Health/Problem Moments (data.ts:452-461, 519-529) and exact ages (Moment.tsx:112, 194-195) stay visible under the 'Viewing as public' banner (prototype-evidence/s2-person-world/33-view-as-public.png shows the feed rendering beneath the banner)
- MEETING names its people twice: 'with Maya, Bikash' from kindLine (Moment.tsx:89-90) plus a second 'with 2' button (Moment.tsx:247-251). Evidence: prototype-evidence/social-2030-final/41-meeting.png ('MEETING · with Maya, Bikash · Ratmate school · 1 h · with 2')
- Discard during POSTING still posts. The 900ms timeout (Composer.tsx:204-245) is never cleared. Cancel → Discard unmounts the composer, then the timer dispatches `post` anyway (Composer.tsx:222-241)
- Closing an EDIT with changes drops them without confirmation: requestClose skips discard when editing (Composer.tsx:180-183)

### WHAT IS DISCONNECTED
- The legacy tap-Respond model (responses/responders/respondedByViewer, data.ts:85-87; reducer store.tsx:149-160) is still in the model and in every fixture, but nothing dispatches it (Respond opens the conversation, Moment.tsx:293-302; bible ED-13 SOCIAL_BIBLE_AUDIT.md:1287). It is a second, invisible 'people who responded' list that disagrees with notes[] (e.g. m-1983 responses: 14 vs 1 note, data.ts:405-407)
- Fixture notification nt7 'added you to a meeting at Ratmate school' (data.ts:755) implies an inclusion-notification flow that the Composer never produces
- useComposerSeed (Composer.tsx:692-695) is exported but has no caller (grep: only the Composer.tsx definition)

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- People-present shape. social-api-contract.md:147 defines meal `with?: number` (a count) and :152 meeting `with*: string[]` ('first names shown'), but code stores a person-id array for both (data.ts:43; Composer.tsx:671-675) and renders real people (Moment.tsx:247-272, Final Social Connection §16 row in AGENTS.md). README-for-developer.md:398 also says 'meeting with[]'
- Respond API. social-api-contract.md:103 still ships `respond { count, byViewer }` ('one reaction'), but docs/handover/moment-conversation-model.md:113-114 retires those fields and code has no Respond tap (Moment.tsx:151-156, 293-302). social-interaction-spec.md:73-76 and social-content-rules.md:110-123 still describe the toggle, 'n notes' and 'Write a note' vocabulary
- Meeting line. social-content-rules.md:52-55 specifies `MEETING · with <first names> · …` once, but code renders names AND 'with N' (Moment.tsx:89-90 + 247-251; 41-meeting.png)
- Readout order/heading. social-content-rules.md:161-165 specifies a visible heading WHERE THIS SITS and the sentence 'This moment will sit at <age> · <place> · <today>', but the code (memory-first S5/S6) orders today · date · age · place and keeps the heading sr-only (Composer.tsx:356, 375-395). This is recorded as C-1 in references/social-bible-audit/SOCIAL_BIBLE_CONTRADICTIONS.md:15
- Posting state. composer-states.md:82 says 'every control disabled', but code disables only Post (Composer.tsx:577)
- Kind-group keyboard. composer-states.md:91 requires arrow keys, but code has none (Composer.tsx:426-447)
- Structured-kind validity. social-interaction-spec.md:47 and composer-states.md:33 require text or media, matching code (Composer.tsx:178). The bible audit classes the same behaviour as a defect: 'Health with measurement+value but no prose cannot be posted' (SOCIAL_BIBLE_AUDIT.md:458-459, 1277)
- Pre-birth. circle-of-life-spec.md:136-141 and CircleView.tsx:130 refuse pre-birth dates, while the Composer (the other date entry into the same Life) accepts them (Composer.tsx:169-172, 381)
- Live privacy scope. composer-states.md:67 ('the live system exposes Public; the other two are the design') conflicts with social-api-contract.md:101, 116-117, which make friends/onlyme and the Health/Problem Only-me default a contract
- Textarea labelling. SOCIAL_BIBLE_AUDIT.md:1100-1101 says the Composer textarea is 'unlabelled', but code has `<label htmlFor="sb-composer-text" className="sr-only">` (Composer.tsx:334)

### WHAT REQUIRES OWNER DECISION
- People-present CONSENT: when an author names someone in a Moment, is it (a) author-asserted and visible at once, with the named person able to remove themselves; (b) pending and visible only to author and named person until confirmed; or (c) account-linked only for friend/family, with anyone else recorded only as an unlinked free-text label?
- People-present SCOPE: should 'who was there' be available on (a) every kind, including a plain Moment, as a top-level `present` field, or (b) only meal/meeting as today (`fields.with`)? And on Health/Problem: (i) never, (ii) only while Only me, or (iii) always?
- FRIENDS audience: does `friends` privacy mean (a) relationship = friend only, or (b) friend + family, as the hint 'your people' (en.ts:183) implies?
- LIVE PRIVACY LAUNCH GATE: (a) ship Friends + Only me server-side before Social launches, or (b) launch Public-only and hide Health/Problem kinds (whose default is Only me) until Only me exists? (composer-states.md:67 vs social-api-contract.md:116-117)
- STRUCTURED KIND WITHOUT PROSE: can a Health/Problem/Project Moment with every required field filled but no words be posted? (a) yes, required fields suffice; (b) no, keep the current text-or-media rule (social-interaction-spec.md:47)
- DRAFT PERSISTENCE in the live product: (a) memory only, as today (store.tsx:4-5); (b) device-local; or (c) server-side drafts? Consider Health/Problem drafts on shared devices
- PHOTO CAPTURE TIME: should a trusted file capture time raise a detected Moment to minute precision (allowed by social-api-contract.md:120-121), or should every backdated photo stay day precision (current, Composer.tsx:167, 218)?
- MULTI-MEDIA: can one Moment hold photos plus a link or video? (a) no, one media type per Moment (matches Media union data.ts:35-38; the UI must then enforce it), or (b) yes (a contract change)?

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Composer.tsx:220 + 596-598 — edit keeps the original `at` time and `atPrecision` when the date is unchanged. When the date moves into the past it sets atPrecision 'day' and sharedAt. Delete the dead initialTime
- Composer.tsx:128, 153, 210-212 — edit keeps the existing media object (link title/description, video poster/duration) unless the person changed it
- Composer.tsx:233 and :220 — post and edit only the keys in KIND_FIELDS[kind], and drop `fields` when kind is 'moment'. Values can still be kept in the draft per composer-states.md:45
- Composer.tsx:209-215 + 460-551 — stop the silent drop: make photos, video and link mutually exclusive in the UI (matches data.ts:35-38 and social-api-contract.md:133-137) until the multi-media decision
- Composer.tsx:169-172 + DateField.tsx:30 (via Composer.tsx:381) — refuse dates before the author's birth with the existing sentence from CircleView.tsx:130, and pass a `min`. Never render a negative age
- Composer.tsx:671-675 + store.tsx:271 — never store an unresolved string as a person id, and never fall back to PEOPLE.m for an unknown id. Show resolved people as removable identity chips; reject or hold unmatched names instead of dropping them silently
- Moment.tsx:89-90 vs 247-251 — the meeting line names its people once
- Moment.tsx:254 — route 'People in this Moment' through the catalog
- Composer.tsx:201-246 — disable (or make inert) the body during POSTING per composer-states.md:82, and clear the timeout on unmount/discard so a discarded Moment is never posted
- Composer.tsx:180-183 — confirm before closing an EDIT that has changes (small copy addition needed)
- Composer.tsx:426-447 — arrow-key roving in the kind group per composer-states.md:91
- Composer.tsx:399-400, 554-561, 578 — put validation, failure and 'Posting…' in a polite live region
- SocialPreview.tsx:737-746 — while selfPreview is on, render the feed through the public stand-in (drop the owner's only-me Moments and use the band only), or suppress the feed, so 'Viewing as public' is truthful (a frozen-zone exception row is needed in AGENTS.md)
- Docs only: social-api-contract.md:103 (remove respond), :147/:152 (with = PersonRef ids); social-content-rules.md:52-55, 110-123, 161-165; social-interaction-spec.md:73-76; SOCIAL_BIBLE_AUDIT.md:1100-1101 (textarea is labelled at Composer.tsx:334)

<a id="pl"></a>
## PL — Place · Life · Cosmos
**Overall: PARTIAL** · master-table rows `PL-01` … `PL-30`

### WHAT THE PRODUCT NEEDS
- One product, no destination menu. The mark goes Home to Cosmos and one context word sits beside it. Earth is a Cosmos state (`/?to=earth`) and never a route. `/social` redirects to `/world`. Style-lab paths and the word 'Social' never appear in product navigation. Refs: docs/design/systemboom-navigation-final.md:19,26-36,50-55,102-106 and systemboom-application-architecture.md:24-26,123-124.
- Life is entered from My World through the hero Circle row and the Circle module's Open Life. Refs: navigation-final.md:66-67 and navigation-map.md:23.
- A personal URL opened without an identity is remembered and continued after the gate, so the person never asks twice. Refs: navigation-final.md:69-70 and navigation-map.md:48-49. Deep links, Back, refresh and the Circle's `?c=` must all work. Ref: architecture.md:104-108.
- View in Life (Phase 6): a Moment asks for `?c=day:YYYY-MM-DD` through `coordForDate`, and the Circle rebuilds the breadcrumb. Visitors resolve to LIFE. The slot stays disabled and honest until then. Refs: circle-of-life-spec.md:128-134, circle-of-life.md:231-235, social-api-contract.md:107, navigation-map.md:39.
- Personal life begins at birth, and earlier time is Ancestral. A date before birth is refused ('That date is before this life began.'). Bands are never extended backwards and ages are never negative. Refs: circle-of-life.md:236-244, circle-of-life-spec.md:136-144, architecture.md:135-141, social-shell-spec.md:123-128.
- Visitor Life shows the band only. No tick, no fraction, no calendar years, and no Moment counts per band, year, month or day (nor any count keyed by the person's age). Deep links deeper than LIFE are refused on the client and must also be refused by the server. Refs: circle-of-life.md:86-101, circle-of-life-spec.md:49-68,151, social-api-contract.md:186-189.
- Place: `place?: string` is free text, may be Devanagari, and is never invented. Ref: social-api-contract.md:95. A Social ↔ Earth integration (Moments on the globe) is Phase 6+, and nothing decorative should anticipate it. Ref: social-shell-spec.md:119-121. Earth search uses the Google Places API (New). Ref: earth-explorer.md:8-9.
- Visitor profile page = hero + that person's Moments, class A, and the visitor feed is 'filtered to one author, onlyme excluded'. Refs: social-feature-parity.md:121, social-api-contract.md:204.
- One theme store, dark by default, and navigation never changes the theme. Refs: navigation-final.md:72-78, social-shell-spec.md:88-98. Light-mode Cosmos continuity is still an open owner item. Ref: open-issues.md:3-24.
- Stepping inward (Social → Life) uses the Circle's own zoom. Ref: social-shell-spec.md:135. The ring-to-Circle expansion seam is `?entry=ring`. Ref: circle-of-life.md:226-230.

### WHAT EXISTS NOW
- Destination model: cosmos, world, life and chat. There is no ancestors entry and no `later` field. EARTH_INTENT is defined but nothing consumes it. src/components/shell/destinations.ts:25-45,53-57
- The Brand mark links Home to `/` from every non-root route and is inert at the root. Context words are localized for world and life only; 'Chat' is a raw label. src/components/shell/Brand.tsx:18,29,50-68
- WorldShell (used by Life and Chat) carries the Brand and a ThemeToggle only: no Language, Search or Account control, and no link to My World. src/components/shell/WorldShell.tsx:15-31
- Cosmos root opens the gate on `?identity=1`, shows the pre-login LanguageMenu, and shows an 'Enter my world' chip when signed in. The chip goes to world or life from peekIntent. src/components/shell/CosmosRoot.tsx:30-42,51-79
- PersonalDestination remembers only the destination id, then calls router.replace('/?identity=1'), which drops any query. Its waiting text is hard-coded English. src/components/shell/PersonalDestination.tsx:21-35; src/components/shell/intent.ts:12-18
- After identity, the gate continues only to world or life; a 'chat' intent falls back to world. Its copy is hard-coded English. src/components/identity/IdentityGate.tsx:316-320,325-327,344
- Earth deep link: `?to=earth` is consumed with replaceState, and select('earth') fires after 700ms. No coordinate or place parameter is accepted, and nothing is pushed to history. src/components/cosmos/CosmosExperience.tsx:179-195
- `/social` redirects to `/world` and drops the query string. src/app/social/page.tsx:8-10. `/world`, `/life` and `/chat` each wrap PersonalDestination. src/app/world/page.tsx:14-19, src/app/life/page.tsx:12-16, src/app/chat/page.tsx:17-21
- Moment place renders as inert text: inline at @2xl, on its own line on phones. src/components/style-lab/social/Moment.tsx:199-204,221-226
- View in Life: a disabled pill that is hidden below @2xl, plus a disabled item in the ⋯ menu for both own and others' Moments. src/components/style-lab/social/Moment.tsx:307-310,344,351
- Copy link writes `https://systemboom.example/m/<id>`. No Moment route exists. src/components/style-lab/social/Moment.tsx:350
- A Moment's life position for other people is `momentLifeFor(me, author, momentDate)`: the band at the Moment's own date. The ring also uses `at` = the Moment date. src/components/style-lab/social/Moment.tsx:109-112,181,194-198; src/components/style-lab/social/view-model.ts:80-88,110-113
- Search Places come from the static PLACES list, not from Moment data. The tally is an exact string match over a set that filters out only other people's onlyme Moments. Choosing a place just re-runs the search with the place as the query. src/components/style-lab/social/Chrome.tsx:253-260,417-434; data.ts:334-349
- Composer place is a free-text input with a PLACES datalist. The date input has max=today and no minimum (birth). Validation checks only 'future'. src/components/style-lab/social/Composer.tsx:169-170,381,393-395; src/components/style-lab/social/DateField.tsx:14; src/lib/identity/birth.ts:43-51
- Owner Life entries in My World: the hero ring links to /life, the 'band · N days · Life →' row links to /life, and the Circle module's Open Life links to /life (owner only). src/components/style-lab/social/ProfileHero.tsx:185-187,259-267; src/components/style-lab/social/CircleModule.tsx:82-96
- The Circle module's 'Circle settings' gear has no handler. src/components/style-lab/social/CircleModule.tsx:87-89
- The /life page ignores ?viewer, ?entry and ?w on the product route but reads ?c. The initial coordinate applies only when viewer = subject. src/components/style-lab/circle/CirclePreview.tsx:84-96,208
- Circle URL grammar: `c=life|band:N|age:N|month:YYYY-MM|day:YYYY-MM-DD`. decodeCoord has no birth or future bounds, and normalizeCoord computes age and band with no floor at 0. src/components/style-lab/circle/model.ts:140-158,160-184
- Jump to date refuses future dates and dates before birth. src/components/style-lab/circle/CircleView.tsx:124-133
- Visitor Circle: band resolution only, coordinate forced to level 0, URL sync off. src/components/style-lab/circle/CircleView.tsx:52-58; model.ts:200-226
- The visitor Circle copy links to `/style-lab/social?viewer=visitor` labelled 'Social'. src/components/style-lab/circle/CircleView.tsx:235-243
- DayAlmanac lists the day's Moments with the accepted MomentEntry, plus kind filters and 'Record a moment on this day' (owner). It uses the subject's own viewer-safe Moments only. src/components/style-lab/circle/DayAlmanac.tsx:18-71; model.ts:118-121,325-331
- The Circle day header uses the subject's HOME as that day's place. src/components/style-lab/circle/model.ts:331; CircleView.tsx:204-211
- /world and /life each mount their own in-memory SocialStore (useReducer seed), so state does not carry across routes. src/components/style-lab/social/SocialPreview.tsx:395-401; CirclePreview.tsx:66-72; store.tsx:90-102,262
- My World stream = every author's Moments, newest first, with only other people's onlyme removed. There is no relationship or friends-privacy filter and no filter by profile subject. src/components/style-lab/social/store.tsx:113-119,274,283
- The profile subject is always Maya (or Asha). Visitor modes exist only in the harness. src/components/style-lab/social/store.tsx:104-110; SocialPreview.tsx:461-471
- LifeCursor shows year · life position · place of the Moment being read. The position is the band at that date for other people's Moments; the place is not clickable; 'Life {band}' is hard-coded. src/components/style-lab/social/LifeCursor.tsx:68-89
- Visitor ring density: PersonIdentity defaults connected=false, which is not undefined, so ringViewFor computes public-Moment density per band for ANY non-owner whenever `moments` is passed (ProfileHero, PersonCard). LifeRing then draws it as opacity depth. src/components/identity/PersonIdentity.tsx:36,63; view-model.ts:164-171; LifeRing.tsx:129-134; ProfileHero.tsx:186-189
- The Cosmos → My World arrival resolve (sb-arrive) is set by the chip and by the gate. src/components/style-lab/social/SocialPreview.tsx:420-429,675; CosmosRoot.tsx:65-71; IdentityGate.tsx:333-335
- With the celestial flag on, My World shows a page-wide cosmos sky; Life does not. The flag is off by default. src/components/style-lab/social/SocialPreview.tsx:641; src/components/celestial/CelestialEnvironment.tsx:37-40; src/lib/celestial/flags.tsx:30-39

### WHAT IS COMPLETE
- Brand/Home: from /world, /life and /chat the mark goes to Cosmos, and the context word is localized for My World and Life. Brand.tsx:50-68; Chrome.tsx:127; WorldShell.tsx:20
- Entering My World from Cosmos: the signed-in chip and the gate's Enter My World / Continue to Life, with a one-shot arrival resolve. CosmosRoot.tsx:61-79; IdentityGate.tsx:314-347; SocialPreview.tsx:420-429
- Owner entry into Life from My World in three places: ProfileHero.tsx:185-187,259-267 and CircleModule.tsx:91-94
- The Circle's temporal navigation with history: each level pushes a history entry, Back goes one level out, and refresh rebuilds `?c=`. CircleView.tsx:56-82,99-122
- Jump to date refuses future and pre-birth dates. CircleView.tsx:128-130
- Visitor Life privacy is structural in the prototype: band only, deep coordinates refused, no counts. CircleView.tsx:52-58; CirclePreview.tsx:208; model.ts:200-226. On the product /life the viewer is always the owner. CirclePreview.tsx:90-91
- Circle day → Moments (listing): DayAlmanac renders the day's own Moments with full MomentEntry, kind filters, an empty state and record-at-date. DayAlmanac.tsx:18-71; model.ts:325-331
- Earth is a Cosmos state, and `/?to=earth` enters it once. CosmosExperience.tsx:179-195
- Single theme store. The same ThemeToggle is used on /life, /chat and My World. WorldShell.tsx:23-25; Chrome.tsx (Appearance in the account menu)
- WHO AM I and WHERE IN MY LIFE are answered on /world for the owner: identity, home, band · days → Life, birth date, Life Instrument, LifeCounter (desktop), Circle module, Life Cursor, and a composer prompt with the owner's exact age. ProfileHero.tsx:165-285; SocialPreview.tsx:693-705,717,729-732

### WHAT IS PARTIAL
- Search Places: returns place rows with a Moment tally and narrows the search, but the rows come from a static list. Moment places 'Bhaktapur' (data.ts:534,606) and 'Kathmandu Durbar Square' (data.ts:618) can never appear as Places. 'Patan Durbar Square' and 'पाटन दरबार स्क्वायर' are tallied separately. The tally counts friends-privacy Moments from people who are not connected (store.tsx:117; Chrome.tsx:253,259; world/model.ts:34; data.ts:479-486,531-537). Chrome.tsx:258,417-434; data.ts:334-349
- Deep links through identity: the destination survives the gate but its query does not. `/life?c=day:…` lands on LIFE; `/chat?c=<person>` lands on /world. intent.ts:12-18; PersonalDestination.tsx:26-27; IdentityGate.tsx:319
- Life → My World: the only paths are browser Back or the mark → Cosmos → Enter my world. WorldShell.tsx:18-27; evidence references/social-bible-audit/evidence/42-route-life-dark.png
- Back navigation into Cosmos: Earth/focus state is not held in history, so returning from My World lands in the default Cosmos view. CosmosExperience.tsx:180-195 (frozen)
- My World → Life visual continuity: product links are plain route changes. The ring→Circle layout expansion (`?entry=ring`) is gated to the dev alias (CirclePreview.tsx:93,172-211). The grounds differ: My World uses the atmosphere radial (SocialPreview.tsx:57), plus a flag-gated sky (:641); Life uses flat --page (CirclePreview.tsx:43,48).
- Language continuity: the Brand, CircleModule and My World are localized. Circle internals are English in every locale (CircleView.tsx:129-130,145,175,182-183,210,218-237; DayAlmanac.tsx:16,35,47,50; CirclePreview.tsx:188-198), and so are PersonalDestination.tsx:34 and IdentityGate.tsx:325-327,344. /life has no Language control (WorldShell.tsx:22-26). Documented as deferred: docs/i18n/translation-status.md:54-57
- WHAT IS HAPPENING: answered by a chronological stream (TODAY rule) plus the bell (SocialPreview.tsx:737-747; Chrome.tsx:138-141). The stream's scope is defined by the prototype, not by a contract: it includes non-connected people and friends-privacy content from non-connected authors (store.tsx:113-119; world/model.ts:34-36,43-46).
- WHO ARE MY PEOPLE: answered only through the People utility in the bar (Chrome.tsx:130; world/People.tsx), not in the page body. There is no route to another person's World from the person surface (world/PersonCard.tsx:92-102).
- WHAT CONVERSATIONS: answered through the Messages utility and mini chat (Chrome.tsx:131-133; SocialPreview.tsx:659-662,674) and the per-Moment presence line; not in the page body.
- WHERE: place appears as text on the hero (ProfileHero.tsx:205), on each Moment (Moment.tsx:199-204,221-226) and in the Life Cursor (LifeCursor.tsx:88). There is no Place object, map or Earth link.
- Circle day → a single Moment: renders inline only. There is no permalink (Copy link points at a route that does not exist, Moment.tsx:350) and no return to the Moment's position in the My World stream (focusMoment exists only inside /world: world/focus-moment.ts:11-27).
- Circle day header place = the subject's home (model.ts:331; CircleView.tsx:208), as drawn in circle-of-life.md:155-157. On a day whose Moments were elsewhere (e.g. m-snow, a Mustang trek) it shows 'Kathmandu, Nepal'.
- End-of-feed copy says 'Earlier moments live in Life' (en.ts:81). Life holds only the subject's own Moments (model.ts:118-121), and the sentence is not a link.

### WHAT IS MISSING
- Clicking a Moment's Place: nothing happens. The place is a plain <span> (Moment.tsx:199-204,221-226). There is no Place identity (data.ts:78 `place?: string`; social-api-contract.md:95), no Place surface, and no Moment → Moments-here, → people-here or → Earth path.
- My World → Earth: EARTH_INTENT (destinations.ts:57) has zero consumers, and Earth accepts no coordinate (CosmosExperience.tsx:182). Deferred to Phase 6+ by social-shell-spec.md:119-121.
- Moment → Circle day ('View in Life'): disabled for everyone (Moment.tsx:307-310,344,351). coordForDate (model.ts:186-189) is used only by Jump to date (CircleView.tsx:132), even though /life already accepts `?c=day:` (CirclePreview.tsx:94).
- A subject-addressed Life route: /life is always the signed-in person's own Circle (CirclePreview.tsx:90-91; store.tsx:104-110). 'Visitors resolve to LIFE' (circle-of-life-spec.md:133) has no target for another person's Moment.
- Another person's World (visitor profile, class A per social-feature-parity.md:121) has no product route. Visitor modes are harness-only (SocialPreview.tsx:461-471).
- WHAT MOMENTS MATTER: pure chronology, with no owner-chosen significance and no 'same day across your life' (banked: docs/phase-5-candidates.md:47). This is by design today.
- Ancestors: absent everywhere (destinations.ts:12-14), with no `later` destination entry, although architecture.md:139-141 says one exists.
- Server-side guarding of /world, /life and /chat, and server refusal of deep Life coordinates for non-owners: P1 obligations, not built (circle-of-life-spec.md:67-68; SOCIAL_BIBLE_ROUTE_MAP.md:148).
- A single Moment source across routes. The prototype has two in-memory stores, so a Moment recorded from /life's DayAlmanac is lost on /world (SocialPreview.tsx:395-401; CirclePreview.tsx:66-72,114,213-217).

### WHAT IS BROKEN
- Pre-birth `?c=` deep link on /life (owner). decodeCoord accepts any date (model.ts:182). For Maya (born 1991-11-04, demo-user.ts:11), `?c=day:1983-02-06` normalizes to age −9 and band −1 (model.ts:146-150), so the breadcrumb band label is CIRCLE_BANDS[-1], i.e. undefined (model.ts:232). Pre-birth days render as 'lived' and enterable (model.ts:244-263), and dayAge is a negative 'y m d' (model.ts:329-330; life-time.ts:20-33). This contradicts circle-of-life.md:236-244 and circle-of-life-spec.md:141-144 ('do not invent negative ages').
- Pre-birth Moment via the Composer. Only future dates are refused (Composer.tsx:169-170; birth.ts:43-51) and DateField has no min (DateField.tsx:14; Composer.tsx:381). A Moment dated before the author's birth posts, and its readout computes a negative exact age for the owner; for others, currentBandIndex(<0) returns −1, so CIRCLE_BANDS[-1] is undefined (life-time.ts:79-81; view-model.ts:80-85; Moment.tsx:194-198). bandCounts then writes to index −1 (view-model.ts:115-118).
- DayAlmanac offers 'Record a moment on this day' for a FUTURE day reached by URL (DayAlmanac.tsx:48-52; model.ts:182). The Composer then blocks posting (Composer.tsx:169-170, 178): a dead end rather than a crash.

### WHAT IS DISCONNECTED
- EARTH_INTENT is exported but never linked from any surface (destinations.ts:57; grep shows no consumer).
- coordForDate is documented as the View in Life seam (model.ts:186) and is ready, but no Moment calls it.
- The visitor Circle copy links to the style-lab alias and labels it 'Social' (CircleView.tsx:236-240). It is latent: it renders only when viewer ≠ subject, which the product /life never produces. It still breaks navigation-final.md:55,103-104.
- The Search Places list (data.ts:334-349) is disconnected from the Moment place data it tallies (data.ts:383-672).
- Copy link produces `systemboom.example/m/<id>` with no matching route (Moment.tsx:350).
- The ring→Circle expansion seam (`?entry=ring`, CirclePreview.tsx:93) is unreachable from product links (ProfileHero.tsx:185; CircleModule.tsx:91).
- The /world and /life SocialStore instances are separate (SocialPreview.tsx:397; CirclePreview.tsx:68). This is prototype-only, but it hides whether the two-way Life link keeps state.

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- LIFE PRIVACY (hard rule). Docs: circle-of-life.md:97-101 says counts of dated Moments per age band 'would narrow their birth date … Visitors therefore get no density at all … in the Life Ring', and circle-of-life-spec.md:59-62,151 bans per-band counts for other people. Code: (1) every other person's Moment prints the band AT THE MOMENT'S DATE (view-model.ts:110-113 via Moment.tsx:112,194-198 and LifeCursor.tsx:76-77), and the contract ships the same thing (`lifeAtMoment … { bandLabel }`, social-api-contract.md:106). Proof from fixtures: Sunita (data.ts:138, born 1979-11-02) shows m-wedding 2022-10-17 as '30–45' and m-tenphotos 2026-04-13 as '45–60'. That puts her 45th birthday in that window, cutting her birth range from 15 years to about 3.5. (2) Visitor rings get public-Moment density per band for any non-owner, stranger included (PersonIdentity.tsx:36,63; view-model.ts:164-171; LifeRing.tsx:129-134). AGENTS.md records the public-only density as owner-authorised, but the Circle documents were never updated.
- Code comment vs code: SocialPreview.tsx:504-505 says 'a stranger's ring stays band-geometry only', and PersonIdentity.tsx:49 says 'Friend/family unlocks … density'. In fact connected=false still computes density (PersonIdentity.tsx:36 default false; view-model.ts:164 `connected !== undefined`).
- Visitor feed scope. Docs: social-api-contract.md:204 ('Visitor profile feeds … filtered to one author') and social-feature-parity.md:121 ('hero + that person's moments'). Prototype visitor modes show every author's Moments under Maya's hero (store.tsx:113-119,283).
- Disabled unbuilt affordance. social-shell-spec.md:49 ('unbuilt destinations are absent, not disabled') and social-2030-future-seams.md:64-68 (no 'hinted at with disabled UI') conflict with social-api-contract.md:107, README-for-developer.md:64-66,174 and Moment.tsx:307-310,344,351 (a visible disabled 'View in Life'). The disabled pill also renders inside Life's own DayAlmanac (DayAlmanac.tsx:60). Related: SOCIAL_BIBLE_CONTRADICTIONS.md C-12.
- Ancestors in the destination model. architecture.md:139-141 says Ancestors 'is in the destination model as a `later` destination', and AGENTS.md says to 'add it to destinations.ts as `later`'. But destinations.ts:25-45 has no ancestors entry and no `later` field, and architecture.md:36 itself says 'absent everywhere'.
- Stale shell spec. social-shell-spec.md:28-31 says '/world without a session says so plainly and points back to Cosmos', but the code redirects (PersonalDestination.tsx:23-28). social-shell-spec.md:49-50 says aria-current plus a red dot mark the current destination, and :77-78 says there is 'a single disciplined nav row under the bar'. Both conflict with navigation-final.md:26,102 (no tab row) and Chrome.tsx:127 (Brand only).
- Deep links. architecture.md:104-108 and navigation-map.md:48-49 ('never asks twice') say deep links work, but intent.ts:12-18 and PersonalDestination.tsx:27 drop the `?c=` coordinate and the Chat `?c=` conversation for a signed-out person.
- Place never invented (social-api-contract.md:95) vs the Circle day header, which shows the person's home as the day's place (model.ts:331). That header was drawn this way in circle-of-life.md:155-157.
- Atmosphere. social-shell-spec.md:19,106-107 ('not achieved by putting space imagery behind content'; 'atmosphere … from tokens and typography') vs the flag-gated page-wide cosmos sky behind My World (SocialPreview.tsx:641; CelestialEnvironment.tsx). It is off by default (flags.tsx:30-39).
- Navigation doc staleness. navigation-final.md:44,89 describe chat as 'later' or 'inert placeholder', but Messages and Chat are real (Chrome.tsx:131-133; app/chat/page.tsx). This duplicates SOCIAL_BIBLE_CONTRADICTIONS.md C-8.

### WHAT REQUIRES OWNER DECISION
- Per-Moment life position for other people (P0, Life privacy): which should a historical Moment show? Options: (a) the author's band at the Moment's date (current; narrows birth dates across band boundaries); (b) the author's CURRENT band on every Moment; (c) no life position on other people's historical Moments. And should visitor rings keep public-Moment band density (current), or return to 'no density for others' as circle-of-life.md:97-101 states?
- Place identity: should Moment.place stay free text (current), or become a structured place `{ label, placeId?, lat?, lng?, precision? }` sourced from the Places API that Earth already uses (earth-explorer.md:9) and from upload metadata (social-api-contract.md:139)?
- Where a Place opens. Options: (a) a transient Place surface inside My World (Moments here + people here, viewer-safe); (b) a handoff into Earth in Cosmos, which needs an authorised change to the frozen CosmosExperience.tsx:179-195 to accept coordinates; (c) both, with Earth as a secondary 'See on Earth'.
- View in Life on another person's Moment. Options: (a) owner's own Moments only; (b) the author's Circle at band resolution, which needs a subject-addressed Life route such as /life?p=<id>; (c) the viewer's OWN Circle at that date ('where was I in my life then').
- Pre-birth Moments. Options: (a) refuse in the Composer like Jump to date; (b) allow them as Ancestral-context records with no life position; (c) defer until the Ancestor Tree exists.
- Life → My World return. Options: (a) keep Back + the mark only (current); (b) add a local return to My World on /life. Adding a return is a local control, not global navigation.
- My World stream scope: should it be (a) all delivered Moments, including non-connected public authors (current prototype), or (b) own Moments + connected people? And what route shape should another person's World use: /world/<id>, /world?p=<id>, or person surface only?
- Disabled 'View in Life' pill: keep it visible and disabled until Phase 6 (api-contract/README), or remove it until built (shell-spec, future-seams)? And should it be hidden inside Life's own DayAlmanac?
- Circle day header place: keep the subject's home (per design doc), derive it from that day's Moment places, or omit it?
- Light-mode Cosmos → Solar Observatory continuity (open-issues.md:19-24, options a/b/c).
- Should Earth/focus state inside Cosmos be restorable on Back? This touches the frozen Phase 1 code.

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Refuse coordinates before birth and after today in the Circle URL path, matching Jump to date: decodeCoord/normalizeCoord (model.ts:140-158,176-184) should fall back to LIFE or show the existing 'That date is before this life began.' sentence (CircleView.tsx:130). This follows circle-of-life.md:241-243 and circle-of-life-spec.md:141-144.
- Hide 'Record a moment on this day' on future days. DayAlmanac.tsx:48-52 (the view already knows the segment state, model.ts:244-263).
- Replace the visitor Circle link `/style-lab/social?viewer=visitor` and its 'Social' label with `/world` / 'My World' (CircleView.tsx:236-240), per navigation-final.md:55,103-104.
- Remember the full requested path + query through identity (e.g. `/life?c=day:…`, `/chat?c=p-…`), and honour 'chat' in the gate: intent.ts:12-18, PersonalDestination.tsx:26-27, IdentityGate.tsx:316-321,330, CosmosRoot.tsx:41-42.
- Derive Search Places from the viewer-visible Moment place strings instead of the static list, so every recorded place is findable. Chrome.tsx:258; data.ts:334-349. Keep PLACES only as the Composer datalist (Composer.tsx:395).
- Make the /social redirect keep its query string. src/app/social/page.tsx:9
- Correct the stale code comments about stranger density: SocialPreview.tsx:504-505 and PersonIdentity.tsx:49. This is a comment fix only; the behaviour itself belongs to the owner decision above.
- Correct stale documents: architecture.md:139-141 (Ancestors `later` claim); social-shell-spec.md:28-31,49-50,77-78 (Compass-era statements); navigation-final.md:44,89 (chat placeholder); README-for-developer.md:122 ('alias of /social').
- Localize the context word for chat (Brand.tsx:18) and the hard-coded 'Circle band … years' titles and labels (Moment.tsx:197; LifeCursor.tsx:77; PersonIdentity.tsx:65). Wire Circle and gate strings through useT with English byte-identical (CircleView.tsx, DayAlmanac.tsx, CirclePreview.tsx:188-198, PersonalDestination.tsx:34, IdentityGate.tsx:325-327,344). Tracked as deferred in translation-status.md:54-57.
- Give the dead 'Circle settings' gear a handler or remove it. CircleModule.tsx:87-89 (parity class B keeps the live function: social-feature-parity.md:107).

<a id="xc"></a>
## XC — Cross-cutting (privacy · safety · i18n · a11y · mobile · performance · themes · terminology · states)
**Overall: PARTIAL** · master-table rows `XC-01` … `XC-33`

### WHAT THE PRODUCT NEEDS
- Visitors must never receive another person's birth date/time, exact age, day count, fraction, band calendar years or any birth-derived precision; relationship never raises precision. Refs: docs/handover/social-api-contract.md:66-82 (§C), :186-190 (§F), AGENTS.md 'Person + Life Identity'.
- Another person's only-me Moments are never delivered; a visitor profile feed is 'the same shape filtered to one author, onlyme excluded'. Ref: social-api-contract.md:115, :204.
- The friends-privacy backend contract must be confirmed and must not be assumed to unlock anything. Refs: view-model.ts:138-150; references/social-bible-audit/SOCIAL_BIBLE_PRIVACY_MATRIX.md P-1; docs/social-feature-parity.md:60 ('ship Public / Only me and surface the gap').
- 'View as public' must render through the same visitor-safe model a stranger gets, with no second privacy branch. Ref: AGENTS.md (Person + Life Identity paragraph; Social Freeze Delta blocker #1 row).
- Health and Problem records get no Respond, no Expression, no aggregate and no conversation. Ref: docs/handover/moment-conversation-model.md:103 (§7).
- Safety: Report and Hide on Moments, Report on a response. Person-level block/mute is 'UNKNOWN — OWNER / BACKEND CONTRACT REQUIRED … LAUNCH SAFETY ITEM P1'. Refs: docs/handover/my-world-product-completeness.md:34, :50; docs/social-feature-parity.md:88, :90; social-interaction-spec.md:78, :102.
- i18n: 8 locales key-complete, English byte-identical, native review pending. Recorded English carryovers are the exact-age primitive, the LifeCounter and the notification event text. Refs: docs/i18n/translation-status.md; AGENTS.md S1/S2/S3/S5-S6 carryovers.
- Devices: one-row bar with every utility down to 320, 44px primary actions on phones, one scroll owner per surface, safe-area insets, reduced motion complete. Ref: docs/handover/s7-device-responsive-contracts.md:24-35, :36-56.
- Performance: lazy/async feed images with aspect ratio set before decode; srcset belongs to the live build; Boom quick art warmed on idle; no persistent animation loops. Refs: s7-device-responsive-contracts.md:50-53; AGENTS.md R3.2 §54; celestial flags contract (flags.tsx:3-15).
- Themes: default dark (Deep Cosmos); theme is one stored preference and navigation never changes it (AGENTS.md 'SYSTEMBOOM is one product'). Owner direction now: LIGHT is clean premium light SYSTEMBOOM and must not automatically force large decorative Solar Observatory scenery.
- Terminology: user-facing words are MY WORLD / MOMENTS / LIFE; 'Social' is engineering vocabulary (destinations.ts:16-18). Respond writes; 'note' is retired from the UI (moment-conversation-model.md:23-29). Celestial words always appear as OBJECT + MEANING (references/celestial-resonance-bible/22-OWNER-DECISION-MASCOT-PRESERVED.md §1.3-1.4).
- Human Pulse counts people, never popularity. No per-expression counts in the feed. Ref: docs/handover/human-pulse-contract.md:67-72.

### WHAT EXISTS NOW
- Privacy boundary: view-model.ts:69 isOwner; :71-78 personViewFor (contact owner-only); :87-107 lifeViewFor; :110-113 momentLifeFor; :158-173 ringViewFor (non-owner density public-only, `connected` deliberately unused at :164-171); :176 FORBIDDEN_ON_OTHER. Dev probe at SocialPreview.tsx:580-588.
- Visibility scopes: Privacy = 'public'|'friends'|'onlyme' (data.ts:26). Labels: Public / Friends / Only me (en.ts:108-110). Composer hints: anyone / your people / just you (en.ts:182-184; Composer.tsx:318). Readout 'only you' (en.ts:85). Aria 'Friends only' (en.ts:87). A new Moment defaults to public (Composer.tsx:115). Health/Problem switch to onlyme (Composer.tsx:185-197).
- Feed filter: orderFeed drops hidden and other people's onlyme only (store.tsx:113-119). Search does the same (Chrome.tsx:251-253). Neither checks any relationship.
- PUBLIC_VIEWER stand-in (SocialPreview.tsx:45) feeds heroViewer (:516), profileLife (:519) and CircleModule (:704). MomentEntry uses useSocial().me (Moment.tsx:103, :112). LifeCursor gets viewer={me} (SocialPreview.tsx:717).
- Viewer modes: maya | asha | visitor (Bikash) | ashaVisitor | prakashVisitor (store.tsx:22, :120-128). Notifications, conversations and relationships all belong to Maya whatever the viewer mode (store.tsx:94; WorldProvider.tsx:118-127; model.ts:29-47).
- Safety: Moment Report shows a toast only (Moment.tsx:348). Hide is a session-local list (Moment.tsx:349; store.tsx:190-191). Copy link uses a fake domain (Moment.tsx:350). Delete Moment has a confirm step (Moment.tsx:333-343; store.tsx:145-146). Response Report is a toast only (Moment.tsx:686). Response delete has no confirm and removes its replies (Moment.tsx:683; store.tsx:196-197). Remove friend has no confirm (PersonCard.tsx:136). Nothing in src/ implements block, mute, report-person or moderation.
- i18n: 8 catalogs × 363 unique keys, 0 missing and 0 extra against en (src/lib/i18n/catalogs/*.ts). 44 of those keys are celestial.*.
- Dialogs: Composer uses the full useFocusTrap (Composer.tsx:161; identity/useFocusTrap.ts). PersonCard is role=dialog aria-modal with Escape and focus return but no trap (PersonCard.tsx:48-60, :82). MomentConversation is role=dialog aria-modal with Escape, no trap and no focus return (Moment.tsx:536-563, :396). TransientSurface is role=group, non-modal, with focus in/out (TransientSurface.tsx:23-57). Scrim: TransientSurface.tsx:60-71.
- Boom deck: radiogroup, Left/Right keys, Escape, focus return, sr-only live status (expressions.tsx:628-660, :715-725, :920, :963, :992). Celestial Field: radiogroup with roving tabindex, arrows, Home/End, Escape and an aria-live readout (CelestialField.tsx:200-215, :262-265, :392-397, :536). Constellation panel: role=group, Escape only while focus is inside (ResonateControl.tsx:300-312).
- Reduced motion: global rule (globals.css:412-418); MotionConfig reducedMotion='user' (SocialPreview.tsx:593); per-surface delay fixes (SocialPreview.tsx:177, :234); celestial reduce block (CelestialEnvironment.tsx:237-243).
- Celestial ships dark by default: every Celestial flag defaults to false (flags.tsx:30-39). It turns on only via ?celestial=1 or localStorage (flags.tsx:53-77). CelestialEnvironment renders nothing when the flag is off (CelestialEnvironment.tsx:36-38).
- Light theme: base light with the flag off is clean (#F5F5F6 page, #FDFDFD sheet, white bar; SocialPreview.tsx:65-71, Chrome.tsx:119). Light with the flag on paints the Solar Observatory scenery, uncommitted in the working tree (CelestialEnvironment.tsx:115-176).

### WHAT IS COMPLETE
- Life-data privacy boundary for every non-owner shape, including the owner's View-as-public Hero and Circle module: view-model.ts:69-113, :176; SocialPreview.tsx:45, :516-519, :704; CircleModule.tsx:77-80 (monthly count is owner-only).
- Notification and search identities carry no density, and search people rows show the band only for others (Chrome.tsx:375, :512, :540). Celestial who-lists resolve names through personViewFor and carry no life data (ResonateControl.tsx:327-338). Chat carries no life data (Messages.tsx:13-14).
- Other people's only-me Moments are withheld from feed and search (store.tsx:117; Chrome.tsx:253).
- Owner delete of a Moment asks for confirmation (Moment.tsx:333-343).
- Composer dialog: focus trap, Escape, focus return (Composer.tsx:161, :284-298).
- Boom deck and Celestial Field keyboard and radiogroup semantics (expressions.tsx:715-725; CelestialField.tsx:200-215).
- TransientSurface family: one surface and one scrim, focus in and return (TransientSurface.tsx:23-71; SocialPreview.tsx:410-418).
- S7 phone matrix 320-430: no horizontal overflow, every utility visible, one-row bar ≤64px; 44px Respond and both Accepts; keyboard-short heights; reduced motion (s7-device-mastery.js:35-200).
- Catalog key-completeness: 363 keys in all 8 locales.
- Honest empty states for responses (Moment.tsx:382, :482), notifications (Chrome.tsx:494), search (Chrome.tsx:341-346), People (People.tsx:221, :251) and the Messages panel (Messages.tsx:77-78).
- Media, cover and avatar load failures degrade in place (Media.tsx:15-27; ProfileHero.tsx:146; LifeRing.tsx:230).
- Dark = Deep Cosmos is the default theme (layout.tsx:31; use-theme.ts:18, :23).

### WHAT IS PARTIAL
- privacy:'friends' is enforced nowhere except the ring: feed (store.tsx:117) and search (Chrome.tsx:253) treat it as public, while density is public-only (view-model.ts:169). The prior audit measured all six friends fixtures rendered to visitor Bikash (SOCIAL_BIBLE_PRIVACY_MATRIX.md:236-256).
- Visitor-mode simulation is partial. Notifications (Chrome.tsx:89, :459), conversations (Messages.tsx:81) and relationships (WorldProvider.tsx:126-127; People.tsx:48, :171) stay Maya's whatever the viewer. In prakashVisitor, Prakash is offered Accept on the request he sent himself (SocialPreview.tsx:512; ProfileHero.tsx:117).
- Report Moment and Report Response are toast-only and claim 'someone will look' (Moment.tsx:348, :686; en.ts:96). No reason, no payload, no API shape (social-api-contract.md:105 has only capability flags).
- Hide Moment is session-only: no undo, no announcement, and focus is lost (Moment.tsx:349; store.tsx:190-191).
- Response delete has no confirm and cascades to replies (Moment.tsx:683; store.tsx:196-197). Remove friend has no confirm (PersonCard.tsx:136). A Moment author cannot remove other people's responses on their own Moment (Moment.tsx:680-687).
- Hard-coded English in Social, World and Identity (full list in answers §I18N). Chat is the largest block (Messages.tsx:128-204; ChatSurface.tsx:66-123).
- Notification day headers and coordinates are English-only: dayLabel returns 'Today'/'Yesterday' and formatDate uses English months (store.tsx:307-324), rendered at Chrome.tsx:501 and :554.
- PersonCard is aria-modal without a focus trap (PersonCard.tsx:48-60). Menus use role=menu with no arrow-key roving and hold non-menuitem children (Moment.tsx:416-442; Chrome.tsx:152-203). Composer listboxes have no arrow keys (Composer.tsx:312-318, :409-418).
- Live-region gaps: Composer failure (Composer.tsx:556-561), response failure (Moment.tsx:759-764), notification and PersonCard relationship outcomes (Chrome.tsx:529; PersonCard.tsx:110), Hide/Delete (Moment.tsx:339, :349).
- Phone secondary targets are below 44px: response ⋯ 28px (Moment.tsx:675), Reply 28px (:670), Moment ⋯ 36px (:312), constellation close 28px (ResonateControl.tsx:320), constellation Show more ~20px (:378).
- Images: single-size JPEGs up to 1.28MB, no srcset (Media.tsx:26). The owner avatar is 1920×2879 / 836KB (demo-user.ts:16) and renders at 20-168px with no lazy loading or async decode (LifeRing.tsx:230).
- LifeCounter ticks every second (LifeCounter.tsx:69-73) even below @5xl, where its section is only CSS-hidden (SocialPreview.tsx:695-698).
- LifeCursor queries every Moment's rect on each scroll frame (LifeCursor.tsx:41-66). TopBar writes --sb-bar-h on every scroll event (Chrome.tsx:98-110).
- No dedicated 'no Moments' state; an empty feed shows only the end-of-feed sentence (SocialPreview.tsx:737-758; en.ts:81).
- Moment save and response send failures exist but can only be reached through the harness flag (store.tsx:45, :215-216; SocialPreview.tsx:488, :602; Composer.tsx:205-207; Moment.tsx:712-714).
- Terminology residue: orphan keys moments.writeNote and moments.notesN (en.ts:73, :75); 'note' still appears in notification fixtures (data.ts:749, :752); 'Add friend' vs 'Add Friend' (en.ts:57 vs :288); the band label has four forms (en.ts:27, :28, :32; LifeCursor.tsx:77).

### WHAT IS MISSING
- Block person, mute person, report person and report chat message: no code anywhere in src/ (grep). my-world-product-completeness.md:34 names this LAUNCH SAFETY P1.
- Owner/author moderation of responses on one's own Moment; any content-removal or moderation data contract beyond the canRespond/canHide/canReport flags (social-api-contract.md:105, :158).
- Failure states for committing a Resonance (ResonateControl.tsx:60-66) or an Expression, and for friend actions (WorldProvider.tsx:47-57, synchronous and no pending state).
- Chat deep link to an unknown person: /chat?c=<unknown> silently shows the list (ChatSurface.tsx:47-53).
- Notification target no longer available (deleted or hidden Moment): focusMoment returns silently after the panel has closed (focus-moment.ts:14-15; Chrome.tsx:471-477).
- Offline and load-more failure states; delete and privacy-change failure states.
- Profile visibility setting ('Who can see your profile' is a dead button: ProfileHero.tsx:320, :340).
- Tagging and mention consent: the Composer 'with' datalist lists every fixture person (Composer.tsx:667-679).
- srcset/sizes and thumbnail variants (recorded live-build carryover, s7-device-responsive-contracts.md:50-53).

### WHAT IS BROKEN
- View as public does not reach the feed. Moments and the Life Cursor still render through `me` (Moment.tsx:103, :112, :194-195; LifeCursor.tsx:76-77; SocialPreview.tsx:717, :743). While 'Viewing as public', the owner sees their own exact age on each Moment and still sees their only-me Health/Problem Moments. The test compares only the Hero, and its day-count string '12,731' is stale against the live clock (person-life-identity.js:320-343).
- MomentConversation (phone deep-thread surface) never returns focus on close; focus drops to body (Moment.tsx:396, :546-552).
- Popover menus never return focus to their trigger; after Escape or a choice, focus is lost (Moment.tsx:416-442). This affects the Moment ⋯, response ⋯, account and with-people menus.
- Hide and Delete remove the element that holds focus without moving focus anywhere (Moment.tsx:339, :349).
- Copy link announces 'Link copied.' even when clipboard.writeText rejects or does not exist (Moment.tsx:350).

### WHAT IS DISCONNECTED
- Celestial Resonance is off on the product route by default. Every Celestial flag defaults to false (flags.tsx:30-39), so on /world the Resonate control, constellation and sky render only with ?celestial=1 or localStorage.
- ChatMessage.failed (model.ts:57-59) and error.sendFailed / error.mediaUnavailable (en.ts:169-170) exist, but no code sets or renders them (Messages.tsx:119-139).
- celestial.notification.resonated (en.ts:359) is unused. The resonance notification renders the English fixture 'resonated with your moment' instead (store.tsx:229-230; Chrome.tsx:542).
- moments.peopleInMoment (en.ts:83) exists, but Moment.tsx:254 hard-codes the same string. chat.you, chat.noMessagesYet and chat.unreadN exist, but ChatSurface.tsx:88 and :92 hard-code them.
- Orphan catalog keys, ×8 locales: celestial.chat.who, celestial.field.remove, celestial.summary.youAndN, celestial.system, composer.whereWasThis, error.mediaUnavailable, error.sendFailed, expr.summaryN, expr.whoTitle, lang.choose, moments.notesN, moments.writeNote (plus the two above).
- Video play button does nothing: poster only, no <video> element (Media.tsx:78-92).
- Dead controls: Change your photo (ProfileHero.tsx:196), Change cover (:316, :336), Who can see your profile (:320, :340), Circle settings (CircleModule.tsx:87), and the account items Statistics, Weather, Exchange and Settings marked 'later' (Chrome.tsx:167-177). View in Life is disabled (Moment.tsx:307-310, :344, :351), which is documented.
- The notifications 'celestial' fixture mode exists in the reducer (store.tsx:224-233), but SocialPreview.tsx:486-487 parses only many|empty.

### WHAT CONFLICTS WITH ANOTHER CONTRACT
- docs/handover/social-api-contract.md:204 says a visitor feed is 'filtered to one author, onlyme excluded'. The code shows every author's Moments on the visited person's World (SocialPreview.tsx:738; store.tsx:274, :283).
- AGENTS.md says View as public renders 'through this exact same visitor-safe model'. The code applies PUBLIC_VIEWER only to the Hero, Circle module and counter; the feed and Life Cursor still use `me` (SocialPreview.tsx:516-519 vs :717, :743).
- C-14 / P-1 (still open): the ring withholds friends-privacy density (view-model.ts:164-171), while feed and search expose friends Moments to anyone (store.tsx:117; Chrome.tsx:253).
- C-15 (still open): moment-conversation-model.md:103 says Health/Problem have 'no conversation'. The responses count, preview and Notes are not gated by `quiet` (Moment.tsx:371-395).
- my-world-product-completeness.md:34 calls Moment-level Report/Hide 'READY … done'. In code, Report is a toast with no payload (Moment.tsx:348, :686) and no report API shape exists (social-api-contract.md:105).
- docs/i18n/translation-status.md:17-24 (and AGENTS.md R3.3 'catalogs 319 keys × 8') say 319 strings. The code has 363 keys × 8 after 44 celestial.* keys; the doc has no Celestial review flags.
- human-pulse-contract.md:69 says 'No per-expression counts in the feed'. The Celestial constellation strip shows a count per meaning in the collapsed feed once more than one person resonates (ResonateControl.tsx:286-290), and celestial-s7-constellation.js:112-113 asserts it. The Boom pulse and the Celestial strip each print '{n} people' on the same presence line (Moment.tsx:371-373; en.ts:318 vs :356; evidence prototype-evidence/celestial-light-correction/after/light-390-closed.png shows '2 people' next to '16 people').
- C-2 (still open): social-api-contract.md:103 and :158 still specify `respond { count, byViewer }`. In code Respond writes and dispatches nothing (Moment.tsx:293-302), and the `respond` reducer case has no dispatcher (store.tsx:149-160).
- PersonIdentity.tsx:18-21 and :49 say `connected` unlocks friend/family density. view-model.ts:164-171 says it changes nothing until the contract is verified. The code comment is stale.
- CelestialEnvironment.tsx:99-100 rejects backdrop-filter 'over a moving sky' because it re-blurs every scroll frame. The same file then applies backdrop-filter blur(18px) to the sticky light top bar (:159, :165).
- Chrome.tsx:94-97 says --sb-bar-h is 'never per frame'. A passive scroll listener rewrites it on every scroll event (:105).
- Owner direction (light = clean premium light, no forced Solar Observatory scenery) vs CelestialEnvironment.tsx:135-149. Whenever the flag is on and the theme is light, the page is automatically covered with environment-solar.svg plus the left and right frame 'rib' SVGs (portrait scene ≤700px), visible in prototype-evidence/phase-4.3-social-audit/02-light-desktop-owner-top.png.
- Two light material languages: the uncommitted Celestial correction is cool pearl (CelestialEnvironment.tsx:116-176), while the Boom horizon, dock, deck and library remain warm beige 'Solar Observatory' paper (SocialPreview.tsx:168, :207, :216, :226, :311).

### WHAT REQUIRES OWNER DECISION
- privacy:'friends' contract. Options: (a) enforce server-side for feed + search + density together (connected = friend|family); (b) ship Public / Only me until the backend is verified (social-feature-parity.md:60); (c) keep the current asymmetry (not recommended).
- What does a visitor see on another person's World? Options: (a) only that person's Moments, as social-api-contract.md:204 says; (b) the mixed chronological stream as now. This also decides how 'View as public' filters the feed.
- Person-level safety for launch. Options: (a) build Block + Mute + Report person (and Report chat message) as a P1 launch item; (b) confirm the live backend already provides them and map to that; (c) defer with a documented risk.
- Health/Problem conversation. Options: (a) no responses on these records: gate the presence line and Notes on `quiet`; (b) responses are allowed: correct moment-conversation-model.md §7.
- Report semantics. Options: (a) Report sends target type + reason and also hides the item for the reporter; (b) Report sends target only; (c) keep toast-only until a safety API exists. Separately, should the toast keep claiming 'someone will look'?
- Light theme direction and naming. Options: (a) light is clean premium SYSTEMBOOM light and Solar Observatory scenery becomes opt-in (e.g. a World Wall/atmosphere choice) or is removed; (b) keep the scenery automatic when Celestial is on. And: keep the user-facing name 'Solar Observatory' (en.ts:147, ThemeToggle.tsx:25) or rename it (e.g. 'Light').
- Presence line with two systems. Options: (a) Celestial follows Boom's rule: total only in the feed, per-meaning counts one step deeper; (b) keep per-meaning counts and document the divergence; (c) merge both into one presence sentence so '{n} people' does not appear twice.
- Default privacy of a new Moment. Options: Public (current, Composer.tsx:115), Friends, or last-used.
- Response moderation. Options: (a) a Moment's author may remove other people's responses on it; (b) not allowed. Plus: should deleting your own response (and its replies) ask for confirmation, as Moment delete does?

### WHAT CAN BE FIXED WITHOUT OWNER DECISION
- Moment.tsx:254 → t('moments.peopleInMoment'). Moment.tsx:675 → t('moments.more').
- ChatSurface.tsx:68, :88, :92 → the existing chat.noConversations, chat.you, chat.noMessagesYet and chat.unreadN keys. Add chat.* keys for Messages.tsx:128, :129, :152, :153, :157, :187, :198, :201, :204 and ChatSurface.tsx:66, :67, :103, :107, :122, :123. Localize the Brand 'Chat' label (Brand.tsx:18, :29; destinations.ts:44).
- Localize PersonIdentity.tsx:65 (life.circleBand), LifeCursor.tsx:77 (life.band), Moment.tsx:195, :197, :281, :644, :648, SocialPreview.tsx:693, :716, Chrome.tsx:304, CircleModule.tsx:87, ProfileHero.tsx:121, Media.tsx:71, LifeRing.tsx:185, ThemeToggle.tsx:15, :25. English values stay byte-identical.
- store.tsx:316-324 dayLabel and Chrome.tsx:554 formatDate → locale-aware (common.today + a new 'yesterday' key; sbDate(locale, …)). English output stays identical.
- Render the resonance notification through t('celestial.notification.resonated') (Chrome.tsx:542 when n.kind==='resonance'), or delete the orphan key. Remove the other confirmed orphan keys (moments.writeNote, moments.notesN, expr.summaryN, expr.whoTitle, …) from all 8 catalogs.
- Popover (Moment.tsx:416-442): return focus to the trigger on close and add arrow/Home/End roving for role=menu.
- MomentConversation (Moment.tsx:536-552) and PersonCard (PersonCard.tsx:48-60): reuse identity/useFocusTrap.ts for trap + Escape + return; return focus to the Respond or responses control when the conversation closes (Moment.tsx:396).
- After Hide or Delete (Moment.tsx:339, :349), move focus to the next Moment's readout and announce it in the existing role=status toast.
- Announce Composer and response failures: role='alert' or role='status' on Composer.tsx:556-561 and Moment.tsx:759-764.
- Copy link (Moment.tsx:350): show 'Link copied.' only after writeText resolves; show an honest fallback otherwise.
- Constellation panel (ResonateControl.tsx:300-312): move focus into the panel on open, or listen for Escape at window level while it is open.
- View as public (SocialPreview.tsx:717, :743; Moment.tsx:103, :112): while selfPreview, render Moment readouts and the Life Cursor through PUBLIC_VIEWER and drop the owner's onlyme Moments, matching the documented intent. Whether to also filter to one author depends on the owner decision on visitor feed composition. Add an exact-age regex scan and replace the stale '12,731' in person-life-identity.js:343.
- Correct stale docs and comments: docs/i18n/translation-status.md:17-24 (363 keys; add Celestial review flags); PersonIdentity.tsx:18-21, :49; Chrome.tsx:94-97.
- Stop the invisible LifeCounter tick below @5xl: render it conditionally or pause the interval when hidden (SocialPreview.tsx:695-698 / LifeCounter.tsx:69-73). Verify the social-final.js counter selectors first.
- Add loading='lazy' decoding='async' to identity photos (LifeRing.tsx:230) and a small avatar variant for demo-user.ts:16. This is a prototype asset change, not a data change.
