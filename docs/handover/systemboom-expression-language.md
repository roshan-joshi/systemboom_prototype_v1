# SYSTEMBOOM — the Expression language (R3 · art direction R3.1)

SYSTEMBOOM's own emotional action language: **eighteen** feelings a person can attach to a
Moment, carried by the SYSTEMBOOM mascot. It is not a reaction economy — one viewer holds
at most ONE expression per Moment, nothing is ranked, and no number is ever presented as
status. Interaction accepted 2026-09-15; the art direction was reopened the same day by
R3.1 ("the current expression system looks too dull") and rebuilt as the Quick **Deck** and
the Expression **Library** on the owner's real 3D mascot.

**Honest status:** the per-expression FACES are still ART ASSET BLOCKED — one pose was
supplied, so all eighteen currently wear the same face. R3.2 then finished the QUICK SIX's
interaction, motion, touch and asset system and tested the art capability by experiment
(there is no 3D renderer and no image-generation model here; Care and Support both need a
closed, non-grinning mouth that 2D cannot synthesise). See **`quick-six-render-briefs.md`**
first, then `expression-render-briefs.md` for the extended twelve, and the judgement board
`prototype-evidence/social-r3-2-signature-expression/01-quick-six-no-label-no-mark.png`.

Companion documents: `expression-asset-contract.md` (assets, poses, motion, the blocked 3D
renders), `moment-conversation-model.md` (Respond · Responses · Reply), `moment-expression-
contract.md` (the R2 data/live contract, still current).

## Why a mascot and not emoji

Unicode emoji are the person's own words and stay exactly that (§60). The mascot language
is the *action* layer: it says how a MOMENT — a person at a point in their life — landed
with you. One tap, one feeling, reversible, attached to the memory rather than to content.

## The eighteen

**Quick six** — one tap from the Moment, instantly understandable, highest art quality:
`Care · Joy · Laugh · Wow · Celebrate · Support`

**The rest** — one affordance away, behind **More**, all eighteen shown in the Library WITH
their names because the names are how the language is learned (R3 §27, §64). They are
ordered by **emotional group**, which is structure and air — never a tab, never a label:

| group | expressions |
|---|---|
| energy | Proud · Speechless |
| warmth | Love · Thanks · Touched · With you |
| thought | Respect · Inspired · Curious · Agree · Thinking · Nostalgia |

R3.1 §14 resolved one duplication: **Surprised** was dropped (it was Wow twice) and
**Nostalgia** took the slot — a life-memory emotion this product needed and had no word for.

Each has exactly one primary human meaning; two expressions may never need their label to
be told apart (§10). The semantic pairs that were deliberately separated:

| pair | difference |
|---|---|
| Care ↔ Touched | Care GIVES warmth (leans in, heart). Touched RECEIVES impact (drawn inward, ripple). |
| Joy ↔ Laugh | Joy is buoyant happiness (lift). Laugh is funny (rocked back 14°, one side-rock). |
| Wow ↔ Inspired | Wow is surprise (recoil, flare). Inspired is aspiration (rises, looks up). |
| Support ↔ With you | Support is steady and protective (planted). With you is empathy and presence (stands beside, calm). |
| Care ↔ Love | Care is warmth offered outward. Love is the stronger, held feeling — distinct in every locale, not one word twice (R3.1 §12). |
| Agree ↔ Respect | Agree is assent to what was said. Respect is recognition of the person. |

**Not in the set, deliberately:** angry, hate, dislike, downvote, mocking, sarcastic (§23) —
a one-tap negative strips human context; a person who disagrees can Respond with words.
**Reserved:** BOOM, once its meaning is proven with people (§24).

## Motion personality

ANTICIPATE → EXPRESS → **MASS IMPULSE** → BOOM PULSE → SETTLE. Shared DNA; since R3.2 the
quick six each carry their own **tempo and gesture** — Care 360ms soft · Joy 300ms light ·
Laugh 400ms playful · Wow 260ms sharp · Celebrate 460ms energetic · Support 380ms grounded —
and their own fuse voice (warm · lift · **wobble** · flare · burst · steady). The rest of the
registry keeps the three energy families (quiet 300 · warm 380 · lively 460ms). Since R3.1
there is also a separate **mass** layer: this
character is a heavy metal bomb, not a rubber emoji. `heavy` barely overshoots and lands hard
(300ms, hard-landing curve); `normal` takes one clean overshoot (360ms); `light` may bound
once (440ms, springier). The Boom Pulse is a single thin **pressure ring** leaving the
character's own edge, mass-scaled (heavy 1.62× · normal 1.85× · light 2.02×) — displaced air,
never a glow and never a Material ripple. Restrained 3D-feeling transforms only — translate,
scale, small rotate; never a spin, never a flip, never arcade motion (§33). The fuse carries
emotional charge rather than an explosion metaphor (§34). Celebrate gets one tiny local
burst, never screen confetti (§15).

**The feed is still.** Nothing animates without interaction — not on scroll, not on
intersection, not when many summaries are on screen (§36, §82, §84, §107). Reduced motion
collapses every keyframe to its final state, and the POSE survives, so the emotion is still
readable with no animation at all (§70).

## Where it appears

| surface | treatment |
|---|---|
| Moment action row | one compact control beside Respond. Empty, it wears the **neutral social mascot** — the optical head crop, calm and attentive, inviting rather than pre-stating a feeling (R3.1 §36–§38). Chosen, it shows the viewer's own settled expression |
| **Quick Deck** | six dimensional **seats** — shallow machined wells the character rests in, with a real contact shadow on the floor. **Phone: 3×2**, all six visible at 320–430, an 68px character in an 84px seat. **Desktop: one row of six**, 56px in 68px. Attention raises the character out of its seat; one caption line above the seats states the semantic name; More and Remove sit in a footer outside them. Depth comes from material, never from glow |
| Touch | tap commits. Holding and dragging across the deck **previews** — the seat lights, the character lifts, the caption names it — and commits only on an intentional release. A finger passing over a seat never plays the expression |
| **Expression Library** | all eighteen on a domed ground, larger art with room to breathe, 2–3 columns, grouped by emotion with air between the groups. Its scroller is capped to the room actually above the control, so it can never leave the screen |
| Owned seat | the chosen expression's seat deepens, its floor picks up the expression's own accent, and one small **Boom notch** sits on the rim — shape and material, never a red circle, never colour alone |
| Presence line | up to three distinct mascot **head crops** + the number of people who felt something |
| Who expressed | real photo + Life Ring + name + the mascot feeling, registry order, no ranking |

Never: on the Life Ring (§107 — Life and Expression are different systems), on individual
responses (§57), overlaid on photo content (§93), or as a permanent eighteen-icon row (§25).

## Accessibility

Every expression carries a localized semantic name (`expr.*`, all 8 locales), the rail is a
composite radiogroup (arrows move, Enter commits, Escape closes and returns focus), the
selected state reads as an owned seat + Boom notch rather than colour alone (§71, R3.1 §24),
and the commit is announced politely. Animation is decorative and never screen-reader
content (§68). Reduced motion collapses the seat's rise to instant while the state stays
fully legible, and every POSE survives.
