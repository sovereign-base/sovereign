# SOVEREIGN Commenting Standard

<!--
  Referenced by /code-patterns during Phase 4 construction.
  Applied automatically by the agent to all code written under SOVEREIGN.
  Enforced by /sentinel Tier 1 native review.
-->

---

## Philosophy

Comments exist for three purposes only:

1. **Why** — explain intent and non-obvious decisions
2. **Contract** — describe what a function promises (inputs, outputs, side effects, errors)
3. **Danger** — flag things that will bite future engineers

They do NOT explain what the code literally does. If the code needs
a comment to explain what it does, rewrite the code.

---

## The Golden Rule

> If removing the comment makes the code harder to understand,
> the comment earns its place.
> If removing it changes nothing, delete it.

---

## What Gets a Comment

**Always:**

- Every public function or exported module
- Every non-obvious algorithm or calculation
- Every place a business rule is encoded in code
- Every external integration point
- Every `SOVEREIGN:UNVERIFIED` marker
- Every intentional "wrong but fast" decision

**Never:**

- Getters and setters
- Self-evident utility functions (`formatDate`, `isEmpty`, `isNil`)
- Implementation details inside a well-named private function
- Anything the variable or function name already fully explains
- Every line (this is not the goal)

---

## Module Header (Required on every major file)

Every significant module, controller, service, or context file gets
a header block at the top. One per file. Not one per function.

**Elixir:**

```elixir
## Handles all payment processing for the platform.
##
## Bounded context: Payments (see CONTEXT.md)
## Depends on: PaystackClient, TransactionStore, AuditLog
## Do not call directly — go through PaymentFacade
## Related ADRs: ADR-011 (Paystack as primary), ADR-015 (retry strategy)
## ANCHOR: docs/external/paystack-v3.md
```

**TypeScript:**

```typescript
/**
 * Handles all payment processing for the platform.
 *
 * Bounded context: Payments (see CONTEXT.md)
 * Depends on: PaystackClient, TransactionStore, AuditLog
 * Do not call directly — go through PaymentFacade
 * Related ADRs: ADR-011 (Paystack as primary), ADR-015 (retry strategy)
 * ANCHOR: docs/external/paystack-v3.md
 */
```

**Python:**

```python
"""
Handles all payment processing for the platform.

Bounded context: Payments (see CONTEXT.md)
Depends on: PaystackClient, TransactionStore, AuditLog
Do not call directly — go through PaymentFacade
Related ADRs: ADR-011 (Paystack as primary), ADR-015 (retry strategy)
ANCHOR: docs/external/paystack-v3.md
"""
```

---

## Function Comments (Public functions only)

**Elixir — HexDoc style:**

```elixir
## Calculates the weighted score for a given user.
##
## Score is a composite of engagement rate, reach, and consistency
## over a rolling 30-day window. See ADR-012 for scoring rationale.
##
## Returns {:ok, score} where score is a float 0.0–100.0.
## Returns {:error, :insufficient_data} if fewer than 7 days of
## activity history exist.
##
## Does NOT persist — call Scores.save/2 after this if needed.
@spec calculate(user_id :: integer()) :: {:ok, float()} | {:error, atom()}
def calculate(user_id) do
```

**TypeScript — JSDoc style:**

```typescript
/**
 * Resolves the active payment gateway for a transaction.
 *
 * Priority order: Paystack → Flutterwave → manual fallback.
 * Fallback only triggers if both primary gateways return 5xx.
 * See ANCHOR: docs/external/paystack-v3.md for API contract.
 *
 * @param transaction - The transaction requiring a gateway
 * @returns The resolved gateway instance
 * @throws {GatewayUnavailableError} if all gateways are unreachable
 */
async function resolveGateway(transaction: Transaction): Promise<Gateway> {
```

**Python:**

```python
def calculate_score(user_id: int) -> tuple[float, None] | tuple[None, str]:
    """
    Calculates the weighted score for a given user.

    Score is a composite of engagement rate, reach, and consistency
    over a rolling 30-day window. See ADR-012 for scoring rationale.

    Returns (score, None) where score is a float 0.0–100.0.
    Returns (None, error_code) if fewer than 7 days of history exist.

    Does NOT persist — call save_score() after this if needed.
    """
```

---

## Inline Comments (Sparingly)

Use for non-obvious logic only. One line. No period at end.

```typescript
// Multiply by 100 — Paystack expects amounts in kobo, not naira
const amount = transaction.amount * 100;

// Retry up to 3 times with exponential backoff — see ADR-015
const result = await withRetry(() => gateway.charge(payload), 3);
```

Bad inline comment (explains the obvious):

```typescript
// Set the user's name
user.name = payload.name; // ← delete this
```

---

## SOVEREIGN:UNVERIFIED Marker

When the agent proceeds with uncertain information, it marks the code:

```typescript
// ⚠️ SOVEREIGN:UNVERIFIED — Flutterwave webhook signature algorithm
// Confidence: LOW | Reason: No anchor docs provided
// Verify against: https://developer.flutterwave.com/docs/webhooks
// Generated: 2026-06-07 | Review before: 2026-07-07
const isValid =
  crypto
    .createHmac("sha512", secretHash) // ← VERIFY THIS ALGORITHM
    .update(JSON.stringify(body))
    .digest("hex") === signature;
```

These markers are:

- Scanned by `/sentinel` on every review
- Scanned by `/pre-flight` before deployment
- Blocking by default at the deployment gate

---

## ADR References in Code

When code directly implements an architectural decision, reference it:

```elixir
# ADR-003: JWT chosen over sessions for stateless horizontal scaling
{:ok, token} = JWT.sign(claims, secret)
```

---

## Danger Comments

For code that is correct but fragile or counterintuitive:

```typescript
// ⚠️ DANGER: SET LOCAL must be wrapped in an explicit transaction.
// Without BEGIN/COMMIT, the RLS policy leaks across connections.
// See: https://www.postgresql.org/docs/current/sql-set.html
await db.query("BEGIN");
await db.query(`SET LOCAL app.tenant_id = '${tenantId}'`);
```

---

## What Good Looks Like

A well-commented module feels like reading a technical brief —
you understand what it does, why it exists, what it promises,
and what to watch out for. In under 60 seconds. Without reading
the implementation.

A poorly-commented module makes you read every line to understand
anything, or buries you in comments that explain what the code
literally does instead of why it does it.

---

_Enforced by: /sentinel Tier 1 | /code-patterns | /security-review_  
_sovereign-base/sovereign v1.0.0_
