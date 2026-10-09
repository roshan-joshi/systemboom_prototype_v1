/* eslint-disable @typescript-eslint/no-require-imports -- CommonJS Node test script, same as every file in prototype-tests (its require() calls are the repo's established pattern) */
/**
 * PHASE V2 — UNIVERSAL COMPOSER FIELD CONTRACT: independent contract tests (V2-1 … V2-20, V2-27 … V2-30).
 *
 * Pure Node — no browser, no Meal UI, no DeepSeek, no USDA, no Open Food Facts, no media analysis. The contract module is
 * transpiled from its TypeScript source and exercised through real state transitions:
 *   initial state → automated result → human action → late result → assert effective value / source / state / evidence.
 * A TEST-ONLY stub domain ("title / quantity / note", three generic scopes) proves a future category can consume the
 * behaviour without any Meal logic. Nothing here is product code.
 *
 * (V2-21 … V2-26 — Meal parity through the real composer — live in meal-intelligence.js.)
 */
const fs = require("fs");
const path = require("path");
let passed = 0;
const failures = [];
const ok = (c, m) => { if (c) { passed += 1; console.log(`  ✓ ${m}`); } else { failures.push(m); console.log(`  ✗ ${m}`); } };
const v = (n, c, m) => ok(!!c, `V2-${n}: ${m}`);
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const SRC = path.join(__dirname, "..", "src", "components", "style-lab", "social", "composer", "field-contract.ts");
let C = null;
try {
  const ts = require(path.join(__dirname, "..", "node_modules", "typescript"));
  const js = ts.transpileModule(fs.readFileSync(SRC, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  const m = { exports: {} };
  new Function("module", "exports", "require", js)(m, m.exports, require);
  C = m.exports;
} catch (e) {
  console.log(`  (the shared contract module cannot be loaded: ${String(e.message).slice(0, 120)})`);
}
const T = (n, fn, msg) => { let r = false; try { r = !!(C && fn(C)); } catch { r = false; } v(n, r, msg); };
let tick = 0;
const clock = () => `2026-10-08T00:00:${String(++tick).padStart(2, "0")}Z`;
const S = (c, value, meta) => c.suggest(c.emptyCell(), value, meta); // an automated suggestion into an empty cell

console.log("V2 contract — one field, four states, seven semantics");
T(1, (c) => { const x = S(c, "A", { confidence: "high", source: "obs" }); return x.value === "A" && c.isSuggestedDefault(x); }, "a contract-managed field exposes its current EFFECTIVE value");
T(2, (c) => { const x = S(c, "A", { confidence: "high", source: "camera" }); const y = c.edit(x, "B", clock); return x.source === "camera" && y.source === "camera"; }, "an automated value keeps its actual source — through a later correction too");
T(3, (c) => { const x = S(c, "A", { confidence: "medium", source: "obs" }); return x.confidence === "medium" && c.confirm(x, clock).confidence === "medium"; }, "an automated observation retains its confidence");
T(4, (c) => { const sug = S(c, "A", { confidence: "high", source: "s" }); const states = [sug.state, c.confirm(sug, clock).state, c.edit(sug, "B", clock).state, c.edit(sug, "", clock).state]; return eq(states, ["default", "confirmed", "corrected", "cleared"]) && c.SUGGESTED_DEFAULT === "default"; }, "the state distinguishes suggested default · confirmed · corrected · cleared");
T(5, (c) => { const sug = S(c, "A", { confidence: "high", source: "s" }); return !c.isUserTouched(sug) && c.isUserTouched(c.edit(sug, "B", clock)) && c.isUserTouched(c.edit(sug, "", clock)) && c.isUserTouched(c.confirm(sug, clock)); }, "after an edit, a clear or an explicit confirmation the field is human-owned; an untouched default is not");
T(6, (c) => { const ref = { id: "ref-77", basis: "per unit" }; const sug = S(c, "A", { confidence: "high", source: "s", ref }); const out = [c.edit(sug, "B", clock), c.edit(sug, "", clock), c.confirm(sug, clock), c.supersede(sug, "Z", { source: "s2", ref: { id: "ref-99" } })]; return out.slice(0, 3).every((x) => eq(x.ref, ref)) && out[3].ref.id === "ref-99"; }, "an underlying source reference survives every effective-value transition (a stronger source brings its own)");
T(7, (c) => { const mk = () => ({ title: S(c, "T", { confidence: "high", source: "s" }), note: c.emptyCell() }); const scopes = { "scope-a": mk(), "scope-b": mk() }; const next = c.inScope(scopes, "scope-a", (set) => ({ ...set, title: c.edit(set.title, "mine", clock) }), mk); return next["scope-a"].title.state === "corrected" && next["scope-b"] === scopes["scope-b"] && scopes["scope-a"].title.state === "default"; }, "a field belongs to one scope without leaking to another (the sibling scope is the very same object)");
T(8, (c) => { const x = S(c, "A", { confidence: "high", source: "s" }); return x.value === "A" && x.state === "default" && x.original === "A"; }, "a HIGH-confidence suggestion populates an untouched eligible field");
T(9, (c) => { const x = S(c, "A", { confidence: "medium", source: "s" }); return x.value === "A" && x.state === "default" && x.original === "A"; }, "a MEDIUM-confidence suggestion also populates it");
T(10, (c) => { const x = S(c, "A", { confidence: "low", source: "s" }); const unknown = S(c, undefined, { confidence: "high", source: "s" }); return x.value === undefined && c.isUntouchedEmpty(x) && unknown.value === undefined && c.isUntouchedEmpty(unknown); }, "a LOW-confidence (or missing) observation is not promoted into the effective value");
T(11, (c) => { const a = S(c, "A", { confidence: "high", source: "s" }); const b = c.edit(a, "B", clock); const late = c.suggest(b, "C", { confidence: "high", source: "s" }); const lateStrong = c.supersede(b, "C", { source: "strong" }); return late.value === "B" && lateStrong.value === "B" && late.state === "corrected"; }, "automated A → user B → late automated C: the effective value stays B (also against a stronger source)");
T(12, (c) => { const a = S(c, "A", { confidence: "high", source: "s" }); const x = c.edit(a, "", clock); const late = c.suggest(x, "C", { confidence: "high", source: "s" }); const lateStrong = c.supersede(x, "C", { source: "strong" }); return x.value === undefined && late.value === undefined && lateStrong.value === undefined && late.state === "cleared" && lateStrong.state === "cleared"; }, "an automated value the person cleared stays blank after a late result — and after a stronger source");
T(13, (c) => { const never = c.emptyCell(); const cleared = c.edit(S(c, "A", { confidence: "high", source: "s" }), "", clock); const earlyClear = c.edit(c.emptyCell(), "x", clock); const earlyClear2 = c.edit(earlyClear, "", clock); return c.isUntouchedEmpty(never) && !c.isUserCleared(never) && c.isUserCleared(cleared) && !c.isUntouchedEmpty(cleared) && c.isUserCleared(earlyClear2) && never.state !== cleared.state; }, "never populated and deliberately cleared are different states (also when the person clears before any automation)");
T(14, (c) => { const x = S(c, "A", { confidence: "medium", source: "sourceX" }); const y = c.confirm(x, clock); return y.state === "confirmed" && y.source === "sourceX" && y.value === "A" && y.original === "A" && y.confidence === "medium"; }, "confirming a suggestion changes the STATE, not the source (state confirmed, source still X)");
T(15, (c) => { const ref = { id: "r1" }; const x = S(c, "A", { confidence: "high", source: "sourceX", ref }); const y = c.edit(x, "B", clock); return y.value === "B" && y.state === "corrected" && y.original === "A" && y.source === "sourceX" && eq(y.ref, ref) && y.confidence === "high"; }, "a correction changes the effective value; the original value, source, reference and confidence remain");
T(16, (c) => { const set = { a: S(c, "A", { confidence: "high", source: "s" }), b: S(c, "B", { confidence: "medium", source: "s" }), c: c.emptyCell(), d: S(c, "D", { confidence: "high", source: "s" }) }; const out = c.confirmFields(set, ["a", "b", "c"], clock); return out.a.state === "confirmed" && out.b.state === "confirmed" && out.c.state === "default" && out.c.value === undefined && out.d.state === "default" && set.a.state === "default"; }, "confirm acts only on shown populated fields — a blank field and a hidden (unlisted) field are untouched, and the input is not mutated");
T(17, (c) => { const mk = (x) => ({ f: S(c, x, { confidence: "high", source: "s" }) }); const scopes = { A: mk("a"), B: mk("b") }; const next = c.inScope(scopes, "A", (set) => c.confirmFields(set, ["f"], clock), () => mk("a")); return next.A.f.state === "confirmed" && next.B === scopes.B && next.B.f.state === "default"; }, "confirming the active scope confirms that scope only — the sibling scope is the same untouched object");
T(18, (c) => { const x = S(c, "A", { confidence: "high", source: "s" }); const rec = c.toRecord(x); return rec.value === "A" && c.isSuggestedDefault(rec) && eq(rec, JSON.parse(JSON.stringify(x))); }, "an untouched populated default serializes as it is — no confirmation is required to save it");
T(19, (c) => { const x = S(c, "A", { confidence: "high", source: "s" }); const rec = c.toRecord(x); return rec.state === "default" && x.state === "default" && rec.state !== "confirmed" && !c.hasUnconfirmed({}, []) === true && c.hasUnconfirmed({ f: x }, ["f"]); }, "saving an untouched default never changes it to confirmed (it is still reported as left to confirm)");
T(20, (c) => {
  // the DOMAIN supplies the priority policy; the contract only applies it — it has no idea what "est" or "fact" mean.
  const rank = { est: 1, fact: 3, alt: 3 };
  const outranks = (inc, cur) => (rank[inc] ?? 0) >= (rank[cur] ?? 0);
  const est = S(c, 100, { confidence: "medium", source: "est" });
  const fact = c.supersede(est, 354, { confidence: "high", source: "fact", ref: { id: "F1" } }, outranks);
  const weakerLater = c.supersede(fact, 999, { source: "est" }, outranks);
  const never = c.supersede(est, 1, { source: "est" }, () => false);
  const touched = c.supersede(c.edit(est, 50, clock), 354, { source: "fact" }, outranks);
  return fact.value === 354 && fact.source === "fact" && fact.ref.id === "F1" && weakerLater.value === 354 && never.value === 100 && touched.value === 50 && touched.state === "corrected" && est.value === 100;
}, "a stronger structured source replaces an untouched estimate by a caller-supplied priority policy (never a person's own value; a weaker source never displaces it)");

console.log("V2 extensibility — a TEST-ONLY stub domain (no product category, no UI, no route, no Meal)");
const stubBehaviour = (c) => {
  const keys = ["title", "quantity", "note"];
  const blank = () => ({ title: c.emptyCell(), quantity: c.emptyCell(), note: c.emptyCell() });
  const fill = (set, obs) => ({
    title: c.suggest(set.title, obs.title?.v, { confidence: obs.title?.c, source: "stub-observer" }),
    quantity: c.suggest(set.quantity, obs.quantity?.v, { confidence: obs.quantity?.c, source: "stub-observer" }),
    note: c.suggest(set.note, obs.note?.v, { confidence: obs.note?.c, source: "stub-observer" }),
  });
  return { keys, blank, fill };
};
T(27, (c) => {
  const stub = stubBehaviour(c);
  const set = stub.fill(stub.blank(), { title: { v: "Walk", c: "high" }, quantity: { v: "3", c: "medium" }, note: { v: "windy", c: "low" } });
  const edited = { ...set, title: c.edit(set.title, "Long walk", clock), note: c.edit(set.note, "keep", clock) };
  const cleared = { ...edited, quantity: c.edit(edited.quantity, "", clock) };
  const confirmedSet = c.confirmFields({ ...cleared, extra: c.emptyCell() }, [...stub.keys, "extra"], clock);
  return set.title.value === "Walk" && set.quantity.value === "3" && set.note.value === undefined && edited.title.state === "corrected" && cleared.quantity.state === "cleared" && cleared.quantity.value === undefined && confirmedSet.title.state === "corrected" && confirmedSet.extra.state === "default";
}, "a stub field set consumes the contract with no Meal logic: high/medium fill, low blank, edit, clear, confirm (the user-owned ones stay theirs)");
T(28, (c) => {
  // "Meal-shaped" state is built independently and must be bit-for-bit unchanged by anything done to the stub.
  const meal = { name: S(c, "Dal bhat", { confidence: "high", source: "obs" }), calories: S(c, 650, { confidence: "medium", source: "ai_estimate" }) };
  const before = JSON.stringify(meal);
  const stub = stubBehaviour(c);
  let s = stub.fill(stub.blank(), { title: { v: "x", c: "high" } });
  s = { ...s, title: c.edit(s.title, "y", clock) };
  c.confirmFields(s, stub.keys, clock);
  c.inScope({ a: s }, "a", (set) => c.confirmFields(set, stub.keys, clock), stub.blank);
  return JSON.stringify(meal) === before && meal.name.state === "default";
}, "applying contract behaviour to the stub does not mutate or change Meal-shaped state");
T(29, (c) => {
  const stub = stubBehaviour(c);
  const scopes = { "stub-1": stub.fill(stub.blank(), { title: { v: "one", c: "high" } }), "stub-2": stub.fill(stub.blank(), { title: { v: "two", c: "high" } }) };
  const meal = { "photo-1": { name: S(c, "Salad", { confidence: "high", source: "obs" }) } };
  const stubBefore = JSON.stringify(scopes["stub-2"]);
  const mealBefore = JSON.stringify(meal);
  const after = c.inScope(scopes, "stub-1", (set) => ({ ...set, title: c.edit(set.title, "edited", clock) }), stub.blank);
  const mealAfter = c.inScope(meal, "photo-1", (set) => ({ ...set, name: c.edit(set.name, "", clock) }), () => ({ name: c.emptyCell() }));
  return JSON.stringify(after["stub-2"]) === stubBefore && JSON.stringify(meal) === mealBefore && mealAfter["photo-1"].name.state === "cleared" && after["stub-1"].title.value === "edited";
}, "a stub scope and a Meal-like scope stay independent: editing one never alters the other");
T(30, (c) => {
  const src = fs.readFileSync(SRC, "utf8");
  const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
  const importsNothing = !/^\s*import\s/m.test(code) && !/\brequire\s*\(/.test(code);
  const noNetwork = !/\bfetch\s*\(|XMLHttpRequest|process\.env|window\b|document\b/.test(code);
  // and it is genuinely testable here: this whole file ran it with no browser, no network, no provider
  return importsNothing && noNetwork && typeof c.suggest === "function" && typeof c.confirmFields === "function";
}, "the transition behaviour runs with no Meal UI, no DeepSeek, no USDA, no Open Food Facts and no media analysis (no imports, no I/O — and this suite ran it in plain Node)");

console.log(`\nfield-contract: ${passed} passed, ${failures.length} failed`);
failures.forEach((f) => console.log("  FAILED: " + f));
process.exit(failures.length ? 1 : 0);
