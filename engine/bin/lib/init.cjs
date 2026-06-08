// @ts-check
'use strict';

/**
 * init — the `init <workflow>` orientation contract (engine layer C, plan 01-05).
 *
 * SOVEREIGN's Core Value: ONE CLI call returns everything a skill needs to
 * orient — models, config, phase, context-injection paths, target paths, and
 * existence probes — as a single nested JSON blob, so a skill reads zero files
 * to find its bearings (it reads CONTENT only when it genuinely needs it, via
 * the paths handed back here).
 *
 * Where GSD's init blobs are flat (grown organically), SOVEREIGN groups into
 * `models`/`config`/`phase`/`context_injection`/`paths`/`exists` namespaces for
 * greenfield readability — while keeping `--pick models.advisor` dot-notation
 * (extractField already supports it). The blob is wrapped by withProjectContext,
 * mirroring GSD's withProjectRoot (project_root + agents_installed/missing_agents).
 *
 * Every workflow returns the SAME nested shape; only `models` differs (council
 * resolves advisor/chairman/peer_reviewer; sovereign-init + fast-lane stubs use
 * {} until their model needs are pinned in later phases). All probes are
 * greenfield-safe — an empty dir with no .sovereign/ orients without throwing.
 *
 * Exports:
 *   buildInit(cwd, workflow)              — pure: assemble the nested blob (testable)
 *   cmdInit(cwd, workflow, raw, pick)     — CLI: output(buildInit(...)) (inherits @file: spill)
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const { output, error, loadConfig, safeReadFile } = require('./core.cjs');
const { resolveModelInternal } = require('./model.cjs');
const { readField } = require('./state.cjs');

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Read the engine's shipped VERSION file (sovereign_version). Falls back to the
 * pinned 2.0.0 if the file is unreadable (defensive — VERSION is in the package).
 * @returns {string}
 */
function readVersion() {
  const v = safeReadFile(path.join(__dirname, '..', '..', 'VERSION'));
  return v ? v.trim() : '2.0.0';
}

/**
 * Derive the `phase` namespace from `.sovereign/STATE.md` via the readField
 * pattern. Greenfield-safe: when STATE.md is absent, returns the Setup defaults
 * (current:0, name:'Setup', gate_status:'not_started', active_tracks:[]) so a
 * fresh project still orients.
 *
 * @param {string} cwd - project root
 * @returns {{current: number, name: string, gate_status: string, active_tracks: string[]}}
 */
function readState(cwd) {
  const content = safeReadFile(path.join(cwd, '.sovereign', 'STATE.md'));
  if (content === null) {
    return { current: 0, name: 'Setup', gate_status: 'not_started', active_tracks: [] };
  }
  const phaseRaw = readField(content, 'Phase');
  const statusRaw = readField(content, 'Status');
  const current = phaseRaw !== null && phaseRaw !== '' ? Number.parseInt(phaseRaw, 10) : 0;
  return {
    current: Number.isNaN(current) ? 0 : current,
    name: readField(content, 'Phase Name') || 'Setup',
    gate_status: statusRaw || 'not_started',
    active_tracks: [],
  };
}

/**
 * Compute the `exists` namespace via fs.existsSync. Greenfield-safe — every
 * probe is a boolean, never throws.
 *
 * @param {string} cwd - project root
 * @returns {{sovereign_dir: boolean, manifest: boolean, constitution: boolean, glossary: boolean}}
 */
function existsBlock(cwd) {
  const sov = path.join(cwd, '.sovereign');
  return {
    sovereign_dir: fs.existsSync(sov),
    manifest: fs.existsSync(path.join(sov, 'MANIFEST.md')),
    constitution: fs.existsSync(path.join(sov, 'SOVEREIGN.md')),
    glossary: fs.existsSync(path.join(sov, 'CONTEXT.md')),
  };
}

/**
 * List relative paths of ADR docs under `.sovereign/docs/adr/`, or [] if the
 * directory is absent (greenfield) or empty. Returns posix-style relative paths
 * for stable cross-platform output.
 *
 * @param {string} cwd - project root
 * @returns {string[]}
 */
