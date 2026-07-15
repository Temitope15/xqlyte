"use client";

import { useEffect, useState } from "react";

interface ChannelData {
  channel_id: string;
  capacity: number;
  local_balance: number;
  remote_balance: number;
  asset: string;
  health: string;
  age: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function LiquidityHealthPage() {
  const [channels, setChannels] = useState<ChannelData[]>([]);
  const [scenario, setScenario] = useState("happy-path");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchChannels = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/topology/channels?scenario=${scenario}`);
      if (res.ok) {
        const data = await res.json();
        setChannels(data);
        setErrorMsg("");
      } else {
        throw new Error("Failed to fetch topology channels");
      }
    } catch (e) {
      console.warn("Backend server not running, using offline static channels.", e);
      // Hardcoded fallback matching the scenario for offline display
      if (scenario.includes("capacity")) {
        setChannels([
          { channel_id: "channel_1", capacity: 10000, local_balance: 50, remote_balance: 9950, asset: "USDT", health: "Healthy", age: 100 }
        ]);
      } else if (scenario.includes("node")) {
        setChannels([
          { channel_id: "channel_1", capacity: 10000, local_balance: 5000, remote_balance: 5000, asset: "USDT", health: "Offline", age: 100 }
        ]);
      } else {
        setChannels([
          { channel_id: "channel_1", capacity: 10000, local_balance: 6000, remote_balance: 4000, asset: "USDT", health: "Healthy", age: 100 }
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, [scenario]);

  // Derived stats
  const totalCapacity = channels.reduce((sum, c) => sum + c.capacity, 0);
  const activeChannelsCount = channels.length;
  
  // Health scoring: Imbalanced/Offline counts
  const depletedCount = channels.filter(c => c.local_balance === 0 || c.health === "Offline" || c.local_balance < 100).length;
  const imbalancedCount = channels.filter(c => c.health !== "Offline" && c.local_balance > 0 && (c.local_balance / c.capacity < 0.1 || c.local_balance / c.capacity > 0.9)).length;
  const healthyCount = activeChannelsCount - depletedCount - imbalancedCount;
  
  const healthIndex = activeChannelsCount > 0 
    ? Math.round((healthyCount / activeChannelsCount) * 100) 
    : 100;

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: "32px", display: "flex", justifyContent: "between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Liquidity Health</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Monitor inbound and outbound channel balance ratios, identify bottlenecks, and review recommended rebalancing tasks.
          </p>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <label className="form-label" style={{ display: "inline-block", marginRight: "8px" }}>Select Network Scenario:</label>
          <select 
            className="form-select" 
            style={{ width: "200px", display: "inline-block" }}
            value={scenario} 
            onChange={(e) => setScenario(e.target.value)}
          >
            <option value="happy-path">Happy Path</option>
            <option value="capacity-fail">Capacity Failure</option>
            <option value="node-fail">Node Degradation</option>
          </select>
        </div>
      </header>

      {/* Grid Summary */}
      <section className="dashboard-grid">
        <div className="card">
          <div className="card-title">Total Active Channels</div>
          <div className="card-value">{activeChannelsCount}</div>
          <div className="card-subtitle">Fetched dynamically from node</div>
        </div>
        <div className="card">
          <div className="card-title">Health Index</div>
          <div className="card-value" style={{ color: healthIndex >= 90 ? "var(--color-success)" : healthIndex >= 50 ? "var(--color-warning)" : "var(--color-error)" }}>
            {healthIndex}%
          </div>
          <div className="card-subtitle">
            {depletedCount + imbalancedCount} channels require optimization
          </div>
        </div>
        <div className="card">
          <div className="card-title">Aggregated Capacity</div>
          <div className="card-value">{totalCapacity.toLocaleString()}</div>
          <div className="card-subtitle">USDT equivalent</div>
        </div>
      </section>

      {/* Recommended Rebalances */}
      {(depletedCount > 0 || imbalancedCount > 0) && (
        <section className="card" style={{ marginBottom: "32px" }}>
          <h2 style={{ fontSize: "1.25rem", marginBottom: "16px", color: "var(--color-warning)" }}>
            ⚠️ Recommended Rebalancing Actions
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {channels.map((chan) => {
              const ratio = chan.local_balance / chan.capacity;
              if (chan.health === "Offline") {
                return (
                  <div key={chan.channel_id} style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", borderLeft: "4px solid var(--color-error)" }}>
                    <p style={{ fontWeight: 600, marginBottom: "4px" }}>Peer node Offline: {chan.channel_id}</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      Channel is currently unresponsive. Outgoing and incoming routing paths are blocked.
                    </p>
                    <p style={{ color: "var(--color-accent)", fontSize: "0.85rem", marginTop: "8px", fontWeight: 500 }}>
                      Action: Contact peer node operator to restart services or force close channel if necessary.
                    </p>
                  </div>
                );
              }
              if (chan.local_balance < 100) {
                return (
                  <div key={chan.channel_id} style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", borderLeft: "4px solid var(--color-error)" }}>
                    <p style={{ fontWeight: 600, marginBottom: "4px" }}>Rebalance channel '{chan.channel_id}'</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      Outbound liquidity is fully depleted ({chan.local_balance} {chan.asset}). Payments routed from your node will fail.
                    </p>
                    <p style={{ color: "var(--color-accent)", fontSize: "0.85rem", marginTop: "8px", fontWeight: 500 }}>
                      Action: Run circular rebalancing or request invoice payout of CKB/USDT.
                    </p>
                  </div>
                );
              }
              if (ratio < 0.1 || ratio > 0.9) {
                return (
                  <div key={chan.channel_id} style={{ padding: "16px", borderRadius: "8px", backgroundColor: "var(--bg-surface)", borderLeft: "4px solid var(--color-warning)" }}>
                    <p style={{ fontWeight: 600, marginBottom: "4px" }}>Optimize channel '{chan.channel_id}'</p>
                    <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      Channel balance is highly imbalanced ({chan.local_balance} local vs {chan.remote_balance} remote). 
                    </p>
                    <p style={{ color: "var(--color-accent)", fontSize: "0.85rem", marginTop: "8px", fontWeight: 500 }}>
                      Action: Shift capacity through submarine swaps or adjust local fee schedule.
                    </p>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </section>
      )}

      {/* Channel list */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>Active Channel Health</h2>
        {loading ? (
          <div style={{ color: "var(--text-secondary)", padding: "20px" }}>Loading topology...</div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Channel ID</th>
                  <th>Inbound Capacity (Remote)</th>
                  <th>Outbound Capacity (Local)</th>
                  <th>Total Capacity</th>
                  <th>Status</th>
                  <th>Asset</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((chan) => {
                  const ratio = chan.local_balance / chan.capacity;
                  const status = chan.health === "Offline" 
                    ? "Offline" 
                    : (chan.local_balance < 100) 
                    ? "Depleted" 
                    : (ratio < 0.1 || ratio > 0.9) 
                    ? "Imbalanced" 
                    : "Healthy";

                  return (
                    <tr key={chan.channel_id}>
                      <td style={{ fontFamily: "monospace", fontWeight: 600 }}>{chan.channel_id}</td>
                      <td>{chan.remote_balance.toLocaleString()} {chan.asset}</td>
                      <td>{chan.local_balance.toLocaleString()} {chan.asset}</td>
                      <td>{chan.capacity.toLocaleString()} {chan.asset}</td>
                      <td>
                        <span className={`badge ${
                          status === "Healthy" 
                            ? "badge-success" 
                            : status === "Imbalanced" 
                            ? "badge-warning" 
                            : "badge-error"
                        }`}>
                          {status}
                        </span>
                      </td>
                      <td>{chan.asset}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
