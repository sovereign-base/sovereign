'use strict';

/**
 * Installed-engine reachability suite (quick task 260609-lkx, INSTALL-FIX).
 *
 * The critical install bug: `npx sovereign-cli init` copied skills + agents into
 * `.claude/` but never copied the ENGINE itself, so every installed skill's
 * `node "$ENGINE/bin/sovereign-tools.cjs" ...` invocation failed — the binary was
 * absent and `$ENGINE` was never defined (and per-block fresh shells mean a shell
 * var could never persist anyway).
 *
 * This suite proves the fix end-to-end:
 *   - Test A — runInstall copies engine/bin contents into
 *     .claude/sovereign-engine/ (sovereign-tools.cjs + lib/) and reports
 *     engine_copied + engine_path; .sovereign/ is still scaffolded.
 *   - Test B — the installed engine is reachable at the literal cwd-stable path
 *     and `init council` returns a valid blob (sovereign_version === packaged).
 *   - Test C — the real skill contract: a bare `state save` (no --field/--value)
 *     exits 0 from the installed location and regenerates .sovereign/MANIFEST.md.
 *     Every installed skill runs exactly this to persist, so the test proves it
 *     works (and proves require('./lib/...') resolves there).
 *   - Test D — regression tripwire: no shipped SKILL.md still contains `$ENGINE`.
 *
 * Pure fs over tmpdir fixtures; packageRoot = the real engine/ root. Handles the
 * @file: >50KB spill prefix exactly like pack-smoke.test.cjs. Skips (does not
 * fail) if something required is unavailable.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const PACKAGED_VERSION = fs.readFileSync(path.join(ENGINE_ROOT, 'VERSION'), 'utf-8').trim();

const { runInstall } = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'install.cjs'));

/** A fresh empty tmp dir to act as a project cwd. */
function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-installed-engine-'));
}

function rm(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

/** Read engine stdout honoring the @file: >50KB spill contract (mirror pack-smoke). */
function readSpill(out) {
  return out.startsWith('@file:')
    ? fs.readFileSync(out.slice('@file:'.length).trim(), 'utf8')
    : out;
}

// ─── Test A — the engine copy lands at the cwd-stable path ───────────────────

test('installed-engine Test A: runInstall copies engine/bin into .claude/sovereign-engine', () => {
  const dir = mkProject();
  try {
    const res = runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });

    const engineDir = path.join(dir, '.claude', 'sovereign-engine');
    assert.ok(
      fs.existsSync(path.join(engineDir, 'sovereign-tools.cjs')),
      'sovereign-tools.cjs present at .claude/sovereign-engine/'
    );
    assert.ok(
      fs.statSync(path.join(engineDir, 'lib')).isDirectory(),
      '.claude/sovereign-engine/lib/ is a directory'
    );

    assert.equal(res.engine_copied, true, 'result reports engine_copied');
    assert.equal(res.engine_path, '.claude/sovereign-engine', 'result reports engine_path');

    // runInstall still scaffolds .sovereign/.
    assert.equal(res.sovereign_scaffolded, true);
    assert.ok(fs.existsSync(path.join(dir, '.sovereign', 'STATE.md')));
  } finally {
    rm(dir);
  }
});

// ─── Test B — the installed engine is reachable + returns a valid blob ───────

test('installed-engine Test B: init council via the installed path returns a valid blob', () => {
  const dir = mkProject();
  try {
    runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });

    const res = spawnSync(
      process.execPath,
      ['.claude/sovereign-engine/sovereign-tools.cjs', 'init', 'council'],
      { cwd: dir, encoding: 'utf-8' }
    );
    assert.equal(res.status, 0, res.stderr);

    const blob = JSON.parse(readSpill(res.stdout));
    assert.equal(blob.sovereign_version, PACKAGED_VERSION, 'blob version equals packaged VERSION');
  } finally {
    rm(dir);
  }
});

// ─── Test C — the real skill contract: bare `state save` regenerates MANIFEST ─

test('installed-engine Test C: bare `state save` via the installed path exits 0 and regenerates MANIFEST', () => {
  const dir = mkProject();
  try {
    runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });

    const manifestPath = path.join(dir, '.sovereign', 'MANIFEST.md');
    // Remove any scaffolded MANIFEST so we prove `state save` *regenerates* it.
    fs.rmSync(manifestPath, { force: true });

    // This is exactly what every installed skill runs to persist — no --field/--value.
    const res = spawnSync(
      process.execPath,
      ['.claude/sovereign-engine/sovereign-tools.cjs', 'state', 'save'],
      { cwd: dir, encoding: 'utf-8' }
    );
    assert.equal(res.status, 0, res.stderr);

    const blob = JSON.parse(readSpill(res.stdout));
    assert.equal(blob.manifest_regenerated, true, 'bare `state save` reports manifest_regenerated');
    assert.ok(fs.existsSync(manifestPath), '.sovereign/MANIFEST.md was regenerated by bare `state save`');
  } finally {
    rm(dir);
  }
});

// ─── Test C2 — guard the asymmetry: bare `state patch` still exits 1 ─────────

test('installed-engine Test C2: bare `state patch` (no pair) still exits 1', () => {
  const dir = mkProject();
  try {
    runInstall({ cwd: dir, target: 'project', mode: 'full', packageRoot: ENGINE_ROOT });

    const res = spawnSync(
      process.execPath,
      ['.claude/sovereign-engine/sovereign-tools.cjs', 'state', 'patch'],
      { cwd: dir, encoding: 'utf-8' }
    );
    assert.equal(res.status, 1, 'bare `state patch` must error (requires a --field/--value pair)');
  } finally {
    rm(dir);
  }
});

// ─── Test D — regression tripwire: no SKILL.md still references $ENGINE ───────

test('installed-engine Test D: no shipped SKILL.md contains the literal $ENGINE', () => {
  const skillsDir = path.join(ENGINE_ROOT, 'skills');
  const skillDirs = fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  const offenders = [];
  for (const name of skillDirs) {
    const skillFile = path.join(skillsDir, name, 'SKILL.md');
    if (!fs.existsSync(skillFile)) continue;
    if (fs.readFileSync(skillFile, 'utf-8').includes('$ENGINE')) {
      offenders.push(name);
    }
  }
  assert.deepEqual(offenders, [], `SKILL.md files still referencing $ENGINE: ${offenders.join(', ')}`);
});
