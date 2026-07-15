"use client";

import Link from "next/link";
import React from "react";

/* ── Inline SVG Icons ────────────────────────────────────── */
function ArrowUpRightIcon({ className, size = 16 }: { className?: string; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="7" y1="17" x2="17" y2="7"></line>
      <polyline points="7 7 17 7 17 17"></polyline>
    </svg>
  );
}

/* ── Inline Pill Component ───────────────────────────────── */
type PillProps = {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "outline";
  mono?: boolean;
  className?: string;
};

export function Pill({
  children,
  tone = "neutral",
  mono = false,
  className = "",
}: PillProps) {
  const tones = {
    neutral: "border-white/10 bg-white/[0.04] text-foreground/80",
    accent: "border-accent/25 bg-accent/[0.08] text-accent",
    outline: "border-white/5 bg-transparent text-muted",
  } as const;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wider ${tones[tone]} ${mono ? "font-mono" : ""} ${className}`}
    >
      {children}
    </span>
  );
}

/* ── Six Legible Visual Components ────────────────────────── */

// 1. Rust Engine
function RustEngineVisual() {
  return (
    <div className="relative flex h-48 w-full flex-col justify-between rounded-xl bg-black/40 p-5 border border-white/5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <span className="text-sm font-semibold tracking-tight text-cyan">xqlyte-core-engine</span>
        <span className="text-xs text-muted">Rust v1.80</span>
      </div>
      <div className="flex flex-1 items-center justify-around py-4">
        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan/15 border border-cyan/30 text-cyan text-sm font-bold">
            IN
          </div>
          <span className="mt-1 text-[11px] font-medium text-muted">Tx Route</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-cyan/30 to-accent/30 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-cyan/70 font-mono">
            eval()
          </span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 border border-accent/30 text-accent text-sm font-bold">
            CORE
          </div>
          <span className="mt-1 text-[11px] font-medium text-muted">Analysis</span>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-emerald-500/30 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] text-emerald-450 font-mono">
            solve()
          </span>
        </div>
        <div className="flex flex-col items-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-550/15 border border-emerald-500/30 text-emerald-400 text-sm font-bold">
            OUT
          </div>
          <span className="mt-1 text-[11px] font-medium text-emerald-400">96.4% Conf</span>
        </div>
      </div>
      <div className="text-[11px] font-medium text-emerald-400 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        VERDICT: PATH_VIABLE (fee check complete)
      </div>
    </div>
  );
}

// 2. WASM Build
function WasmBuildVisual() {
  return (
    <div className="relative flex h-48 w-full flex-col justify-between rounded-xl bg-black/40 p-5 border border-white/5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <span className="text-sm font-semibold tracking-tight text-cyan">wasm-bindgen-pack</span>
        <span className="text-xs text-muted">Target: WebAssembly</span>
      </div>
      <div className="flex flex-1 flex-col justify-center gap-3">
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/80 font-medium">xqlyte_bg.wasm</span>
          <span className="text-emerald-450 font-semibold font-mono">142 KB (compressed)</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-cyan-500 to-accent rounded-full animate-[pulse_2s_infinite]" />
        </div>
      </div>
      <div className="text-[11px] font-medium text-white/70 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-cyan animate-pulse" />
        Client-side pathfinding ready in under 20ms.
      </div>
    </div>
  );
}

// 3. Wallet SDK
function WalletSdkVisual() {
  return (
    <div className="relative flex h-48 w-full flex-col rounded-xl bg-black/40 p-4 border border-white/5 overflow-hidden font-mono text-[13px] text-white/90">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5">
        <span className="text-xs font-semibold text-cyan">TypeScript SDK</span>
        <span className="text-[11px] text-muted">v0.1.2</span>
      </div>
      <div className="flex-1 space-y-1 overflow-y-auto leading-relaxed select-none">
        <p><span className="text-accent">import</span> &#123; <span className="text-cyan">XQlyte</span> &#125; <span className="text-accent">from</span> <span className="text-emerald-400">"@xqlyte/sdk"</span>;</p>
        <p className="text-muted">// execute path precheck</p>
        <p><span className="text-accent">const</span> <span className="text-cyan">check</span> = <span className="text-accent">await</span> <span className="text-cyan">XQlyte</span>.<span className="text-yellow-400">canPay</span>(&#123;</p>
        <p>&nbsp;&nbsp;amount: <span className="text-amber-400">"500.00"</span>,</p>
        <p>&nbsp;&nbsp;asset: <span className="text-amber-400">"USDT"</span>,</p>
        <p>&nbsp;&nbsp;to: <span className="text-emerald-450">"alice_node"</span></p>
        <p>&#125;);</p>
      </div>
    </div>
  );
}

// 4. CLI Tool
function CliToolVisual() {
  return (
    <div className="relative flex h-48 w-full flex-col rounded-xl bg-black/40 p-4 border border-white/5 overflow-hidden font-mono text-[13px] text-white/90">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5 mb-2.5">
        <span className="text-xs font-semibold text-emerald-400">CLI Diagnostic Utility</span>
        <span className="text-[11px] text-muted">bash</span>
      </div>
      <div className="flex-1 space-y-1.5 leading-relaxed">
        <p className="text-muted">$ xqlyte diagnose --peer bob --amount 2500</p>
        <p className="text-cyan">⚡ Intercepting route parameters...</p>
        <p className="text-emerald-400">✔ Path analysis: 3 hops resolved (12ms)</p>
        <p className="text-emerald-400">✔ Channel capacity: sufficient liquidity</p>
        <p className="text-emerald-450 font-bold">✔ PRE-FLIGHT VERDICT: CAN_PAY</p>
      </div>
    </div>
  );
}

// 5. Developer Dashboard
function DeveloperDashboardVisual() {
  return (
    <div className="relative flex h-48 w-full flex-col justify-between rounded-xl bg-black/40 p-5 border border-white/5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
        <span className="text-sm font-semibold tracking-tight text-cyan">Telemetric Logs</span>
        <span className="text-xs text-muted">Last 24 hours</span>
      </div>
      <div className="flex flex-1 items-center justify-between py-2 gap-4">
        {/* Latency metric */}
        <div className="flex flex-col">
          <span className="text-2xl font-bold text-white tracking-tight">14.2ms</span>
          <span className="text-xs text-muted">Average Latency</span>
        </div>
        {/* Failure Breakdown */}
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] font-medium text-white/70">
            <span>Liquidity Cap</span>
            <span>68%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-[68%] bg-accent rounded-full" />
          </div>

          <div className="flex justify-between text-[11px] font-medium text-white/70">
            <span>Offline Peers</span>
            <span>22%</span>
          </div>
          <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full w-[22%] bg-cyan rounded-full" />
          </div>
        </div>
      </div>
      <div className="text-[11px] font-medium text-white/70 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        Diagnostic nodes operational in 4 regions.
      </div>
    </div>
  );
}

// 6. Telegram Bot
function TelegramBotVisual() {
  return (
    <div className="relative flex h-48 w-full flex-col justify-between rounded-xl bg-black/40 p-4 border border-white/5">
      <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
        <span className="text-sm font-semibold tracking-tight text-cyan">Telegram Interface</span>
        <span className="text-xs text-muted">xqlyte_bot</span>
      </div>
      {/* Chat Messages */}
      <div className="flex-1 flex flex-col gap-2 justify-center">
        <div className="self-end max-w-[85%] rounded-xl bg-cyan/10 border border-cyan/20 px-3.5 py-1.5 text-xs text-white/90">
          Can I send 50 USDT to merchant_node?
        </div>
        <div className="self-start max-w-[85%] rounded-xl bg-white/[0.03] border border-white/5 px-3.5 py-1.5 text-xs text-white/90 flex flex-col gap-0.5">
          <span className="font-semibold text-emerald-450">⚡ Diagnostic Complete</span>
          <span>Success! Path is viable. 94% confidence score.</span>
        </div>
      </div>
    </div>
  );
}

/* ── 3D Perspective Card Component ──────────────────────── */
interface InfraCardProps {
  title: string;
  description: string;
  pillText: string;
  visual: React.ReactNode;
  docHref: string;
}

function InfraCard({ title, description, pillText, visual, docHref }: InfraCardProps) {
  return (
    <div className="relative flex w-full items-center justify-center [perspective:2000px]">
      {/* Background glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-1/2 -z-10 h-[220px] w-[450px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/[0.03] blur-[80px]"
      />
      <div
        className={[
          "group relative z-10 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#070708]",
          "shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)]",
          "transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)]",
          "md:[transform:rotateX(18deg)]",
          "md:hover:[transform:rotateX(0deg)]",
          "flex flex-col justify-between min-h-[470px]"
        ].join(" ")}
      >
        <div>
          {/* Header bar */}
          <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-6 py-4">
            <div className="flex items-center gap-3">
              <Pill tone="accent" mono>
                {pillText}
              </Pill>
              <span className="font-mono text-xs text-foreground font-semibold">XQlyte</span>
            </div>
            <span className="text-xs text-muted font-medium">pre-flight</span>
          </div>

          {/* Visual Container */}
          <div className="p-6 bg-gradient-to-b from-[#0a0a0c] to-[#070708]">
            {visual}
          </div>

          {/* Text content */}
          <div className="px-6 pb-4 pt-2">
            <h3 className="text-xl font-bold text-white tracking-tight leading-tight">{title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">{description}</p>
          </div>
        </div>

        {/* Footer Link */}
        <div className="px-6 pb-6 pt-2">
          <Link
            href={docHref}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent/90 transition-colors"
          >
            Read documentation
            <ArrowUpRightIcon size={14} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ── Main Section Component ──────────────────────────────── */
export function InfrastructureSection() {
  return (
    <section
      id="infrastructure"
      className="relative z-10 mx-auto max-w-[1400px] px-6 pt-24 pb-24 border-b border-border bg-canvas"
    >
      <div className="mb-20 max-w-4xl">
        <h2 className="text-5xl font-semibold leading-[1.05] tracking-tighter text-foreground md:text-7xl">
          Simulate paths, <br className="hidden md:block" />
          <span className="text-muted">diagnose before you broadcast.</span>
        </h2>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white">
          XQlyte evaluates path parameters and liquidity balances on the Nervos Fiber
          Network. Avoid locked TLVs, detect expired cell dependencies, and verify multi-hop routes in real-time.
        </p>
        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <Link
            href="/docs"
            style={{ color: "#000000" }}
            className="rounded-full bg-accent px-6 py-2.5 text-sm font-semibold transition-all duration-200 ease-out hover:bg-accent/90 active:scale-[0.98] shadow-[0_0_20px_rgba(255,92,0,0.2)] inline-flex items-center gap-1.5"
          >
            Start integrating
            <ArrowUpRightIcon size={16} />
          </Link>
          <Link
            href="/docs"
            className="group inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-white transition-colors hover:text-accent"
          >
            View architecture doc
            <ArrowUpRightIcon
              size={14}
              className="text-muted transition-all group-hover:text-accent group-hover:translate-x-0.5"
            />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <InfraCard
          pillText="engine"
          title="Rust Core Engine"
          docHref="/docs#rust-core-engine"
          description="The primary intelligence layer. Evaluates channel liquidity, asset compatibility, and route stability, producing structured error classification and confidence scores."
          visual={<RustEngineVisual />}
        />
        <InfraCard
          pillText="wasm"
          title="WASM Browser Build"
          docHref="/docs#wasm-browser-build"
          description="WebAssembly wrapper of the Rust core engine. Enables browser wallets, dApps, and web applications to run pre-flight simulations client-side in under 20ms."
          visual={<WasmBuildVisual />}
        />
        <InfraCard
          pillText="sdk"
          title="Wallet SDK"
          docHref="/docs#wallet-sdk"
          description="A drop-in SDK for Fiber wallets. Abstracts channel complexities, allowing developers to embed pre-payment confidence checks with simple function calls."
          visual={<WalletSdkVisual />}
        />
        <InfraCard
          pillText="cli"
          title="CLI Diagnostic Tool"
          docHref="/docs#cli-diagnostic-tool"
          description="Command-line interface for node operators and developers. Run local path audits, diagnose node readiness, and query channel topologies directly from the terminal."
          visual={<CliToolVisual />}
        />
        <InfraCard
          pillText="dashboard"
          title="Developer Dashboard"
          docHref="/docs#developer-dashboard"
          description="A centralized web interface for tracking transaction logs, channel failure rates, diagnostic latency, and network-wide routing bottlenecks."
          visual={<DeveloperDashboardVisual />}
        />
        <InfraCard
          pillText="bot"
          title="Telegram Diagnostic Bot"
          docHref="/docs#telegram-diagnostic-bot"
          description="A conversational assistant for users to run quick connectivity checks. Send a simple 'Can I pay?' prompt to query route viability on the fly."
          visual={<TelegramBotVisual />}
        />
      </div>
    </section>
  );
}
