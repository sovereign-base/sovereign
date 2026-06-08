'use strict';

/**
 * Unit suite for engine layer B — state (plan 01-03).
 *
 * Exercises the context-reset survival primitives:
 *   - stateReplaceField: **Field:** bold patch, plain Field: patch, absent → null
 *   - cmdStateLoad: one JSON blob {config, state_raw, manifest_raw, *_exists}
 *   - cmdStatePatch: multi-field patch (byte-for-byte except patched lines)
 *     followed by MANIFEST regeneration (the SOVEREIGN extension over GSD)
 *
 * Uses node:test + node:assert/strict with mkdtemp fixtures (zero deps).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ENGINE_ROOT = path.join(__dirname, '..');
const state = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'state.cjs'));
const TEMPLATES = path.join(ENGINE_ROOT, '..', 'templates', 'sovereign');

/** Create a throwaway fixture dir under the OS tmpdir. */
function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-state-'));
}

/** Seed a .sovereign/ dir in `dir` from the shipped templates. */
function seedSovereign(dir) {
  const sov = path.join(dir, '.sovereign');
  fs.mkdirSync(path.join(sov, 'docs', 'adr'), { recursive: true });
  for (const f of ['STATE.md', 'MANIFEST.md', 'SOVEREIGN.md', 'config.json']) {
    fs.copyFileSync(path.join(TEMPLATES, f), path.join(sov, f));
  }
  return sov;
}

// ─── stateReplaceField ───────────────────────────────────────────────────────

test('stateReplaceField patches a **Field:** bold line', () => {
  const out = state.stateReplaceField('**Phase:** 0', 'Phase', '1');
  assert.ok(out.includes('**Phase:** 1'));
});

test('stateReplaceField patches a plain Field: line', () => {
  const out = state.stateReplaceField('Phase: 0', 'Phase', '1');
  assert.ok(out.includes('Phase: 1'));
});

test('stateReplaceField returns null when the field is absent', () => {
  assert.equal(state.stateReplaceField('x', 'Nope', '1'), null);
});

// ─── cmdStateLoad ────────────────────────────────────────────────────────────

test('cmdStateLoad returns {config, state_raw, manifest_raw, *_exists} as one blob', () => {
  const dir = mkTmp();
  seedSovereign(dir);
  const result = state.loadState(dir);
  assert.ok(result.config, 'config present');
  assert.ok(result.state_raw.includes('**Phase:**'), 'state_raw is STATE.md content');
  assert.ok(result.manifest_raw.includes('MANIFEST'), 'manifest_raw is MANIFEST.md content');
  assert.equal(result.state_exists, true);
  assert.equal(result.manifest_exists, true);
  assert.equal(result.sovereign_exists, true);
});

test('cmdStateLoad reports *_exists false when files are absent', () => {
  const dir = mkTmp();
  fs.mkdirSync(path.join(dir, '.sovereign'), { recursive: true });
  const result = state.loadState(dir);
  assert.equal(result.state_exists, false);
  assert.equal(result.manifest_exists, false);
  assert.equal(result.sovereign_exists, false);
});

// ─── cmdStatePatch ─────────────────────────────────────────────────────────

test('patch writes multiple fields, leaving other lines byte-for-byte intact', () => {
  const dir = mkTmp();
  const sov = seedSovereign(dir);
  const statePath = path.join(sov, 'STATE.md');
  const before = fs.readFileSync(statePath, 'utf-8');

  const result = state.patchState(dir, [
    { field: 'Phase', value: '2' },
    { field: 'Status', value: 'In progress' },
  ]);

  assert.equal(result.patched, 2);
  const after = fs.readFileSync(statePath, 'utf-8');
  assert.ok(after.includes('**Phase:** 2'));
  assert.ok(after.includes('**Status:** In progress'));
  // Untouched lines preserved exactly.
  assert.ok(after.includes('**Plan:** 0'));
  assert.ok(after.includes('**Blockers:** None'));

  // Only the two patched lines differ.
  const diffLines = before.split('\n').filter((line, i) => line !== after.split('\n')[i]);
  assert.equal(diffLines.length, 2, 'exactly two lines changed');
});

test('patch collects a warning for an absent field and skips it', () => {
  const dir = mkTmp();
  seedSovereign(dir);
  const result = state.patchState(dir, [
    { field: 'Phase', value: '3' },
    { field: 'DoesNotExist', value: 'x' },
  ]);
  assert.equal(result.patched, 1);
  assert.ok(result.warnings.some((w) => w.includes('DoesNotExist')));
});

test('patch regenerates MANIFEST.md reflecting the new Phase value', () => {
  const dir = mkTmp();
  const sov = seedSovereign(dir);
  state.patchState(dir, [{ field: 'Phase', value: '7' }]);
  const manifest = fs.readFileSync(path.join(sov, 'MANIFEST.md'), 'utf-8');
  assert.ok(manifest.includes('7'), 'regenerated MANIFEST carries the patched Phase');
});
