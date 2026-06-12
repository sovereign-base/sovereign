'use strict';

/**
 * Suite for the `npx sovereign-cli upgrade` (alias `update`) command
 * (quick-260612-k4h, UPGRADE-01).
 *
 * runUpgrade(opts) is a thin, safe wrapper over runInstall: it refuses to
 * fresh-install. With no `.sovereign/.sovereign-version` stamp it does NOTHING
 * (no scaffold, no skills copy) and reports `not_installed`. With a stamp
 * present it delegates wholesale to runInstall — which is already
 * non-destructive (preserves `.sovereign/`), re-copies skills/agents/engine,
 * and re-stamps VERSION.
 *
 * Covers:
 *   - Test (a): runUpgrade on a fresh empty dir → status 'not_installed',
 *     ok false, no side effects (.sovereign/ and .claude/skills NOT created).
 *   - Test (b): install, backdate the stamp + write a user sentinel, then
 *     runUpgrade → status 'updated', previous_version '1.0.0', sentinel preserved.
 *   - Test (c): install then immediately runUpgrade → status 'up_to_date'.
 *   - Test (d): launcher `upgrade --cwd <installed>` exits 0 + reports upgrade/up-to-date.
 *   - Test (e): launcher `upgrade --cwd <empty>` exits non-zero + mentions init.
 *
 * All fixtures are tmpdirs; packageRoot is the real engine/ root. Pure fs.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const SOVEREIGN_BIN = path.join(ENGINE_ROOT, 'bin', 'sovereign.cjs');
const EXPECTED_VERSION = fs.readFileSync(path.join(ENGINE_ROOT, 'VERSION'), 'utf-8').trim();

const { runInstall, runUpgrade } = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'install.cjs'));

/** A fresh empty tmp dir to act as a project cwd. */
function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-upgrade-'));
}

function rm(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ─── runUpgrade (unit) ──────────────────────────────────────────────────────

test('upgrade Test (a): no stamp → not_installed with no side effects', () => {
  const dir = mkProject();
  try {
    const res = runUpgrade({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.status, 'not_installed');
    assert.equal(res.ok, false);
    assert.equal(res.installed_version, EXPECTED_VERSION);
    assert.equal(res.target, 'project');
    // Did NOTHING ELSE — no scaffold, no skills copy.
    assert.ok(!fs.existsSync(path.join(dir, '.sovereign')), 'no .sovereign/ created');
    assert.ok(!fs.existsSync(path.join(dir, '.claude', 'skills')), 'no .claude/skills created');
  } finally {
    rm(dir);
  }
});

test('upgrade Test (b): older stamp → updated, preserves user .sovereign content', () => {
  const dir = mkProject();
  try {
    runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    // Backdate the stamp to simulate an older install.
    const stamp = path.join(dir, '.sovereign', '.sovereign-version');
    fs.writeFileSync(stamp, '1.0.0', 'utf-8');
    // User sentinel must survive the upgrade.
    const sentinel = path.join(dir, '.sovereign', 'USER_SENTINEL.md');
    fs.writeFileSync(sentinel, 'keep me', 'utf-8');

    const res = runUpgrade({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.status, 'updated');
    assert.equal(res.previous_version, '1.0.0');
    assert.equal(res.installed_version, EXPECTED_VERSION);
    assert.ok(fs.existsSync(sentinel), 'user sentinel preserved');
    assert.equal(fs.readFileSync(sentinel, 'utf-8'), 'keep me');
  } finally {
    rm(dir);
  }
});

test('upgrade Test (c): already on packaged version → up_to_date', () => {
  const dir = mkProject();
  try {
    runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    const res = runUpgrade({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.status, 'up_to_date');
  } finally {
    rm(dir);
  }
});

// ─── Launcher integration ───────────────────────────────────────────────────

test('upgrade Test (d): launcher upgrade on an installed dir exits 0 and reports status', () => {
  const dir = mkProject();
  try {
    runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    // Backdate the stamp so the launcher exercises the 'updated' branch.
    fs.writeFileSync(path.join(dir, '.sovereign', '.sovereign-version'), '1.0.0', 'utf-8');

    const res = spawnSync(process.execPath, [SOVEREIGN_BIN, 'upgrade', '--cwd', dir], {
      encoding: 'utf-8',
    });
    assert.equal(res.status, 0, res.stderr);
    assert.ok(/Upgrad|up to date/i.test(res.stdout), res.stdout);
  } finally {
    rm(dir);
  }
});

test('upgrade Test (e): launcher upgrade on an empty dir exits non-zero and mentions init', () => {
  const dir = mkProject();
  try {
    const res = spawnSync(process.execPath, [SOVEREIGN_BIN, 'upgrade', '--cwd', dir], {
      encoding: 'utf-8',
    });
    assert.notEqual(res.status, 0);
    assert.ok(/init/.test(res.stdout + res.stderr), 'mentions init');
  } finally {
    rm(dir);
  }
});
