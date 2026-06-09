// @ts-check
'use strict';

/**
 * model-profiles — SOVEREIGN's agent→model mapping per profile.
 *
 * Each subagent maps to a model alias under three profiles: `quality`,
 * `balanced`, and `budget`. Under `quality`, SOVEREIGN's reasoning agents
 * (council advisors + chairman + peer_reviewer + planner) run on opus; cheaper
 * mechanical agents stay on sonnet/haiku (CONTEXT.md model decision).
 *
 * This table is the single source of truth consumed by the engine's
 * model / resolve-model commands (plan 03).
 */

/**
 * @typedef {{ quality: string, balanced: string, budget: string }} ProfileModels
 * @type {Record<string, ProfileModels>}
 */
const MODEL_PROFILES = {
  advisor:       { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet' },
  chairman:      { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet' },
  peer_reviewer: { quality: 'opus',   balanced: 'sonnet', budget: 'sonnet' },
  planner:       { quality: 'opus',   balanced: 'opus',   budget: 'sonnet' },
  researcher:    { quality: 'opus',   balanced: 'sonnet', budget: 'haiku'  },
  synthesizer:   { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku'  },
  sentinel:      { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku'  },
  verifier:      { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku'  },
};

/**
 * Valid profile names, derived from the table so they cannot drift.
 * @type {string[]}
 */
const VALID_PROFILES = Object.keys(MODEL_PROFILES.advisor);

/**
 * Build an `{ agent: model }` map for a given profile.
 * @param {string} profile - one of VALID_PROFILES (quality|balanced|budget)
 * @returns {Record<string, string>}
 */
function getAgentToModelMapForProfile(profile) {
  /** @type {Record<string, string>} */
  const map = {};
  for (const [agent, models] of Object.entries(MODEL_PROFILES)) {
    map[agent] = models[/** @type {keyof ProfileModels} */ (profile)];
  }
  return map;
}

module.exports = {
  MODEL_PROFILES,
  VALID_PROFILES,
  getAgentToModelMapForProfile,
};
