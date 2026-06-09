# ADR-009: CommonJS packaging — no `"type":"module"`, `engines.node >= 20`, shebang on bins

**Status:** Accepted
**Date:** 2026-06-08

## Context

Node treats `.js` files as ESM when `package.json` declares `"type":"module"`, and as
CommonJS otherwise. The engine is authored as hand-written CommonJS `.cjs`
(see ADR-002) and relies on CJS semantics (`require`, `module.exports`,
`require.main === module`). A mismatched `package.json` `"type"` field, a missing
`engines` floor, or missing shebangs are classic packaging foot-guns that would make
`npx sovereign` fail on a fresh machine — directly undermining the "works out of the
box" promise. Research (`STACK.md`, `PITFALLS.md`) flagged the ESM-vs-CJS packaging
pitfall explicitly.

## Decision

The published package uses **CommonJS packaging**:

- `package.json` MUST NOT declare `"type": "module"`. (Files are `.cjs`, and the
  absence of `"type":"module"` keeps the default CommonJS interpretation.)
- `package.json` MUST declare `"engines": { "node": ">=20" }`, pinning the Node LTS
  baseline that `npx` ships and that the engine is verified against.
- Every `bin` entry file MUST begin with the shebang `#!/usr/bin/env node` on line 1.
- The `bin` map exposes two entries:
  `{ "sovereign": "bin/sovereign.cjs", "sovereign-tools": "bin/sovereign-tools.cjs" }`.
- The `files` allowlist ships only what is needed: `["bin","templates","VERSION"]`.

## Consequences

- **Positive:** `npx sovereign` / `npx sovereign-tools` resolve and execute correctly
  on any machine with Node >= 20 — no ESM/CJS interop surprises, no toolchain prereq.
- **Positive:** The `engines` floor makes the supported runtime explicit; CI can
  matrix on Node 20/22/LTS to guarantee the baseline.
- **Negative / accepted cost:** Cannot use top-level `await` or `import` syntax in
  engine source. Acceptable — CommonJS covers every need of a FS+git CLI.
- **Constraint to defend:** Any future move to ESM (adding `"type":"module"` or
  `.mjs`) is a breaking packaging change and must supersede this ADR.
