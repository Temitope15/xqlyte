"use client";

import { useEffect, useState } from "react";

interface LogEntry {
  id?: number;
  timestamp: string;
  sender: string;
  receiver: string;
  amount: number;
  asset: string;
  status: string;
  confidence_score: number;
  failure_category: string | null;
  reason: string;
  technical_reason: string;
  suggested_fix: string;
}

const BACKEND_URL = "http://localhost:3000";

export default function FailureExplorerPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterCategory, setFilterCategory] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/logs?recent=50`);
        if (res.ok) {
          const data = await res.json();
          setLogs(data.filter((l: LogEntry) => l.status !== "CanPay"));
        } else {
          throw new Error();
        }
      } catch (e) {
        // Fallback local mock failures
        setLogs([
          {
            id: 2,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            sender: "alice",
            receiver: "bob",
            amount: 1500.0,
            asset: "USDT",
            status: "CannotPay",
            confidence_score: 0,
            failure_category: "Capacity",
            reason: "Insufficient balance/liquidity in channels along the routing path.",
            technical_reason: "Channel local balance is less than the requested payment amount.",
            suggested_fix: "add liquidity / rebalance / reduce amount"
          },
          {
            id: 4,
            timestamp: new Date(Date.now() - 14400000).toISOString(),
            sender: "alice",
            receiver: "charles",
            amount: 250.0,
            asset: "BTC",
            status: "CannotPay",
            confidence_score: 0,
            failure_category: "Asset",
            reason: "Asset compatibility check failed. Selected asset not supported by routing nodes.",
            technical_reason: "Target routing nodes lack channels supporting BTC.",
            suggested_fix: "Try routing with CKB or swap using a swap provider."
          },
          {
            id: 5,
            timestamp: new Date(Date.now() - 28800000).toISOString(),
            sender: "alice",
            receiver: "david",
            amount: 80.0,
            asset: "USDT",
            status: "CannotPay",
            confidence_score: 15,
            failure_category: "Node",
            reason: "Path contains degraded or offline nodes.",
            technical_reason: "Node 'node_offline' has a stability score of 10% and is offline.",
            suggested_fix: "Route around offline node or wait for node recovery."
          }
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = filterCategory === "ALL" 
    ? logs 
    : logs.filter(l => l.failure_category === filterCategory);

  const categories = ["ALL", "Capacity", "Asset", "Node", "Route", "Simulation"];

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Failure Explorer</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Drill into payment failures to diagnose exact categories, technical trace layers, and retry strategies.
        </p>
      </header>

      {/* Filter Toolbar */}
      <section className="card" style={{ marginBottom: "32px", padding: "16px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)" }}>Filter by Category:</span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {categories.map((cat) => (
              <button
                key={cat}
                className={`btn ${filterCategory === cat ? "btn-primary" : "btn-secondary"}`}
                style={{ padding: "8px 16px", fontSize: "0.85rem" }}
                onClick={() => setFilterCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Failures Table */}
      <section>
        {loading ? (
          <div style={{ color: "var(--text-secondary)", padding: "20px" }}>Loading logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "40px", color: "var(--text-secondary)" }}>
            No matching routing failures detected in historical log store.
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Route Context</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Reason</th>
                  <th>Technical Reason / Trace</th>
                  <th>Suggested Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log, idx) => (
                  <tr key={log.id || idx}>
                    <td style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </td>
                    <td>
                      {log.sender} ➔ {log.receiver}
                    </td>
                    <td>
                      {log.amount} {log.asset}
                    </td>
                    <td>
                      <span className="badge badge-error">
                        {log.failure_category || "Unknown"}
                      </span>
                    </td>
                    <td>{log.reason}</td>
                    <td style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                      {log.technical_reason}
                    </td>
                    <td style={{ color: "var(--color-accent)", fontWeight: 500 }}>
                      {log.suggested_fix}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
