---
name: dashboard-and-bot
description: Use this skill when building the XQlyte developer dashboard (Next.js) or the Telegram bot. Defines the dashboard's 7 pages, its data source (structured logs from log_result), the shared local API server pattern used by both dashboard and bot, and the bot's 5 slash commands with exact response formats. Depends on sdk-cli-wasm skill for the underlying function calls.
---

# XQlyte Dashboard & Telegram Bot

## Shared integration pattern: the local API server
Both the dashboard and the bot need the engine's output from Node/JS-land. Rather
than building two separate bridges, build ONE small Rust HTTP server
(`crates/api-server`, e.g. axum) that exposes the 8 SDK functions as REST/JSON
endpoints and serves the structured log store (see below). Both the dashboard and
the bot are thin HTTP clients of this server. This avoids duplicating WASM builds
for two different JS runtimes and gives you one place to swap mock↔live RPC.

```
POST /can-pay            body: PaymentRequest        -> PaymentConfidenceResult
GET  /diagnose/:payment_id                            -> FailureDiagnostics
POST /confidence-score   body: PaymentRequest         -> { score, risk_factors }
POST /best-asset         body: PaymentRequest         -> { asset, confidence, reason }
POST /best-route         body: PaymentRequest         -> { route, score, reason }
GET  /route/:to?asset=   -> RouteAnalysis
GET  /asset/:asset       -> AssetAnalysis
GET  /logs?recent=20     -> LogEntry[]                (backs dashboard + `xqlyte log`)
```

## Structured log store (powers the whole dashboard)
Every `log_result()` call from the engine should append a `LogEntry` — timestamp,
request, result, status, confidence, failure category if any — to a simple append-
only store (SQLite is plenty for a hackathon; a JSON-lines file also works if time is
short). The dashboard and CLI `log` command both just query this store. Do not build
separate analytics pipelines for the dashboard vs the CLI — one log store, two
consumers.

## Dashboard (Next.js + React, Tailwind, a charting lib e.g. recharts)
Seven pages, in build priority order (build 1–2 first for a working demo, then add
the rest):

1. **Overview** — success rate, failure rate, avg confidence, top failure
   categories, top failing routes/assets, node stability summary. (Build first —
   this is the "wow" page for judges.)
2. **Failure Explorer** — filterable table of failures: category, reason, hop,
   asset, suggested fix, retry strategy. (Build second — demonstrates the taxonomy.)
3. **Route Analytics** — route success rate, hop-by-hop performance, unstable
   nodes, liquidity/fee bottlenecks.
4. **Asset Analytics** — per-asset success rate, liquidity, swap availability, fee
   profile, failure patterns.
5. **Liquidity Health** — inbound/outbound, direction, channel health, bottlenecks,
   recommended rebalancing.
6. **Node Health** — uptime, routing reliability, failure patterns, asset support.
7. **Payment Explorer** — drill into one payment's full analysis/log.

Required components across pages: sortable/filterable/searchable tables; filters by
asset/route/node/time-range/failure-category; click-through drill-down panels. Don't
gold-plate charts before the Overview + Failure Explorer pages are functionally
complete and wired to real (or mock) log data — a working simple bar chart beats a
beautiful empty one during judging.

## Telegram Bot (node-telegram-bot-api, or grammY)
Five commands, calling the local API server above. Keep replies short, plain-
language, no jargon — this is explicitly the "non-technical user" surface.

```
/canpay sender=alice receiver=bob amount=10 asset=USDT
  -> "✔ Payment likely to succeed.\nConfidence: 92%\nBest route: alice → nodeA → nodeB → bob\nFee: 0.01 USDT"

/whyfail payment_id=0xabc123
  -> "❌ Payment failed.\nReason: Insufficient inbound liquidity at hop 2.\nSuggested fix: Receiver must add inbound liquidity."

/bestasset receiver=bob amount=20
  -> "Recommended asset: USDT\nConfidence: 94%\nReason: Highest liquidity and lowest fees."

/bestroute receiver=bob asset=USDT
  -> "Best route: alice → nodeA → nodeC → bob\nScore: 88%\nReason: Stable nodes and sufficient liquidity."

/liquidity channel=0x123
  -> "Inbound: 12 USDT\nOutbound: 3 USDT\nStatus: Healthy"
```

Parse the `key=value` argument style shown above (simple space-split + `=` split is
sufficient; don't over-engineer a grammar parser for a hackathon bot). On malformed
input, reply with a one-line usage example rather than a stack trace.

## Testing strategy
- API server: integration tests hitting each endpoint against the mock RPC client.
- Dashboard: at minimum, manually verify Overview + Failure Explorer render real
  data from the log store; snapshot test key components if time allows.
- Bot: a local script that sends each of the 5 commands to the bot's handler
  functions directly (bypassing real Telegram) and asserts the reply text shape.

## Build order within this skill (small fragments)
1. API server exposing `/can-pay` and `/diagnose/:id` only, backed by mock RPC.
2. Log store (SQLite/JSONL) + `log_result` wiring + `/logs` endpoint.
3. Dashboard Overview page reading `/logs`.
4. Dashboard Failure Explorer page.
5. Telegram bot `/canpay` and `/whyfail` only.
6. Remaining API endpoints, dashboard pages, and bot commands.
7. Swap mock RPC for live RPC (should require zero dashboard/bot code changes).
