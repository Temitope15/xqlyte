"use client";

import { useState } from "react";

interface Layer {
  title: string;
  metric: string;
  description: string;
  detail: string;
  icon: string;
}

interface FailureClass {
  category: string;
  reason: string;
  fix: string;
  code: string;
}

const ANALYTICAL_LAYERS: Layer[] = [
  {
    title: "Liquidity & Capacity Analyzer",
    metric: "Channel Liquidity Balance",
    description: "Evaluates inbound and outbound balances along the routing path.",
    detail: "Identifies directional bottlenecks and flags hops where local capacity is less than the requested transfer amount, preventing stuck payments.",
    icon: "💧",
  },
  {
    title: "Route & Path Scorer",
    metric: "Topology Hop Count",
    description: "Evaluates hop distances, network density, and redundant channels.",
    detail: "Calculates feasibility based on routing path stability. Ensures that long routes are scored lower for routing risk adjustments.",
    icon: "🗺️",
  },
  {
    title: "Asset & Script Validator",
    metric: "Cell Deps & UDT Scripts",
    description: "Verifies token compatibility and script cell validation requirements.",
    detail: "Ensures intermediate nodes have active script dep cells loaded for the target token (e.g., USDT, CKB UDTs) and checks swap script configurations.",
    icon: "🪙",
  },
  {
    title: "Fee Budget Guardian",
    metric: "Max Fee Constraint Ratio",
    description: "Compares route fee estimates against user-specified budget ceilings.",
    detail: "Blocks paths where cumulative intermediary node fee rates exceed the user-defined threshold, saving costs in multi-hop routings.",
    icon: "⚡",
  },
  {
    title: "Node Uptime Observer",
    metric: "Peer Connectivity Uptime",
    description: "Tracks gossip network reports and node channel stability scores.",
    detail: "Flags degraded node performance and offline nodes to bypass channels that are highly likely to drop payment packets.",
    icon: "🖥️",
  },
];

const FAILURE_CLASSIFICATIONS: FailureClass[] = [
  {
    category: "Capacity Failure",
    code: "ERR_CAPACITY_DEPLETED",
    reason: "Intermediary channel does not have enough local balance to forward the transfer.",
    fix: "Initiate channel rebalancing, reduce payment amount, or choose an alternate routing channel.",
  },
  {
    category: "Asset Failure",
    code: "ERR_SCRIPT_CELL_MISSING",
    reason: "Token script types or dependency cell assets are unsupported at intermediate nodes.",
    fix: "Convert target funds to native CKB token or execute pathing via compatible multi-asset swap provider.",
  },
  {
    category: "Route Failure",
    code: "ERR_PATHFINDING_FAILED",
    reason: "No active physical path or routing channel connects the sender and receiver nodes.",
    fix: "Establish a direct peer connection, or open an active channel to a well-connected Hub node.",
  },
  {
    category: "Fee Failure",
    code: "ERR_EXCESSIVE_FEES",
    reason: "Cumulative fees calculated for the selected routing hops exceed the maximum budget threshold.",
    fix: "Raise max fee tolerance parameter in the SDK, or select alternative lower-cost routes.",
  },
  {
    category: "Node Failure",
    code: "ERR_NODE_OFFLINE",
    reason: "Target routing node is disconnected from the network or unresponsive to handshake checks.",
    fix: "Route around the failing node and temporarily blacklist the host from active path selections.",
  },
  {
    category: "Timeout Failure",
    code: "ERR_TLC_EXPIRED",
    reason: "The transaction lock duration expires before target receipt confirmation can be secured.",
    fix: "Increase transaction lock height safety window or adjust channel timeout margins.",
  },
  {
    category: "Swap Failure",
    code: "ERR_SWAP_UNSUPPORTED",
    reason: "Multi-asset liquidity provider or channel swap node lacks sufficient target currency depth.",
    fix: "Route payments through alternate swap providers or settle directly in input assets.",
  },
  {
    category: "Unknown Failure",
    code: "ERR_GOSSIP_OUT_OF_SYNC",
    reason: "Local network graph gossip database is out of sync or missing channel metadata.",
    fix: "Refresh the local fnn node graph cache and synchronize channel announcements.",
  },
];

