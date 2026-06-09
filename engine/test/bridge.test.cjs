'use strict';

/**
 * Unit suite for engine module bridge (plan 10-01).
 *
 * Exercises the BRIDGE-02 hashing + registry-diff substrate:
 *   1. hashSources → 64-hex per-file + combined; order-independent.
 *   2. Mutating a source's bytes changes its per-file sha256 AND the combined.
 *   3. cmdBridgeHash over fd-1 capture → { files:[{path,sha256}], combined }.
 *   4. cmdBridgeCheck with NO registry → { fresh:true, changed:[], reason:'no_registry' }.
 *   5. cmdBridgeCheck with a matching registry → { fresh:true, changed:[] }.
 *   6. cmdBridgeCheck after mutating one recorded source → { fresh:false, changed:[path] }.
 *
 * Uses node:test + node:assert/strict with real tmp dirs (zero deps).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ENGINE_ROOT = path.join(__dirname, '..');
const { cmdBridgeHash, cmdBridgeCheck, hashSources } = require(
  path.join(ENGINE_ROOT, 'bin', 'lib', 'bridge.cjs')
);

const HEX64 = /^[0-9a-f]{64}$/;

/** Run a bridge command while capturing its output() write to fd 1 → parsed JSON. */
function capture(fn) {
  const origWriteSync = fs.writeSync;
  let captured = '';
  fs.writeSync = function (fd, data, ...rest) {
    if (fd === 1) { captured += String(data); return; }
    return origWriteSync.call(fs, fd, data, ...rest);
  };
  try {
    fn();
  } finally {
    fs.writeSync = origWriteSync;
  }
  return JSON.parse(captured);
}

/** Fresh tmp project root. */
function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-bridge-'));
}

/** Write a registry.json into a project's .sovereign/bridges/ dir. */
function writeRegistry(dir, registry) {
  const bdir = path.join(dir, '.sovereign', 'bridges');
  fs.mkdirSync(bdir, { recursive: true });
  fs.writeFileSync(path.join(bdir, 'registry.json'), JSON.stringify(registry, null, 2));
}

// ─── 1. hashSources: per-file + combined, order-independent ─────────────────

test('hashSources returns 64-hex per-file + combined and is order-independent', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'a.md'), 'alpha');
  fs.writeFileSync(path.join(dir, 'b.md'), 'beta');

  const r1 = hashSources(dir, ['a.md', 'b.md']);
  const r2 = hashSources(dir, ['b.md', 'a.md']);

  assert.equal(r1.entries.length, 2);
  assert.match(r1.combined, HEX64);
  for (const e of r1.entries) {
    assert.match(e.sha256, HEX64);
    assert.ok(typeof e.path === 'string');
  }
  assert.equal(r1.combined, r2.combined, 'combined hash must be order-independent');
  // entries sorted by rel path ascending
  assert.deepEqual(r1.entries.map((e) => e.path), ['a.md', 'b.md']);
});

test('hashSources on an empty/nonexistent list returns [] + stable combined (no throw)', () => {
  const dir = mkProject();
  const empty = hashSources(dir, []);
  const missing = hashSources(dir, ['nope.md']);
  assert.deepEqual(empty.entries, []);
  assert.deepEqual(missing.entries, []);
  assert.match(empty.combined, HEX64);
  assert.equal(empty.combined, missing.combined, 'empty == all-missing == sha256 of ""');
});

// ─── 2. mutating bytes changes per-file + combined ──────────────────────────

test('changing a source file changes its per-file sha256 and the combined hash', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'a.md'), 'one');
  fs.writeFileSync(path.join(dir, 'b.md'), 'two');
  const before = hashSources(dir, ['a.md', 'b.md']);

  fs.writeFileSync(path.join(dir, 'a.md'), 'one-MODIFIED');
  const after = hashSources(dir, ['a.md', 'b.md']);

  const beforeA = before.entries.find((e) => e.path === 'a.md').sha256;
  const afterA = after.entries.find((e) => e.path === 'a.md').sha256;
  const beforeB = before.entries.find((e) => e.path === 'b.md').sha256;
  const afterB = after.entries.find((e) => e.path === 'b.md').sha256;

  assert.notEqual(beforeA, afterA, 'changed file sha256 must differ');
  assert.equal(beforeB, afterB, 'unchanged file sha256 must stay');
  assert.notEqual(before.combined, after.combined, 'combined must differ');
});

// ─── 3. cmdBridgeHash output shape ──────────────────────────────────────────

