/* SYSTEMBOOM — CELESTIAL RESONANCE, SLICE 0: registry · types · flags · localization.
   A pure-Node contract test (no browser): the frozen Primary 8, canonical phrases,
   locale completeness across all eight shipped languages, strict separation from the
   Boom ExpressionId vocabulary, and the committed feature-flag defaults.
     node prototype-tests/celestial-s0.js */
const fs = require("fs");
const path = require("path");
const R = (p) => fs.readFileSync(path.join(__dirname, "..", p), "utf8");
/* Code only: block + line comments removed, so "must not reference X" assertions test the
   implementation rather than the prose that explains why X is kept at arm's length. */
const CODE = (p) => R(p).replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed += 1; console.log(`  ✓ ${label}`); } else { failures.push(label); console.log(`  ✗ ${label}`); } };

const IDS = ["venus-love","sun-joy","meteor-laugh","comet-wow","jupiter-celebrate","saturn-support","moon-touched","mercury-curious"];
const OBJECTS = ["venus","sun","meteors","comet","jupiter","saturn","moon","mercury"];
const MEANINGS = ["love","joy","laugh","wow","celebrate","support","touched","curious"];
const PROFILES = ["attraction","radiate","rhythmic-burst","arrive","expand-significance","surround-hold-stabilize-stay","reveal","approach-inspect-pause-return"];
const LOCALES = ["en","es","it","nl","ru","hi","ne","zh-Hans"];

