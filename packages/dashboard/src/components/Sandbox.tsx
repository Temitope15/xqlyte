"use client";

import { useState } from "react";

interface Scenario {
  name: string;
  sender: string;
  receiver: string;
  amount: number;
  asset: string;
  status: "CanPay" | "CannotPay";
  confidence: number;
  failureCategory: string | null;
  reason: string;
  technicalReason: string;
  suggestedFix: string;
  hops: string[];
  failedHopIndex: number | null;
}

const SCENARIOS: Record<string, Scenario> = {
  "happy-path": {
    name: "Happy Path",
    sender: "alice",
    receiver: "bob",
    amount: 100.0,
    asset: "USDT",
    status: "CanPay",
    confidence: 94,
    failureCategory: null,
    reason: "Payment feasibility is high. Sufficient liquidity and stable route detected.",
    technicalReason: "route_score=30, asset_score=20, liquidity_score=30, fee_score=4, node_score=10",
    suggestedFix: "None required.",
    hops: ["Alice", "Router_A", "Router_B", "Bob"],
    failedHopIndex: null,
  },
  "capacity-fail": {
    name: "Capacity Failure",
    sender: "alice",
    receiver: "bob",
    amount: 1200.0,
    asset: "USDT",
    status: "CannotPay",
    confidence: 0,
    failureCategory: "Capacity",
    reason: "Insufficient balance/liquidity in channels along the routing path.",
    technicalReason: "Channel local balance (250.00 USDT) is less than the requested payment amount (1200.00 USDT) at hop 2.",
    suggestedFix: "Add liquidity, rebalance channel, or split transaction amount.",
    hops: ["Alice", "Router_A", "Router_B", "Bob"],
    failedHopIndex: 1, // Router_A -> Router_B fails
  },
  "asset-fail": {
    name: "Asset Failure",
    sender: "alice",
    receiver: "bob",
    amount: 50.0,
    asset: "USDT",
    status: "CannotPay",
    confidence: 0,
    failureCategory: "Asset",
    reason: "Asset compatibility check failed. Target routing nodes lack script cells.",
    technicalReason: "Router_B does not support token script dep cell for USDT asset requirements.",
    suggestedFix: "Route transaction using CKB native asset, or swap via Swap Provider.",
    hops: ["Alice", "Router_A", "Router_B", "Bob"],
    failedHopIndex: 2, // Router_B -> Bob fails
  },
  "route-fail": {
    name: "Route Failure",
    sender: "alice",
    receiver: "bob",
    amount: 10.0,
    asset: "CKB",
    status: "CannotPay",
    confidence: 0,
    failureCategory: "Route",
    reason: "Pathfinding failed. No routing path available between nodes.",
    technicalReason: "No active channels link Router_A to Router_B in current gossip graph.",
    suggestedFix: "Establish a direct peer connection or open a new channel to a hub node.",
    hops: ["Alice", "Router_A", "Router_B", "Bob"],
    failedHopIndex: 1, // Router_A -> Router_B fails
  },
};

