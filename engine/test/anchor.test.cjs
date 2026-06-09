'use strict';

/**
 * Unit + integration suite for engine module anchor (plan 14-01, ENG-09).
 *
 * Exercises the zero-dependency `anchor add|list|check` substrate that backs M4
 * anchoring under `.sovereign/external-docs/`:
 *   - add: writes `<slug>.md` with the five metadata headers (source/version/
 *     date-retrieved/re-verify-by/content-stored); URL-by-default; content stored
 *     ONLY on `--content` opt-in; slug sanitized (no path traversal); re-add
 *     overwrites; `re-verify-by` defaults to date-retrieved + 90d.
 *   - list: header-parsed array, greenfield-safe ([] when no external-docs/).
 *   - check: flags `re-verify-by < today` as stale (lexicographic ISO, fixed
 *     dates), returns {anchors, stale_count}, greenfield-safe.
 *   - pure helpers addDays/slugify/isStale.
 *   - SC4 regression guard: package.json deps + devDeps stay {}.
 *
 * Uses node:test + node:assert/strict with real tmp dirs (zero deps). Capture
 * mirrors adopt.test.cjs (fd-1 monkeypatch + @file: resolution). Required-arg /
 * unknown-subcommand paths spawn the BIN because error() calls process.exit.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');

const ENGINE_ROOT = path.join(__dirname, '..');
const BIN = path.join(ENGINE_ROOT, 'bin', 'sovereign-tools.cjs');
const {
  cmdAnchorAdd,
  cmdAnchorList,
  cmdAnchorCheck,
  addDays,
  slugify,
  isStale,
} = require(path.join(ENGINE_ROOT, 'bin', 'lib', 'anchor.cjs'));

/** Run an anchor command while capturing its output() write to fd 1 → parsed JSON. */
function capture(fn) {
  const origWriteSync = fs.writeSync;
  let captured = '';
  fs.writeSync = function (fd, data, ...rest) {
    if (fd === 1) {
      captured += String(data);
      return;
    }
    return origWriteSync.call(fs, fd, data, ...rest);
  };
  try {
    fn();
  } finally {
    fs.writeSync = origWriteSync;
  }
  // output() spills >50KB payloads to an @file: tmpfile; resolve it for assertions.
  if (captured.startsWith('@file:')) {
    captured = fs.readFileSync(captured.slice('@file:'.length), 'utf-8');
  }
  return JSON.parse(captured);
}

/** Fresh tmp project root. */
function mkProject() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'sov-anchor-'));
}

/** Absolute path to the external-docs dir for a project. */
function docsDir(cwd) {
  return path.join(cwd, '.sovereign', 'external-docs');
}

/** Seed a `<slug>.md` anchor file with an explicit header (deterministic). */
function seedAnchor(cwd, slug, fields) {
  const dir = docsDir(cwd);
  fs.mkdirSync(dir, { recursive: true });
  const header = [
    `**source:** ${fields.source}`,
    `**version:** ${fields.version}`,
    `**date-retrieved:** ${fields.dateRetrieved}`,
    `**re-verify-by:** ${fields.reVerifyBy}`,
    `**content-stored:** ${fields.contentStored}`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(dir, slug + '.md'), header + (fields.body || ''), 'utf-8');
}

// ─── add (SC1) ────────────────────────────────────────────────────────────────

test('T1: anchor add writes <slug>.md with all five metadata headers', () => {
  const dir = mkProject();
  capture(() =>
    cmdAnchorAdd(
      dir,
      {
        id: 'stripe',
        source: 'https://stripe.com/docs',
        version: '2024-06',
        'date-retrieved': '2026-01-01',
        're-verify-by': '2026-04-01',
        content: null,
        'store-content': false,
      },
      true
    )
  );
  const file = path.join(docsDir(dir), 'stripe.md');
  assert.ok(fs.existsSync(file), 'stripe.md written');
  const content = fs.readFileSync(file, 'utf-8');
  assert.match(content, /\*\*source:\*\* https:\/\/stripe\.com\/docs/);
  assert.match(content, /\*\*version:\*\* 2024-06/);
  assert.match(content, /\*\*date-retrieved:\*\* 2026-01-01/);
  assert.match(content, /\*\*re-verify-by:\*\* 2026-04-01/);
  assert.match(content, /\*\*content-stored:\*\*/);
});

