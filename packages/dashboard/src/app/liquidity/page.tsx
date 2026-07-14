"use client";

import { useState } from "react";

interface ChannelHealth {
  id: string;
  node: string;
  inbound: number;
  outbound: number;
  status: "Healthy" | "Imbalanced" | "Depleted";
  asset: string;
}

export default function LiquidityHealthPage() {
  const [channels] = useState<ChannelHealth[]>([
    { id: "chan_01", node: "nodeA", inbound: 6500, outbound: 3500, status: "Healthy", asset: "USDT" },
    { id: "chan_02", node: "nodeB", inbound: 9500, outbound: 500, status: "Imbalanced", asset: "USDT" },
    { id: "chan_03", node: "nodeC", inbound: 0, outbound: 10000, status: "Depleted", asset: "CKB" },
    { id: "chan_04", node: "nodeD", inbound: 4000, outbound: 4000, status: "Healthy", asset: "USDT" },
  ]);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Liquidity Health</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Monitor inbound and outbound channel balance ratios, identify bottlenecks, and review recommended rebalancing tasks.
        </p>
      </header>

      {/* Grid Summary */}
      <section className="dashboard-grid">
        <div className="card">
          <div className="card-title">Total Active Channels</div>
          <div className="card-value">4</div>
          <div className="card-subtitle">Across 3 assets</div>
        </div>
        <div className="card">
          <div className="card-title">Health Index</div>
          <div className="card-value" style={{ color: "var(--color-warning)" }}>75%</div>
          <div className="card-subtitle">2 channels require optimization</div>
        </div>
        <div className="card">
          <div className="card-title">Aggregated Capacity</div>
          <div className="card-value">38,000</div>
          <div className="card-subtitle">USDT equivalent</div>
        </div>
      </section>

      {/* Recommended Rebalances */}
      <section className="card" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "var(--color-warning)" }}>
          ⚠️ Recommended Rebalancing Actions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", borderLeft: "4px solid var(--color-error)" }}>
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>Rebalance channel 'chan_03' (nodeC)</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Inbound liquidity is fully depleted (0 CKB). Payments routed towards nodeC will fail.
            </p>
            <p style={{ color: "var(--color-accent)", fontSize: "0.85rem", marginTop: "8px", fontWeight: 500 }}>
              Action: Run circular rebalancing or request invoice payout of 5,000 CKB.
            </p>
          </div>
          <div style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", borderLeft: "4px solid var(--color-warning)" }}>
            <p style={{ fontWeight: 600, marginBottom: "4px" }}>Optimize channel 'chan_02' (nodeB)</p>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              Outbound capacity is degraded (500 USDT / 10,000 USDT total). Outgoing payment threshold is capped.
            </p>
            <p style={{ color: "var(--color-accent)", fontSize: "0.85rem", marginTop: "8px", fontWeight: 500 }}>
              Action: Swap 3,000 USDT inbound capacity to outbound.
            </p>
          </div>
        </div>
      </section>

      {/* Channel list */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>Active Channel Health</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Channel ID</th>
                <th>Peer Node</th>
                <th>Inbound Capacity</th>
                <th>Outbound Capacity</th>
                <th>Status</th>
                <th>Asset</th>
              </tr>
            </thead>
            <tbody>
              {channels.map((chan) => (
                <tr key={chan.id}>
                  <td style={{ fontFamily: "monospace" }}>{chan.id}</td>
                  <td>{chan.node}</td>
                  <td>{chan.inbound} {chan.asset}</td>
                  <td>{chan.outbound} {chan.asset}</td>
                  <td>
                    <span className={`badge ${
                      chan.status === "Healthy" 
                        ? "badge-success" 
                        : chan.status === "Imbalanced" 
                        ? "badge-warning" 
                        : "badge-error"
                    }`}>
                      {chan.status}
                    </span>
                  </td>
                  <td>{chan.asset}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
