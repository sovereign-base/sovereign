#!/usr/bin/env node
// @ts-check
'use strict';

/**
 * sovereign-tools — the SOVEREIGN engine.
 *
 * Zero-dependency CommonJS CLI (ADR-002, ADR-009). The source IS the artifact:
 * no build step, no runtime dependencies, native process.argv parsing.
 *
 * This file is engine layer A (plan 01-02): the deterministic router + arg
 * helpers + extractField + the --cwd/--raw/--pick flags. The only working
 * command is `version`; every other command returns a not_implemented stub.
 * Plans 01-03 (state|gate|commit|resolve-model|model|validate) and 01-04 (init)
 * fill the marked switch insertion points.
 *
 * Usage:
 *   sovereign-tools <command> [args] [--raw] [--pick <field>] [--cwd <path>]
 */

const fs = require('node:fs');
const path = require('node:path');

const { output, error, findProjectRoot } = require('./lib/core.cjs');
const { cmdStateLoad, cmdStatePatch } = require('./lib/state.cjs');
const { cmdGateOpen, cmdGatePass } = require('./lib/gate.cjs');

// ─── Arg parsing helpers ──────────────────────────────────────────────────────

/**
 * Parse named flags from an argument list.
 *
 * Value flags consume the following token (unless it's another --flag);
 * boolean flags are true when present.
 *
 *   parseNamedArgs(args, ['phase', 'plan'])        → { phase: '3', plan: '1' }
 *   parseNamedArgs(args, [], ['amend', 'force'])    → { amend: true, force: false }
 *
 * @param {string[]} args
 * @param {string[]} [valueFlags]
 * @param {string[]} [booleanFlags]
 * @returns {Record<string, string | boolean | null>}
 */
function parseNamedArgs(args, valueFlags = [], booleanFlags = []) {
  /** @type {Record<string, string | boolean | null>} */
  const result = {};
  for (const flag of valueFlags) {
    const idx = args.indexOf(`--${flag}`);
    result[flag] = idx !== -1 && args[idx + 1] !== undefined && !args[idx + 1].startsWith('--')
      ? args[idx + 1]
      : null;
  }
  for (const flag of booleanFlags) {
    result[flag] = args.includes(`--${flag}`);
  }
  return result;
}

/**
 * Collect all tokens after --flag until the next --flag or end of args.
 * Handles multi-word values like `--name Foo Bar Version 1`.
 * Returns null if the flag is absent.
 *
 * @param {string[]} args
 * @param {string} flag
 * @returns {string | null}
 */
function parseMultiwordArg(args, flag) {
  const idx = args.indexOf(`--${flag}`);
  if (idx === -1) return null;
  const tokens = [];
  for (let i = idx + 1; i < args.length; i++) {
    if (args[i].startsWith('--')) break;
    tokens.push(args[i]);
  }
  return tokens.length > 0 ? tokens.join(' ') : null;
}

/**
 * Parse repeatable `--field NAME --value V` pairs in argument order into a
 * patches array. A `--field` opens a pair; the next `--value` closes it. Used by
 * `state save|patch` so multiple fields can be patched in one call.
 *
 *   parseFieldValuePairs(['--field','Phase','--value','2','--field','Status','--value','Done'])
 *     → [{field:'Phase',value:'2'}, {field:'Status',value:'Done'}]
 *
 * @param {string[]} args
 * @returns {Array<{field: string, value: string}>}
 */
function parseFieldValuePairs(args) {
  /** @type {Array<{field: string, value: string}>} */
  const pairs = [];
  let field = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--field') {
      field = args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[++i] : null;
    } else if (args[i] === '--value' && field !== null) {
      const value = args[i + 1] !== undefined && !args[i + 1].startsWith('--') ? args[++i] : '';
      pairs.push({ field, value });
      field = null;
    }
  }
  return pairs;
}

/**
 * Extract a field from an object using dot-notation and bracket syntax.
 * Supports: 'field', 'parent.child', 'arr[-1]', 'arr[0]', 'a.b[0].c'.
 *
 * @param {*} obj
 * @param {string} fieldPath
 * @returns {*}
 */
function extractField(obj, fieldPath) {
  const parts = fieldPath.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    const bracketMatch = part.match(/^(.+?)\[(-?\d+)]$/);
    if (bracketMatch) {
      const key = bracketMatch[1];
      const index = parseInt(bracketMatch[2], 10);
      current = current[key];
      if (!Array.isArray(current)) return undefined;
      current = index < 0 ? current[current.length + index] : current[index];
    } else {
      current = current[part];
    }
  }
  return current;
}

// ─── CLI Router ───────────────────────────────────────────────────────────────

/**
 * Entry point. Resolves --cwd/--raw/--pick, finds the project root, then
 * dispatches to runCommand. When --pick is set, intercepts stdout so the chosen
 * field is extracted (handling @file: spill) and emitted as a raw scalar.
 * @returns {Promise<void>}
 */
