#!/usr/bin/env node
// @ts-check
'use strict';

/**
 * sovereign — the user-facing launcher / installer (`npx sovereign-cli`).
 *
 * Zero-dependency CommonJS (ADR-002, ADR-009). This is the HUMAN front door:
 * it prints friendly, readable output and (when run on a TTY with no mode flag)
 * asks whether to install Quick / Full / Adopt. The machine front door is
 * `sovereign-tools` (JSON contract for skills) — kept separate on purpose.
 *
 * Commands:
 *   init [--quick|--full|--adopt] [--global] [--json] [-y] [--cwd <dir>]
 *        install / update SOVEREIGN into the project (interactive if no mode + TTY)
 *   --version | version              print the version
 *   --help | help | (no command)     print usage
 *
 * `--json` keeps the raw machine-readable install result (for scripting/CI).
 */

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

const { error } = require('./lib/core.cjs');
const { runInstall, FAST_LANE } = require('./lib/install.cjs');

const PKG_ROOT = path.join(__dirname, '..');

/** @returns {string} */
function readVersion() {
  return fs.readFileSync(path.join(PKG_ROOT, 'VERSION'), 'utf8').trim();
}

/** Write a line to stdout (kept tiny + dependency-free). @param {string} [s] */
function say(s) {
  fs.writeSync(1, (s || '') + '\n');
}

/**
 * Ask the user to choose an install mode on an interactive terminal.
 * Returns 'quick' | 'full' | 'adopt'. Zero-dep via node:readline.
 * @returns {Promise<'quick'|'full'|'adopt'>}
 */
function promptMode() {
  return new Promise((resolve) => {
    say('');
    say('  \x1b[1m✦ SOVEREIGN\x1b[0m — set up this project');
    say('');
    say('  How do you want to start?');
    say('    \x1b[1m1) Quick\x1b[0m  — the 5 daily-use Fast Lane skills (fastest)');
    say('    \x1b[1m2) Full\x1b[0m   — everything: Council + architecture + adoption  \x1b[2m(recommended)\x1b[0m');
    say('    \x1b[1m3) Adopt\x1b[0m  — I already have code; retrofit SOVEREIGN onto it');
    say('');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('  Choose 1, 2, or 3 [2]: ', (ans) => {
      rl.close();
      const c = (ans || '').trim();
      resolve(c === '1' ? 'quick' : c === '3' ? 'adopt' : 'full');
    });
  });
}

/**
 * Render the install result as a friendly, readable summary + next steps.
 * @param {import('./lib/install.cjs').InstallResult & {adopt?: boolean}} r
 */
function renderHuman(r) {
  const where = r.target === 'global' ? '~/.claude' : './.claude';
  const nSkills = r.skills_copied.length;
  const nAgents = r.agents_copied.length;
  say('');
  say(`  \x1b[1m✦ SOVEREIGN\x1b[0m  v${r.installed_version}`);
  say('');
  if (r.status === 'up_to_date') {
    say(`  \x1b[32m✓\x1b[0m Already up to date — ${nSkills} skills + ${nAgents} agents in ${where}`);
  } else if (r.status === 'updated') {
    say(`  \x1b[32m✓\x1b[0m Updated ${r.previous_version} → ${r.installed_version}  (${r.mode})`);
    say(`    ${nSkills} skills + ${nAgents} agents in ${where}`);
  } else {
    say(`  \x1b[32m✓\x1b[0m Installed (${r.mode}) — ${nSkills} skills + ${nAgents} agents → ${where}`);
  }
  if (r.sovereign_scaffolded) {
    say(`  \x1b[32m✓\x1b[0m Scaffolded \x1b[1m.sovereign/\x1b[0m — your project's engineering memory (commit it)`);
  } else {
    say(`  \x1b[2m·\x1b[0m .sovereign/ already present — left untouched`);
  }
  if (nSkills) {
    const shown = r.skills_copied.slice(0, 6).join(', ');
    const more = nSkills > 6 ? `, +${nSkills - 6} more` : '';
    say('');
    say(`  \x1b[2mSkills ready:\x1b[0m ${shown}${more}`);
  }
  say('');
  say('  \x1b[1m▶ Next steps\x1b[0m');
  if (r.adopt) {
    say('    You have existing code — start by retrofitting:');
    say('      \x1b[36m/sovereign-adopt\x1b[0m   reverse-engineer decisions + scaffold a roadmap');
    say('    then work down the gaps it finds (e.g. /security-design, /entity-design).');
  } else {
    say('    Starting fresh? Pick where you are:');
    say('      \x1b[36m/council\x1b[0m            pressure-test a big "should we build this?" decision');
    say('      \x1b[36m/ubiquitous-language\x1b[0m lock your domain vocabulary first');
    say('      \x1b[36m/grill-with-docs\x1b[0m     sharpen a plan before you build');
    say('      \x1b[36m/tdd\x1b[0m → \x1b[36m/sentinel\x1b[0m    build it, then review it');
    say('    Already have code? run \x1b[36m/sovereign-adopt\x1b[0m instead.');
  }
  say('');
  say('  \x1b[2mDocs: https://github.com/sovereign-base/sovereign  ·  these skills run inside your agent (Claude Code & SKILL.md-compatible tools).\x1b[0m');
  say('');
}

