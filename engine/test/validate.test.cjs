'use strict';

/**
 * Unit suite for engine layer B — validate skills (plan 01-04).
 *
 * Exercises the SKILL.md frontmatter linter:
 *   - valid name + short description → valid:true, no violations
 *   - 'My_Skill' (uppercase + underscore) → name lowercase-hyphen violation
 *   - name containing 'claude'/'anthropic' → reserved-word violation
 *   - name > 64 chars → name-too-long violation
 *   - description > 1024 chars → description-too-long violation
 *   - any violation → process exits non-zero (asserted via child process on the CLI)
 *
 * Uses node:test + node:assert/strict with tmp SKILL.md fixtures (zero deps).
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const { validateSkills } = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'validate.cjs'));
const TOOLS = path.join(ENGINE_ROOT, 'bin', 'sovereign-tools.cjs');

/** Write a SKILL.md with the given frontmatter name/description into a tmp dir. */
function mkSkill(name, description) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sov-skill-'));
  const file = path.join(dir, 'SKILL.md');
  fs.writeFileSync(file, `---\nname: ${name}\ndescription: ${description}\n---\n\n# Body\n`);
  return file;
}

test('valid name + short description passes with no violations', () => {
  const file = mkSkill('council', 'Run a council of advisors.');
  const res = validateSkills(process.cwd(), [file]);
  assert.equal(res.valid, true);
  assert.equal(res.violations.length, 0);
  assert.equal(res.checked, 1);
});

test('uppercase/underscore name flagged as lowercase-hyphen violation', () => {
  const file = mkSkill('My_Skill', 'desc');
  const res = validateSkills(process.cwd(), [file]);
  assert.equal(res.valid, false);
  assert.ok(res.violations.some((v) => v.field === 'name' && /lowercase-hyphen/.test(v.message)));
});

test("name containing 'claude' or 'anthropic' flagged as reserved word", () => {
  const c = validateSkills(process.cwd(), [mkSkill('claude-helper', 'desc')]);
  assert.equal(c.valid, false);
  assert.ok(c.violations.some((v) => /reserved/.test(v.message)));
  const a = validateSkills(process.cwd(), [mkSkill('anthropic-tool', 'desc')]);
  assert.equal(a.valid, false);
  assert.ok(a.violations.some((v) => /reserved/.test(v.message)));
});

test('name longer than 64 chars flagged as too long', () => {
  const longName = 'a'.repeat(65);
  const res = validateSkills(process.cwd(), [mkSkill(longName, 'desc')]);
  assert.equal(res.valid, false);
  assert.ok(res.violations.some((v) => v.field === 'name' && /too long/.test(v.message)));
});

test('description longer than 1024 chars flagged as too long', () => {
  const longDesc = 'x'.repeat(1025);
  const res = validateSkills(process.cwd(), [mkSkill('ok-name', longDesc)]);
  assert.equal(res.valid, false);
  assert.ok(res.violations.some((v) => v.field === 'description' && /too long/.test(v.message)));
});

test('CLI: validate skills exits 0 on a clean skill', () => {
  const file = mkSkill('council', 'A clean skill description.');
  const r = spawnSync('node', [TOOLS, 'validate', 'skills', file], { encoding: 'utf-8' });
  assert.equal(r.status, 0);
});

test('CLI: validate skills exits non-zero on a violation', () => {
  const file = mkSkill('Bad_Name', 'desc');
  const r = spawnSync('node', [TOOLS, 'validate', 'skills', file], { encoding: 'utf-8' });
  assert.notEqual(r.status, 0);
});
