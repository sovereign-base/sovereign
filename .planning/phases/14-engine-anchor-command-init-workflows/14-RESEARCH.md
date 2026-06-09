# Phase 14: Engine `anchor` command + init workflows - Research

**Researched:** 2026-06-09
**Domain:** Internal engine-pattern mirroring (zero-dep CommonJS subcommand module + init blobs + node:test)
**Confidence:** HIGH (every seam read directly from shipped engine source; no external dependence)

## Summary

The answer to "how" is entirely in the repo. Phase 14 adds a fourth subcommand-module of the exact shape already shipped three times (`bridge.cjs`, `adopt.cjs`, `extension.cjs`): a `.cjs` lib exporting `cmd*` functions + pure helpers, wired into the `switch (command)` router in `sovereign-tools.cjs`, emitting via the shared `output()` helper, and covered by a `node:test` suite that monkeypatches `fs.writeSync` to capture fd-1 JSON. The two init blobs are two more `case` arms in `init.cjs`'s `switch (workflow)`, identical in shape to the shipped `bridge`/`adopt`/`extension` arms.

The one genuinely-new behavior versus the existing modules is that `anchor add` **writes** a file under `.sovereign/` (the shipped read-substrates `bridge check`/`adopt scan` only read; the closest write precedent is `manifest.cjs`/`state.cjs`, which use `fs.mkdirSync(..., {recursive:true})` + `fs.writeFileSync(..., 'utf-8')`). The stored `<slug>.md` carries a parseable metadata header; the repo already has a proven header-read primitive — `readField(content, 'Field')` in `state.cjs:72` reads `**Field:** value` bold-markdown keys — so `anchor list`/`check` should parse a `**source:** ... / **version:** ...` bold-key block, never the body.

**Primary recommendation:** Build `engine/bin/lib/anchor.cjs` as a near-line-for-line analog of `bridge.cjs` (same module/exports/greenfield-safety shape), reuse `readField` from `state.cjs` for header parsing, use `new Date()` for the date defaults, compare staleness lexicographically on the ISO string, and add `case 'anchor':` to the router + `case 'anchor-docs':`/`case 'verify-self':` to `init.cjs`, all backed by `engine/test/anchor.test.cjs` modeled on `bridge.test.cjs`/`adopt.test.cjs`.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions (NON-NEGOTIABLE — from success criteria)
- **`anchor add`** stores `<slug>.md` under `.sovereign/external-docs/` with metadata headers `source`, `version`, `date-retrieved`, `re-verify-by`. **URL-by-default**: URL + metadata always stored; full content stored ONLY on explicit opt-in.
- **`anchor list`** returns the anchored docs (parsed from stored `<slug>.md` headers).
- **`anchor check`** flags every anchor whose `re-verify-by` is past as **stale**, computed deterministically from stored dates. Both `list` and `check` are **greenfield-safe**: when `.sovereign/external-docs/` does not exist, return a clean empty result (no crash) — mirror `bridge check`.
- **`init anchor-docs`** and **`init verify-self`** each return one orient JSON blob (paths + config + flags) via `output()` with `@file:` spill, using existing array/named-arg parsing.
- **Zero new dependencies**: engine `package.json` `dependencies` stay `{}`. Pure Node + `node:*`. `node --test` + `node:assert/strict`.

### Claude's Discretion (engineering choices — confirmed below in Open Questions)
- Module exports `cmdAnchorAdd`, `cmdAnchorList`, `cmdAnchorCheck` (+ pure helpers); router `case 'anchor':` dispatches on `args[1]`. Reuse `output()`/`error()` from `core.cjs` and the existing arg helpers — do NOT reinvent.
- Anchor identity: `--id <slug>` (sanitized to `[a-z0-9-]`, the filename), `--source <url>` (required), `--version <v>` (optional, default `unknown`). Re-add same `--id` overwrites (idempotent).
- Dates: ISO `YYYY-MM-DD`. `--date-retrieved` defaults to today (`new Date()` allowed in engine). `re-verify-by` from `--re-verify-by` else `date-retrieved + 90 days`. Stale when `re-verify-by < today` (strict past; equal-to-today NOT stale). Lexicographic ISO compare.
- Content opt-in: `--content @<file>` / `--content -` (stdin) / dedicated `--store-content`. Record `content-stored: true|false` in the header.
- Storage format: small key:value header block at top (match `adopt.cjs`/existing-doc parseability), optional body after. `list`/`check` parse only the header.
- `init anchor-docs` blob: `paths.external_docs_dir` (`.sovereign/external-docs/`), `config` (via `loadConfig`), `exists` flags, manifest/context-injection paths (mirror bridge/adopt).
- `init verify-self` blob: same config/paths PLUS the path to `engine/references/unverified-marker.md` and `paths.external_docs_dir`. Does NOT compute "last verified anchor" (skill judgment, Phase 16).
- `list`/`check` output: JSON array of `{ id, source, version, date_retrieved, re_verify_by, content_stored, stale }`; `check` adds a summary count; empty array on greenfield.

