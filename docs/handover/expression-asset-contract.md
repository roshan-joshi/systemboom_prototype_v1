# SYSTEMBOOM — Expression asset contract (R3 · superseded in part by R3.1)

> **R3.1 UPDATE (2026-09-15).** The owner's 3D mascot **landed** and is shipping: the audit
> table below (“Owner 3D mascot in the repository? NO”) is superseded. The twelve-expression
> table is superseded by the eighteen of R3.1. What remains true and current is the delivery
> mechanism (`RENDERED`, the size buckets, the budgets, the framing and motion rules) — and
> the fact that the **per-expression faces are still ART ASSET BLOCKED**.
>
> The live document for the renders is **`expression-render-briefs.md`**. Read that one first.

**Status: the per-expression 3D renders are BLOCKED on artist work.** Everything else in the
expression language is built, tested and green against the slots defined here. When the
renders land, the swap is a file drop plus one line — no layout, motion, test or
accessibility work follows it.

## 1. Asset audit (R3 §3, §118)

| question | answer |
|---|---|
| Owner 3D mascot in the repository? | **R3: no. R3.1: YES** — `references/brand/WhatsApp Image 2026-09-15 at 07.40.41.png` (1055×1024, real alpha), extracted to `public/brand/expressions/neutral-{sm,md,lg,face}.webp`. One pose only. |
| What ships today | the owner's real 3D mascot, posed per expression; `sm` is an optical head crop |
| What is genuinely implemented | the twelve-expression registry, quick/extended grouping, per-expression BODY POSE (angle, lift, lean, scale, transform-origin), fuse/spark energy, supporting mark, per-energy motion timing, Boom Pulse, static reduced-motion state, a11y names, localization ×8, size buckets, the loader and its fallback |
| What remains ARTIST WORK | the per-expression 3D renders themselves — eyes, brows, mouth, and true body sculpt. Twelve expressions × three sizes = 36 files. **No facial artwork was invented** (§6, §111). |

Honest consequence: with the 2D fallback the mascot's FACE is identical across all twelve,
so the supporting mark still does more semantic work than the brief wants (§1, §5). The
pose carries what a pose honestly can. This is the R3 blocker, reported as such.

## 2. Where the renders go

```
public/brand/expressions/
  neutral-sm.webp  neutral-md.webp  neutral-lg.webp   ← shipping today
  care-sm.webp     care-md.webp     care-lg.webp
  joy-…  laugh-…  wow-…  celebrate-…  support-…
  love-…  respect-…  thanks-…  proud-…  inspired-…  curious-…
  touched-…  withyou-…  agree-…  thinking-…  nostalgia-…  speechless-…
```

Then add the ids to `RENDERED` in `src/components/style-lab/social/expressions.tsx`.
Partial delivery is supported: any id not in `RENDERED` keeps the 2D fallback, so the set
can land one expression at a time without a broken intermediate state.

## 3. Per-asset requirements

| property | requirement |
|---|---|
| Format | WebP with real alpha (AVIF acceptable if the pipeline's alpha is reliable); PNG only as a last resort |
| Sizes | `sm` 64×64 (summary/who-list), `md` 128×128 (rail, control, panel), `lg` 256×256 (future sticker/preview) |
| Budget (§76) | ≤ 24KB `sm`, ≤ 70KB `md`, ≤ 140KB `lg`. Twelve × (sm+md) ≤ ~1.1MB total, loaded on demand — never in the first Social paint (§75) |
| Framing | square canvas, mascot centred, consistent optical size across all twelve, transparent background, the artwork's own outline retained so it reads on Deep Cosmos and Solar Observatory (§81–§82) |
| Pose | the render should embody the pose listed below; the CSS transform stays as the motion layer, so a render that already carries the pose simply reads stronger |
| Prohibited | outer glow, halo, drop shadow baked in, background plate, per-locale variants, looping frames |

## 4. The twelve

| id | group | meaning | body pose (implemented) | fuse | accent | a11y key |
|---|---|---|---|---|---|---|
| `care` | quick | warmth, affection — "I care" | leans in, settles, slightly smaller | warm | `#E05A7E` | `expr.care` |
| `joy` | quick | this made me happy | buoyant lift, scales up | lift | `#E8A13C` | `expr.joy` |
| `laugh` | quick | genuinely funny | rocked back 14°, one side-rock | lift | `#E8A13C` | `expr.laugh` |
| `wow` | quick | surprise, amazement | recoil + strongest scale | flare | `#5FA8E6` | `expr.wow` |
| `celebrate` | quick | congratulations, achievement | airborne, four local sparks | burst | `#D92A20` | `expr.celebrate` |
| `support` | quick | "I'm with you", steady | planted, squared, no lift | steady | `#3E9E78` | `expr.support` |
| `respect` | extended | recognition, honour | upright, still, deliberate | calm | `#8E7CC3` | `expr.respect` |
| `thanks` | extended | gratitude | a real bow — 13° forward, lowered | warm | `#C98B3E` | `expr.thanks` |
| `inspired` | extended | this moves me | rises and looks up | lift | `#4FB0A8` | `expr.inspired` |
| `curious` | extended | interesting, tell me more | 16° head-tilt (the tilt leads, not the mark) | calm | `#6E8BC4` | `expr.curious` |
| `touched` | extended | emotionally moved (receiving) | drawn inward, smallest scale | warm | `#C2708F` | `expr.touched` |
| `withyou` | extended | empathy, solidarity | stands beside, offset, calm | steady | `#7C93A8` | `expr.withYou` |

Reserved, deliberately NOT in the twelve until its meaning is proven with users (§24):
**BOOM** — "that hit" / "exceptional". The registry accepts it without structural change.

## 5. Art direction for the renders (§110–§111)

The supplied mascot is mischievous by design — aggressive brows, large teeth. Four
expressions must be softened enough that they can sit on a serious but shareable Moment
without reading as mocking, sinister, or delighting in distress:

- **support** — brows level, mouth closed or gently set; steady, protective, not happy.
- **withyou** — calm and serious; present, not sad, never grinning.
- **touched** — softened eyes, mouth relaxed; receiving, not performing.
- **respect** — controlled, deliberate; no grin, no salute stereotype, no culture-specific
  hand sign (§67).

`celebrate`, `joy` and `laugh` may use the mascot's natural mischief fully.
No expression may use a gesture whose meaning is culture-specific (§67); the face and body
carry the semantics, the mark only supports.

## 6. Motion parameters (already implemented)

ENTRY → EMOTIONAL GESTURE → BOOM PULSE → SETTLE, one-shot, event-driven.

| energy | expressions | total |
|---|---|---|
| quiet | care, support, respect, curious, touched, withyou | 300ms |
| warm | joy, wow, thanks, inspired | 380ms |
| lively | laugh, celebrate | 460ms |

Boom Pulse: one accent ring from the character's edge, `+120ms` of the entry, fading to
nothing. Reduced motion collapses every keyframe to its final state — and the **pose
survives**, which is why the pose is a static transform on its own layer, never a keyframe.

## 7. Reuse (§77, §135)

`EXPRESSIONS` + `MascotExpression` are the reusable primitive. Nothing about them is
Social-specific: Chat, a native sticker keyboard, share sheets and marketing can render the
same registry at a different size. Those surfaces are **not** built here.
