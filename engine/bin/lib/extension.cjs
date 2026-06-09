// @ts-check
'use strict';

/**
 * extension — the EXT substrate: an exit-code-driven wrapper around `npx skills`
 * plus a content audit. Zero runtime dependency (node: built-ins + the two local
 * libs only); `npx skills` is invoked as a subprocess, never depended on.
 *
 * Design constraints (M3-NOTES §1 + Phase-10 CONTEXT):
 *   - `skills@1.5.x` has NO machine-readable output (no `--json`, stdout text is
 *     undocumented). So success/failure is driven ONLY by the process EXIT CODE;
 *     stdout/stderr are captured for the decision log but NEVER parsed for
 *     success. Drive on exit code, not stdout text.
 *   - Shell out with ARRAY args via `spawnSync` (mirroring core.cjs `execGit`) so
 *     a hostile `owner/repo` source can never inject into a shell string. No
 *     `shell: true`, ever — `source` is always a single discrete array element.
 *   - The audit uses `skills use` (preview) to MATERIALIZE the skill body into a
 *     temp dir for `scanSkillContent` BEFORE `add` (adopt). use = fetch-for-
 *     inspection, add = adopt. Never install-then-audit.
 *   - R-003: wrap the registry, never reinvent it.
 *
 * Each command emits the contract { ok, exitCode, stdout, stderr, source } via
 * core.cjs `output()` (which inherits the @file: >50KB spill). The audit command
 * additionally returns { findings, verdict } from security.cjs `scanSkillContent`.
 *
 * The wrapper is split into a PURE arg builder (`buildSkillsArgs`) and an
 * INJECTABLE runner (`runSkills`) so the unit tests can assert arg construction
 * and exit-code branching WITHOUT touching the network.
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { output } = require('./core.cjs');
const { scanSkillContent } = require('./security.cjs');

/**
 * Build the EXACT argv array passed to `spawnSync('npx', ...)` for a skills
 * action. `source` is always placed as a single discrete array element (never
 * interpolated into a string), so repo/skill names cannot inject. Returns the
 * argv beginning with `'skills'` (the `npx` binary is supplied by runSkills).
 *
 * @param {'preview'|'install'|'list'} action
 * @param {string} [source] required for preview/install; ignored for list.
 * @param {{ agent?: string, copy?: boolean, yes?: boolean }} [opts]
 * @returns {string[]}
 */
function buildSkillsArgs(action, source, opts = {}) {
  const agent = opts.agent || 'claude-code';
  switch (action) {
    case 'preview': {
      if (!source || typeof source !== 'string') {
        throw new Error('extension preview requires a non-empty source');
      }
      // `skills use` materializes the skill into a temp dir for inspection.
      return ['skills', 'use', source, '-a', agent, '--copy'];
    }
    case 'install': {
      if (!source || typeof source !== 'string') {
        throw new Error('extension install requires a non-empty source');
      }
      // `skills add` adopts the skill; -y to run non-interactively.
      return ['skills', 'add', source, '-a', agent, '--copy', '-y'];
    }
    case 'list':
      return ['skills', 'list'];
    default:
      throw new Error('unknown skills action: ' + String(action));
  }
}

/**
 * Run a `skills` argv via `npx`, branching on EXIT CODE (mirrors execGit). The
 * `runner` is injectable so tests can exercise arg construction + exit-code
 * branching without the network; it defaults to a real `spawnSync('npx', ...)`.
 *
 * @param {string[]} args argv beginning with `'skills'` (from buildSkillsArgs).
 * @param {(args: string[]) => { status?: number|null, stdout?: *, stderr?: * }} [runner]
 * @returns {{ exitCode: number, stdout: string, stderr: string }}
 */
function runSkills(args, runner) {
  const run = runner || ((a) => spawnSync('npx', a, { stdio: 'pipe', encoding: 'utf-8' }));
  const result = run(args) || {};
  return {
    exitCode: result.status ?? 1,
    stdout: (result.stdout ?? '').toString().trim(),
    stderr: (result.stderr ?? '').toString().trim(),
  };
}

/**
 * Emit the standard per-command contract { ok, exitCode, stdout, stderr, source }.
 * `ok` is driven solely by the exit code being 0.
 * @param {{ exitCode: number, stdout: string, stderr: string }} run
 * @param {string|null} source
 * @param {boolean} [raw]
 * @returns {void}
 */
