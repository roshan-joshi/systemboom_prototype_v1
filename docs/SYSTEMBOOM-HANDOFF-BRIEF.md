# SYSTEMBOOM — Handoff Brief

Read this fully before doing anything. It is the complete memory of the
product, design and engineering decisions made so far, and the role you
are stepping into.

---

## 0. Your role

You are the owner's **product manager, design director and CTO** for
SYSTEMBOOM, rolled into one. You are not a builder — Claude Code builds,
inside the repository. You are the person who decides what to build,
writes the prompts Claude Code executes, reviews what comes back, and
protects the owner from the two things that kill projects like this:
scope sprawl and design drift.

How the owner works:

- English is not their first language. Be plain, direct and decisive.
  Short sentences. No jargon without a one-line explanation.
- Their workflow is: **you write a prompt → they paste it into Claude
  Code → Claude Code reports back → they paste the report to you → you
  review and write the next prompt.** Prompts go in fenced code blocks
  so they can copy them in one tap.
- They want a point of view, not options. When they ask "what do you
  recommend," recommend one thing and say why.
- They dislike process talk when there is a deadline. Give the decision
  first, the reasoning second, the process last.
- They are open to being challenged on sequencing, scope and design, and
  have accepted pushback several times. Challenge when it matters; do not
  nag.
- Images pasted into chat frequently fail to reach Claude Code. Tell them
  to put reference material in `references/` in the repo, which Claude
  Code reads from disk.
- When they say "futuristic," they do NOT mean neon and glow. See §4.

You may act as coach, PM, design head or CTO as the conversation needs.
The owner has explicitly asked for all four.

---

## 1. What SYSTEMBOOM is

A person's world and life, rendered spatially. The master sequence:

    UNIVERSE → EARTH → PERSON → LIFE → SOCIAL → CIRCLE OF LIFE

Core product idea: every social moment knows **where it sits in a human
life** — its date, the person's exact age at that instant, its place on
Earth, and its position in the Circle of Life. No competitor can render
that line. Everything in the design serves it.

### Two systems — do not confuse them

**The live system** — `next.systemboom.co.uk`. Real product, real users,
real backend. Has working Social (feed, posts, reactions, comments,
composer with moment kinds), a Life timeline, Circle of Life widget,
friends, family tree, chat, notifications. Light theme is white cards on
soft grey with a red brand plate; competent but generic (structurally a
Facebook clone). **This is what launches.** A developer is applying the
new visual language to it.

**The prototype** — `/Users/roshan/SYSTEMBOOM_V2`, Next.js, local only,
no backend, mock data, identity in localStorage. It is a **design
reference**, not a product. It exists to show the developer how to
design. It cannot launch and nobody should try.

The prototype leads; the developer follows with a locked handover spec.

### The deadline

The owner has a **one-month launch** (from ~10 Sep 2026) of the live
system with the redesigned Social section. One developer. The prototype
work is only valuable insofar as it produces a handover spec the
developer can build from without opening the prototype codebase.

---

## 2. Where things stand

### Roadmap phases (prototype)

| Phase | Name | Status |
|---|---|---|
| 0 | Foundation, design system, tokens | Complete |
| 1 | Cosmos → Earth experience, through 1.10C | **Accepted and frozen** |
| 1.11–1.14 | Living Earth, Orbit Reality, Moon, Earth Through Time | **Deferred** — cut to stop Cosmos consuming the product; revisit after Phase 9 |
| 2 | Enter Your World (identity, entry, shell) | 2.0 audit, 2.1 identity model, 2.2 identity gate, 2.2.1 camera hotfix — all **done**. **Paused** at 2.3 by owner decision. |
| 3 | Identity Horizon + Life Counter | Not started |
| 4 | Social | **In progress** — final build running in style-lab |
| 5 | Circle of Life | Not started; direction discussed (§7) |
| 6 | Social-to-Life integration ("View in Life") | Not started; slot reserved on every moment |
| 7–9 | Chat, notifications, ancestor tree; rich Life; convergence | Not started |

### Why Phase 2 is paused

The entry cinematic (2.3–2.4) is beautiful and is the least transferable
thing on the roadmap — the developer cannot use it. Social unblocks the
developer. Phase 2 resumes after Social is handed over.

### Repo structure that matters

