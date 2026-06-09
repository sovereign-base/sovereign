'use strict';

/**
 * Unit suite for engine module adopt (plan 10-03).
 *
 * Exercises the ADOPT Layers-1+2 read-only archaeology scanner:
 *   1. Manifest + language + flag detection over a real fixture tree.
 *   2. structure.tree lists filenames only; file_count + top_level_dirs correct.
 *   3. Gitignore-aware: git ls-files path drops .gitignore'd files (skips w/o git).
 *   4. Non-git fallback: bounded walk skips node_modules/.git/dist.
 *   5. Cap/truncation: structure.truncated is the correct boolean.
 *   6. Greenfield safety: empty non-git dir → all-empty contract, no throw,
 *      and the dir is left UNCHANGED (read-only invariant).
 *
 * Uses node:test + node:assert/strict with real tmp dirs (zero deps).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const { cmdAdoptScan, scanProject, MAX_TREE } = require(
  path.join(ENGINE_ROOT, 'bin', 'lib', 'adopt.cjs')
);

/** Run an adopt command while capturing its output() write to fd 1 → parsed JSON. */
function capture(fn) {
  const origWriteSync = fs.writeSync;
  let captured = '';
  fs.writeSync = function (fd, data, ...rest) {
    if (fd === 1) {
      captured += String(data);
      return;
    }
    return origWriteSync.call(fs, fd, data, ...rest);
  };
  try {
    fn();
  } finally {
    fs.writeSync = origWriteSync;
  }
  // output() spills >50KB payloads to an @file: tmpfile; resolve it for assertions.
  if (captured.startsWith('@file:')) {
    captured = fs.readFileSync(captured.slice('@file:'.length), 'utf-8');
  }
  return JSON.parse(captured);
}

/** Fresh tmp project root. */
function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-adopt-'));
}

/** Whether git is available + usable (mirrors pack-smoke's hasNpm guard). */
function hasGit() {
  try {
    return spawnSync('git', ['--version'], { stdio: 'pipe' }).status === 0;
  } catch {
    return false;
  }
}

/** Recursively snapshot the relative file list under a dir (for read-only proof). */
function snapshot(dir) {
  const out = [];
  const walk = (d, rel) => {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const r = rel ? path.join(rel, ent.name) : ent.name;
      if (ent.isDirectory()) walk(path.join(d, ent.name), r);
      else out.push(r);
    }
  };
  walk(dir, '');
  return out.sort();
}

// ─── 1. manifest + language + flag detection ────────────────────────────────

test('scanProject detects manifests, languages, and flags from a real fixture', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x"}');
  fs.writeFileSync(path.join(dir, 'tsconfig.json'), '{}');
  fs.writeFileSync(path.join(dir, 'Dockerfile'), 'FROM node');
  fs.mkdirSync(path.join(dir, '.github', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.github', 'workflows', 'ci.yml'), 'on: push');
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), 'export {}');

  const r = scanProject(dir);

  assert.ok(r.manifests.some((m) => m.kind === 'npm'), 'npm manifest present');
  assert.ok(r.manifests.some((m) => m.kind === 'typescript'), 'tsconfig manifest present');
  assert.ok(r.detected.languages.includes('typescript'), 'typescript language inferred');
  assert.ok(r.detected.languages.includes('javascript'), 'javascript language inferred');
  assert.equal(r.detected.has_dockerfile, true);
  assert.equal(r.detected.has_ci, true);
  assert.ok(Array.isArray(r.detected.package_managers));
  assert.ok(r.detected.package_managers.includes('npm'));
  assert.equal(r.project_root, dir);
});

// ─── 2. structure: filenames only, file_count, top_level_dirs ───────────────

test('structure.tree lists filenames only; file_count + top_level_dirs correct', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x"}');
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), 'export const greeting = "hi"');

  const r = scanProject(dir);

  assert.ok(r.structure.file_count > 0);
  assert.equal(r.structure.file_count, r.structure.tree.length);
  // tree entries are relative paths, never file contents
  for (const entry of r.structure.tree) {
    assert.equal(typeof entry, 'string');
    assert.ok(!entry.includes('greeting'), 'tree must not contain file contents');
  }
  assert.ok(r.structure.tree.includes(path.join('src', 'index.ts')));
  assert.ok(r.structure.top_level_dirs.includes('src'));
  assert.equal(r.structure.truncated, false);
});

// ─── 3. gitignore-aware via git ls-files ────────────────────────────────────

test('gitignore-aware: git ls-files path drops .gitignore\'d files', { skip: !hasGit() }, () => {
  const dir = mkProject();
  spawnSync('git', ['init', '-q'], { cwd: dir });
  spawnSync('git', ['config', 'user.email', 't@t'], { cwd: dir });
  spawnSync('git', ['config', 'user.name', 't'], { cwd: dir });
  fs.writeFileSync(path.join(dir, '.gitignore'), 'secret.txt\n');
  fs.writeFileSync(path.join(dir, 'secret.txt'), 'TOPSECRET');
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x"}');
  spawnSync('git', ['add', '-A'], { cwd: dir });

  const r = scanProject(dir);
  assert.ok(!r.structure.tree.includes('secret.txt'), 'gitignored file must be absent from tree');
  assert.ok(r.structure.tree.includes('package.json'), 'tracked file present');
});

// ─── 4. non-git fallback: bounded walk skips node_modules ───────────────────