function emitRun(run, source, raw) {
  output({
    ok: run.exitCode === 0,
    exitCode: run.exitCode,
    stdout: run.stdout,
    stderr: run.stderr,
    source: source ?? null,
  }, raw);
}

/**
 * `extension preview <source>` — wrap `skills use` to materialize the skill into
 * a temp dir for inspection (the fetch-for-audit step). Drives on exit code.
 * @param {string} _cwd unused (skills owns its temp dir); kept for router symmetry.
 * @param {string} source
 * @param {boolean} [raw]
 * @param {(args: string[]) => *} [runner]
 * @returns {void}
 */
function cmdExtensionPreview(_cwd, source, raw, runner) {
  const run = runSkills(buildSkillsArgs('preview', source), runner);
  emitRun(run, source, raw);
}

/**
 * `extension install <source>` — wrap `skills add --copy -a claude-code -y` to
 * adopt the skill. Drives on exit code; never parses stdout for success.
 * @param {string} _cwd
 * @param {string} source
 * @param {boolean} [raw]
 * @param {(args: string[]) => *} [runner]
 * @returns {void}
 */
function cmdExtensionInstall(_cwd, source, raw, runner) {
  const run = runSkills(buildSkillsArgs('install', source), runner);
  emitRun(run, source, raw);
}

/**
 * `extension list` — wrap `skills list` (the installed-skill inventory for the
 * conflict check). Drives on exit code.
 * @param {string} _cwd
 * @param {boolean} [raw]
 * @param {(args: string[]) => *} [runner]
 * @returns {void}
 */
function cmdExtensionList(_cwd, raw, runner) {
  const run = runSkills(buildSkillsArgs('list'), runner);
  emitRun(run, null, raw);
}

/**
 * Read materialized skill content at `contentPath` for the audit. If it is a
 * directory, concatenate the bodies of every `*.md` file under it (one level,
 * SKILL.md first); if a file, read it. Missing path yields null. No throw.
 * @param {string} contentPath
 * @returns {string|null}
 */
function readMaterializedContent(contentPath) {
  let stat;
  try {
    stat = fs.statSync(contentPath);
  } catch {
    return null;
  }
  if (stat.isFile()) {
    try {
      return fs.readFileSync(contentPath, 'utf-8');
    } catch {
      return null;
    }
  }
  if (stat.isDirectory()) {
    let names;
    try {
      names = fs.readdirSync(contentPath);
    } catch {
      return null;
    }
    // SKILL.md first, then the rest of the markdown, for stable scanning order.
    const mdFiles = names
      .filter((n) => n.toLowerCase().endsWith('.md'))
      .sort((a, b) => {
        const as = a.toLowerCase() === 'skill.md' ? 0 : 1;
        const bs = b.toLowerCase() === 'skill.md' ? 0 : 1;
        return as - bs || a.localeCompare(b);
      });
    const bodies = [];
    for (const name of mdFiles) {
      try {
        bodies.push(fs.readFileSync(path.join(contentPath, name), 'utf-8'));
      } catch {
        // skip unreadable file
      }
    }
    return bodies.length ? bodies.join('\n') : null;
  }
  return null;
}

/**
 * `extension audit <path>` — read the materialized skill content (a SKILL.md
 * file or a dir of markdown) and run `scanSkillContent` over it. Emits
 * { ok, source, findings, verdict }, where `ok = verdict !== 'block'`.
 * Greenfield-safe: a missing path yields a clean no-content result.
 * @param {string} _cwd
 * @param {string} contentPath
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdExtensionAudit(_cwd, contentPath, raw) {
  if (!contentPath || typeof contentPath !== 'string') {
    output({ ok: true, source: contentPath ?? null, findings: [], verdict: 'clean', reason: 'no_content' }, raw);
    return;
  }
  const text = readMaterializedContent(contentPath);
  if (text === null) {
    output({ ok: true, source: contentPath, findings: [], verdict: 'clean', reason: 'no_content' }, raw);
    return;
  }
  const { findings, verdict } = scanSkillContent(text);
  output({ ok: verdict !== 'block', source: contentPath, findings, verdict }, raw);
}

module.exports = {
  cmdExtensionPreview,
  cmdExtensionInstall,
  cmdExtensionList,
  cmdExtensionAudit,
  buildSkillsArgs,
  runSkills,
};
