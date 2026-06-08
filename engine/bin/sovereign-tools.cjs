#!/usr/bin/env node

/**
 * sovereign-tools — the SOVEREIGN engine.
 *
 * Zero-dependency CommonJS CLI (ADR-002, ADR-009). The source IS the artifact:
 * no build step, no runtime dependencies, native process.argv parsing.
 *
 * This file is a STUB in plan 01-01. It exists to wire the bin entry, prove the
 * shebang + CJS load via the smoke test, and reserve the entry point that plans
 * 01-02..01-04 fill in with the real switch router (init, state, gate, commit,
 * model, validate, ...).
 *
 * Usage (stub):
 *   sovereign-tools version    -> prints the contents of ../VERSION
 *   sovereign-tools <other>    -> {"error":"not implemented","command":"<other>"}
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Minimal stub entry point. Replaced by the real router in plans 01-02..01-04.
 */
function main() {
  const argv = process.argv.slice(2);
  const command = argv[0];

  if (command === 'version') {
    const versionPath = path.join(__dirname, '..', 'VERSION');
    const version = fs.readFileSync(versionPath, 'utf8').trim();
    fs.writeSync(1, version + '\n');
    return;
  }

  fs.writeSync(
    1,
    JSON.stringify({ error: 'not implemented', command: command ?? null }) + '\n'
  );
}

if (require.main === module) {
  main();
}

module.exports = { main };
