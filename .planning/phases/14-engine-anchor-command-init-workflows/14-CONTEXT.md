# Phase 14: Engine `anchor` command + init workflows - Context

**Gathered:** 2026-06-09
**Status:** Ready for planning
**Source:** Hand-authored from locked M4 milestone scope (ROADMAP Phase 14 success criteria + REQUIREMENTS ENG-09 + ADR-014 taxonomy). This is the project's established dogfooding loop — no interactive discuss-phase; the design space is locked by the success criteria.

<domain>
## Phase Boundary

**Deliver the zero-dependency ENGINE surface that backs anchoring** — nothing else. This phase ships engine code + tests only; the two skills that wrap it are Phases 15 (`anchor-docs`) and 16 (`verify-self`).

In scope:
1. A new engine module `engine/bin/lib/anchor.cjs` providing `anchor add | list | check` over `.sovereign/external-docs/`, mirroring the shape of the already-shipped `bridge.cjs` / `adopt.cjs` modules.
2. Router wiring in `engine/bin/sovereign-tools.cjs` for the `anchor` command (subcommand dispatch + named/array arg parsing, like the existing `bridge` case).
3. Two new `init` orient workflows — `init anchor-docs` and `init verify-self` — added to the `switch (workflow)` in `engine/bin/lib/init.cjs`, each returning one JSON blob via `output()` with `@file:` spill.
4. `node --test` coverage for the new surface (add/list/check incl. stale detection, opt-in content, greenfield) + the two init blobs.

Explicitly OUT of scope (deferred — do NOT build here):
- Any skill (`anchor-docs`, `verify-self`) — Phases 15/16.
- Any HTTP/fetch client — the engine NEVER fetches a URL. It stores the URL + metadata + (opt-in) user-supplied content. The agent fetches with its own tools. (Keeps engine zero-dep + offline-deterministic.)
- The **copyright warning** — that is a *skill-layer* judgment (ADR-004, Phase 15). The engine is content-agnostic: it stores whatever content it is handed, with no warning logic.
- Any deploy-gate that BLOCKS on stale anchors / unresolved markers — M4 *surfaces* staleness only (like bridge staleness today).
- Emitting `SOVEREIGN:UNVERIFIED` markers — that is `verify-self`'s job (Phase 16); the engine only surfaces the marker-spec path in the `init verify-self` blob.
</domain>

<decisions>
## Implementation Decisions

### Locked by success criteria (NON-NEGOTIABLE)
- **`anchor add`** stores a `<slug>.md` under `.sovereign/external-docs/` carrying metadata headers: `source`, `version`, `date-retrieved`, `re-verify-by`. **URL-by-default**: the source URL + metadata are always stored; full content is stored ONLY when an explicit opt-in flag is passed.
- **`anchor list`** returns the anchored docs (parsed from the stored `<slug>.md` headers).
- **`anchor check`** flags every anchor whose `re-verify-by` is past as **stale**, computed **deterministically** from the stored dates. Both `list` and `check` are **greenfield-safe**: when `.sovereign/external-docs/` does not exist yet, they return a clean empty result (no crash) — mirror `bridge check`'s greenfield handling.
- **`init anchor-docs`** and **`init verify-self`** each return one orient JSON blob (paths + config + flags) via `output()` with `@file:` spill, using the existing array/named-arg parsing.
- **Zero new dependencies**: engine `package.json` `dependencies` stay `{}`. Pure Node + `node:*`. Tested with `node --test` + `node:assert/strict`.

