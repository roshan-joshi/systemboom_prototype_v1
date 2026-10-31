# P2-A — Correction Memory

Scenario: `AI suggests Meal → user selects Life Moment → store correction → retrieve a relevant preference for future *similar* cases`.

## 1. What the repo already records (VERIFIED-CODE / DEVELOPER-REPORTED)

| Existing signal | Where | Persisted? |
|---|---|---|
| `intentSource` (`default \| user \| media \| ai`) and `origin:"circle"` | composer draft | No — draft/in-memory |
| `autoByVision` (which kind SYSTEMBOOM chose) | composer state | No |
| Field states `default → confirmed | corrected | cleared`, with `original` and `ref` | V2 `field-contract.ts`; Meal `mealAssets` carry per-photo cell state, saved on the record | Only inside the in-memory Moment |
| Provenance on a posted record | `recordProvenance`, `activityProvenance` (record depth) | In-memory |
| Rejected AI item recorded as a decision (`rejected` item state) | Meal food items | In-memory |

**What does not exist:** any append-only event, any record that *the person overrode a suggested category* (the override simply replaces `intentSource`), any retrieval of past corrections, any consent field.

## 2. Event model (append-only ledger — Blueprint §8)

`heim.correction_events`:
`id, owner_scope_id, decision_id (fk category_decisions), client_action_id, action ∈ {accept, override, clear, adjust, ignore}, source ∈ {explicit_user, ai, default, direct_entry}, predicted_category, selected_category, field_key?, asset_ids[], record_id?, group_id?, evidence_refs[], policy_version, model/knowledge versions, consent_scope_id, created_at`.
* **Idempotency:** unique `(owner_scope_id, decision_id, client_action_id)`.
* **Order of operations on override:** persist the authoritative human choice first; append the feedback event second; update the preference projection asynchronously (never inline in the UX path).
* **Original error is preserved** for evaluation; the event never edits the decision it criticises.
* **Explicit vs implicit:** only explicit actions are labels. *Absence of a correction is not acceptance* (Blueprint §8). "Publishing" is not confirmation (V1.2). "Looks right" / Continue are explicit acceptance.
* Per-field correction and clear are **separate events**; they never override protected (user-owned) data.

## 3. Preference retrieval

`personal_preference_projection(owner_scope_id, context_signature, category_bias, evidence_count, last_event_at)` — derived, bounded, rebuildable from the ledger.
* `context_signature` = normalised **experience features**, not raw images: e.g. `{celebration-indicator, cake, banner-text-present}`; the user's "birthday cake → Life Moment" correction biases *that* signature, so `plain-cake-on-a-plate` stays Meal (SIE-036).
* Used **only as a Pass 2 input** (a bounded prior), never as an override: a preference can move a case from "ask" to "suggest/auto" only when policy thresholds and sensitivity rules still pass; **Health is never auto-selected from preference** either.
* Recency-weighted, evidence-count-bounded; a single event cannot fix a category (one-shot overfitting guard).
* Contradictory history ⇒ reduce confidence, prefer asking.

## 4. Personal versus global

* Personal corrections are **scoped to the owner**. They never modify global classification rules, graph edges or thresholds (SIE-037).
* Promotion path to the global graph exists only as a *separate, consented, reviewed, versioned release* (knowledge graph doc) with its own evaluation, never automatic.
* Guard against training on the model's own predictions and against feedback manipulation: the ledger separates `source`; AI-selected-and-unchallenged rows are never positive labels.

## 5. Consent, deletion, review

* Learning from corrections requires scoped consent (`consent_policies`: "personalise from my corrections" distinct from "contribute to aggregate learning").
* Owner can **review, export, correct, delete** their ledger and projection; deletion rebuilds the projection; retention class per event type (open decision D5). Sensitive categories (Health, children) are excluded from learning without explicit consent.

## 6. Gaps / dependencies
* Needs server identity (B2), `category_decisions` (B2), and a Composer hook that emits the event at the existing override moments (`chooseIntent`, `pickKind`, field edit/clear). Those hooks already exist in code, which makes the Composer-side change small.
* Test plan: replay on a frozen dataset (SIE-042), non-overwrite of explicit choices, idempotent retry, cross-user isolation, deletion rebuilds projection.