/* Parse a flat catalog (`"a.b": "value",`) without evaluating the module. */
function catalog(code) {
  const src = R(`src/lib/i18n/catalogs/${code}.ts`);
  const out = {};
  const re = /^\s*"([^"]+)":\s*"((?:[^"\\]|\\.)*)",?\s*$/gm;
  let m; while ((m = re.exec(src))) out[m[1]] = m[2].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return out;
}

console.log("1. Registry — the frozen Primary 8");
const reg = R("src/lib/celestial/registry.ts");
const ids = [...reg.matchAll(/resonanceId:\s*"([^"]+)"/g)].map((m) => m[1]);
ok(ids.length === 8, `exactly 8 resonances registered (found ${ids.length})`);
ok(JSON.stringify(ids) === JSON.stringify(IDS), "stable ids are exact and in canonical order");
const objs = [...reg.matchAll(/objectKey:\s*"([^"]+)"/g)].map((m) => m[1]);
ok(JSON.stringify(objs) === JSON.stringify(OBJECTS), "object keys map 1:1 to the frozen objects");
const profs = [...reg.matchAll(/motionProfile:\s*"([^"]+)"/g)].map((m) => m[1]);
ok(JSON.stringify(profs) === JSON.stringify(PROFILES), "each object carries its own distinct motion profile");
ok(new Set(profs).size === 8, "no two objects share a motion profile — not eight copies of one animation");
ok((reg.match(/status:\s*"frozen"/g) || []).length === 8, "all eight are marked frozen");
const regCode = CODE("src/lib/celestial/registry.ts");
ok(!/resonanceId:\s*"(?!(?:venus-love|sun-joy|meteor-laugh|comet-wow|jupiter-celebrate|saturn-support|moon-touched|mercury-curious)")/.test(regCode),
   "no Core-18 / Atlas / Aurora / Gratitude candidate is registered");

console.log("2. Canonical phrases (English source)");
const en = catalog("en");
const EXPECT = {
  "venus-love": ["Venus", "Love", "Closer together."],
  "sun-joy": ["Sun", "Joy", "You brightened this."],
  "meteor-laugh": ["Meteor Shower", "Laugh", "You made this lighter."],
  "comet-wow": ["Comet", "Wow", "I’t"],
  "jupiter-celebrate": ["Jupiter", "Celebrate", "This deserves a bigger sky."],
  "saturn-support": ["Saturn", "Support", "I’m with you."],
  "moon-touched": ["Moon", "Touched", "This reached me."],
  "mercury-curious": ["Mercury", "Curious", "Tell me more."],
};
OBJECTS.forEach((o, i) => ok(en[`celestial.object.${o}`] === EXPECT[IDS[i]][0], `object name: ${EXPECT[IDS[i]][0]}`));
MEANINGS.forEach((m, i) => ok(en[`celestial.meaning.${m}`] === EXPECT[IDS[i]][1], `meaning word: ${EXPECT[IDS[i]][1]}`));
ok(en["celestial.phrase.venus-love"] === "Closer together.", "phrase venus-love");
ok(en["celestial.phrase.sun-joy"] === "You brightened this.", "phrase sun-joy");
ok(en["celestial.phrase.meteor-laugh"] === "You made this lighter.", "phrase meteor-laugh");
ok(/^I\s?did(n.t| not) expect that\.$/.test(en["celestial.phrase.comet-wow"] || ""), "phrase comet-wow");
ok(en["celestial.phrase.jupiter-celebrate"] === "This deserves a bigger sky.", "phrase jupiter-celebrate");
ok(/^I.m with you\.$/.test(en["celestial.phrase.saturn-support"] || ""), "phrase saturn-support");
ok(en["celestial.phrase.moon-touched"] === "This reached me.", "phrase moon-touched");
ok(en["celestial.phrase.mercury-curious"] === "Tell me more.", "phrase mercury-curious");

console.log("3. Accessible name — system name leads, never a bare word");
const a11y = en["celestial.a11y.full"] || "";
ok(/\{object\}/.test(a11y) && /\{meaning\}/.test(a11y) && /\{phrase\}/.test(a11y), "template composes object + meaning + phrase");
ok(/^Celestial Resonance/.test(a11y), "the system name leads the accessible name");
ok(/CELESTIAL_A11Y_KEY\s*=\s*"celestial\.a11y\.full"/.test(reg), "registry exports the single shared a11y template key");

console.log("4. Localization — all eight shipped languages key-complete");
const required = [
  "celestial.system","celestial.action.resonate","celestial.field.aria","celestial.field.close",
  "celestial.field.remove","celestial.field.selected","celestial.a11y.full","celestial.summary.aria",
  "celestial.summary.who","celestial.summary.peopleN","celestial.summary.youAndN","celestial.summary.justYou",
  "celestial.notification.resonated","celestial.chat.aria","celestial.chat.who",
  // Celestial Social Universe — the shared Resonance Constellation (additive; list only grows)
  "celestial.summary.typeCount","celestial.summary.youResonated",
  "celestial.constellation.title","celestial.constellation.close","celestial.constellation.more",
  ...OBJECTS.map((o) => `celestial.object.${o}`),
  ...MEANINGS.map((m) => `celestial.meaning.${m}`),
  ...IDS.map((i) => `celestial.phrase.${i}`),
];
for (const code of LOCALES) {
  const c = catalog(code);
  const missing = required.filter((k) => !c[k] || !String(c[k]).trim());
  ok(missing.length === 0, `${code}: all ${required.length} Celestial keys present${missing.length ? ` (missing ${missing.slice(0, 3).join(", ")}…)` : ""}`);
}
for (const code of LOCALES.filter((c) => c !== "en")) {
  const c = catalog(code);
  const untranslated = IDS.filter((i) => c[`celestial.phrase.${i}`] === en[`celestial.phrase.${i}`]);
  ok(untranslated.length === 0, `${code}: canonical phrases are transcreated, not English copies`);
}

console.log("5. Separation from the Boom mascot vocabulary");
const expr = R("src/components/style-lab/social/expressions.tsx");
const exprIds = new Set([...expr.matchAll(/"(care|joy|laugh|wow|celebrate|support|love|respect|thanks|proud|inspired|curious|touched|withyou|agree|thinking|nostalgia|speechless)"/g)].map((m) => m[1]));
ok(IDS.every((i) => !exprIds.has(i)), "no resonanceId collides with any ExpressionId string");
ok(IDS.every((i) => i.includes("-")), "every resonanceId is object-qualified, never a bare emotion word");
const celestialSrc = CODE("src/lib/celestial/registry.ts") + CODE("src/lib/celestial/types.ts") + CODE("src/lib/celestial/flags.tsx");
ok(!/ExpressionId|from "\.\.\/\.\.\/components\/style-lab\/social\/expressions"|social\/expressions/.test(celestialSrc), "Celestial modules never import or reference the Boom expression module");
ok(!/Moment\.expressions|\.expressions\b/.test(celestialSrc), "Celestial modules never read the Boom expressions field");

console.log("6. Feature flags — committed defaults");
const flags = R("src/lib/celestial/flags.tsx");
const defs = flags.slice(flags.indexOf("CELESTIAL_FLAG_DEFAULTS"), flags.indexOf("const FlagsContext"));
const val = (k) => new RegExp(`${k}:\\s*(true|false)`).exec(defs)?.[1];
ok(val("celestialEnabled") === "false", "celestialEnabled defaults OFF");
ok(val("boomEnabled") === "true", "boomEnabled defaults ON");
for (const k of ["momentIntegration","chatIntegration","notificationsIntegration","worldWallIntegration","premiumFuture","livingSkyFuture"]) {
  ok(val(k) === "false", `${k} defaults OFF`);
}
ok(/boomEnabled:\s*true\s*\}\)/.test(flags) || /boomEnabled:\s*true\s*,?\s*\}\)/.test(flags), "boomEnabled is pinned true in the provider — no path can turn the mascot off");
ok(!/setBoomEnabled|boomEnabled:\s*false/.test(flags), "no code path anywhere sets boomEnabled false");

console.log("7. Runtime assets present for every object × theme × tier");
const missingAssets = [];
for (const o of OBJECTS) for (const th of ["cosmos", "solar"]) for (const ti of ["signal", "seal", "object", "event"]) {
  const f = `public/celestial/${o}-${th}-${ti}.webp`;
  if (!fs.existsSync(path.join(__dirname, "..", f))) missingAssets.push(f);
}
ok(missingAssets.length === 0, `all 64 runtime assets present${missingAssets.length ? ` (missing ${missingAssets.length})` : ""}`);

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { failures.forEach((f) => console.log(`  FAILED: ${f}`)); process.exit(1); }
