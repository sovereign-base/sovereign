// @ts-check
'use strict';

/**
 * mcp — the zero-dependency MCP-server attachment substrate for the `/mcp-attach`
 * skill. The skill stays a thin orchestrator (5 vetting gates + judgment + the
 * decision log); the engine owns deterministic storage + the security audit.
 *
 * Composes two existing substrates:
 *   - security.cjs `scanMcpServer` — audits the launch SPEC (transport/command/
 *     args/url/env), mirroring the `extension audit → {findings, verdict}` gate.
 *   - the `anchor` storage shape — engine owns the record format; the skill never
 *     hand-writes it. Servers are recorded in the COMMITTED project config under
 *     `mcp_servers[<slug>]` (the surface the user picked) so they travel with the
 *     repo and are surfaced through `init <workflow>` (init.cjs mcpAvailableFor);
 *     a per-attach decision record is written to `.sovereign/mcp/<date>-<slug>.md`
 *     (mirroring `.sovereign/extensions/`), so the choice is auditable later.
 *
 *   - `mcp audit  --spec @file|- | <inline flags>` → { ok, id, findings, verdict }.
 *       The pre-attach gate. ok = verdict !== 'block'. Empty spec → clean/no_content.
 *   - `mcp add    --id <slug> --transport <t> [--command c --args …] [--url u]
 *                 [--env K=V …] [--for a,b|*] [--description d] [--force]` →
 *       re-audits, REFUSES on `block` (and on `review` unless `--force`), then
 *       persists `mcp_servers[slug]` to project config.json + writes the decision
 *       record. Idempotent (re-add overwrites). Emits the stored record + verdict.
 *   - `mcp list`  → array of attached servers from the MERGED config (global +
 *       project), greenfield-safe → [].
 *   - `mcp remove --id <slug>` → deletes `mcp_servers[slug]` from PROJECT config.
 *
 * Zero runtime deps — node: built-ins only. Storage via core.patchConfig; reads
 * via core.loadConfig; audit via security.scanMcpServer; slug via anchor.slugify.
 */

const fs = require('node:fs');
const path = require('node:path');
const { output, error, loadConfig, patchConfig } = require('./core.cjs');
const { scanMcpServer } = require('./security.cjs');
const { slugify, todayISO } = require('./anchor.cjs');

const MCP_DIR_REL = path.join('.sovereign', 'mcp');

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Parse a repeated `--env K=V` (or comma/space `K=V` tokens) into an object.
 * A value that is missing (`--env FOO`) maps to '' so the key is still recorded.
 * @param {string[]|null} pairs
 * @returns {Record<string, string>}
 */
function parseEnvPairs(pairs) {
  /** @type {Record<string, string>} */
  const env = {};
  if (!Array.isArray(pairs)) return env;
  for (const raw of pairs) {
    const eq = String(raw).indexOf('=');
    if (eq === -1) {
      if (raw) env[String(raw)] = '';
      continue;
    }
    env[String(raw).slice(0, eq)] = String(raw).slice(eq + 1);
  }
  return env;
}

/**
 * Split a `--for a,b,c` value (or `*`) into a deduped skill-name list. Absent →
 * `['*']` (available to every consumer) so an attach with no explicit scope is
 * usable rather than orphaned.
 * @param {string|boolean|null|undefined} value
 * @returns {string[]}
 */
function parseFor(value) {
  if (typeof value !== 'string' || value.trim() === '') return ['*'];
  const parts = value.split(',').map((s) => s.trim()).filter(Boolean);
  return parts.length ? Array.from(new Set(parts)) : ['*'];
}

/**
 * Assemble the launch spec object the scanner + record share. Normalizes the
 * absent fields to their canonical empties so the stored record is stable.
 * @param {Record<string, *>} flags - parsed named args (id/transport/command/args/url/env/for/description)
 * @param {string[]} argsArr
 * @param {Record<string, string>} env
 * @param {string[]} forList
 * @returns {{ transport: string, command: string|null, args: string[], url: string|null, env: Record<string,string>, for: string[], description: string }}
 */
