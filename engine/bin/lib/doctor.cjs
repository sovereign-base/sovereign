// @ts-check
'use strict';

/**
 * doctor — the skill-listing budget check (SKL-07, plan 02-03).
 *
 * Claude Code injects every auto-triggerable skill's name + description into the
 * model's context on EVERY turn; that listing competes for a finite slice of the
 * window (~1% ≈ 2000 tokens of a 200k window is a reasonable target). Too many
 * auto-triggerable skills, or descriptions that are too long, crowd the listing
 * and degrade triggering. doctor enumerates the installed SOVEREIGN skills,
 * counts the AUTO-TRIGGERABLE ones (those WITHOUT `disable-model-invocation:
 * true`), sums their name+description chars, estimates the listing-token cost
 * (chars/4), and warns when the auto-triggerable count exceeds AUTO_MAX (~7) or
 * the token estimate exceeds TOKEN_BUDGET (~2000).
 *
 * The convention this enforces: orchestrator-only / side-effecting skills set
 * `disable-model-invocation: true`, which removes them from the listing budget
 * (they are user-invoked via /name, not auto-triggered). See
 * references/listing-budget.md.
 *
 * With no skills installed, doctor reports CLEAN — the mechanism + thresholds
 * exist now so Phases 3-4 satisfy the budget rather than discover the cap late.
 *
 * Exports:
 *   checkBudget(cwd)         — pure: enumerate skills + compute the budget result
 *   cmdDoctor(cwd, raw)      — CLI: output(checkBudget(...)); exit(1) only on warnings
 *   AUTO_MAX, TOKEN_BUDGET   — the thresholds (module consts)
 */

const path = require('node:path');
const { output, safeReadFile } = require('./core.cjs');
const { walkSkillFiles, parseFrontmatter } = require('./validate.cjs');

/** Max auto-triggerable skills before the listing crowds (CONTEXT discretion). */
const AUTO_MAX = 7;
/** ~1% of a 200k window — the listing-token budget for auto-triggerable skills. */
const TOKEN_BUDGET = 2000;
/** Rough chars→tokens divisor (the engine's standard estimate). */
const CHARS_PER_TOKEN = 4;

/**
 * Whether a frontmatter map opts the skill OUT of auto-invocation. Accepts the
 * boolean-ish `true` string the line-based frontmatter parser yields.
 * @param {Record<string, string>} fm
 * @returns {boolean}
 */
function isInvocationDisabled(fm) {
  const v = fm['disable-model-invocation'];
  return typeof v === 'string' && v.trim().toLowerCase() === 'true';
}

/**
 * Enumerate installed SOVEREIGN skills and compute the listing-budget result.
 *
 * Walks SKILL.md files under <cwd>/.claude/skills and <cwd>/skills, parses each
 * frontmatter, and partitions into auto-triggerable vs disabled. The budget is
 * computed over the AUTO-TRIGGERABLE skills only (disabled ones cost nothing in
 * the listing). Zero skills → clean.
 *
 * @param {string} cwd - project root
 * @returns {{
 *   ok: boolean,
 *   total_skills: number,
 *   auto_count: number,
 *   disabled_count: number,
 *   desc_chars: number,
 *   listing_token_estimate: number,
 *   auto_max: number,
 *   token_budget: number,
 *   warnings: string[]
 * }}
 */
function checkBudget(cwd) {
  /** @type {string[]} */
  const files = [];
  walkSkillFiles(path.join(cwd, '.claude', 'skills'), files);
  walkSkillFiles(path.join(cwd, 'skills'), files);

  let auto_count = 0;
  let disabled_count = 0;
  let desc_chars = 0;

  for (const file of files) {
    const content = safeReadFile(file);
    if (content === null) continue;
    const fm = parseFrontmatter(content);
    if (isInvocationDisabled(fm)) {
      disabled_count++;
      continue;
    }
    auto_count++;
    const name = fm.name || '';
    const description = fm.description || '';
    desc_chars += name.length + description.length;
  }

  const listing_token_estimate = Math.ceil(desc_chars / CHARS_PER_TOKEN);

  /** @type {string[]} */
  const warnings = [];
  if (auto_count > AUTO_MAX) {
    warnings.push(
      `auto-triggerable skill count ${auto_count} exceeds budget of ${AUTO_MAX} ` +
        `(set disable-model-invocation: true on orchestrator-only skills)`
    );
  }
  if (listing_token_estimate > TOKEN_BUDGET) {
    warnings.push(
      `estimated listing cost ${listing_token_estimate} tokens exceeds budget of ${TOKEN_BUDGET} ` +
        `(shorten skill descriptions or disable auto-invocation)`
    );
  }

  return {
    ok: warnings.length === 0,
    total_skills: files.length,
    auto_count,
    disabled_count,
    desc_chars,
    listing_token_estimate,
    auto_max: AUTO_MAX,
    token_budget: TOKEN_BUDGET,
    warnings,
  };
}

/**
 * CLI wrapper: run the budget check, emit the JSON report, then exit(1) only
 * when warnings are present so CI/install can gate on a budget breach. The
 * clean zero-skill state exits 0. Writes the report FIRST, then exits — matching
 * the writeSync-then-exit discipline used across the engine.
 *
 * @param {string} cwd - project root
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdDoctor(cwd, raw) {
  const result = checkBudget(cwd);
  output(result, raw, result.ok ? 'ok' : 'warn');
  if (!result.ok) {
    process.exit(1);
  }
}

module.exports = {
  checkBudget,
  cmdDoctor,
  AUTO_MAX,
  TOKEN_BUDGET,
};
