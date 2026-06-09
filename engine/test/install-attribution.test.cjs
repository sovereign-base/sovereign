'use strict';

/**
 * Suite for the installer's commit-attribution default (kills Claude
 * Co-Authored-By / "Generated with Claude Code" trailers team-wide).
 *
 * runInstall seeds `<installRoot>/settings.json` with
 *   includeCoAuthoredBy: false  (deprecated form)
 *   attribution: { commit: '', pr: '' }  (current form)
 * NON-DESTRUCTIVELY — preserving every existing key and never overriding an
 * explicit user choice.
 *
 * Covers:
 *   - fresh project → settings.json created with both keys
 *   - existing settings.json with unrelated keys (hooks) → those preserved, keys added
 *   - existing explicit includeCoAuthoredBy:true → NOT overridden
 *   - malformed settings.json → left untouched, install does not crash
 *
 * Pure fs over tmpdirs; packageRoot is the real engine/ root. No npm required.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const ENGINE_ROOT = path.join(__dirname, '..');
const { runInstall } = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'install.cjs'));

function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-attr-'));
}
function rm(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}
function readSettings(dir) {
  return JSON.parse(fs.readFileSync(path.join(dir, '.claude', 'settings.json'), 'utf-8'));
}

test('attribution: fresh project gets settings.json with includeCoAuthoredBy:false + attribution', () => {
  const dir = mkProject();
  try {
    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.attribution_default_set, true);
    const s = readSettings(dir);
    assert.equal(s.includeCoAuthoredBy, false);
    assert.deepEqual(s.attribution, { commit: '', pr: '' });
  } finally {
    rm(dir);
  }
});

test('attribution: existing unrelated keys (hooks) are preserved; attribution keys added', () => {
  const dir = mkProject();
  try {
    // Pre-seed a settings.json with a hooks block and no attribution keys.
    const claudeDir = path.join(dir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const preset = {
      hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'echo hi' }] }] },
      statusLine: { type: 'command', command: 'echo sl' },
    };
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), JSON.stringify(preset, null, 2) + '\n');

    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.attribution_default_set, true);
    const s = readSettings(dir);
    // Pre-existing keys untouched.
    assert.deepEqual(s.hooks, preset.hooks);
    assert.deepEqual(s.statusLine, preset.statusLine);
    // Attribution defaults added.
    assert.equal(s.includeCoAuthoredBy, false);
    assert.deepEqual(s.attribution, { commit: '', pr: '' });
  } finally {
    rm(dir);
  }
});

test('attribution: explicit includeCoAuthoredBy:true is NOT overridden', () => {
  const dir = mkProject();
  try {
    const claudeDir = path.join(dir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    // User deliberately opted IN to attribution.
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({ includeCoAuthoredBy: true }, null, 2) + '\n'
    );

    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    const s = readSettings(dir);
    // Explicit choice respected: still true.
    assert.equal(s.includeCoAuthoredBy, true);
    // attribution was absent, so it IS added (changed → true), but the existing key is untouched.
    assert.deepEqual(s.attribution, { commit: '', pr: '' });
    assert.equal(res.attribution_default_set, true);
  } finally {
    rm(dir);
  }
});

test('attribution: both keys already present → no change, attribution_default_set false', () => {
  const dir = mkProject();
  try {
    const claudeDir = path.join(dir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    fs.writeFileSync(
      path.join(claudeDir, 'settings.json'),
      JSON.stringify({ includeCoAuthoredBy: true, attribution: { commit: 'x', pr: 'y' } }, null, 2) + '\n'
    );

    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.attribution_default_set, false);
    const s = readSettings(dir);
    // Nothing overridden.
    assert.equal(s.includeCoAuthoredBy, true);
    assert.deepEqual(s.attribution, { commit: 'x', pr: 'y' });
  } finally {
    rm(dir);
  }
});

test('attribution: malformed settings.json is left untouched and install does not crash', () => {
  const dir = mkProject();
  try {
    const claudeDir = path.join(dir, '.claude');
    fs.mkdirSync(claudeDir, { recursive: true });
    const malformed = '{ this is not valid json ';
    fs.writeFileSync(path.join(claudeDir, 'settings.json'), malformed);

    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.attribution_default_set, false);
    // File left byte-for-byte untouched.
    assert.equal(fs.readFileSync(path.join(claudeDir, 'settings.json'), 'utf-8'), malformed);
  } finally {
    rm(dir);
  }
});
