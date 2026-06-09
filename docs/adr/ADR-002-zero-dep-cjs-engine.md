# ADR-002: The engine is a zero-dependency Node `.cjs` program — the source is the artifact

**Status:** Accepted
**Date:** 2026-06-08

## Context

SOVEREIGN's Core Value is *the engine*: a skill orients itself with one CLI call
(`sovereign-tools init <workflow>` → one JSON blob) instead of ten file reads. For
that promise to hold, the engine must run instantly under `npx`, work offline and
deterministically, and never drift between what is in the repository and what users
actually execute.

GSD's shipped engine (`~/.claude/get-shit-done/bin/gsd-tools.cjs` + `bin/lib/*.cjs`,
VERSION 1.30.0) demonstrates the proven shape: hand-written CommonJS, **zero runtime
dependencies**, **no build step**, native `process.argv` parsing via a `switch`
router plus two small helpers. The shipped artifact *is* the source — `npx`-runnable
the moment it is fetched. v1 failed precisely because it had no engine; the one thing
that must work in v2 is this engine, so its foundation must be maximally simple and
robust.

## Decision

The `sovereign-tools` engine is a **zero-dependency Node `.cjs` program**, mirroring
GSD's `gsd-tools.cjs`. Specifically:

- **The source IS the artifact.** No compiled TypeScript (`tsc → dist/`), no `tsx`,
  no `bun`. We ship `.cjs` directly; there is no compile gap between repo and package.
- **No CLI framework.** No `commander`, `yargs`, or `clipanion`. CLI routing uses a
  native `switch(command)` over `process.argv.slice(2)` plus small arg-parsing
  helpers (GSD-style `parseNamedArgs` / `parseMultiwordArg`).
- **No runtime dependencies of any kind.** The engine uses only Node built-ins
  (`node:fs`, `node:path`, `node:child_process`, etc.).
- TypeScript may be used **dev-only** (`tsc --noEmit` + JSDoc `// @ts-check`) as a
  linter; no compiled output is ever shipped.

This realizes SOVEREIGN ADR-002 (Node/TS CLI, `npx` works out of the box) and
research decision R-001 (lift GSD's *patterns*, not its code).

## Consequences

- **Positive:** Instant `npx` cold-start; offline determinism; no source/artifact
  drift; the published package cannot silently diverge from the repo; trivial to
  audit and contribute to; runs anywhere `npx` runs.
- **Positive:** Any `SKILL.md`-capable agent that can run Bash can call the engine
  and parse its JSON — the real portability guarantee lives in the engine, not in
  Claude-only frontmatter.
- **Negative / accepted cost:** No CLI-framework ergonomics (auto help, completions).
  Acceptable because the only callers are skills (machine callers), not humans.
- **Negative / accepted cost:** No static type safety at runtime; mitigated by
  dev-only JSDoc typechecking and a `node --test` suite.
- **Constraint to defend:** Resist all dependency additions to the engine. Any
  proposal to add a runtime dependency, a build step, or a non-npm toolchain in
  front of `npx sovereign` must revisit this ADR first.
