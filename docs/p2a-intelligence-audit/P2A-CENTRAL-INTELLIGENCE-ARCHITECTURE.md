# P2-A — Central Intelligence Architecture

How all SYSTEMBOOM applications use one intelligence engine. Design proposal grounded in the audit; nothing here is implemented.

## 1. Principle

One engine, three components, one gateway:

```
Clients (Social Composer · Circle of Life · specialist worlds · media library · future agent)
   │
   ▼
Intelligence Gateway   — authn/authz · entry context · consent · rate/size limits · trace id · contract version · safe output filter
   │
   ├─ CMI  (perception)   media identity · metadata · provider adapter · Pass 1 observation
   ├─ HEIM (memory)       observation store + cache · correction ledger · knowledge graph · preferences
   └─ UHI  (reasoning)    experience hypothesis · seven-category classifier · decision policy · specialist enrichment
```

The engine **never owns** media bytes, Human Records, users or posts. It owns derived, versioned, private intelligence that *references* canonical ids.

## 2. Today vs target

| Concern | Today (VERIFIED-CODE) | Target |
|---|---|---|
| Where intelligence runs | Browser orchestrates; three routes each call DeepSeek | Gateway service orchestrates; clients send asset ids + entry context |
| Pass 1 vs Pass 2 | One provider call returns both (vision + seven scores + Meal) | Pass 1 stored as a reusable observation; Pass 2/policy re-run deterministically from the stored observation |
| Category authority | Client state (`intentSource`, `origin`) | Server validates mode/category combination; client state remains the UI authority within a session |
| Reuse | In-component map, lost on reload | HEIM cache keyed by authorized scope + content hash + versions |
| Provenance | `providerModel`, `analyzedAt`, `schemaVersion` | Invocation ledger + artifact provenance |

## 3. Request contract (from Blueprint §13, reconciled with repo names)

```
IntelligenceRequest {
  requestId, assetIds[], mode: DISCOVER | ENRICH | REUSE,
  entryContext: social_composer | circle_of_life | specialist | media_library | future_agent,
  selectedCategory?, selectionSource?: default|ai|user|direct_entry,
  recordId?, locale?, privacyCapabilityId?, clientActionId?
}
```
* Principal and tenant are **bound server-side**; a client-supplied owner id is never authoritative (SIE-001).
* Repo reconciliation: the repo already has `IntentSource = "default"|"user"|"media"|"ai"` plus `origin:"circle"`. The blueprint's `SelectionSource` is `default|ai|user|direct_entry`. **Do not introduce a second enum** (Blueprint §13): map `media`→`default`, `origin:"circle"`→`direct_entry` at the gateway boundary and keep the repo's names inside the Composer. Category kinds already exist (`life_moment`=`moment`, plus six) — reuse `data.ts` / `composer` kind ids and map the blueprint's `life_moment` to the repo's `moment`.

## 4. The three modes

### 4.1 DISCOVER — Social Composer, no category chosen
```
upload → gateway authz → media registry (id + SHA-256)
  → HEIM lookup (compatible Pass 1 observation?)
       hit  → reuse                       miss → single-flight lease → CMI adapter → validate → persist
  → HEIM retrieval (personal correction examples, bounded graph neighbourhood)   [P2-B3/B4]
  → UHI Pass 2: experience hypotheses + seven-category ranking
  → decision policy (separate gate): auto-select | suggest | ask | no-match
  → UI: auto-organised / proposing / neutral Life Moment fallback
  → human confirm/edit → existing specialist → canonical record → optional share
```
Auto-selection stays conservative exactly as UHI-DEC-017 (Health never auto, ambiguity asks, conflict across photos asks).

### 4.2 ENRICH — Circle of Life / direct category
```
selected category is AUTHORITATIVE
upload → gateway → media registry → HEIM lookup → CMI Pass 1 (if miss)
  → HEIM retrieval → SKIP the seven-category classifier and auto-select → run the selected specialist
```
* All seven specialists are supported: Life Moment (neutral/ experience), Meal, Activity, Health, Problem, Project, Meeting.
* The gateway **rejects** `ENRICH` requests that ask for a category decision (`categoryDecision` must be absent) and rejects `selectedCategory` in `DISCOVER` unless `selectionSource=user`.
* An optional, non-blocking "this looks like another category" note may be returned as advice — never a switch (Blueprint §3 Journey B).
* **Repo gap to close in P2-B5:** today the composer sends photos to `/api/analyze-meal` even in direct entry (see audit §2.6). Under the gateway this becomes a mode check, not a UI suppression.

### 4.3 REUSE — authorized read
Return stored observations and links for an asset the caller may access; **no provider call**, no consent inference (SIE-027, SIE-031). A newer classifier/policy re-runs Pass 2 over the stored Pass 1 observation and writes a *new versioned decision* (Blueprint §7).

## 4. Provider seam (summary — detail in the gateway document)

`CmiProvider` and `UhiProvider` interfaces return the versioned repo contracts (`UniversalVisualObservationV1`, a `CategoryDecision`), never vendor JSON. Today's three routes become thin adapters behind it; the OpenAI-SDK/DeepSeek construction lives in one place.

## 5. Where it runs for the local prototype

Recommended: a **Next.js route layer remains the HTTP surface**, but business logic moves to a framework-independent module `src/lib/intelligence/**` (pure TypeScript, injectable store and provider). This is the portable handover unit: the production developers can mount the same module in their service. Do **not** put intelligence logic in route files (today's `analyze-meal/route.ts` is 745 lines mixing prompt, mocks, normalization and transport).

## 6. Boundaries the engine must not cross

* No second media library; no copy of Human Records; no shadow category enum.
* No write to the Composer's draft or to the canonical record: the engine returns suggestions; the Composer/record service applies them under the V2 field contract.
* No public serialization of intelligence; the gateway's output allowlist is the only exit (privacy doc).
* No face identification, no diagnosis, no auto-publish (Blueprint non-goals).

## 7. Minimal vertical slice recommended for P2-B1/B2

"Reuse a Pass 1 observation for an unchanged uploaded photo across a reload": registry id + SHA-256 → HEIM `observations` row → gateway REUSE/DISCOVER → Composer renders the same card with **zero** provider calls on the second attempt. It exercises identity, cache, versioning, provenance, authorization and isolation with the smallest surface. Detail in the roadmap.
