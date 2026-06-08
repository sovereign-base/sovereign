// @ts-check
'use strict';

/**
 * state — STATE.md load + field-level patch (engine layer B, plan 01-03).
 *
 * The context-reset survival layer: a fresh agent re-orients from disk because
 * the engine keeps STATE.md current (field-level `**Field:** value` patches, never
 * a whole-file rewrite) and re-derives MANIFEST.md on every save. STATE.md is the
 * authoritative, field-patchable source; MANIFEST.md is the engine-derived view
 * (ADR-012) regenerated here after each patch.
 *
 * Field patching lifts GSD's stateReplaceField verbatim (bold `**Field:**` first,
 * then plain `Field:`), retargeted from .planning/ to .sovereign/.
 *
 * Exports:
 *   stateReplaceField(content, field, value)  — patched content or null if absent
 *   loadState(cwd)                            — pure: {config, state_raw, manifest_raw, *_exists}
 *   patchState(cwd, patches)                  — pure: applies patches + regenerates MANIFEST
 *   cmdStateLoad(cwd, raw)                    — CLI: output(loadState(...))
 *   cmdStatePatch(cwd, patches, raw)          — CLI: output(patchState(...))
 */

const fs = require('node:fs');
const path = require('node:path');

const { output, loadConfig, safeReadFile } = require('./core.cjs');

// ─── Regex helpers ────────────────────────────────────────────────────────────

/**
 * Escape a string for safe use as a literal inside a RegExp.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Replace a STATE.md field's value, trying the `**Field:**` bold pattern first,
 * then the plain `Field:` pattern. Returns the patched content, or null if the
 * field is absent (the caller leaves the file unchanged). Lifted from GSD's
 * stateReplaceField.
 *
 * @param {string} content
 * @param {string} fieldName
 * @param {string} newValue
 * @returns {string | null}
 */
function stateReplaceField(content, fieldName, newValue) {
  const escaped = escapeRegex(fieldName);
  const boldPattern = new RegExp(`(\\*\\*${escaped}:\\*\\*\\s*)(.*)`, 'i');
  if (boldPattern.test(content)) {
    return content.replace(boldPattern, (_match, prefix) => `${prefix}${newValue}`);
  }
  const plainPattern = new RegExp(`(^${escaped}:\\s*)(.*)`, 'im');
  if (plainPattern.test(content)) {
    return content.replace(plainPattern, (_match, prefix) => `${prefix}${newValue}`);
  }
  return null;
}

/**
 * Read a STATE.md field's value (capture group 2 of the patch pattern), trying
 * bold then plain. Returns the trimmed value or null. Used by manifest.cjs.
 *
 * @param {string} content
 * @param {string} fieldName
 * @returns {string | null}
 */
function readField(content, fieldName) {
  const escaped = escapeRegex(fieldName);
  const boldMatch = content.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*(.*)`, 'i'));
  if (boldMatch) return boldMatch[1].trim();
  const plainMatch = content.match(new RegExp(`^${escaped}:\\s*(.*)`, 'im'));
  return plainMatch ? plainMatch[1].trim() : null;
}

// ─── Paths ──────────────────────────────────────────────────────────────────

/** @param {string} cwd @returns {string} */
function statePath(cwd) {
  return path.join(cwd, '.sovereign', 'STATE.md');
}
/** @param {string} cwd @returns {string} */
function manifestPath(cwd) {
  return path.join(cwd, '.sovereign', 'MANIFEST.md');
}
/** @param {string} cwd @returns {string} */
function sovereignPath(cwd) {
  return path.join(cwd, '.sovereign', 'SOVEREIGN.md');
}

// ─── load ─────────────────────────────────────────────────────────────────────

/**
 * Read STATE.md, MANIFEST.md, and the merged config as one blob. Missing files
 * surface as empty strings + `*_exists:false` (never throws) — a fresh project
 * can still orient.
 *
 * @param {string} cwd - project root
 * @returns {{config: Record<string,*>, state_raw: string, manifest_raw: string, state_exists: boolean, manifest_exists: boolean, sovereign_exists: boolean}}
 */
function loadState(cwd) {
  const config = loadConfig(cwd);
  const stateRaw = safeReadFile(statePath(cwd));
  const manifestRaw = safeReadFile(manifestPath(cwd));
  const sovereignRaw = safeReadFile(sovereignPath(cwd));
  return {
    config,
    state_raw: stateRaw || '',
    manifest_raw: manifestRaw || '',
    state_exists: stateRaw !== null,
    manifest_exists: manifestRaw !== null,
    sovereign_exists: sovereignRaw !== null,
  };
}

/**
 * CLI wrapper for loadState.
 * @param {string} cwd
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdStateLoad(cwd, raw) {
  output(loadState(cwd), raw);
}

// ─── patch / save ─────────────────────────────────────────────────────────────

/**
 * Apply field-level patches to STATE.md, then re-derive MANIFEST.md.
 *
 * Each patch is `{field, value}`; absent fields are skipped and recorded as a
 * warning. The file is written back only if at least one field changed. After
 * patching, manifest.cjs#regenerateManifest re-derives MANIFEST.md (the one place
 * SOVEREIGN extends GSD — MANIFEST always reflects the latest authoritative state).
 *
 * @param {string} cwd - project root
 * @param {Array<{field: string, value: string}>} patches
 * @returns {{patched: number, warnings: string[], manifest_regenerated: boolean}}
 */
function patchState(cwd, patches) {
  const sp = statePath(cwd);
  let content = safeReadFile(sp);
  /** @type {string[]} */
  const warnings = [];
  let patched = 0;

  if (content === null) {
    return { patched: 0, warnings: ['STATE.md not found'], manifest_regenerated: false };
  }

  for (const { field, value } of patches) {
    const next = stateReplaceField(content, field, value);
    if (next === null) {
      warnings.push(`field not found: ${field}`);
    } else {
      content = next;
      patched++;
    }
  }

  if (patched > 0) {
    fs.writeFileSync(sp, content, 'utf-8');
  }

  // Re-derive MANIFEST regardless of patch count so it always reflects disk.
  // Lazy require avoids a load-time cycle (manifest reads STATE, not state.cjs).
  const { regenerateManifest } = require('./manifest.cjs');
  regenerateManifest(cwd);

  return { patched, warnings, manifest_regenerated: true };
}

/**
 * CLI wrapper for patchState. `state save` is an alias of `state patch`.
 * @param {string} cwd
 * @param {Array<{field: string, value: string}>} patches
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdStatePatch(cwd, patches, raw) {
  output(patchState(cwd, patches), raw);
}

module.exports = {
  escapeRegex,
  stateReplaceField,
  readField,
  loadState,
  patchState,
  cmdStateLoad,
  cmdStatePatch,
};
