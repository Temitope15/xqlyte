---
name: rust-core-engine
description: Use this skill whenever writing, structuring, or modifying the XQlyte Rust core engine — the workspace layout, the PaymentRequest/PaymentConfidenceResult/FailureDiagnostics types, the six analyzers (Route, Asset, Liquidity, Fee, Confidence Model, Failure Classifier) and the Suggestion Engine. This is the source-of-truth spec for the engine's scoring formula and failure taxonomy — do not improvise different numbers or category names. Trigger for any task touching crates/engine/*, crates/rpc/*, or crate-level Cargo.toml decisions.
---

# XQlyte Rust Core Engine

## Workspace layout (create exactly this shape)
```
xqlyte/
  Cargo.toml                 # workspace root
  crates/
    engine/                  # xqlyte-engine: pure logic, no I/O
      src/
        types.rs             # PaymentRequest, PaymentConfidenceResult, FailureDiagnostics, etc.
        validator.rs          # Request Validator
        route_analyzer.rs
        asset_analyzer.rs
        liquidity_analyzer.rs
        fee_analyzer.rs
        confidence_model.rs
        failure_classifier.rs
        suggestion_engine.rs
        lib.rs                # pub fn can_pay(), diagnose_failure(), confidence_score(), best_asset(), best_route(), analyze_route(), analyze_asset(), log_result()
    rpc/                      # xqlyte-rpc: FiberRpcClient trait + Live + Mock impls
      src/
        client.rs             # trait FiberRpcClient
        live.rs                # LiveFiberRpcClient (real fnn JSON-RPC)
        mock.rs                # MockFiberRpcClient (deterministic fixtures)
        types.rs               # ChannelData, RouteData, AssetData, NodeData, FeeData, SwapData
    sdk-rust/                 # thin ergonomic wrapper re-exporting engine + rpc (see sdk-cli-wasm skill)
    sdk-wasm/                 # wasm-bindgen bindings (see sdk-cli-wasm skill)
    cli/                      # xqlyte CLI binary (see sdk-cli-wasm skill)
```

`engine` MUST have zero network/RPC code in it — it only accepts already-fetched
`ChannelData`/`RouteData`/etc. as plain arguments and returns plain results. This is
what makes it unit-testable and reusable across CLI/dashboard/bot/WASM. The `rpc`
crate is the only place that talks to Fiber; something above the engine (SDK, CLI)
is responsible for calling `rpc` then handing the data to `engine`.

## Core types (do not rename these fields — SDK/CLI/dashboard/bot all depend on them)

```rust
pub struct PaymentRequest {
    pub sender: String,
    pub receiver: String,
    pub amount: f64,
    pub asset: String,
    pub metadata: Option<serde_json::Value>,
}

pub enum PaymentStatus { CanPay, CannotPay, Unknown }

pub struct PaymentConfidenceResult {
    pub status: PaymentStatus,
    pub confidence_score: u8,        // 0-100
    pub best_route: Option<RouteSummary>,
    pub best_asset: Option<String>,
    pub reason: String,              // human-readable
    pub technical_reason: String,
    pub suggested_fix: String,
    pub risk_factors: Vec<RiskFactor>,
}

pub struct FailureDiagnostics {
    pub failure_category: FailureCategory, // Capacity | Asset | Route | Fee | Node | Timeout | Swap | Unknown
    pub human_reason: String,
    pub technical_reason: String,
    pub failing_hop: Option<HopRef>,
    pub failing_asset: Option<String>,
    pub suggested_fix: String,
    pub retry_strategy: String,
}
```

## The six analyzers — exact responsibilities
1. **Request Validator** — well-formed sender/receiver/asset/amount; normalizes.
   Reject with a clear validation error before anything touches RPC.
2. **Route Analyzer** — fetches route candidates, scores each hop on stability,
   liquidity, asset compat, fee; picks best route + fallback routes.
