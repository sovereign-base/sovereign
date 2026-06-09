// @ts-check
'use strict';

/**
 * anchor — the zero-dependency external-doc anchoring substrate for ENG-09 (M4
 * ground truth). The Phase-15 anchor-docs / Phase-16 verify-self skills stay thin
 * orchestrators by wrapping this: the engine owns deterministic storage + the
 * staleness math, the skills own the judgment (what to anchor, the copyright
 * warning, when to hard-stop).
 *
 *   - `anchor add --id <slug> --source <url> [--version v] [--date-retrieved d]
 *     [--re-verify-by d] [--content @file|-|<literal>]` → writes
 *     `.sovereign/external-docs/<slug>.md` with a `**key:** value` metadata header
 *     (source/version/date-retrieved/re-verify-by/content-stored). URL-by-default:
 *     the source URL + metadata are always stored; full content ONLY on explicit
 *     `--content` opt-in. `re-verify-by` defaults to date-retrieved + 90 days.
 *     Re-adding the same id overwrites (idempotent update). The slug is sanitized
 *     so it can never escape the external-docs dir.
 *   - `anchor list` → header-parsed array of every anchor (greenfield-safe: [] when
 *     no external-docs/ dir).
 *   - `anchor check` → { anchors, stale_count }, flagging every anchor whose
 *     `re-verify-by` is strictly before today as stale (lexicographic ISO compare,
 *     deterministic from stored dates). Greenfield-safe.
 *
 * The engine NEVER fetches a URL and carries no copyright logic (skill-layer).
 * Header parse reuses readField (state.cjs); emit reuses output() (core.cjs).
 * Zero runtime deps — node: built-ins only (fs, path).
 */

const fs = require('node:fs');
const path = require('node:path');
const { output, error, safeReadFile } = require('./core.cjs');
const { readField } = require('./state.cjs');

const EXTERNAL_DOCS_REL = path.join('.sovereign', 'external-docs');

// ─── Pure helpers ─────────────────────────────────────────────────────────────

/**
 * Sanitize an id into a filesystem-safe slug: lowercase, every char not in
 * [a-z0-9-] becomes `-`, collapse repeats, strip leading/trailing `-`. The result
 * can never contain `/` or `.`, so path.join(dir, slug + '.md') cannot escape dir.
 *
 * @param {string} id
 * @returns {string}
 */
