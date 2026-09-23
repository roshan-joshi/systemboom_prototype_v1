/* Phase 2.1 — headless identity/session model verification.
   Transpiles the identity lib (plus its few relative deps) with the project's
   TypeScript into a scratch dir and asserts against the SERIALIZED JSON, so
   what we check is exactly what would sit in localStorage.
   Run: node prototype-tests/identity-model.js  (SB_OUT=dir to choose output) */
const fs = require("fs");
const path = require("path");
const os = require("os");
const assert = require("assert/strict");
const ts = require(path.join(__dirname, "..", "node_modules", "typescript"));

const ROOT = path.join(__dirname, "..", "src", "lib");
const OUT = process.env.SB_OUT || fs.mkdtempSync(path.join(os.tmpdir(), "sb-identity-"));
const FILES = [
  "clock.ts",
  "earth/globe-geo.ts",
  "mock/types.ts",
  "mock/demo-user.ts",
  "identity/types.ts",
  "identity/birth.ts",
  "identity/store.ts",
  "identity/demo-seed.ts",
];
for (const rel of FILES) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  const { outputText } = ts.transpileModule(src, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: rel,
  });
  const dest = path.join(OUT, rel.replace(/\.ts$/, ".js"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, outputText);
}

const birth = require(path.join(OUT, "identity/birth.js"));
const store = require(path.join(OUT, "identity/store.js"));
const seed = require(path.join(OUT, "identity/demo-seed.js"));

class Mem {
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
}

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`  ✓ ${name}`);
}

const NOW = new Date(2026, 8, 9, 10, 0, 0);

console.log("identity-model");

/* ---- 1. THE acceptance assertion: unknown birth time ---- */
check("unknown birth time → birthTimeKnown:false and NO birthTime key in stored JSON", () => {
  const mem = new Mem();
  const s = store.createIdentityStore({ storage: mem, mode: "persistent" });
  const id = store.createIdentity(
    { name: "Asha Gurung", birthDate: "1994-03-12", birthTimeKnown: false },
    NOW,
  );
  s.writeIdentity(id);
  const raw = mem.getItem(store.IDENTITY_KEY);
  const obj = JSON.parse(raw);
  assert.equal(obj.birthTimeKnown, false);
  assert.equal(Object.prototype.hasOwnProperty.call(obj, "birthTime"), false);
  assert.equal(raw.includes('"birthTime":'), false, raw);
  assert.equal(obj.birthDate, "1994-03-12");
  assert.equal(obj.source, "created");
  assert.equal(obj.createdAt, NOW.toISOString());
});

check("a time supplied WITH birthTimeKnown:false is dropped, never stored", () => {
  const mem = new Mem();
  const s = store.createIdentityStore({ storage: mem, mode: "persistent" });
  s.writeIdentity(
    store.createIdentity(
      { name: "X", birthDate: "1990-01-01", birthTime: "00:00", birthTimeKnown: false },
      NOW,
    ),
  );
  const obj = JSON.parse(mem.getItem(store.IDENTITY_KEY));
  assert.equal("birthTime" in obj, false);
  assert.equal(obj.birthTimeKnown, false);
});

check("malformed time with birthTimeKnown:true degrades to unknown (no invented time)", () => {
  const id = store.createIdentity(
    { name: "X", birthDate: "1990-01-01", birthTime: "6am", birthTimeKnown: true },
    NOW,
  );
  assert.equal(id.birthTimeKnown, false);
  assert.equal("birthTime" in id, false);
});

check("known birth time is kept and yields minute precision", () => {
  const id = store.createIdentity(
    { name: "X", birthDate: "1991-11-04", birthTime: "06:42", birthTimeKnown: true },
    NOW,
  );
  assert.equal(id.birthTime, "06:42");
  const { at, precision } = birth.birthInstant(id);
  assert.equal(precision, "minute");
  assert.deepEqual(
    [at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()],
    [1991, 10, 4, 6, 42],
  );
});

check("unknown time → day precision anchored at LOCAL midnight (no UTC drift)", () => {
  const { at, precision } = birth.birthInstant({ birthDate: "1991-11-04", birthTimeKnown: false });
  assert.equal(precision, "day");
  assert.deepEqual(
    [at.getFullYear(), at.getMonth(), at.getDate(), at.getHours(), at.getMinutes()],
    [1991, 10, 4, 0, 0],
  );
});

/* ---- 2. validation ---- */
check("validateBirthDate: empty / invalid / impossible / future / ok", () => {
  assert.equal(birth.validateBirthDate("", NOW), "empty");
  assert.equal(birth.validateBirthDate("   ", NOW), "empty");
  assert.equal(birth.validateBirthDate("04/11/1991", NOW), "invalid");
  assert.equal(birth.validateBirthDate("1991-02-30", NOW), "invalid");
  assert.equal(birth.validateBirthDate("1991-13-01", NOW), "invalid");
  assert.equal(birth.validateBirthDate("2026-09-10", NOW), "future");
  assert.equal(birth.validateBirthDate("2026-09-09", NOW), null);
  assert.equal(birth.validateBirthDate("1991-11-04", NOW), null);
  assert.equal(birth.isValidBirthTime("23:59"), true);
  assert.equal(birth.isValidBirthTime("24:00"), false);
  assert.equal(birth.isValidBirthTime("6:42"), false);
});