3. **Asset Analyzer** — checks per-hop asset support, swap availability, asset
   liquidity; can recommend an alternative asset.
4. **Liquidity Analyzer** — inbound/outbound liquidity, liquidity **direction**
   (not just amount), channel health, bottleneck hop identification.
5. **Fee Analyzer** — fee-to-amount ratio, fee bottlenecks, fee-based suggestions.
6. **Node RPC-derived Node Health** — uptime, peer stability, channel state, feeds
   both the Route Analyzer and the Confidence Model directly.

Each analyzer is a pure function: `fn analyze(input: &SomeData) -> SomeScore` with
no side effects, so it can be unit tested with fixture data in isolation.

## Confidence Model — exact scoring spec (implement precisely, this is graded logic)

```
confidence = route_score + asset_score + liquidity_score + fee_score + node_score
```
Point budgets per component (each analyzer returns a value inside its budget):
- Route score: 0–30 (fewer hops, stable nodes, fallback routes available = higher)
- Asset score: 0–20 (compatible = high, swap-required = medium, swap-unavailable = 0)
- Liquidity score: 0–30 (sufficient = high, borderline = medium, insufficient = 0)
- Fee score: 0–10 (low fee-to-amount ratio = high, bottleneck = 0)
- Node health score: 0–10 (stable = high, unstable = medium, offline = 0)

Total is naturally 0–100. Thresholds:
- `confidence >= 70` → `CAN_PAY`
- `confidence <= 40` → `CANNOT_PAY`
- `40 < confidence < 70` → `UNKNOWN`

Always populate `risk_factors` (liquidity/asset/route/fee/node/cross-chain/RPC-data
risk) — the model must be explainable, never a bare number. If any required RPC data
is missing/stale, that is itself an "RPC data risk" penalty and should push the
result toward `UNKNOWN`, never silently toward `CAN_PAY`.

## Failure Taxonomy — the 8 categories (use these exact names)
`Capacity`, `Asset`, `Route`, `Fee`, `Node`, `Timeout`, `Swap`, `Unknown`.

For each category the Failure Classifier must produce: category, human reason,
technical reason, and hand off to the Suggestion Engine for a fix. Keep a lookup
table (`match` or static map) from category → suggested-fix template rather than
scattering fix strings across the codebase — this keeps the Suggestion Engine
genuinely reusable and testable.

| Category | One-line trigger | Example suggested fix |
|---|---|---|
| Capacity | insufficient liquidity somewhere on route | "add liquidity / rebalance / reduce amount" |
| Asset | asset unsupported at some hop / swap missing | "use recommended asset / enable swap" |
| Route | no viable route found | "retry later / alternative asset / more peers" |
| Fee | fee exceeds threshold or ratio | "increase fee budget / shorter route" |
| Node | unstable/offline node on route | "avoid node / reconnect peers" |
| Timeout | HTLC/expiry violated | "shorter route / larger expiry window" |
| Swap | swap required but unavailable/incompatible | "use supported asset / retry / alt provider" |
| Unknown | data incomplete, can't classify | "retry / refresh gossip / increase RPC timeout" |

## Testing strategy
- Every analyzer gets unit tests against hand-built fixture `ChannelData`/`RouteData`
  covering: the happy path, and at least one fixture per failure category above.
- Confidence Model gets a table-driven test reproducing the PRD's worked example
  (route 25 + asset 20 + liquidity 30 + fee 8 + node 9 = 92 → CAN_PAY).
- `cargo test --workspace` must pass before moving to the next build fragment.

## Non-functional requirements to bake in from the start
- No private keys handled anywhere in this crate — engine only ever sees identifiers,
  amounts, and RPC-fetched public network data.
- Graceful degradation: incomplete RPC data → `UNKNOWN`, never a crash and never a
  false `CAN_PAY`.
- Deterministic output: same inputs → same output, always (important for demoability
  and for the mock RPC client to produce a reliable investor/judge demo).