export default function FeaturesPage() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  return (
    <div className="bg-[#050608] min-h-screen py-20 px-6">
      <div className="mx-auto max-w-[1200px] space-y-24">
        {/* Page Header */}
        <div className="max-w-[700px] space-y-4">
          <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Observed diagnostics.
          </h1>
          <p className="font-sans text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed font-light">
            XQlyte breaks down the complexity of off-chain routing into five precise, real-time layers and classifies failure states into structured taxonomies.
          </p>
        </div>

        {/* Section 1: The 5 Analytical Layers (Asymmetric Bento-inspired Layout) */}
        <section className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">
              Core Analytical Layers
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-light">
              Five engines analyzing routing performance on every pre-flight request.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {ANALYTICAL_LAYERS.map((layer, idx) => {
              // Asymmetric grid spanning: 1st span-7, 2nd span-5, 3rd span-5, 4th span-7, 5th span-12
              const colSpanClass =
                idx === 0
                  ? "md:col-span-7"
                  : idx === 1
                  ? "md:col-span-5"
                  : idx === 2
                  ? "md:col-span-5"
                  : idx === 3
                  ? "md:col-span-7"
                  : "md:col-span-12";

              return (
                <div
                  key={layer.title}
                  onMouseEnter={() => setHoveredLayer(idx)}
                  onMouseLeave={() => setHoveredLayer(null)}
                  className={`${colSpanClass} border border-[rgba(255,255,255,0.05)] bg-[#0a0c10]/40 hover:bg-[#0c0e14]/60 rounded-2xl p-6 transition-all duration-300 relative group overflow-hidden`}
                >
                  {/* Subtle Background Glow */}
                  <div
                    className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,92,0,0.025),transparent_60%)] transition-opacity duration-300 pointer-events-none ${
                      hoveredLayer === idx ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <div className="flex items-start gap-4 relative z-10">
                    <span className="text-2xl size-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                      {layer.icon}
                    </span>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h3 className="font-display text-base font-bold text-white group-hover:text-[var(--color-accent)] transition-colors duration-200">
                          {layer.title}
                        </h3>
                        <span className="font-mono text-[9px] uppercase tracking-wider bg-white/[0.03] border border-white/5 text-[var(--text-muted)] px-2 py-0.5 rounded-full">
                          {layer.metric}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] font-normal">
                        {layer.description}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] font-light leading-relaxed pt-2 border-t border-white/[0.03] mt-2">
                        {layer.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: The 8 Failure Classifications */}
        <section className="space-y-8">
          <div>
            <h2 className="font-display text-2xl font-bold text-white tracking-tight">
              Failure Taxonomy
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-light">
              XQlyte maps complex node responses into 8 structured failure categories with instant action paths.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FAILURE_CLASSIFICATIONS.map((fail) => (
              <div
                key={fail.category}
                className="border border-[rgba(255,255,255,0.05)] bg-[#07080a] hover:border-[rgba(255,255,255,0.1)] rounded-xl p-5 flex flex-col justify-between transition-all duration-200 group"
              >
                <div>
                  {/* Category & Code */}
                  <div className="space-y-1 mb-4">
                    <h3 className="font-display text-sm font-bold text-white">
                      {fail.category}
                    </h3>
                    <p className="font-mono text-[9px] text-[var(--color-accent)] font-semibold tracking-tight">
                      {fail.code}
                    </p>
                  </div>
                  {/* Reason */}
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-light mb-6">
                    {fail.reason}
                  </p>
                </div>

                {/* Suggested Action Fix */}
                <div className="pt-3 border-t border-white/[0.03] space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                    Suggested Action
                  </span>
                  <p className="text-[11px] text-[var(--color-success)] leading-relaxed font-light">
                    {fail.fix}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
