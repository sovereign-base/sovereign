# ADR-004: External-doc anchors store the URL by default; full content is opt-in behind a copyright warning

**Status:** Accepted
**Date:** 2026-06-09

## Context

`anchor-docs` anchors implementation to current external documentation (payment
gateways, SDKs, regional/gov APIs) the agent's training may be stale on. The
tempting move is to store the full doc text in the repo so it's always available.
But third-party documentation is copyrighted, and many sources are licensed in
ways that prohibit redistribution — committing their full text into a user's
version control can infringe. The engine (`anchor.cjs`) is deliberately
content-agnostic: it stores whatever it's handed and never fetches a URL itself.
So the copyright judgment has to live somewhere — and it can't be in the engine.

## Decision

External-doc anchors store the **source URL + metadata by default**
(`source`, `version`, `date-retrieved`, `re-verify-by`). Full document content is
stored **only on explicit opt-in** (`anchor add --content @file|-`), and the
`anchor-docs` skill MUST surface a **copyright/licensing warning** before that
opt-in. The engine stays content-agnostic — it stores what it's given; the
warning and the URL-by-default recommendation live at the **skill layer**.

## Consequences

- (+) The safe path is the default: URLs are non-infringing and let the agent
  re-fetch the *current* doc, which is the whole anti-staleness point.
- (+) The engine stays zero-dep, offline-deterministic, and free of any
  copyright/fetch logic.
- (+) Storing full content remains possible for the user's own or
  permissively-licensed material — it's just a deliberate, warned choice.
- (−) Default anchors depend on the URL still resolving at re-fetch time
  (mitigated by `version` + `date-retrieved` metadata and the `re-verify-by`
  staleness check).