### Deferred Ideas (OUT OF SCOPE — do NOT build)
- The `anchor-docs` skill (Phase 15) and the `verify-self` skill (Phase 16).
- Any HTTP/fetch client — the engine NEVER fetches a URL.
- The copyright warning (skill-layer, ADR-004, Phase 15).
- Any deploy-gate that BLOCKS on stale anchors / unresolved markers (M4 surfaces only).
- Emitting `SOVEREIGN:UNVERIFIED` markers (that is `verify-self`/Phase 16; the engine only surfaces the marker-spec path).
- Writing ADR-004 itself.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ENG-09 | A zero-dependency engine surface backs anchoring: an `anchor` command (store/list/check-stale external-doc metadata under `.sovereign/external-docs/`, computing staleness from `re-verify-by`) + `init anchor-docs` / `init verify-self` workflows. Tested (`node --test`); deps stay `{}`. | Exact seams below: `anchor.cjs` mirrors `bridge.cjs` (module/exports/greenfield), router `case 'anchor':` mirrors `case 'bridge':` (`sovereign-tools.cjs:357`), init arms mirror `case 'bridge'/'adopt':` (`init.cjs:299`/`:323`). Storage uses `manifest.cjs`/`state.cjs` write idiom; header parse reuses `readField` (`state.cjs:72`). Tests mirror `bridge.test.cjs`/`adopt.test.cjs`. Deps already `{}` (`engine/package.json`). |
</phase_requirements>

---

## Standard Stack

### Core (already present — zero additions)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `node:fs` | built-in | read/write `<slug>.md`, dir probes | already used by every lib module |
| `node:path` | built-in | path joins, `.sovereign/external-docs/` | every module uses it |
| `node:test` + `node:assert/strict` | built-in (Node >=20) | the test suite | `package.json` `scripts.test` = `node --test "test/**/*.test.cjs"` |
| `./core.cjs` `output`/`error`/`safeReadFile`/`loadConfig` | repo | JSON+spill emit, errors, safe reads, config | the shared contract — never reimplement |
| `./state.cjs` `readField` | repo | parse `**Field:** value` headers | the existing header-read primitive |

### Supporting
None. Adding any runtime dependency violates ENG-09 and CLAUDE.md ("zero runtime deps, by design… Resist all additions"). `engine/package.json` `dependencies: {}` and `devDependencies: {}` must stay empty — assert this in a test (see Validation Architecture).

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `readField` bold-markdown header | YAML frontmatter `--- ... ---` parser | No frontmatter parser ships in the engine (skills/agents use frontmatter but nothing *parses* it in `.cjs`). `readField` already exists and is tested — use it. |
| Lexicographic ISO compare | `new Date(a) < new Date(b)` | Both work; lexicographic on `YYYY-MM-DD` is correct AND avoids timezone/parse pitfalls. See Open Q1. |

**Installation:** none. `node --test` is built in.

**Version verification:** N/A — no packages added. Verified `engine/package.json` already declares `dependencies: {}`, `devDependencies: {}`, `engines.node: ">=20"`.

---

## Architecture Patterns

### The four exact seams to mirror (file:line + real signatures)

