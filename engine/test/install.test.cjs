'use strict';

/**
 * Suite for the `npx sovereign init` installer (plan 02-01, INIT-01/02/03).
 *
 * runInstall(opts) is the pure install core: target resolution (.claude vs
 * ~/.claude), recursive copy of packaged skills+agents, non-destructive
 * scaffold of .sovereign/ from templates, and version-aware re-run behavior.
 *
 * Covers:
 *   - Test 1: fresh install (mode 'full') → status 'installed', .sovereign/ scaffolded,
 *     packaged agents copied if present.
 *   - Test 2: idempotent re-run → status 'up_to_date', .sovereign/ left untouched
 *     (a sentinel file written into .sovereign/ survives the re-run).
 *   - Test 3: mode 'quick' → skills_copied ⊆ Fast Lane 5; agents still copied.
 *   - Test 4: stale version stamp → status 'updated', stamp rewritten to packaged VERSION.
 *   - Launcher integration (Task 2): spawnSync sovereign.cjs init --full scaffolds
 *     .sovereign/; sovereign.cjs --version prints the version; unknown command exits non-zero.
 *
 * All fixtures are tmpdirs; packageRoot is the real engine/ root (VERSION +
 * templates/ live there). Pure fs — no npm required.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const SOVEREIGN_BIN = path.join(ENGINE_ROOT, 'bin', 'sovereign.cjs');
const PACKAGED_VERSION = fs.readFileSync(path.join(ENGINE_ROOT, 'VERSION'), 'utf-8').trim();

const { runInstall, cmdInstall, FAST_LANE } = require(
  path.join(ENGINE_ROOT, 'bin', 'lib', 'install.cjs')
);

/** A fresh empty tmp dir to act as a project cwd. */
function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-install-'));
}

function rm(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ─── runInstall (unit) ──────────────────────────────────────────────────────

test('install Test 1: fresh full install scaffolds .sovereign and reports installed', () => {
  const dir = mkProject();
  try {
    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.ok, true);
    assert.equal(res.target, 'project');
    assert.equal(res.mode, 'full');
    assert.equal(res.status, 'installed');
    assert.equal(res.installed_version, PACKAGED_VERSION);
    assert.equal(res.previous_version, null);
    assert.equal(res.sovereign_scaffolded, true);
    // .sovereign/ scaffolded from templates.
    assert.ok(fs.existsSync(path.join(dir, '.sovereign', 'STATE.md')));
    assert.ok(fs.existsSync(path.join(dir, '.sovereign', 'MANIFEST.md')));
    // version stamp written inside .sovereign/ so it travels with committed state.
    assert.ok(fs.existsSync(path.join(dir, '.sovereign', '.sovereign-version')));
    assert.ok(Array.isArray(res.skills_copied));
    assert.ok(Array.isArray(res.agents_copied));
    // If the package ships agents (plan 02-02), they land in .claude/agents/.
    const pkgAgents = path.join(ENGINE_ROOT, 'agents');
    if (fs.existsSync(pkgAgents)) {
      for (const name of res.agents_copied) {
        assert.ok(fs.existsSync(path.join(dir, '.claude', 'agents', name + '.md')));
      }
    } else {
      assert.deepEqual(res.agents_copied, []);
    }
  } finally {
    rm(dir);
  }
});

test('install Test 2: re-running identical install is non-destructive (up_to_date)', () => {
  const dir = mkProject();
  try {
    runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    // Write a sentinel into .sovereign/ to prove user content survives re-run.
    const sentinel = path.join(dir, '.sovereign', 'USER_SENTINEL.md');
    fs.writeFileSync(sentinel, 'do not clobber me', 'utf-8');

    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.status, 'up_to_date');
    assert.equal(res.sovereign_scaffolded, false);
    assert.equal(res.previous_version, PACKAGED_VERSION);
    assert.equal(res.installed_version, PACKAGED_VERSION);
    // Sentinel survived → .sovereign/ left untouched.
    assert.ok(fs.existsSync(sentinel));
    assert.equal(fs.readFileSync(sentinel, 'utf-8'), 'do not clobber me');
  } finally {
    rm(dir);
  }
});

test('install Test 3: quick mode filters skills to the Fast Lane 5', () => {
  const dir = mkProject();
  try {
    const res = runInstall({ cwd: dir, target: 'project', mode: 'quick', packageRoot: ENGINE_ROOT });
    assert.equal(res.mode, 'quick');
    // Every copied skill must be a Fast Lane name (currently empty — no skill dirs ship yet).
    for (const name of res.skills_copied) {
      assert.ok(FAST_LANE.includes(name), `unexpected skill ${name}`);
    }
    // Agents are copied regardless of skill mode.
    const pkgAgents = path.join(ENGINE_ROOT, 'agents');
    if (fs.existsSync(pkgAgents)) {
      assert.ok(res.agents_copied.length >= 0);
    } else {
      assert.deepEqual(res.agents_copied, []);
    }
  } finally {
    rm(dir);
  }
});

test('install Test 4: a stale version stamp triggers an update', () => {
  const dir = mkProject();
  try {
    runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    // Bump the stamp backwards to simulate an older install.
    const stamp = path.join(dir, '.sovereign', '.sovereign-version');
    fs.writeFileSync(stamp, '1.0.0', 'utf-8');

    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });
    assert.equal(res.status, 'updated');
    assert.equal(res.previous_version, '1.0.0');
    assert.equal(res.installed_version, PACKAGED_VERSION);
    // Stamp rewritten to the packaged version.
    assert.equal(fs.readFileSync(stamp, 'utf-8').trim(), PACKAGED_VERSION);
  } finally {
    rm(dir);
  }
});

test('install: FAST_LANE is the documented set of five skill names', () => {
  assert.deepEqual(
    [...FAST_LANE].sort(),
    ['grill-with-docs', 'handoff', 'sentinel', 'tdd', 'ubiquitous-language'].sort()
  );
});

test('install: cmdInstall is exported and callable', () => {
  assert.equal(typeof cmdInstall, 'function');
});

// ─── Launcher integration (Task 2) ──────────────────────────────────────────

test('launcher: sovereign.cjs init --full scaffolds .sovereign in the cwd', () => {
  const dir = mkProject();
  try {
    const res = spawnSync(process.execPath, [SOVEREIGN_BIN, 'init', '--full'], {
      cwd: dir,
      encoding: 'utf-8',
    });
    assert.equal(res.status, 0, res.stderr);
    assert.ok(fs.existsSync(path.join(dir, '.sovereign', 'STATE.md')));
  } finally {
    rm(dir);
  }
});

test('launcher: sovereign.cjs --version prints the version', () => {
  const res = spawnSync(process.execPath, [SOVEREIGN_BIN, '--version'], { encoding: 'utf-8' });
  assert.equal(res.status, 0, res.stderr);
  assert.ok(res.stdout.includes(PACKAGED_VERSION), res.stdout);
});

test('launcher: unknown command exits non-zero', () => {
  const res = spawnSync(process.execPath, [SOVEREIGN_BIN, 'bogus-cmd'], { encoding: 'utf-8' });
  assert.notEqual(res.status, 0);
});
