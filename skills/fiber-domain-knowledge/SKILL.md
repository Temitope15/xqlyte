---
name: fiber-domain-knowledge
description: Use this skill before writing ANY analyzer, RPC client, or scoring logic for XQlyte. It explains the Fiber Network concepts (channels, multi-hop routing, HTLCs, RGB++/CKB assets, Lightning interop) that XQlyte's engine reasons about, and defines the RPC surface XQlyte depends on. Without this context, analyzer code will use plausible-sounding but wrong field names and wrong failure logic. Trigger this any time you are about to model a Channel, Route, Node, Asset, Fee, or Swap struct, or write RPC-calling code.
---

# Fiber Network Domain Knowledge (for building XQlyte)

## Why this skill exists
XQlyte is *infrastructure that sits on top of the Fiber Network*. Every analyzer
(Route, Asset, Liquidity, Fee) and the Confidence Model itself are only as good as
their understanding of how Fiber actually behaves. Do not invent Fiber semantics —
ground every struct field and every scoring rule in the concepts below, and when in
doubt, fetch the live docs (links at the bottom) rather than guessing.

## Core concepts

**Fiber Network** is a multi-asset, multi-hop, channel-based payment network built on
CKB (Nervos), interoperable with Bitcoin Lightning.

- **Channel**: a bilateral payment channel between two nodes with a fixed capacity,
  split into local (outbound) and remote (inbound) balance. Payments move balance
  from outbound to inbound along a route of channels.
- **Multi-hop routing**: a payment from A to D may route through B and C
  (`A → B → C → D`). Each hop is itself a channel and must have (a) enough
  *outbound* liquidity on the sending side of the hop and (b) enough *inbound*
  liquidity on the receiving side.
- **HTLC (Hash Time-Locked Contract)**: the mechanism that makes multi-hop payments
  atomic. Each hop has an expiry (CLTV-like timelock). Longer routes need more total
  expiry budget; mismatched or insufficient expiry windows cause timeout failures.
- **Liquidity direction**: a channel can have plenty of capacity but be "wrong-sided"
  — e.g. a merchant's channel may be capacity-rich but *inbound*-poor, so customers
  can't pay them even though the channel isn't empty. This is distinct from a pure
  capacity/liquidity shortage and is why XQlyte treats liquidity *direction* as its
  own signal, not just a capacity check.
- **Multi-asset support**: Fiber channels can carry more than native CKB —
  stablecoins, other CKB-native assets, and **RGB++** assets (a protocol for
  binding off-chain-style asset state to CKB cells). Not every hop supports every
  asset; a route can be liquidity-viable but asset-incompatible.
- **Swaps**: when the desired asset isn't supported end-to-end, a swap (asset
  conversion) may be needed at some hop. Swap availability, swap liquidity, and swap
  fees are a separate failure surface from plain routing.
- **Cross-chain interop with Lightning (BTC)**: Fiber can interoperate with Bitcoin
  Lightning. Cross-chain HTLCs must reconcile expiry/timelock conventions between the
  two networks; mismatched expiries or unavailable swap-out liquidity are common
  cross-chain failure causes.
- **Node health**: a node can be online but "unstable" (flaky peer connections,
  intermittent routing failures) — this is different from being fully offline, and
  XQlyte's Node Health score must be able to express a spectrum, not just up/down.
- **Gossip data**: nodes learn about the network topology via a gossip protocol.
  Incomplete gossip is a real, common cause of "route not found" that is NOT the same
  as "no route exists" — this is why XQlyte has an `UNKNOWN` outcome distinct from
  `CANNOT_PAY`.

## The RPC surface XQlyte depends on
XQlyte's RPC layer wraps six logical RPC modules (mirror this in code as six
traits/clients, even if the underlying real Fiber RPC exposes them differently):

| XQlyte RPC module | Responsible for | Feeds into |
|---|---|---|
| Channel RPC | channel id, capacity, inbound/outbound balance, asset, health, age | Liquidity Analyzer |
| Route RPC | route candidates, hop list, per-hop liquidity/fee/stability | Route Analyzer |
| Asset RPC | asset metadata, per-asset liquidity, network | Asset Analyzer |
| Node RPC | node id, uptime, peer list, stability score, asset support | Route Analyzer, Confidence Model |
| Fee RPC | base fee, proportional fee, fee schedule per hop | Fee Analyzer |
| Swap RPC | swap provider availability, swap liquidity, swap fees, compatibility | Asset Analyzer |