**1. Subcommand module skeleton — `engine/bin/lib/bridge.cjs` (the diff target)**
- Header doc-comment naming the requirement + scope guard + "Zero runtime deps — node: built-ins only." (`bridge.cjs:1-20`)
- `const { output, safeReadFile } = require('./core.cjs');` (`bridge.cjs:25`)
- A module-level relative-path constant: `const REGISTRY_REL = path.join('.sovereign', 'bridges', 'registry.json');` (`bridge.cjs:27`). **Anchor analog:** `const EXTERNAL_DOCS_REL = path.join('.sovereign', 'external-docs');`
- Pure helpers first, `cmd*` functions after, `module.exports = { cmdBridgeHash, cmdBridgeCheck, hashSources, hashFile };` last (`bridge.cjs:139-144`). **Anchor analog:** export `cmdAnchorAdd, cmdAnchorList, cmdAnchorCheck` + pure helpers (`slugify`, `parseHeader`, `buildHeader`, `addDays`, `listAnchors`, `isStale`).
- `cmd*` signature is `(cwd, ...args, raw)` and ends in `output(result, raw);` — e.g. `function cmdBridgeHash(cwd, files, raw) { ... output({...}, raw); }` (`bridge.cjs:77-80`).
- Greenfield handling reads via `safeReadFile` (returns `null`, never throws) and short-circuits to a clean empty result: `if (!registry || ids.length === 0) { output({ fresh: true, changed: [], reason: 'no_registry' }, raw); return; }` (`bridge.cjs:106-109`). **Anchor analog:** missing `external-docs/` dir → `output([], raw)` for list, `output({ anchors: [], stale_count: 0 }, raw)` for check.

**2. The shared emit/error/read/config contract — `engine/bin/lib/core.cjs` (use verbatim)**
- `output(result, raw, rawValue)` (`core.cjs:44-59`): JSON-stringifies `result`; if `json.length > 50000` writes to `os.tmpdir()/sovereign-<Date.now()>.json` and emits `@file:<path>`; else writes JSON to fd 1 via `fs.writeSync(1, data)`. **Reuse exactly — the `@file:` spill is inherited for free.**
- `error(message)` (`core.cjs:66-69`): `fs.writeSync(2, 'Error: '+message+'\n'); process.exit(1);` → `@returns {never}`. Use for `--source required`, unknown subcommand, etc.
- `safeReadFile(p)` (`core.cjs:78-84`): `fs.readFileSync(p,'utf-8')` or `null` on any throw. Use for reading each `<slug>.md`.
- `loadConfig(cwd)` (`core.cjs:168-187`): deep-merged defaults ← `~/.sovereign/defaults.json` ← `.sovereign/config.json`; returns `{ model_profile, commit_docs, parallelization, council_mode_default, resolve_model_ids, context_window }`. Used by the init blobs.

**3. Router wiring — `engine/bin/sovereign-tools.cjs` (mirror `case 'bridge':`)**
- `case 'bridge':` at `sovereign-tools.cjs:357-372`: `const sub = args[1];` then `if (sub === 'hash') { const files = parseListArg(args, 'files'); cmdBridgeHash(cwd, files, raw); } else if (sub === 'check') { const bridgeId = args[2] && !args[2].startsWith('--') ? args[2] : null; cmdBridgeCheck(cwd, bridgeId, raw); } else { error(\`Unknown bridge subcommand: ${sub || '(none)'} (expected hash|check)\`); }`
- **Arg helpers available (all in this file, all zero-dep):**
  - `parseNamedArgs(args, valueFlags, booleanFlags)` (`:57-70`) → `{ flag: 'value' | null }` for value flags, `{ flag: true|false }` for booleans. **This is the fit for `anchor add`:** `parseNamedArgs(args.slice(2), ['id','source','version','date-retrieved','re-verify-by','content'], ['store-content'])`.
  - `parseListArg(args, flag)` (`:128-137`) → array of tokens until next `--flag` (used by `--files a b c`).
  - `parseMultiwordArg(args, flag)` (`:81-90`) → space-joined tokens.
  - `parseFieldValuePairs(args)` (`:103-117`) → repeatable `--field/--value` pairs.
- Add `import` at top: `const { cmdAnchorAdd, cmdAnchorList, cmdAnchorCheck } = require('./lib/anchor.cjs');` (mirror line 32/39).
- Add `anchor` to the usage strings at `:217-221`.
- **Note on `--content`:** the router strips `--raw`/`--pick`/`--cwd` BEFORE dispatch (`:178-209`), so by the time `args` reach the `case`, only command-specific flags remain. `parseNamedArgs` handles `--content @file` (the value `@file` does not start with `--`, so it is captured). See Open Q3.

