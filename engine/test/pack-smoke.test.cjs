'use strict';

/**
 * npm pack clean-install smoke test (ENG-06 distribution DoD).
 *
 * Proves the engine ships and runs correctly from a real package tarball — the
 * only way to catch shebang/bin-path/files-allowlist/CJS regressions that
 * `node --test` against the source tree silently passes. Deliberately uses
 * `npm pack` + install of the tarball in a FRESH temp dir, never `npm link`
 * (which symlinks the source and hides packaging bugs — see PITFALLS.md #7).
 *
 * Flow: npm pack -> mkdtemp -> npm install <tarball> -> run the installed
 * `sovereign-tools init council` -> assert valid nested blob + shipped shebang
 * + shipped templates -> clean up. Skips (does not fail) if npm is unavailable.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ENGINE_ROOT = path.join(__dirname, '..');

function hasNpm() {
  try {
    execFileSync('npm', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

test('npm pack clean-install runs `sovereign-tools init council` end-to-end', { timeout: 120000 }, (t) => {
  if (!hasNpm()) {
    t.skip('npm not available in this environment');
    return;
  }

  let tarball;
  let tmpDir;
  try {
    // 1. Pack the engine into a tarball (capture the emitted filename).
    const packOut = execFileSync('npm', ['pack', '--silent'], {
      cwd: ENGINE_ROOT,
      encoding: 'utf8',
    }).trim();
    // npm pack may print one line per file in some versions; the tarball is the last token.
    const tarballName = packOut.split(/\s+/).filter(Boolean).pop();
    tarball = path.join(ENGINE_ROOT, tarballName);
    assert.ok(fs.existsSync(tarball), `expected tarball at ${tarball}`);

    // 2. Install the tarball into a fresh temp dir (exercises bin wiring + files allowlist + engines).
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sovereign-pack-'));
    fs.writeFileSync(path.join(tmpDir, 'package.json'), JSON.stringify({ name: 'pack-smoke-host', private: true }) + '\n');
    execFileSync('npm', ['install', tarball, '--silent', '--no-audit', '--no-fund'], {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    const installedPkg = path.join(tmpDir, 'node_modules', 'sovereign-cli');
    const installedBin = path.join(installedPkg, 'bin', 'sovereign-tools.cjs');

    // 3. A SOVEREIGN project to orient against (scaffold from the shipped templates).
    const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sovereign-proj-'));
    fs.mkdirSync(path.join(projectDir, '.sovereign'), { recursive: true });
    execFileSync('cp', ['-R', path.join(installedPkg, 'templates', 'sovereign') + '/.', path.join(projectDir, '.sovereign') + '/']);

    // Run the INSTALLED bin (not the source) — proves shebang + bin path + CJS resolve.
    const out = execFileSync('node', [installedBin, 'init', 'council', '--cwd', projectDir], {
      encoding: 'utf8',
    });
    const blob = JSON.parse(out.startsWith('@file:') ? fs.readFileSync(out.slice('@file:'.length).trim(), 'utf8') : out);

    // 4a. The nested init contract is intact.
    assert.equal(blob.sovereign_version, '2.0.0');
    assert.ok(blob.models && typeof blob.models.advisor === 'string', 'models.advisor present');
    assert.ok(blob.context_injection && blob.context_injection.manifest_path, 'context_injection present');
    assert.ok(blob.paths && blob.paths.council_dir, 'paths present');
    assert.equal(typeof blob.agents_installed, 'boolean');

    // 4b. The shebang shipped on the installed bin.
    const firstLine = fs.readFileSync(installedBin, 'utf8').split('\n')[0];
    assert.equal(firstLine, '#!/usr/bin/env node', `expected shebang, got ${JSON.stringify(firstLine)}`);

    // 4c. The files allowlist shipped the templates.
    assert.ok(
      fs.existsSync(path.join(installedPkg, 'templates', 'sovereign', 'STATE.md')),
      'templates/sovereign/STATE.md must ship in the package'
    );

    fs.rmSync(projectDir, { recursive: true, force: true });
  } finally {
    // 5. Cleanup.
    if (tmpDir) fs.rmSync(tmpDir, { recursive: true, force: true });
    if (tarball && fs.existsSync(tarball)) fs.rmSync(tarball, { force: true });
  }
});
