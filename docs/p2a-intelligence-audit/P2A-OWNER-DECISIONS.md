# P2-A — Owner Decisions

**BLOCKING** = must be decided before P2-B1 can start. Recommendations are proposals, not decisions.

| ID | Decision | Why it matters | Recommendation | Blocking? |
|---|---|---|---|---|
| D1 | **Database target:** dedicated local DB `systemboom_intelligence_dev` vs a `heim` schema inside an existing local instance. Local PostgreSQL 16.14 is running; pgvector is **not** installed. | Isolation from production; extension availability | Dedicated DB + `heim` schema; defer pgvector | **BLOCKING** |
| D2 | **Identity and ID bridge:** what is the trusted principal locally (no server auth exists), who issues canonical asset ids, and how prototype ids map to production ids. | `owner_scope_id`, cache keys, RLS and every authorization requirement depend on it | Local stand-in session + `heim.id_bridge`, clearly labelled; production devs supply canonical ids later | **BLOCKING** |
| D3 | **Metadata place:** UC-C4.2 defaults EXIF-derived place into the Social-visible place; Blueprint SIE-014/-023/-065 require explicit confirmation and a separate sharing permission. | Direct privacy contradiction | Restore confirmation for the Social-visible place; keep private `recordPlace` enrichment | **BLOCKING** (privacy) |
| D4 | **Close privacy findings before persistence:** approve a small P1-closure phase for allowlist serializer, `recordPrivacy` enforcement, log scrubbing, mock gating. | Persistence would store private data behind a leaking boundary | Approve before B1 | **BLOCKING** |
| D5 | **Retention and deletion policy** for observations, OCR, GPS, correction history; backfill of historical media (Y/N). | Schema and RLS design; consent text | Short retention for OCR; user-deletable everything; no backfill in P2 | **BLOCKING** for B2 |
| D6 | **Quality targets and thresholds:** who approves auto-select precision/coverage, latency, cost targets after a baseline; golden-corpus ownership and licensing. | Current thresholds are hand-set; no benchmark | Baseline first; engineer proposes, owner approves | **BLOCKING** for B5 (not B1) |
| D7 | **Graph content stewardship** and promotion review process. | Graph quality and drift | Named reviewer role; shadow evaluation required | B4 |
| D8 | **Consent granularity** for learning and GPS (five separate toggles per Blueprint §14?). | Consent schema | Five toggles, default off for learning | B3 |
| D9 | **Specialist re-send policy:** may specialists consume the stored Pass 1 instead of re-sending pixels (cost vs quality)? | Largest controllable AI cost | Measure on the corpus; adopt only if quality holds | B5 |
| D10 | **Packages and tooling:** approve `pg` client, migration runner, schema-validation library. | None installed in P2-A | Decide at Gate B1 | B1 |
| D11 | **Provider data-handling inventory** (DeepSeek terms, retention, regions) and fallback provider candidate. | SIE-072, R-07 | Inventory before any real-user data | B2 |
| D12 | **Missing documents:** supply HEIM SQL/TS contracts and UHI V0.4; confirm Blueprint V1.2 is the master and re-issue with corrected "V1.2" labels and unique section numbers. | Reconciliation cannot complete | Supply before B1 | **BLOCKING** |
| D13 | **Test register quality:** accept the 82 generic tests as placeholders, or require named fixtures and exact assertions before B1. | Acceptance baseline | Require named fixtures for P0/P1 requirements | B1 |
| D14 | **Owner acceptance of P1:** the Blueprint reports owner tests passed; `AGENTS.md` says pending. Confirm status. | Baseline truth | Confirm explicitly | informational |
| D15 | **Physical-device verification** for mobile flows (never run). | SIE-076 | Schedule before B6 | B6 |
| D16 | **Rollout/release strategy** (feature flag, local-only until accepted). | Blueprint §18 open question | Local-only; feature-flagged | later |
