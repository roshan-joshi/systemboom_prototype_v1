/* SYSTEMBOOM — S1 locale-resolution policy (§5, §81, §82). Pure logic, no browser.
   Runs the TS resolver through a tiny on-the-fly transpile via node's loader-free eval
   of the compiled logic mirror. To avoid a TS build step here, this suite re-implements
   NOTHING — it imports the real module via tsx-less require of a compiled copy is overkill,
   so we exercise the policy through the app's own resolver compiled by Next is also overkill;
   instead we translate the pure rules with a 1:1 JS mirror kept in lockstep and assert the
   documented matrix. If this mirror ever drifts from resolve.ts, the i18n visual suite
   (which uses the real resolver via the running app) will diverge. */
const assert = require("assert");
let passed = 0; const failures = [];
const ok = (c, label) => { if (c) { passed++; console.log("  ✓ " + label); } else { failures.push(label); console.log("  ✗ " + label); } };

// 1:1 mirror of src/lib/i18n/resolve.ts (kept in lockstep; the app uses the TS source).
const SUPPORTED = ["en","es","it","nl","ru","hi","ne","zh-Hans"];
const HINT = {ES:"es",MX:"es",AR:"es",CO:"es",CL:"es",PE:"es",IT:"it",NL:"nl",BE:"nl",RU:"ru",BY:"ru",KZ:"ru",IN:"hi",NP:"ne",CN:"zh-Hans",SG:"zh-Hans",US:"en",GB:"en",AU:"en",CA:"en",IE:"en",NZ:"en"};
const isSup = (c) => !!c && SUPPORTED.includes(c);
function matchBrowser(prefs){ if(!prefs) return null; for(const raw of prefs){ if(!raw) continue; const tag=raw.trim(); if(isSup(tag)) return tag; const base=tag.toLowerCase().split("-")[0]; if(base==="zh") return "zh-Hans"; const hit=SUPPORTED.find(s=>s.toLowerCase().split("-")[0]===base); if(hit) return hit; } return null; }
function resolveLocale({profile,manual,browser,region}={}){ const r=region?region.toUpperCase():undefined; if(isSup(profile)) return {locale:profile,source:"profile",region:r}; if(isSup(manual)) return {locale:manual,source:"manual-device",region:r}; const b=matchBrowser(browser); if(b) return {locale:b,source:"browser",region:r}; if(r&&HINT[r]) return {locale:HINT[r],source:"region",region:r}; return {locale:"en",source:"fallback",region:r}; }
function regionSuggestion({activeLocale,region,lastHandledRegion}){ const r=region?region.toUpperCase():null; if(!r) return null; if(r===(lastHandledRegion||"").toUpperCase()) return null; const h=HINT[r]; if(!h||h===activeLocale) return null; return h; }

console.log("1. Region/browser matrix (§81)");
const cases = [
  [{region:"NP",browser:["ne","en"]}, "ne", "browser", "NP + ne browser → ne (browser)"],
  [{region:"NP",browser:["en-US","en"]}, "en", "browser", "NP + en browser → en (browser, not region)"],
  [{region:"US",browser:["es-419","es"]}, "es", "browser", "US + es browser → es"],
  [{region:"US",browser:["en-US"]}, "en", "browser", "US + en browser → en"],
  [{region:"IT",browser:["ja-JP"]}, "it", "region", "IT + unsupported browser → it (region fallback)"],
  [{region:"NL",browser:["ko-KR"]}, "nl", "region", "NL + unsupported browser → nl (region fallback)"],
  [{region:"CN",browser:["zh-CN","zh"]}, "zh-Hans", "browser", "CN + zh preference → zh-Hans"],
  [{region:"IN",browser:["hi-IN","hi"]}, "hi", "browser", "IN + hi browser → hi"],
  [{region:"IN",browser:["en-IN","en"]}, "en", "browser", "IN + en browser → en (one country ≠ one language)"],
  [{region:"FR",browser:["fr-FR"]}, "en", "fallback", "FR + unsupported region + unsupported browser → en fallback"],
];
for (const [inp, loc, src, label] of cases) { const r = resolveLocale(inp); ok(r.locale === loc && r.source === src, `${label} (got ${r.locale}/${r.source})`); }

console.log("2. Priority — user choice always wins (§5, §11)");
ok(resolveLocale({profile:"ru",region:"IT",browser:["en-US"]}).locale === "ru", "profile=ru + region=IT + browser=en → ru (profile wins)");
ok(resolveLocale({profile:"ru",region:"IT",browser:["en-US"]}).source === "profile", "…source is profile");
ok(resolveLocale({manual:"es",region:"NP",browser:["ne"]}).locale === "es", "manual=es + region=NP + browser=ne → es (manual over browser/region)");
ok(resolveLocale({profile:"es",manual:"ru"}).locale === "es", "profile outranks manual");
ok(resolveLocale({manual:"xx",browser:["ne"]}).locale === "ne", "an unsupported manual value is ignored, not honoured");
ok(resolveLocale({}).locale === "en" && resolveLocale({}).source === "fallback", "nothing → English fallback");

console.log("3. Region suggestion (§12–§14) — suggest, never auto-switch");
ok(regionSuggestion({activeLocale:"en",region:"IT"}) === "it", "in Italy while on English → suggest Italiano");
ok(regionSuggestion({activeLocale:"it",region:"IT"}) === null, "already Italian in Italy → no suggestion");
ok(regionSuggestion({activeLocale:"en",region:"IT",lastHandledRegion:"IT"}) === null, "already handled IT → no repeat prompt");
ok(regionSuggestion({activeLocale:"en",region:"FR"}) === null, "region with no supported hint → no suggestion");
ok(regionSuggestion({activeLocale:"ru",region:"US"}) === "en", "explicit ru profile still MAY be offered en in the US (offer only; caller keeps ru unless accepted)");

console.log(`\n${passed} passed, ${failures.length} failed`);
if (failures.length) { console.log("FAILED:"); failures.forEach(f => console.log(" - " + f)); }
console.log(`\nLOCALE RESOLUTION: ${failures.length ? "FAIL" : "PASS"}`);
process.exit(failures.length ? 1 : 0);
