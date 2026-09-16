# SYSTEMBOOM — product glossary (i18n)

One authoritative translation per product concept, per locale. This glossary is the
source of truth for translators: a concept must read the **same way everywhere** in a
given locale. Translators change the catalogs (`src/lib/i18n/catalogs/<locale>.ts`) to
match this table — never invent a second wording for the same concept.

## Rules

- **SYSTEMBOOM is a brand — never translated, never transliterated.** It renders
  identically in every locale and every script.
- Concepts below are **product vocabulary**. "Moment", "World", "Life", "Circle of
  Life", "Band" are SYSTEMBOOM terms; translate them as the product's chosen word in
  each locale, then use that word consistently.
- Human content (names, places, the words inside a Moment) is **not** in this glossary
  and is **never** translated.
- QA status for every non-English column is **draft — awaiting native review**. Do not
  present any of these as native-approved (see `translation-status.md`).

## Core concepts

| Concept (en) | key(s) | es | it | nl | ru | hi | ne | zh-Hans |
|---|---|---|---|---|---|---|---|---|
| SYSTEMBOOM | — (brand) | SYSTEMBOOM | SYSTEMBOOM | SYSTEMBOOM | SYSTEMBOOM | SYSTEMBOOM | SYSTEMBOOM | SYSTEMBOOM |
| My World | `world.context.my` | Mi Mundo | Il mio mondo | Mijn wereld | Мой мир | मेरी दुनिया | मेरो संसार | 我的世界 |
| Life | `life.word` | Vida | Vita | Leven | Жизнь | जीवन | जीवन | 人生 |
| Circle of Life | `life.circleOfLife` | Círculo de la vida | Cerchio della vita | Cirkel van het leven | Круг жизни | जीवन चक्र | जीवन चक्र | 生命之环 |
| Band (Circle) | `life.band` / `life.circleBand` | banda | fascia | band | полоса | बैंड | ब्यान्ड | 区间 |
| People | `people.title` | Personas | Persone | Mensen | Люди | लोग | मानिसहरू | 联系人 |
| Messages | `chat.title` | Mensajes | Messaggi | Berichten | Сообщения | संदेश | सन्देशहरू | 私信 |
| Notifications | `notif.title` | Notificaciones | Notifiche | Meldingen | Уведомления | सूचनाएँ | सूचनाहरू | 通知 |
| Language | `lang.title` / `settings.language` | Idioma | Lingua | Taal | Язык | भाषा | भाषा | 语言 |
| Settings | `settings.title` | Ajustes | Impostazioni | Instellingen | Настройки | सेटिंग्स | सेटिङ | 设置 |
| Respond (to a Moment) | `moments.respond` | Responder | Rispondi | Reageren | Ответить | जवाब दें | जवाफ दिनुहोस् | 回应 |
| Add friend | `rel.addFriend` | Añadir amigo | Aggiungi amico | Vriend toevoegen | Добавить друга | मित्र जोड़ें | साथी थप्नुहोस् | 加为好友 |
| Friends / Family | `rel.friends` / `rel.family` | Amigos / Familia | Amici / Famiglia | Vrienden / Familie | Друзья / Семья | मित्र / परिवार | साथी / परिवार | 好友 / 家人 |

## Moment kinds (`kind.*`)

Kind labels are set in small caps in the UI (Latin locales); Cyrillic/Devanagari/CJK
use natural case (no uppercasing, §49). One word per kind per locale.

| kind | en | key |
|---|---|---|
| photo / video | PHOTO / VIDEO | `kind.photo` / `kind.video` |
| meal | MEAL | `kind.meal` |
| activity | ACTIVITY | `kind.activity` |
| problem / health | PROBLEM / HEALTH | `kind.problem` / `kind.health` |
| project / meeting | PROJECT / MEETING | `kind.project` / `kind.meeting` |

Translators: keep kind words short and concrete; they sit inline in a Moment readout.

## Appearance (theme) names

| en | key | note |
|---|---|---|
| Deep Cosmos | `account.deepCosmos` | the dark theme's product name |
| Solar Observatory | `account.solarObservatory` | the light theme's product name |

These are **product names for the themes**, not literal descriptions — translate as a
name that reads well in the locale, keeping the "deep space / bright observatory"
contrast.

## The Expression language (R3 · expanded R3.1 · 2026-09-15)

SYSTEMBOOM's eighteen-feeling mascot language. Semantic names must localize NATURALLY — they
are emotions, not slang, and must travel to every locale (§65). Avoid culture-specific
gestures in both the word and the art (§67).

| key | en | meaning to translate |
|---|---|---|
| `expr.care` | Care | warmth, affection given to someone |
| `expr.joy` | Joy | this made me happy |
| `expr.laugh` | Laugh | genuinely funny |
| `expr.wow` | Wow | surprise, amazement |
| `expr.celebrate` | Celebrate | congratulations, achievement |
| `expr.support` | Support | "I'm with you", steady — NOT celebratory |
| `expr.respect` | Respect | recognition, admiration, honour |
| `expr.thanks` | Thanks | gratitude |
| `expr.inspired` | Inspired | this motivates/moves me — aspiration, not surprise |
| `expr.curious` | Curious | interesting, tell me more |
| `expr.touched` | Touched | emotionally moved — RECEIVING, distinct from Care |
| `expr.withYou` | With you | empathy, solidarity, presence at a hard moment |
| `expr.love` | Love | the stronger, held feeling — MUST stay distinct from Care in every locale |
| `expr.proud` | Proud | pride in what this person did — on their behalf, never self-regard |
| `expr.agree` | Agree | assent to what was said, distinct from Respect (which recognises the person) |
| `expr.thinking` | Thinking | still considering this — not confusion, not doubt |
| `expr.nostalgia` | Nostalgia | fond remembering of a time — NEVER regret or sadness |
| `expr.speechless` | Speechless | no words for this — may be awe or shock, never mockery |

**Removed in R3.1 (§14):** `expr.surprised` was Wow twice; the slot became `expr.nostalgia`,
a life-memory emotion SYSTEMBOOM needed and had no word for.

**Review flags (§66, R3.1 §54):** `expr.touched`, `expr.withYou`, `expr.support` and
`expr.respect` carry emotional nuance that machine translation handles badly. So do all six
R3.1 additions, and `expr.nostalgia` most of all — it must read as fond remembering, never as
regret. They are marked `draft` until a native speaker reads them in context. Note that
`expr.care` changed in **nl** (`Warmte`) and **ne** (`स्नेह`) so `expr.love` could take the
word each had been using.

## Human Pulse (R3.3)

| key | en | meaning to translate |
|---|---|---|
| `expr.peopleN` | {n} person / {n} people | HUMANS present — never "reactions" |
| `expr.pulseAria` | {n} people expressed feelings on this Moment | presence, warm, not analytics |
| `expr.spectrumTitle` | What people felt | the detail panel's quiet title |
| `expr.whoFor` | People who expressed {name} | {name} is the localized expression name |
| `expr.back` | Back | one step back inside the panel |
| `expr.showMorePeople` | Show more people | batched reveal, no pagination jargon |

## Conversation vocabulary (R3 — supersedes "note")

| key | en | note |
|---|---|---|
| `moments.respond` | Respond | the primary verb — it WRITES |
| `moments.responsesN` | {n} response / {n} responses | the written conversation on a Moment |
| `conv.reply` | Reply | a direct reply to an existing response |
| `conv.writePlaceholder` | Write a response… | composer |

The word **note** is retired from the social conversation UI in every locale; `Note` remains
a storage name only.
