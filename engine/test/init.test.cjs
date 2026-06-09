'use strict';

/**
 * Unit + integration suite for engine layer C — the `init <workflow>` contract
 * (plan 01-05). SOVEREIGN's Core Value: one CLI call returns the nested
 * orientation blob (models/config/phase/context_injection/paths/exists +
 * project_root/sovereign_version/agents_installed/missing_agents) so a skill
 * orients with zero file reads.
 *
 * Covers:
 *   - cmdInit pure shape for `council` against a seeded fixture (.sovereign/ from
 *     templates, model_profile:'quality').
 *   - models.advisor === resolveModelInternal (opus under quality).
 *   - context_injection.manifest_path + relevant_adrs array.
 *   - greenfield safety: empty tmpdir → exists.sovereign_dir false, no throw.
 *   - sovereign-init + fast-lane stub shapes.
 *   - --pick models.advisor over the nested blob (CLI integration via spawnSync).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const BIN = path.join(ENGINE_ROOT, 'bin', 'sovereign-tools.cjs');
const TEMPLATE_SOVEREIGN = path.join(ENGINE_ROOT, 'templates', 'sovereign');

const { buildInit, checkAgents, requiredAgentsFor } = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'init.cjs'));
const EXPECTED_VERSION = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "VERSION"), "utf8").trim();

/** Recursively copy a directory tree (Node >=20 has fs.cpSync). */
function copyTree(src, dest) {
  fs.cpSync(src, dest, { recursive: true });
}

/** Seed a tmp project with .sovereign/ copied from templates + a config patch. */
function mkSeededProject(configOverride) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sov-init-'));
  const sov = path.join(dir, '.sovereign');
  copyTree(TEMPLATE_SOVEREIGN, sov);
  const config = Object.assign(
    JSON.parse(fs.readFileSync(path.join(sov, 'config.json'), 'utf-8')),
    configOverride || {}
  );
  fs.writeFileSync(path.join(sov, 'config.json'), JSON.stringify(config, null, 2));
  return dir;
}

/** A fresh empty tmp dir with no .sovereign/ (greenfield). */
function mkEmptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-init-empty-'));
}

/** Seed minimal `<name>.md` files into a project's .claude/agents/ dir. */
function seedAgents(dir, names) {
  const agentsDir = path.join(dir, '.claude', 'agents');
  fs.mkdirSync(agentsDir, { recursive: true });
  for (const name of names) {
    fs.writeFileSync(
      path.join(agentsDir, name + '.md'),
      `---\nname: ${name}\ndescription: test fixture\n---\nbody\n`
    );
  }
}

/** The three subagents the `council` workflow requires (per requiredAgentsFor). */
const COUNCIL_AGENTS = ['sovereign-advisor', 'sovereign-chairman', 'sovereign-peer-reviewer'];

test('init council returns the nested one-blob contract', () => {
  const dir = mkSeededProject({ model_profile: 'quality' });
  seedAgents(dir, COUNCIL_AGENTS);
  const blob = buildInit(dir, 'council');

  assert.equal(blob.project_root, dir);
  assert.equal(blob.sovereign_version, EXPECTED_VERSION);
  assert.ok(blob.models && typeof blob.models === 'object');
  assert.ok(blob.config && typeof blob.config === 'object');
  assert.ok(blob.phase && typeof blob.phase === 'object');
  assert.ok(blob.context_injection && typeof blob.context_injection === 'object');
  assert.ok(blob.paths && typeof blob.paths === 'object');
  assert.ok(blob.exists && typeof blob.exists === 'object');
  assert.equal(blob.agents_installed, true);
  assert.deepEqual(blob.missing_agents, []);
});

test('init council resolves advisor/chairman/peer_reviewer to opus under quality', () => {
  const dir = mkSeededProject({ model_profile: 'quality' });
  const blob = buildInit(dir, 'council');
  assert.equal(blob.models.advisor, 'opus');
  assert.equal(blob.models.chairman, 'opus');
  assert.equal(blob.models.peer_reviewer, 'opus');
});

test('init council under balanced resolves advisor to sonnet', () => {
  const dir = mkSeededProject({ model_profile: 'balanced' });
  const blob = buildInit(dir, 'council');
  assert.equal(blob.models.advisor, 'sonnet');
});

