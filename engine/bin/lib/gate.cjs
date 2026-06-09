// @ts-check
'use strict';

/**
 * gate — append-only phase gates (engine layer B, plan 01-03).
 *
 * Phase gates are an audit trail: `gate open <n>` and `gate pass <n>` APPEND a
 * record to .sovereign/SOVEREIGN.md and never overwrite existing entries (the
 * Phase Gate Log is append-only). GSD has no gate primitive — this is net-new.
 *
 * Exports:
 *   gateOpen(cwd, phase)            — append an OPENED record; returns status
 *   gatePass(cwd, phase)            — append a PASSED record; returns status
 *   cmdGateOpen(cwd, phase, raw)    — CLI: error() on missing phase, then output()
 *   cmdGatePass(cwd, phase, raw)    — CLI: error() on missing phase, then output()
 */

const fs = require('node:fs');
const path = require('node:path');

const { output, error } = require('./core.cjs');

/** @param {string} cwd @returns {string} */
function sovereignPath(cwd) {
  return path.join(cwd, '.sovereign', 'SOVEREIGN.md');
}

/**
 * Append a gate record block to SOVEREIGN.md (append-only; prior content
 * untouched).
 * @param {string} cwd
 * @param {string} phase
 * @param {'OPENED' | 'PASSED'} verb
 * @returns {void}
 */
function appendGate(cwd, phase, verb) {
  const block = `\n### Gate: Phase ${phase} — ${verb} ${new Date().toISOString()}\n`;
  fs.appendFileSync(sovereignPath(cwd), block);
}

/**
 * @param {string} cwd
 * @param {string} phase
 * @returns {{gate: string, phase: string, appended: boolean}}
 */
function gateOpen(cwd, phase) {
  appendGate(cwd, phase, 'OPENED');
  return { gate: 'open', phase, appended: true };
}

/**
 * @param {string} cwd
 * @param {string} phase
 * @returns {{gate: string, phase: string, appended: boolean}}
 */
function gatePass(cwd, phase) {
  appendGate(cwd, phase, 'PASSED');
  return { gate: 'pass', phase, appended: true };
}

/**
 * @param {string} cwd
 * @param {string} phase
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdGateOpen(cwd, phase, raw) {
  if (!phase) error('gate open: phase required');
  output(gateOpen(cwd, phase), raw);
}

/**
 * @param {string} cwd
 * @param {string} phase
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdGatePass(cwd, phase, raw) {
  if (!phase) error('gate pass: phase required');
  output(gatePass(cwd, phase), raw);
}

module.exports = { gateOpen, gatePass, cmdGateOpen, cmdGatePass };
