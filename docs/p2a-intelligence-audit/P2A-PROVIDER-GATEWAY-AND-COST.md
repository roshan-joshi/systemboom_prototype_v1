# P2-A — Provider Gateway, Provenance and Cost

## 1. What exists (VERIFIED-CODE)

* Three routes each build `new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" })` and hard-code model `deepseek-flash` (`analyze-meal/route.ts` ~712–723; same pattern in `analyze-activity`, `analyze-record`).
* Provider-specific response handling (`reasoning_content`, `finish_reason: "length"`, `extra_body.thinking`) sits inside the routes.
* Adaptive effort policy is deterministic and provider-flavoured (`reasoning-policy.ts`: SIMPLE → thinking disabled/4000 tokens; COMPLEX → thinking enabled/6000/`detail: high`).
* Output normalization is provider-agnostic in shape (`normalizeVision`, `validateRecordObservation`, `normalizeProviderOutput`) — a good seam to keep.
* Server logs: timing and `usage` JSON only, except the parse-failure branch (privacy doc, finding P3).

## 2. Provider-independent gateway design

```
interface CmiProvider {  analyze(req: CmiRequest): Promise<CmiResult>  }
interface UhiProvider {  assess(req: UhiRequest): Promise<UhiResult>   }
// CmiResult / UhiResult carry the REPO contracts + a ProviderTrace (never vendor JSON)
ProviderTrace {
  requestedProvider, requestedModel,
  observedProvider?, observedModel?, observedModelVerifiable: boolean,
  promptId, promptVersion, promptDigest?, schemaVersion,
  preprocessingVersion?, classifierVersion?, knowledgeVersion?, policyVersion?,
  status, finishReason?, inputTokens?, outputTokens?, cachedInputTokens?,
  latencyMs, attempt, startedAt, finishedAt
}
```
Adapters: `DeepSeekAdapter` (today), `OpenAiAdapter` (later), `MockAdapter` (replaces the in-route `?mock=` switches). Selection and fallback are configuration, independently testable; validation and the human-authority invariant live **outside** the adapters, so switching provider cannot change public CMI/UHI/HEIM types (SIE-093).

## 3. Provenance recording (every requirement in brief §7)

| Datum | Source of truth | Today |
|---|---|---|
| Requested provider / model | adapter configuration | model constant only |
| Actual provider / model | provider response field **when verifiable**; else explicitly `unknown` | not captured |
| Model revision | response `model` field if supplied | not captured |
| Prompt template id + version/digest | prompt module exports an immutable id and a content digest | **absent** — prompts are inline strings |
| Observation schema version | contract constants | present (`schemaVersion: 1`) |
| Classifier / knowledge / policy version | constants exported from `classify.ts`, `ai-knowledge-base.ts`, policy module | **absent** |
| Analysis timestamp | `analyzedAt` | present |
| Token usage | `completion.usage` when present; do not assume identical metrics across vendors | logged, **not stored** |
| API call count | one `ai_invocations` row per call | not counted |
| Latency | measured in adapter | logged only |
| Estimated / actual cost | pricing version × usage; billed cost only if provider reports it | none |
| Validation / failure status | validator result enum | partly (`reason: empty|invalid_json|not_object`), not stored |

Rules: every observation, category decision, specialist enrichment, embedding and OCR artifact links to its producing invocation through `ai_artifact_provenance`; cache hits write a cache-access event, never an invocation; **no plaintext keys, raw OCR or image bytes** in the ledger (SIE-097); unknown routing stays "unknown" (SIE-099).

## 4. Findings to carry into B1

* Extract one `intelligence/providers/` module; delete per-route client construction.
* Move prompts to versioned modules with an exported digest; the digest changes the cache key.
* Gate every mock seam behind `NODE_ENV !== "production"` (or a test-only flag) at the gateway.
* Add request size limits and per-principal rate limits at the gateway (none found in route code by search; not exhaustively verified).

## 5. AI cost strategy (brief §12; **no benchmark figures are invented**)

Ordering of work, cheapest first (Blueprint §22):

1. **Zero-LLM first:** authorization, SHA-256, metadata parse, schema validation, deterministic rules, bounded graph lookups, policy gates.
2. **Cache:** compatible authorized observation ⇒ no provider call (SIE-027).
3. **One image analysis per asset per compatible version:** the repo already sends one call that yields Pass 1, seven scores and the Meal reading. Preserve that economy: when Pass 1 is cached, Pass 2 re-runs from the stored observation *without* re-sending pixels (Blueprint §7 last para).
4. **Avoid second image analysis:** today a Project/Problem/Meeting/Health specialist call re-sends the full image bytes after the category call already looked at them. That is a **second analysis of the same bytes**. Cost lever: allow the specialist to consume the stored Pass 1 observation where it suffices and send pixels only when the specialist needs detail the neutral observation lacks (OCR-heavy, document-heavy). Whether quality holds must be **measured** before adopting (SIE-079/-077) — not assumed.
5. **Deterministic over AI where reliable:** the classifier is already deterministic over model scores; keep it so. Candidate deterministic reductions to evaluate: client-side image resize policy (the record client already fits images to 1792/1280 px), skip analysis for exact duplicate bytes, skip when Smart Assist is off (already).
6. **Track actual usage:** ledger rows (tokens, latency, finish reason, cost estimate vs billed).
7. **Measure cache hit rate** per asset and per user (`cache_access_events` ÷ (events + invocations)).
8. **Measure classification quality** against the golden corpus: top-1/top-3, auto-select precision and coverage, override rate.
9. **Support provider comparison** by replaying a frozen corpus through two adapters and comparing quality/latency/cost — never by switching production.
10. **Quality gate:** no token saving that lowers category or privacy performance without owner approval (V1.2).

Metrics that must exist before any cost claim: calls per upload, cache hit/miss, p50/p95 latency, cost per accepted classification, duplicate-call rate. Targets are proposed only after a baseline (open decision D6).
