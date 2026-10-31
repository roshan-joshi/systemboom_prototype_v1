# P2-A — Experience Knowledge Graph

Goal: let the classifier use reviewed, versioned world knowledge **without** 10,000 brittle conditionals, and without ever overriding a human decision.

## 1. What exists today (VERIFIED-CODE)

* `src/lib/ai/knowledge/ai-knowledge-base.ts` (53 lines): **22 static typed rules** — evidence patterns → category + a safe generic fallback value (Construction Project, Laptop Screen Damage, Meeting Notes, Lab report → `test`, …).
* `knowledge-engine.ts` (76 lines): validated observation → evidence labels (+ the person's words) → rule match → category compatibility (conflict ⇒ `categoryHint`, never an override) → fallbacks only into empty fields.
* `classify.ts`: KB rule *boosts* over vision labels, capped by `KB_LIFT_CEILING`; subject rules (`subjectSupport`) in code.
* Text patterns are **English only** (documented limit).
* These are deterministic, in-code, unversioned as a release, with no provenance beyond the source file.

This is a good **seed** and a good **shape** (evidence → candidate, never decision), but it is not a graph: no typed edges, no strengths, no review state, no versions, no personal overlay.

## 2. Target model (Blueprint §9, relational in PostgreSQL)

**Nodes** `concept_nodes(id, kind, canonical_label, locale_labels jsonb, status, release_id)`
kinds: `observable_object`, `action`, `setting_scene`, `ocr_phrase`, `document_kind`, `experience`, `record_category`, `qualifier`.

**Edges** `concept_edges(id, from, to, type, strength, quality, constraints jsonb, valid_from, valid_until, provenance_id, review_status, release_id)`
types: `INDICATES, COMMON_AT, CAN_OCCUR_DURING, SUPPORTS, CONTRADICTS, REQUIRES_CONTEXT, PRIMARY_EXPERIENCE_OF, ALTERNATIVE_LENS, IS_A`.
**Releases** `knowledge_releases(id, version, status draft|reviewed|active|retired, reviewed_by, evaluation_ref, created_at)`; the active release id is recorded in every decision (`knowledge_version`).

Examples encoded as data, not code:
* `OCR "HAPPY BIRTHDAY"` —INDICATES→ `birthday celebration`; `balloons`, `candles` —SUPPORTS→ same; `cake` —COMMON_AT→ birthday **and** —INDICATES(weak)→ Meal; `birthday celebration` —PRIMARY_EXPERIENCE_OF→ `Life Moment`; cake alone —SUPPORTS→ Meal.
* `construction site + crane + structural work` —INDICATES→ Project; `worker` —CAN_OCCUR_DURING→ construction (not proof of the user's Activity).
* `whiteboard` —REQUIRES_CONTEXT→ agenda/discussion evidence before Meeting.
* `hospital bed` —SUPPORTS→ care-setting, **never** a diagnosis edge (no edge to a clinical concept exists).

## 3. Retrieval contract

normalise observed concepts → bounded subgraph (depth ≤2, top-K by strength) → evidence-dependence check (repeated model-derived clues from **one** image count as **one** independent proof) → counter-evidence (`CONTRADICTS`) → scoped correction examples → experience hypotheses → category ranking → calibrated policy. Latency budget measured, not assumed (SIE-040). Output: `ExperienceHypothesis[]` with `evidence_refs`, `uncertainty`, `knowledge_version`.

## 4. Safeguards

| Concern | Mechanism |
|---|---|
| Graph must assist, not override | Graph only feeds Pass 2 scores/hypotheses; the decision policy and the human-authority invariant are separate, unchanged (repo: `KB_LIFT_CEILING`, `categoryHint`, UHI-UX-134). |
| Relationship validation | Edge type/endpoint-kind compatibility table; CHECK + test; reject cycles on `IS_A`. |
| Confidence | `strength` ≠ calibrated probability; thresholds from benchmark only. |
| Conflict resolution | `CONTRADICTS` edges lower support; ties ⇒ ask. |
| Versioning | Release-scoped rows; old releases retained so old decisions remain explainable. |
| Safe promotion | candidate → reviewed (human) → shadow evaluation on the golden corpus → active release with rollback (Blueprint §15). Personal corrections are *candidate evidence only*. |
| Sensitive | no edge that yields diagnosis, identity, or age/relationship inference. |
| Locale | labels per locale from the start (English-only patterns today). |

## 5. Migration of the existing 22 rules
Import them as the **first reviewed release** (`v0-seed`), each with `provenance = AGENTS.md / ai-knowledge-base.ts`. Keep the TypeScript KB as the executable fallback until graph retrieval reaches parity in `classifier-rules.js`/`record-intelligence.js` replays; do not delete it in B4.

## 6. When to introduce a graph database
Not before measured need (Blueprint §9). PostgreSQL recursive CTEs over a bounded neighbourhood are adequate for the foreseeable seed size.

## 7. Open items
* Who stewards graph content and reviews promotions (D7).
* No benchmark corpus exists yet; the graph's value cannot be asserted until one does.
