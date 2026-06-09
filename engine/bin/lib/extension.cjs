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
 *   - The audit uses `skills use <source>` (BARE — no `-a`, no `--copy`), which
 *     prints the prompt-wrapped raw SKILL.md to STDOUT; that stdout IS the
 *     auditable content `scanSkillContent` scans, fetched BEFORE `add` (adopt).
 *     use = fetch-for-inspection (to stdout), add = adopt. Never install-then-audit.
 *     (Live `npx skills` smoke-test, 2026-06-09: `use` rejects `--copy` and
 *     treats `-a <agent>` as "start that agent INTERACTIVELY" — so preview must
 *     pass neither.)
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
      // BARE `skills use <source>` prints the prompt-wrapped raw SKILL.md to
      // stdout (the auditable content). No `--copy` (it errors "Unknown option")
      // and no `-a <agent>` (that starts the agent INTERACTIVELY).
      return ['skills', 'use', source];
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
 * `extension preview <source>` — wrap the bare `skills use <source>`, which
 * prints the prompt-wrapped raw SKILL.md to stdout (the fetch-for-audit step).
 * Drives on exit code; the stdout carries the inspectable content.
 * @param {string} _cwd unused (skills owns its fetch); kept for router symmetry.
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
 * `extension audit <source>` — fetch the skill content by re-running the bare
 * `skills use <source>` (the prompt-wrapped raw SKILL.md printed to stdout) and
 * run `scanSkillContent` over that stdout. Emits { ok, source, findings, verdict },
 * where `ok = verdict !== 'block'`. Greenfield/network-safe: a missing source or
 * empty stdout (not-found / network down) yields a clean no-content result — the
 * skill decides whether a non-clean fetch means "couldn't fetch". No file path is
 * ever read; the audit input is always the `skills use` STDOUT.
 * @param {string} _cwd unused; kept for router symmetry.
 * @param {string} source the `owner/repo@skill` (or skills.sh URL) to fetch+scan.
 * @param {boolean} [raw]
 * @param {(args: string[]) => *} [runner] injectable runner (network-free tests).
 * @returns {void}
 */
function cmdExtensionAudit(_cwd, source, raw, runner) {
  if (!source || typeof source !== 'string') {
    output({ ok: true, source: source ?? null, findings: [], verdict: 'clean', reason: 'no_content' }, raw);
    return;
  }
  const run = runSkills(buildSkillsArgs('preview', source), runner);
  if (!run.stdout) {
    output({ ok: true, source, findings: [], verdict: 'clean', reason: 'no_content' }, raw);
    return;
  }
  const { findings, verdict } = scanSkillContent(run.stdout);
  output({ ok: verdict !== 'block', source, findings, verdict }, raw);
}

module.exports = {
  cmdExtensionPreview,
  cmdExtensionInstall,
  cmdExtensionList,
  cmdExtensionAudit,
  buildSkillsArgs,
  runSkills,
};
