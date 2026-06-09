'use strict';

/**
 * Smoke test for the engine bin entry.
 *
 * Proves the shebang + CommonJS load + bin path resolution work BEFORE any real
 * command exists. Spawns `node bin/sovereign-tools.cjs version` and asserts the
 * output carries the version string from ../VERSION (2.0.0 in plan 01-01).
 *
 * Plans 01-02..01-05 add the real unit/integration suite (arg parsing,
 * extractField, @file: spill, config merge, model resolution, field patch,
 * MANIFEST regen, gate append, commit gating, validate-skills).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');
const EXPECTED_VERSION = require("node:fs").readFileSync(require("node:path").join(__dirname, "..", "VERSION"), "utf8").trim();

const ENGINE_ROOT = path.join(__dirname, '..');
const TOOLS_BIN = path.join(ENGINE_ROOT, 'bin', 'sovereign-tools.cjs');

test('sovereign-tools version loads via shebang/CJS bin and prints the version', () => {
  const stdout = execFileSync('node', [TOOLS_BIN, 'version'], {
    cwd: ENGINE_ROOT,
    encoding: 'utf8',
  });
  assert.ok(
    stdout.includes(EXPECTED_VERSION),
    `expected version output to include 2.0.0, got: ${JSON.stringify(stdout)}`
  );
});
