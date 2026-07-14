# XQlyte Task Breakdown

## Project Progress Status Update
*Initiating project. Currently setting up docs (Step 0) and skeleton (Phase 0).*

---

## Step 0 — Planning documents
- [x] Create `docs/` folder
- [x] `docs/PROJECT_PLAN.md`
- [x] `docs/ARCHITECTURE.md`
- [x] `docs/DATA_MODELS.md`
- [x] `docs/TASK_BREAKDOWN.md`
- [x] `docs/DEMO_SCRIPT.md`

## Phase 0 — Repo skeleton
- [x] 0.1 `cargo new` workspace with empty crates (`engine`, `rpc`, `sdk-rust`, `sdk-wasm`, `cli`) per the layout in rust-core-engine skill. Workspace builds with `cargo build --workspace`.
- [x] 0.2 Set up `.gitignore`, `README.md` stub, `rustfmt.toml`/`clippy` config.
- [x] 0.3 Add a GitHub Actions CI workflow running `cargo fmt --check`, `cargo clippy -- -D warnings`, and `cargo test --workspace` on every push.
- [x] 0.4 Stand up a real Fiber testnet node / connect to peer, open a channel, record JSON-RPC shapes in `docs/ARCHITECTURE.md`.

## Phase 1 — Core types & Request Validator
- [x] 1.1 Implement all types from `docs/DATA_MODELS.md` in `engine/src/types.rs`. `cargo build -p xqlyte-engine` passes.
- [x] 1.2 Implement Request Validator with unit tests for valid + 3 invalid-input cases.

## Phase 2 — Mock RPC layer
- [x] 2.1 Define `FiberRpcClient` trait in `rpc/src/client.rs` and the six data types (`ChannelData`, `RouteData`, `AssetData`, `NodeData`, `FeeData`, `SwapData`).
- [x] 2.2 Implement `MockFiberRpcClient` with hand-built fixtures covering: one clean happy-path payment, and one fixture per failure category (8 total). Unit test that each fixture actually loads.

## Phase 3 — Analyzers
- [x] 3.1 Route Analyzer + unit tests (happy path + route-failure fixture)
- [x] 3.2 Liquidity Analyzer + unit tests (happy path + capacity-failure fixture)
- [x] 3.3 Asset Analyzer + unit tests (happy path + asset-failure + swap-failure fixtures)
- [x] 3.4 Fee Analyzer + unit tests (happy path + fee-failure fixture)
- [x] 3.5 Node health scoring + unit tests (happy path + node-failure fixture)

## Phase 4 — Confidence Model & Failure Classifier
- [x] 4.1 Confidence Model combining all analyzer scores. Table-driven test reproducing the PRD worked example (92% CAN_PAY) plus threshold boundary tests.
- [x] 4.2 Failure Classifier mapping fixtures to categories.
- [x] 4.3 Suggestion Engine with lookup table, unit tested.

## Phase 5 — Engine public API
- [x] 5.1 Wire `can_pay`, `diagnose_failure`, `confidence_score` in `engine/src/lib.rs` against `MockFiberRpcClient`. Integration test: full `can_pay()` call end-to-end returns the PRD's worked example.
- [x] 5.2 Wire remaining functions: `best_asset`, `best_route`, `analyze_route`, `analyze_asset`, `log_result`.

## Phase 6 — CLI
- [ ] 6.1 `xqlyte can-pay` + `xqlyte diagnose`, both human and `--json` output, against mock RPC. Snapshot-test both output formats.
- [ ] 6.2 Remaining commands: `route`, `asset`, `liquidity`, `node`, `log`.

## Phase 7 — WASM + JS SDK
- [ ] 7.1 `wasm-pack build --target web` producing a working `pkg/`, smoke-tested via a minimal static HTML page.
- [ ] 7.2 JS SDK wrapper package.

## Phase 8 — API server + log store + Dashboard + Bot
- [ ] 8.1 `api-server` crate: `/can-pay` + `/diagnose/:id` only, mock RPC backed.
- [ ] 8.2 Log store (SQLite or JSONL) + `log_result` wired + `/logs` endpoint + `xqlyte log` CLI command.
- [ ] 8.3 Dashboard scaffold (Next.js) + Overview page reading `/logs`.
- [ ] 8.4 Dashboard Failure Explorer page.
- [ ] 8.5 Telegram bot: `/canpay` + `/whyfail` only, against the API server.
- [ ] 8.6 Remaining API endpoints + remaining dashboard pages + remaining bot commands.

## Phase 9 — Live RPC integration
- [ ] 9.1 `LiveFiberRpcClient` talking to a real `fnn` testnet node. Switch via `--live` flag or env-var.
- [ ] 9.2 Run the full demo script against live testnet data.

## Phase 10 — Submission polish
- [ ] 10.1 Architecture diagrams + flowcharts as image/markdown assets.
- [ ] 10.2 API/SDK/CLI docs from doc comments.
- [ ] 10.3 Record the demo video.
- [ ] 10.4 Final README with installation and execution instructions.
