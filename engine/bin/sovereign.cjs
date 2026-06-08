#!/usr/bin/env node
// @ts-check
'use strict';

/**
 * sovereign — the user-facing launcher / installer entry point (`npx sovereign`).
 *
 * Zero-dependency CommonJS (ADR-002, ADR-009). As of plan 02-01 this is the REAL
 * installer (no longer a Phase-1 stub): `npx sovereign init [--quick|--full|--global]`
 * copies SOVEREIGN's packaged skills + agents into `.claude/` (or `~/.claude/`
 * with --global) and scaffolds `.sovereign/` from the shipped templates,
 * idempotently and version-aware.
 *
 * Commands:
 *   init [--quick|--full|--global]   install / update SOVEREIGN into the project
 *   --version | version              print `sovereign v<VERSION>`
 *   (no command)                     print the version banner
 *
 * The engine back door is `sovereign-tools` (machine-called by skills); this is
 * the human front door. Both bins stay zero-dependency.
 */

const fs = require('node:fs');
const path = require('node:path');

const { error } = require('./lib/core.cjs');
const { cmdInstall } = require('./lib/install.cjs');

/** @returns {string} */
function readVersion() {
  return fs.readFileSync(path.join(__dirname, '..', 'VERSION'), 'utf8').trim();
}

function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init') {
    const quick = args.includes('--quick');
    const full = args.includes('--full');
    const global = args.includes('--global');
    // Honor --cwd <dir> like the engine bin does, so the install target is
    // scriptable/testable; default to the real working directory.
    const cwdIdx = args.indexOf('--cwd');
    const cwd = cwdIdx !== -1 && args[cwdIdx + 1] ? args[cwdIdx + 1] : process.cwd();
    cmdInstall(cwd, { quick, full, global }, false);
    return;
  }

  if (command === undefined || command === '--version' || command === 'version') {
    fs.writeSync(1, `sovereign v${readVersion()}\n`);
    return;
  }

  error(`Unknown command: ${command} (expected: init [--quick|--full|--global])`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
