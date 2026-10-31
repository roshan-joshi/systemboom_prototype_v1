# SIE P2-B1 — HEIM foundation (local development only)

Scope: the local intelligence database foundation. **Not** in scope and not built: observation caching/reuse, correction learning, Knowledge Graph inference, authentication, production privacy hardening (P2-B2 and later). Authorization: owner scope amendment, local only.

## What exists

| Piece | Where |
|---|---|
| Migration runner (`up` / `down` / `status`) | `db/heim/migrate.mjs` (`npm run heim:up | heim:down | heim:status`) |
| Migration 001 up / down | `db/heim/migrations/001_heim_foundation.{up,down}.sql` |
| DB layer (server only) | `src/lib/intelligence/heim-store.ts` |
| Provenance wrapper (server only) | `src/lib/intelligence/provenance.ts` |
| Client canonical-media module | `src/components/style-lab/social/composer/canonical-media.ts` |
| Canonical media registration route | `src/app/api/media/register/route.ts` |
| Wired routes | `analyze-meal`, `analyze-activity`, `analyze-record` (handler unchanged; wrapper added) |
| Suite | `prototype-tests/heim-foundation.js` (59 checks) |

## Database

`systemboom_intelligence_dev` on the local PostgreSQL 16 (localhost only), schema `heim`:

* `media_assets` — canonical media id (`media_id uuid`), `content_sha256`, `hash_basis` (`original` | `representation`), mime, size, origin (`upload` | `library`). Unique per (`owner_scope_id`, `content_sha256`): identical bytes share one canonical row. No bytes are stored.
* `id_bridge` — temporary prototype id → canonical `media_id`, keyed by (`kind`, `session_key`, `prototype_id`). `session_key` is a random per-page-load token (not an identity); library fixtures use the constant key `library`. The session key exists because prototype upload ids (`up-1-IMG`) restart on every page load.
* `ai_providers`, `ai_models` — registry; seeded `deepseek` / `deepseek-flash` (revision NULL = unknown, never guessed) and a labelled `mock` provider. NULL-safe uniqueness.
* `ai_invocations` — one content-free row per request that reached a provider (or a labelled mock): requested vs observed provider/model, `observed_model_verifiable`, task type, prompt id, prompt version (content-digest label), prompt digest, schema version, status, validation status, finish reason, attempts, input/output tokens, latency, timestamps.
* `ai_invocation_media` — which media an invocation looked at.
* `vision_observations` — validated Pass 1 `UniversalVisualObservationV1` as JSONB, linked to its media and its producing invocation. Many per media (history kept). **Stored only; nothing reads it back or reuses it in P2-B1.**

`owner_scope_id` is the fixed local single-user placeholder `00000000-0000-0000-0000-000000000001`. It is **not** an authenticated identity.

## Behaviour

* **Upload:** the browser hashes the ORIGINAL file (SHA-256, ≤ 64 MB) and posts hash + mime + size + temporary id + session key to `/api/media/register`; the canonical id is returned and remembered in a module map (deliberately not on the asset object).
* **Analysis:** the three clients add three opaque headers (`X-SB-Session`, `X-SB-Asset`, `X-SB-Asset-Origin`). The request body and the provider payload are unchanged. The server resolves the canonical id through the bridge, or — for an unregistered asset (e.g. a library fixture) — hashes the bytes already in the request. Race-safe through a per-asset advisory lock.
* **Provenance:** after the route's own (unchanged) handler returns, the wrapper records the invocation, links the media and, for the Pass 1 category call, stores the observation. Best effort, 2.5 s cap, never throws; the HTTP response is whatever the handler returned.
* **Failure isolation:** database unreachable, disabled or refused ⇒ routes behave exactly as before P2-B1.
* **Deletion:** `deleteMedia(mediaId)` removes the canonical row; database cascades remove its bridge rows, its invocation links and its observations. Invocation ledger rows (content-free) are kept for provenance/cost history, linked to nothing. There is no HTTP delete route and no UI deletion; the Composer's "Remove" still only unlinks from the draft.

## Safety guards

The runner and the application refuse any host other than localhost/127.0.0.1/::1 and any database whose name does not end in `_dev`. In a production build nothing connects unless an explicit local `_dev` URL is configured. No credential is stored in any table (verified by the suite against the configured keys), and no value is ever logged — failures log a SQLSTATE code only.

## Honest limits (read before using)

1. **My own suite makes no live provider call (every `heim-foundation.js` request is a mock seam, recorded as `mock`).** However the ledger also shows **11 real `deepseek` rows** (7 `activity_specialist`, 4 `category_pass1`; 07:42–08:01 local, during the regression window) that I did not make deliberately and cannot attribute: either the owner's concurrent browser use of the shared dev server (as `AGENTS.md` records for earlier fleets) or an accepted suite path without a mock pin. They are useful evidence: each carries `observed_model_key = deepseek-flash`, `observed_model_verifiable = true`, a `sha256:`-labelled prompt digest, `finish_reason = stop`, token counts and latency — i.e. the real-call fields work. They are **billed calls** nonetheless; if they were not the owner's, a suite is reaching the live provider and should be found.
2. **Observation JSON contains OCR-visible text.** It is stored unencrypted in the local dev database. No API reads it back or returns it, and the existing public serializer still strips it from other people's feeds; but it is now data at rest.
3. **`/api/media/register` and the analysis routes remain unauthenticated** and now write to the local database. Anyone who can reach the dev server can create media/invocation rows.
4. **The application connects as the local OS user, a PostgreSQL superuser.** There is no RLS and no least-privilege role yet.
5. The same bytes registered by two different temporary ids share one canonical row; an upload first seen through analysis is anchored on the *representation* hash and upgraded to the original hash only when that hash is unclaimed.
6. Files over 64 MB are not hashed in the browser; the server then falls back to the bytes it receives (a frame set, for video), which is a weaker identity.
7. The dev database accumulates mock rows from every regression run.

## Blockers for shared testing and production integration (unchanged by P2-B1)

Recorded in `docs/p2a-intelligence-audit/P2A-PRIVACY-AND-AUTHORIZATION.md`:
P1 public serializer is a deny-list (68 of 78 `KindFields` keys unlisted) · P2 `recordPrivacy` never enforced · P3 raw provider text logged on a parse failure (`analyze-meal/route.ts`) · P4 metadata-derived place defaults into the Social-visible place · P5 `?mock=` seams ungated in routes · P6 routes unauthenticated and unbounded · server identity/authorization (owner decision D2). **Do not expose this build to other people, and do not point it at real Health records, until these are closed.**