function relevantAdrs(cwd) {
  const adrDir = path.join(cwd, '.sovereign', 'docs', 'adr');
  let entries;
  try {
    entries = fs.readdirSync(adrDir);
  } catch {
    return [];
  }
  return entries
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => `.sovereign/docs/adr/${f}`);
}

/**
 * Build a YYYYMMDD stamp from now (UTC) for the council transcript filename.
 * @returns {string}
 */
function dateStamp() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}${mm}${dd}`;
}

/**
 * The standard context-injection block — the paths a skill reads CONTENT from
 * when it needs to inject project context into reasoning agents. `relevant_adrs`
 * is a real listing of `.sovereign/docs/adr/*.md` (or [] when absent).
 *
 * @param {string} cwd - project root
 * @returns {{manifest_path: string, constitution_path: string, glossary_path: string, relevant_adrs: string[]}}
 */
function contextInjection(cwd) {
  return {
    manifest_path: '.sovereign/MANIFEST.md',
    constitution_path: '.sovereign/SOVEREIGN.md',
    glossary_path: '.sovereign/CONTEXT.md',
    relevant_adrs: relevantAdrs(cwd),
  };
}

/**
 * The subagent names each workflow dispatches and therefore requires installed.
 * Council fans out to the three reasoning agents; the fast-lane `sentinel` skill
 * dispatches the post-phase reviewer; sovereign-init and the other fast-lane
 * stubs dispatch none. A workflow not listed here requires no agents.
 *
 * Keyed exactly to the agent definition filenames shipped in engine/agents/
 * (plan 02-02) so checkAgents can probe `<name>.md` directly.
 *
 * @type {Record<string, string[]>}
 */
const REQUIRED_AGENTS = {
  council: ['sovereign-advisor', 'sovereign-chairman', 'sovereign-peer-reviewer'],
  sentinel: ['sovereign-sentinel'],
  'sovereign-init': [],
};

/**
 * The subagent names a workflow requires installed (empty list when none).
 * @param {string} workflow
 * @returns {string[]}
 */
function requiredAgentsFor(workflow) {
  return REQUIRED_AGENTS[workflow] || [];
}

/**
 * Real agent-presence guard (replaces the Phase-1 hardcoded stub). For the
 * workflow's required subagents, probe for `<name>.md` in the two locations
 * Claude Code actually loads subagents from — the project `.claude/agents/` and
 * the user `~/.claude/agents/` (subagents are NOT loaded from --add-dir, per
 * STACK.md). Found in EITHER location counts as present.
 *
 * A name with no file in either location is missing. agents_installed is true
 * only when nothing is missing — there is NO silent fallback to a
 * general-purpose agent (ARCHITECTURE anti-pattern #4): an orchestrator must be
 * able to hard-error before dispatching into a void.
 *
 * An empty required list short-circuits to {true, []}.
 *
 * @param {string} cwd - project root
 * @param {string} workflow - workflow/skill name being oriented
 * @returns {{agents_installed: boolean, missing_agents: string[]}}
 */
function checkAgents(cwd, workflow) {
  const required = requiredAgentsFor(workflow);
  const projectAgents = path.join(cwd, '.claude', 'agents');
  const userAgents = path.join(os.homedir(), '.claude', 'agents');
  const missing_agents = required.filter((name) => {
    const file = name + '.md';
    return !fs.existsSync(path.join(projectAgents, file)) &&
      !fs.existsSync(path.join(userAgents, file));
  });
  return { agents_installed: missing_agents.length === 0, missing_agents };
}

/**
 * Inject the project-wide context every blob carries: project_root, the engine
 * version, and the real agent-presence guard. Mirrors GSD's withProjectRoot.
 *
 * The guard is computed from the filesystem per the requested workflow's
 * required subagents (checkAgents) — orchestrators branch on missing subagents
 * with no silent general-purpose fallback.
 *
 * @param {string} cwd - project root
 * @param {string} workflow - workflow/skill name (determines required agents)
 * @param {Record<string, *>} blob
 * @returns {Record<string, *>}
 */
function withProjectContext(cwd, workflow, blob) {
  return Object.assign(
    {
      project_root: cwd,
      sovereign_version: readVersion(),
    },
    blob,
    checkAgents(cwd, workflow)
  );
}

