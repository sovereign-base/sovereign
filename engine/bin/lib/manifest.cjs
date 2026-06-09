// @ts-check
'use strict';

/**
 * manifest — derived MANIFEST.md regeneration (engine layer B, plan 01-03).
 *
 * MANIFEST.md is the engine-DERIVED orientation view (ADR-012): regenerated on
 * every `state save`, loaded FIRST by every skill, never hand-edited. This module
 * is the SOLE writer of MANIFEST.md.
 *
 * It derives the manifest from authoritative sources:
 *   - .sovereign/STATE.md  → Phase / Status (Gate Status) / Blockers / Next Action
 *   - docs/adr/ (or .sovereign/docs/adr/) → Key Decisions quick-ref (top-N ADR titles)
 *
 * It enforces a ~500-token budget in code (chars/4 heuristic): if over budget the
 * Key Decisions table is truncated (oldest dropped) and, if still over after a
 * top-3 truncation, an inline WARN comment is appended. This is SOVEREIGN's one
 * extension over GSD — MANIFEST always reflects the latest state, within budget.
 *
 * Exports:
 *   regenerateManifest(cwd) — derive + write MANIFEST.md; returns a status object.
 */

const fs = require('node:fs');
const path = require('node:path');

const { safeReadFile } = require('./core.cjs');
const { readField } = require('./state.cjs');

const TOKEN_BUDGET = 500; // ~500 tokens, enforced in code
const ADR_TOP_N = 8; // initial Key Decisions quick-ref cap
const ADR_MIN_N = 3; // floor after which we warn instead of truncating further

/**
 * Estimate token count of a string via the chars/4 heuristic (CONTEXT.md says
 * approx by chars/4 is acceptable).
 * @param {string} str
 * @returns {number}
 */
function estimateTokens(str) {
  return Math.ceil(str.length / 4);
}

/**
 * Collect ADR title quick-ref rows from a docs/adr directory.
 * Title = the first `# ` heading line, else the filename stem.
 * Returns newest-first is not knowable from disk, so we sort by filename
 * (ADR-NNN prefixes sort chronologically) and treat the front as "oldest".
 *
 * @param {string} adrDir
 * @returns {Array<{file: string, title: string}>}
 */
function collectAdrs(adrDir) {
  /** @type {Array<{file: string, title: string}>} */
  const rows = [];
  let entries;
  try {
    entries = fs.readdirSync(adrDir);
  } catch {
    return rows;
  }
  for (const file of entries.sort()) {
    if (!/\.md$/i.test(file)) continue;
    const raw = safeReadFile(path.join(adrDir, file));
    if (raw === null) continue;
    const headingMatch = raw.match(/^#\s+(.+)$/m);
    const title = headingMatch ? headingMatch[1].trim() : file.replace(/\.md$/i, '');
    rows.push({ file, title });
  }
  return rows;
}

/**
 * Compose the MANIFEST.md string from derived values.
 * @param {object} params
 * @param {string} params.phase
 * @param {string} params.gateStatus
 * @param {string} params.blockers
 * @param {string} params.nextAction
 * @param {Array<{file: string, title: string}>} params.adrs
 * @returns {string}
 */
function composeManifest({ phase, gateStatus, blockers, nextAction, adrs }) {
  const now = new Date().toISOString();

  let decisionRows;
  if (adrs.length === 0) {
    decisionRows = '| —        | Not yet defined | —   |';
  } else {
    decisionRows = adrs
      .map((a) => `| ${a.title} | see ADR | ${a.file} |`)
      .join('\n');
  }

  return `# SOVEREIGN MANIFEST

<!--
  DERIVED — regenerated on every state save, do not hand-edit (ADR-012).
  Sole writer: sovereign-tools (manifest.cjs). Loaded FIRST by every skill.
  Token budget: ~${TOKEN_BUDGET} tokens, enforced in code (chars/4 heuristic).
  To change anything here, edit the authoritative source (STATE.md, docs/adr/).
-->

**Sovereign Version:** 2.0.0
**Last Updated:** ${now}

---

## Current Status

**Phase:** ${phase}
**Gate Status:** ${gateStatus}

---

## Next Recommended Action

\`\`\`
${nextAction}
\`\`\`

---

## Current Blockers

<!-- Mirrors STATE.md Blockers. -->

${blockers}

---

## Key Decisions (Quick Reference)

<!-- Derived from docs/adr/. One line per decision. -->

| Decision | Choice | ADR |
| -------- | ------ | --- |
${decisionRows}

---

<!-- sovereign-base/sovereign v2.0.0 -->
`;
}

/**
 * Regenerate .sovereign/MANIFEST.md from STATE.md + docs/adr/, enforcing the
 * ~500-token budget. The engine is the ONLY writer of MANIFEST.md.
 *
 * @param {string} cwd - project root
 * @returns {{written: boolean, est_tokens: number, truncated: boolean, over_budget: boolean}}
 */
function regenerateManifest(cwd) {
  const stateRaw = safeReadFile(path.join(cwd, '.sovereign', 'STATE.md')) || '';

  const phase = readField(stateRaw, 'Phase') || '—';
  const gateStatus = readField(stateRaw, 'Status') || 'Not started';
  const blockers = readField(stateRaw, 'Blockers') || 'None';
  const nextAction = readField(stateRaw, 'Next Action') || '—';

  // Prefer project-level docs/adr/, fall back to .sovereign/docs/adr/.
  let adrDir = path.join(cwd, 'docs', 'adr');
  if (!fs.existsSync(adrDir)) {
    adrDir = path.join(cwd, '.sovereign', 'docs', 'adr');
  }
  let adrs = collectAdrs(adrDir).slice(0, ADR_TOP_N);

  const compose = () =>
    composeManifest({
      phase,
      gateStatus,
      blockers: blockers === 'None' ? '- None' : `- ${blockers}`,
      nextAction: nextAction === '—' ? '—' : nextAction,
      adrs,
    });

  let manifest = compose();
  let estTokens = estimateTokens(manifest);
  let truncated = false;

  // Truncate the Key Decisions table (drop oldest = front of sorted list) until
  // under budget or at the top-N floor.
  while (estTokens > TOKEN_BUDGET && adrs.length > ADR_MIN_N) {
    adrs = adrs.slice(1);
    truncated = true;
    manifest = compose();
    estTokens = estimateTokens(manifest);
  }

  let overBudget = false;
  if (estTokens > TOKEN_BUDGET) {
    overBudget = true;
    manifest += `\n<!-- WARN: MANIFEST over ${TOKEN_BUDGET}-token budget (est ${estTokens}) -->\n`;
  }

  fs.writeFileSync(path.join(cwd, '.sovereign', 'MANIFEST.md'), manifest, 'utf-8');

  return { written: true, est_tokens: estTokens, truncated, over_budget: overBudget };
}

module.exports = { regenerateManifest, estimateTokens };
