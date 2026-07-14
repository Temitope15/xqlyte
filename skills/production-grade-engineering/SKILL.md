---
name: production-grade-engineering
description: Use this skill continuously, on every fragment of every phase, alongside whichever domain skill (rust-core-engine, sdk-cli-wasm, dashboard-and-bot) applies. It defines the code-quality bar — clean code, SOLID boundaries, error handling, testing discipline, observability, security, and scalable architecture patterns — that all XQlyte code must meet regardless of which crate or package it lives in. Trigger before writing code, and again during the "verify" step of every fragment as a self-review checklist.
---

# Production-Grade Engineering Standards

## Why this exists
It's easy to build something that demos well and collapses under any real load,
review, or maintenance. XQlyte is pitched as *infrastructure* — judges and future
adopters will look at the code, not just the demo. This skill is the bar every
fragment must clear before it's considered "done," on top of whatever the domain
skill (engine/SDK/dashboard/bot) specifies functionally.

Use this as a **checklist at the end of every fragment**, not just a set of ideals to
aspire to. If a fragment fails any "must" item below, it is not done yet.

## 1. Clean code, always
- **Small, single-purpose functions.** If you can't name a function without "and"
  in the name, split it.
- **Names say what, types say shape, comments say why.** Don't comment what the code
  already says; comment the non-obvious *reason* for a decision (e.g. "using 30 as
  the route-score cap per PRD, not tunable without updating docs/DATA_MODELS.md").
- **No magic numbers.** Every threshold from the confidence model, every timeout,
  every retry count is a named constant with a comment pointing at its source of
  truth (usually a skill file or `docs/DATA_MODELS.md`).
- **No dead code, no commented-out code, no TODO without a linked task** in
  `docs/TASK_BREAKDOWN.md`. If it's not ready, it doesn't ship in the commit.
- **Consistent formatting is non-negotiable and automated**, never manual: `cargo
  fmt` + `cargo clippy -- -D warnings` for Rust, `prettier` + `eslint` for
  TS/JS. Run them before every commit — treat lint failures like compile failures.

## 2. Architecture boundaries (SOLID, applied practically)
- **Single Responsibility**: each analyzer, each API route handler, each React
  component does one job. If a module both fetches data and formats it for display,
  split it.
- **Dependency direction flows inward.** `engine` never imports `rpc`, `cli`,
  `api-server`, or anything UI-facing. `rpc` never imports `engine`. This isn't
  bureaucracy — it's what lets `engine` be unit-tested with zero I/O and reused
  identically from CLI, WASM, and the API server.
- **Depend on traits/interfaces at boundaries, not concrete types.** `FiberRpcClient`
  as a trait (Rust) or a typed interface (TS) is the pattern — anywhere a component
  needs "the outside world," it should accept an abstraction it can be tested
  against, not reach for a concrete live implementation directly.
- **No God objects.** If a struct/class/module is growing a new method every
  fragment regardless of topic, it's accreting responsibilities — stop and split it
  before continuing.
- **Composition over inheritance/deep hierarchies** — in Rust this is natural
  (traits + structs); in the TS/React layer, prefer small composable components and
  hooks over deep class hierarchies or prop-drilled mega-components.

## 3. Error handling — never swallow, never panic in library code
- **Rust**: library crates (`engine`, `rpc`, `sdk-rust`, `sdk-wasm`) return
  `Result<T, XqlyteError>` — never `unwrap()`/`expect()`/`panic!()` outside of tests
  and `main()`. Define a proper `XqlyteError` enum (via `thiserror`) with variants
  that map cleanly onto the failure taxonomy categories, not a generic string error.
- **TS/JS**: no silent `catch {}` blocks. Every caught error either handles the case
  meaningfully, re-throws with added context, or is logged with enough context to
  debug later — never all three skipped at once.
- **Fail loud in development, fail gracefully in production.** The dashboard/bot
  should never show a raw stack trace to an end user; they should show the
  human-readable failure taxonomy explanation and log the technical detail
  server-side.
- **Every external call (RPC, HTTP, DB) has a timeout and a defined behavior on
  failure** (retry with backoff, or degrade to `UNKNOWN` per the confidence model
  spec — never hang indefinitely).

## 4. Testing discipline
- **Test pyramid, not ice-cream-cone**: many fast unit tests (analyzers, scoring,
  taxonomy mapping), fewer integration tests (CLI end-to-end against mock RPC, API
  server endpoints), a handful of smoke tests (WASM in a browser, bot commands,
  dashboard pages render).
- **Every bug fix gets a regression test** before the fix is considered complete —
  reproduce it as a failing test first when practical.
- **Tests must be deterministic.** No tests that depend on real network calls, real
  clocks without freezing, or ordering between test files. This is why the mock RPC
  client with fixed fixtures exists — use it everywhere except the isolated Phase 9
  live-RPC tests.
- **Coverage is a signal, not a target.** Don't chase a percentage; make sure the
  scoring formula, the failure taxonomy mapping, and every public API function have
  real tests, even if some UI glue code doesn't.

## 5. Security baseline
- **No secrets in code or git history.** Bot tokens, RPC credentials, any API keys
  live in environment variables / `.env` (gitignored) with a `.env.example`
  committed instead.
- **No private keys anywhere in XQlyte**, full stop — this is also a PRD requirement,
  not just a general best practice. XQlyte only ever reads public network state.
- **Validate and sanitize all external input** at the boundary (Request Validator
  for the engine, input parsing for the CLI, request body validation for the API
  server, argument parsing for the bot) — never trust a payment amount, asset
  string, or route from outside without validation before it reaches core logic.
- **Dependency hygiene**: run `cargo audit` and `npm audit` before submission; don't
  pull in a new dependency for something 10 lines of code can do.
- **Least privilege**: the API server should bind to localhost by default for the
  hackathon demo unless a public dashboard is explicitly needed — don't
  accidentally expose an unauthenticated payment-analysis endpoint to the internet.

## 6. Observability (even a hackathon MVP needs this)
- **Structured logging**, not `println!`/`console.log` scattered around — use
  `tracing` (Rust) and a structured logger (TS) with consistent fields (request id,
  component, outcome) so the log store powering the dashboard is genuinely useful,
  not an afterthought bolted on in Phase 8.
- **Every request through the API server gets a request id** that shows up in logs
  end-to-end (RPC layer → engine → API response) — this is what makes the Payment
  Explorer dashboard page and CLI `log` command actually debuggable.
- **Metrics that matter for this product**: success/failure rate, confidence score
  distribution, failure category counts, RPC latency — these are literally the
  dashboard's Overview page, so instrument for them from Phase 8 onward, not
  retrofitted later.

## 7. Scalability & performance patterns (design for it now, even if you don't need it yet)
- **Stateless core engine.** `engine` functions are pure — no global mutable state —
  so the API server can be horizontally scaled trivially later (PRD explicitly lists
  this as a non-functional requirement).
- **Cache RPC reads with a short TTL** in the `rpc` layer (route/channel/node data
  goes stale in seconds per the PRD's data-freshness requirement) — don't refetch
  the same channel data three times in one `can_pay()` call.
- **Async all the way down** in Rust (`tokio`) for any I/O-bound path (RPC calls,
  API server handlers) — don't block a thread on network I/O.
- **Pagination on anything that returns a list** (`/logs`, route candidates, CLI
  `log --recent`) — never assume a list stays small.
- **Know your Big-O.** Route/asset/liquidity scoring should be linear in
  hops/candidates, not quadratic — if an analyzer loops over routes inside a loop
  over hops inside a loop over assets, stop and restructure before it becomes a
  performance bug nobody notices until the log store has real volume.

## 8. Documentation & maintainability
- **Every public function (the 8-function API surface especially) has a doc comment**
  covering: purpose, inputs, outputs, error cases, and one usage example — these
  doc comments are also your fastest path to the "API documentation" hackathon
  submission requirement.
- **README per crate/package** with "what this is, how to build it, how to test it"
  — three sentences is enough, but it must exist.
- **`docs/DATA_MODELS.md` stays the single source of truth for types** — if code and
  docs ever disagree, that's a bug to fix immediately, not a doc to quietly ignore.
- **Commit messages explain why, not just what** (`git log` should read like a
  changelog a new contributor could follow).

## 9. Git & CI hygiene
- **One fragment = one (or a few) focused commit(s)**, never one giant "build
  everything" commit — this is also what makes the phase-by-phase build prompt
  actually auditable.
- **Trunk-based, short-lived branches if you branch at all** — for a hackathon
  timeline, avoid long-lived feature branches that drift and become painful to merge.
- **Add a CI workflow (GitHub Actions) as soon as Phase 0 is done**: `cargo fmt
  --check`, `cargo clippy -- -D warnings`, `cargo test --workspace`, and the
  JS/TS equivalents once those packages exist. A red CI badge on a "production-grade
  infrastructure" submission undercuts the pitch — keep it green from day one.

## 10. Self-review checklist (run this at the end of every fragment)
- [ ] `cargo fmt && cargo clippy -- -D warnings && cargo test --workspace` all pass
  (and TS equivalents where relevant)
- [ ] No `unwrap()`/`expect()`/`panic!()` outside tests and `main()`
- [ ] No secrets, no dead code, no unlinked TODOs
- [ ] New/changed public functions have doc comments + at least one test
- [ ] Dependency direction still flows inward (engine still has zero I/O imports)
- [ ] Logs for this fragment's code path are structured, not ad-hoc prints
- [ ] `docs/DATA_MODELS.md` still matches the actual code
- [ ] Commit message explains why this fragment exists, referencing the phase/task
  number from `docs/TASK_BREAKDOWN.md`

If any box is unchecked, the fragment isn't done — fix it before starting the next
one. This checklist is cheap now and expensive to retrofit after Phase 9.