// ─── buildInit ──────────────────────────────────────────────────────────────

/**
 * Assemble the nested orientation blob for a workflow. Pure (no I/O side
 * effects beyond reads) and greenfield-safe.
 *
 *   - 'council'        : full models (advisor/chairman/peer_reviewer), config
 *                        orientation flags, context_injection, council paths.
 *   - 'sovereign-init' : empty models (bootstrap detection — the SKILL is
 *                        Phase 2), full config, seed-target paths.
 *   - default          : any other arg treated as a fast-lane skill name
 *                        (grill-with-docs/ubiquitous-language/tdd/sentinel/
 *                        handoff) — empty models, config subset, manifest+
 *                        glossary context.
 *
 * @param {string} cwd - project root
 * @param {string} workflow - workflow/skill name to orient for
 * @returns {Record<string, *>}
 */
function buildInit(cwd, workflow) {
  const config = loadConfig(cwd);
  const phase = readState(cwd);
  const exists = existsBlock(cwd);

  /** The four orientation flags every workflow exposes from the merged config. */
  const orientationConfig = {
    model_profile: config.model_profile,
    commit_docs: config.commit_docs,
    council_mode_default: config.council_mode_default,
    parallelization: config.parallelization,
  };

  let blob;
  switch (workflow) {
    case 'council': {
      blob = {
        models: {
          advisor: resolveModelInternal(cwd, 'advisor'),
          chairman: resolveModelInternal(cwd, 'chairman'),
          peer_reviewer: resolveModelInternal(cwd, 'peer_reviewer'),
        },
        config: orientationConfig,
        phase,
        context_injection: contextInjection(cwd),
        paths: {
          council_dir: '.sovereign/council',
          transcript: `.sovereign/council/council-${dateStamp()}-001.md`,
          state: '.sovereign/STATE.md',
          manifest: '.sovereign/MANIFEST.md',
        },
        exists,
      };
      break;
    }

    case 'sovereign-init': {
      // Bootstrap-detection stub — the sovereign-init SKILL is Phase 2.
      // Returns the full merged config (the installer wants every toggle) and
      // the seed-target paths it will create.
      blob = {
        models: {},
        config,
        phase,
        context_injection: contextInjection(cwd),
        paths: {
          sovereign_dir: '.sovereign',
          state: '.sovereign/STATE.md',
          manifest: '.sovereign/MANIFEST.md',
          constitution: '.sovereign/SOVEREIGN.md',
          glossary: '.sovereign/CONTEXT.md',
          config: '.sovereign/config.json',
        },
        exists,
      };
      break;
    }

    default: {
      // Fast-lane skill stub (grill-with-docs/ubiquitous-language/tdd/sentinel/
      // handoff). Same nested shape; models empty until the skill's needs are
      // pinned in Phase 4. Config subset + manifest/glossary context.
      blob = {
        models: {},
        config: orientationConfig,
        phase,
        context_injection: {
          manifest_path: '.sovereign/MANIFEST.md',
          glossary_path: '.sovereign/CONTEXT.md',
        },
        paths: {
          state: '.sovereign/STATE.md',
          manifest: '.sovereign/MANIFEST.md',
        },
        exists,
      };
      break;
    }
  }

  return withProjectContext(cwd, workflow, blob);
}

/**
 * CLI wrapper for buildInit. Emits the nested blob through output() (inheriting
 * the >50KB @file: spill — do NOT reimplement it here). `--pick` is handled
 * upstream in the router's stdout interceptor over the same JSON, so cmdInit
 * always writes the full blob and the router extracts the requested field.
 *
 * @param {string} cwd - project root
 * @param {string} workflow - workflow/skill name
 * @param {boolean} [raw] - emit raw scalar (only meaningful with --pick upstream)
 * @returns {void}
 */
function cmdInit(cwd, workflow, raw) {
  if (!workflow) {
    error('init: workflow name required (usage: init <workflow>)');
  }
  output(buildInit(cwd, workflow), raw);
}

module.exports = {
  buildInit,
  cmdInit,
  withProjectContext,
  checkAgents,
  requiredAgentsFor,
  readState,
  existsBlock,
  relevantAdrs,
};