function buildSpec(flags, argsArr, env, forList) {
  return {
    transport: typeof flags.transport === 'string' ? flags.transport : 'stdio',
    command: typeof flags.command === 'string' ? flags.command : null,
    args: argsArr,
    url: typeof flags.url === 'string' ? flags.url : null,
    env,
    for: forList,
    description: typeof flags.description === 'string' ? flags.description : '',
  };
}

/**
 * Render the per-attach decision record (mirrors the import-skill format).
 * @param {string} slug
 * @param {ReturnType<typeof scanMcpServer>['verdict']} verdict
 * @param {ReturnType<typeof scanMcpServer>['findings']} findings
 * @param {ReturnType<typeof buildSpec>} spec
 * @param {string} date
 * @returns {string}
 */
function buildDecisionRecord(slug, verdict, findings, spec, date) {
  const findingsLines = findings.length
    ? findings.map((f) => `- ${f.severity} / ${f.category}: ${f.evidence}`).join('\n')
    : '- none';
  const launch = spec.command
    ? `${spec.command} ${spec.args.join(' ')}`.trim()
    : spec.url || '(unspecified)';
  return [
    `# MCP attach decision: ${slug}`,
    `Date: ${date}   Verdict: ${verdict}`,
    '',
    '## Server',
    `- Transport: ${spec.transport}`,
    `- Launch: ${launch}`,
    `- For: ${spec.for.join(', ')}`,
    '',
    '## Security audit',
    findingsLines,
    '',
    '## Rationale',
    '<why this server is attached — filled by the skill>',
    '',
  ].join('\n');
}

/**
 * Read the merged `mcp_servers` map (global + project) as an id→record object.
 * Greenfield-safe → {}.
 * @param {string} cwd
 * @returns {Record<string, *>}
 */
