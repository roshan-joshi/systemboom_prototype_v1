# SIE P2-B2.1 — stabilization (MIX-11, localhost binding, isolation + cache re-verification)

## 1. MIX-11 — root cause (proven, deterministic)

**Cause: arrival-order-dependent automatic category selection in the Composer — not the cache.**
Meal and Activity (Phase C / V3 rules) were decided **per response, from that one photo's reading**, and the guard then treated
*any* earlier `"ai"` selection — including SYSTEMBOOM's own — as final. In a two-photo composition whichever reading arrived
first therefore won; when the Activity photo answered first, Activity was selected and the Activity specialist was asked for
both photos before the food photo had even been read. The seven-category rule (UHI-DEC-017) did look at every reading, but
still acted on partial evidence while a photo was pending (a construction photo answering first selected Project and asked the
Project specialist before the birthday photo arrived).

**Evidence.** `prototype-tests/category-order.js` holds every `/api/analyze-meal` request in the browser, fetches each
photo's real server answer under a chosen fixture and delivers them in a scripted order (simultaneous, either order, one
delayed 2.5 s, one cached / one not, one failed, a human choice mid-analysis, a human change afterwards). Against the
committed (pre-fix) Composer it failed 8 checks — 7 of them arrival-order defects:

| Check | Pre-fix result |
|---|---|
| ORDER-1/2 birthday vs construction | construction-first: Project selected while the birthday photo was pending; **2 Project specialist requests**; birthday-first: none |
| ORDER-3 (MIX-11 shape) food vs Activity | activity-first: **Activity selected, 2 Activity requests**; food-first: none |
| ORDER-5 one result delayed | Activity selected during the delay, 2 Activity requests |
| ORDER-7 human choice mid-analysis | the transient Activity auto-selection turned the person's pill tap into the one-tap *undo*; nothing was chosen; record never posted as the chosen kind |
| ORDER-4 cached vs not | only failed because the committed Composer sends no identity headers (no cache in play) — not an order defect |

The P2-B2 cache made the reversed order more likely only because the route now does database work before answering (timing
changed); fixtures like `mixed` are never cached at all.

**Fix (smallest justified, `UniversalComposer.tsx`).** One `decideAutoCategory()` replaces the per-response selection. It runs
after every reading (success **or failure**) and after a removal, and applies the **unchanged** policy over **all** readings
held: food first (the rule `pruneRemoved` already used), then Activity, then the UHI-DEC-017 seven-category agreement (Health
never auto). Food-first is *monotonic* — once one reading qualifies for Meal no later reading can change the answer — so Meal is
committed as soon as it qualifies (this keeps the accepted progressive per-photo Meal flow, `meal-intelligence` E20/V1-128).
Activity and the seven-category kinds *can* be overturned by a later reading, so they **wait until every attached photo's
reading is in**. SYSTEMBOOM may revise only its **own** earlier choice; a person's
choice (`intentSource: "user"`), an accepted suggestion and a one-tap undo (new `autoUndoneRef`) are never overridden. The
classifier and every specialist contract are untouched; a single photo still auto-selects immediately.

After the fix `category-order.js` passes 18/18. A first version that also deferred Meal until every reading was in broke two accepted Meal checks (E20, V1-128 — the per-photo panel while a slow photo is pending); the monotonic-Meal refinement restored them without reintroducing any order dependence.

## 2. Localhost binding — PROPOSED, not applied (owner-managed script)

