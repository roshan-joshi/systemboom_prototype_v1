# P2-A — START HERE

SYSTEMBOOM Intelligence Engine · Phase P2-A · Final Architecture & Repository Audit · 2026-10-31
Authorization: **READ-ONLY AUDIT.** No application code, database, package, migration, commit, push or deploy was touched.

## Verdict: READY WITH BLOCKERS

The approved architecture (CMI · HEIM · UHI · Gateway) is sound and the P1 reasoning layer it builds on genuinely exists
in the repository. It cannot move to P2-B1 yet because of four blockers:

| # | Blocker | Why it blocks |
|---|---|---|
| B1 | **Three source documents named by the brief are not in the repository**: HEIM reference SQL (`heim_schema.sql`), HEIM TypeScript contracts (`heim_contracts.ts`), UHI Master Engineering Specification V0.4. Only the Blueprint V1.2 package (PDF, DOCX, two CSV registers, `SIE_PROVIDER_PROVENANCE_REFERENCE.sql`) is present. | Requirement reconciliation (brief §13) and schema reconciliation (brief §5) cannot be completed against documents that were not supplied. Nothing was invented. |
| B2 | **No server-side identity, session or authorization exists.** The "user" is a client-side `PrototypeIdentity` in `localStorage`; all `/api/*` routes are unauthenticated. | SIE-001/002/044/066/070 (tenant and principal from a trusted session) have no substrate. `owner_scope_id` in the reference SQL has nothing to bind to. |
| B3 | **No canonical media or Human Record persistence exists to integrate with.** Posts live in an in-memory store; asset ids are per-session counters (`up-<n>-<name>`). | The blueprint's rule "reuse canonical IDs, never create shadow records" has no canonical IDs in this repo. P2-B must define a bridge, which needs an owner decision. |
| B4 | **Three confirmed privacy findings in the existing P1 code** (see `P2A-PRIVACY-AND-AUTHORIZATION.md`): the public serializer is a deny-list that misses record-depth Health keys; `recordPrivacy` is written but never enforced; the provider's raw content is written to the server log on a parse failure. A fourth item, metadata place defaulting into the Social-visible place, contradicts SIE-023. | Blueprint §20: privacy and authorization issues are release blockers. |

None of these blocks the read-only audit itself, and none requires redesign of the architecture.

## Documents in this audit (this directory)

1. `P2A-START-HERE.md` — this file
2. `P2A-CURRENT-REPOSITORY-AUDIT.md` — what actually exists
3. `P2A-CENTRAL-INTELLIGENCE-ARCHITECTURE.md` — the shared service design (DISCOVER / ENRICH / REUSE)
4. `P2A-DATABASE-AND-SCHEMA-PLAN.md` — `heim` schema, ID bridge, reconciliation of the reference SQL
5. `P2A-PROVIDER-GATEWAY-AND-COST.md` — provider independence, provenance ledger, cost strategy
6. `P2A-OBSERVATION-CACHE.md`
7. `P2A-CORRECTION-MEMORY.md`
8. `P2A-KNOWLEDGE-GRAPH.md`
9. `P2A-PRIVACY-AND-AUTHORIZATION.md`
10. `P2A-REQUIREMENTS-TEST-RECONCILIATION.md`
11. `P2A-PHASED-IMPLEMENTATION-ROADMAP.md`
12. `P2A-OWNER-DECISIONS.md`

## Evidence legend (used in every document)

* **VERIFIED-CODE** — read directly in the repository during this audit (file and line cited).
* **VERIFIED-DOC** — read in the supplied Blueprint V1.2 package or in `AGENTS.md`.
* **DEVELOPER-REPORTED** — stated in `AGENTS.md` (test counts, live-provider results, owner-test outcomes). Not re-executed in P2-A; the audit is read-only and the test fleet was deliberately not run.
* **NOT VERIFIED** — assumed or unknown; stated as such.

Owner acceptance of every P1 behaviour remains **PENDING** per `AGENTS.md`. Nothing here upgrades that.

## Documents examined

| Document | Found? |
|---|---|
| `references/SYSTEMBOOM_INTELLIGENCE/SYSTEMBOOM_INTELLIGENCE_MASTER_BLUEPRINT_V1.2.pdf` / `.docx` | Yes (PDF read in full; DOCX is the same package — not separately diffed) |
| `SIE_REQUIREMENTS_REGISTER_V1.2.csv` (92 requirements) | Yes |
| `SIE_ACCEPTANCE_TEST_REGISTER_V1.2.csv` (102 tests, all NOT RUN) | Yes |
| `SIE_PROVIDER_PROVENANCE_REFERENCE.sql` | Yes |
| HEIM reference SQL (`heim_schema.sql`) | **MISSING** |
| HEIM TypeScript contracts (`heim_contracts.ts`) | **MISSING** |
| UHI Master Engineering Specification V0.4 | **MISSING** (its decisions UHI-DEC-014/-017 and UHI-UX-134 are recorded in `AGENTS.md`; the specification itself is not) |
| `SIE_ARCHITECTURE_AUDIT_V1.1.md`, `CLAUDE_CODE_P2A_READ_ONLY_AUDIT_PROMPT.md` (listed in Blueprint §26) | **MISSING** |
| Repository docs (`AGENTS.md`, `docs/handover/*`, `references/social-composer/*`) | Yes |

Blueprint inconsistency noted: the V1.2 PDF's running header and footer still read "ARCHITECTURE V1.1", the title page says "Edition 1.1", and section numbers 21 and 22 each appear twice (the V1.1 reconciliation and the V1.2 amendment). Content is coherent; the labels are not. See the reconciliation document.

## One-paragraph recommendation

Make Blueprint V1.2 the working master. Obtain the three missing documents. Resolve the owner decisions marked **BLOCKING** in `P2A-OWNER-DECISIONS.md` (D1 database target, D2 identity and ID bridge, D3 metadata place, D4 privacy closure, D5 retention, D12 missing documents; D6 thresholds before B5). Close the four privacy findings *before* any persistence is added, because P2-B2 would otherwise store private observations behind a serializer that already leaks. Then begin P2-B1 with the "minimal vertical slice" in the roadmap.