**4. Init blob arms — `engine/bin/lib/init.cjs` (mirror `case 'bridge':`/`case 'adopt':`)**
- `buildInit(cwd, workflow)` (`init.cjs:241-386`) computes `config = loadConfig(cwd)`, `phase = readState(cwd)`, `exists = existsBlock(cwd)`, `orientationConfig = { model_profile, commit_docs, council_mode_default, parallelization }`, then a `switch (workflow)` sets `blob`, returning `withProjectContext(cwd, workflow, blob)`.
- `case 'bridge':` (`:299-321`) shape: `blob = { models: {}, config: orientationConfig, phase, context_injection: contextInjection(cwd), paths: { bridge_dir: '.sovereign/bridges', registry: '...', ... }, exists };`
- `case 'adopt':` (`:323-343`) additionally adds a `detected: { in_git: ... }` namespace.
- `withProjectContext` (`:211-220`) wraps every blob with `project_root`, `sovereign_version`, and `checkAgents(...)` (`agents_installed`/`missing_agents`). For new workflows with no required agents, `requiredAgentsFor` (`:164-166`) returns `[]` (not in `REQUIRED_AGENTS` at `:153-157`) → `{ agents_installed: true, missing_agents: [] }`. **No change to `REQUIRED_AGENTS` needed** — neither `anchor-docs` nor `verify-self` dispatches a subagent in Phase 14.

### Recommended file layout (no new dirs in the engine)
```
engine/bin/lib/anchor.cjs       # NEW — the module
engine/test/anchor.test.cjs     # NEW — the suite
engine/bin/sovereign-tools.cjs  # EDIT — require + case 'anchor':
engine/bin/lib/init.cjs         # EDIT — case 'anchor-docs': + case 'verify-self':
                                # (runtime) .sovereign/external-docs/<slug>.md written by anchor add
```

### Anti-Patterns to Avoid
- **Reimplementing `output()`/the `@file:` spill** — call `core.cjs` `output(result, raw)`. (ARCHITECTURE.md mandate; both `adopt.cjs:31` and `bridge.cjs:25` import it.)
- **Throwing on a missing `external-docs/` dir** — every shipped substrate is greenfield-safe (`bridge.cjs:106`, `adopt.cjs` greenfield test). Return empty.
- **A YAML/frontmatter parser** — use `readField` (`state.cjs:72`), already tested.
- **Adding a runtime dep** — forbidden by ENG-09 + CLAUDE.md.
- **Fetching the URL** — explicitly out of scope; the engine stores metadata only.
- **Putting copyright-warning logic in the engine** — skill-layer (Phase 15).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON emit + 50KB Bash-buffer overflow | a custom `JSON.stringify` + tmpfile | `core.cjs` `output(result, raw)` | spill is mandatory + already correct (`core.cjs:44-59`) |
| Error-and-exit | `console.error` + `process.exit` | `core.cjs` `error(msg)` (`:66`) | uniform `Error: <msg>` to fd 2, exit 1 |
| Reading a possibly-missing file | `try/catch` around `readFileSync` | `core.cjs` `safeReadFile` (`:78`) | returns `null`, never throws |
| Parsing `**key:** value` headers | a new regex per field | `state.cjs` `readField(content, key)` (`:72`) | bold-then-plain, tested |
| Merged config for the init blobs | re-reading config files | `core.cjs` `loadConfig(cwd)` (`:168`) | deep-merge of all 3 layers |
| Capturing `output()` in tests | wrapping cmd in a child process | monkeypatch `fs.writeSync` fd-1 + resolve `@file:` | the established `capture()` helper (`adopt.test.cjs:31-51`) |

**Key insight:** Every primitive this phase needs already exists and is tested. The phase is composition, not invention. A reviewer should be able to `diff anchor.cjs bridge.cjs` and see the same skeleton with a different domain.

---

## Common Pitfalls

### Pitfall 1: `output()` array-vs-object for `list`
**What goes wrong:** `--pick` and the spill both operate on whatever `output()` is given. CONTEXT specifies `list` returns a JSON **array**; `extractField` (`sovereign-tools.cjs:147`) supports `arr[0]`/`arr[-1]`, so an array top-level is fine.
**How to avoid:** `cmdAnchorList` → `output(anchorsArray, raw)`. `cmdAnchorCheck` → `output({ anchors: [...], stale_count: N }, raw)` (object, because it carries a summary count, like `bridge check` returns an object).
**Warning sign:** a `--pick stale_count` test failing because list/check shapes were swapped.

### Pitfall 2: Date default determinism in tests
**What goes wrong:** `--date-retrieved` defaulting to `new Date()` and `re-verify-by` to +90d makes `add` outputs non-deterministic across test runs.
**How to avoid:** Tests should always pass explicit `--date-retrieved` and `--re-verify-by` (or assert the *relationship*, e.g. re-verify-by = retrieved+90d via the pure `addDays` helper) rather than asserting a literal today. Test `check` with FIXED stored dates (a past `re-verify-by` for stale, a future one for fresh). Mirrors how `bridge` tests write a fixed registry then assert.
**Warning sign:** a test that passes today and fails in 91 days.

