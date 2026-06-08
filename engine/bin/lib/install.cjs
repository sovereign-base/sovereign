// @ts-check
'use strict';

/**
 * install — the `npx sovereign init` installer (plan 02-01, INIT-01/02/03).
 *
 * The user front door. Phase 1 built the engine; this is what gets it into a
 * user's project in one command. It:
 *   - copies SOVEREIGN's packaged skill dirs + agent files into the project's
 *     `.claude/` (default) or `~/.claude/` (`--global`) — COPY, not symlink, so
 *     the system travels with the repo (ADR-003, mirrors the `npx skills`
 *     convention);
 *   - scaffolds `.sovereign/` from the shipped `templates/sovereign/` tree ONLY
 *     when absent (non-destructive — never clobbers user-modified state);
 *   - is idempotent + version-aware via the `VERSION` file and a
 *     `.sovereign/.sovereign-version` stamp: equal versions → no overwrite
 *     (`up_to_date`); a newer packaged VERSION → re-copy + rewrite stamp
 *     (`updated`); first run → `installed`.
 *
 * `--quick` filters skills to the Fast Lane 5; `--full` (and bare `init`) copies
 * every packaged skill dir. Skill dirs are populated in Phases 3-4 — the logic
 * copies whatever is present, so `--quick`/`--full` are correct from day one and
 * grow as skills land. Agent files ship in plan 02-02; until then the agents/
 * dir is absent and agents_copied is [] (no throw).
 *
 * Zero-dependency: node:fs / node:path / node:os only (ADR-002). Reuses
 * safeReadFile/output/error from core.cjs.
 *
 * Exports:
 *   runInstall(opts)                 — pure install core (testable over tmpdirs)
 *   cmdInstall(cwd, flags, raw)      — CLI: resolve mode/target → runInstall → output()
 *   FAST_LANE                        — the five Fast Lane skill names (--quick filter)
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { safeReadFile, output, error } = require('./core.cjs');

/** The Fast Lane 5 skill names — the `--quick` install set. */
const FAST_LANE = ['ubiquitous-language', 'grill-with-docs', 'handoff', 'sentinel', 'tdd'];

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Recursively copy a directory tree (Node >=20 has fs.cpSync; engines.node>=20
 * is pinned, so no fallback is needed).
 * @param {string} src
 * @param {string} dest
 * @returns {void}
 */
function copyDirRecursive(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

/** @param {string} p @returns {boolean} */
function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/**
 * List immediate subdirectory names of `dir`, or [] when `dir` is absent.
 * @param {string} dir
 * @returns {string[]}
 */
function listSubdirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name);
  } catch {
    return [];
  }
}

/**
 * List `*.md` file basenames (without extension) in `dir`, or [] when absent.
 * @param {string} dir
 * @returns {string[]}
 */
function listAgentNames(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.md'))
      .map((e) => e.name.slice(0, -'.md'.length));
  } catch {
    return [];
  }
}

// ─── Install core ───────────────────────────────────────────────────────────

/**
 * @typedef {Object} InstallResult
 * @property {boolean} ok
 * @property {'project'|'global'} target
 * @property {'quick'|'full'} mode
 * @property {string} installed_version
 * @property {string|null} previous_version
 * @property {'installed'|'updated'|'up_to_date'} status
 * @property {string[]} skills_copied
 * @property {string[]} agents_copied
 * @property {boolean} sovereign_scaffolded
 */

/**
 * Install SOVEREIGN into a project (or globally).
 *
 * @param {Object} opts
 * @param {string} opts.cwd - the project root (where .sovereign/ lives)
 * @param {'project'|'global'} opts.target - .claude/ in cwd, or ~/.claude/
 * @param {'quick'|'full'} opts.mode - Fast Lane subset vs all packaged skills
 * @param {string} opts.packageRoot - engine/ root (VERSION + templates/ + skills/ + agents/)
 * @returns {InstallResult}
 */