### Claude's Discretion (engineering choices — chosen to mirror shipped patterns)
- **Module/CLI shape:** new `anchor.cjs` exporting `cmdAnchorAdd`, `cmdAnchorList`, `cmdAnchorCheck` (+ pure helpers), wired in the router exactly like `bridge` (a `case 'anchor':` block dispatching on `args[1]`). Use the existing `output(result, raw, rawValue)` / `error(msg)` helpers from `core.cjs` and the existing `parseNamedArgs` / array-arg parsing in `sovereign-tools.cjs` — do NOT reinvent any of them.
- **Anchor identity / slug:** `anchor add` takes an explicit `--id <slug>` (sanitized to `[a-z0-9-]`, used as the `<slug>.md` filename), plus `--source <url>` (required), `--version <v>` (optional, default `unknown`). Re-adding the same `--id` overwrites (idempotent update), mirroring how the bridge registry is keyed by id.
- **Dates / staleness math:** all dates are ISO `YYYY-MM-DD`. `--date-retrieved` defaults to today (engine may use `new Date()` — the `Date` restriction applies only to Workflow scripts, not the engine). `re-verify-by` is set by `--re-verify-by <YYYY-MM-DD>` if given, else defaults to `date-retrieved + 90 days`. `anchor check` marks an anchor stale when `re-verify-by < today` (strict past); equal-to-today is NOT stale. Date comparison is lexicographic on the ISO string (no Date parsing needed for the compare) — deterministic and offline.
- **Content opt-in:** `--content @<file>` or `--content -` (stdin) supplies full body text; presence of `--content` (or a dedicated `--store-content`) is the opt-in. Without it, only the header block is written. Record `content-stored: true|false` in the header so `list` can report it without reading the whole body.
- **Storage format of `<slug>.md`:** a small key:value metadata header block at the top (e.g. an HTML-comment or fenced `--- … ---` block — match whatever `adopt.cjs`/existing docs use for parseability), followed by the optional content body. `list`/`check` parse only the header (cheap), never require the body.
- **`init anchor-docs` blob** surfaces: `paths.external_docs_dir` (`.sovereign/external-docs/`), `config` (models + `commit_docs` via `loadConfig`), `exists` flags (does external-docs/ exist, any anchors yet), and the manifest/context-injection paths (mirror the `bridge`/`adopt` init cases).
- **`init verify-self` blob** surfaces: the same config/paths, PLUS the path to `engine/references/unverified-marker.md` (so the skill writes markers in the exact scanned form) and `paths.external_docs_dir` (so it can hand off to `anchor-docs` on choice A). It does NOT compute "last verified anchor" — that judgment is the skill's (Phase 16); the engine just exposes anchor dates/paths.
- **`anchor list`/`check` output:** JSON array of `{ id, source, version, date_retrieved, re_verify_by, content_stored, stale }` (`check` includes `stale` + a summary count; `list` may include `stale` too — cheap to compute). Empty array on greenfield.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Engine patterns to mirror (read these — the answer to "how" is already in the repo)
- `engine/bin/lib/bridge.cjs` — the closest analog: subcommand module, registry read/write under `.sovereign/`, `--id` keying, greenfield-safe `check`, `module.exports` shape.
- `engine/bin/lib/adopt.cjs` — storing generated docs under `.sovereign/`, layered scan, JSON result shape.
- `engine/bin/lib/core.cjs` — `output(result, raw, rawValue)` + `@file:` >50KB spill, `error()`, `loadConfig()`. Use verbatim; do not reimplement the JSON/spill contract.
- `engine/bin/lib/init.cjs` — the `switch (workflow)` (`council`/`bridge`/`adopt`/`extension` cases) + `cmdInit`; add `anchor-docs` and `verify-self` cases here.
- `engine/bin/sovereign-tools.cjs` — the `switch (command)` router + `parseNamedArgs` / `parseFieldValuePairs` array-arg helpers; add the `case 'anchor':` block here, mirroring `case 'bridge':`.

### Test patterns
- `engine/test/bridge.test.cjs` and `engine/test/adopt.test.cjs` (or the nearest existing lib test) — tmpdir fixture style, `node:test` + `node:assert/strict`, greenfield + happy-path + edge cases. The new `engine/test/anchor.test.cjs` mirrors these.

### Spec / requirement sources
- `.planning/ROADMAP.md` → Phase 14 "Success Criteria" (the 4 TRUE-conditions — the verification target).
- `.planning/REQUIREMENTS.md` → **ENG-09** (the single requirement this phase satisfies) + the M4 non-goals list (no HTTP client, no deploy-gate blocking, surfaces-only).
- `engine/references/unverified-marker.md` — the exact `SOVEREIGN:UNVERIFIED` marker form; the `init verify-self` blob points the skill here (do NOT change the marker format).
- `CLAUDE.md` → the prescriptive stack (zero-dep `.cjs`, `node:test`, JSON-on-stdout + `@file:` spill, native arg parsing).

### Forward reference (NOT needed to build Phase 14)
- "ADR-004" (copyright / content-storage policy) is referenced by ANCHOR-01 but not yet written, and is a **skill-layer** concern (Phase 15). Phase 14 only provides the content opt-in *mechanism*.
</canonical_refs>

<specifics>
## Specific Ideas

- Treat `bridge` as the template for `anchor`: same module/router/init/test seams, different domain (external-doc metadata vs cross-project hashes). A reviewer should be able to diff `anchor.cjs` against `bridge.cjs` and see the same skeleton.
- Staleness is intentionally the same *surface-only* model as bridge staleness — `check` reports stale; nothing blocks. Keep them conceptually parallel.
- Keep the engine offline + deterministic: no network, no randomness; the only ambient input is the current date for `check`/`add` defaults.
</specifics>

<deferred>
## Deferred Ideas

- `anchor-docs` skill (Phase 15) — wraps `anchor add`/`list`/`check`, owns the copyright warning (ADR-004) and the URL-vs-content UX.
- `verify-self` skill (Phase 16) — hard-stop + retroactive audit + 3 choices; emits `SOVEREIGN:UNVERIFIED` markers; composes with `anchor-docs`.
- Pre-flight deploy-gate that BLOCKS on stale anchors / unresolved markers (post-M4).
- Auto-fetching/refreshing anchor content from URLs (never in the engine — agent's job).
- Writing ADR-004 itself (do it during Phase 15 when the copyright/content policy is actually exercised at the skill layer).
</deferred>

---

*Phase: 14-engine-anchor-command-init-workflows*
*Context gathered: 2026-06-09 (hand-authored from locked M4 scope)*
