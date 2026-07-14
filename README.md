# XQlyte

**A payment diagnostics & confidence engine for the Nervos Fiber Network — pre-flight feasibility checks, root-cause failure diagnostics, and suggestion recovery.**

---

Fiber Network gives developers lightning-fast, off-chain payment channels on CKB. But when off-chain payments fail, users are met with opaque "Payment Failed" screens. XQlyte is the intelligence layer sitting on top — evaluating channel liquidity, route topologies, asset swaps, fee budgets, and node stability, converting payment attempts into actionable suggestions and automatic recovery paths.

*Built for the Wallet & Payment UX Infrastructure track.*

---

## How it's judged — and where to look
* [→ The Problem & UX Churn](#the-problem--ux-churn)
* [→ Architecture](#architecture)
* [→ Core Engine Codebase](file:///home/sunmade/Development/hackathons/xqlyte/crates/engine)
* [→ Mock RPC Layer](file:///home/sunmade/Development/hackathons/xqlyte/crates/rpc)
* [→ Setup & Setup Commands](#getting-started)

---

## Demo
▶ **[Watch the 5-Minute Technical Demo](https://video.xqlyte.com)** — Watch XQlyte analyze pre-flight routes, classify an off-chain capacity failure, suggest a swap provider fallback, and sync it live with the Telegram Bot and Developer Dashboard.

---

## The Problem — UX Churn in Off-Chain Routing
Off-chain payment routing (like Fiber and Lightning) is fast, but it is a complex grid of moving parts. A transaction can bounce for many silent reasons:
* **Capacity Bottlenecks:** A middle hop has sufficient total capacity but lacks local balance in the direction of your transfer.
* **Asset Incompatibility:** A node along the path lacks configuration/dep cells for the specific UDT token you want to transfer.
* **Elevated Fees:** Pathfinders return routes where cumulative fees exceed your wallet's maximum fee limits.
* **Node Uptime Issues:** A routing peer goes offline mid-transit or suffers from degraded peer connections.

Without a diagnostics engine, wallets broadcast transactions blindly. When they fail, the user is left with no explanation, locked liquidity (during TLC expiries), and a frustrating payment experience.

XQlyte resolves this permanently:
1. **Pre-flight Feasibility (`can_pay`):** Calculates a 0–100 confidence score based on deterministic component point allocations before broadcasting the payment.
2. **Root-Cause Classification (`diagnose_failure`):** Maps failed queries to 8 distinct failure categories and highlights the exact failing hop or asset.
3. **Actionable Suggestions:** Recommends concrete fixes (e.g., rebalancing, swap providers, fee budget adjustment) and retry strategies.

---

## Where to Find the Evidence (Monorepo Layout)

We use a single Cargo workspace to ensure atomic updates and type safety across our SDKs, server, CLI, and dashboard:

```
xqlyte (monorepo)
├── crates
│   ├── engine        # Pure analysis logic. Zero I/O. Compiles to WASM.
│   ├── rpc           # Fiber JSON-RPC adapters (Mock & Live client traits).
│   ├── sdk-rust      # Rust SDK wrapper coordinating RPC + Engine.
│   ├── sdk-wasm      # JS/TS WebAssembly bindings (wasm-bindgen).
│   ├── cli           # `xqlyte` command-line diagnostic utility.
│   └── api-server    # Axum HTTP API Server & SQLite logs database.
├── docs              # Project plans, data structures, and alignment logs.
└── README.md         # This map.
```

### The Diagnostic Workflow

```
   Payment Request
          │
          ▼
   [Validator] (Trims/normalizes inputs, asserts amount > 0)
          │
          ▼
    [RPC Client] (Fetches route data, node uptime, channel health, swaps)
          │
          ▼
   [Core Engine] (0-100 score + risk factors + failure diagnostics)
    ├── Route Analyzer (Hop count and stability penalties)
    ├── Asset Analyzer (Native support vs Swap compatibility)
    ├── Liquidity Analyzer (Channel local balance bottlenecks)
    ├── Fee Analyzer (Ratio of fee to request amount)
    └── Node Analyzer (Uptime and peer stability scoring)
          │
          ▼
  [Output Results] -> Logged to SQLite -> Pushed to Web Dashboard / Telegram Bot
```

---

## Failure Taxonomy & Suggestions
XQlyte categorizes network failures into 8 distinct categories, each returning structured suggested fixes:

| Category | Description / Cause | Suggested Fix | Retry Strategy |
| :--- | :--- | :--- | :--- |
| **Capacity** | Intermediary hop lacks sufficient outbound balance. | Add liquidity / rebalance / reduce amount. | Re-check after channel rebalancing or try a smaller amount. |
| **Asset** | Node lacks UDT support scripts/cells. | Use recommended asset / enable swap. | Attempt using a supported asset or configure a swap provider. |
| **Route** | No physical route exists between peers. | Retry later / alternative asset / more peers. | Connect to more peers or verify routing channels. |
| **Fee** | Route fees exceed payment ratio thresholds. | Increase fee budget / shorter route. | Adjust maximum fee limit or find a shorter path. |
| **Node** | Hop nodes are offline or unstable. | Avoid node / reconnect peers. | Wait for node reconnection or avoid the failing peer. |
| **Timeout** | Cumulative TLC expiries exceed safety boundaries. | Shorter route / larger expiry window. | Reduce the number of path hops or increase expiry parameters. |
| **Swap** | Swap provider is incompatible or lacks liquidity. | Use supported asset / retry / alt provider. | Verify swap provider status or use a native token. |
| **Unknown** | Incomplete network data returned by the node. | Retry / refresh gossip / increase RPC timeout. | Refresh network gossip database and retry query. |

---

## Tech Stack
* **Core Library:** Rust, tokio, async-trait, serde, wasm-bindgen.
* **Server & DB:** Axum HTTP, SQLx / SQLite for immutable audit logs.
* **Interfaces:** Next.js (Dashboard), grammY/Node.js (Telegram Bot).

---

## Getting Started

### Prerequisites
* Rust toolchain (2024 edition compatible, stable)

### Build the Workspace
To build all CLI, server, and library components:
```bash
cargo build --workspace
```

### Run the Test Suite
We enforce strict linting rules (`-D warnings` / clippy) and unit test coverage:
```bash
cargo test --workspace
```

### Run the CLI
Analyze payment configurations directly from the terminal using Mock RPC scenarios:
```bash
# Happy path payment (high score, CanPay status)
cargo run -p cli -- can-pay --sender alice --receiver bob --amount 1000 --asset USDT

# Capacity failure path (0 score, CannotPay status, displays suggested fix)
cargo run -p cli -- can-pay --sender alice --receiver bob --amount 100000 --asset USDT --scenario capacity-fail
```

---

## License
Released under the [MIT License](LICENSE).
