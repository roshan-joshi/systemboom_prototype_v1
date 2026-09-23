# SYSTEMBOOM — Human Pulse (R3.3)

How SYSTEMBOOM represents many people expressing feeling around one Moment without
repeating the mascot into visual noise. Accepted 2026-09-16. The tests
(`prototype-tests/social-r3-3-human-pulse.js`, 92 checks) and the evidence
(`prototype-evidence/social-r3-3-human-pulse/`) are authoritative where prose and
behaviour disagree.

## 1. Two expression primitives

| primitive | job | where |
|---|---|---|
| **LIVING MASCOT** | choosing a feeling | Quick Deck, More library, intentional selection, large preview |
| **BOOM LENS** | summarising human feeling | the selected compact control, the Moment's Human Pulse, the Expression Spectrum, who-expressed lists |

1 person = one mascot moment (the deck). 100 people = **never** 100 mascots.

## 2. The Boom Lens

A tiny precision optical object — not a reaction chip. Structure, outside-in:

- **physical rim** — real shading (inset bevel + hairline), per theme. No frosted glass, no
  backdrop blur, no glow — asserted (`backdrop-filter: none`, no blur/drop-shadow filters).
- **lens surface** — a dedicated **optical half-face crop** of the mascot (brow · eye ·
  mouth edge · fuse cue). Never the whole bomb shrunk to 24px.
- **one semantic mark**, seated **in** the rim as a small chip (Care heart · Joy radiant
  point · Laugh double arc · Wow radial · Celebrate spark cluster · Support embracing arc;
  extended expressions reuse their registry mark). Supports the emotion; never a floating
  sticker (`data-sb-lens-mark`, ≤1 per lens).
- **ownership** — the scarce Boom-red rim segment (`data-sb-own-mark`). The lens is never
  recoloured.

### Optical tiers (§4 — dedicated crops, not one scaled image)

| tier | crop window (fractions of the mascot's alpha box) | display | asset |
|---|---|---|---|
| `xs` | x 0.04–0.56 · y 0.44–0.83 (tightest: brow + eye + grin corner) | 22px, the Human Pulse | `neutral-lens-xs.webp` · 1.5KB |
| `sm` | x 0.02–0.62 · y 0.40–0.87 (adds the mouth edge) | 26–30px, selected control + who-lists | `neutral-lens-sm.webp` · 3.3KB |
| `md` | x 0.00–0.68 · y 0.32–0.91 (adds the collar fuse cue) | 40px, the Expression Spectrum | `neutral-lens-md.webp` · 5.3KB |

Built by `prototype-tests/_build-expression-assets.js`. Per-expression lens renders drop in
as `{id}-lens-{tier}.webp` + the id in `RENDERED` — no redesign (§24: the same-grin neutral
render is NOT final art; the Quick-Six facial blocker from R3.2 stands).

### Colour families (§6)

Four family hues carry all eighteen expressions as shades — never 18 unrelated colours,
never spread into Social chrome, with Boom red reserved for ownership:

| family | expressions | hue |
|---|---|---|
| WARMTH | Care · Love · Touched · Thanks · Nostalgia | rose |
| ENERGY | Joy · Laugh · Celebrate · Proud | amber |
| WONDER | Wow · Curious · Inspired · Thinking · Speechless | blue |
| CONNECTION | Support · With you · Respect · Agree | teal-green |

`ExpressionDef.family` is data (`data-sb-lens-family`); `group` still orders the library.

## 3. Human Pulse (the feed aggregate)

`[lens][lens][lens] 100 people` — up to THREE Boom Lenses + the total in **human language**
(`expr.peopleN`, locale-formatted number; full numerals, no invented "1K" — the locale
architecture has no truthful compact form, per §40).

- **Representatives (§9–§10):** the viewer's expression first (if present), then the most
  represented distinct types, ties broken canonically. All equal size; ordering is
  informational only — no winner, no size-by-count, ever (asserted 1 vs 100).
- **One type (§8):** 100 × Care = ONE Care lens + "100 people".
- **No per-expression counts in the feed (§12).** Counts live one deliberate step deeper.
- **Same physical height at every scale (§32):** 36px from 1 person to 1,000+ and to 18
  distinct types.
- **Static (§14, §25):** nothing pulses, breathes or reacts to viewport/count. A commit
  animates ONLY the viewer's own control (§26); the pulse total updates as plain state —
  no slot-machine numbers (§27). Remove decreases truthfully (§30).
- Label (§38): "{n} people expressed feelings on this Moment — Care, Joy, …".
- Hooks: `data-sb-human-pulse`, `data-sb-expression-summary={people}` (kept from R2/R3 —
  people = expressions, one per person).

## 4. Expression Spectrum (§16–§18)

Tap the pulse → a local panel: every type actually present, each with a same-size MD lens,
its localized name and its truthful count. **Canonical order** (quick six, then extended in
library order), zeros omitted, never reordered by popularity — asserted with wow(10) sitting
before support(15). No bars, no percentages, no ranking graphic. One 200ms expansion out of
the cluster (`sb-spectrum-in`), one-shot, direct under reduced motion.

## 5. People who expressed this (§19–§20)

Selecting a type opens ITS people: real photo + viewer-safe Life Ring at **40px** (a human
surface, not a 24px table), name, and that person's lens. IDENTITY-ONLY — no band, no exact
age, no ranking (the Social-2030 dense-list invariant, unchanged). Long lists arrive in calm
batches (24, then "Show more people"). Escape steps who → spectrum → closed, focus returned.

## 6. Micro-variants (§21–§23)

Three presentation leans (−2.5° · 0 · +2.5°) chosen deterministically from
`hash(personId · momentId · expressionId)` — the same person never changes between opens
(asserted), the emotional face never varies, and no extra assets exist. When per-expression
renders land, the same 3-slot mechanism can select alternate fuse-curve renders.

## 7. Performance (§41–§42)

The feed renders ONLY the small optical tiers: a 50-Moment feed with 1,000-person pulses
puts `neutral-lens-xs.webp` (1.5KB) + the controls' `neutral-sm.webp` on screen. The single
`neutral-md.webp` on the wire is R3.2 §54's documented idle warm of the deck art; LG never
loads. A 1,000-person pulse under 6× CPU throttling opens its Spectrum immediately.

## 8. Scale fixtures (harness only)

`?pulse=1|2|5|20|100same|90-10|100mixed|1000mixed|18mix` (+ optional `?pulseMoment=`) on the
style-lab route seeds a Moment's expression map (reducer action `pulse-sim`; never on the
product route). Synthetic people live behind `sim-` ids and resolve deterministically to
fictional identities (`synthPerson` in `data.ts`). `100mixed`/`1000mixed` include the viewer
(Giulia, `u-demo-001` → Support) so viewer-first ordering is demonstrable.

## 9. Live port seams (no backend invented)

- `GET /moments/{id}/expressions` → `{ total, viewer?: type, counts: { [type]: n } }` — the
  server aggregates; the client never needs the full map to render Human Pulse.
- `GET /moments/{id}/expressions/{type}/people?cursor=` → paged who-list (the prototype's
  24-batch is the client contract for it).
- Mature systems group by type, aggregate counts and reveal senders on demand (§43); the
  REPRESENTATION here — Boom Lens, Human Pulse, Spectrum, identity + Life Ring — is
  SYSTEMBOOM's own.
- Visibility: expressions inherit the Moment's audience (unchanged from R2); Health and
  Problem carry no pulse and no control.