test('cmdBridgeHash emits { files:[{path,sha256}], combined }', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'a.md'), 'x');
  fs.writeFileSync(path.join(dir, 'b.md'), 'y');

  const out = capture(() => cmdBridgeHash(dir, ['a.md', 'b.md'], false));

  assert.ok(Array.isArray(out.files));
  assert.equal(out.files.length, 2);
  for (const f of out.files) {
    assert.ok('path' in f && 'sha256' in f);
    assert.match(f.sha256, HEX64);
  }
  assert.match(out.combined, HEX64);
});

// ─── 4. cmdBridgeCheck greenfield (no registry) ─────────────────────────────

test('cmdBridgeCheck with no registry → { fresh:true, changed:[], reason:no_registry }', () => {
  const dir = mkProject(); // no .sovereign/bridges/registry.json
  const out = capture(() => cmdBridgeCheck(dir, null, false));
  assert.equal(out.fresh, true);
  assert.deepEqual(out.changed, []);
  assert.equal(out.reason, 'no_registry');
});

test('cmdBridgeCheck with unparseable registry → greenfield no_registry (no throw)', () => {
  const dir = mkProject();
  const bdir = path.join(dir, '.sovereign', 'bridges');
  fs.mkdirSync(bdir, { recursive: true });
  fs.writeFileSync(path.join(bdir, 'registry.json'), '{ not valid json');
  const out = capture(() => cmdBridgeCheck(dir, null, false));
  assert.equal(out.fresh, true);
  assert.equal(out.reason, 'no_registry');
});

// ─── 5. cmdBridgeCheck matching registry → fresh ────────────────────────────

test('cmdBridgeCheck with matching recorded hashes → { fresh:true, changed:[] }', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, '.sovereign-API.md'), 'spec');
  fs.writeFileSync(path.join(dir, '.sovereign-SEC.md'), 'sec');
  const sources = ['.sovereign-API.md', '.sovereign-SEC.md'];
  const { entries, combined } = hashSources(dir, sources);

  writeRegistry(dir, {
    'api-bridge': {
      generated: '2026-06-09',
      source_commit: 'abc1234',
      combined_hash: combined,
      sources_hashed: entries,
    },
  });

  const out = capture(() => cmdBridgeCheck(dir, 'api-bridge', false));
  assert.equal(out.fresh, true);
  assert.deepEqual(out.changed, []);
});

// ─── 6. cmdBridgeCheck after mutation → names the changed path ──────────────

test('cmdBridgeCheck after mutating one source → { fresh:false, changed:[that path] }', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, '.sovereign-API.md'), 'spec');
  fs.writeFileSync(path.join(dir, '.sovereign-SEC.md'), 'sec');
  const sources = ['.sovereign-API.md', '.sovereign-SEC.md'];
  const { entries, combined } = hashSources(dir, sources);

  writeRegistry(dir, {
    'api-bridge': {
      generated: '2026-06-09',
      source_commit: 'abc1234',
      combined_hash: combined,
      sources_hashed: entries,
    },
  });

  // Mutate exactly one recorded source.
  fs.writeFileSync(path.join(dir, '.sovereign-API.md'), 'spec-CHANGED');

  const out = capture(() => cmdBridgeCheck(dir, 'api-bridge', false));
  assert.equal(out.fresh, false);
  assert.deepEqual(out.changed, ['.sovereign-API.md']);
});

test('cmdBridgeCheck flags a recorded source that no longer exists', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, '.sovereign-API.md'), 'spec');
  const sources = ['.sovereign-API.md'];
  const { entries, combined } = hashSources(dir, sources);
  writeRegistry(dir, {
    'api-bridge': {
      combined_hash: combined,
      sources_hashed: entries,
    },
  });

  fs.rmSync(path.join(dir, '.sovereign-API.md'));
  const out = capture(() => cmdBridgeCheck(dir, 'api-bridge', false));
  assert.equal(out.fresh, false);
  assert.deepEqual(out.changed, ['.sovereign-API.md']);
});

test('cmdBridgeCheck defaults to the single entry when no id given', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'x.md'), 'x');
  const { entries, combined } = hashSources(dir, ['x.md']);
  writeRegistry(dir, { 'only-bridge': { combined_hash: combined, sources_hashed: entries } });
  const out = capture(() => cmdBridgeCheck(dir, null, false));
  assert.equal(out.fresh, true);
  assert.equal(out.id, 'only-bridge');
});