test('non-git fallback: bounded walk skips node_modules/.git/dist', () => {
  const dir = mkProject(); // no git init → walk path
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x"}');
  fs.mkdirSync(path.join(dir, 'node_modules', 'left-pad'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'node_modules', 'left-pad', 'index.js'), 'module.exports={}');
  fs.mkdirSync(path.join(dir, 'dist'));
  fs.writeFileSync(path.join(dir, 'dist', 'bundle.js'), '//');
  fs.mkdirSync(path.join(dir, 'src'));
  fs.writeFileSync(path.join(dir, 'src', 'app.js'), '//');

  const r = scanProject(dir);
  assert.ok(r.structure.tree.length > 0, 'walk returns a tree');
  assert.ok(
    !r.structure.tree.some((p) => p.split(path.sep).includes('node_modules')),
    'node_modules entries skipped'
  );
  assert.ok(
    !r.structure.tree.some((p) => p.split(path.sep).includes('dist')),
    'dist entries skipped'
  );
  assert.ok(r.structure.tree.includes(path.join('src', 'app.js')));
});

// ─── 5. cap / truncation ────────────────────────────────────────────────────

test('structure.truncated is false under the cap, true over it', () => {
  assert.equal(typeof MAX_TREE, 'number');

  // Small tree → not truncated.
  const small = mkProject();
  fs.writeFileSync(path.join(small, 'a.js'), '//');
  assert.equal(scanProject(small).structure.truncated, false);

  // Over-cap tree → truncated, tree capped at MAX_TREE, file_count is the full total.
  const big = mkProject();
  const total = MAX_TREE + 5;
  for (let i = 0; i < total; i++) {
    fs.writeFileSync(path.join(big, `f${i}.txt`), 'x');
  }
  const r = scanProject(big);
  assert.equal(r.structure.truncated, true);
  assert.equal(r.structure.tree.length, MAX_TREE);
  assert.ok(r.structure.file_count >= total);
});

// ─── 6. deep_read_candidates heuristics ─────────────────────────────────────

test('deep_read_candidates surfaces entrypoint/auth heuristics', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x"}');
  fs.mkdirSync(path.join(dir, 'src', 'middleware'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'src', 'index.ts'), '//');
  fs.writeFileSync(path.join(dir, 'src', 'middleware', 'auth.ts'), '//');

  const r = scanProject(dir);
  assert.ok(Array.isArray(r.deep_read_candidates));
  const reasons = r.deep_read_candidates.map((c) => c.reason);
  assert.ok(reasons.includes('entrypoint'), 'entrypoint candidate found');
  assert.ok(reasons.includes('auth'), 'auth candidate found');
  for (const c of r.deep_read_candidates) {
    assert.ok('path' in c && 'reason' in c);
  }
  assert.ok(r.deep_read_candidates.length <= 10, 'candidates capped');
});

// ─── 7. greenfield safety + read-only invariant ─────────────────────────────

test('greenfield: empty non-git dir → all-empty contract, no throw, dir unchanged', () => {
  const dir = mkProject();
  const before = snapshot(dir);

  let r;
  assert.doesNotThrow(() => {
    r = scanProject(dir);
  });

  assert.deepEqual(r.manifests, []);
  assert.deepEqual(r.detected.languages, []);
  assert.deepEqual(r.detected.package_managers, []);
  assert.equal(r.detected.has_dockerfile, false);
  assert.equal(r.detected.has_ci, false);
  assert.equal(r.detected.has_tests, false);
  assert.equal(r.detected.monorepo, false);
  assert.equal(r.structure.file_count, 0);
  assert.deepEqual(r.structure.tree, []);
  assert.deepEqual(r.structure.top_level_dirs, []);
  assert.equal(r.structure.truncated, false);
  assert.deepEqual(r.deep_read_candidates, []);

  // Read-only invariant: scanProject wrote NOTHING to the dir.
  assert.deepEqual(snapshot(dir), before, 'scanProject must not modify the project dir');
});

// ─── 8. cmdAdoptScan emits the full contract via output() ────────────────────

test('cmdAdoptScan emits the full Layers-1+2 contract shape', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x"}');
  const before = snapshot(dir);

  const out = capture(() => cmdAdoptScan(dir, false));

  assert.equal(out.project_root, dir);
  assert.ok(Array.isArray(out.manifests));
  assert.ok(out.detected && typeof out.detected === 'object');
  assert.ok(out.structure && Array.isArray(out.structure.tree));
  assert.equal(typeof out.structure.truncated, 'boolean');
  assert.ok(Array.isArray(out.deep_read_candidates));

  // cmdAdoptScan is read-only too.
  assert.deepEqual(snapshot(dir), before, 'cmdAdoptScan must not modify the project dir');
});

test('detects monorepo via packages/ dir and has_tests via a test dir', () => {
  const dir = mkProject();
  fs.writeFileSync(path.join(dir, 'package.json'), '{"name":"x"}');
  fs.mkdirSync(path.join(dir, 'packages', 'a'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'packages', 'a', 'index.js'), '//');
  fs.mkdirSync(path.join(dir, 'test'));
  fs.writeFileSync(path.join(dir, 'test', 'x.test.js'), '//');

  const r = scanProject(dir);
  assert.equal(r.detected.monorepo, true);
  assert.equal(r.detected.has_tests, true);
});