**Hackathon reality check:** you will very likely NOT have write/production access to
a populated mainnet Fiber node with rich routing data on day one. Treat the RPC layer
as a **trait/interface** (`FiberRpcClient`) with two implementations:
1. `LiveFiberRpcClient` — talks to a real `fnn` (Fiber Network Node) JSON-RPC endpoint.
2. `MockFiberRpcClient` — returns deterministic fixture data covering each of the 8
   failure taxonomy categories, so the CLI/dashboard/bot demo is 100% reliable even if
   the live node is flaky during judging.

Never let the engine, SDK, CLI, dashboard, or bot code know which implementation is
active — they must only depend on the `FiberRpcClient` trait.

## Getting a real testnet node running (do this early, not just in Phase 9)
A public CKB testnet ("Pudge") and public Fiber testnet nodes already exist, and
setup is cheap (~30 minutes, free tokens). Standing this up early — right after the
repo skeleton, in parallel with engine work — lets you validate your `ChannelData`/
`RouteData`/etc. field-mapping assumptions against real RPC responses instead of
guessing from docs, well before Phase 9. It does NOT replace the mock RPC client for
unit tests (see rust-core-engine skill) — engine tests must stay deterministic
regardless of live network state. Treat this as "validate assumptions and unblock
`LiveFiberRpcClient` early," not "switch to live data everywhere."

Steps (verify exact commands/versions against the live docs before running — Fiber
is under active development):
1. Download the `fnn` binary from the Fiber Network GitHub releases
   (`nervosnetwork/fiber`), or build from source.
2. Generate a CKB account: `ckb-cli account new` (also gives you a testnet address,
   prefixed `ckt1...`).
3. Fund that address with testnet CKB from the **CKB Pudge faucet**:
   `https://faucet.nervos.org` (10,000 CKB is enough to get started).
4. If you need the stablecoin side (RUSD) for multi-asset testing: the RUSD faucet
   (`https://testnet0815.stablepp.xyz/faucet`) can't fund an address directly — claim
   RUSD into a wallet like JoyID first, then transfer it to your node's address.
5. Copy the testnet config (`config/testnet/config.yml`) into your node's data
   directory, set `FIBER_SECRET_KEY_PASSWORD`, and start `fnn`.
6. `connect_peer` to a public Fiber testnet node's multiaddr (check current docs for
   an active one — these change), then open a channel and wait for `ChannelReady`.
7. Once `ChannelReady`, use the node's JSON-RPC endpoint (default
   `http://127.0.0.1:8227`) to inspect real channel/route/node data — this is your
   ground truth for finalizing the `rpc` crate's type definitions.

Reference docs (fetch fresh before building against them — commands/binaries change):
- Run a Fiber Node (quick start): https://www.fiber.world/docs/quick-start/run-a-node
- Testnet nodes guide (faucet steps, connecting to public nodes): https://www.fiber.world/docs/getting-started/testnet-nodes
- Fiber releases / fnn binaries: https://github.com/nervosnetwork/fiber
- CKB Pudge faucet: https://faucet.nervos.org
- CKB networks overview (what "Pudge" is): https://docs.nervos.org/docs/getting-started/ckb-networks

## What NOT to invent
- Don't invent specific RPC method names or JSON field names without checking
  `https://www.fiber.world/docs/reference/rpc` first (web_search / web_fetch it).
- Don't assume Fiber has on-chain finality identical to Lightning's — CKB's cell
  model differs; keep failure explanations generic ("insufficient inbound liquidity")
  rather than claiming specific on-chain mechanics you haven't verified.
- Don't hardcode a single "the" native asset — always treat asset as a parameter.

## Reference docs (fetch these before finalizing RPC field names)
- Fiber docs hub: https://www.fiber.world/docs
- What is Fiber Network: https://www.fiber.world/docs/what-is-fiber-network
- How Fiber works (channels, routing, HTLCs): https://www.fiber.world/docs/how-fiber-network-works
- Fiber Network Node (running a node): https://www.fiber.world/docs/fiber-network-node
- Payment channels: https://www.fiber.world/docs/payment-channels
- Multi-hop routing: https://www.fiber.world/docs/multi-hop-routing
- Assets (RGB++, stablecoins): https://www.fiber.world/docs/assets
- RPC reference: https://www.fiber.world/docs/reference/rpc
- Developer overview: https://www.fiber.world/docs/developer-overview
- Simulator/tools: https://www.fiber.world/docs/simulator , https://www.fiber.world/docs/tools