async function main() {
  const args = process.argv.slice(2);

  // Optional --cwd override for sandboxed subagents running outside project root.
  let cwd = process.cwd();
  const cwdEqArg = args.find((arg) => arg.startsWith('--cwd='));
  const cwdIdx = args.indexOf('--cwd');
  if (cwdEqArg) {
    const value = cwdEqArg.slice('--cwd='.length).trim();
    if (!value) error('Missing value for --cwd');
    args.splice(args.indexOf(cwdEqArg), 1);
    cwd = path.resolve(value);
  } else if (cwdIdx !== -1) {
    const value = args[cwdIdx + 1];
    if (!value || value.startsWith('--')) error('Missing value for --cwd');
    args.splice(cwdIdx, 2);
    cwd = path.resolve(value);
  }

  if (!fs.existsSync(cwd) || !fs.statSync(cwd).isDirectory()) {
    error(`Invalid --cwd: ${cwd}`);
  }

  // --raw boolean.
  const rawIndex = args.indexOf('--raw');
  const raw = rawIndex !== -1;
  if (rawIndex !== -1) args.splice(rawIndex, 1);

  // --pick <field>: extract a single field from the JSON output (dot + bracket).
  const pickIdx = args.indexOf('--pick');
  let pickField = null;
  if (pickIdx !== -1) {
    pickField = args[pickIdx + 1];
    if (!pickField || pickField.startsWith('--')) error('Missing value for --pick');
    args.splice(pickIdx, 2);
  }

  // Resolve project root (nearest ancestor with .sovereign/); fallback to cwd.
  const root = findProjectRoot(cwd);

  const command = args[0];
  if (!command) {
    error(
      'Usage: sovereign-tools <command> [args] [--raw] [--pick <field>] [--cwd <path>]\n' +
        'Commands: version, state (load|save|patch), gate (open|pass) ' +
        '(commit, resolve-model, model, validate, init — plan 04)'
    );
  }

  // When --pick is active, intercept stdout to extract the requested field.
  // Handles @file: spill by reading the tmpfile back before parsing.
  if (pickField) {
    const origWriteSync = fs.writeSync;
    const chunks = [];
    // @ts-ignore — intentional monkeypatch of fs.writeSync to capture fd 1.
    fs.writeSync = function (fd, data, ...rest) {
      if (fd === 1) { chunks.push(String(data)); return; }
      return origWriteSync.call(fs, fd, data, ...rest);
    };
    const cleanup = () => {
      fs.writeSync = origWriteSync;
      const captured = chunks.join('');
      let jsonStr = captured;
      if (jsonStr.startsWith('@file:')) {
        jsonStr = fs.readFileSync(jsonStr.slice('@file:'.length), 'utf-8');
      }
      try {
        const obj = JSON.parse(jsonStr);
        const value = extractField(obj, pickField);
        const result = value === null || value === undefined ? '' : String(value);
        origWriteSync.call(fs, 1, result);
      } catch {
        origWriteSync.call(fs, 1, captured);
      }
    };
    try {
      await runCommand(command, args, root, true, pickField);
      cleanup();
    } catch (e) {
      fs.writeSync = origWriteSync;
      throw e;
    }
    return;
  }

  await runCommand(command, args, root, raw, null);
}

/**
 * Dispatch a command. Only `version` is implemented in plan 01-02; everything
 * else returns a not_implemented stub. Plans 03/04 add the real cases at the
 * marked insertion points below.
 *
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd - resolved project root
 * @param {boolean} raw
 * @param {string | null} pick
 * @returns {Promise<void>}
 */
async function runCommand(command, args, cwd, raw, pick) {
  switch (command) {
    case 'version': {
      const version = fs
        .readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8')
        .trim();
      output({ version }, raw, version);
      break;
    }

    case 'state': {
      const sub = args[1];
      if (sub === 'load') {
        cmdStateLoad(cwd, raw);
      } else if (sub === 'save' || sub === 'patch') {
        // Parse positional --field NAME --value V pairs (repeatable, in order).
        const patches = parseFieldValuePairs(args.slice(2));
        if (patches.length === 0) error('state patch: at least one --field/--value pair required');
        cmdStatePatch(cwd, patches, raw);
      } else {
        error(`Unknown state subcommand: ${sub || '(none)'} (expected load|save|patch)`);
      }
      break;
    }

    case 'gate': {
      const sub = args[1];
      const phase = args[2] && !args[2].startsWith('--') ? args[2] : null;
      if (sub === 'open') {
        cmdGateOpen(cwd, phase, raw);
      } else if (sub === 'pass') {
        cmdGatePass(cwd, phase, raw);
      } else {
        error(`Unknown gate subcommand: ${sub || '(none)'} (expected open|pass)`);
      }
      break;
    }

    // TODO(plan 04): init
    // TODO(plan 04): commit|resolve-model|model|validate

    default: {
      output({ command, status: 'not_implemented' }, raw, null);
      break;
    }
  }
}

if (require.main === module) {
  main().catch((e) => error(e && e.message ? e.message : String(e)));
}

module.exports = { main, runCommand, parseNamedArgs, parseMultiwordArg, parseFieldValuePairs, extractField };
