# Social 2030 — future seams (documented, not implemented)

Social 2030 category-definition pass · 2026-09-12. Four future directions the
owner named explicitly as **document only** — none of these exist in the
prototype, none are stubbed, none are hinted at in the UI. They are recorded
here so a later, real pass has a starting point instead of rediscovering the
question.

## A. Moment provenance

A future ability to distinguish a Moment's origin — authentic (a person's own
photo/text), imported (from another service), or AI-assisted (a caption or
edit a model helped produce) — **without changing today's UI**. Today every
Moment is presented identically regardless of origin, and `Moment` (`data.ts`)
carries no provenance field. A live implementation would need:

- A `provenance` field on the Moment record (`authentic | imported |
  ai-assisted`, or similar), sourced from the real upload/authoring pipeline —
  never inferred client-side, never guessed.
- A quiet, factual marker if and when the product decides to surface it (this
  pass explicitly does not design that marker) — consistent with the existing
  rule that the interface never fabricates a detection state (`README-for-
  developer.md` #11: "no 'detected' state; never guess, never pretend").

## B. Cosmos Knowledge

A future education/research layer belongs to **Cosmos**, not My World. My
World is a person's life — their Moments, People, Life position. Cosmos is
the universal, explorable space outside any one person's life. Mixing a
knowledge/research surface into My World would blur that boundary the whole
architecture depends on (`systemboom-application-architecture.md`). Nothing
about this pass changes Cosmos; the seam is simply named so a future Cosmos
phase knows where such a feature would live, and where it must never leak.

## C. AI research (cited, not blended)

If SYSTEMBOOM ever surfaces AI-produced or AI-cited research content, it must
carry visible source provenance and must never blend unsupported generated
text with a person's actual Moments, memories, or life record. A Moment is a
human record of something that happened; AI-assisted research output is a
different category of content and must never be presented with the same
grammar (ring, band, "what happened") that a Moment uses — that grammar means
*a person's own recorded life*, and diluting it would undermine the one thing
the Life Ring is for. This pass adds no AI feature, no AI button, and no
generative content of any kind (§10 of the brief).

## D. Life retrieval

A future capability to ask something like *"show my university years"* or
*"photos with Maya in 2031"* and have SYSTEMBOOM answer from the existing
model — Life (bands/years), People (relationships), Place (Moment.place) —
without inventing a new data shape. The pieces already exist:

- Life position: `lifeViewFor` / the Circle's band-and-year math.
- People: the relationship model (`friend · family · request-in ·
  request-out · none`) and the person surface.
- Place: `Moment.place`, already searchable today.

A retrieval feature would be a **query** over this existing model (viewer-safe
throughout — a query about someone else's life still resolves through the
same privacy view model, band-only where that's already the rule), not a new
architecture. Not designed, not scoped, not built in this pass.

## What these four are not

None of the above are stubbed in code, mentioned in navigation, hinted at with
disabled UI, or referenced by a "coming soon" affordance anywhere in the
product. They exist only in this document.