function slugify(id) {
  return String(id)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Today as a zero-padded UTC `YYYY-MM-DD` string (mirrors init.cjs dateStamp,
 * with dashes). `new Date()` is allowed in the engine.
 * @returns {string}
 */
function todayISO() {
  const d = new Date();
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Add `n` days to an ISO `YYYY-MM-DD` date, returning a new ISO string (UTC).
 * @param {string} iso
 * @param {number} n
 * @returns {string}
 */
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Staleness: an anchor is stale when its `re-verify-by` is strictly before today.
 * Lexicographic compare on `YYYY-MM-DD` is identical to chronological order
 * (fixed-width, zero-padded, big-endian) and dodges timezone/parse bugs.
 * Equal-to-today is NOT stale.
 *
 * @param {string | null} reVerifyBy
 * @param {string} today
 * @returns {boolean}
 */
function isStale(reVerifyBy, today) {
  return typeof reVerifyBy === 'string' && reVerifyBy < today;
}

/**
 * Build the `**key:** value` metadata header block (matching readField's pattern),
 * ending in a trailing blank line that separates the header from the optional body.
 *
 * @param {{source: string, version: string, dateRetrieved: string, reVerifyBy: string, contentStored: boolean}} fields
 * @returns {string}
 */
function buildHeader({ source, version, dateRetrieved, reVerifyBy, contentStored }) {
  return [
    `**source:** ${source}`,
    `**version:** ${version}`,
    `**date-retrieved:** ${dateRetrieved}`,
    `**re-verify-by:** ${reVerifyBy}`,
    `**content-stored:** ${contentStored}`,
    '',
  ].join('\n');
}

/**
 * Parse one anchor's metadata header (never the body) into a plain object,
 * reusing readField (state.cjs) — the existing tested `**key:** value` reader.
 *
 * @param {string} id - the slug (filename without `.md`)
 * @param {string} content - the file content
 * @returns {{id: string, source: string|null, version: string|null, date_retrieved: string|null, re_verify_by: string|null, content_stored: boolean}}
 */
function parseAnchor(id, content) {
  return {
    id,
    source: readField(content, 'source'),
    version: readField(content, 'version'),
    date_retrieved: readField(content, 'date-retrieved'),
    re_verify_by: readField(content, 're-verify-by'),
    content_stored: readField(content, 'content-stored') === 'true',
  };
}

/**
 * List every anchor under `.sovereign/external-docs/`, parsed from headers.
 * Greenfield-safe: a missing dir → [] (readdir-in-try, mirroring init.cjs).
 *
 * @param {string} cwd - project root
 * @returns {Array<ReturnType<typeof parseAnchor>>}
 */
function listAnchors(cwd) {
  const dir = path.join(cwd, EXTERNAL_DOCS_REL);
  let names;
  try {
    names = fs.readdirSync(dir);
  } catch {
    return [];
  }
  return names
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((f) => parseAnchor(f.replace(/\.md$/, ''), safeReadFile(path.join(dir, f)) || ''));
}

// ─── Commands ─────────────────────────────────────────────────────────────────

/**
 * `anchor add` — store an external-doc anchor under `.sovereign/external-docs/`.
 *
 * URL-by-default: the source URL + metadata are always stored; the full content
 * body is stored ONLY when `--content` is present (opt-in). `--content` accepts a
 * `@<file>` reference (read via safeReadFile), `-` (stdin, fd 0), or a literal
 * string. Re-adding the same id overwrites. The engine never fetches the URL.
 *
 * @param {string} cwd - project root
 * @param {Record<string, string|boolean|null>} flags - parsed named args
 * @param {boolean} [raw] - emit raw scalar instead of JSON (unused; JSON only)
 * @returns {void}
 */
function cmdAnchorAdd(cwd, flags, raw) {
  if (!flags.source) {
    error('anchor add: --source is required');
  }
  const slug = slugify(String(flags.id || ''));
  if (!slug) {
    error('anchor add: --id is required');
  }

  const dateRetrieved = typeof flags['date-retrieved'] === 'string' ? flags['date-retrieved'] : todayISO();
  const reVerifyBy = typeof flags['re-verify-by'] === 'string' ? flags['re-verify-by'] : addDays(dateRetrieved, 90);
  const version = typeof flags.version === 'string' ? flags.version : 'unknown';

  // Content opt-in: presence of --content IS the opt-in (URL-only otherwise).
  let contentStored = false;
  let body = '';
  if (flags.content !== null && flags.content !== undefined && flags.content !== false) {
    contentStored = true;
    const spec = String(flags.content);
    if (spec.startsWith('@')) {
      const rest = spec.slice(1);
      body = safeReadFile(path.join(cwd, rest)) ?? safeReadFile(rest) ?? '';
    } else if (spec === '-') {
      body = fs.readFileSync(0, 'utf-8');
    } else {
      body = spec;
    }
  }

  const dir = path.join(cwd, EXTERNAL_DOCS_REL);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, slug + '.md');
  const header = buildHeader({
    source: String(flags.source),
    version,
    dateRetrieved,
    reVerifyBy,
    contentStored,
  });
  fs.writeFileSync(file, header + (contentStored ? body : ''), 'utf-8');

  output(
    {
      id: slug,
      source: String(flags.source),
      version,
      date_retrieved: dateRetrieved,
      re_verify_by: reVerifyBy,
      content_stored: contentStored,
      path: path.join(EXTERNAL_DOCS_REL, slug + '.md'),
    },
    raw
  );
}

/**
 * `anchor list` — emit the header-parsed array of anchors, each with a `stale`
 * flag computed against today. Greenfield-safe → []. Array top-level (extractField
 * supports arr[0]/arr[-1] for --pick).
 *
 * @param {string} cwd - project root
 * @param {boolean} [raw] - emit raw scalar instead of JSON (unused; JSON only)
 * @returns {void}
 */
function cmdAnchorList(cwd, raw) {
  const today = todayISO();
  output(
    listAnchors(cwd).map((a) => ({ ...a, stale: isStale(a.re_verify_by, today) })),
    raw
  );
}

/**
 * `anchor check` — emit { anchors, stale_count }, flagging every anchor whose
 * `re-verify-by` is strictly before today as stale. Deterministic from stored
 * dates. Greenfield-safe → { anchors: [], stale_count: 0 }.
 *
 * @param {string} cwd - project root
 * @param {boolean} [raw] - emit raw scalar instead of JSON (unused; JSON only)
 * @returns {void}
 */
function cmdAnchorCheck(cwd, raw) {
  const today = todayISO();
  const anchors = listAnchors(cwd).map((a) => ({ ...a, stale: isStale(a.re_verify_by, today) }));
  const stale_count = anchors.filter((a) => a.stale).length;
  output({ anchors, stale_count }, raw);
}

module.exports = {
  cmdAnchorAdd,
  cmdAnchorList,
  cmdAnchorCheck,
  slugify,
  addDays,
  isStale,
  todayISO,
  buildHeader,
  parseAnchor,
  listAnchors,
};
