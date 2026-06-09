// @ts-check
'use strict';

/**
 * core — shared engine primitives (zero dependency, node: built-ins only).
 *
 * Provides the output/error contract, safe file reads, project-root discovery,
 * and the deep-merged config loader every sovereign-tools command depends on.
 *
 * Exports:
 *   output(result, raw, rawValue)  — JSON to stdout, spilling >50KB payloads to a
 *                                    tmpfile and emitting `@file:/tmp/...` instead.
 *   error(message)                 — `Error: <msg>` to stderr, exit(1).
 *   safeReadFile(p)                — fs.readFileSync utf-8 or null on failure.
 *   findProjectRoot(startDir)      — nearest ancestor containing `.sovereign/`.
 *   loadConfig(cwd)                — defaults <- ~/.sovereign/defaults.json <- .sovereign/config.json.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync, execFileSync } = require('node:child_process');

// ─── Output helpers ─────────────────────────────────────────────────────────

/**
 * Write a command result to stdout.
 *
 * When `raw` is set and `rawValue` is provided, the raw scalar is written
 * verbatim (used by `--pick` to return a bare string). Otherwise the result is
 * JSON-serialized; payloads larger than 50KB are spilled to a tmpfile and the
 * path is emitted prefixed with `@file:` so callers can detect and read it —
 * this keeps large `init` blobs from overflowing Claude Code's ~50KB Bash
 * buffer (the mandatory spill, per ARCHITECTURE.md).
 *
 * fs.writeSync(1, ...) blocks until the kernel accepts the bytes; we never call
 * process.exit() here so the event loop drains the pipe naturally.
 *
 * @param {*} result - value to serialize and emit
 * @param {boolean} [raw] - when true, emit rawValue verbatim
 * @param {*} [rawValue] - the raw scalar to emit when raw is set
 * @returns {void}
 */
function output(result, raw, rawValue) {
  let data;
  if (raw && rawValue !== undefined) {
    data = String(rawValue);
  } else {
    const json = JSON.stringify(result, null, 2);
    if (json.length > 50000) {
      const tmpPath = path.join(os.tmpdir(), 'sovereign-' + Date.now() + '.json');
      fs.writeFileSync(tmpPath, json, 'utf-8');
      data = '@file:' + tmpPath;
    } else {
      data = json;
    }
  }
  fs.writeSync(1, data);
}

/**
 * Write an error to stderr and exit non-zero.
 * @param {string} message
 * @returns {never}
 */
function error(message) {
  fs.writeSync(2, 'Error: ' + message + '\n');
  process.exit(1);
}

// ─── File utilities ───────────────────────────────────────────────────────────

/**
 * Read a file as utf-8, returning null instead of throwing on any failure.
 * @param {string} p
 * @returns {string | null}
 */
function safeReadFile(p) {
  try {
    return fs.readFileSync(p, 'utf-8');
  } catch {
    return null;
  }
}

// ─── Project root discovery ─────────────────────────────────────────────────

/**
 * Walk up parent directories from `startDir`, returning the first that contains
 * a `.sovereign/` directory. Falls back to `startDir` when none is found
 * (first-run / not-yet-initialized projects).
 * @param {string} startDir
 * @returns {string}
 */
function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;
  while (true) {
    const candidate = path.join(dir, '.sovereign');
    try {
      if (fs.statSync(candidate).isDirectory()) return dir;
    } catch {
      // not here — keep walking
    }
    if (dir === root) break;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return startDir;
}

// ─── Config loading ───────────────────────────────────────────────────────────

/**
 * Recursively deep-merge `b` onto `a`. Plain objects merge key-by-key; scalars
 * and arrays from `b` overwrite `a`. Neither input is mutated.
 * @param {Record<string, *>} a
 * @param {Record<string, *>} b
 * @returns {Record<string, *>}
 */
function deepMerge(a, b) {
  const out = Array.isArray(a) ? a.slice() : { ...a };
  for (const key of Object.keys(b)) {
    const av = out[key];
    const bv = b[key];
    if (isPlainObject(av) && isPlainObject(bv)) {
      out[key] = deepMerge(av, bv);
    } else {
      out[key] = bv;
    }
  }
  return out;
}

/** @param {*} v @returns {boolean} */
function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * Parse a JSON config file, returning null if it is missing or unparseable.
 * @param {string} p
 * @returns {Record<string, *> | null}
 */
function readJsonLayer(p) {
  const raw = safeReadFile(p);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return isPlainObject(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Load the merged engine config for a project.
 *
 * Merge order (later layers win): hardcoded defaults
 *   <- optional global `~/.sovereign/defaults.json`
 *   <- project `<cwd>/.sovereign/config.json`.
 *
 * Any layer that is missing or unparseable is silently skipped (never throws).
 * @param {string} cwd - project root
 * @returns {Record<string, *>}
 */
function loadConfig(cwd) {
  const defaults = {
    model_profile: 'balanced',
    commit_docs: true,
    parallelization: true,
    council_mode_default: 'standard',
    resolve_model_ids: false,
    context_window: 200000,
  };

  let merged = defaults;

  const globalLayer = readJsonLayer(path.join(os.homedir(), '.sovereign', 'defaults.json'));
  if (globalLayer) merged = deepMerge(merged, globalLayer);

  const projectLayer = readJsonLayer(path.join(cwd, '.sovereign', 'config.json'));
  if (projectLayer) merged = deepMerge(merged, projectLayer);

  return merged;
}

// ─── Git helpers ──────────────────────────────────────────────────────────────

/**
 * Run a git command via execFileSync (array args, no shell), never throwing.
 * Returns the exit code plus trimmed stdout/stderr so callers branch on results
 * rather than try/catch. Array args prevent shell interpretation of file paths.
 * @param {string} cwd
 * @param {string[]} args
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function execGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? '').toString().trim(),
    stderr: (result.stderr ?? '').toString().trim(),
  };
}

/**
 * Report whether `targetPath` is gitignored under `cwd`.
 *
 * Uses `git check-ignore -q --no-index`; `--no-index` honors .gitignore rules
 * even for already-tracked paths (the common case where `.sovereign/` was
 * committed before being added to .gitignore). execFileSync with array args
 * avoids shell interpretation of crafted path names.
 * @param {string} cwd
 * @param {string} targetPath
 * @returns {boolean}
 */
function isGitIgnored(cwd, targetPath) {
  try {
    execFileSync('git', ['check-ignore', '-q', '--no-index', '--', targetPath], {
      cwd,
      stdio: 'pipe',
    });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  output,
  error,
  safeReadFile,
  findProjectRoot,
  loadConfig,
  deepMerge,
  execGit,
  isGitIgnored,
};
