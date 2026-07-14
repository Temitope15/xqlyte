---
name: sdk-cli-wasm
description: Use this skill when building the Rust SDK, the WASM bindings, the JS SDK wrapper, or the XQlyte CLI. Defines the exact public API surface (can_pay, diagnose_failure, confidence_score, best_asset, best_route, analyze_route, analyze_asset, log_result), the CLI command set and output format, and the wasm-bindgen build pipeline. Depends on rust-core-engine skill for the underlying types — read that first if types are unclear.
---

# XQlyte SDK, CLI & WASM Layer

## Public API surface (identical shape across Rust SDK, JS SDK, WASM, CLI)
These eight functions are THE product surface. Every consumer (wallet, dashboard,
bot, CLI) calls into these — don't add ad-hoc alternate entry points.

1. `can_pay(request: PaymentRequest) -> PaymentConfidenceResult`
2. `diagnose_failure(payment_id: &str) -> FailureDiagnostics`
3. `confidence_score(request: PaymentRequest) -> (u8, Vec<RiskFactor>)`
4. `best_asset(request: PaymentRequest) -> (String, u8, String)` — asset, confidence, reason
5. `best_route(request: PaymentRequest) -> (RouteSummary, u8, String)` — route, score, reason
6. `analyze_route(route: RouteRef) -> RouteAnalysis` — hop-by-hop breakdown
7. `analyze_asset(asset: &str) -> AssetAnalysis`
8. `log_result(result: &PaymentConfidenceResult)` — writes a structured log record consumed later by the dashboard/CLI `log` command

## Rust SDK (`crates/sdk-rust`)
Thin, idiomatic wrapper: takes a `FiberRpcClient` at construction, exposes the 8
functions as async methods on an `XqlyteClient` struct. No logic lives here beyond
wiring `rpc` fetches into `engine` calls — keep it thin on purpose.

```rust
let client = XqlyteClient::new(rpc_client);
let result = client.can_pay(PaymentRequest::new("alice", "bob", 10.0, "USDT")).await?;
println!("{:?} {}", result.status, result.confidence_score);
```

## WASM SDK (`crates/sdk-wasm`)
- Use `wasm-bindgen` + `wasm-pack build --target web` (browser wallets/dashboards
  need `web` target, not `nodejs`, unless the dashboard is server-rendered — confirm
  against how the dashboard fetches data before picking the target).
- Expose `can_pay`, `diagnose_failure`, etc. as `#[wasm_bindgen]` async functions
  taking/returning `JsValue` (serialize with `serde-wasm-bindgen`).
- Keep the WASM surface a pass-through to `xqlyte-engine` + `xqlyte-rpc` — do not
  duplicate logic here.
- Build output goes to a `pkg/` directory consumed by the JS SDK as a local
  dependency (`"xqlyte-wasm": "file:../sdk-wasm/pkg"`).

## JavaScript SDK (`packages/xqlyte-js`)
Promise-based wrapper around the WASM package for ergonomic use from web wallets and
the dashboard:
```js
import { canPay } from "xqlyte";
const result = await canPay({ sender: "alice", receiver: "bob", amount: 5, asset: "USDT" });
console.log(result.status, result.confidence_score);
```
If a Node.js consumer (e.g. the Telegram bot) needs the same functions without a
browser, either (a) build a second `wasm-pack --target nodejs` artifact, or (b) run a
small local HTTP wrapper around the Rust SDK (simplest for hackathon time budget —
see dashboard-and-bot skill for the shared API server pattern). Decide this once,
early, and keep both the dashboard and the bot pointed at the same integration
pattern to avoid building two RPC paths.

## CLI (`crates/cli`, binary name `xqlyte`)
Use `clap` with derive macros. Command tree:

```
xqlyte can-pay   --from <s> --to <r> --amount <n> --asset <a>
xqlyte diagnose  --payment-id <id>
xqlyte route     --to <r> --asset <a>
xqlyte asset     --asset <a>
xqlyte liquidity --channel <id>
xqlyte node      --id <node_id>
xqlyte log       --recent <n>
```

Every command must support `--json` (machine-readable, for scripting/agents) in
addition to the default human-readable table format:
```
Status: CAN_PAY
Confidence: 92%
Best Route: alice -> nodeA -> nodeB -> bob
Reason: Sufficient liquidity and stable nodes.
Suggested Fix: None.
```
This dual-output requirement is explicit PRD scope ("scriptable", "structured
output") — don't skip the `--json` flag, it's what makes the CLI usable by agents,
not just humans.

## Testing strategy
- CLI: integration tests that run the compiled binary against the `MockFiberRpcClient`
  fixtures and snapshot both human and `--json` output.
- WASM: a minimal HTML/JS test harness (can double as a demo page) calling each of
  the 8 functions and asserting shape of the returned object.
- SDK (Rust): doctest each public function using the mock RPC client.

## Build order within this skill (small fragments)
1. Rust SDK thin wrapper over engine+mock rpc — no WASM/CLI yet.
2. CLI `can-pay` and `diagnose` only, both output formats, against mock RPC.
3. Remaining CLI commands (`route`, `asset`, `liquidity`, `node`, `log`).
4. WASM build + minimal JS SDK + browser smoke-test page.
5. Swap mock RPC for live RPC behind a `--live` CLI flag / env var, without changing
   any command signatures.
