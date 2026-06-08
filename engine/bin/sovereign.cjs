#!/usr/bin/env node

/**
 * sovereign — the user-facing launcher / installer entry point.
 *
 * Zero-dependency CommonJS (ADR-002, ADR-009). This is a STUB in plan 01-01:
 * it only wires the bin entry. The real `npx sovereign init [--quick|--full]`
 * bootstrap is delivered by the `sovereign-init` SKILL in Phase 2.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

function main() {
  const versionPath = path.join(__dirname, '..', 'VERSION');
  const version = fs.readFileSync(versionPath, 'utf8').trim();
  fs.writeSync(1, `sovereign v${version} — installer is Phase 2\n`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
