"use client";

import { useState } from "react";

interface HopAnalysis {
  channel_id: string;
  node_id: string;
  capacity: number;
  local_balance: number;
  remote_balance: number;
  node_stable: boolean;
  fee: number;
}

interface RouteAnalysis {
  route_score: number;
  hops: HopAnalysis[];
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function RouteAnalyticsPage() {
  const [receiver, setReceiver] = useState("bob");
  const [asset, setAsset] = useState("USDT");
  const [scenario, setScenario] = useState("happy-path");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<RouteAnalysis | null>(null);

  const fetchRouteAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/route/${receiver}?asset=${asset}&scenario=${scenario}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback mock routing analysis
      let hops: HopAnalysis[] = [
        {
          channel_id: "channel_1",
          node_id: "nodeA",
          capacity: 10000.0,
          local_balance: 6000.0,
          remote_balance: 4000.0,
          node_stable: true,
          fee: 5.0,
        },
        {
          channel_id: "channel_2",
          node_id: receiver,
          capacity: 8000.0,
          local_balance: 4000.0,
          remote_balance: 4000.0,
          node_stable: true,
          fee: 5.0,
        }
      ];

      if (scenario.includes("node")) {
        hops[0].node_stable = false;
      }

      setAnalysis({
        route_score: scenario.includes("node") ? 10 : 25,
        hops,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Route Analytics</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Inspect pathfinding metrics, channel balances, node stability, and fee profiles along the payment path.
        </p>
      </header>

      {/* Pathfinding Form */}
      <section className="card" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>Pathfinding Playground</h2>
        <form onSubmit={fetchRouteAnalysis} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Receiver (To)</label>
            <input className="form-input" value={receiver} onChange={(e) => setReceiver(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Asset</label>
            <select className="form-select" value={asset} onChange={(e) => setAsset(e.target.value)}>
              <option value="USDT">USDT</option>
              <option value="CKB">CKB</option>
              <option value="BTC">BTC</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Scenario Context</label>
            <select className="form-select" value={scenario} onChange={(e) => setScenario(e.target.value)}>
              <option value="happy-path">Happy Path</option>
              <option value="node-fail">Node Degradation</option>
              <option value="fee-fail">Fee Warning</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: "45px" }} disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Path"}
          </button>
        </form>
      </section>

      {/* Results View */}
      {analysis && (
        <section className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Path Score Card */}
          <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="card-title">Route Score</div>
              <div className="card-value">{analysis.route_score} / 30</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "8px" }}>
                Higher score indicates a more stable, lower-fee routing path.
              </p>
            </div>
            <span className={`badge ${analysis.route_score >= 20 ? "badge-success" : "badge-warning"}`}>
              {analysis.route_score >= 20 ? "Optimal" : "Degraded"}
            </span>
          </div>

          {/* Hops breakdown */}
          <h2 style={{ fontSize: "1.25rem", margin: "12px 0 0 0" }}>Hop-by-Hop Breakdown</h2>
          <div className="table-container" style={{ marginTop: 0 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Hop #</th>
                  <th>Channel ID</th>
                  <th>Node ID</th>
                  <th>Capacity</th>
                  <th>Local Balance</th>
                  <th>Remote Balance</th>
                  <th>Node Status</th>
                  <th>Hop Fee</th>
                </tr>
              </thead>
              <tbody>
                {analysis.hops.map((hop, idx) => (
                  <tr key={hop.channel_id}>
                    <td>{idx + 1}</td>
                    <td style={{ fontFamily: "monospace" }}>{hop.channel_id}</td>
                    <td>{hop.node_id}</td>
                    <td>{hop.capacity} {asset}</td>
                    <td>{hop.local_balance} {asset}</td>
                    <td>{hop.remote_balance} {asset}</td>
                    <td>
                      <span className={`badge ${hop.node_stable ? "badge-success" : "badge-error"}`}>
                        {hop.node_stable ? "Stable" : "Degraded"}
                      </span>
                    </td>
                    <td>{hop.fee} {asset}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
