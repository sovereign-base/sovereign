// @ts-check
'use strict';

/**
 * model — per-agent model resolution against the profile table.
 *
 * Mirrors GSD's resolveModelInternal verbatim (retargeted to SOVEREIGN's
 * MODEL_PROFILES). Resolution order:
 *   1. config.model_overrides[agent]   — always wins (custom/fully-qualified IDs).
 *   2. resolve_model_ids === 'omit'     — return '' so the runtime uses its own default
 *                                         (non-Claude runtimes that don't grok aliases).
 *   3. MODEL_PROFILES[agent][profile]   — the configured profile (quality|balanced|budget);
 *                                         'inherit' short-circuits to 'inherit'.
 *   4. 'sonnet'                          — fallback for unknown agents / missing entries.
 *
 * Consumed by the `model` / `resolve-model` CLI commands and by `init` (plan 05).
 */

const { loadConfig, output, error } = require('./core.cjs');
const { MODEL_PROFILES } = require('./model-profiles.cjs');

/**
 * Resolve the model alias for an agent, honoring overrides, the 'omit' escape
 * hatch, the configured profile, and the sonnet fallback — in that order.
 *
 * @param {string} cwd - project root
 * @param {string} agentType - agent name (advisor|chairman|planner|...)
 * @returns {string} model alias, '' (omit), or 'inherit'
 */
function resolveModelInternal(cwd, agentType) {
  const config = loadConfig(cwd);

  // 1. Per-agent override always wins, regardless of resolve_model_ids/profile.
  const override = config.model_overrides?.[agentType];
  if (override) {
    return override;
  }

  // 2. resolve_model_ids:'omit' — emit nothing so the runtime picks its default.
  if (config.resolve_model_ids === 'omit') {
    return '';
  }

  // 3. Profile-table lookup. Unknown agents fall back to sonnet; 'inherit' passes through.
  const profile = String(config.model_profile || 'balanced').toLowerCase();
  const agentModels = MODEL_PROFILES[agentType];
  if (!agentModels) return 'sonnet';
  if (profile === 'inherit') return 'inherit';

  // 4. Fall back within the row, then to sonnet.
  return agentModels[profile] || agentModels.balanced || 'sonnet';
}

/**
 * CLI wrapper: resolve `agent`'s model and emit `{ agent, model }`. The raw
 * value is the bare model string so `model <agent> --raw` is shell-friendly.
 *
 * @param {string} cwd - project root
 * @param {string} agent - agent name
 * @param {boolean} [raw] - emit the bare model string instead of JSON
 * @returns {void}
 */
function cmdResolveModel(cwd, agent, raw) {
  if (!agent) {
    error('agent name required (usage: model <agent>)');
  }
  const model = resolveModelInternal(cwd, agent);
  output({ agent, model }, raw, model);
}

module.exports = {
  resolveModelInternal,
  cmdResolveModel,
};
