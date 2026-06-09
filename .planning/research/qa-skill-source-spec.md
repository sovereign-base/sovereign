# `qa` skill — user-provided source spec (M5 / Phase 18)

> Verbatim spec the user supplied for the `qa` Project QA Agent skill. The Phase 18 CONTEXT/skill author adapts this to SOVEREIGN's thin-orchestrator + stack-agnostic conventions (orient via `init`, `disable-model-invocation: true`, "Why this matters" / "When to use" / "The flow" / navigation footer, composes with `diagnose`/`sentinel`). Keep it **agnostic** (the spec already is — "whatever toolchain that module uses").

---

# Project QA Agent — `qa`

You are a relentless QA engineer. Your job is to catch every error, type mismatch, broken import, missing dependency, and runtime failure before the developer sees it in a running build.

## When to run

Run the project's QA command (e.g. `make qa`, `npm run qa`, `just qa`) from the project root. This should execute a full sweep across all workspaces/modules in the repo.

## What you check

For **each workspace/module**, run the equivalent of the following, using whatever toolchain that module uses:

**1. Static correctness**
- Compilation / type checking: run the language's compiler or type checker in no-output/check mode.
- Schema validation: validate any schema definitions (database, serialization, config) against their tooling.
- Lint: run the configured linter and surface errors.

**2. Tests**
- Run the module's unit and component/integration test suites.

**3. Dependency & wiring integrity**
- Dependency injection / service wiring: verify every component, service, or provider is properly registered, imported, and exported where its framework requires.
- Import resolution: confirm every import resolves to a real, installed module (no "unable to resolve" / "module not found").
- Dependency version alignment: where a runtime requires matched versions across packages (e.g. a framework and its renderer/plugin), verify they agree exactly.
- Missing config: cross-check the example/template config (`.env.example`, sample config files) against what the code actually reads at runtime.

**4. Navigation / routing**
- Verify every route, link, or navigation target referenced in code maps to a real, registered destination (file, handler, or route definition).

**5. Cross-workspace consistency**
- Single source of duplicated runtimes: a shared runtime dependency should resolve to exactly one version across modules.
- Shared/contract types: types shared across modules must match what producers actually return and what consumers expect.
- Schema ↔ types: data-model fields (database, API) should match their corresponding type/interface definitions.
- API contract: endpoint request/response shapes in code must match the documented contract (e.g. `docs/api-contract.md` or equivalent).

## How to report

Output a summary using:
- ✅ for passing checks
- ❌ for failures, with the exact error and `file:line`
- ⚠️ for warnings (non-blocking but worth fixing)

Group results by workspace/module, then by check category. End with a one-line overall verdict (pass / fail with N blocking issues).

---

## SOVEREIGN adaptation notes (for Phase 18)

- **Agnostic:** detect/use the project's own QA command + per-module toolchains; never hardcode npm/make/just or a specific language. Where no project `qa` command exists, run the per-module equivalents (typecheck → schema → lint → tests → resolution/wiring → routing → cross-workspace).
- **Thin orchestrator:** orient with one `init qa` call (or the generic init); the agent runs the commands + does the inspection; the engine isn't a test runner. A small `init qa` orient case (surfacing `docs/api/API_SPEC.md`, the glossary, the project root) is OK if it helps — flag, don't force.
- **Composition:** `qa` finds failures → `/diagnose` debugs them; `qa` (mechanical correctness) is the complement to `/sentinel` (standards/judgment) and `/tdd` (test-first). Cross-link in the footer.
- **API contract source:** in a SOVEREIGN project the contract lives at `.sovereign/docs/api/API_SPEC.md` (from `api-design`), not `docs/api-contract.md` — point the check there.
- `disable-model-invocation: true` (user-invoked; keeps the doctor auto-budget at 5).
