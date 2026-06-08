# The `SOVEREIGN:UNVERIFIED` marker (CONV-03)

SOVEREIGN's persisted record of **code written under genuine uncertainty**. The marker turns "I'm not sure this API shape is right" from a forgotten thought into a greppable, durable concern. It is the contract the `sentinel` skill **scans**, and the contract the future `anchor-docs` / `verify-self` skills (M2) will **write**. Define and scan now; block-at-gate comes later.

## The token

The literal string `SOVEREIGN:UNVERIFIED`, placed inside a **code comment**. It is language-agnostic — any comment syntax in any language is fine; the token itself is the anchor, so a single `grep -rn "SOVEREIGN:UNVERIFIED"` finds every marker across the whole tree. The scan keys on the literal token and nothing else, so it is deterministic.

## The form

```
<comment> SOVEREIGN:UNVERIFIED — <reason> | ref: <url-or-ADR> | <YYYY-MM-DD>
```

- `reason` — **required**. One phrase: what is uncertain and why.
- `ref` — optional. A docs URL or an ADR id (e.g. `ADR-011`).
- `<YYYY-MM-DD>` — optional. When the uncertainty was recorded (a re-verification anchor).

Worked examples (the comment syntax varies by language; the token does not):

```js
// SOVEREIGN:UNVERIFIED — Paystack webhook signature is HMAC-SHA512? | ref: https://paystack.com/docs/webhooks | 2026-06-08
```
```python
# SOVEREIGN:UNVERIFIED — assumes the cursor is opaque base64, not an offset | ref: ADR-014
```
```html
<!-- SOVEREIGN:UNVERIFIED — does this CDN set immutable cache headers? -->
```

## Valid contexts (when to mark)

Mark exactly when one of these is true:

1. **Unverified third-party API shape** — an endpoint, payload, or signature you have not confirmed against current docs.
2. **Assumed behavior** — a behavior you are relying on but have not proven (a default, an ordering guarantee, an idempotency promise).
3. **Stale-knowledge risk** — a library/API released or materially changed after the model's training cutoff.

Markers are set by a **human** or by the future `anchor-docs` / `verify-self` skills (M2). `sentinel` **never writes** markers — it only reads them.

## The scan rule

`sentinel` greps the changed files (or the whole tree) for the literal token and reports each hit as `file:line — reason`. Each hit becomes one entry in the reviewer's `unverified_markers` array — `{ file, line, text }` — per the consumer schema in `engine/agents/sovereign-sentinel.md`. The `reason` segment after the `—` is what surfaces in the human-facing finding.

## Gate threshold (surface now, block later)

Unresolved markers are **findings** in sentinel's report — **surfaced, not yet blocking**. A `SOVEREIGN:UNVERIFIED` marker does not fail a review on its own in M1; it makes the uncertainty visible so it can be resolved deliberately. Hard **blocking** — refusing a deployment while markers remain unresolved — is **deferred to M2** (`pre-flight`). Do not wire blocking behavior now.

> Feeds CONV-03 (Phase 4, consumed by `sentinel`) and the M2 anti-hallucination skills (`anchor-docs`, `verify-self`) + the `pre-flight` gate.
