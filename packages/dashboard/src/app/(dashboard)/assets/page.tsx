"use client";

import { useState } from "react";

interface AssetAnalysis {
  asset: string;
  is_supported: boolean;
  liquidity: number;
  swap_provider_available: boolean;
  average_fee: number;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export default function AssetAnalyticsPage() {
  const [assetName, setAssetName] = useState("USDT");
  const [scenario, setScenario] = useState("happy-path");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AssetAnalysis | null>(null);

  const fetchAssetAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/asset/${assetName}?scenario=${scenario}`);
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
      } else {
        throw new Error();
      }
    } catch (e) {
      // Fallback mock asset analysis
      setAnalysis({
        asset: assetName,
        is_supported: !scenario.includes("asset"),
        liquidity: scenario.includes("asset") ? 0.0 : 50000.0,
        swap_provider_available: !scenario.includes("swap"),
        average_fee: 5.0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Asset Analytics</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Evaluate asset compatibility, total liquidity, and swap execution support across the routing topology.
        </p>
      </header>

      {/* Asset Form */}
      <section className="card" style={{ marginBottom: "32px" }}>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>Asset Evaluation</h2>
        <form onSubmit={fetchAssetAnalysis} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Asset (e.g., USDT, CKB, BTC)</label>
            <input className="form-input" value={assetName} onChange={(e) => setAssetName(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Scenario Context</label>
            <select className="form-select" value={scenario} onChange={(e) => setScenario(e.target.value)}>
              <option value="happy-path">Happy Path (Supported)</option>
              <option value="asset-fail">Unsupported Asset</option>
              <option value="swap-fail">Unsupported Swap Provider</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: "45px" }} disabled={loading}>
            {loading ? "Evaluating..." : "Check Compatibility"}
          </button>
        </form>
      </section>

      {/* Results View */}
      {analysis && (
        <section className="animate-fade-in dashboard-grid">
          <div className="card">
            <div className="card-title">Support Status</div>
            <div className="card-value" style={{ color: analysis.is_supported ? "var(--color-success)" : "var(--color-error)" }}>
              {analysis.is_supported ? "Supported" : "Unsupported"}
            </div>
            <div className="card-subtitle">
              {analysis.is_supported ? "Asset has active routing channels" : "No active routing channels exist for this asset"}
            </div>
          </div>
          <div className="card">
            <div className="card-title">Available Liquidity</div>
            <div className="card-value">{analysis.liquidity} {analysis.asset}</div>
            <div className="card-subtitle">Aggregated local channel capacity</div>
          </div>
          <div className="card">
            <div className="card-title">Swap Provider</div>
            <div className="card-value" style={{ color: analysis.swap_provider_available ? "var(--color-success)" : "var(--color-warning)" }}>
              {analysis.swap_provider_available ? "Available" : "Unavailable"}
            </div>
            <div className="card-subtitle">Redundant path via swap provider CKB</div>
          </div>
          <div className="card">
            <div className="card-title">Average Routing Fee</div>
            <div className="card-value">{analysis.average_fee} CKB</div>
            <div className="card-subtitle">Estimated network transaction fee</div>
          </div>
        </section>
      )}
    </div>
  );
}
