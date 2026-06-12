---
name: anchor-docs
description: Anchor your implementation to current external documentation — capture the URL (and metadata) of the payment-gateway, SDK, or regional/gov-API docs you're building against, and see which anchors have gone stale so you re-check before trusting stale knowledge. Use when integrating against docs your training may be behind on.
disable-model-invocation: true
argument-hint: "[doc URL or anchor id]"
---

## Why this matters

Your training has a cutoff. The payment gateway changed its API last month; the SDK renamed a method; the regional tax authority moved an endpoint. When you implement against what you *remember*, you ship confident, plausible, wrong code — and the failure shows up in production, not review.

`anchor-docs` fixes the ground truth. It records *which* external doc you're building against — by URL, with the version and the date you retrieved it — so the next session (and every teammate) integrates against the same source, and so you can ask the engine *which anchors have gone stale* before you rely on them again. It's the anchor half of the anti-hallucination loop: anchor to a real doc now, and `verify-self` (when you're unsure later) can point you back here.

## When to use this

When you're about to implement against external documentation the model's training may be behind on — a payment gateway, a third-party SDK, a cloud or regional/gov API, anything versioned and not yours. Run it when you start the integration, and re-run it (or `anchor check`) when you come back to that code later.

**Don't** use it as a general bookmark manager or a wiki — it's for the docs your *code* depends on being current. And don't paste a doc's full text in without reading the copyright step below; the URL is the safe default.

## The flow

A **thin orchestrator** — the engine (`anchor.cjs`) owns all storage, slug-sanitization, default dates, and staleness math; this skill owns the *judgment*: which docs to anchor, what re-verify cadence to recommend, and the copyright call on storing full content.

**1 — Orient (one call).**
```bash
INIT=$(node ".claude/sovereign-engine/sovereign-tools.cjs" init anchor-docs)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```
Parse `paths.external_docs_dir` (`.sovereign/external-docs/`) and `mcp.available`. No other orientation reads.

**MCP-aware (re-fetch):** if `mcp.available` lists a docs server, prefer its `mcp__<id>__*` tools to fetch the *current* doc you're anchoring (and to re-fetch a stale one) — it's more reliable than a raw URL pull. If none is attached, use the URL/web and say so. Attach one with `/mcp-attach`. (No silent fallback — name which path you took.)

**2 — Surface staleness FIRST.**
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor check
```
This returns `{ anchors, stale_count }`. If `stale_count > 0`, name the stale anchor ids and tell the user to re-fetch and re-check those before relying on them — that's the "know what's gone stale" half of the job. (Greenfield — no anchors yet — returns an empty set; just continue.)

**3 — Gather the doc to anchor (the judgment).** Decide the `--id` (a short slug like `stripe-payment-intents`), the `--source` URL, the `--version` label if the doc shows one (else omit → the engine records `unknown`), and a re-verify cadence: **recommend** shorter for fast-moving payment/SDK APIs, longer for stable gov specs — or omit `--re-verify-by` and let the engine default to date-retrieved + 90 days.

**4 — URL-by-default vs. full content (the copyright call).**
> **Recommendation: store the URL only (the default).** SOVEREIGN anchors store the source URL + metadata so you can re-fetch the *current* doc on demand — the safe, non-infringing path.
>
> **Copyright warning — only if you choose `--content`:** Pasting a third-party doc's full text into this repo commits someone else's copyrighted content into your version control. Many docs (payment gateways, SDKs, gov/regional APIs) are licensed in ways that prohibit redistribution. Store full content **only** when you've confirmed the license permits it (or it's your own / public-domain material), and treat it as a deliberate, informed choice. When in doubt, keep the URL and re-fetch.

See **ADR-004** for the URL-by-default / content-opt-in policy.

**5 — Anchor it (delegate to the engine).** URL-only (the default, safe path):
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor add \
  --id stripe-payment-intents \
  --source "https://docs.stripe.com/api/payment_intents" \
  --version "2024-06-20"
```
Only after the user opts in past the copyright warning, with full content:
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor add \
  --id stripe-payment-intents \
  --source "https://docs.stripe.com/api/payment_intents" \
  --content @./fetched-doc.md     # or:  --content -   (stdin)
```
Never hand-write the anchor file — the engine owns the `<slug>.md` format and the `source`/`version`/`date-retrieved`/`re-verify-by`/`content-stored` headers.

**6 — Confirm.**
```bash
node ".claude/sovereign-engine/sovereign-tools.cjs" anchor list
```
Show the user the new anchor and the current stale summary.

**7 — Persist.** `node ".claude/sovereign-engine/sovereign-tools.cjs" state save` (regenerates MANIFEST), then commit via `sovereign-tools commit` if `commit_docs` is on, so the anchors travel with the repo.

## Navigation

```
▶ NEXT
  Anchored. Build against the URL you just captured — and re-fetch the live doc
  rather than trusting memory.

  • Unsure about a specific version/endpoint/config as you build? → /verify-self
    (it hard-stops, audits unverified code, and can hand back here for docs)
  • Coming back later? → run anchor-docs again (or `anchor check`) to see what's
    gone stale before you rely on it.

  Note: anchor-docs records ground truth; it does NOT emit SOVEREIGN:UNVERIFIED
  markers — that's /verify-self, and /sentinel scans for them.
```