function runInstall(opts) {
  const { cwd, target, mode, packageRoot } = opts;

  const installRoot =
    target === 'global' ? path.join(os.homedir(), '.claude') : path.join(cwd, '.claude');

  const installedVersion = (safeReadFile(path.join(packageRoot, 'VERSION')) || '').trim();

  // Version stamp lives inside .sovereign/ so it travels with committed state.
  const stampPath = path.join(cwd, '.sovereign', '.sovereign-version');
  const previousVersion = (safeReadFile(stampPath) || '').trim() || null;

  // status: first run → installed; same version → up_to_date; differs → updated.
  /** @type {'installed'|'updated'|'up_to_date'} */
  let status;
  if (previousVersion === null) status = 'installed';
  else if (previousVersion === installedVersion) status = 'up_to_date';
  else status = 'updated';

  const doCopy = status !== 'up_to_date';

  // ── Skills ────────────────────────────────────────────────────────────────
  const pkgSkillsDir = path.join(packageRoot, 'skills');
  let candidateSkills = listSubdirs(pkgSkillsDir);
  if (mode === 'quick') {
    candidateSkills = candidateSkills.filter((name) => FAST_LANE.includes(name));
  }
  /** @type {string[]} */
  const skillsCopied = [];
  if (doCopy) {
    for (const name of candidateSkills) {
      const src = path.join(pkgSkillsDir, name);
      const dest = path.join(installRoot, 'skills', name);
      copyDirRecursive(src, dest);
      skillsCopied.push(name);
    }
  }

  // ── Agents ────────────────────────────────────────────────────────────────
  const pkgAgentsDir = path.join(packageRoot, 'agents');
  const candidateAgents = listAgentNames(pkgAgentsDir);
  /** @type {string[]} */
  const agentsCopied = [];
  if (doCopy && candidateAgents.length > 0) {
    const destAgents = path.join(installRoot, 'agents');
    fs.mkdirSync(destAgents, { recursive: true });
    for (const name of candidateAgents) {
      fs.copyFileSync(
        path.join(pkgAgentsDir, name + '.md'),
        path.join(destAgents, name + '.md')
      );
      agentsCopied.push(name);
    }
  }

  // ── Scaffold .sovereign/ (only when absent — non-destructive) ──────────────
  const sovereignDir = path.join(cwd, '.sovereign');
  let sovereignScaffolded = false;
  if (!isDir(sovereignDir)) {
    const seed = path.join(packageRoot, 'templates', 'sovereign');
    copyDirRecursive(seed, sovereignDir);
    sovereignScaffolded = true;
  }

  // ── Version stamp ──────────────────────────────────────────────────────────
  // Always (re)write so a freshly scaffolded .sovereign/ gets stamped, and an
  // 'updated' run advances the stamp to the packaged version.
  fs.mkdirSync(sovereignDir, { recursive: true });
  if (status !== 'up_to_date') {
    fs.writeFileSync(stampPath, installedVersion, 'utf-8');
  }

  return {
    ok: true,
    target,
    mode,
    installed_version: installedVersion,
    previous_version: previousVersion,
    status,
    skills_copied: skillsCopied,
    agents_copied: agentsCopied,
    sovereign_scaffolded: sovereignScaffolded,
  };
}

// ─── CLI entry ──────────────────────────────────────────────────────────────

/**
 * `init [--quick|--full|--global]` — resolve mode/target, run the install, and
 * emit the result through output() (inherits the @file: >50KB spill contract).
 *
 * Mode: `--full` → full; `--quick` → quick; default full (bare `init` installs
 * the full M1 set per INIT-02). Target: `--global` → ~/.claude, else project.
 *
 * @param {string} cwd
 * @param {{quick?: boolean, full?: boolean, global?: boolean}} flags
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdInstall(cwd, flags, raw) {
  /** @type {'quick'|'full'} */
  const mode = flags.full ? 'full' : flags.quick ? 'quick' : 'full';
  /** @type {'project'|'global'} */
  const target = flags.global ? 'global' : 'project';
  const packageRoot = path.join(__dirname, '..', '..');

  let result;
  try {
    result = runInstall({ cwd, target, mode, packageRoot });
  } catch (err) {
    error('install failed: ' + (err && err.message ? err.message : String(err)));
    return;
  }
  output(result, raw, result.status);
}

module.exports = { runInstall, cmdInstall, FAST_LANE };