export default function Sandbox() {
  const [activePreset, setActivePreset] = useState("happy-path");
  const [sender, setSender] = useState(SCENARIOS["happy-path"].sender);
  const [receiver, setReceiver] = useState(SCENARIOS["happy-path"].receiver);
  const [amount, setAmount] = useState(SCENARIOS["happy-path"].amount);
  const [asset, setAsset] = useState(SCENARIOS["happy-path"].asset);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Scenario | null>(SCENARIOS["happy-path"]);

  const handlePresetSelect = (presetKey: string) => {
    setActivePreset(presetKey);
    const scenario = SCENARIOS[presetKey];
    setSender(scenario.sender);
    setReceiver(scenario.receiver);
    setAmount(scenario.amount);
    setAsset(scenario.asset);
    setResult(scenario);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Simulate pre-flight check delay
    setTimeout(() => {
      // Find matching scenario or generate custom one
      const match = SCENARIOS[activePreset] || SCENARIOS["happy-path"];
      setResult({
        ...match,
        sender,
        receiver,
        amount,
        asset,
      });
      setLoading(false);
    }, 600);
  };

  // Circular gauge properties
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const confidenceScore = result ? result.confidence : 0;
  const strokeDashoffset = circumference - (confidenceScore / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch w-full">
      {/* Left Column: Form & Presets */}
      <div className="lg:col-span-5 flex flex-col justify-between border border-border bg-surface/40 backdrop-blur-md rounded-2xl p-6">
        <div>
          <h3 className="font-display text-lg font-bold text-foreground mb-2">Simulate pre-flight</h3>
          <p className="text-xs text-muted mb-6">
            Choose a preset failure mode or adjust parameters to analyze route viability.
          </p>

          {/* Presets Grid */}
          <div className="grid grid-cols-2 gap-2.5 mb-6">
            {Object.keys(SCENARIOS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handlePresetSelect(key)}
                className={`py-2 px-3 rounded-lg text-xs font-semibold text-left transition-all duration-200 ${
                  activePreset === key
                    ? "bg-accent-glow border border-accent text-foreground"
                    : "bg-white/[0.02] border border-border text-muted hover:bg-white/[0.05] hover:text-foreground"
                }`}
              >
                {SCENARIOS[key].name}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-muted mb-1.5">
                Sender Node alias
              </label>
              <input
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                className="w-full text-sm font-medium bg-white/[0.02] border border-border focus:border-accent rounded-lg px-3.5 py-2.5 text-foreground outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-1.5">
                Receiver Node alias
              </label>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                className="w-full text-sm font-medium bg-white/[0.02] border border-white/5 focus:border-[var(--color-accent)] rounded-lg px-3.5 py-2.5 text-white outline-none transition-colors"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-1.5">
                  Amount
                </label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full text-sm font-medium bg-white/[0.02] border border-white/5 focus:border-[var(--color-accent)] rounded-lg px-3.5 py-2.5 text-white outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold tracking-wider uppercase text-[var(--text-muted)] mb-1.5">
                  Asset
                </label>
                <select
                  value={asset}
                  onChange={(e) => setAsset(e.target.value)}
                  className="w-full text-sm font-medium bg-white/[0.02] border border-white/5 focus:border-[var(--color-accent)] rounded-lg px-3.5 py-2.5 text-white outline-none transition-colors appearance-none"
                >
                  <option value="USDT" className="bg-[#050608]">USDT</option>
                  <option value="CKB" className="bg-[#050608]">CKB</option>
                  <option value="BTC" className="bg-[#050608]">BTC</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-gray-800 disabled:text-gray-500 text-canvas font-bold text-xs uppercase tracking-wider py-3 rounded-lg transition-colors duration-200 mt-4 active:scale-[0.98]"
            >
              {loading ? "Simulating Execution..." : "Verify Routing Path"}
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Visualizer & JSON Terminal */}
      <div className="lg:col-span-7 flex flex-col gap-6">
        {/* Top: Score & Visualizer */}
        <div className="border border-border bg-surface/40 backdrop-blur-md rounded-2xl p-6 flex flex-col md:flex-row items-center gap-8 min-h-[180px]">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs text-muted font-mono">Running 5 analytical layers...</p>
            </div>
          ) : result ? (
            <>
              {/* Score Circle */}
              <div className="relative flex items-center justify-center size-32 shrink-0">
                <svg className="size-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="stroke-white/[0.03]"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r={radius}
                    className="transition-all duration-1000 ease-out"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke={result.status === "CanPay" ? "var(--color-cyan)" : "var(--color-error)"}
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="font-display text-2xl font-bold text-foreground">
                    {result.confidence}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-muted">
                    Confidence
                  </span>
                </div>
              </div>

              {/* Node Hops Visualizer */}
              <div className="flex-1 w-full">
                <h4 className="text-[11px] font-semibold tracking-wider uppercase text-muted mb-3">
                  Diagnostic path trace
                </h4>
                <div className="flex items-center justify-between w-full relative py-4">
                  {result.hops.map((hop, idx) => {
                    const isLast = idx === result.hops.length - 1;
                    const isFailedConnection = result.failedHopIndex !== null && idx === result.failedHopIndex;
                    
                    return (
                      <div key={hop} className="flex items-center flex-1 last:flex-initial">
                        {/* Node bubble */}
                        <div className="flex flex-col items-center relative z-10">
                          <div
                            className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-colors ${
                              result.failedHopIndex !== null && idx > result.failedHopIndex
                                ? "bg-white/[0.01] border-border text-muted"
                                : result.failedHopIndex !== null && idx === result.failedHopIndex + 1
                                ? "bg-error/10 border-error text-error shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                                : "bg-cyan/5 border-cyan text-cyan"
                            }`}
                          >
                            {hop.charAt(0)}
                          </div>
                          <span className="absolute top-8 text-[9px] font-semibold text-secondary whitespace-nowrap">
                            {hop}
                          </span>
                        </div>

                        {/* Connection line */}
                        {!isLast && (
                          <div className="flex-1 h-[2px] mx-1 bg-white/5 relative overflow-hidden">
                            <div
                              className={`absolute inset-0 transition-colors ${
                                isFailedConnection
                                  ? "bg-gradient-to-r from-cyan to-error"
                                  : result.failedHopIndex !== null && idx > result.failedHopIndex
                                  ? "bg-white/5"
                                  : "bg-cyan"
                              }`}
                            />
                            {/* Pulse animation */}
                            {!isFailedConnection && (result.failedHopIndex === null || idx < result.failedHopIndex) && (
                              <div className="absolute top-0 bottom-0 w-4 bg-gradient-to-r from-transparent via-white to-transparent animate-[pulse_1.5s_infinite] h-full" style={{ animationName: "pulse-right" }} />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation text */}
                <div className="mt-8">
                  <p className="text-xs font-semibold text-white">
                    {result.status === "CanPay" ? (
                      <span className="text-cyan">✓ CAN PAY</span>
                    ) : (
                      <span className="text-red-500">✗ CANNOT PAY — {result.failureCategory} Failure</span>
                    )}
                  </p>
                  <p className="text-xs text-muted mt-1.5 font-sans leading-relaxed">
                    {result.reason}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-muted font-mono">
              Ready to verify payment feasibility...
            </div>
          )}
        </div>

        {/* Bottom: JSON terminal */}
        <div className="border border-border bg-[#07090c] rounded-2xl overflow-hidden flex flex-col flex-1 min-h-[220px]">
          {/* Header */}
          <div className="bg-[#0c0f14] border-b border-white/5 px-4 py-2 flex items-center justify-between">
            <span className="text-[10px] font-mono text-muted font-semibold">TERMINAL OUT</span>
            <div className="flex gap-1.5">
              <span className="size-2 rounded-full bg-red-500/30" />
              <span className="size-2 rounded-full bg-yellow-500/30" />
              <span className="size-2 rounded-full bg-green-500/30" />
            </div>
          </div>
          {/* Content */}
          <div className="p-4 flex-1 font-mono text-xs text-gray-400 overflow-y-auto leading-relaxed select-text">
            {loading ? (
              <div className="text-muted">Checking route database...</div>
            ) : result ? (
              <pre className="text-[11px] md:text-xs">
                {JSON.stringify(
                  {
                    status: result.status,
                    confidence_score: result.confidence,
                    failure_category: result.failureCategory,
                    reason: result.reason,
                    technical_trace: result.technicalReason,
                    suggested_fix: result.suggestedFix,
                    route: {
                      hops_count: result.hops.length,
                      path: result.hops,
                    },
                  },
                  null,
                  2
                )}
              </pre>
            ) : (
              <span className="text-muted">No active trace run.</span>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes pulse-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
