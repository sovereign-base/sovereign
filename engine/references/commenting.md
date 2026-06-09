# SOVEREIGN commenting standard

The standard `sentinel` checks code against (its commenting check). Applied by the agent to all code written under SOVEREIGN. HexDoc-style: explain intent and contract, never narrate the syntax.

## Philosophy

Comments exist for three purposes only:

1. **Why** — intent and non-obvious decisions.
2. **Contract** — what a function promises: inputs, outputs, side effects, errors.
3. **Danger** — things that will bite a future engineer.

They do **not** explain *what* the code literally does. If the code needs a comment to explain what it does, rewrite the code.

## The golden rule

> If removing the comment makes the code harder to understand, it earns its place. If removing it changes nothing, delete it.

## What gets a comment

**Always:**
- Every public function or exported module.
- Every non-obvious algorithm or calculation.
- Every place a business rule is encoded in code.
- Every external integration point.
- Every `SOVEREIGN:UNVERIFIED` marker (see [`unverified-marker.md`](./unverified-marker.md)).
- Every intentional "wrong but fast" decision.

**Never:**
- Getters/setters and self-evident utilities (`formatDate`, `isEmpty`).
- Implementation details inside a well-named private function.
- Anything the name already fully explains.
- A comment on every line — that is noise, not documentation.

## Module header (every major file)

One header block per significant module/service/context file — not one per function:

```
Handles all payment processing for the platform.

Bounded context: Payments (see CONTEXT.md)
Depends on: PaystackClient, TransactionStore
Do not call directly — go through PaymentFacade
Related ADRs: 0011 (Paystack primary), 0015 (retry strategy)
```

(Use the language's doc-comment syntax: `##` for Elixir, `/** */` for TS/JS, `""" """` for Python.)

## Function comments (public functions)

Describe the **contract**, not the body. Example (JSDoc):

```typescript
/**
 * Resolves the active payment gateway for a transaction.
 *
 * Priority: Paystack → Flutterwave → manual fallback. Fallback only fires
 * if both primary gateways return 5xx.
 *
 * @throws {GatewayUnavailableError} if all gateways are unreachable
 */
```

State what it returns, what it does NOT do (side effects it avoids), and the error modes — the things a caller can't see from the signature.

## Inline comments

Sparingly, for non-obvious logic only. One line, explaining *why* — not restating the code.

## How `sentinel` uses this

`sentinel`'s native commenting check flags: public functions/modules missing a contract comment, missing module headers on major files, integration points without an anchor reference, and noise comments that restate the code. Findings are surfaced in the Sentinel report by severity.

> Feeds CONV-02 (Phase 5), consumed by [`sentinel`](../skills/sentinel/SKILL.md). Pairs with [`skill-format.md`](./skill-format.md) and [`adr-format.md`](./adr-format.md).