test('T2: URL-only by default — no --content ⇒ body absent, content-stored false', () => {
  const dir = mkProject();
  capture(() =>
    cmdAnchorAdd(
      dir,
      {
        id: 'mdn',
        source: 'https://developer.mozilla.org',
        version: 'unknown',
        'date-retrieved': '2026-01-01',
        're-verify-by': '2026-04-01',
        content: null,
      },
      true
    )
  );
  const content = fs.readFileSync(path.join(docsDir(dir), 'mdn.md'), 'utf-8');
  assert.match(content, /\*\*content-stored:\*\* false/);
  // header-only: nothing after the trailing blank line that closes the header.
  assert.equal(content.replace(/\n+$/, '').split('\n').pop(), '**content-stored:** false');
});

test('T3: --content @file stores the body verbatim and sets content-stored true', () => {
  const dir = mkProject();
  const bodyFile = path.join(dir, 'body.txt');
  const body = 'Pasted excerpt of the docs.\nLine two.';
  fs.writeFileSync(bodyFile, body, 'utf-8');
  capture(() =>
    cmdAnchorAdd(
      dir,
      {
        id: 'with-file',
        source: 'https://example.com',
        'date-retrieved': '2026-01-01',
        're-verify-by': '2026-04-01',
        content: '@' + bodyFile,
      },
      true
    )
  );
  const content = fs.readFileSync(path.join(docsDir(dir), 'with-file.md'), 'utf-8');
  assert.match(content, /\*\*content-stored:\*\* true/);
  assert.ok(content.includes(body), 'file body stored after header');

  // a literal-string content (no @/-) is stored verbatim too.
  capture(() =>
    cmdAnchorAdd(
      dir,
      {
        id: 'with-literal',
        source: 'https://example.com',
        'date-retrieved': '2026-01-01',
        're-verify-by': '2026-04-01',
        content: 'literal body text',
      },
      true
    )
  );
  const lit = fs.readFileSync(path.join(docsDir(dir), 'with-literal.md'), 'utf-8');
  assert.match(lit, /\*\*content-stored:\*\* true/);
  assert.ok(lit.includes('literal body text'), 'literal content stored');
});

test('T4: re-adding the same --id overwrites (idempotent update)', () => {
  const dir = mkProject();
  const base = { id: 'dup', 'date-retrieved': '2026-01-01', 're-verify-by': '2026-04-01' };
  capture(() => cmdAnchorAdd(dir, { ...base, source: 'https://first.example' }, true));
  capture(() => cmdAnchorAdd(dir, { ...base, source: 'https://second.example' }, true));
  const files = fs.readdirSync(docsDir(dir)).filter((f) => f.endsWith('.md'));
  assert.deepEqual(files, ['dup.md'], 'exactly one anchor file');
  const content = fs.readFileSync(path.join(docsDir(dir), 'dup.md'), 'utf-8');
  assert.match(content, /\*\*source:\*\* https:\/\/second\.example/);
  assert.ok(!content.includes('https://first.example'), 'old source replaced');
});

test('T5: addDays is pure; re-verify-by defaults to date-retrieved + 90d; explicit honored', () => {
  assert.equal(addDays('2026-01-01', 90), '2026-04-01');
  const dir = mkProject();

  // default path: omit --re-verify-by → addDays(date-retrieved, 90).
  const def = capture(() =>
    cmdAnchorAdd(dir, { id: 'defaulted', source: 'https://x.example', 'date-retrieved': '2026-01-01' }, true)
  );
  assert.equal(def.re_verify_by, addDays('2026-01-01', 90));

  // explicit path: --re-verify-by honored exactly.
  const exp = capture(() =>
    cmdAnchorAdd(
      dir,
      { id: 'explicit', source: 'https://x.example', 'date-retrieved': '2026-01-01', 're-verify-by': '2027-12-31' },
      true
    )
  );
  assert.equal(exp.re_verify_by, '2027-12-31');
});

test('SC1 required-arg: anchor add without --source exits non-zero', () => {
  const dir = mkProject();
  const res = spawnSync(process.execPath, [BIN, 'anchor', 'add', '--id', 'x', '--cwd', dir], {
    encoding: 'utf-8',
  });
  assert.notEqual(res.status, 0, 'missing --source must exit non-zero');
});

