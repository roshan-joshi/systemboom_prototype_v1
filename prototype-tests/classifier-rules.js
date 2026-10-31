/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node test script, the established prototype-tests pattern */
/**
 * UHI-DEC-014 — PRIMARY EXPERIENCE OVER INCIDENTAL OBJECTS, at the rule level.
 *
 * The real `src/lib/ai/vision/classify.ts` (and the Knowledge Base it consults) is transpiled from its TypeScript source and
 * exercised directly — no browser, no provider. These checks exist to prove the rule is GENERAL: the same subject/experience
 * logic is applied to every category, and the decision survives inputs the suite's own examples never mention (a guitar at a
 * party, a dog in a kitchen, a stadium crowd). A fixture-shaped shortcut would fail the generalization block below.
 */
const fs = require("fs");
const path = require("path");
const ts = require(path.join(__dirname, "..", "node_modules", "typescript"));
const SRC = path.join(__dirname, "..", "src", "lib", "ai", "vision", "classify.ts");

/** transpile a TS module and resolve its relative imports the same way (types are erased, so only real code runs) */
const cache = new Map();
function load(file) {
  const resolved = file.endsWith(".ts") ? file : `${file}.ts`;
  if (cache.has(resolved)) return cache.get(resolved);
  const js = ts.transpileModule(fs.readFileSync(resolved, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  cache.set(resolved, m.exports);
  const req = (spec) => {
    if (spec.startsWith(".")) return load(path.resolve(path.dirname(resolved), spec));
    if (spec.startsWith("@/")) return {}; // type-only imports from the app — erased by transpilation
    return require(spec);
  };
  new Function("module", "exports", "require", js)(m, m.exports, req);
  cache.set(resolved, m.exports);
  return m.exports;
}
const { classifyCategories, SUGGEST_FLOOR, INCIDENTAL_CEILING, OCCASION_LEAD } = load(SRC);

let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };

/** a neutral Pass 1 observation, as the vision stage produces it */
const vision = ({ scene = "", description = "", objects = [], actions = [], text = [], primarySubject = "unknown", limitations = [] }) => ({
  schemaVersion: 1, assetId: null, analyzedAt: new Date().toISOString(), provider: "test",
  objects: objects.map((label) => ({ label, confidence: "high" })),
  scene: { label: scene, description },
  actions: actions.map((label) => ({ label, confidence: "high" })),
  text, primarySubject, limitations,
});
const alts = (r) => r.alternatives.map((a) => a.kind);

console.log("RULE — THE MODEL'S OWN JUDGMENT LEADS");
{
  const r = classifyCategories(vision({ scene: "Birthday party", description: "people around a cake with candles", objects: ["cake", "balloons", "people"], primarySubject: "scene" }), { moment: 1, meal: 0.2 }, { isFood: true });
  ok(r.primary.kind === "moment", `C-01: the model's own moment 1.0 / meal 0.2 is respected — food present does not overturn it (primary ${r.primary.kind} ${r.primary.score.toFixed(2)})`);
  ok(alts(r).includes("meal"), `C-01: Meal stays offered as an alternative (${alts(r).join(",") || "none"})`);
  ok(r.reasons.includes("legacy.isFood-present-only"), "C-01: the legacy food flag is recorded as PRESENT-ONLY, not as the subject");
}
{
  const r = classifyCategories(vision({ scene: "Plated dinner", description: "a plate of food on a table", objects: ["plate", "rice", "curry"], primarySubject: "food" }), { moment: 0.3, meal: 0.95 }, { isFood: true });
  ok(r.primary.kind === "meal" && r.primary.score >= 0.75 && r.reasons.includes("legacy.isFood-as-subject"), `C-02: when food IS the subject, Meal leads with full authority (${r.primary.score.toFixed(2)})`);
}

console.log("RULE — INCIDENTAL OBJECTS NEVER LEAD (every category, not just Meal)");
const incidentalCases = [
  ["cake at a celebration", vision({ scene: "Anniversary dinner party", description: "friends gathered around a table with a cake", objects: ["cake", "garland", "guests"], primarySubject: "scene" }), { moment: 0.9, meal: 0.8 }, { isFood: true }, "meal"],

  ["a whiteboard in an office", vision({ scene: "Open-plan office", description: "an office interior with desks and a whiteboard on the far wall", objects: ["desks", "whiteboard", "chairs"], primarySubject: "place" }), { moment: 0.7, meeting: 0.8 }, {}, null],
  ["a guitar at a party", vision({ scene: "House party", description: "people talking in a living room, a guitar leaning on the sofa", objects: ["guitar", "people", "sofa"], primarySubject: "scene" }), { moment: 0.9, activity: 0.7 }, {}, "activity"],
  ["a dog in a kitchen", vision({ scene: "Kitchen", description: "a dog sitting on the kitchen floor beside a bowl", objects: ["dog", "bowl", "kitchen"], primarySubject: "animal" }), { moment: 0.8, meal: 0.6 }, { isFood: true }, "meal"],
];
{
  // the owner's own table: a construction site is a PROJECT — the workers in it are incidental, and no occasion competes
  const r = classifyCategories(vision({ scene: "Construction site", description: "an unfinished building with scaffolding and workers in helmets", objects: ["scaffolding", "crane", "workers"], actions: ["workers carrying materials"], primarySubject: "place" }), { moment: 0.3, activity: 0.85, project: 0.6 }, {});
  ok(r.primary.kind === "project" && r.reasons.includes("rule.construction-is-project"), `C-03 (workers on a site): the site is the subject → Project leads, not the workers' Activity (primary ${r.primary.kind})`);
  ok(!alts(r).includes("activity") || (r.alternatives.find((a) => a.kind === "activity")?.score ?? 1) <= INCIDENTAL_CEILING, "C-03 (workers on a site): incidental Activity is held below the lead band");
}
for (const [name, v, scores, legacy, demoted] of incidentalCases) {
  const r = classifyCategories(v, scores, legacy);
  ok(r.primary.kind === "moment", `C-03 (${name}): the occasion leads, not the object in frame (primary ${r.primary.kind})`);
  if (demoted) ok(alts(r).includes(demoted) || r.reasons.some((x) => x.startsWith("rule.incidental")), `C-03 (${name}): ${demoted} is demoted to a choice, never removed (${alts(r).join(",") || "none"})`);
}
{
  const r = classifyCategories(vision({ scene: "Park path", description: "a person running", objects: ["runner"], actions: ["running"], primarySubject: "person" }), { moment: 0.4, activity: 0.95 }, {});
  ok(r.primary.kind === "activity" && !r.reasons.some((x) => x.includes("incidental:activity")), "C-04: a person DOING something is a supported Activity — the ceiling applies only to incidental presence");
}
{
  const r = classifyCategories(vision({ scene: "Stadium", description: "a crowd watching a football match from the stands", objects: ["crowd", "pitch", "floodlights"], actions: ["spectators watching"], primarySubject: "scene" }), { moment: 0.85, activity: 0.75 }, {});
  ok(r.primary.kind === "moment" && alts(r).includes("activity"), `C-05: watching a match is the occasion, playing it would be the Activity (primary ${r.primary.kind}, alternatives ${alts(r).join(",")})`);
}

console.log("RULE — AMBIGUITY IS OFFERED, NOT DECIDED");
{
  const r = classifyCategories(vision({ scene: "Cake on a table", description: "a cake with candles, the wider occasion not visible", objects: ["cake", "candles"], primarySubject: "food", limitations: ["the occasion is not visible"] }), { moment: 0.62, meal: 0.7 }, { isFood: true });
  ok(r.primary.kind === "meal" && alts(r).includes("moment"), `C-06: a near-tie offers both — the person chooses (primary ${r.primary.kind}, alternatives ${alts(r).join(",")})`);
  ok(r.primary.confidence !== "high", `C-06: an ambiguous lead is stated as a LIKELY match, never as a verdict (confidence ${r.primary.confidence})`);
}
{
  const r = classifyCategories(vision({ scene: "Room", description: "an empty chair beside a window", objects: ["chair"], primarySubject: "object" }), { moment: 0.5, meal: 0, activity: 0 }, {});
  ok(r.noMatch === true && r.primary.kind === "moment", "C-07: nothing supported → no specialist claim, Life Moment offered");
}

console.log("RULE — NO HARD-CODED EXAMPLES");
{
  const src = fs.readFileSync(SRC, "utf8");
  // comments may EXPLAIN the principle with examples; the executable rules may not mention them
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const banned = [/birthday/i, /\bcake\b/i, /\bwedding\b/i, /\bcandle/i, /\bballoon/i, /party/i, /\bcelebrat/i];
  const hits = banned.filter((b) => b.test(code)).map(String);
  ok(hits.length === 0, `C-08: no example-specific word appears in the classifier's CODE (${hits.join(", ") || "none"}) — the rules read subject, action and evidence`);
  ok(typeof SUGGEST_FLOOR === "number" && typeof INCIDENTAL_CEILING === "number" && typeof OCCASION_LEAD === "number" && INCIDENTAL_CEILING < SUGGEST_FLOOR && OCCASION_LEAD > SUGGEST_FLOOR, `C-08: the thresholds are declared and ordered (incidental ${INCIDENTAL_CEILING} < floor ${SUGGEST_FLOOR} < occasion ${OCCASION_LEAD})`);
}
{
  // the same inputs with the occasion evidence removed must flip the answer — proof the rule reads evidence, not labels
  const withOccasion = classifyCategories(vision({ scene: "Celebration", description: "people gathered around a table with food", objects: ["food", "people", "decorations"], primarySubject: "scene" }), { moment: 0.9, meal: 0.8 }, { isFood: true });
  const withoutOccasion = classifyCategories(vision({ scene: "Plate of food", description: "a plate of food on a table", objects: ["food", "plate"], primarySubject: "food" }), { moment: 0.2, meal: 0.8 }, { isFood: true });
  ok(withOccasion.primary.kind === "moment" && withoutOccasion.primary.kind === "meal", `C-09: the SAME food evidence resolves differently by subject and occasion (${withOccasion.primary.kind} vs ${withoutOccasion.primary.kind})`);
}
{
  const legacyOnly = classifyCategories(null, undefined, { isFood: true });
  ok(legacyOnly.primary.kind === "meal" || legacyOnly.noMatch, `C-10: a legacy reading with no Pass 1 vision still behaves (primary ${legacyOnly.primary.kind}, noMatch ${legacyOnly.noMatch}) — backward compatible`);
  const empty = classifyCategories(null, undefined, {});
  ok(empty.noMatch === true && empty.primary.kind === "moment", "C-10: no vision and no scores → no claim at all");
}

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.log(failures.map((f) => ` - ${f}`).join("\n")); process.exit(1); }