/* ---- 3. demo seed ---- */
check("demo seed → same PrototypeIdentity shape, known time, curated Italy anchor", () => {
  const maya = seed.identityFromDemoSeed();
  assert.equal(store.isPrototypeIdentity(maya), true);
  assert.equal(maya.source, "demo-seed");
  assert.equal(maya.name, "Giulia Bianchi");
  assert.equal(maya.birthDate, "1991-11-04");
  assert.equal(maya.birthTime, "06:42");
  assert.equal(maya.birthTimeKnown, true);
  assert.equal(maya.currentPlace.geoId, "cn-italy");
  assert.equal(maya.currentPlace.countryCode, "IT");
  assert.equal(maya.currentPlace.label, "Bologna, Italy");
  assert.equal(maya.currentPlace.lat, 42.8);
  assert.equal(maya.currentPlace.lon, 12.8);
  assert.equal(maya.avatar, "/mock/social/cast/giulia-bianchi.jpg");
  // Round trip through storage is lossless.
  const mem = new Mem();
  const s = store.createIdentityStore({ storage: mem, mode: "persistent" });
  s.writeIdentity(maya);
  assert.deepEqual(s.readIdentity(), maya);
});

check("seed and created identities have identical key sets (given the same optional fields)", () => {
  const maya = seed.identityFromDemoSeed();
  const created = store.createIdentity(
    {
      name: "Asha Gurung",
      birthDate: "1994-03-12",
      birthTime: "09:15",
      birthTimeKnown: true,
      avatar: "/mock/avatar-maya.svg",
      currentPlace: seed.placeFromGeo("cy-london", "London, United Kingdom", "GB"),
    },
    NOW,
  );
  assert.deepEqual(Object.keys(created).sort(), Object.keys(maya).sort());
});

/* ---- 4. storage safety ---- */
check("corrupt or foreign JSON reads as null and is left in place", () => {
  const mem = new Mem();
  const s = store.createIdentityStore({ storage: mem, mode: "persistent" });
  mem.setItem(store.IDENTITY_KEY, "{not json");
  assert.equal(s.readIdentity(), null);
  mem.setItem(store.IDENTITY_KEY, JSON.stringify({ id: 1, name: "bad" }));
  assert.equal(s.readIdentity(), null);
  mem.setItem(store.IDENTITY_KEY, JSON.stringify({ id: "a", name: "b", birthDate: "1990-01-01", birthTimeKnown: "yes", createdAt: "x", source: "created" }));
  assert.equal(s.readIdentity(), null);
  assert.equal(mem.getItem(store.IDENTITY_KEY) !== null, true);
});

check("throwing storage never escapes the store", () => {
  const boom = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  const s = store.createIdentityStore({ storage: boom, mode: "memory" });
  assert.equal(s.readIdentity(), null);
  assert.doesNotThrow(() => s.writeIdentity(seed.identityFromDemoSeed()));
  assert.doesNotThrow(() => s.clearIdentity());
  assert.doesNotThrow(() => s.clearSession());
});

check("detectStorage falls back to memory when window.localStorage throws", () => {
  const saved = globalThis.window;
  globalThis.window = {
    get localStorage() { throw new Error("SecurityError"); },
  };
  try {
    const d = store.detectStorage();
    assert.equal(d.mode, "memory");
    d.storage.setItem("k", "v");
    assert.equal(d.storage.getItem("k"), "v");
  } finally {
    if (saved === undefined) delete globalThis.window;
    else globalThis.window = saved;
  }
  assert.equal(store.detectStorage().mode, "memory"); // no window at all → memory
});

/* ---- 5. session ---- */
check("session lifecycle: write/read/clear; clearing session keeps identity", () => {
  const mem = new Mem();
  const s = store.createIdentityStore({ storage: mem, mode: "persistent" });
  const maya = s.writeIdentity(seed.identityFromDemoSeed());
  const sess = s.writeSession({ identityId: maya.id, firstEntrySeen: false, signedInAt: NOW.toISOString() });
  assert.equal("firstEntryStartedAt" in JSON.parse(mem.getItem(store.SESSION_KEY)), false);
  assert.deepEqual(s.readSession(), sess);
  s.writeSession({ ...sess, firstEntryStartedAt: NOW.toISOString() });
  assert.equal(s.readSession().firstEntryStartedAt, NOW.toISOString());
  s.clearSession();
  assert.equal(s.readSession(), null);
  assert.deepEqual(s.readIdentity(), maya);
});

check("normalizeIdentity trims and drops empty optional places", () => {
  const out = store.normalizeIdentity({
    id: "x", name: "  Asha  ", birthDate: "1994-03-12", birthTimeKnown: false,
    currentPlace: { label: "   " }, createdAt: "c", source: "created",
  });
  assert.equal(out.name, "Asha");
  assert.equal("currentPlace" in out, false);
});

console.log(`\n${passed} checks passed. Transpiled output: ${OUT}`);