test('init council supplies context_injection paths + relevant_adrs array', () => {
  const dir = mkSeededProject({});
  const blob = buildInit(dir, 'council');
  assert.equal(blob.context_injection.manifest_path, '.sovereign/MANIFEST.md');
  assert.equal(blob.context_injection.constitution_path, '.sovereign/SOVEREIGN.md');
  assert.equal(blob.context_injection.glossary_path, '.sovereign/CONTEXT.md');
  assert.ok(Array.isArray(blob.context_injection.relevant_adrs));
});

test('init council config exposes the four orientation flags', () => {
  const dir = mkSeededProject({ model_profile: 'quality' });
  const blob = buildInit(dir, 'council');
  assert.equal(blob.config.model_profile, 'quality');
  assert.equal(typeof blob.config.commit_docs, 'boolean');
  assert.equal(typeof blob.config.council_mode_default, 'string');
  assert.equal(typeof blob.config.parallelization, 'boolean');
});

test('init council exists.sovereign_dir reflects a seeded fixture', () => {
  const dir = mkSeededProject({});
  const blob = buildInit(dir, 'council');
  assert.equal(blob.exists.sovereign_dir, true);
  assert.equal(blob.exists.manifest, true);
  assert.equal(blob.exists.constitution, true);
  assert.equal(blob.exists.glossary, true);
});

test('init council is greenfield-safe in an empty dir (no .sovereign/)', () => {
  const dir = mkEmptyProject();
  let blob;
  assert.doesNotThrow(() => {
    blob = buildInit(dir, 'council');
  });
  assert.equal(blob.exists.sovereign_dir, false);
  assert.equal(blob.sovereign_version, EXPECTED_VERSION);
  // Phase defaults to a greenfield Setup state.
  assert.equal(blob.phase.current, 0);
  assert.deepEqual(blob.context_injection.relevant_adrs, []);
});

test('init sovereign-init returns the nested shape with empty models', () => {
  const dir = mkSeededProject({});
  const blob = buildInit(dir, 'sovereign-init');
  assert.equal(blob.sovereign_version, EXPECTED_VERSION);
  assert.deepEqual(blob.models, {});
  assert.ok(blob.config && typeof blob.config === 'object');
  assert.ok(blob.phase && typeof blob.phase === 'object');
  assert.ok(blob.exists && typeof blob.exists === 'object');
});

test('init <fast-lane> stub returns the nested shape', () => {
  const dir = mkSeededProject({});
  const blob = buildInit(dir, 'grill-with-docs');
  assert.equal(blob.sovereign_version, EXPECTED_VERSION);
  assert.ok(blob.config && typeof blob.config === 'object');
  assert.ok(blob.phase && typeof blob.phase === 'object');
  assert.ok(blob.context_injection && typeof blob.context_injection === 'object');
  assert.ok(blob.exists && typeof blob.exists === 'object');
});

test('phase block derives current/name/gate_status from STATE.md when present', () => {
  const dir = mkSeededProject({});
  // Patch STATE.md so phase fields are non-default.
  const sp = path.join(dir, '.sovereign', 'STATE.md');
  let content = fs.readFileSync(sp, 'utf-8');
  content = content
    .replace(/(\*\*Phase:\*\*\s*).*/i, '$13')
    .replace(/(\*\*Status:\*\*\s*).*/i, '$1In progress');
  fs.writeFileSync(sp, content);
  const blob = buildInit(dir, 'council');
  assert.equal(blob.phase.current, 3);
  assert.equal(blob.phase.gate_status, 'In progress');
});

// ─── M3 workflows: bridge / adopt / extension (plan 10-05) ───────────────────

test('init bridge returns the registry + source-doc paths with project context', () => {
  const dir = mkSeededProject({});
  const blob = buildInit(dir, 'bridge');
  assert.equal(blob.paths.registry, '.sovereign/bridges/registry.json');
  assert.ok(blob.paths.api_spec, 'paths.api_spec present');
  assert.ok(blob.paths.bridge_dir, 'paths.bridge_dir present');
  assert.equal(blob.project_root, dir);
  assert.equal(blob.sovereign_version, EXPECTED_VERSION);
});

test('init adopt returns detected.in_git boolean + sovereign_dir path', () => {
  const dir = mkSeededProject({});
  const blob = buildInit(dir, 'adopt');
  assert.equal(typeof blob.detected.in_git, 'boolean');
  assert.ok(blob.paths.sovereign_dir, 'paths.sovereign_dir present');
});