function readServers(cwd) {
  const cfg = loadConfig(cwd);
  const servers = cfg && cfg.mcp_servers;
  return servers && typeof servers === 'object' && !Array.isArray(servers) ? servers : {};
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * `mcp audit` — scan a launch spec WITHOUT persisting (the pre-attach gate).
 * The spec comes from the same named flags as `add` (so the skill can audit the
 * exact thing it will attach). Empty/absent spec → clean no_content (greenfield),
 * mirroring `extension audit`. ok is driven by the verdict, never the findings count.
 *
 * @param {string} cwd - project root
 * @param {Record<string, *>} flags - parsed named args
 * @param {string[]|null} argsList - parsed `--args` list
 * @param {string[]|null} envList - parsed `--env` list
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdMcpAudit(cwd, flags, argsList, envList, raw) {
  const slug = slugify(String(flags.id || ''));
  const hasSpec = flags.command || flags.url || (Array.isArray(argsList) && argsList.length);
  if (!hasSpec) {
    output({ ok: true, id: slug || null, findings: [], verdict: 'clean', reason: 'no_content' }, raw);
    return;
  }
  const spec = buildSpec(flags, Array.isArray(argsList) ? argsList : [], parseEnvPairs(envList), parseFor(flags.for));
  const { findings, verdict } = scanMcpServer(spec);
  output({ ok: verdict !== 'block', id: slug || null, findings, verdict }, raw);
}

/**
 * `mcp add` — audit then persist. A `block` verdict is a hard stop (non-zero
 * exit). A `review` verdict requires `--force` to record (and is stored with its
 * verdict so the caveat is visible later). On a go: writes `mcp_servers[slug]` to
 * the PROJECT config.json (via patchConfig — never the merged view) and a
 * decision record under `.sovereign/mcp/<date>-<slug>.md`. Re-adding overwrites.
 *
 * @param {string} cwd - project root
 * @param {Record<string, *>} flags - parsed named args
 * @param {string[]|null} argsList - parsed `--args` list
 * @param {string[]|null} envList - parsed `--env` list
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdMcpAdd(cwd, flags, argsList, envList, raw) {
  const slug = slugify(String(flags.id || ''));
  if (!slug) {
    error('mcp add: --id is required');
  }
  const argsArr = Array.isArray(argsList) ? argsList : [];
  if (!flags.command && !flags.url) {
    error('mcp add: a server needs --command (stdio) or --url (http/sse)');
  }

  const spec = buildSpec(flags, argsArr, parseEnvPairs(envList), parseFor(flags.for));
  const { findings, verdict } = scanMcpServer(spec);

  if (verdict === 'block') {
    error(`mcp add: security audit returned BLOCK — refusing to attach "${slug}". Findings: ` +
      findings.map((f) => `${f.severity}/${f.category}`).join(', '));
  }
  if (verdict === 'review' && flags.force !== true) {
    error(`mcp add: security audit returned REVIEW for "${slug}" — re-run with --force to attach with caveats. Findings: ` +
      findings.map((f) => `${f.severity}/${f.category}`).join(', '));
  }

  const date = todayISO();
  const record = {
    transport: spec.transport,
    command: spec.command,
    args: spec.args,
    url: spec.url,
    env: spec.env,
    for: spec.for,
    description: spec.description,
    verdict,
    attached: date,
  };

  // Persist into the PROJECT config under mcp_servers[slug] (preserve other keys).
  patchConfig(cwd, (cfg) => {
    const servers = (cfg.mcp_servers && typeof cfg.mcp_servers === 'object' && !Array.isArray(cfg.mcp_servers))
      ? { ...cfg.mcp_servers }
      : {};
    servers[slug] = record;
    cfg.mcp_servers = servers;
    return cfg;
  });

  // Write the auditable decision record.
  const mcpDir = path.join(cwd, MCP_DIR_REL);
  fs.mkdirSync(mcpDir, { recursive: true });
  const recordPath = path.join(mcpDir, `${date}-${slug}.md`);
  fs.writeFileSync(recordPath, buildDecisionRecord(slug, verdict, findings, spec, date), 'utf-8');

  output({
    id: slug,
    ...record,
    findings,
    decision_record: path.join(MCP_DIR_REL, `${date}-${slug}.md`),
  }, raw);
}

/**
 * `mcp list` — emit the attached servers (merged global + project) as an array,
 * each `{ id, ...record }`. Greenfield-safe → []. Array top-level (extractField
 * supports arr[0]/arr[-1] for --pick).
 * @param {string} cwd - project root
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdMcpList(cwd, raw) {
  const servers = readServers(cwd);
  output(
    Object.keys(servers).sort().map((id) => ({ id, ...servers[id] })),
    raw
  );
}

/**
 * `mcp remove` — delete `mcp_servers[slug]` from the PROJECT config. Emits
 * `{ id, removed }` (removed=false when it was not present in the project file).
 * @param {string} cwd - project root
 * @param {Record<string, *>} flags - parsed named args
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdMcpRemove(cwd, flags, raw) {
  const slug = slugify(String(flags.id || ''));
  if (!slug) {
    error('mcp remove: --id is required');
  }
  let removed = false;
  patchConfig(cwd, (cfg) => {
    if (cfg.mcp_servers && typeof cfg.mcp_servers === 'object' && slug in cfg.mcp_servers) {
      const servers = { ...cfg.mcp_servers };
      delete servers[slug];
      cfg.mcp_servers = servers;
      removed = true;
    }
    return cfg;
  });
  output({ id: slug, removed }, raw);
}

module.exports = {
  cmdMcpAudit,
  cmdMcpAdd,
  cmdMcpList,
  cmdMcpRemove,
  parseEnvPairs,
  parseFor,
  buildSpec,
  readServers,
  buildDecisionRecord,
};
