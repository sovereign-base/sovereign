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

module.exports = {
  sanitizeForPrompt,
};
