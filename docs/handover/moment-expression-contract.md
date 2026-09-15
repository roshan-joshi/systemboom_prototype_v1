# SYSTEMBOOM — Moment Expression contract (R2 handover)

Accepted 2026-09-14. Boom Expressions are an OWNER PRODUCT DECISION (R2): SYSTEMBOOM has
its own mascot-based expression language around a Moment. This supersedes the earlier
blanket "no custom reaction sets" rule — while everything that rule actually protected
stays protected: no like economy, no popularity metrics, no ranking, no engagement
mechanics, no reaction targets on Health/Problem. The prototype implementation is honest
LOCAL React state (`store.tsx` `express` action); nothing here pretends to be a backend.

## 1. The primitive

A **Moment Expression** is one viewer's single emotional acknowledgement of one Moment:

```
MomentExpression {
  momentId:  string          // the Moment
  personId:  string          // the expressing viewer
  expression: "care" | "joy" | "wonder" | "support" | "celebrate" | "respect"
  updatedAt: ISO-8601        // live system; the prototype does not fabricate one
}
```

**Single-active invariant:** at most ONE row per (momentId, personId). A new choice
REPLACES the old; remove deletes the row. The prototype stores this as
`Moment.expressions?: Record<personId, expressionId>` (additive optional field on the
frozen Moment model — recorded in AGENTS.md) and enforces the invariant in the reducer.

Expressions are FEELING, never status: no totals ranked, no "top" anything, the aggregate
is registry-ordered marks + one count. They change nothing else — not Life (ring,
position, density, colour), not relationships, not privacy.

## 2. The expression set (§6)

| id | semantic (en, localized ×8) | accent (inside the expressive object only) | mark |
|---|---|---|---|
| care | Care | #E05A7E | heart |
| joy | Joy | #E8A13C | two laugh arcs (+ the mascot's one-shot lift) |
| wonder | Wonder | #5FA8E6 | four-point star |
| support | Support | #3E9E78 | cradling arc under the mascot |
| celebrate | Celebrate | #D92A20 (boom red) | tiny spark burst (+ four local particles, one event) |
| respect | Respect | #8E7CC3 | grounded laurel |

No angry / dislike / downvote / mocking — one tap must not carry low-context hostility.

## 3. Mascot + asset architecture (§7–§10, §78, §135)

Canonical audit: `prototype-evidence/social-r2-expression/15-mascot-source-audit.md`.
The only brand mascot is the RASTER bomb in the official logo; per §9 it is never redrawn
— `public/brand/systemboom-mascot.png` is an alpha-bounded crop, and each Expression is
the SAME canonical character plus a small surrounding SVG mark. One registry
(`src/components/style-lab/social/expressions.tsx` → `EXPRESSIONS`) holds id, localized
semantic name, accent, mark, placement and motion metadata; UI never hardcodes per-
expression JSX. The registry + `MascotExpression` component are the reusable primitive
for later surfaces (Chat, native sticker keyboards, marketing) — none built now. If a
vector mascot is ever produced, only the registry's renderer changes.

Motion (§13–§16, §53): QUICK ARRIVAL (300ms, 1.08 overshoot) → mark resolve (260ms,
140ms delay) → ONE Boom Pulse ring (420ms) → calm settle. CSS keyframes only, one-shot,
event-driven; feed summaries NEVER animate on their own; reduced motion collapses to the
final state via the existing global rule. Strong static state for every expression
(screenshots / low power / share).

## 4. Live API requirements (§133–§134 — additive, not built)

- `PUT   /moments/{id}/expression   {expression}`  — create/replace (idempotent per viewer)
- `DELETE /moments/{id}/expression`                — remove
- `GET   /moments/{id}/expressions`                — aggregate `{counts by id, viewerExpression}` + pageable who-list (photo, name, expression; **no exact Life precision**)
- Visibility: inherited from the Moment. A person who cannot see the Moment can never see
  or infer its Expressions (aggregates must not leak Health/Problem or hidden Moments).
  Health/Problem accept NO expressions server-side (the client never offers them).
- Optimistic client update is acceptable (reversible); on failure restore the previous
  expression and say so quietly.
- Real-time seam: an `expression-updated {momentId, counts}` event may refresh aggregates;
  the prototype simulates nothing.
- Notifications seam: a first Expression on your Moment MAY surface through the existing
  notification model (`kind` additive) — Notifications are not redesigned here.

## 5. Moment conversation (audited existing model — §29, §45)

Responses ("notes") keep the accepted semantics, unchanged: flat + ONE reply level
(`parentId`), chronological truthful order (no "Top"/"Best"/AI ranking), owner edit/
delete, report for others, failure keeps the text with Retry, visibility inherited from
the Moment. R2 added presentation only: the RESPONSE BRANCH (one hairline stroke from the
Almanac spine into the conversation), a one-line recent-response preview in the collapsed
feed, a `sb-reveal` settle on the just-sent response, response author → Person World, and
localized notes chrome (en byte-identical to the accepted strings/selectors).

**Mascot expression INSIDE a response (§38):** the Note model carries text only; sending a
sticker-scale mascot would require a schema invention, so it is NOT faked. Additive live
contract when wanted: `Note.expression?: ExpressionId` rendered as a small one-shot
sticker (play once on insert/tap, then static, never looping). The visual primitive
(`MascotExpression size≈48`) already exists for it.

## 6. Instagram learning audit (§131)

Worth learning: (1) expression is ONE tap from the content, never a menu dive; (2) the
committed state answers instantly and optimistically; (3) the reaction picker is a small
rail at the point of action, not a page.
Must NOT copy: (1) the heart as universal value / like counts as status; (2) comment
ranking and "most relevant" reordering of human conversation; (3) double-tap as the
primary, undiscoverable gesture with looping celebratory animation. (Double-tap shortcut:
REJECTED here — it conflicts with photo "+N" expansion and video play targets, and the
visible control already commits in under a second. Recorded per §62.)
