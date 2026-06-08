'use strict';

/**
 * Unit suite for engine layer B — gate (plan 01-03).
 *
 * Phase gates are append-only writes to .sovereign/SOVEREIGN.md (the audit
 * trail; GSD has no gate primitive — net-new). Proves:
 *   - gate open appends an OPENED block without removing prior content
 *   - gate open then pass yields BOTH blocks, in order
 *   - the CLI errors (exit 1) when no phase argument is given
 *
 * Uses node:test + node:assert/strict with mkdtemp fixtures (zero deps).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync, spawnSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const gate = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'gate.cjs'));
const TEMPLATES = path.join(ENGINE_ROOT, '..', 'templates', 'sovereign');
const TOOLS = path.join(ENGINE_ROOT, 'bin', 'sovereign-tools.cjs');

/** Create a fixture dir with a seeded .sovereign/SOVEREIGN.md. */
function mkFixture() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sov-gate-'));
  fs.mkdirSync(path.join(dir, '.sovereign'), { recursive: true });
  fs.copyFileSync(
    path.join(TEMPLATES, 'SOVEREIGN.md'),
    path.join(dir, '.sovereign', 'SOVEREIGN.md')
  );
  return dir;
}

function readSovereign(dir) {
  return fs.readFileSync(path.join(dir, '.sovereign', 'SOVEREIGN.md'), 'utf-8');
}

// ─── append-only behavior ──────────────────────────────────────────────────

test('gate open appends an OPENED block and preserves prior content', () => {
  const dir = mkFixture();
  const before = readSovereign(dir);
  gate.gateOpen(dir, '1');
  const after = readSovereign(dir);
  assert.ok(after.startsWith(before), 'prior content preserved verbatim at the head');
  assert.ok(after.includes('Phase 1'));
  assert.ok(after.includes('OPENED'));
});

test('gate open then pass yields both blocks in order', () => {
  const dir = mkFixture();
  gate.gateOpen(dir, '1');
  gate.gatePass(dir, '1');
  const after = readSovereign(dir);
  const openIdx = after.indexOf('OPENED');
  const passIdx = after.indexOf('PASSED');
  assert.ok(openIdx !== -1, 'OPENED present');
  assert.ok(passIdx !== -1, 'PASSED present');
  assert.ok(openIdx < passIdx, 'OPENED appears before PASSED');
  assert.ok(after.includes('Phase 1'));
});

// ─── CLI wiring + no-phase error ─────────────────────────────────────────────

test('CLI gate open then pass leaves both OPENED and PASSED in SOVEREIGN.md', () => {
  const dir = mkFixture();
  execFileSync('node', [TOOLS, 'gate', 'open', '1', '--cwd', dir], { encoding: 'utf-8' });
  execFileSync('node', [TOOLS, 'gate', 'pass', '1', '--cwd', dir], { encoding: 'utf-8' });
  const after = readSovereign(dir);
  assert.ok(after.includes('OPENED'));
  assert.ok(after.includes('PASSED'));
});

test('CLI gate open with no phase exits non-zero', () => {
  const dir = mkFixture();
  const res = spawnSync('node', [TOOLS, 'gate', 'open', '--cwd', dir], { encoding: 'utf-8' });
  assert.notEqual(res.status, 0, 'missing phase must exit non-zero');
});

test('CLI state load returns JSON with state_raw and manifest_raw', () => {
  const dir = mkFixture();
  // seed STATE.md + MANIFEST.md so load reports them present
  fs.copyFileSync(path.join(TEMPLATES, 'STATE.md'), path.join(dir, '.sovereign', 'STATE.md'));
  fs.copyFileSync(path.join(TEMPLATES, 'MANIFEST.md'), path.join(dir, '.sovereign', 'MANIFEST.md'));
  const out = execFileSync('node', [TOOLS, 'state', 'load', '--cwd', dir], { encoding: 'utf-8' });
  const parsed = JSON.parse(out);
  assert.ok('state_raw' in parsed);
  assert.ok('manifest_raw' in parsed);
  assert.equal(parsed.state_exists, true);
  assert.equal(parsed.manifest_exists, true);
});

test('CLI state patch updates a field and regenerates MANIFEST', () => {
  const dir = mkFixture();
  fs.copyFileSync(path.join(TEMPLATES, 'STATE.md'), path.join(dir, '.sovereign', 'STATE.md'));
  const out = execFileSync(
    'node',
    [TOOLS, 'state', 'patch', '--field', 'Phase', '--value', '4', '--cwd', dir],
    { encoding: 'utf-8' }
  );
  const parsed = JSON.parse(out);
  assert.equal(parsed.patched, 1);
  assert.equal(parsed.manifest_regenerated, true);
  const stateMd = fs.readFileSync(path.join(dir, '.sovereign', 'STATE.md'), 'utf-8');
  assert.ok(stateMd.includes('**Phase:** 4'));
});
