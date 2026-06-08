'use strict';

/**
 * Unit suite for engine layer B — model resolution (plan 01-04).
 *
 * Exercises resolveModelInternal's exact order:
 *   per-agent override → resolve_model_ids:'omit' (='') → profile table → 'sonnet'.
 *
 *   - quality  → advisor = opus
 *   - balanced → advisor = sonnet
 *   - model_overrides.advisor = haiku wins regardless of profile
 *   - resolve_model_ids:'omit' → '' for any agent
 *   - unknown agent → 'sonnet'
 *
 * Uses node:test + node:assert/strict with .sovereign/config.json fixtures.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ENGINE_ROOT = path.join(__dirname, '..');
const { resolveModelInternal } = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'model.cjs'));

/** Create a tmp project with a .sovereign/config.json from the given config object. */
function mkProject(config) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sov-model-'));
  const sov = path.join(dir, '.sovereign');
  fs.mkdirSync(sov, { recursive: true });
  fs.writeFileSync(path.join(sov, 'config.json'), JSON.stringify(config, null, 2));
  return dir;
}

test('quality profile resolves advisor to opus', () => {
  const dir = mkProject({ model_profile: 'quality' });
  assert.equal(resolveModelInternal(dir, 'advisor'), 'opus');
});

test('balanced profile resolves advisor to sonnet', () => {
  const dir = mkProject({ model_profile: 'balanced' });
  assert.equal(resolveModelInternal(dir, 'advisor'), 'sonnet');
});

test('per-agent override wins regardless of profile', () => {
  const dir = mkProject({ model_profile: 'quality', model_overrides: { advisor: 'haiku' } });
  assert.equal(resolveModelInternal(dir, 'advisor'), 'haiku');
});

test("resolve_model_ids:'omit' returns '' for any agent", () => {
  const dir = mkProject({ model_profile: 'quality', resolve_model_ids: 'omit' });
  assert.equal(resolveModelInternal(dir, 'advisor'), '');
  assert.equal(resolveModelInternal(dir, 'sentinel'), '');
});

test('unknown agent falls back to sonnet', () => {
  const dir = mkProject({ model_profile: 'quality' });
  assert.equal(resolveModelInternal(dir, 'no-such-agent'), 'sonnet');
});
