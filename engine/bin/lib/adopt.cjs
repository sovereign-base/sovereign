// @ts-check
'use strict';

/**
 * adopt — the read-only ADOPT Layers-1+2 archaeology substrate (ADOPT-01).
 *
 * `adopt scan` does the cheap, mechanical scan and hands back a JSON contract;
 * the Phase-13 adopt skill/agent does Layer-3 surgical deep reads + the gap
 * analysis/retro-ADR reasoning. Keeping the mechanical scan in the engine keeps
 * that skill thin and token-bounded.
 *
 *   Layer 1 (manifests) — existence-check a table of known config/manifest files
 *     → infer detected.languages + package_managers + flags
 *       (has_dockerfile / has_ci / has_tests / monorepo).
 *   Layer 2 (structure) — a gitignore-aware filename tree: `git ls-files` when the
 *     dir is a git repo (so .gitignore'd / node_modules entries are absent),
 *     otherwise a bounded recursive walk skipping vendored/build dirs. Capped at
 *     MAX_TREE with a `truncated` flag; file_count is the full total.
 *   deep_read_candidates — heuristic {path, reason} suggestions (entrypoint /
 *     auth / base-model / config) the agent may choose to deep-read in Layer 3.
 *
 * SCOPE GUARD (REQUIREMENTS ADOPT-01): this scanner READS + RECORDS only — it
 * NEVER writes to, mutates, or refactors the scanned project. Output via the
 * core output() helper (inherits the @file: >50KB spill for large trees — never
 * reimplement spill). Greenfield-safe: a non-git dir or a missing/empty project
 * returns safe values and never throws. Zero runtime deps (node: built-ins).
 */

const fs = require('node:fs');
const path = require('node:path');
const { output, execGit } = require('./core.cjs');

/** Hard cap on tree size; over-cap scans set structure.truncated = true. */
const MAX_TREE = 2000;

/** Dir names skipped by the non-git walk (vendored / build / VCS output). */
const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  '.next',
  'vendor',
  'coverage',
  '.turbo',
  '.cache',
]);

/**
 * Layer-1 manifest table: repo-relative filename → { kind, languages?, manager? }.
 * `languages` feeds detected.languages; `manager` feeds detected.package_managers.
 */
const MANIFESTS = [
  { file: 'package.json', kind: 'npm', languages: ['javascript'], manager: 'npm' },
  { file: 'tsconfig.json', kind: 'typescript', languages: ['typescript'] },
  { file: 'pyproject.toml', kind: 'pip', languages: ['python'], manager: 'pip' },
  { file: 'requirements.txt', kind: 'pip', languages: ['python'], manager: 'pip' },
  { file: 'go.mod', kind: 'go', languages: ['go'], manager: 'go' },
  { file: 'Cargo.toml', kind: 'cargo', languages: ['rust'], manager: 'cargo' },
  { file: 'pom.xml', kind: 'maven-gradle', languages: ['java'], manager: 'maven' },
  { file: 'build.gradle', kind: 'maven-gradle', languages: ['java'], manager: 'gradle' },
  { file: 'Gemfile', kind: 'bundler', languages: ['ruby'], manager: 'bundler' },
  { file: 'composer.json', kind: 'composer', languages: ['php'], manager: 'composer' },
  { file: 'Dockerfile', kind: 'docker' },
  { file: 'docker-compose.yml', kind: 'compose' },
  { file: '.env.example', kind: 'env' },
];

/** @param {string} cwd @param {string} rel @returns {boolean} */
function exists(cwd, rel) {
  try {
    return fs.existsSync(path.join(cwd, rel));
  } catch {
    return false;
  }
}

/** @param {string} cwd @param {string} rel @returns {boolean} */
function isDir(cwd, rel) {
  try {
    return fs.statSync(path.join(cwd, rel)).isDirectory();
  } catch {
    return false;
  }
}

/**
 * Whether `cwd` is inside a git work tree (drives the ls-files vs walk choice).
 * @param {string} cwd
 * @returns {boolean}
 */
function isGitRepo(cwd) {
  return execGit(cwd, ['rev-parse', '--is-inside-work-tree']).exitCode === 0;
}

/**
 * Layer 2 — the gitignore-aware filename list (relative paths, files only).
 * Uses `git ls-files` in a git repo (respects .gitignore for free); otherwise a
 * bounded recursive walk skipping SKIP_DIRS. Never throws.
 * @param {string} cwd
 * @returns {string[]}
 */
function listFiles(cwd) {
  if (isGitRepo(cwd)) {
    const res = execGit(cwd, ['ls-files']);
    if (res.exitCode === 0) {
      return res.stdout
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((p) => p.split('/').join(path.sep));
    }
  }
  // Non-git (or ls-files failed): bounded manual walk.
  /** @type {string[]} */
  const out = [];
  /** @param {string} dir @param {string} rel */
  const walk = (dir, rel) => {
    if (out.length > MAX_TREE + 1) return; // bound the scan once well past the cap
    /** @type {fs.Dirent[]} */
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const childRel = rel ? path.join(rel, ent.name) : ent.name;
      if (ent.isDirectory()) {
        if (SKIP_DIRS.has(ent.name)) continue;
        walk(path.join(dir, ent.name), childRel);
      } else if (ent.isFile()) {
        out.push(childRel);
      }
    }
  };
  walk(cwd, '');
  return out;
}

