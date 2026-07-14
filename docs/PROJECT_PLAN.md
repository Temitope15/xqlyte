# XQlyte Project Plan

XQlyte is a Payment Diagnostics & Confidence Engine designed for the Nervos Fiber Network. 

## What XQlyte Is
XQlyte acts as a diagnostic layer between payment consumers (wallets, dApps, bots) and a Fiber Network Node (`fnn`). When a payment is initiated, it parses the network topology, channel state, asset compatibility, fee schedules, and node health to:
1. Predict success probability via a **Confidence Score (0-100)**.
2. Determine if a payment is viable (`CAN_PAY`), unviable (`CANNOT_PAY`), or uncertain (`UNKNOWN`).
3. Classify payment failures into **8 core failure categories** (Capacity, Asset, Route, Fee, Node, Timeout, Swap, Unknown).
4. Provide structured diagnostic fixes and retry strategies for developers and end-users.

## Who It Is For
- **dApp & Wallet Developers:** Looking to integrate payment logic with high certainty, clear errors, and fallback recommendations.
- **Node Operators:** Needing observability into channel capacity, liquidity balance, fees, and peer node health.
- **Non-Technical Users:** Relying on user interfaces (Telegram bot, dashboard) to quickly query why a transaction failed.

## "Done for the Hackathon" (MVP Criteria)
For this hackathon, "done" means having a fully-working system that can run the Demo Script flawlessly:
1. **Core Rust Engine:** A library compiling on Rust stable containing the validator, 5 analyzers, confidence scorer, failure classifier, and suggestion generator. All logic must be verified by automated unit tests.
2. **Deterministic Mock Layer:** A client that returns preset responses matching every failure taxonomy case to guarantee a bulletproof judging demo.
3. **CLI Tool (`xqlyte`):** Executable commands for diagnostics, node queries, and logging.
4. **WASM & JS SDK bindings:** Functional npm-compatible WASM package loaded in a test page.
5. **Local API Server & Log Store:** A server running locally in Rust backing both the dashboard and the Telegram bot, storing payment results in a SQLite database.
6. **Next.js Dashboard:** Overview page (metrics, charts) and Failure Explorer (detailed list of failures with filters).
7. **Telegram Bot:** A plain-language bot that handles five slash commands, queryable by judges.
8. **Live Integration (Feature Flagged):** A CLI flag/environment option (`--live` or `XQLYTE_RPC_MODE=live`) to talk to a real `fnn` node on CKB Pudge testnet.

## Out of Scope (PRD Phase-2/3/4 items)
The following features will NOT be built for this hackathon submission to focus on core MVP quality:
- **Auto-Rebalancing Engine:** Automatically executing on-chain rebalancing transactions when a liquidity bottleneck is identified.
- **Interactive Multi-Asset Swap Provider Integration:** Real-time negotiation of swap rates with third-party liquidity providers (we will mock swap compatibility checks).
- **Advanced Dashboard Pages:** Custom charting tools and alerts pages (only Overview and Failure Explorer are required).
- **Public Hosting with Mainnet Keys:** The API server will run locally and use public network state only.