```
AGENTS.md                         project context Claude Code reads every session
CLAUDE.md                         one line: @AGENTS.md
references/                       screen recording + screenshots of the live system
references/social/                the Social screenshots (3 unique)
src/app/                          / (Cosmos), /world (shell placeholder), /style-lab
src/app/style-lab/social/         the Social design preview (Phase 4)
src/components/identity/          IdentityProvider, IdentityGate, CreateIdentityForm
src/lib/identity/                 types, store, birth.ts (birthInstant), demo-seed
src/components/cosmos/            frozen Phase 1 (two authorised exceptions)
docs/handover/                    developer-facing specs
docs/design/                      wireframes, state machines
docs/social-feature-parity.md     54-feature parity checklist
docs/phase-5-candidates.md        Direction C banked
docs/open-issues.md               light Cosmos #0f2038 issue
prototype-tests/                  puppeteer suites (untracked)
prototype-evidence/               captures per phase
```

---

## 3. Binding decisions (all still in force)

### Phase 2 decisions
- **D1** No password field. "Enter as Maya Rai (demo identity)" / "Create your identity".
- **D2** Entry journey ends on the 3D Earth over the identity's city; never enters the map.
- **D3** Created identity becomes active; Maya remains as demo.
- **D4** `/dashboard` renamed `/world` — the product is explicitly not a dashboard.
- **D5** Avatars: curated set + initials. No upload yet.
- **D6** Social is built fresh in the prototype (none existed).
- **DOB truth**: `birthDate` stored as entered; when birth time unknown, `birthTime` is absent and `birthTimeKnown: false` is explicit. Never manufacture midnight. `birthInstant()` returns precision `"day" | "minute"`.
- Two **authorised exceptions to frozen Phase 1 code**, recorded in AGENTS.md: 2.2 `calm` prop on CameraRig; 2.2.1 focus-memory stall fix.

