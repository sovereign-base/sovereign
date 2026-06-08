// @ts-check
'use strict';

/**
 * validate — the Agent Skills SKILL.md frontmatter linter.
 *
 * Enforces the platform's `name`/`description` constraints (STACK.md cap table):
 *   - name <= 64 chars
 *   - name matches ^[a-z0-9-]+$ (lowercase + digits + hyphens only)
 *   - name must NOT contain 'claude' or 'anthropic' (API-reserved words)
 *   - description <= 1024 chars (API max)
 *
 * Drops v1's non-standard frontmatter discipline onto the real spec (ADR). Any
 * violation makes `validate skills` exit non-zero so CI/install can gate on it.
 */

const fs = require('node:fs');
const path = require('node:path');
const { output, safeReadFile } = require('./core.cjs');

const NAME_MAX = 64;
const DESC_MAX = 1024;
const NAME_PATTERN = /^[a-z0-9-]+$/;
const RESERVED = ['claude', 'anthropic'];

/**
 * Recursively collect `SKILL.md` files under `dir` (zero-dep fs walk). Skips
 * node_modules and dot-directories other than `.claude`.
 * @param {string} dir
 * @param {string[]} acc
 * @returns {string[]}
 */
function walkSkillFiles(dir, acc) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue;
      if (entry.name.startsWith('.') && entry.name !== '.claude') continue;
      walkSkillFiles(full, acc);
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Parse the leading `---` frontmatter block into a flat `{key: value}` map via
 * line-based `key: value` parsing (no YAML dependency — sufficient for the
 * scalar name/description fields this linter inspects).
 * @param {string} content
 * @returns {Record<string, string>}
 */
function parseFrontmatter(content) {
  /** @type {Record<string, string>} */
  const fm = {};
  const lines = content.split(/\r?\n/);
  if (lines[0].trim() !== '---') return fm;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') break;
    const m = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      let value = m[2].trim();
      // Strip matching surrounding quotes if present.
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      fm[m[1]] = value;
    }
  }
  return fm;
}

/**
 * Lint a single SKILL.md file, returning any frontmatter violations.
 * @param {string} file
 * @returns {Array<{file: string, field: string, rule: string, message: string}>}
 */
function lintSkillFile(file) {
  /** @type {Array<{file: string, field: string, rule: string, message: string}>} */
  const violations = [];
  const content = safeReadFile(file);
  if (content === null) {
    violations.push({ file, field: 'file', rule: 'unreadable', message: 'cannot read SKILL.md' });
    return violations;
  }
  const fm = parseFrontmatter(content);
  const name = fm.name;
  const description = fm.description;

  if (!name) {
    violations.push({ file, field: 'name', rule: 'required', message: 'name is required in frontmatter' });
  } else {
    if (name.length > NAME_MAX) {
      violations.push({ file, field: 'name', rule: 'length', message: `name too long (${name.length} > ${NAME_MAX})` });
    }
    if (!NAME_PATTERN.test(name)) {
      violations.push({ file, field: 'name', rule: 'format', message: 'name must be lowercase-hyphen (^[a-z0-9-]+$)' });
    }
    const lower = name.toLowerCase();
    for (const word of RESERVED) {
      if (lower.includes(word)) {
        violations.push({ file, field: 'name', rule: 'reserved', message: `name contains reserved word '${word}'` });
      }
    }
  }

  if (description && description.length > DESC_MAX) {
    violations.push({ file, field: 'description', rule: 'length', message: `description too long (${description.length} > ${DESC_MAX})` });
  }

  return violations;
}

/**
 * Lint one or more SKILL.md files. When `paths` is empty, walks
 * `skills/**` and `.claude/skills/**` under `cwd`.
 *
 * @param {string} cwd - project root
 * @param {string[] | null} paths - explicit SKILL.md files, or empty to auto-discover
 * @returns {{ valid: boolean, checked: number, violations: Array<{file:string,field:string,rule:string,message:string}> }}
 */
function validateSkills(cwd, paths) {
  /** @type {string[]} */
  let files;
  if (paths && paths.length > 0) {
    files = paths;
  } else {
    files = [];
    walkSkillFiles(path.join(cwd, 'skills'), files);
    walkSkillFiles(path.join(cwd, '.claude', 'skills'), files);
  }

  /** @type {Array<{file:string,field:string,rule:string,message:string}>} */
  const violations = [];
  for (const file of files) {
    violations.push(...lintSkillFile(file));
  }

  return { valid: violations.length === 0, checked: files.length, violations };
}

/**
 * CLI wrapper: lint skills, emit the report, then exit(1) on any violation.
 * Writes the JSON output FIRST, then exits — so callers always see the report
 * (matches the writeSync-then-exit discipline used elsewhere in the engine).
 *
 * @param {string} cwd - project root
 * @param {string[] | null} paths
 * @param {boolean} [raw]
 * @returns {void}
 */
function cmdValidateSkills(cwd, paths, raw) {
  const result = validateSkills(cwd, paths);
  output(result, raw, result.valid ? 'valid' : 'invalid');
  if (!result.valid) {
    process.exit(1);
  }
}

module.exports = {
  validateSkills,
  cmdValidateSkills,
};
