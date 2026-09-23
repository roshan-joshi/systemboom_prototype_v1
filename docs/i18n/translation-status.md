# SYSTEMBOOM — translation status

Honest QA state of every locale. **We do not claim native review.** Every non-English
catalog is a **machine/assisted draft awaiting a native reviewer.** The live team must
run native review before any locale is presented to users as complete.

## QA levels

- `draft` — assembled by the build; not yet reviewed by a native speaker.
- `reviewed` — a native speaker has read every string in context.
- `approved` — reviewed **and** signed off for production.

## Current state (Social R3)

| locale | native name | strings | plural forms | QA status |
|--------|-------------|---------|--------------|-----------|
| en | English | 384 | one \| other | **reference** (canonical source; byte-identical to product strings) |
| es | Español | 384 | one \| other | draft |
| it | Italiano | 384 | one \| other | draft |
| nl | Nederlands | 384 | one \| other | draft |
| ru | Русский | 384 | one \| few \| many | draft |
| hi | हिन्दी | 384 | one \| other | draft |
| ne | नेपाली | 384 | one \| other | draft |
| zh-Hans | 简体中文 | 384 | other | draft |

All eight catalogs are **key-complete**: every catalog has exactly the same key set as
English (0 missing, 0 extra), verified by the completeness check. Completeness is not
the same as review — see above.

## Coverage of wired surfaces (Phase S1)

S1 wired the high-visibility authenticated My World surfaces and the two language
controls. Localized in all 8 locales:

- **Chrome / top bar** — search (placeholder, group titles, empty state, place tallies),
  notifications (title, unread count, mark-all-read, empty, request outcomes,
  accept/decline), the Account menu (all items, appearance state names, logout,
  the embedded Language control), relationship chips.
- **People** — the whole People panel (find, requests in/out, your people, empty states,
  every relationship action) and the People button.
- **ProfileHero** — world-context kicker, relationship word, all owner/visitor actions,
  the compact Life entry (band · days · Life →), Manage-profile disclosure.
- **Moment** — date rules (today / localized date), kind words, Respond, response and
  note counts (locale plurals), with-N people.
- **SocialPreview** — composer prompt, "My life in", visitor counter message,
  pagination ("{n} earlier · Load more"), end-of-feed.
- **Cosmos root** — the pre-login Language control and "Enter my world".
- **Region suggestion** — the quiet Keep/Switch strip.

## Deliberately NOT translated (by design, not omission)

- **User-generated content**: Moment text, responses, notes, chat messages, a person's
  name, a place name. Never auto-translated; never sent to a translation service.
- **Deep long-tail chrome** not yet wired (some Composer internals, full Chat surface
  micro-copy, Circle/Life deep labels) — the foundation supports these; they are wired
  as later phases (S2–S9) reopen those surfaces. English renders correctly everywhere
  as the guaranteed fallback.

## For the native reviewer

1. Read each locale's catalog in context (run the app with `?lang=<code>`), not as a
   flat list.
2. Confirm every **glossary** concept uses the one authoritative wording consistently
   (`docs/i18n/systemboom-glossary.md`).
3. Confirm plural forms read naturally for real counts — especially **Russian**
   (1 / 2 / 5) and that Chinese has no accidental plural artifacts.
4. Confirm no sentence was assembled from fragments and no string was truncated in a
   critical action.
5. Promote the locale's row here to `reviewed`, then `approved`, when done.

## R3 review flags (2026-09-15)

The twelve `expr.*` semantic names are **draft** in all seven non-English locales. Four
carry emotional nuance a native reviewer must confirm in context before any locale is
presented as complete: `expr.touched`, `expr.withYou`, `expr.support`, `expr.respect`.
The R3 conversation vocabulary (`conv.*`, `moments.writeResponse`) is likewise draft.

## R3.1 review flags (2026-09-15)

The registry grew twelve → eighteen. Six new `expr.*` names are **draft pending native
review** in all seven non-English locales: `expr.love`, `expr.proud`, `expr.agree`,
`expr.thinking`, `expr.nostalgia`, `expr.speechless`.

`expr.care` was corrected in **nl** (`Liefde` → `Warmte`) and **ne** (`माया` → `स्नेह`)
because the new `expr.love` took the word they had been using — R3.1 §12 requires Care and
Love to stay distinct in every locale, not only in English. A native reviewer should confirm
both choices read as warmth-offered rather than caretaking.

`expr.nostalgia` carries the most cultural weight of the six (it must read as fond
remembering, never as regret) and needs review in every locale before any is called complete.
English is unchanged and byte-identical throughout.

## R3.3 review flags (2026-09-16)

Human Pulse speaks PEOPLE, not reactions. Six new keys ×8 (`expr.peopleN`, `expr.pulseAria`,
`expr.spectrumTitle`, `expr.whoFor`, `expr.back`, `expr.showMorePeople`) are **draft pending
native review**. The plural forms matter most in **ru** (one|few|many across человек forms)
and the counter words in **ne** ("जना") and **zh-Hans** ("人") — a native reviewer should
confirm they read as warm presence, not census language. English is unchanged and
byte-identical elsewhere.
