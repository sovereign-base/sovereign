# Security controls reference (control classes)

The concrete-controls companion to `security-design`'s layered model. The layered model says *what you're defending*; this says *which controls must actually be present* — as **classes**, not library calls. It is **stack-agnostic on purpose**: every class applies in any language/framework; the *implementation* is yours. `security-design` consults this list, offers it as a coverage checklist, and surfaces the classes a design hasn't accounted for.

Each class: **what it is · why it bites · what to verify.** Verify the *property*, not a specific tool.

---

## 1. Input validation

**What it is:** Treat every input crossing a trust boundary (request bodies, query/path params, headers, uploads, message-queue payloads, inter-service calls, env/config) as hostile until proven safe — validate type, range, length, format, and encoding against an **allow-list** at the boundary, and reject (don't "sanitize-and-hope") what doesn't fit.

**Why it bites:** Almost every other class downstream (injection, overflow, logic abuse) starts with input that was trusted too early. "We validate on the client" is not validation — the boundary is the server.

**What to verify:** every external entry point validates before use; validation is allow-list (not deny-list); canonicalize/normalize before checking (no encoding bypass); reject + log on failure; size/length caps on every collection, string, and upload.

## 2. Injection

**What it is:** Untrusted data interpreted as code/structure by a downstream interpreter. Covers **SQL/NoSQL**, **command/shell**, **XSS** (HTML/JS), **SSRF** (URL → internal network), **template** (SSTI), **deserialization**, **path traversal**, and **header/log** injection.

**Why it bites:** A single unparameterized query or unescaped render hands over data, the database, the host, or the internal network. It's the most-exploited class, year over year.

**What to verify:** parameterized queries / prepared statements everywhere (no string-built queries); context-aware output encoding for every sink (HTML, attribute, JS, URL, shell); no user input in shell/`eval`/dynamic-template/deserialization paths; outbound URLs validated against an allow-list (SSRF); file paths confined to an intended root (no `..` traversal).

## 3. Authentication, authorization & IDOR

**What it is:** **AuthN** = proving who the caller is; **AuthZ** = checking they may do *this* to *this resource*; **IDOR** = the failure where an authenticated user reaches another's object by changing an id. Authorization is checked **server-side, on every access, against the actual resource owner** — never inferred from a client-supplied id or a hidden field.

**Why it bites:** Broken access control is consistently the #1 web risk. The endpoint authenticates fine, then returns `/orders/1002` to whoever asks because nothing checked ownership.

**What to verify:** every protected route authenticates; every data access authorizes against the *current principal* and the *resource's* owner/tenant; object ids are unguessable or ownership-checked (no IDOR); no authorization decision trusts client input (role, tenant, id in body/JWT-claim-without-verification); default-deny.

## 4. Secrets handling

**What it is:** Credentials, API keys, tokens, signing/encryption keys, connection strings — kept out of source, logs, and client bundles; injected at runtime; least-privilege; rotatable.

**Why it bites:** A key in git history or a log line is a key in the attacker's hands, retroactively. Long-lived shared secrets turn one leak into total compromise.

**What to verify:** no secret in code, VCS history, client bundles, or logs; secrets injected via environment/secret-store at runtime; each secret least-privilege + scoped; rotation is possible and dated; the example/template config lists every key the code reads (names only, never values).

## 5. Rate-limiting & abuse prevention

**What it is:** Bounding how often a caller can hit expensive, sensitive, or state-changing paths — and degrading safely under load — so the system resists brute-force, scraping, enumeration, and resource exhaustion.

**Why it bites:** Without limits, login becomes a credential-stuffing oracle, a password-reset becomes spam, an expensive query becomes a denial-of-service, and an unbounded loop/recursion takes the service down on its own.

**What to verify:** auth, password-reset, and write/expensive endpoints are throttled (per-IP *and* per-principal); enumeration is blunted (uniform responses/timing); pagination + result caps on list endpoints; timeouts + backpressure on outbound calls and heavy work; abuse is observable (logged/alertable).

---

## How `security-design` uses this

1. Walk the layered model (auth, data, application, infrastructure, AI/agent).
2. Run this list as a **coverage checklist** against the current design.
3. For each class, recommendation-first: state the control the design should have, or flag it **uncovered**.
4. On re-run, surface the classes still uncovered — coverage is the bar, not a one-time pass.

It stays at the level of *classes + what-to-verify*; the project implements each with its own stack. (A future `security-review` skill can audit existing code against this same list.)
