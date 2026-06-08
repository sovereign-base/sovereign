'use strict';

/**
 * Unit suite for engine layer A (plan 01-02).
 *
 * Exercises the substrate plans 03/04 build on:
 *   - extractField dot + bracket + negative-index + missing-path
 *   - loadConfig defaults-only and project-override deep merge
 *   - output() 50KB @file: spill threshold (inline below, spilled above)
 *
 * Uses node:test + node:assert/strict with mkdtemp fixtures (zero deps).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const { loadConfig } = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'core.cjs'));
const { extractField } = require(path.join(ENGINE_ROOT, 'bin', 'sovereign-tools.cjs'));
const CORE_PATH = path.join(ENGINE_ROOT, 'bin', 'lib', 'core.cjs');

/** Create a throwaway fixture dir under the OS tmpdir. */
function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-'));
}

// ─── extractField ──────────────────────────────────────────────────────────

test('extractField resolves dot, bracket, negative-index, and missing paths', () => {
  const obj = {
    a: { b: 'deep' },
    arr: ['first', 'middle', 'last'],
    models: { advisor: 'opus' },
    nested: { list: [{ id: 1 }, { id: 2 }] },
  };
  assert.equal(extractField(obj, 'a.b'), 'deep');
  assert.equal(extractField(obj, 'models.advisor'), 'opus');
  assert.equal(extractField(obj, 'arr[0]'), 'first');
  assert.equal(extractField(obj, 'arr[-1]'), 'last');
  assert.equal(extractField(obj, 'nested.list[1].id'), 2);
  assert.equal(extractField(obj, 'a.missing'), undefined);
  assert.equal(extractField(obj, 'nope.deep.path'), undefined);
});

// ─── loadConfig ────────────────────────────────────────────────────────────

test('loadConfig returns hardcoded defaults when no project config exists', () => {
  const dir = mkTmp();
  const cfg = loadConfig(dir);
  assert.equal(cfg.model_profile, 'balanced');
  assert.equal(cfg.commit_docs, true);
  assert.equal(cfg.context_window, 200000);
});

test('loadConfig merges project .sovereign/config.json over defaults', () => {
  const dir = mkTmp();
  fs.mkdirSync(path.join(dir, '.sovereign'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.sovereign', 'config.json'),
    JSON.stringify({ model_profile: 'quality' }),
    'utf-8'
  );
  const cfg = loadConfig(dir);
  assert.equal(cfg.model_profile, 'quality'); // overridden
  assert.equal(cfg.commit_docs, true); // default preserved
  assert.equal(cfg.council_mode_default, 'standard'); // default preserved
});

test('loadConfig skips an unparseable project config layer (no throw)', () => {
  const dir = mkTmp();
  fs.mkdirSync(path.join(dir, '.sovereign'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.sovereign', 'config.json'), '{ not valid json', 'utf-8');
  const cfg = loadConfig(dir);
  assert.equal(cfg.model_profile, 'balanced'); // falls back to defaults
});

// ─── output() @file: spill threshold ─────────────────────────────────────────

/**
 * Run core.output(result) in a child process and capture stdout. The child
 * requires core.cjs directly so we observe the real fs.writeSync(1, ...) bytes.
 */
function runOutput(jsLiteralResult) {
  const script =
    `const c=require(${JSON.stringify(CORE_PATH)});` +
    `c.output(${jsLiteralResult});`;
  return execFileSync('node', ['-e', script], { encoding: 'utf-8' });
}

test('output() writes inline JSON for small (<50KB) results', () => {
  const out = runOutput(`{ ok: true, n: 42 }`);
  assert.ok(!out.startsWith('@file:'), `expected inline JSON, got: ${out.slice(0, 40)}`);
  const parsed = JSON.parse(out);
  assert.equal(parsed.ok, true);
  assert.equal(parsed.n, 42);
});

test('output() spills >50KB results to a tmpfile and emits @file:<path>', () => {
  // ~60KB blob comfortably exceeds the 50000-char threshold.
  const out = runOutput(`{ blob: 'x'.repeat(60000) }`);
  assert.ok(out.startsWith('@file:'), `expected @file: spill, got: ${out.slice(0, 40)}`);
  const spillPath = out.slice('@file:'.length).trim();
  const roundTripped = JSON.parse(fs.readFileSync(spillPath, 'utf-8'));
  assert.equal(roundTripped.blob.length, 60000);
  assert.equal(roundTripped.blob, 'x'.repeat(60000));
  fs.unlinkSync(spillPath);
});
