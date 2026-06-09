// @ts-check
'use strict';

/**
 * security — prompt-injection guards for text that flows back into agent context.
 *
 * SOVEREIGN's engine writes markdown and commit messages that are later read
 * back into LLM context (an indirect prompt-injection vector). `sanitizeForPrompt`
 * neutralizes control characters and instruction-mimicking markers without
 * altering legitimate intent. This is defense-in-depth, not a complete solution —
 * the primary defense is proper input/output boundaries in agent prompts.
 *
 * Lifted from GSD's security.cjs (sanitizeForPrompt) and retargeted; SOVEREIGN
 * keeps only the message-sanitization surface the `commit` command needs.
 */

/**
 * Sanitize text destined for agent prompts or planning/commit documents.
 *
 * Strips zero-width / invisible Unicode and neutralizes XML/HTML system-boundary
 * tags and bracketed instruction markers so embedded text cannot hijack agent
 * behavior when read back. Returns the input unchanged for non-string values.
 *
 * @param {string} text
 * @returns {string}
 */
function sanitizeForPrompt(text) {
  if (!text || typeof text !== 'string') return text;

  let sanitized = text;

  // Strip zero-width / invisible Unicode that could hide instructions
  // (ZWSP..RLM, line/para separators, BOM, soft hyphen).
  sanitized = sanitized.replace(/[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/g, '');

  // Neutralize XML/HTML tags that mimic system/role boundaries by swapping the
  // angle brackets for full-width equivalents so they cannot be parsed as tags.
  sanitized = sanitized.replace(/<(\/?)(?:system|assistant|human)>/gi,
    (_, slash) => `＜${slash || ''}system-text＞`);

  // Neutralize [SYSTEM] / [INST] bracketed markers.
  sanitized = sanitized.replace(/\[(SYSTEM|INST)\]/gi, '[$1-TEXT]');

  // Neutralize <<SYS>> markers.
  sanitized = sanitized.replace(/<<\s*SYS\s*>>/gi, '«SYS-TEXT»');

  return sanitized;
}

/**
 * Module-level pattern table for {@link scanSkillContent}. Data-driven so the
 * case set is enumerable + testable. Each entry maps to an OWASP category and a
 * severity that drives the verdict escalation.
 *
 * OWASP mapping (re-verify note): the live OWASP GenAI/Agentic project pages
 * were UNREACHABLE at authoring time (offline), so this set is the three
 * CONTEXT-specified categories grounded against the well-established taxonomy:
 *   - exfiltration        → OWASP Agentic "Resource/Data Exfiltration" + LLM02
 *                           (Sensitive Information Disclosure).
 *   - overbroad_permission → OWASP Agentic "Privilege Compromise" + LLM06
 *                           (Excessive Agency).
 *   - prompt_injection    → OWASP Agentic "Prompt/Memory Injection" + LLM01
 *                           (Prompt Injection).
 * Re-verify against the current OWASP Agentic Top-10 when the network is
 * available and extend `SKILL_SCAN_PATTERNS` rather than rewriting the scanner.
 *
 * @type {ReadonlyArray<{ category: 'exfiltration'|'overbroad_permission'|'prompt_injection', severity: 'low'|'medium'|'high', re: RegExp }>}
 */
const SKILL_SCAN_PATTERNS = [
  // --- exfiltration: outbound network + pipe-to-shell -----------------------
  // curl/wget piped into a shell — classic install-and-run exfil/backdoor.
  { category: 'exfiltration', severity: 'high',
    re: /\b(?:curl|wget)\b[^\n|]*\|\s*(?:ba|z|da)?sh\b/i },
  // any pipe of network output into an interpreter.
  { category: 'exfiltration', severity: 'high',
    re: /\|\s*(?:ba|z|da)?sh\b/i },
  // raw curl/wget invocation against an http(s) URL.
  { category: 'exfiltration', severity: 'medium',
    re: /\b(?:curl|wget)\b[^\n]*\bhttps?:\/\/\S+/i },
  // programmatic fetch / XHR / node http.request to a remote URL.
  { category: 'exfiltration', severity: 'medium',
    re: /\b(?:fetch\s*\(|XMLHttpRequest|https?\.request\s*\()/ },
  // explicit webhook endpoints (common exfil sink).
  { category: 'exfiltration', severity: 'medium',
    re: /https?:\/\/[^\s"')]*(?:webhook|hooks\.slack|discord(?:app)?\.com\/api\/webhooks)\S*/i },

  // --- overbroad_permission: frontmatter grants -----------------------------
  // allowed-tools granting everything.
  { category: 'overbroad_permission', severity: 'high',
    re: /allowed-tools\s*:\s*(?:["']?\*["']?|.*\*)/i },
  // allowed-tools granting unconstrained Bash.
  { category: 'overbroad_permission', severity: 'medium',
    re: /allowed-tools\s*:[^\n]*\bBash\b(?!\s*\()/i },
  // path globs that match the whole tree / filesystem root.
  { category: 'overbroad_permission', severity: 'medium',
    re: /paths\s*:\s*["']?(?:\*\*\/\*|\/|\*\*)["']?/i },
  // toggling off model-invocation gating to broaden reach.
  { category: 'overbroad_permission', severity: 'low',
    re: /disable-model-invocation\s*:\s*false/i },

  // --- prompt_injection: reuse the sanitizeForPrompt marker toolkit ---------
  // zero-width / invisible Unicode (same class sanitizeForPrompt strips).
  { category: 'prompt_injection', severity: 'high',
    re: /[\u200B-\u200F\u2028-\u202F\uFEFF\u00AD]/ },
  // bracketed instruction markers.
  { category: 'prompt_injection', severity: 'high',
    re: /\[(?:SYSTEM|INST)\]/i },
  // <<SYS>> marker.
  { category: 'prompt_injection', severity: 'high',
    re: /<<\s*SYS\s*>>/i },
  // XML/HTML system/role boundary tags.
  { category: 'prompt_injection', severity: 'high',
    re: /<\/?(?:system|assistant|human)>/i },
  // "ignore (all) previous instructions" family.
  { category: 'prompt_injection', severity: 'high',
    re: /ignore\s+(?:all\s+)?previous\s+instructions/i },
  // "disregard (the) above/prior" family.
  { category: 'prompt_injection', severity: 'high',
    re: /disregard\s+(?:the\s+)?(?:above|prior)/i },
];

const VERDICT_RANK = { clean: 0, review: 1, block: 2 };

/**
 * Truncate a matched snippet for safe inclusion in a finding's `evidence`.
 * @param {string} snippet
 * @returns {string}
 */
function truncateEvidence(snippet) {
  const oneLine = String(snippet).replace(/\s+/g, ' ').trim();
  return oneLine.length > 120 ? `${oneLine.slice(0, 117)}…` : oneLine;
}

/**
 * Statically scan materialized third-party skill content for the EXT-02 vetting
 * layer. Pure function — no I/O, no throw. Detects three OWASP-grounded
 * categories (see {@link SKILL_SCAN_PATTERNS}): data exfiltration, overbroad
 * permission grants, and prompt injection (reusing the sanitizeForPrompt marker
 * toolkit). Judgment (necessity/conflict/recommendation) stays skill-side.
 *
 * Verdict escalation: any `high` finding → `'block'`; any `medium` (no high) →
 * `'review'`; otherwise → `'clean'`. (`low` findings are reported but do not
 * lift the verdict above `clean` on their own.)
 *
 * @param {*} text raw skill content (SKILL.md body + frontmatter). Non-string
 *   or empty input yields `{ findings: [], verdict: 'clean' }`.
 * @returns {{ findings: Array<{ category: string, severity: string, evidence: string }>, verdict: 'clean'|'review'|'block' }}
 */
function scanSkillContent(text) {
  if (!text || typeof text !== 'string') return { findings: [], verdict: 'clean' };

  const findings = [];
  let verdict = 'clean';

  for (const { category, severity, re } of SKILL_SCAN_PATTERNS) {
    const match = re.exec(text);
    if (!match) continue;
    findings.push({ category, severity, evidence: truncateEvidence(match[0]) });
    // Escalate verdict (low findings stay at clean).
    const candidate = severity === 'high' ? 'block' : severity === 'medium' ? 'review' : 'clean';
    if (VERDICT_RANK[candidate] > VERDICT_RANK[verdict]) verdict = candidate;
  }

  return { findings, verdict };
}

module.exports = {
  sanitizeForPrompt,
  scanSkillContent,
};