function usage() {
  const v = readVersion();
  say('');
  say(`  \x1b[1m✦ SOVEREIGN\x1b[0m  v${v} — the engineering system for agents and the humans who work with them`);
  say('');
  say('  \x1b[1mUsage\x1b[0m');
  say('    npx sovereign-cli init                 install (asks Quick / Full / Adopt)');
  say('    npx sovereign-cli init --quick         the 5 Fast Lane skills only');
  say('    npx sovereign-cli init --full          everything (default)');
  say('    npx sovereign-cli init --adopt         full install, geared to existing code');
  say('    npx sovereign-cli init --global        install to ~/.claude instead of ./.claude');
  say('    npx sovereign-cli init --json          raw machine-readable result (scripting/CI)');
  say('    npx sovereign-cli --version');
  say('');
  say('  After install, the skills run \x1b[1minside your agent\x1b[0m (e.g. /council, /tdd).');
  say('  \x1b[2mIn Claude Code, type /skill-name; in other SKILL.md agents (Gemini CLI, …), open the\x1b[0m');
  say('  \x1b[2mskill\x27s SKILL.md under .claude/skills/ and invoke it by name.\x1b[0m See the docs:');
  say('  https://github.com/sovereign-base/sovereign');
  say('');
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === 'init') {
    const has = (f) => args.includes(f);
    const cwdIdx = args.indexOf('--cwd');
    const cwd = cwdIdx !== -1 && args[cwdIdx + 1] ? args[cwdIdx + 1] : process.cwd();
    const target = has('--global') ? 'global' : 'project';
    const json = has('--json');
    const yes = has('-y') || has('--yes');

    // Resolve mode. Explicit flag wins; --adopt = full install + adopt-oriented
    // next steps. With no mode flag on an interactive TTY (and not -y/--json),
    // ask. Otherwise default to full (CI/non-TTY safe — never hangs).
    let mode = has('--quick') ? 'quick' : has('--full') || has('--adopt') ? 'full' : null;
    let adopt = has('--adopt');
    if (mode === null) {
      if (process.stdin.isTTY && !yes && !json) {
        const choice = await promptMode();
        mode = choice === 'quick' ? 'quick' : 'full';
        adopt = choice === 'adopt';
      } else {
        mode = 'full';
      }
    }

    let result;
    try {
      result = runInstall({ cwd, target, mode, packageRoot: PKG_ROOT });
    } catch (err) {
      error('install failed: ' + (err && err.message ? err.message : String(err)));
      return;
    }

    if (json) {
      fs.writeSync(1, JSON.stringify(result, null, 2) + '\n');
    } else {
      renderHuman({ ...result, adopt });
    }
    return;
  }

  if (command === '--version' || command === 'version') {
    say(`sovereign-cli v${readVersion()}`);
    return;
  }

  if (command === undefined || command === '--help' || command === 'help') {
    usage();
    return;
  }

  error(`Unknown command: ${command}\nRun \`npx sovereign-cli --help\` for usage.`);
}

if (require.main === module) {
  main();
}

module.exports = { main };
