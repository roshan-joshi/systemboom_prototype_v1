# SYSTEMBOOM — Moment conversation model (R3)

The human discussion attached to one Moment. Accepted 2026-09-15. The tests
(`prototype-tests/social-r3-3d-expression.js`, plus the accepted suites) and the evidence
are authoritative where prose and behaviour disagree.

## 1. Vocabulary audit and decision (R3 §41–§43, §112)

**What the model actually contained.** Two distinct objects had grown up side by side:

| storage | what it was | how it surfaced |
|---|---|---|
| `Moment.responses` / `responders` / `respondedByViewer` | an anonymous acknowledgement TAP with a count | a "Respond" toggle + "3 responses" + a who-responded list |
| `Moment.notes[]` (`Note`, with `parentId`) | the written conversation | "1 note" / "Write a note…" / "Reply" |

They are genuinely different objects — but the interface put two competing conversation
counts on one row ("3 responses · 1 note"), which is exactly what §42 forbids.

**Decision.** R2 gave feeling a proper home in the Expression language. A second anonymous
"+1" is therefore the redundant one — and it is precisely the like-economy this product
rejects. So:

| term | meaning | status |
|---|---|---|
| **RESPOND** | the primary human verb — it WRITES. Opens this Moment's conversation with the cursor in the composer. | kept, and it now does the thing its name promises |
| **RESPONSES** | the written conversation attached to the Moment | this is what `Note[]` is called everywhere a person can read it |
| **REPLY** | a direct reply to an existing response — supported by `Note.parentId`, one level deep | kept, unchanged |
| **NOTE** | — | **removed from the user-facing vocabulary.** `Note` / `notes` remain the storage names for code compatibility (§43) |
| the Respond TAP | an anonymous acknowledgement count | **retired.** Fields stay in the model (no data change, no fiction); nothing surfaces them |

Owner-superseded assertions are recorded in AGENTS.md — the invariants they protected were
re-pointed at their successors, none were weakened.

## 2. The action area (§44–§47)

```
[ Respond ]  [ mascot Expression ]                          [ View in Life ]  [ ⋯ ]
 ·· mascot heads · 3      2 responses                        ← quiet presence line
```

One clean ACTION row (verb · feeling · secondary menu) that never wraps at 320/360, and
beneath it one quiet PRESENCE line. Presence is information, not a row of actions — which
is why it is not competing for the action row. It answers **"are people here?"**, never
"how popular is this?" (§45, §39): at most three distinct mascot expressions, the number of
people who felt something, and the response count. No percentages, no ranking, no "top",
no streaks, and engagement never changes a Moment's size or position in the Almanac (§85–§86).

## 3. Adaptive conversation depth (§48–§50)

| depth | phone (< 672px) | desktop |
|---|---|---|
| 0 responses | "Write a response" opens the composer inline | same |
| 1–2 responses | inline in the Almanac | inline |
| 3+ responses | a **focused Moment Conversation surface** | stays inline — the Moment remains visible beside it |

The focused surface carries a compact MEMORY HEADER so the reader never loses what is being
discussed: back, the author's photo + Life Ring, their safe life position, the Moment's
date · place, a one-line excerpt, and the media thumbnail where one exists. Then the
responses, then the composer above the keyboard with the home-indicator inset respected.

It is still ONE Moment's conversation (§51): no conversation list, no presence dots, no
typing status, no direct-message controls. Chat remains a separate product.

## 4. The Response Branch (§52)

One hairline stroke from the Almanac spine into the conversation — conversation emerging
from a memory, never a per-comment tree. Remove every name and every word and the geometry
still says *this discussion belongs to this Moment* (§108). Prohibited: thread trees,
stacked chat bubbles, comment cards, timeline-node soup (§33, §53).

## 5. A response (§53–§56)

Human first: small real photo + compressed Life Ring, name, then the words at conversational
line-height. No bubble, no card, no box. Metadata (time, edited) is subordinate. Actions are
**Reply** and a quiet ⋯ for the author's own management (edit / delete) or Report. There is
deliberately **no reaction under a response** (§56–§57) — expressions stay attached to the
Moment; reactions on responses create recursive clutter and are not built.

Selecting a response's author opens their Person World (§44 of R2), and another person's
exact Life precision is never shown (§54).

Ordering is truthful and chronological. No "Top", "Best", "Most relevant" or AI ranking (§41).

## 6. Composer (§58–§61)

Avatar · input · Send. Native Unicode emoji through the person's own keyboard — no custom
emoji picker is built, because the operating system already has an excellent one (§61).
Mascot Expressions do **not** replace 😂 ❤️ 🙏 🔥 (§60): they are SYSTEMBOOM's emotional
action language, the emoji are the person's own words.

Failure never discards typed text: the response is kept with a Retry (accepted, unchanged).
A just-sent response settles once at its truthful place (~180ms) and is then still (§49).

Sticker-scale mascot inside a response is **not faked** (§59): `Note` carries text only. The
additive live contract, when wanted, is `Note.expression?: ExpressionId` rendered as a
one-shot sticker — play once on insert or intentional tap, never looping. The visual
primitive already exists; the schema is not invented.

## 7. Privacy (§88–§90, §101–§102)

Responses and expressions inherit the Moment's own visibility. A person who cannot see a
Moment can never see or infer its conversation or its expressions. Health and Problem remain
records, not performances: no Respond, no Expression control, no aggregate, no conversation.
"View as public" shows exactly what a genuine visitor receives — no owner-only who-list, and
no creator analytics anywhere (§87).

## 8. Live port seams

- `POST /moments/{id}/responses {text, parentId?}` → the written conversation
- `PATCH` / `DELETE /responses/{id}` → author management (already modelled)
- response events may surface through the existing notification model — Notifications are
  not redesigned here (§104 of R2)
- ordering is server-truthful chronology; the client adds no ranking
- the retired tap's fields (`responses`, `responders`, `respondedByViewer`) are **not** part
  of the live contract; do not port them as a like counter.
