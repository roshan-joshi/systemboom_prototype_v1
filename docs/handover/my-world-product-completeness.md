# My World — product completeness matrix

Final complete-My-World pass · 2026-09-12. The product completion truth for the
live port. Classifications: **READY** (accepted prototype reference, port it) ·
**READY WITH LIVE PORT** (reference done; needs the named backend/infra work) ·
**PRESERVE EXISTING LIVE BEHAVIOUR** (live already does it; keep function, apply
the visual system) · **DEFERRED** (owner decision) · **BLOCKER** · **UNKNOWN —
OWNER / BACKEND CONTRACT REQUIRED**.

| Capability | Live | Prototype | Design | Backend dependency | Route / entry | Mobile | Desktop | Privacy | A11y | Launch classification |
|---|---|---|---|---|---|---|---|---|---|---|
| Cosmos (solar system, planets, Earth, 3D Earth) | real | accepted (Phase 1, frozen) | done | none | `/` | ✓ | ✓ | public | ✓ | READY |
| Identity / login | real auth | prototype gate (localStorage) | done | real auth stays | gate at `/`; personal routes continue the request | ✓ | ✓ | ✓ | ✓ | READY WITH LIVE PORT — server-side guarding of `/world` `/life` `/chat` |
| My World (Moments stream) | real (Social) | accepted | done | `social-api-contract.md` | `/world` | ✓ first Moment ≈1 viewport | ✓ | ✓ | ✓ | READY |
| Composer + Moment kinds | real | accepted | done | contract §D | in the stream | ✓ | ✓ | ✓ | ✓ | READY |
| Profile (owner hero) | real | accepted | done | contract §B | top of `/world` | ✓ | ✓ | ✓ | ✓ | READY |
| Person surface (other person) | profile pages exist live | **person card** (ring, band, relationship, actions) | done | relationship states API | Moment author · search person · notification | ✓ | ✓ | band-only | dialog, Esc, focus return | READY WITH LIVE PORT — map to the live profile page |
| Friends (state, add, remove) | real | truthful in-memory states + actions | done | friends API (states: none/requested/incoming/friend) | person card | ✓ | ✓ | ✓ | ✓ | READY WITH LIVE PORT |
| Friend requests (accept / decline) | assumed with friends — **verify exact states** | notification row answers in place; person card agrees | done | requests API | notifications · person card | ✓ 36px actions | ✓ | ✓ | ✓ | READY WITH LIVE PORT; UNKNOWN — exact state machine to confirm against backend |
| Family (relationship context) | real (family tree exists) | Family as a distinct relationship on the person card | done | family relations API | person card · search | ✓ | ✓ | band-only | ✓ | READY WITH LIVE PORT — display context only; tree editing untouched |
| Friends/Family pages (tabs, grid, Unfriend) | real | not rebuilt — the person card is the reference pattern | pattern done | existing | existing live pages | — | — | apply band rule | — | PRESERVE EXISTING LIVE BEHAVIOUR (re-skin with tokens + person-card grammar) |
| People discovery (search) | real | people results: ring, band, relationship chip → person card | done | search API | search utility | ✓ | ✓ | band-only, own exact allowed | ✓ | READY |
| Search (photos, moments, places) | real | accepted | done | search API | utility | ✓ | ✓ | ✓ | ✓ | READY |
| Notifications | real | accepted + actionable request rows | done | notifications API | bell utility | ✓ | ✓ | ✓ | ✓ | READY |
| Messages utility + conversations list | real (chat) | truthful panel, unread from state | done | chat API | Messages utility | list → `/chat` | panel → mini chat | no life data in chat | ✓ | READY WITH LIVE PORT |
| Desktop mini chat | — (new presentation) | one dock: open/minimise/close, send, focus managed | done | chat API | Messages panel · person → Message | n/a (hidden <1024) | ✓ | ✓ | ✓ | READY WITH LIVE PORT |
| Full Chat | real — **separately hosted with its own login** | `/chat`: list + conversation (desktop split, phone stack), same brand/theme/identity | done | **shared SYSTEMBOOM session / SSO handoff** | `/chat`, `?c=<person>` | ✓ | ✓ | ✓ | ✓ | READY WITH LIVE PORT — the auth boundary is the work |
| Chat offline / reconnect / delivery states | live behaviour unknown | not simulated (honest) | documented | websocket infra | — | — | — | — | — | UNKNOWN — OWNER / BACKEND CONTRACT REQUIRED |
| Life / Circle of Life | live widget + timeline | accepted (Phase 5, parked) | done | `circle-of-life-spec.md` | `/life`; hero Circle row; Circle module | ✓ | ✓ | ✓ | ✓ | READY |
| Appearance (dark/light) | live has themes | one store; bar toggle ≥672px, account-menu Appearance below | done | user preference storage | account menu / bar | ✓ | ✓ | — | named controls | READY |
| Account menu | real destinations exist | Statistics/Weather/Exchange/Settings marked "later"; Appearance; real Logout | done | existing pages | avatar control | ✓ | ✓ | — | menu semantics | PRESERVE EXISTING LIVE BEHAVIOUR for the "later" pages |
| Logout | real | ends the session, returns to Cosmos; My World asks for identity again | done | real session teardown | account menu | ✓ | ✓ | ✓ | ✓ | READY |
| Settings / privacy settings | exist live (assumed with account) | not prototyped | placement documented | existing | account menu | — | — | — | — | PRESERVE EXISTING LIVE BEHAVIOUR; UNKNOWN — exact scope |
| Block / report / mute | Moment-level Report + Hide exist (accepted); account-level block/mute **unknown** | Report + Hide on Moments; note Report | done for Moments | safety API | Moment ⋯ menus | ✓ | ✓ | ✓ | ✓ | Moment-level READY. Account-level: UNKNOWN — OWNER / BACKEND CONTRACT REQUIRED. **If the live product lacks person-level block for launch, treat as LAUNCH SAFETY ITEM P1** |
| Media handling | real uploads | fixtures; own-aspect; **failure fallback keeps the Moment's structure** | done | upload pipeline w/h | — | ✓ | ✓ | ✓ | alt text | READY |
| Loading states | live async | not faked; hierarchy documented in `people-chat-integration.md` §7 | documented | — | — | — | — | — | — | READY WITH LIVE PORT |
| Empty states | — | Moments end-sentence, notifications, search, conversations, new conversation | done | — | — | ✓ | ✓ | — | — | READY (no empty-Moments fixture; copy specified) |
| Error states | — | media fallback; composer/note failure with Retry (accepted) | done | — | — | ✓ | ✓ | — | — | READY |
| Direct URLs / back / forward / refresh | — | `/world` `/life` `/chat` `/chat?c=` all direct; Back restores context | done | — | — | ✓ | ✓ | — | — | READY |
| Devanagari | real content | Moments, search, notifications, chat (mini + full + mobile) | done | — | — | ✓ | ✓ | — | — | READY |
| Ancestors | family tree exists; pre-birth model future | not built (owner rule: personal life begins at birth) | seam documented | — | — | — | — | — | — | DEFERRED |

## Launch classification summary

- **P0 BLOCKERS: none.** Every P0-class question (auth boundary honesty, privacy
  leaks, exit from the account, essential loops, mobile navigation) is resolved
  in the reference or truthfully classified.
- **P1 REQUIRED FOR LIVE PORT:** shared SYSTEMBOOM session for Chat (no second
  login); server-side identity guarding of personal routes; friends/requests
  state machine mapped to the real backend; person-level block/report decision
  (safety); message + notification unread fed by real sources.
- **P2 POST-LAUNCH:** offline/reconnect presentation for Chat; Friends/Family
  page re-skin; settings/privacy screens in the My World shell; Ancestors.
