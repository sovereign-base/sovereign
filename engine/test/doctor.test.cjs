'use strict';

/**
 * Suite for `sovereign-tools doctor` — the skill-listing budget check (SKL-07,
 * plan 02-03). doctor enumerates installed SOVEREIGN skills, counts the
 * AUTO-TRIGGERABLE ones (those WITHOUT `disable-model-invocation: true`), sums
 * their name+description chars, and warns when the auto-triggerable count or the
 * estimated listing-token budget is exceeded. With no skills it reports clean —
 * the mechanism exists now for Phases 3-4 to satisfy.
 *
 * Covers:
 *   - Test 1: empty fixture → ok true, total_skills 0 (clean, exit-0 semantics).
 *   - Test 2: 8 auto-triggerable skills → count breach warning, ok false.
 *   - Test 3: all skills disable-model-invocation:true → auto_count 0, ok true.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const BIN = path.join(ENGINE_ROOT, 'bin', 'sovereign-tools.cjs');

const { checkBudget, AUTO_MAX } = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'doctor.cjs'));

/** A fresh empty tmp project dir (no skills). */
function mkEmptyProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-doctor-'));
}

/**
 * Write a SKILL.md under <dir>/.claude/skills/<name>/SKILL.md with the given
 * name + description, optionally setting disable-model-invocation: true.
 */
function seedSkill(dir, name, description, disabled) {
  const skillDir = path.join(dir, '.claude', 'skills', name);
  fs.mkdirSync(skillDir, { recursive: true });
  const fm = ['---', `name: ${name}`, `description: ${description}`];
  if (disabled) fm.push('disable-model-invocation: true');
  fm.push('---', '', 'body', '');
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), fm.join('\n'));
}

test('Test 1: empty fixture → ok true, total_skills 0 (clean)', () => {
  const dir = mkEmptyProject();
  const result = checkBudget(dir);
  assert.equal(result.ok, true);
  assert.equal(result.total_skills, 0);
  assert.equal(result.auto_count, 0);
  assert.deepEqual(result.warnings, []);
});

test('Test 2: 8 auto-triggerable skills → count breach, ok false', () => {
  const dir = mkEmptyProject();
  for (let i = 0; i < AUTO_MAX + 1; i++) {
    seedSkill(dir, `skill-${i}`, `does thing number ${i}`, false);
  }
  const result = checkBudget(dir);
  assert.equal(result.total_skills, AUTO_MAX + 1);
  assert.equal(result.auto_count, AUTO_MAX + 1);
  assert.equal(result.ok, false);
  assert.ok(result.warnings.length >= 1, 'expected at least one warning');
  assert.ok(
    result.warnings.some((w) => /auto/i.test(w) && /\b7\b/.test(w)),
    'expected an auto-triggerable count breach warning'
  );
});

test('Test 3: all skills disable-model-invocation:true → auto_count 0, ok true', () => {
  const dir = mkEmptyProject();
  for (let i = 0; i < AUTO_MAX + 3; i++) {
    seedSkill(dir, `orch-${i}`, `orchestrator-only side-effecting skill ${i}`, true);
  }
  const result = checkBudget(dir);
  assert.equal(result.total_skills, AUTO_MAX + 3);
  assert.equal(result.auto_count, 0);
  assert.equal(result.disabled_count, AUTO_MAX + 3);
  assert.equal(result.ok, true);
  assert.deepEqual(result.warnings, []);
});

// ─── CLI integration ─────────────────────────────────────────────────────────

test('CLI: doctor on empty project exits 0 and prints clean JSON', () => {
  const dir = mkEmptyProject();
  const out = execFileSync(process.execPath, [BIN, 'doctor', '--cwd', dir], {
    encoding: 'utf-8',
  });
  const obj = JSON.parse(out);
  assert.equal(obj.ok, true);
  assert.equal(obj.total_skills, 0);
});

test('CLI: doctor exits 1 when the auto-triggerable count is breached', () => {
  const dir = mkEmptyProject();
  for (let i = 0; i < AUTO_MAX + 1; i++) {
    seedSkill(dir, `skill-${i}`, `does thing ${i}`, false);
  }
  assert.throws(
    () => execFileSync(process.execPath, [BIN, 'doctor', '--cwd', dir], { encoding: 'utf-8' }),
    /Command failed/
  );
});
