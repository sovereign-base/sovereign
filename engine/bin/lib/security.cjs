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

/**
 * Module-level pattern table for the MCP-server-spec layer of {@link scanMcpServer}.
 * These are the checks that are *structural* to a launch spec (transport / url /
 * command / args / env) and have no analogue in the markdown-oriented
 * {@link SKILL_SCAN_PATTERNS}. The exfiltration + prompt-injection regexes from
 * that table are ALSO run (over the stringified spec) by scanMcpServer — these
 * are the additions, not a replacement.
 *
 * OWASP mapping mirrors scanSkillContent's:
 *   - exfiltration         → outbound network / pipe-to-shell baked into a launch.
 *   - overbroad_permission → spawning a raw shell, or running unpinned remote code
 *                            (supply-chain — Excessive Agency / LLM06).
 *   - prompt_injection     → handled by reusing SKILL_SCAN_PATTERNS over the spec.
 *
 * Each entry's `test(str)` receives the FULL `JSON.stringify(spec)` so a pattern
 * can match across fields; structured single-field checks live in scanMcpServer
 * itself where the field is semantically meaningful (e.g. url scheme).
 *
 * @type {ReadonlyArray<{ category: 'exfiltration'|'overbroad_permission', severity: 'low'|'medium'|'high', re: RegExp }>}
 */
