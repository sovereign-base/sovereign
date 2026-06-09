# SOVEREIGN — Requirements (Milestone M4: Ground Truth · v1.3)

Derived from `/SOVEREIGN.md` §6 + the locked Ground Truth System design in `archive/v1/SOVEREIGN_PROJECT.md` (~lines 210-260). Builds on the verified, published M1-M3.
"User" = an engineer or agent using SOVEREIGN inside their own project.

> **M1 (v1.0, 28/28) + M2 (v1.1, 8/8) + M3 (v1.2, 8/8) shipped, verified, published (`sovereign-cli@2.0.0`).** This document scopes **M4**.

---

## M4 Requirements

### anchor-docs — anchor implementation to current external docs

- [ ] **ANCHOR-01**: A user can run `anchor-docs` to ingest external documentation the agent's training may be stale on (payment gateways, SDKs, regional/gov APIs). It stores the **URL by default** (full content opt-in, with a copyright warning, per ADR-004) under `.sovereign/external-docs/<slug>.md` with metadata headers: `source`, `version`, `date-retrieved`, `re-verify-by`.
- [ ] **ANCHOR-02**: `anchor-docs` lists anchored docs and **flags stale anchors** (those past `re-verify-by`) so the user knows what needs re-checking before relying on it. (Pre-flight deploy-gate *blocking* on stale anchors stays deferred — M4 surfaces, like bridge staleness.)

### verify-self — catch the agent's own uncertainty

- [ ] **VERIFY-01**: A user (or the agent itself) can trigger `verify-self` on low-confidence signals (about to assert a version/endpoint/config with confidence; implementing an integration without anchors; stale-knowledge API). It performs a **hard stop** and a **retroactive audit** of the code written since the last verified anchor, surfacing each specific unverified claim (file:line + what's uncertain).
- [ ] **VERIFY-02**: `verify-self` presents the three user choices — (A) provide docs (hand off to `anchor-docs`), (B) mark `SOVEREIGN:UNVERIFIED` and continue, (C) discard the unverified code and restart with docs — and on choice B emits `SOVEREIGN:UNVERIFIED` markers per the M1 spec (`engine/references/unverified-marker.md`), which `sentinel` already scans.

### Engine & cross-cutting

- [ ] **ENG-09**: A modest **zero-dependency** engine surface backs anchoring: an `anchor` command (store/list/check-stale external-doc metadata under `.sovereign/external-docs/`, computing staleness from `re-verify-by`) + `init anchor-docs` / `init verify-self` workflows. Tested (`node --test`); deps stay `{}`.
- [ ] **M4-CC**: Both M4 skills are core-tier thin orchestrators per `skill-format.md` / ADR-014 — one `sovereign-tools init <skill>` orient call, "Why this matters", recommendation-first, navigation footer — and are **user-invoked** (`disable-model-invocation: true`), so `sovereign-tools doctor` still reports the auto-trigger budget at the 5 Fast Lane skills. `validate skills` passes for both. They compose (`verify-self` → `anchor-docs`; markers → `sentinel`).

---

## Deferred (M5+)

- Pre-flight deploy-gate that BLOCKS on stale anchors or unresolved `SOVEREIGN:UNVERIFIED` markers (M4 surfaces only).
- Tracks layer (ADR-014 — the DSA + database skills home).
- Operations phase (`onboard`/`feature`/`incident`/`health-check`/`deprecate`), multi-model Council (`--deep`), microservices overlay, IoT/embedded tracks.
- Auto-fetching/refreshing anchor content from URLs (M4 stores URLs + metadata; the agent fetches on demand — no engine HTTP client).

---

## Out of Scope

- An engine HTTP/fetch client — anchoring stores URLs + metadata + (opt-in) user-pasted content; the agent does any fetching with its own tools (keeps the engine zero-dep + offline-deterministic).
- Storing proprietary doc content by default — URLs by default, content opt-in with a copyright warning (ADR-004).
- Auto-resolving low-confidence without the user — `verify-self` surfaces + offers choices; it never silently continues.

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ENG-09 | Phase 14 | Pending |
| ANCHOR-01 | Phase 15 | Pending |
| ANCHOR-02 | Phase 16 | Pending |
| VERIFY-01 | Phase 16 | Pending |
| VERIFY-02 | Phase 16 | Pending |
| M4-CC | Phase 15 + Phase 16 (cross-cutting) | Pending |

**Coverage: 6/6 M4 requirements mapped.** Each requirement maps to exactly one phase; M4-CC is the cross-cutting gate applied to both skill phases (15 and 16). ANCHOR-02 (list + flag-stale) is assigned to Phase 16, where the full anchor→verify→sentinel loop closes and stale-anchor surfacing is exercised end-to-end via the `verify-self`→`anchor-docs` composition.