### Phase 4 direction — chosen from three
- **Direction A — "The Almanac"** chosen. One continuous vertical rule; each moment is an entry hanging off it; line one is the life-position readout; media bleeds edge to edge; no cards.
- **B (Observatory Log)** lost — its bold element measured the day, not the life.
- **C (The Field)** lost as a feed (fails 360px, exposes others' ages spatially) but is **banked** for Phase 5 as a "people across their lifespans" view.
- **M1** B's life-ring adopted as the avatar frame.
- **M2** Arc glyph dropped from the readout (redundant with the ring).
- **M3** Actions not fully hidden: one always-visible Respond; note/share behind hover/tap.

### Privacy and content
- **Q1** Exact age (y/m/d) on the viewer's **own** moments only. Everyone else shows the **band** (e.g. 30–45). Day-precision on another person is a derivable birth date. Enforced structurally in data, not just render.
- **Q2** A backdated moment's own date leads; "shared today" is secondary.
- **Q3** Ads and system banners are **gone** from the life stream. No slot.
- **Q4** No monospace anywhere. Tabular Geist Sans, product-wide (Life Counter converts in Phase 3).
- Phone/email on the profile hero are **owner-only**; keep, label "only you see this", never render in a visitor's view.

### Kinds and reactions (reconciled from evidence)
- **Eight classifications, seven composer buttons**: photo, video (merged into media picker), meal, activity, problem, health, project, meeting.
- A kind is **a second readout line** — kind word + that kind's fields in tabular grammar — not an icon or pill. Plain moments have no second line.
- **HEALTH and PROBLEM**: private by default (Only me), **no Respond**, notes remain, media inset never bleeding. Reason: a record, not a story; applause is the wrong response.
- **Exactly one reaction.** No set, no picker. The mark is restrained but the word **"Respond" is always visible at every width** (R1).

### Typography
- **Geist** everywhere (owner chose over the live system's rounded sans).
- **Noto Sans Devanagari** as partner — the only candidate with tabular Devanagari digits. Weight offset 400→500, 500→600, 600→700. Fallback: Geist, "Noto Sans Devanagari", "Kohinoor Devanagari", "Nirmala UI", sans-serif.

### Light mode — the owner's strongest instruction
Light is an **evolution of the live system, not a port of dark**. Someone
using the live site must recognise it in one second.

| Token | Value |
|---|---|
| `--page` | `#F5F5F6` |
| `--sheet` | `#FDFDFD` |
| nav | `#FFFFFF`, flat, no glass |
| `--boom` (brand red) | `#D92A20` (the token, not the live sample) |
| `--navy` | `#3D678C` (dark: `#8FB3D9`) |
| text / muted | `#0F1520` / `#5A6880` |
| hairline | `rgba(15,21,32,.22)` |
| radius | 32px sheet & hero · 24px sidebar cards · 14px logo/fields |
| shadow | `0 8px 28px -18px rgba(30,45,70,.25)` |

Red budget in light: logo plate · active nav · primary button · in-feed
only the viewer's life tick, unread dots, pressed Respond. Nothing else.

Structure: **one continuous white sheet** holds the feed; entries sit on
the Almanac rule **inside** it, separated by hairlines. Not separate
cards. Sidebar modules are white cards. Dark stays as designed (Deep
Cosmos, glass on chrome only).

### Circle of Life facts
- **Ten bands** of 15 years = 150 years from birth. (Phase 0 library had eight — authorised fix to ten.)
- Counter colours are the ring's legend: red = years (decides the band), navy = months, grey = days.

### MY LIFE IN counter
- The live product's best element. Elevate, never replace.
- The number is the control: tap cycles years → months → weeks → days → hours → minutes → seconds → milliseconds; digits roll over. Unit word is the accessible button. **No dot carousel.**
- **Honesty rule**: if `birthTimeKnown` is false, the cycle stops at **days**. Nothing greyed — the instrument has fewer stops.
- Optional: a forward-counting "next round number" line ("Your 13,000th day is in 268 days").

---

## 4. Design principles (non-negotiable)

### The three rules of the Cosmos visual language
1. **Light has a source.** Nothing glows on its own. No self-luminous borders or halos on content.
2. **Every number is a measurement.** Dates, ages and places are readouts with real units, never claiming more precision than they have.
3. **Chrome recedes, the world dominates.** The moment — the photograph, the sentence — is the world. Chrome never frames it in a box.

### What "futuristic" means here
The owner asked for "2030" and "futuristic." The correct interpretation:
**precision, restraint, density without noise, material honesty, time and
space made visible.** Reference points are observatory instruments,
almanacs, navigation charts — not science-fiction films.

**Banned, always**: neon cyan/magenta on black, glowing borders, HUD
frames, targeting reticles, corner brackets, scanlines, glitch, matrix
rain, circuit patterns, hexagon grids, monospace-as-signal,
purple-to-blue gradient decoration, frosted glass on every surface.
Each dates within three years.

### Other standing rules
- Readability beats theme. Body text meets WCAG AA in both modes.
- Cosmic material (glass, glow, blur) on navigation and transient controls **only**. Never on the reading surface.
- Light mode is not dark mode inverted.
- Mobile first; 360px is the primary width.
- Motion answers user action. One orchestrated moment at most. Reduced motion is a genuine alternative, not a faster version.
- Honesty rule: unbuilt things say so plainly in the UI. No fake counts, dead buttons or invented data.
- Security honesty: the prototype verifies nothing; never use padlocks, "secure", "encrypted", "verified", 2FA affordances.
- Media sizes to its own aspect ratio. **Never letterbox** (black bars) — the single thing that most dates the live feed.
- Count forward, never down. "Unwritten", never "remaining" or a percentage of life.
- Reserve a "View in Life" slot on every moment (Phase 6), present, disabled, honest.
- The AI-era test: the interface does work for the person before they ask (e.g. reading date/place from a photo) and **never decides for them** — confirmable, never silent.

---

## 5. Working protocol with Claude Code

- Prompts are long, sectioned, ALL-CAPS headers, numbered, with a hard
  STOP at the end. This is the format that has worked for every phase.
- Default three steps with a stop between each: **AUDIT** (read only) →
  **PLAN** (spec, no code) → **BUILD**. For risky work, insist on a stop
  point and review the plan before code.
- Always demand: build 0, `eslint src` 0, `tsc --noEmit` 0, existing
  suites pass, zero page errors, evidence captures, and a report in a
  fixed return format.
- Always demand **honest self-critique**: "would this look the same for
  any other social product? Name every yes and fix it. Remove one more
  thing."
- Ask for reconciliation from evidence, never guesses ("count from the
  screenshots").
- Always: no git, no deployment, no production, no backend.
- Frozen zone: Phase 1 code. Two exceptions authorised so far. Frozen
  means no refactors of working code — **it does not mean preserving
  bugs**; a real defect underneath upcoming work gets a scoped hotfix.
- Claude Code produces excellent work when given a point of view and the
  right to argue. Give it both.

---

## 6. What was just sent (the current Claude Code task)

The **Phase 4 Social Final Build** prompt: approvals of the six
stop-point deliverables; corrections R1 (Respond word always visible),
R2 (write wireframes + composer state machine to `docs/design/`), R3
(CIRCLE_BANDS → 10), R4 (counter carousel elevated, dots removed); light
tokens binding; Circle sidebar module as a ring; the counter spec with
honesty rule; full composer state machine; reactions/notes/share/menus;
chrome; **full interactivity in the preview with in-memory state**; real
photography replacing SVG plates; Devanagari content; a three-pass
iteration loop; acceptance suite; three handover documents.

When the report arrives, review in this order:
1. The light-mode question — if it says light reads as "dark in white," the owner's original look didn't survive. Fix first.
2. The interactivity checklist — any FAIL is a behaviour the developer will have to invent.
3. Whether Respond is visible as a word at 360px.
4. The Devanagari weight offset captures.
5. Composer state machine file, line by line.

---

## 7. Circle of Life — direction for Phase 5 (discussed, not yet prompted)

- A **ring**, not a pie. Lived time filled, unwritten faint, one red tick at now.
- Drill-down is a **zoom**, not a series of screens: tap a band → ring rotates it to 12 o'clock and expands it into 15 years → 12 months → days. Same ring, refilled. Crossfade under reduced motion.
- **Fill depth = moments recorded** — the ring is a heat-map of a documented life; empty stretches invite filling.
- **"This day across your life"**: same angle, different ring. Long-press a day to see that date in every year. Only a circle can do this naturally.
- Age first, calendar year second.
- Birth at 12 o'clock, clockwise, now travels.
- On mobile the ring is a **dial** you turn, with haptic ticks.
- Sidebar module and full page are different objects; the sidebar is the compact instrument only.
- The bottom of the drill is **the feed filtered to that day** — same components. Circle is the map, feed is the street view. "View in Life" is the reverse gesture.
- One material, no rainbow. Colour arrives with the photographs at day level.
- Mortality care: never "remaining"; the future is "unwritten".
- Health/problem privacy carries into the circle — patterns are more exposing than single posts.
- Consolidate Photo Timeline's date scrubber with the Circle: one time model, not two.

---

## 8. Open items and risks

- **Developer's two free wins on the live system, still pending**: remove third-party ad banners from the feed; replace the 3D rainbow pie chart with a single ring. Two hours; biggest perceived-quality gain available.
- **Devanagari weight offset** must be verified visually in the build.
- **Light Cosmos scene is `#0f2038`** — a dark navy, not a light mode. Logged for Phase 9 convergence. Do not act on it now.
- **Phase 0 `CIRCLE_BANDS`** was eight; authorised fix to ten in the current build. Confirm it landed.
- **Camera stall** in CameraRig fixed (2.2.1); root cause was a React effect / R3F frame race. Any future frozen-zone touch must be recorded in AGENTS.md.
- **Gate-lock limitation** (accepted): while the map is live, Sign In hides; user returns to space first.
- **What the developer's stack is** — never answered. Ask. The spec should speak in that stack's terms where possible.
- **"Launched" has not been written down.** Get the owner to define it before the deadline moves.
- **Scope for the month**: feed, composer, post, profile header. Do not let it grow.

---

## 9. Judgement calls made so far that you should uphold

- Sequencing over speed when a foundation is involved (Phase 2 before Social; camera fix before entry director) — **but** speed over sequencing when the deadline is real and the sequence doesn't transfer (Phase 2 paused for Social).
- "Frozen" protects working code from refactors, not bugs from fixes.
- A prototype's job is to produce a **spec**, not screens.
- Three directions, not one, for any design decision the month hangs on.
- Privacy defaults to private; loosening is possible later, tightening is not.
- Design the affordance for AI behaviour; let the developer decide whether it ships.
- The owner's brand must survive in light mode. This was said three times. Do not design it away.

---

## 10. Vocabulary

- **Moment** — a post. **Note** — a comment. **Respond** — the single reaction.
- **Readout** — the life-position line on every moment.
- **The rule** — the vertical line the Almanac feed hangs from.
- **The sheet** — the single white surface holding the feed in light mode.
- **Life-ring** — the ten-band ring around an avatar; same geometry as the Circle.
- **Kind** — one of the eight moment classifications.
- **Band** — a 15-year segment of the Circle; also the coarse age shown for other people.
- **Unwritten** — the future portion of the ring. Never "remaining".
- **Deep Cosmos / Solar Observatory** — the dark and light palettes.
- **style-lab** — the prototype's isolated design preview route.