### Pitfall 3: Slug sanitization / path traversal
**What goes wrong:** an `--id` of `../../etc/foo` would write outside `.sovereign/external-docs/`.
**How to avoid:** `slugify(id)` → lowercase, replace any char not in `[a-z0-9-]` with `-`, collapse repeats, strip leading/trailing `-`. The result can never contain `/` or `.` so `path.join(dir, slug + '.md')` stays inside. (The `extension.cjs` array-arg discipline is the same "never trust the input string" instinct.)
**Warning sign:** a test passing `--id ../x` and finding a file written outside the dir.

### Pitfall 4: `parseNamedArgs` swallows a following flag as a value
**What goes wrong:** `parseNamedArgs` treats the next token as the value unless it `startsWith('--')` (`sovereign-tools.cjs:62`). `--source --version` would set `source: null` (good) — but `--content -` sets `content: '-'` (good, that's the stdin sentinel). Verify `@file` and `-` both survive (neither starts with `--`).
**How to avoid:** This is actually correct behavior; just write a test that `--content @/tmp/x` captures `@/tmp/x` and `--content -` captures `-`.

### Pitfall 5: greenfield `external-docs/` missing vs empty
**What goes wrong:** `fs.readdirSync` on a missing dir throws; on an empty dir returns `[]`.
**How to avoid:** wrap the readdir in try/catch returning `[]` (mirror `relevantAdrs` in `init.cjs:99-111`, which does exactly this). Both missing and empty → empty result.

---

## Code Examples

### Header parse/build (reusing the shipped primitive)
```js
// Source: engine/bin/lib/state.cjs:72 (readField) — bold-markdown key reader.
const { readField } = require('./state.cjs');

// build (anchor add) — bold-markdown block matching readField's pattern
function buildHeader({ source, version, dateRetrieved, reVerifyBy, contentStored }) {
  return [
    `**source:** ${source}`,
    `**version:** ${version}`,
    `**date-retrieved:** ${dateRetrieved}`,
    `**re-verify-by:** ${reVerifyBy}`,
    `**content-stored:** ${contentStored}`,
    '',
  ].join('\n');
}

// parse (anchor list/check) — header only, never the body
function parseAnchor(id, content) {
  return {
    id,
    source: readField(content, 'source'),
    version: readField(content, 'version'),
    date_retrieved: readField(content, 'date-retrieved'),
    re_verify_by: readField(content, 're-verify-by'),
    content_stored: readField(content, 'content-stored') === 'true',
  };
}
```

### Deterministic staleness (lexicographic ISO, offline)
```js
// re-verify-by < today (strict past) → stale; equal-to-today is NOT stale.
// Lexicographic compare is correct on YYYY-MM-DD and dodges timezone/parse bugs.
function todayISO() {
  const d = new Date();                       // engine MAY use new Date() (Open Q1)
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;                // mirrors init.cjs:117 dateStamp(), with dashes
}
function isStale(reVerifyBy, today) {
  return typeof reVerifyBy === 'string' && reVerifyBy < today;
}
```

### `addDays` for the +90d default (pure, no Date math in the compare path)
```js
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
```

### Greenfield-safe listing (mirror init.cjs:99-111)
```js
function listAnchors(cwd) {
  const dir = path.join(cwd, '.sovereign', 'external-docs');
  let names;
  try { names = fs.readdirSync(dir); } catch { return []; }   // missing dir → []
  return names.filter((f) => f.endsWith('.md')).sort()
    .map((f) => parseAnchor(f.replace(/\.md$/, ''), safeReadFile(path.join(dir, f)) || ''));
}
```

### Router arm (mirror sovereign-tools.cjs:357)
```js
case 'anchor': {
  const sub = args[1];
  if (sub === 'add') {
    const f = parseNamedArgs(args.slice(2),
      ['id', 'source', 'version', 'date-retrieved', 're-verify-by', 'content'],
      ['store-content']);
    cmdAnchorAdd(cwd, f, raw);
  } else if (sub === 'list') {
    cmdAnchorList(cwd, raw);
  } else if (sub === 'check') {
    cmdAnchorCheck(cwd, raw);
  } else {
    error(`Unknown anchor subcommand: ${sub || '(none)'} (expected add|list|check)`);
  }
  break;
}
```

### Init arm (mirror init.cjs:299 bridge / :323 adopt)
```js
case 'anchor-docs': {
  blob = {
    models: {},
    config: orientationConfig,
    phase,
    context_injection: contextInjection(cwd),
    paths: {
      external_docs_dir: '.sovereign/external-docs',
      state: '.sovereign/STATE.md',
      manifest: '.sovereign/MANIFEST.md',
    },
    exists,
  };
  break;
}
case 'verify-self': {
  blob = {
    models: {},
    config: orientationConfig,
    phase,
    context_injection: contextInjection(cwd),
    paths: {
      external_docs_dir: '.sovereign/external-docs',
      unverified_marker_spec: 'references/unverified-marker.md', // shipped-package-relative
      state: '.sovereign/STATE.md',
      manifest: '.sovereign/MANIFEST.md',
    },
    exists,
  };
  break;
}
```

---

## Open Questions (resolved with code evidence)

1. **Date-math: lexicographic ISO vs Date compare? Is `new Date()` allowed in the engine?**
   - **Resolved: lexicographic compare is safe + deterministic; `new Date()` is allowed in the engine.** Evidence: `init.cjs:117-123` `dateStamp()` already calls `new Date()` and reads `getUTCFullYear/Month/Date` in shipped engine code — the "no `Date`" rule applies only to Workflow scripts, confirmed by precedent. For `YYYY-MM-DD` strings, string `<` is identical to chronological `<` (fixed-width, zero-padded, big-endian), with no timezone/parse ambiguity. Use lexicographic for the compare; use `new Date(Date.UTC(...))` only inside `addDays` for the +90d arithmetic. Recommendation: **confirm CONTEXT's lean — adopt lexicographic.**

2. **Metadata header format — which precedent?**
   - **Resolved: bold-markdown `**key:** value` block, parsed by `readField` (`state.cjs:72`).** Evidence: the engine has TWO header styles — YAML frontmatter (`--- ... ---`) in skills/agents, and `**Field:** value` in STATE.md. Only the latter has a *parser in `.cjs`* (`readField`, already tested). `adopt.cjs` stores no docs (read-only), so there is no adopt precedent to match; STATE.md is the canonical stored-doc-with-parseable-header precedent. Recommendation: **use the bold-markdown block + `readField`; do NOT introduce a frontmatter parser.** (CONTEXT floated HTML-comment or fenced `---`; the bold block is the one with an existing tested reader, so it's strictly cheaper.)

3. **Content opt-in mechanism — which arg shape fits the helpers?**
   - **Resolved: `--content @<file>` / `--content -` (stdin), parsed by `parseNamedArgs`.** Evidence: `parseNamedArgs` (`:57-70`) captures the next non-`--` token as the value, so `@file` and `-` both survive intact. `--content` present ⇒ opt-in ⇒ `content-stored: true`. Resolve `@file` via `safeReadFile`; resolve `-` via `fs.readFileSync(0, 'utf-8')` (fd 0 = stdin, zero-dep). A redundant boolean `--store-content` is unnecessary (presence of `--content` IS the opt-in) but harmless if added to the booleanFlags list. Recommendation: **`--content` only; presence = opt-in; `@file`/`-`/literal all supported.**

4. **Exact init-blob fields?**
   - **Resolved** (see init-arm code above). `anchor-docs`: `{ models:{}, config:orientationConfig, phase, context_injection, paths:{external_docs_dir, state, manifest}, exists }` + `withProjectContext` wrapper (`project_root`, `sovereign_version`, `agents_installed:true`, `missing_agents:[]`). `verify-self`: same + `paths.unverified_marker_spec` pointing at the shipped `references/unverified-marker.md`. Both inherit `output()` spill. **Decision needed at plan time:** the package-relative path string for the marker spec — `engine/references/unverified-marker.md` is the repo path, but the *shipped* package puts `references/` at the package root (`package.json` `files` includes `"references"`). Surface it as `references/unverified-marker.md` (shipped-relative) so the Phase-16 skill finds it post-install. **Flag for planner to confirm against how other blobs express shipped-asset paths.**

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | engine + `node --test` | ✓ | >=20 (CLAUDE.md verified v23.11) | — |
| git | NOT required by anchor (pure FS) | ✓ | — | tests do not need git |

**Missing dependencies with no fallback:** none.
**Missing dependencies with fallback:** none. This phase is pure-Node FS + `node:test`; no external services, no network (by design — the engine never fetches).

---

## Validation Architecture

> `workflow.nyquist_validation` not set in config → treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | `node:test` + `node:assert/strict` (built-in, Node >=20) |
| Config file | none — `engine/package.json` `scripts.test` = `node --test "test/**/*.test.cjs"` |
| Quick run command | `cd engine && node --test test/anchor.test.cjs` |
| Full suite command | `cd engine && npm test` |

### Phase Requirements → Test Map (each case maps to a Success Criterion)

Success Criteria (ROADMAP Phase 14): **SC1** add stores `<slug>.md` w/ 4 headers, URL-by-default, content opt-in. **SC2** list returns anchors; check flags past `re-verify-by` as stale, deterministic, both greenfield-safe. **SC3** `init anchor-docs`/`init verify-self` each return one blob via `output()` w/ spill, array-arg parsing. **SC4** `node --test` covers add/list/check (stale/opt-in/greenfield) + deps stay `{}`.

| Req | Behavior | Test Type | Command | File Exists? |
|-----|----------|-----------|---------|--------------|
| SC1 | `anchor add` writes `.sovereign/external-docs/<slug>.md` with all 4 headers (`source`,`version`,`date-retrieved`,`re-verify-by`) + `content-stored` | unit | `node --test test/anchor.test.cjs` | ❌ Wave 0 |
| SC1 | URL-only by default: no `--content` ⇒ body absent, `content-stored:false` | unit | same | ❌ Wave 0 |
| SC1 | `--content @file` / `--content -` stores body, `content-stored:true` | unit | same | ❌ Wave 0 |
| SC1 | re-add same `--id` overwrites (idempotent update) | unit | same | ❌ Wave 0 |
| SC1 | `re-verify-by` defaults to `date-retrieved + 90d` when omitted; honored when given | unit (pure `addDays`) | same | ❌ Wave 0 |
| SC1 | `--source` required ⇒ `error()` (exit 1) when missing | unit | same | ❌ Wave 0 |
| SC1 | slug sanitization: `--id ../x` cannot escape the dir | unit | same | ❌ Wave 0 |
| SC2 | `anchor list` returns header-parsed array `{id,source,version,date_retrieved,re_verify_by,content_stored,stale}` | unit | same | ❌ Wave 0 |
| SC2 | `list` greenfield: no `external-docs/` ⇒ `[]`, no throw | unit | same | ❌ Wave 0 |
| SC2 | `anchor check` flags `re-verify-by < today` as stale; `>= today` not stale | unit (fixed dates) | same | ❌ Wave 0 |
| SC2 | `check` deterministic given fixed stored dates; returns `{anchors,stale_count}` | unit | same | ❌ Wave 0 |
| SC2 | `check` greenfield: no `external-docs/` ⇒ `{anchors:[],stale_count:0}`, no throw | unit | same | ❌ Wave 0 |
| SC3 | `init anchor-docs` returns blob via `output()` with `paths.external_docs_dir`, `config`, `exists`, `project_root` | unit (buildInit) | `node --test test/init.test.cjs` (extend) | ⚠️ extend existing |
| SC3 | `init verify-self` returns blob with `paths.external_docs_dir` + `unverified_marker_spec` | unit (buildInit) | same | ⚠️ extend existing |
| SC3 | both init blobs greenfield-safe (empty dir, no throw) | unit | same | ⚠️ extend existing |
| SC3 | `@file:` spill path exercised conceptually: `capture()` helper resolves `@file:` (already done in `adopt.test.cjs:46-49`) | unit | same | reuse helper |
| SC4 | router `case 'anchor':` dispatches add/list/check; unknown sub ⇒ error | integration (spawnSync via BIN) | `node --test test/router-m3.test.cjs` or anchor.test | ⚠️ extend / new |
| SC4 | `engine/package.json` `dependencies` and `devDependencies` are `{}` | unit | new assertion (no existing test) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `cd engine && node --test test/anchor.test.cjs`
- **Per wave merge:** `cd engine && npm test` (full suite — must stay green; current baseline 129 tests)
- **Phase gate:** full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `engine/test/anchor.test.cjs` — covers SC1, SC2, SC4 (add/list/check/stale/opt-in/greenfield/slug); model on `bridge.test.cjs` + `adopt.test.cjs` (`capture()` helper with `@file:` resolution, `mkProject()` tmpdir, `node:assert/strict`).
- [ ] Extend `engine/test/init.test.cjs` — two new `buildInit(dir, 'anchor-docs')` / `buildInit(dir, 'verify-self')` cases (SC3).
- [ ] Deps-stay-`{}` assertion — no existing test asserts this; add one (read `engine/package.json`, assert `deepEqual(pkg.dependencies, {})` and `deepEqual(pkg.devDependencies, {})`). Satisfies SC4's "deps stay `{}`."
- [ ] Optional: router integration test (spawnSync the BIN) if not folded into `anchor.test.cjs`.
- Framework install: none — `node --test` is built in.

---

## State of the Art

N/A — internal pattern-mirroring phase. No external library/framework choices; the "state of the art" is the three shipped sibling modules (`bridge`/`adopt`/`extension`, M3, v1.2, verified 8/8). No external re-verification cadence applies; the engine intentionally has no network surface.

---

## Sources

### Primary (HIGH confidence — read directly)
- `engine/bin/lib/bridge.cjs` (1-144) — module skeleton, `--id` keying, greenfield short-circuit, `module.exports` shape, `cmd*(cwd,...,raw)` + `output(...)`.
- `engine/bin/lib/adopt.cjs` (1-277) — read-only substrate, greenfield safety, `cmdAdoptScan` shape; `capture()` `@file:` resolution mirrored in its test.
- `engine/bin/lib/core.cjs` (44-187) — `output`/`error`/`safeReadFile`/`loadConfig` exact signatures + the >50KB `@file:` spill.
- `engine/bin/lib/init.cjs` (211-404) — `buildInit` switch, `case 'bridge'/'adopt'`, `withProjectContext`, `REQUIRED_AGENTS`, `relevantAdrs` greenfield readdir pattern, `dateStamp()` `new Date()` precedent.
- `engine/bin/sovereign-tools.cjs` (57-415) — router `case 'bridge':`, `parseNamedArgs`/`parseListArg`/`parseMultiwordArg`/`parseFieldValuePairs`, `extractField`, `--pick`/`--raw`/`--cwd` stripping.
- `engine/bin/lib/state.cjs` (51-118) — `readField`/`stateReplaceField` header reader; `loadState`.
- `engine/test/bridge.test.cjs` (1-224) + `engine/test/adopt.test.cjs` (1-272) + `engine/test/init.test.cjs` (1-80) — tmpdir fixtures, `capture()` fd-1 monkeypatch, `@file:` resolution, greenfield/idempotency idioms.
- `engine/references/unverified-marker.md` (1-50) — the marker spec the `verify-self` blob surfaces (path only; format unchanged).
- `engine/package.json` — `dependencies:{}`, `devDependencies:{}`, `engines.node:">=20"`, `scripts.test`.
- `.planning/{ROADMAP,REQUIREMENTS,STATE}.md` + `14-CONTEXT.md` — scope, ENG-09, success criteria, locked decisions.
- `CLAUDE.md` — zero-dep `.cjs`, `node:test`, `output()`/`@file:` spill, native arg parsing, "no new dependencies, ever."

### Secondary / Tertiary
None — no web research required or performed (internal pattern phase).

---

## Project Constraints (from CLAUDE.md)
- **Zero runtime dependencies, always.** Engine `package.json` `dependencies` MUST stay `{}`. "Resist all additions."
- **Plain CommonJS `.cjs`, no build step.** Source is the artifact. `// @ts-check` + JSDoc at top of file (every lib module has it).
- **`node:test` + `node:assert/strict`** with tmpdir fixtures. No test framework.
- **JSON-on-stdout via `output()` + mandatory `@file:` >50KB spill** — never reimplement.
- **Native `process.argv` parsing** — reuse `parseNamedArgs`/`parseListArg`; no commander/yargs.
- **`'use strict';`** at top; node: built-ins only (`require('node:fs')` style).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all primitives read directly; nothing added.
- Architecture/seams: HIGH — exact file:line + signatures for all four seams + three sibling modules to diff against.
- Pitfalls: HIGH — derived from the shipped tests' own guards (greenfield, idempotency, fd-1 capture, `@file:` resolution).
- Open questions: HIGH — all four resolved with in-repo evidence; one sub-point (shipped-relative marker path string) flagged for planner confirmation.

**Research date:** 2026-06-09
**Valid until:** stable — internal repo patterns; re-verify only if `core.cjs`/`init.cjs`/router seams change.
