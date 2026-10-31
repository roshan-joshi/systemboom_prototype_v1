# SIE P2-B2 · Gate 1 — zero-billing provider isolation

## 1. The 11 unexpected DeepSeek calls (P2-B1) — investigation

**Evidence reviewed:** the 11 `heim.ai_invocations` rows with `requested_provider_key='deepseek'` (task, latency, tokens, start time 07:42–08:01 on 2026-10-31); the dev-server log `.claude/dev-server.log` (every request line Next.js printed, with its query string, and the route's own "provider answered in …" lines); the regression-fleet timeline; the test sources' URL builders.

**Correlation.** Each ledger row's latency matches exactly one "provider answered in" log line (activity 1.8/2.5/2.8/3.0/2.4/2.6/2.3 s; category 4.8/5.0/5.3/6.3 s), and each of those sits next to a provider-route request line that carried **no `?mock=`**: seven `POST /api/analyze-activity` and four `POST /api/analyze-meal`. In that log window every page request is an automated suite page (`/style-lab/social?harness=0&…`, plus mocked geocode); there is **no** owner/browser page (`/world`, `/life`, `/`, `/chat`).

**Mechanism (root cause).** Mock fixtures were selected only by query parameters that each *suite* chose to pin (`mockai`, `mockactivity`, `mockrecord`, `mockfacts`, …), and each *client* forwarded only its own parameter. A suite page that pinned `mockai` but not `mockactivity` (e.g. `vision-intelligence`'s `vision-runner` → Activity auto-selected; VIS-P1-019 choosing Activity) made the Activity client send an unmocked request; the route then saw a configured `DEEPSEEK_API_KEY` and called the live provider. `social-composer.js`'s page URL pins `mockrecord=off` but no `mockai`, so attaching four photos sent four unmocked category requests. Nothing on the server distinguished "test" from "real use"; the key alone enabled billing.

**Reproduction.** With the Gate 1 guard in place the same fleet was rerun; the guard blocked exactly the same request shapes and logged the originating page: 7× `analyze-activity` (pages `mockai=vision-runner` ×2, `vision-construction&mockrecord=kb-construction`, `nonfood-act-high`, `meal:2000`, `nonfood&mockrecord=project`), 4× `analyze-meal` (page `…&mockrecord=off`, no `mockai`), plus 2× geocode (pages without `mockgeo`).

| Rows | Classification |
|---|---|
| 7 × `activity_specialist`, 4 × `category_pass1` | **ATTRIBUTED TO TEST** — unpinned suite pages (`vision-intelligence`, `record-intelligence`, `meal-intelligence`, `social-composer` URL patterns), reproduced deterministically under the guard |

Remaining uncertainty: the historical rows carry no request correlation id, so the mapping of each individual row to one specific suite test is by pattern and timing, not by a recorded id. The ledger rows are preserved unchanged.

## 2. Mechanism now in place

One server module — `src/lib/intelligence/provider-gate.ts` — governs every outbound provider (DeepSeek, USDA, Open Food Facts, Nominatim).

* **MOCK is the default for every server.** No env variable, no key, no request parameter makes a server live.
* **LIVE requires both** `SB_PROVIDER_MODE=live` **and** `SB_PROVIDER_LIVE_CONFIRM=billed-provider-calls`, and is refused under `NODE_ENV=test`, `CI` or `SB_TEST_RUN`.
* **Transport enforcement.** The only DeepSeek client factory (`deepseekClient`) is built with a gated `fetch` that re-checks the gate on every request; USDA, Open Food Facts and Nominatim call `assertLiveAllowed` immediately before opening their socket. A blocked request never reaches the network.
* **Fail closed, informatively.** A route asked to reach a provider in MOCK mode answers with its ordinary "provider unavailable" shape (so the Composer behaves exactly as it does in an outage — P1 preserved), plus `aiBlocked: "LIVE_PROVIDER_BLOCKED"` and the header `x-sb-provider-blocked: <provider>`, and logs `[provider-gate] BLOCKED live <provider> call from <route> … page=<referring page>` (no prompt, payload or key). Blocked requests are never written as invocations.
* **The `?mock=` seam** (`mockScenario`) is honoured only on a local (`Host` localhost/127.0.0.1/::1), non-production, non-live server. A production build or a live server ignores it; a request addressed to another host cannot select a fixture (and still cannot reach a provider). All six routes read fixtures through it; the analyze-meal fixture delay is now capped at 10 s like the others.
* **Evidence counters.** `GET /api/intelligence/status` (404 in production) reports the mode and per-provider allowed/blocked counts. `prototype-tests/_provider-net-snapshot.js` snapshots counters + ledger + log offset before a run and prints the delta after.

## 3. Live mode — the only way

```bash
npm run dev:live
```
`scripts/dev-live.mjs`: refuses under CI/test, refuses a non-interactive start, asks for a typed `live`, then starts Next on **127.0.0.1:3211** with both live variables. Every automated suite targets **:3210**, so a suite can never reach a live server by accident. The manual `prototype-tests/_verify-deepseek-live.js` script refuses to run without the same two variables.

**Owner workflow change:** the always-on :3210 dev server (keep-alive) is now MOCK. Real-photo testing with real AI is done on the live server at http://127.0.0.1:3211.

## 4. Not covered (documented)

Browser-side providers in the frozen Earth feature (Google Maps Platform via `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, OSM tiles, a client-side Nominatim call in `src/lib/earth/locate.ts`) do not pass through the server and are outside this gate. None of the suites run in this phase open Earth. The keep-alive script binds the dev server to all interfaces (Next default); binding it to 127.0.0.1 is the owner's call (the script is the owner's untracked file).
