---
name: qa
description: Sweep the whole repo for correctness before it fails in a running build — type mismatches, broken imports, unregistered wiring, missing config, dead routes, and contract drift, caught per module with the project's own toolchain. Use before a commit, a PR, or a build, or whenever the wiring feels shaky.
disable-model-invocation: true
argument-hint: "[module or 'all']"
---

## Why this matters

The errors that hurt most are the boring ones: a renamed type the caller still uses the old way, an import that resolves to nothing, a provider that was never registered, an `.env` key the code reads but the example never lists, a route pointing at a handler that moved. Each is invisible until something runs — and by then it's in a build, a demo, or production.

`qa` is the relentless sweep that surfaces them first. It runs every check class across every workspace/module using **the project's own toolchain** — never a runner SOVEREIGN imposes — and reports each result plainly so nothing hides. It's a thin orchestrator: it drives your tools and hands real failures to `/diagnose`; it is the *mechanical correctness* complement to `/sentinel` (which judges standards).

## When to use this

Before a commit, a PR, or a build; after a large change or a merge; or any time the wiring feels shaky and you want the truth before you ship.

**Don't** treat it as a standards review (that's `/sentinel`), a fix tool (it reports; `/diagnose` debugs a specific `❌`), or a reason to skip writing tests (that's `/tdd`). It surfaces breakage — it doesn't paper over it.

## The flow

A **thin orchestrator** — coverage + discipline are the value; the project's own tools do the checking.

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init qa)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Note the workspaces/modules in the repo and the API contract at `.sovereign/docs/api/API_SPEC.md` (if present).

**2 — Run the sweep.** If the project has its **own `qa` command** (a build target, a configured script, a task runner — detect it, don't assume), run that from the repo root for the full sweep. Otherwise run the **per-module** equivalents below. Either way, for **each workspace/module**, cover all five classes using whatever toolchain that module uses:

- **Static correctness** — compile / type-check in check mode (no output); validate schema definitions (database, serialization, config) against their tooling; run the configured linter and surface errors.
- **Tests** — run the module's unit + integration/component suites.
- **Dependency & wiring integrity** — every component/service/provider is registered, imported, and exported where its framework requires; every `import` resolves to a real installed module (no "module not found"); matched-`version` requirements agree exactly; the example/template `config` (`.env.example`, sample config) matches what the code actually reads at runtime.
- **Navigation / routing** — every route, link, or navigation target referenced in code maps to a real, registered destination (file, handler, or route).
- **Cross-workspace consistency** — a shared runtime resolves to exactly one `version` across modules; shared/contract types match what producers return and consumers expect; data-model fields match their type/interface definitions; endpoint request/response shapes match the documented contract in `.sovereign/docs/api/API_SPEC.md`.

**3 — Report.** Group by module, then by category. Mark `✅` pass, `❌` failure (with the exact error and `file:line`), `⚠️` warning (non-blocking but worth fixing). End with a one-line **verdict**:
```
## QA — <repo or module>

### <module-a>
  Static correctness   ✅
  Tests                ❌  TypeError: cursor is not iterable  src/list.ts:42
  Dependency & wiring   ⚠️  unpinned shared runtime version   package manifest
  Navigation/routing    ✅
  Cross-workspace       ❌  response shape ≠ API_SPEC.md       src/api/orders.ts:18

### <module-b>
  …

Verdict: ❌ FAIL — 2 blocking issues (1 module clean)
```

**4 — Hand off.** For each `❌`, run `/diagnose <the failure>` to find the root cause (don't guess-patch). Re-run `qa` until the verdict is `✅`. Then `/sentinel` for the standards pass.

## Navigation

```
▶ NEXT
  You have the truth about what's broken — not a hopeful "looks fine."

  • Any ❌? → /diagnose each one (root cause, not a patch), then re-run qa.
  • Verdict ✅? → /sentinel for the standards pass before you ship.
  • Contract drift (≠ API_SPEC.md)? → reconcile code and the contract, not just code.

  qa is mechanical correctness; /sentinel is standards; /diagnose is root-cause.
  Run qa early and often — the boring errors are the cheap ones to catch here.
```
