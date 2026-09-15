# Person + Life Identity — the reusable contract

Person + Life Identity pass · 2026-09-12. The one identity model every
SYSTEMBOOM surface renders a person from: Profile, Moment, Search, Friend,
Notification, Chat, Composer. Prototype source: `src/components/identity/
PersonIdentity.tsx` (the single entry point), `src/components/style-lab/
social/LifeRing.tsx` (the ring, unchanged single instrument at every scale),
`view-model.ts` (`ringViewFor` — the privacy boundary for density).

## 1. The model

A SYSTEMBOOM person is a **real photo surrounded by their Life Ring** — never
a generic avatar, never decoration. The ring is the compressed Circle of
Life: this person + where they are in life (band-only for anyone but
themself) + what part of that life has been documented, at the resolution
this viewer is allowed to know.

`<PersonIdentity viewer subject at? size connected? moments? label? />` is
the one component. It resolves `personViewFor` + `ringViewFor` for the
(viewer, subject) pair and renders one `<LifeRing>` — every context above
calls this, never a second avatar system.

## 2. Real photo

- **Source:** `Person.avatar` (`data.ts`) — a real, CC-licensed photograph
  (Wikimedia Commons, credited in `public/mock/social/CREDITS.md`), never a
  generated or illustrated face. Only two fixtures carry one in this
  reference (Maya the owner, Krishna as family) — deliberately, so the
  fallback path is exercised by the rest of the cast (Asha, Bikash, Ramesh,
  Prakash, M), proving the hierarchy rather than hiding it.
- **Fallback:** real photo → initials. There is no illustrated/curated-avatar
  middle tier — the earlier Phase-0 `Avatar` component's convention is
  superseded for identity surfaces (`RingAvatar` in `LifeRing.tsx`).
- **Loading / failure:** the `<img>` carries `data-sb-identity-photo`; an
  `onError` swaps it for the same initials tile (`data-sb-identity-initials`)
  — never a broken-image icon, never a collapsed ring. Verified by forcing a
  404 on the owner's hero photo (`person-life-identity.js` §2).
- **Responsive images:** `object-fit: cover`, a fixed square frame sized to
  the ring's own diameter — no separate crop editor (none exists to respect),
  no hero-resolution asset requested for a 24px avatar.

## 3. Life Ring

Unchanged geometry (`LifeRing.tsx`'s own header comment): ten 15-year bands,
birth at 12 o'clock, clockwise, lived (ice) vs unwritten (faint steel), a red
now-tick for the owner only. Nothing about this pass touches that contract.

## 4. Documented-memory density — viewer-safe

`ringViewFor(viewer, subject, at, moments?, connected?)`:

- **Omit `connected` entirely** (legacy call sites — `CircleModule`, the full
  Circle page): unchanged since Phase 5 §23 — density only for the OWNER's
  own ring. This function signature is additive; nothing already accepted
  changed behaviour.
- **Pass `connected`** (`PersonIdentity` call sites — `ProfileHero`,
  `PersonCard`): a visitor's density is aggregated **only from Moments that
  viewer may actually see** — `public` always, `friends` only when
  `connected` (friend or family — `WorldProvider.canMessage`), and **never**
  Health/Problem content or an only-me Moment, regardless of relationship.
  The aggregation SET is the safeguard — never a full count with entries
  hidden after. Position (`bandIndex`, `fraction`) is unchanged either way, so
  this cannot narrow a birth date beyond what the band already discloses.
- Verified directly (not just visually) via a dev-only probe,
  `window.__SB_RING_DENSITY(id, connected)` / `__SB_RING_DENSITY_SELF(id)`,
  exposed from `SocialPreview.tsx` only outside production —
  `person-life-identity.js` §6: a stranger sees none of Krishna's one
  friends-only Moment; a connected friend does; Maya's own two Health/Problem
  Moments never reach even a connected visitor's ring.

## 5. Relationship stays outside the ring

Friend / family / request / none is never ring geometry — it renders beside
it, as a word, a chip, an Accept/Decline pair (`PersonCard`, search rows,
notification rows). `data-sb-ring` is only ever `"own"` or `"other"`.
Likewise there is no online/presence state on an identity ring anywhere.

## 6. Scale

| Size | Context | Density shown? |
|---|---|---|
| 20–28px | Chat (mini + full), search, notifications, Moment author/notes, composer | No — `moments` is never passed; geometry only, for legibility |
| 56px | `PersonCard` | Yes — the first tier where the nuance is legible |
| 72 / 96px | `ProfileHero` (phone / desktop) | Yes |

Progressive resolution is enforced by **which callers pass `moments`**, not a
size branch inside `LifeRing` — small contexts simply never ask for density.

## 7. Interaction

- Owner's `ProfileHero` ring is a real link to `/life` (`data-sb-hero-ring-entry`,
  a normal Tab stop) — "look closer," not an unrelated destination.
