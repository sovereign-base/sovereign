# ADR format

How SOVEREIGN records architectural decisions. Consumed by `grill-with-docs` (which offers an ADR when a decision crystallizes) and by any skill that locks a non-obvious choice.

## Location & numbering

ADRs live in `.sovereign/docs/adr/`, sequentially numbered: `0001-slug.md`, `0002-slug.md`, … Scan the directory for the highest number and increment. Create the directory lazily — only when the first ADR is needed.

## The minimal form

An ADR can be **one to three sentences**: what the context was, what you decided, and why. That's it. The value is recording *that* a decision was made and *why* — not filling out a template.

```markdown
# 0007-paystack-over-flutterwave

We use Paystack as the primary payment gateway, not Flutterwave, because its
settlement is faster in our launch market and its webhook signing is simpler to
verify. Flutterwave stays as a documented fallback (see 0011).
```

Optional sections — include only when they genuinely add value (most ADRs need none):
- **Status** frontmatter (`proposed | accepted | deprecated | superseded by NNNN`) — when decisions get revisited.
- **Considered options** — when the rejected alternatives are worth remembering.
- **Consequences** — when non-obvious downstream effects need calling out.

## When to offer an ADR (the three-condition gate)

Offer an ADR **only when all three are true**:

1. **Hard to reverse** — the cost of changing your mind later is meaningful.
2. **Surprising without context** — a future reader will look at the code and wonder "why on earth did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons.

If a decision is easy to reverse, skip it — you'll just reverse it. If it isn't surprising, nobody will wonder. If there was no real alternative, there's nothing to record. **Offer ADRs sparingly** — a directory full of trivial ADRs is as useless as none.

### What qualifies
- Architectural shape ("the write model is event-sourced; reads project into Postgres").
- Integration patterns between contexts ("Ordering and Billing talk via domain events, not synchronous HTTP").
- Technology choices that carry lock-in (database, message bus, auth provider) — not every library.
- Boundary / scope decisions, including the explicit *no*s.
- Deliberate deviations from the obvious path ("manual SQL instead of an ORM because X") — these stop the next engineer from "fixing" something intentional.
- Constraints not visible in the code ("must stay under 200ms for the partner SLA").

> Feeds CONV-02 (Phase 5). Pairs with [`skill-format.md`](./skill-format.md) and [`commenting.md`](./commenting.md).
