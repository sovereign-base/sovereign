'use strict';

/**
 * Structural suite for the M1-dispatched subagent definitions (plan 02-02).
 *
 * For each agent file under engine/agents/, parse the YAML frontmatter with a
 * minimal line-based parser (mirroring validate.cjs's parseFrontmatter) and
 * assert the Agent Skills subagent contract:
 *   - name present, matches ^[a-z0-9-]+$, contains no 'claude'/'anthropic'
 *   - description present
 *   - body documents the fixed JSON return schema ('ok:' marker)
 *   - body carries the literal 'JSON only' return instruction
 *
 * Also asserts the package files allowlist ships the agents/ dir so npm pack
 * includes the definitions.
 *
 * node:test + node:assert/strict, zero deps.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ENGINE_ROOT = path.join(__dirname, '..');
const AGENTS_DIR = path.join(ENGINE_ROOT, 'agents');

const EXPECTED_AGENTS = [
  'sovereign-advisor',
  'sovereign-chairman',
  'sovereign-peer-reviewer',
  'sovereign-sentinel',
];

const NAME_PATTERN = /^[a-z0-9-]+$/;
const RESERVED = ['claude', 'anthropic'];

/** Split a file's content into [frontmatter, body] around the leading --- fences. */
function splitDoc(content) {
  const lines = content.split(/\r?\n/);
  /** @type {Record<string, string>} */
  const fm = {};
  if (lines[0].trim() !== '---') return { fm, body: content };
  let i = 1;
  for (; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      i++;
      break;
    }
    const m = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (m) {
      let value = m[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      fm[m[1]] = value;
    }
  }
  return { fm, body: lines.slice(i).join('\n') };
}

for (const agent of EXPECTED_AGENTS) {
  test(`${agent}.md exists with valid frontmatter + schema + JSON-only marker`, () => {
    const file = path.join(AGENTS_DIR, `${agent}.md`);
    assert.ok(fs.existsSync(file), `missing agent file: ${file}`);

    const content = fs.readFileSync(file, 'utf-8');
    const { fm, body } = splitDoc(content);

    // name present, matches the expected file, lowercase-hyphen, no reserved words.
    assert.ok(fm.name, `${agent}: name is required in frontmatter`);
    assert.equal(fm.name, agent, `${agent}: name must match filename`);
    assert.ok(NAME_PATTERN.test(fm.name), `${agent}: name must be lowercase-hyphen`);
    for (const word of RESERVED) {
      assert.ok(
        !fm.name.toLowerCase().includes(word),
        `${agent}: name must not contain reserved word '${word}'`
      );
    }

    // description present.
    assert.ok(fm.description, `${agent}: description is required in frontmatter`);

    // body documents the fixed JSON return schema and the JSON-only instruction.
    assert.ok(/ok:/.test(body), `${agent}: body must document an 'ok:' schema field`);
    assert.ok(/JSON only/.test(body), `${agent}: body must carry the 'JSON only' instruction`);
  });
}

test('package files allowlist ships the agents/ dir', () => {
  const pkg = require(path.join(ENGINE_ROOT, 'package.json'));
  assert.ok(Array.isArray(pkg.files), 'package.json files must be an array');
  assert.ok(pkg.files.includes('agents'), "package.json files must include 'agents'");
});