- A visitor's ring carries no such entry — the person surface it opens
  (`PersonCard`, from search/Moment/notification) already is their
  viewer-safe World/Person surface; there is no separate "public preview"
  mode to drift from the real visitor path — a visitor **is** the public
  preview.
- No continuous animation, ever — the ring was already static; reduced
  motion needs nothing extra to suppress.

## 8. What this pass found and fixed (self-critique)

1. **Real-photo treatment.** The owner's fixture photo (a real, licensed
   portrait) doesn't visually match her stated 30–45 band — a photography-
   asset limitation of a two-photo reference set, not a system defect. The
   live product uses each account's own actual photo, so this mismatch
   cannot recur in production; documented rather than papered over with a
   fabricated portrait.
2. **Large Life Ring / mobile.** `ProfileHero` briefly rendered *both* its
   72px and 96px rings at once at narrow container widths — a CSS
   specificity collision from putting a responsive-visibility class on the
   same element as `LifeRing`'s own unconditional `inline-block` (via
   `PersonIdentity`'s `className`). Fixed: the visibility class moved back to
   a plain wrapper span with no competing base class; verified by computed
   style (`display:none` where expected) and re-captured evidence.
3. **Small Life Ring.** Documented-memory density's opacity nuance was barely
   perceptible at a person card's 56px. Fixed: widened `LifeRing`'s depth
   formula from a 0.35–1.0 swing to 0.28–1.0 — position/lived-unwritten
   semantics untouched.
4. **Consistency.** Two independent "is this viewer connected" computations
   existed — `PersonCard`'s `WorldProvider.canMessage` and a separate direct
   `RELATIONSHIPS` import in `ProfileHero`'s wiring — a latent drift risk if
   the fixture ever changed in one place only. Fixed: both now read the same
   `WorldProvider.canMessage` accessor.
5. **Visitor-privacy verification.** The automated "no birth-derived string"
   check scanned the whole page as a substring match, which (a) collided
   with an unrelated SVG rotation value containing "1991" by coincidence and
   (b) would have flagged the *acting visitor's own* legitimate exact-age
   self-ring elsewhere on the same page as if it leaked the *visited*
   person's data. Fixed: scoped to the visited subject's own hero markup and
   tightened the numeric match to non-digit boundaries.

## 9. View as public (Social Freeze Delta, 2026-09-12)

The owner has a real **View as public** action on their own profile
(`data-sb-view-as-public`, next to the Circle/Life row). It is not a second
page or a duplicated privacy branch: `SocialPreview` swaps in a technical
stand-in `viewer` (`PUBLIC_VIEWER` — never rendered, never named) so
`lifeViewFor` / `personViewFor` / `ringViewFor` resolve through the exact
same "other" branch a genuine stranger's request would hit. `ProfileHero`
and `CircleModule` (the latter completely unchanged) both react correctly
just by receiving a non-self viewer.

While previewing: a quiet **VIEWING AS PUBLIC** banner replaces nothing —
it sits above the cover — with a **Return to My World** button; the
Composer entry bar is hidden; the hero shows no Born row, no Contact pill,
no Life tick, no owner-only density; the Circle sidebar module renders its
band-only visitor branch. `person-life-identity.js` §11 asserts the
preview's DOM shape is identical to a genuine visitor's, field for field —
proof this is one model, not two.

Discovered while building this: `CircleModule.tsx`'s "N moments recorded
this month" line rendered for **any** viewer, unconditionally — a density
leak the ring's own owner-gating didn't reach, and invisible to `circle.js`
because its checks scope to the band-readout element only. Fixed: gated on
`own`, recorded as a frozen-zone defect fix.

## 10. Friends-privacy density — unverified, corrected (Social Freeze Delta)

The original Person + Life Identity pass let a `connected` (friend/family)
viewer's density include `privacy:"friends"` Moments. Audited against this
repo's own handover evidence (`social-api-contract.md`,
`docs/SYSTEMBOOM-HANDOFF-BRIEF.md`): **nothing confirms** that the live
product's friend/family relationship is actually what gates a `"friends"`
Moment's visibility — that's the live backend's contract, not something a
prototype can verify from the front end alone.

Per the owner's instruction, an unverified relationship must never be
assumed to unlock more than a stranger already gets. `ringViewFor`'s visitor
density now counts **`public` Moments only** — `friends`-privacy content
never contributes to anyone's density but the author's own. `connected`
stays a real parameter, threaded through every call site, specifically so
that once the live team verifies the actual contract, turning it back on is
a one-line change to the filter — not a redesign. Marked in code as:

```
FRIENDS PRIVACY BACKEND CONTRACT — VERIFY DURING LIVE PORT
```

Relationship — friend, family, anything — still never raises exact Life
precision; that was never in question and remains band-only unless a future
privacy rule says otherwise.

## 11. What not to invent

Story rings, online/presence rings, verification rings, friendship rings —
one circumference, one meaning: Life. No gamification, no "life score," no
mortality language. No crop editor. No second avatar system for any new
surface — call `PersonIdentity`.