test('init extension returns the .sovereign/extensions dir', () => {
  const dir = mkSeededProject({});
  const blob = buildInit(dir, 'extension');
  assert.equal(blob.paths.extensions_dir, '.sovereign/extensions');
});

test('init bridge/adopt/extension are greenfield-safe (empty dir, models {})', () => {
  const dir = mkEmptyProject();
  for (const wf of ['bridge', 'adopt', 'extension']) {
    let blob;
    assert.doesNotThrow(() => {
      blob = buildInit(dir, wf);
    }, `${wf} should not throw on a bare dir`);
    assert.deepEqual(blob.models, {}, `${wf} models should be {}`);
    assert.equal(blob.exists.sovereign_dir, false);
  }
});

// ─── agents_installed / missing_agents (real filesystem check, plan 02-03) ───

test('Test A: council with all required agents present → installed true, missing []', () => {
  const dir = mkSeededProject({});
  seedAgents(dir, COUNCIL_AGENTS);
  const blob = buildInit(dir, 'council');
  assert.equal(blob.agents_installed, true);
  assert.deepEqual(blob.missing_agents, []);
});

test('Test B: council missing peer-reviewer → installed false, missing lists it', () => {
  const dir = mkSeededProject({});
  seedAgents(dir, ['sovereign-advisor', 'sovereign-chairman']);
  const blob = buildInit(dir, 'council');
  assert.equal(blob.agents_installed, false);
  assert.deepEqual(blob.missing_agents, ['sovereign-peer-reviewer']);
});

test('Test C: sovereign-init (no required agents) → installed true even with empty .claude', () => {
  const dir = mkSeededProject({});
  const blob = buildInit(dir, 'sovereign-init');
  assert.equal(blob.agents_installed, true);
  assert.deepEqual(blob.missing_agents, []);
});

test('requiredAgentsFor maps workflows to required agent names', () => {
  assert.deepEqual(requiredAgentsFor('council'), COUNCIL_AGENTS);
  assert.deepEqual(requiredAgentsFor('sentinel'), ['sovereign-sentinel']);
  assert.deepEqual(requiredAgentsFor('sovereign-init'), []);
  assert.deepEqual(requiredAgentsFor('grill-with-docs'), []);
});

test('checkAgents probes .claude/agents/ and reports missing names', () => {
  const dir = mkSeededProject({});
  seedAgents(dir, ['sovereign-advisor']);
  const result = checkAgents(dir, 'council');
  assert.equal(result.agents_installed, false);
  assert.deepEqual(result.missing_agents, ['sovereign-chairman', 'sovereign-peer-reviewer']);
});

// ─── CLI integration (spawnSync) ────────────────────────────────────────────

test('CLI: init council --pick models.advisor prints the bare model string', () => {
  const dir = mkSeededProject({ model_profile: 'quality' });
  const out = execFileSync(
    process.execPath,
    [BIN, 'init', 'council', '--cwd', dir, '--pick', 'models.advisor'],
    { encoding: 'utf-8' }
  );
  assert.equal(out.trim(), 'opus');
});

test('CLI: init council --cwd <dir> prints parseable JSON with version + manifest_path', () => {
  const dir = mkSeededProject({ model_profile: 'quality' });
  const out = execFileSync(process.execPath, [BIN, 'init', 'council', '--cwd', dir], {
    encoding: 'utf-8',
  });
  let jsonStr = out;
  if (jsonStr.startsWith('@file:')) {
    jsonStr = fs.readFileSync(jsonStr.slice('@file:'.length), 'utf-8');
  }
  const obj = JSON.parse(jsonStr);
  assert.equal(obj.sovereign_version, EXPECTED_VERSION);
  assert.equal(obj.context_injection.manifest_path, '.sovereign/MANIFEST.md');
});

test('CLI: init council in an empty tmp dir exits 0 (greenfield-safe)', () => {
  const dir = mkEmptyProject();
  // Should not throw (exit 0). execFileSync throws on non-zero exit.
  const out = execFileSync(process.execPath, [BIN, 'init', 'council', '--cwd', dir], {
    encoding: 'utf-8',
  });
  let jsonStr = out;
  if (jsonStr.startsWith('@file:')) {
    jsonStr = fs.readFileSync(jsonStr.slice('@file:'.length), 'utf-8');
  }
  const obj = JSON.parse(jsonStr);
  assert.equal(obj.exists.sovereign_dir, false);
});