test('SC1 slug: slugify cannot escape the dir; --id ../x stays inside external-docs/', () => {
  const slug = slugify('../../etc/foo');
  assert.ok(!slug.includes('/'), 'slug has no /');
  assert.ok(!slug.includes('.'), 'slug has no .');
  assert.match(slug, /^[a-z0-9-]+$/);

  const dir = mkProject();
  capture(() =>
    cmdAnchorAdd(dir, { id: '../x', source: 'https://x.example', 'date-retrieved': '2026-01-01', 're-verify-by': '2026-04-01' }, true)
  );
  // No file written outside the external-docs dir.
  assert.ok(!fs.existsSync(path.join(dir, '.sovereign', 'x.md')), 'no escape one level up');
  assert.ok(!fs.existsSync(path.join(dir, 'x.md')), 'no escape to project root');
  const files = fs.readdirSync(docsDir(dir)).filter((f) => f.endsWith('.md'));
  assert.equal(files.length, 1, 'single file, inside external-docs/');
});

// ─── list (SC2) ───────────────────────────────────────────────────────────────

test('T6: anchor list returns the header-parsed anchors', () => {
  const dir = mkProject();
  seedAnchor(dir, 'alpha', {
    source: 'https://a.example',
    version: '1.0',
    dateRetrieved: '2026-01-01',
    reVerifyBy: '2099-01-01',
    contentStored: 'false',
  });
  seedAnchor(dir, 'beta', {
    source: 'https://b.example',
    version: '2.0',
    dateRetrieved: '2026-02-02',
    reVerifyBy: '2099-02-02',
    contentStored: 'true',
    body: 'stored body',
  });
  const list = capture(() => cmdAnchorList(dir, true));
  assert.ok(Array.isArray(list));
  assert.equal(list.length, 2);
  const alpha = list.find((a) => a.id === 'alpha');
  assert.equal(alpha.source, 'https://a.example');
  assert.equal(alpha.version, '1.0');
  assert.equal(alpha.date_retrieved, '2026-01-01');
  assert.equal(alpha.re_verify_by, '2099-01-01');
  assert.equal(alpha.content_stored, false);
  assert.equal(typeof alpha.content_stored, 'boolean');
  const beta = list.find((a) => a.id === 'beta');
  assert.equal(beta.content_stored, true);
});

test('T7: anchor list greenfield-safe → [] when no external-docs/', () => {
  const dir = mkProject();
  let list;
  assert.doesNotThrow(() => {
    list = capture(() => cmdAnchorList(dir, true));
  });
  assert.deepEqual(list, []);
});

// ─── check (SC2) ──────────────────────────────────────────────────────────────

test('T8: anchor check flags re-verify-by < today as stale; isStale is pure', () => {
  // pure-function property test with FIXED string constants.
  assert.equal(isStale('2000-01-01', '2026-06-09'), true);
  assert.equal(isStale('2026-06-09', '2026-06-09'), false, 'equal-to-today is NOT stale');

  const dir = mkProject();
  seedAnchor(dir, 'stale-one', {
    source: 'https://old.example',
    version: 'unknown',
    dateRetrieved: '1999-01-01',
    reVerifyBy: '2000-01-01',
    contentStored: 'false',
  });
  seedAnchor(dir, 'fresh-one', {
    source: 'https://new.example',
    version: 'unknown',
    dateRetrieved: '2026-01-01',
    reVerifyBy: '2999-01-01',
    contentStored: 'false',
  });
  const res = capture(() => cmdAnchorCheck(dir, true));
  assert.equal(res.stale_count, 1);
  const stale = res.anchors.find((a) => a.id === 'stale-one');
  const fresh = res.anchors.find((a) => a.id === 'fresh-one');
  assert.equal(stale.stale, true);
  assert.equal(fresh.stale, false);
});

test('T9: anchor check greenfield-safe → {anchors:[], stale_count:0}', () => {
  const dir = mkProject();
  let res;
  assert.doesNotThrow(() => {
    res = capture(() => cmdAnchorCheck(dir, true));
  });
  assert.deepEqual(res, { anchors: [], stale_count: 0 });
});

// ─── deps regression guard (SC4) ──────────────────────────────────────────────

test('T12: engine package.json dependencies and devDependencies stay {}', () => {
  const pkg = require(path.join(ENGINE_ROOT, 'package.json'));
  assert.deepEqual(pkg.dependencies, {});
  assert.deepEqual(pkg.devDependencies, {});
});