/**
 * deep_read_candidates — heuristic {path, reason} suggestions from the file list.
 * Capped at 10; each reason emitted at most once. Order: entrypoint, auth,
 * base-model, config (most-useful-first for a token-bounded Layer 3).
 * @param {string[]} files - relative file paths
 * @returns {{path: string, reason: string}[]}
 */
function deepReadCandidates(files) {
  /** @type {{path: string, reason: string}[]} */
  const candidates = [];
  const seenReason = new Set();
  // Normalize to forward-slash for stable matching across platforms.
  const norm = files.map((f) => ({ raw: f, lc: f.split(path.sep).join('/').toLowerCase() }));

  /** @param {string} reason @param {(lc: string) => boolean} match */
  const pick = (reason, match) => {
    if (seenReason.has(reason)) return;
    const hit = norm.find((f) => match(f.lc));
    if (hit) {
      candidates.push({ path: hit.raw, reason });
      seenReason.add(reason);
    }
  };

  // entrypoint: src/index.*, main.*, app.* (or top-level index/main/app)
  pick('entrypoint', (lc) => /(^|\/)(index|main|app|server)\.[a-z]+$/.test(lc));
  // auth: middleware/auth*, anything under an auth path
  pick('auth', (lc) => /(^|\/)(auth|middleware\/auth|auth\/)/.test(lc) || /auth[\w-]*\.[a-z]+$/.test(lc));
  // base-model: models/ dir or schema.* / *.prisma
  pick('base-model', (lc) => /(^|\/)models\//.test(lc) || /schema\.[a-z]+$/.test(lc) || lc.endsWith('.prisma'));
  // config: a primary manifest/config file
  pick('config', (lc) => /(^|\/)(package\.json|tsconfig\.json|pyproject\.toml|go\.mod|cargo\.toml)$/.test(lc));

  return candidates.slice(0, 10);
}

/**
 * Run the Layers-1+2 scan and return the JSON contract object. Pure read — never
 * writes to `cwd`. Greenfield-safe: empty / non-git / missing dirs yield safe
 * empties and never throw.
 *
 * @param {string} cwd - absolute project root to scan
 * @returns {{
 *   project_root: string,
 *   manifests: {path: string, kind: string, present: boolean}[],
 *   detected: {
 *     languages: string[], package_managers: string[],
 *     has_dockerfile: boolean, has_ci: boolean, has_tests: boolean, monorepo: boolean
 *   },
 *   structure: { top_level_dirs: string[], file_count: number, tree: string[], truncated: boolean },
 *   deep_read_candidates: {path: string, reason: string}[]
 * }}
 */
function scanProject(cwd) {
  // ── Layer 1: manifests + inferred languages/managers ──
  /** @type {{path: string, kind: string, present: boolean}[]} */
  const manifests = [];
  const languages = new Set();
  const managers = new Set();
  for (const m of MANIFESTS) {
    if (!exists(cwd, m.file)) continue;
    manifests.push({ path: m.file, kind: m.kind, present: true });
    for (const l of m.languages || []) languages.add(l);
    if (m.manager) managers.add(m.manager);
  }

  const has_dockerfile = exists(cwd, 'Dockerfile');
  const has_ci = isDir(cwd, path.join('.github', 'workflows'));

  // ── Layer 2: gitignore-aware structure ──
  const fullList = listFiles(cwd);
  const file_count = fullList.length;
  const truncated = fullList.length > MAX_TREE;
  const tree = fullList.slice(0, MAX_TREE);

  // top-level dirs: unique first path segments that are actually directories.
  const topSegs = new Set();
  for (const rel of fullList) {
    const seg = rel.split(path.sep)[0];
    if (seg && rel.includes(path.sep)) topSegs.add(seg);
  }
  const top_level_dirs = [...topSegs].filter((d) => isDir(cwd, d)).sort();

  // has_tests: a test dir, or any *.test.*/*.spec.* file in the tree.
  const has_tests =
    isDir(cwd, 'test') ||
    isDir(cwd, 'tests') ||
    isDir(cwd, '__tests__') ||
    fullList.some((f) => /\.(test|spec)\.[a-z]+$/i.test(f));

  // monorepo: package.json workspaces, or a packages/ or apps/ dir.
  let monorepo = isDir(cwd, 'packages') || isDir(cwd, 'apps');
  if (!monorepo && exists(cwd, 'package.json')) {
    try {
      const pkg = JSON.parse(fs.readFileSync(path.join(cwd, 'package.json'), 'utf-8'));
      if (pkg && pkg.workspaces) monorepo = true;
    } catch {
      // unparseable package.json → leave monorepo as-is (greenfield-safe)
    }
  }

  const deep_read_candidates = deepReadCandidates(fullList);

  return {
    project_root: cwd,
    manifests,
    detected: {
      languages: [...languages],
      package_managers: [...managers],
      has_dockerfile,
      has_ci,
      has_tests,
      monorepo,
    },
    structure: { top_level_dirs, file_count, tree, truncated },
    deep_read_candidates,
  };
}

/**
 * `adopt scan` — emit the Layers-1+2 contract for `cwd`. Relies on core output()
 * (and its @file: spill) for large trees. Read-only.
 *
 * @param {string} cwd - project root to scan
 * @param {boolean} [raw] - emit raw scalar instead of JSON (unused; JSON only)
 * @returns {void}
 */
function cmdAdoptScan(cwd, raw) {
  output(scanProject(cwd), raw);
}

module.exports = {
  cmdAdoptScan,
  scanProject,
  MAX_TREE,
};
