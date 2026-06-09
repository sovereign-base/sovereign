// @ts-check
'use strict';

/**
 * bridge — the zero-dependency SHA-256 hashing + registry-diff substrate for
 * BRIDGE-02 staleness detection. The Phase-11 bridge skill stays a thin
 * orchestrator by wrapping this: the engine owns the deterministic
 * hashing/diff, the skill owns the BRIDGE.md prose.
 *
 *   - `bridge hash --files a b c` → per-file SHA-256 (node:crypto) plus a single
 *     combined hash (hash of the sorted `path:sha256` lines) for fast equality.
 *     Output shape: { files: [{path, sha256}], combined }.
 *   - `bridge check [--id <bridge-id>]` → reads `.sovereign/bridges/registry.json`,
 *     recomputes hashes for a recorded bridge's source set, diffs, and reports
 *     { fresh, changed } (or { fresh:true, changed:[], reason:'no_registry' } on a
 *     greenfield project with no registry yet).
 *
 * Greenfield-safe: never throws on a missing registry or missing source files.
 * Zero runtime deps — node: built-ins only (crypto, fs, path).
 */

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { output, safeReadFile } = require('./core.cjs');

const REGISTRY_REL = path.join('.sovereign', 'bridges', 'registry.json');

/**
 * SHA-256 of a file's bytes (not utf-8) for stable, encoding-independent hashing.
 *
 * @param {string} absPath - absolute path to the file
 * @returns {string} 64-char lowercase hex digest
 */
function hashFile(absPath) {
  return crypto.createHash('sha256').update(fs.readFileSync(absPath)).digest('hex');
}

/**
 * Hash a set of source files (by repo-relative path) into per-file digests plus
 * a combined manifest hash. Filters to existing files and sorts by relative path
 * so the combined hash is independent of input order. Never throws.
 *
 * @param {string} cwd - project root
 * @param {string[]} relPaths - repo-relative source paths
 * @returns {{ entries: {path: string, sha256: string}[], combined: string }}
 */
function hashSources(cwd, relPaths) {
  const files = (relPaths || [])
    .map((rel) => ({ rel, abs: path.join(cwd, rel) }))
    .filter((f) => {
      try {
        return fs.existsSync(f.abs) && fs.statSync(f.abs).isFile();
      } catch {
        return false;
      }
    })
    .sort((a, b) => a.rel.localeCompare(b.rel));

  const entries = files.map((f) => ({ path: f.rel, sha256: hashFile(f.abs) }));
  const combined = crypto
    .createHash('sha256')
    .update(entries.map((e) => `${e.path}:${e.sha256}`).join('\n'))
    .digest('hex');
  return { entries, combined };
}

/**
 * `bridge hash` — emit per-file SHA-256 + combined hash for the given files.
 * Empty/nonexistent list → { files: [], combined: <sha256 of ''> } (stable).
 *
 * @param {string} cwd - project root
 * @param {string[] | null} files - repo-relative source paths
 * @param {boolean} [raw] - emit raw scalar instead of JSON (unused; JSON only)
 * @returns {void}
 */
function cmdBridgeHash(cwd, files, raw) {
  const { entries, combined } = hashSources(cwd, files || []);
  output({ files: entries, combined }, raw);
}

/**
 * `bridge check` — diff the recorded bridge source hashes against the current
 * working tree. Greenfield-safe: a missing/unparseable registry returns
 * { fresh:true, changed:[], reason:'no_registry' }.
 *
 * @param {string} cwd - project root
 * @param {string | null} bridgeId - which registry entry to check; null → the
 *   single (or first) entry
 * @param {boolean} [raw] - emit raw scalar instead of JSON (unused; JSON only)
 * @returns {void}
 */
function cmdBridgeCheck(cwd, bridgeId, raw) {
  const text = safeReadFile(path.join(cwd, REGISTRY_REL));
  /** @type {Record<string, any> | null} */
  let registry = null;
  if (text !== null) {
    try {
      registry = JSON.parse(text);
    } catch {
      registry = null;
    }
  }

  const ids = registry && typeof registry === 'object' ? Object.keys(registry) : [];
  if (!registry || ids.length === 0) {
    output({ fresh: true, changed: [], reason: 'no_registry' }, raw);
    return;
  }

  const id = bridgeId && registry[bridgeId] ? bridgeId : ids[0];
  const entry = registry[id] || {};
  const recorded = Array.isArray(entry.sources_hashed) ? entry.sources_hashed : [];
  const recordedPaths = recorded.map((s) => s && s.path).filter(Boolean);

  const { entries, combined } = hashSources(cwd, recordedPaths);

  // Fast path: combined hashes match → nothing changed.
  if (entry.combined_hash && combined === entry.combined_hash) {
    output({ fresh: true, changed: [], id }, raw);
    return;
  }

  // Per-file diff: recorded sha256 vs recomputed; flag missing recorded sources too.
  const current = new Map(entries.map((e) => [e.path, e.sha256]));
  const changed = [];
  for (const src of recorded) {
    if (!src || !src.path) continue;
    const now = current.get(src.path);
    if (now === undefined || now !== src.sha256) {
      changed.push(src.path);
    }
  }

  const fresh = changed.length === 0 && (!entry.combined_hash || combined === entry.combined_hash);
  output({ fresh, changed, id }, raw);
}

module.exports = {
  cmdBridgeHash,
  cmdBridgeCheck,
  hashSources,
  hashFile,
};
