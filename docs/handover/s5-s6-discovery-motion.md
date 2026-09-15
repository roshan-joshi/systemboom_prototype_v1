# SYSTEMBOOM — S5 + S6 Discovery, Signal and Motion (handover)

Accepted 2026-09-14. This document describes the accepted, tested behaviour; the tests
(`prototype-tests/s5-discovery.js`, `prototype-tests/s6-motion.js`) and the evidence
(`prototype-evidence/s5-s6-discovery-motion/`) are authoritative if the two disagree.

S5/S6 connect the systems that already exist — PERSON, LIFE, MOMENTS, PEOPLE,
RELATIONSHIPS — through discovery (Search), signal (Notifications), movement (one motion
language) and state change. **No new features:** no recommendations, trending, suggested
people, followers, stories, reaction pickers, gamification. The Moment, relationship,
profile, i18n and route models are unchanged.

## 1. The transient-surface system (S6 §55–§58, §84)

Search results, People, Notifications and Messages are ONE kind of thing: a surface
**brought forward from My World**, hung from the top bar where it was invoked.

| | Desktop (`@2xl`+, container ≥ 672px) | Phone |
|---|---|---|
| Position | anchored under the bar at the trailing edge (People/Notifications/Messages) or under the field (Search) | a local sheet under the bar, full width, capped to the space under the bar (`--sb-bar-h`) and scrolling inside itself |
| Ground | the same quiet scrim (`Scrim`, `--surface-scrim`: light `rgba(20,28,42,.14)`, dark `rgba(4,6,10,.42)`, no blur), **below the bar** (z-20 < bar z-30) so the utility controls stay live | same |
| Motion | `sb-surface-in` — opacity + 6px travel + 0.985 scale, `--m2` (220ms), `--ease-out`, once | same |
| Leave | Escape (bubble-phase — a layer above that owns Escape in capture closes first), the scrim, the same control | Escape / Back / scrim / control |
| Focus | enters the surface container (not its first field — a phone must not pop the keyboard for a list); Tab reaches the first control; **returns to the opening control** on close unless a layer above (Person surface) already holds it | same; Search's phone sheet focuses its own field (keyboard opens at once) |
| Exclusivity | exactly one open (Search included) — `SocialPreview` owns this | same |

Implementation: `src/components/world/TransientSurface.tsx` (`TransientSurface`, `Scrim`);
`TopBar` gains `search` / `onSearch` / `surface` props and publishes `--sb-bar-h`
(ResizeObserver) on `[data-sb-topbar]`. The Person surface (`PersonCard`) uses the same
`sb-surface-in` keyframe on its card and a `sb-scrim-in` scrim.

## 2. Search (S5 §19–§33)

Search finds three different objects and shows them differently:

- **Person** — real photo + Life Ring (28px), name, then the safe life position and the
  relationship chip (`[data-sb-search-life]`, accepted contract unchanged). Selecting opens
  the Person surface; focus returns to the **search field**, whose focus re-opens the same
  results with the same query (return context).
- **Moment** — the words lead, then the person's ring (22px), and `name · date · place`
  (`sbDate`, en byte-identical). Selecting **reveals** the Moment if it is beyond the loaded
  window (`store` action `reveal`), scrolls to it, focuses its readout, and lets it settle once
  (`data-sb-focused` → `sb-target-settle`). `focusMoment()` in
  `src/components/world/focus-moment.ts`.
- **Photos** — media-led Moments: image + its date (accepted date-only text). Same landing.
- **Place** — the place leads (pin glyph, no map UI), the recorded-life tally under it.
  Selecting narrows the search to that place — the only geographic truth the model has.

Zero state: one line naming what can be found + Recent (the person's own recent searches).
No results: the honest sentence + one next step (Clear). Phone: a local sheet with Back ·
field · Clear; the field auto-focuses. Group order: People · Moments · Photos · Places.

## 3. Notifications (S5 §34–§44)

- Request: person (32px photo + ring) leads, Accept / Decline beside, resolves **in place**
  to "Now friends" / "Declined" with the one `sb-rel-resolve` settle; the list never jumps.
- Moment event: person, what changed, `date · place` of the Moment, and the Moment's own
  image where it has one. Selecting marks it read, closes the surface and lands on that Moment.
- Read state: a 2px mark and 80% opacity, never a bright row; no pulse anywhere.
- Empty: "Nothing new…" and nothing else.

## 4. Carryover visual corrections (S5/S6 Part A)

**Composer** (`Composer.tsx`, machine unchanged, every `data-sb-*`/aria contract intact):
REMEMBER → PLACE IT IN LIFE → CONTEXT IF NEEDED. Header carries author + privacy with the
title (one horizontal layer fewer). The words come first (17/18px, focused); the coordinate
is one sentence — `today · 13 SEP 2026 · 34y 10m 09d · ⌖ where was this?` — whose date
(`DateField quiet`) and place ARE the instruments (the native picker is the disclosure);
the detected-from-photo state uses the same sentence with Confirm / Change. Kinds are a quiet
row of glyph+word chips (media a shade stronger), fields and media reveal as one group
(`sb-reveal`). Focus on the words is the notebook rule under them turning focus-blue.

**People** (`People.tsx`, behaviour/data/state unchanged): face + Life Ring lead (40px;
48px for a person asking to connect, with their town); name and life beside; the action is
the quiet continuation — red **Add friend** only for a stranger, Accept/Decline for a request
(under the person on a phone), a glyph+word **Message** for your people. Find someone is an
underline; rows are separated by rhythm and the quietest rule (`--divider`).

## 5. Motion families (S6 §50–§73)

| Family | Where | Token |
|---|---|---|
| SCALE / PLACE | transient surfaces, Person surface, Composer sheet (position + elevation, 260ms) | `sb-surface-in`, motion `y:22 → 0` |
| RELATIONSHIP | Add friend → Requested, Accept → Friend, notification outcome, Person actions | `sb-rel-resolve` 200–220ms, keyed on the relationship state |
| CONTENT | kind fields / media reveal, Moment landing (accepted `sb-land`), target settle | `sb-reveal` 180ms, `sb-target-settle` 900ms background only |
| FEEDBACK | press depth (`.sb-press` 140ms), Respond 160ms, unread marks (none) | `--m1` |

Public preview: the Person World re-settles in place (200ms opacity, Web Animations API — no
engine, no travel), `data-sb-perspective="own|public"` on the wrapper; for the 700ms of the flip
the wrapper also carries `data-sb-perspective-switching`, which collapses the Hero's own entry
resolve so the same person does not "arrive" a second time (one primary event, §52). Escape in
the search field leaves Search (close + blur) and never wipes the words first (`preventDefault`
on the native `type=search` clear). Focus-return from the Person surface to the search field
does not re-open the results; one click on the field does. Life Ring: never
animates outside the Hero's one entry event. Reduced motion: the global rule collapses every
keyframe to its final state; nothing essential disappears. No new dependency, no loop.

## 6. Localisation

New keys (all 8 locales, en byte-identical): `search.zeroHint`, `search.clear`, `search.back`,
`search.momentWord`, `search.openMomentAria`, `notif.unread`, `person.addFriend`,
`person.dialogAria`, `chat.you`, `chat.noMessagesYet`, `chat.unreadN`, `chat.messagesUnreadAria`,
`composer.contextAria`. The Person surface (`PersonCard`) and the Messages utility now route
through the catalog. Chat conversation internals (MiniChat, full Chat) stay as accepted.

## 7. Native clients (documented, not built)

Haptics belong to native mobile clients: a light tap on Accept, on Respond and when a
Moment lands. This web prototype does not simulate them and plays no sound.
