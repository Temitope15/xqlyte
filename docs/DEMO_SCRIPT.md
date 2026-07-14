# XQlyte Demo Script

This script defines the end-to-end validation flows that showcase XQlyte during a live demonstration.

---

## Part 1: CLI Diagnostic Validation

### 1. Happy Path Check (`can-pay`)
Query a payment that has sufficient liquidity, compatible assets, and stable nodes.
```bash
./target/debug/xqlyte can-pay \
  --from alice \
  --to bob \
  --amount 10.0 \
  --asset USDT
```
**Expected Output:**
```
Status: CAN_PAY
Confidence: 92%
Best Route: alice -> nodeA -> nodeB -> bob
Reason: Sufficient liquidity and stable nodes.
Suggested Fix: None.
```

Or query with JSON output for programmatic scripting:
```bash
./target/debug/xqlyte can-pay \
  --from alice \
  --to bob \
  --amount 10.0 \
  --asset USDT \
  --json
```
**Expected Output:**
```json
{
  "status": "CanPay",
  "confidence_score": 92,
  "best_route": {
    "hops": ["alice", "nodeA", "nodeB", "bob"],
    "total_fee": 0.01,
    "total_expiry": 144
  },
  "best_asset": "USDT",
  "reason": "Sufficient liquidity and stable nodes.",
  "technical_reason": "Route contains stable channels. All hops satisfy capacity >= request_amount.",
  "suggested_fix": "None.",
  "risk_factors": []
}
```

### 2. Failure Diagnostic Check (`diagnose`)
Query a failing payment where a hop lacks inbound capacity.
```bash
# First check can-pay for a high amount that will fail due to liquidity constraints
./target/debug/xqlyte can-pay \
  --from alice \
  --to charlie \
  --amount 1000.0 \
  --asset USDT \
  --json
```
This returns a failure outcome with a specific payment ID (e.g. `0xabc123`). Next, query the diagnostic engine:
```bash
./target/debug/xqlyte diagnose --payment-id 0xabc123
```
**Expected Output:**
```
Category: Capacity
Human Reason: Insufficient liquidity somewhere on route.
Technical Reason: Inbound capacity at hop 2 (nodeA -> nodeB) is 50.0 USDT, requested 1000.0 USDT.
Failing Hop: channel_id_2 (nodeA -> nodeB)
Failing Asset: USDT
Suggested Fix: Add liquidity / rebalance / reduce amount.
Retry Strategy: Rebalance channel nodeA <-> nodeB or route via alternative nodes.
```

---

## Part 2: Telegram Bot Diagnostics

For non-technical users, simulate the Telegram Bot interaction.

1. **User asks `/canpay`:**
   ```
   /canpay sender=alice receiver=bob amount=10 asset=USDT
   ```
   **Bot response:**
   ```
   ✔ Payment likely to succeed.
   Confidence: 92%
   Best route: alice → nodeA → nodeB → bob
   Fee: 0.01 USDT
   ```

2. **User asks `/whyfail`:**
   ```
   /whyfail payment_id=0xabc123
   ```
   **Bot response:**
   ```
   ❌ Payment failed.
   Reason: Insufficient inbound liquidity at hop 2.
   Suggested fix: Receiver must add inbound liquidity.
   ```

---

## Part 3: Developer Dashboard Overview

1. Start the API server:
   ```bash
   ./target/debug/xqlyte-api-server
   ```
2. Open the browser to:
   ```
   http://localhost:3000/
   ```
3. **Overview Glance:**
   - Visual gauges showing average payment confidence score.
   - Live success rate vs failure rate metric charts.
   - Bar chart displaying top failure categories (Capacity, Asset compatibility, Node offline).
4. **Failure Explorer Navigation:**
   - Navigate to `/failures`.
   - Filter by category `Capacity`.
   - Verify that the details list `0xabc123` with failing hop `channel_id_2` and suggested fix "Add liquidity / rebalance / reduce amount".