Measured: PostgreSQL listens on `127.0.0.1:5432` and `[::1]:5432` only (`listen_addresses = localhost`) — **not exposed**.
The :3210 dev server listens on **`*:3210`** (all interfaces; reachable on the LAN at this Mac's address). On the LAN the
provider gate still blocks every paid call (the `?mock=` seam is closed for non-local hosts), but a LAN client could reach
the unauthenticated routes — e.g. create media/bridge rows through `/api/media/register` or the analysis routes, and read
`/api/intelligence/status`.

`.claude/dev-keepalive.sh` is the owner's untracked script, so it was **not** modified. Proposed one-line change:

```diff
-  npx next dev -p 3210 >> /Users/roshan/SYSTEMBOOM_V2/.claude/dev-server.log 2>&1
+  npx next dev -p 3210 -H 127.0.0.1 >> /Users/roshan/SYSTEMBOOM_V2/.claude/dev-server.log 2>&1
```
and, for `npm run dev`, `"dev": "next dev -H 127.0.0.1"` (also not applied). `npm run dev:live` already binds 127.0.0.1.

**Workflow trade-off (owner decision):** binding to 127.0.0.1 stops phone-over-Wi-Fi testing of :3210. Options: (a) bind to
127.0.0.1 and test phones through an explicit, temporary LAN start when needed; (b) keep LAN binding while the prototype has no
authentication, accepting LAN reachability of mock-mode routes (no billing possible); (c) a separate explicit `dev:lan` script.
To apply (a): edit the line above, then restart the keep-alive process.

## 3. Test waits made state-based (no timeout inflation)

| Suite / check | Was | Now |
|---|---|---|
| `vision-intelligence` VIS-P1-019 (4 sites) + 013/018 | `waitRecDone(page, 1)` — satisfied by the earlier auto-selected **Project** reading, so the Meeting card was read before the Meeting reading landed (the recorded fleet flake) | `waitRecKind(page, "meeting" / "project")` — waits for that kind's reading |
| `record-intelligence` P4 | fixed `sleep(2400)` against a 1.8 s delayed fixture | wait until the Project reading is `done` |
| `record-intelligence` RSN-2/VIS-1/C13 echo | fixed 2 s (`waitFor(() => false, …)`) | wait until this page's echo response arrived |
| `activity-intelligence` INC-4 | fixed `sleep(3200)` against a 2.5 s delayed fixture | wait until the new photo's reading is `done` |

Each still asserts exactly what it asserted; only *when* it looks changed.

## 4. UHI-MULTI-001 — Complete Experience and Individual Evidence Preservation (supersedes the monotonic-Meal refinement)

**Per-photo evidence (unchanged, now complete in storage).** Every photo is analysed on its own; its reading is kept in the
Composer (per-asset readings, chips) and in `heim.vision_observations` with its producing invocation. The audit found the
stored `observation` already holds objects (label, confidence, evidence), scene, actions, OCR text with a `legible` flag,
primary subject, limitations, provider and schema version; but the photo's **decision-free reading** (food flag, Meal
identity, Activity hint, the model's category scores) was stored only when the result was *reusable* as cache — 182 of 214
rows had none. Correction (code only, no migration — the 002 schema already allows it): the reading (`payload`) is now
stored for **every** observation; `cacheable` still alone decides reuse.

**Whole-experience commitment.** The post's category is committed automatically only when **every attached photo has
completed or failed** (§8). Each photo states its own primary experience under the established per-photo policy:
a seven-category verdict when it carries one (`high`, never `noMatch`; UHI-DEC-014 subject rules already applied), Meal only
with a high food reading, Activity only when the category call says *select*; a legacy reading keeps Phase C / V3 (food →
Meal, selected Activity → Activity); low / medium / noMatch photos state nothing; failures contribute no evidence. The post
commits to the experience a **strict majority** of the stating photos agree on: one photo decides alone; a birthday set with
one cake photo is a Life Moment (§10); a 1-to-1 conflict commits nothing — the person chooses; Health is never committed.
Arrival order cannot change it.

**Preview vs commitment.** Per-photo readings, chips and the stored observations appear as each photo answers — they are
previews. The commitment is the post's own category; the pill now carries `data-sb-category-commit`: `person` (the person
chose), `auto` (SYSTEMBOOM committed), `awaiting` (photos still being read), `none`.

**Authority.** A person's choice, an accepted suggestion and a one-tap undo are never overridden; a Circle direct entry
(ENRICH) is never committed by discovery (§13). No secondary Human Record is created from detected objects (§14).

**Superseded assertions (recorded):** `meal-intelligence` E20 and V1-128 asserted the per-photo Meal form *before* the slow
photo answered (an early commitment, now forbidden by §8); they now assert the same invariant at commitment time — the
panel opens on the selected photo 1, never on the photo that arrived last. The earlier "Meal commits at once" refinement in
§1 above is superseded by this section.
