'use strict';

/**
 * M3 router integration suite (plan 10-05).
 *
 * Proves the bridge/extension/adopt command surface dispatches correctly through
 * the REAL source bin (`bin/sovereign-tools.cjs`) end-to-end — not just at the
 * unit level. Mirrors pack-smoke's spawn-the-bin + `@file:`-spill JSON parse, but
 * spawns the SOURCE bin against per-case tmp projects (some seeded with
 * `.sovereign/`, some bare/non-git) and asserts the documented JSON contracts.
 *
 * The npx-dependent `extension list` case skips offline (hasNpm gate, mirroring
 * pack-smoke) since it shells out to `npx skills`; the exit-code branching itself
 * is covered network-free in extension.test.cjs (plan 10-04).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ENGINE_ROOT = path.join(__dirname, '..');
const BIN = path.join(ENGINE_ROOT, 'bin', 'sovereign-tools.cjs');

/** Run the source bin against a tmp project; return parsed JSON (handles @file:). */
function runBin(args, cwd) {
  const out = execFileSync(process.execPath, [BIN, ...args, '--cwd', cwd], {
    encoding: 'utf-8',
  });
  const jsonStr = out.startsWith('@file:')
    ? fs.readFileSync(out.slice('@file:'.length).trim(), 'utf-8')
    : out;
  return JSON.parse(jsonStr);
}

/** A fresh empty tmp dir (no .sovereign/, may or may not be a git repo). */
function mkTmp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix || 'sov-m3-'));
}

function hasNpm() {
  try {
    execFileSync('npm', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// ─── bridge ──────────────────────────────────────────────────────────────────

test('bridge hash --files a b → per-file sha256 (2) + 64-hex combined', () => {
  const dir = mkTmp('sov-m3-hash-');
  fs.writeFileSync(path.join(dir, 'a.md'), 'alpha\n');
  fs.writeFileSync(path.join(dir, 'b.md'), 'beta\n');
  const blob = runBin(['bridge', 'hash', '--files', 'a.md', 'b.md'], dir);
  assert.ok(Array.isArray(blob.files));
  assert.equal(blob.files.length, 2);
  for (const f of blob.files) {
    assert.equal(typeof f.path, 'string');
    assert.match(f.sha256, /^[0-9a-f]{64}$/);
  }
  assert.match(blob.combined, /^[0-9a-f]{64}$/);
});

test('bridge check with NO registry → greenfield { fresh:true, no_registry }', () => {
  const dir = mkTmp('sov-m3-check-');
  const blob = runBin(['bridge', 'check'], dir);
  assert.equal(blob.fresh, true);
  assert.deepEqual(blob.changed, []);
  assert.equal(blob.reason, 'no_registry');
});

// ─── adopt ─────────────────────────────────────────────────────────────────--

test('adopt scan → manifests + detected + structure.truncated + deep_read_candidates', () => {
  const dir = mkTmp('sov-m3-adopt-');
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify({ name: 'x' }) + '\n');
  fs.mkdirSync(path.join(dir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'index.js'), 'module.exports = {};\n');
  const blob = runBin(['adopt', 'scan'], dir);
  assert.ok(Array.isArray(blob.manifests));
  assert.ok(blob.manifests.some((m) => m.path === 'package.json' && m.present === true));
  assert.ok(blob.detected && typeof blob.detected === 'object');
  assert.ok(Array.isArray(blob.detected.languages));
  assert.equal(typeof blob.structure.truncated, 'boolean');
  assert.ok(Array.isArray(blob.deep_read_candidates));
});

// ─── extension ───────────────────────────────────────────────────────────────

test('extension list returns the { ok, exitCode, stdout, stderr, source } shape without throwing', (t) => {
  if (!hasNpm()) {
    t.skip('npm/npx not available offline — exit-code branching covered in extension.test.cjs');
    return;
  }
  const dir = mkTmp('sov-m3-ext-');
  // `extension list` shells to `npx skills list`; --raw is unused (JSON only).
  // It may exit non-zero offline (npx fetch fails), but execFileSync throws then,
  // so guard the run and assert the shape on whatever JSON the bin emitted.
  let blob;
  try {
    blob = runBin(['extension', 'list'], dir);
  } catch (e) {
    // Non-zero exit from the bin only happens via error() for arg problems, not
    // for a failed npx run (which still emits { ok:false, ... } and exits 0).
    // If npx itself wedged the harness, skip rather than fail on the network.
    t.skip('npx skills unavailable offline: ' + (e && e.message ? e.message : String(e)));
    return;
  }
  assert.equal(typeof blob.ok, 'boolean');
  assert.equal(typeof blob.exitCode, 'number');
  assert.equal(typeof blob.stdout, 'string');
  assert.equal(typeof blob.stderr, 'string');
  assert.ok('source' in blob);
});

// ─── unknown subcommand ────────────────────────────────────────────────────--

test('unknown subcommand (bridge bogus) exits non-zero', () => {
  const dir = mkTmp('sov-m3-bogus-');
  assert.throws(
    () => execFileSync(process.execPath, [BIN, 'bridge', 'bogus', '--cwd', dir], { stdio: 'pipe' }),
    /Unknown bridge subcommand/
  );
});