const MCP_SPEC_PATTERNS = [
  // Spawning a raw shell as the server command is almost never a legitimate MCP
  // launch and is a direct RCE/exfil vector — block.
  { category: 'overbroad_permission', severity: 'high',
    re: /\b(?:ba|z|da)?sh\b[^"]*\s-c\b/i },
];

/**
 * Does an args array contain a package reference that is NOT version-pinned?
 * Runners like `npx`/`uvx`/`pnpm dlx` fetch+run remote code at launch; an
 * unpinned spec (`@upstash/context7-mcp` with no `@version`) silently tracks
 * upstream HEAD — a supply-chain risk worth a `review`. A pinned ref
 * (`pkg@1.2.3`, `pkg@^1`, a local `./path`, or a bare flag like `-y`) is fine.
 *
 * Heuristic: a token is a "package" if it isn't a flag (`-x`/`--x`), isn't a
 * path (`/`, `.`, `~`), and looks like an npm/pypi name (optionally scoped). It
 * is "pinned" when it carries an `@<version>` AFTER the name (scoped names start
 * with `@`, so we look for a SECOND `@`), or is an explicit local path.
 *
 * @param {string[]} args
 * @returns {boolean}
 */
function hasUnpinnedPackage(args) {
  if (!Array.isArray(args)) return false;
  for (const raw of args) {
    const tok = String(raw);
    if (tok.startsWith('-')) continue;                 // flag (e.g. -y, --foo)
    if (/^[./~]/.test(tok)) continue;                  // local path
    if (!/^@?[a-z0-9][a-z0-9._/-]*$/i.test(tok)) continue; // not a package-ish token
    const scoped = tok.startsWith('@');
    // Pinned when an `@version` follows the name: a non-scoped `name@ver` has one
    // `@`; a scoped `@scope/name@ver` has two.
    const atCount = (tok.match(/@/g) || []).length;
    const pinned = scoped ? atCount >= 2 : atCount >= 1;
    if (!pinned) return true;
  }
  return false;
}

const REMOTE_RUNNERS = /^(?:npx|uvx|bunx|pnpm|yarn|pipx?)$/i;

/**
 * Statically scan an MCP server LAUNCH SPEC for the mcp-attach vetting gate — the
 * spec analogue of {@link scanSkillContent}. An MCP server is a launch
 * descriptor (`{ transport, command, args, url, env }`), not markdown, so this
 * runs two layers over it:
 *
 *   1. the markdown-oriented exfiltration + prompt-injection patterns from
 *      {@link SKILL_SCAN_PATTERNS} over `JSON.stringify(spec)` (catches a
 *      `curl … | sh` baked into command/args, webhook sinks, injection markers);
 *   2. the MCP-structured checks: a raw-shell command ({@link MCP_SPEC_PATTERNS},
 *      high → block), a plain-`http://` remote url (medium → review), unpinned
 *      remote-code runners (medium → review), and inline-secret-looking env
 *      values (medium → review).
 *
 * Same return shape and escalation as scanSkillContent (any high → 'block', any
 * medium → 'review', else 'clean'; low is reported but stays clean). Pure — no
 * I/O, no throw. A non-object spec yields a clean empty result.
 *
 * @param {*} spec the parsed server spec object.
 * @returns {{ findings: Array<{ category: string, severity: string, evidence: string }>, verdict: 'clean'|'review'|'block' }}
 */
function scanMcpServer(spec) {
  if (!spec || typeof spec !== 'object' || Array.isArray(spec)) {
    return { findings: [], verdict: 'clean' };
  }

  const findings = [];
  let verdict = 'clean';
  /** @param {'clean'|'review'|'block'} candidate */
  const escalate = (candidate) => {
    if (VERDICT_RANK[candidate] > VERDICT_RANK[verdict]) verdict = candidate;
  };
  /** @param {string} category @param {string} severity @param {string} evidence */
  const add = (category, severity, evidence) => {
    findings.push({ category, severity, evidence: truncateEvidence(evidence) });
    escalate(severity === 'high' ? 'block' : severity === 'medium' ? 'review' : 'clean');
  };

  const serialized = JSON.stringify(spec);

  // Layer 1: reuse the exfiltration + prompt-injection patterns over the spec.
  // (Skip the markdown frontmatter `overbroad_permission` patterns — they target
  // SKILL.md `allowed-tools:`/`paths:` text that does not occur in a launch spec.)
  for (const { category, severity, re } of SKILL_SCAN_PATTERNS) {
    if (category === 'overbroad_permission') continue;
    const match = re.exec(serialized);
    if (!match) continue;
    add(category, severity, match[0]);
  }

  // Layer 2a: structural patterns (raw shell command).
  const commandStr = typeof spec.command === 'string' ? spec.command : '';
  const argsArr = Array.isArray(spec.args) ? spec.args.map(String) : [];
  const commandLine = [commandStr, ...argsArr].join(' ');
  for (const { category, severity, re } of MCP_SPEC_PATTERNS) {
    const match = re.exec(commandLine) || re.exec(serialized);
    if (!match) continue;
    add(category, severity, match[0]);
  }

  // Layer 2b: a remote url over plain http:// (not https) — MITM / downgrade.
  if (typeof spec.url === 'string' && /^http:\/\//i.test(spec.url.trim())) {
    add('exfiltration', 'medium', spec.url);
  }

  // Layer 2c: unpinned remote-code runner — supply-chain (tracks upstream HEAD).
  if (REMOTE_RUNNERS.test(commandStr.trim()) && hasUnpinnedPackage(argsArr)) {
    add('overbroad_permission', 'medium', commandLine);
  }

  // Layer 2d: inline secret-looking env values — recommend an env-var reference
  // instead of baking a credential into the committed record.
  if (spec.env && typeof spec.env === 'object' && !Array.isArray(spec.env)) {
    for (const [k, v] of Object.entries(spec.env)) {
      const val = typeof v === 'string' ? v : '';
      const looksSecret = /(?:key|token|secret|password|passwd|api[_-]?key|auth)/i.test(k);
      // A ${VAR} / $VAR reference is the safe form; flag only literal-looking values.
      const isReference = /^\$\{?\w+\}?$/.test(val.trim());
      if (looksSecret && val && !isReference) {
        add('exfiltration', 'medium', `${k}=<inline value>`);
      }
    }
  }

  return { findings, verdict };
}

module.exports = {
  sanitizeForPrompt,
  scanSkillContent,
  scanMcpServer,
  hasUnpinnedPackage,
};
