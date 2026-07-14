"use client";

import { useState } from "react";

interface LogEntry {
  id: number;
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

export default function PaymentExplorerPage() {
  const [paymentId, setPaymentId] = useState("");
  const [loading, setLoading] = useState(false);
  const [log, setLog] = useState<LogEntry | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const searchPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentId.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setLog(null);

    try {
      const res = await fetch(`${BACKEND_URL}/logs?recent=100`);
      if (res.ok) {
        const data: LogEntry[] = await res.json();
        const found = data.find((l) => l.id?.toString() === paymentId.trim());
        if (found) {
          setLog(found);
        } else {
          setErrorMsg(`Payment ID '${paymentId}' not found in historical log store.`);
        }
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback mock check if server is offline
      if (paymentId === "2") {
        setLog({
          id: 2,
          timestamp: "2026-07-14T04:23:15Z",
          sender: "alice",
          receiver: "bob",
          amount: 1500.0,
          asset: "USDT",
          status: "CannotPay",
          confidence_score: 0,
          failure_category: "Capacity",
          reason: "Insufficient balance/liquidity in channels along the routing path.",
          technical_reason: "Channel local balance is less than the requested payment amount.",
          suggested_fix: "add liquidity / rebalance / reduce amount",
        });
      } else if (paymentId === "1" || paymentId === "3") {
        setLog({
          id: parseInt(paymentId) || 1,
          timestamp: "2026-07-14T04:22:30Z",
          sender: "alice",
          receiver: "bob",
          amount: 100.0,
          asset: "USDT",
          status: "CanPay",
          confidence_score: 92,
          failure_category: null,
          reason: "Payment feasibility is high. Sufficient liquidity and stable route detected.",
          technical_reason: "route=30, asset=20, liquidity=30, fee=4, node=8, missing_data=false",
          suggested_fix: "None required.",
        });
      } else {
        setErrorMsg(`Payment ID '${paymentId}' not found in offline mock store (try ID 1 or 2).`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Payment Explorer</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Retrieve full routing traces, channel metadata, and diagnostics for specific transaction IDs.
        </p>
      </header>

      {/* Search Input */}
      <section className="card" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>Search Transaction ID</h2>
        <form onSubmit={searchPayment} style={{ display: "flex", gap: "16px" }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Enter payment log ID (e.g., 1, 2, 3)"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
      </section>

      {/* Error message */}
      {errorMsg && (
        <div className="card" style={{ borderLeft: "4px solid var(--color-error)", color: "var(--color-error)", padding: "16px 24px" }}>
          {errorMsg}
        </div>
      )}

      {/* Log Details Display */}
      {log && (
        <section className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
            <div>
              <div className="card-title">Transaction ID</div>
              <div className="card-value">#{log.id}</div>
            </div>
            <div>
              <div className="card-title">Status</div>
              <div style={{ marginTop: "8px" }}>
                <span className={`badge ${log.status === "CanPay" ? "badge-success" : "badge-error"}`}>
                  {log.status}
                </span>
              </div>
            </div>
            <div>
              <div className="card-title">Confidence Score</div>
              <div className="card-value">{log.confidence_score}%</div>
            </div>
            <div>
              <div className="card-title">Failure Type</div>
              <div className="card-value" style={{ fontSize: "1.5rem" }}>
                {log.failure_category || <span style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>None</span>}
              </div>
            </div>
          </div>

          {/* Details breakdown */}
          <div className="card">
            <h2 style={{ fontSize: "1.25rem", marginBottom: "20px" }}>Diagnostic Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Timestamp</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Routing Path</span>
                <span>{log.sender} ➔ {log.receiver}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Asset / Amount</span>
                <span>{log.amount} {log.asset}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Summary Reason</span>
                <span>{log.reason}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "12px" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Technical Trace</span>
                <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{log.technical_reason}</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "150px 1fr", gap: "12px" }}>
                <span style={{ color: "var(--text-secondary)", fontWeight: 500 }}>Suggested Fix</span>
                <span style={{ color: "var(--color-accent)", fontWeight: 600 }}>{log.suggested_fix}</span>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
