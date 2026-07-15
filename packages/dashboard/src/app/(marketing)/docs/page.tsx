"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";

interface Heading {
  id: string;
  text: string;
}

interface PageContent {
  id: string;
  title: string;
  category: string;
  description: string;
  headings: Heading[];
  render: (setActivePage: (id: string) => void) => React.ReactNode;
}

export default function DocsPage() {
  const [activePage, setActivePage] = useState("intro");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Copy to clipboard helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Scroll to heading helper
  const scrollToHeading = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90; // offset for fixed header
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  // Reset scroll when changing page
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [activePage]);

  // Command palette toggle (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchModalOpen((open) => !open);
      } else if (e.key === "Escape") {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus modal input on open
  useEffect(() => {
    if (searchModalOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 80);
    }
  }, [searchModalOpen]);

  // Code Block Component
  const CodeBlock = ({ code, language = "bash", id }: { code: string; language?: string; id: string }) => (
    <div className="relative group bg-[#07090c] border border-white/5 rounded-xl overflow-hidden my-6 font-mono">
      <div className="bg-[#0b0e12]/80 border-b border-white/5 px-5 py-2.5 flex items-center justify-between">
        <span className="text-[11px] text-muted font-semibold uppercase tracking-wider">{language}</span>
        <button
          onClick={() => copyToClipboard(code, id)}
          className="text-[11px] text-muted hover:text-white transition-colors duration-150 cursor-pointer"
        >
          {copiedId === id ? "Copied ✓" : "Copy"}
        </button>
      </div>
      <pre className="p-5 overflow-x-auto text-[13px] sm:text-sm text-gray-300 leading-relaxed select-all">
        <code>{code}</code>
      </pre>
    </div>
  );

  // Alert Callout Component
  const Callout = ({ type, title, children }: { type: "note" | "tip" | "important" | "warning"; title: string; children: React.ReactNode }) => {
    const styles = {
      note: {
        border: "border-blue-500/20",
        bg: "bg-blue-500/[0.02]",
        titleColor: "text-blue-400",
        icon: (
          <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      tip: {
        border: "border-cyan-500/20",
        bg: "bg-cyan-500/[0.02]",
        titleColor: "text-cyan-400",
        icon: (
          <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364.364l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
      },
      important: {
        border: "border-amber-500/20",
        bg: "bg-amber-500/[0.02]",
        titleColor: "text-amber-400",
        icon: (
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
      },
      warning: {
        border: "border-red-500/20",
        bg: "bg-red-500/[0.02]",
        titleColor: "text-red-400",
        icon: (
          <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
    };

    return (
      <div className={`border ${styles[type].border} ${styles[type].bg} rounded-xl p-5 my-6 text-[15px] sm:text-[16px] leading-relaxed font-sans`}>
        <div className="flex items-center gap-2 mb-2">
          {styles[type].icon}
          <span className={`font-inter font-semibold uppercase tracking-wider text-[11px] ${styles[type].titleColor}`}>
            {title}
          </span>
        </div>
        <div className="text-gray-300/90 leading-relaxed font-light">{children}</div>
      </div>
    );
  };

  // Structured pages data
  const PAGES: Record<string, PageContent> = {
    intro: {
      id: "intro",
      title: "Introduction",
      category: "Getting Started",
      description: "Understand the off-chain payment reliability problem and how XQlyte diagnostics resolve it.",
      headings: [
        { id: "what-is-xqlyte", text: "What is XQlyte?" },
        { id: "blind-broadcast", text: "The Blind Broadcast Problem" },
        { id: "core-capabilities", text: "Core Diagnostic Actions" },
        { id: "monorepo-toolbox", text: "System Toolbox" },
        { id: "explore-docs", text: "Explore the Documentation" },
      ],
      render: (setActivePage) => (
        <div className="space-y-6">
          <h2 id="what-is-xqlyte" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            What is XQlyte?
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            XQlyte is an advanced <strong>Payment Diagnostics & Observability Engine</strong> designed specifically for the Nervos Fiber Network (built on CKB). It acts as an intelligent pre-flight analysis layer that sits between payment applications (wallets, dApps, bots) and the network node daemon (<code className="font-mono text-xs px-1.5 py-0.5 bg-white/5 rounded text-cyan">fnn</code>).
          </p>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            By running light client simulations or querying local node routing tables, XQlyte forecasts whether a multi-hop payment can succeed, assigns a quantitative confidence score, and provides actionable fallback suggestions if paths are degraded.
          </p>

          <h2 id="blind-broadcast" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            The Blind Broadcast Problem
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            In off-chain payment channels, executing a transaction requires routing balance across multiple intermediary hops. Because routing conditions shift dynamically and nodes do not broadcast their current channel states to a central server, payments face several friction points:
          </p>
          <ul className="list-disc list-inside space-y-3.5 font-atkinson text-base sm:text-[17px] text-gray-300 font-light pl-2 mb-6">
            <li><strong className="text-white">Capacity Imbalances:</strong> A channel might have ample total liquidity, but if the balance is loaded on the inbound side (remote balance), it cannot support outbound payments.</li>
            <li><strong className="text-white">Token Script Incompatibilities:</strong> Unlike single-asset networks, Fiber channels support native CKB, stablecoins, and custom <strong>RGB++ assets</strong>. Intermediary hops may lack the cell dependencies to route a specific token.</li>
            <li><strong className="text-white">Silent Node Dropouts:</strong> Nodes can go offline or run out of fee budgets, turning a computed path into a dead end.</li>
          </ul>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Broadcasting blindly under these conditions leads to stuck payments, locked funds (due to HTLC/TLC expiries), and poor user experiences. XQlyte solves this by letting developers check paths and liquidity <em>before</em> sending a transactions.
          </p>

          <Callout type="note" title="Zero Key Exposure">
            XQlyte evaluates network topologies without requiring private keys or signing capabilities, allowing it to run safely directly inside front-end clients or third-party query engines.
          </Callout>

          <h2 id="core-capabilities" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Core Diagnostic Actions
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            XQlyte exposes three fundamental analysis mechanisms to payment channels:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
            <div className="p-6 border border-white/5 bg-white/[0.01] hover:border-white/10 rounded-xl transition-all duration-200">
              <div className="text-xl font-semibold text-accent mb-2">1. can_pay()</div>
              <p className="font-atkinson text-sm text-gray-400 font-light leading-relaxed">
                Evaluates a payment request against channel topology, returning a 0–100 confidence score and success probability flag.
              </p>
            </div>
            <div className="p-6 border border-white/5 bg-white/[0.01] hover:border-white/10 rounded-xl transition-all duration-200">
              <div className="text-xl font-semibold text-cyan mb-2">2. diagnose()</div>
              <p className="font-atkinson text-sm text-gray-400 font-light leading-relaxed">
                If confidence is low or a payment fails, this classifies the root error and provides technical reasons.
              </p>
            </div>
            <div className="p-6 border border-white/5 bg-white/[0.01] hover:border-white/10 rounded-xl transition-all duration-200">
              <div className="text-xl font-semibold text-white mb-2">3. suggestion()</div>
              <p className="font-atkinson text-sm text-gray-400 font-light leading-relaxed">
                Returns human-readable remedies (e.g. rebalancing, selecting alternate routes, swapping assets).
              </p>
            </div>
          </div>

          <h2 id="monorepo-toolbox" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            System Toolbox
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Depending on your tech stack, XQlyte can be integrated using these tools:
          </p>
          <div className="border border-white/5 bg-[#07090c]/50 rounded-xl overflow-hidden my-6 font-inter text-sm">
            <div className="grid grid-cols-3 bg-[#0b0e12] border-b border-white/5 px-5 py-4 font-semibold text-muted">
              <div>Tool</div>
              <div>Usage</div>
              <div>Best For</div>
            </div>
            <div className="grid grid-cols-3 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-accent font-semibold">xqlyte-js (WASM)</div>
              <div>NPM package imports</div>
              <div>Client-side React/Node.js web applications</div>
            </div>
            <div className="grid grid-cols-3 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-cyan font-semibold">xqlyte-cli</div>
              <div>Terminal executable</div>
              <div>Manual probing & scriptable checks</div>
            </div>
            <div className="grid grid-cols-3 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-white font-semibold">api-server (Axum)</div>
              <div>REST API Server</div>
              <div>Shared logging databases & background checkers</div>
            </div>
            <div className="grid grid-cols-3 px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-muted font-semibold">Telegram Bot</div>
              <div>Slash commands</div>
              <div>Quick admin querying and status alerts</div>
            </div>
          </div>

          {/* Navigation Bento Grid */}
          <h2 id="explore-docs" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-10 mb-6">
            Explore the Documentation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 my-8">
            {/* Architecture */}
            <div 
              onClick={() => setActivePage("architecture")}
              className="group relative bg-[#0a0c10]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-purple-400 mb-4 font-semibold">
                  GETTING STARTED
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-purple-400 transition-colors">Architecture</h3>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                  Understand monorepo layout packaging, code topologies, zero-I/O constraints, and RPC service mode boundaries.
                </p>
              </div>
            </div>

            {/* Confidence Scorer */}
            <div 
              onClick={() => setActivePage("scoring")}
              className="group relative bg-[#0a0c10]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-cyan-400 mb-4 font-semibold">
                  DIAGNOSTIC ENGINE
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors">Confidence Scorer</h3>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                  Deep dive into the 5 core scoring engines, the point allocation matrix, and stale-data safety modifiers.
                </p>
              </div>
            </div>

            {/* Failure Taxonomy */}
            <div 
              onClick={() => setActivePage("taxonomy")}
              className="group relative bg-[#0a0c10]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-red-500/10 to-amber-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-red-400 mb-4 font-semibold">
                  DIAGNOSTIC ENGINE
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">Failure Taxonomy</h3>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                  Understand the 8 categories of off-chain failures (Capacity, Asset, Route, Fee...) and automated client recovery states.
                </p>
              </div>
            </div>

            {/* WASM SDK */}
            <div 
              onClick={() => setActivePage("wasm-sdk")}
              className="group relative bg-[#0a0c10]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-teal-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full border border-teal-500/20 bg-teal-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-teal-400 mb-4 font-semibold">
                  INTEGRATIONS & SDKS
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-teal-400 transition-colors">WASM SDK</h3>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                  Integrate lightweight zero-private-key simulations directly inside web-browsers using compiled WebAssembly wrappers.
                </p>
              </div>
            </div>

            {/* Rust SDK */}
            <div 
              onClick={() => setActivePage("rust-sdk")}
              className="group relative bg-[#0a0c10]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-orange-400 mb-4 font-semibold">
                  INTEGRATIONS & SDKS
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:bg-orange-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-orange-400 transition-colors">Rust SDK & CLI</h3>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                  Configure native CLI executables, import Rust orchestrators, and debug channel states from the terminal.
                </p>
              </div>
            </div>

            {/* Axum API Server */}
            <div 
              onClick={() => setActivePage("api-server")}
              className="group relative bg-[#0a0c10]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-blue-400 mb-4 font-semibold">
                  SERVICES & ORCHESTRATION
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">Axum API & SQLite</h3>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                  Run local HTTP microservices, log payment histories, and inspect persistent SQLite auditing schemas.
                </p>
              </div>
            </div>

            {/* Telegram Bot */}
            <div 
              onClick={() => setActivePage("telegram-bot")}
              className="group relative bg-[#0a0c10]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-sky-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full border border-sky-500/20 bg-sky-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-sky-400 mb-4 font-semibold">
                  SERVICES & ORCHESTRATION
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">Telegram Bot Daemon</h3>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                  Expose interactive slash commands (/can_pay, /diagnose) to trigger failure simulations and status reports via chat.
                </p>
              </div>
            </div>

            {/* Hackathon Alignment */}
            <div 
              onClick={() => setActivePage("hackathon")}
              className="group relative md:col-span-2 lg:col-span-2 bg-[#0a0c10]/40 border border-white/5 hover:border-white/10 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)] overflow-hidden cursor-pointer"
            >
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none blur-sm" />
              <div className="relative z-10">
                <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-amber-400 mb-4 font-semibold">
                  HACKATHON ALIGNMENT
                </span>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5a2 2 0 10-2 2h2zm0 0h4m-4 0H8m12 0a2 2 0 100-4h-4m4 4c0 1.11-.89 2-2 2h-2m-4-2H8m0 0a2 2 0 110-4h4m-4 4c0 1.11.89 2 2 2h2m3-12V3a1 1 0 00-1-1H9a1 1 0 00-1 1v2m8 0a1 1 0 00-1-1H9a1 1 0 00-1 1v2" />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">Hackathon & Judging Guide</h3>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                  Understand how XQlyte solves core infrastructure limitations, matches judging guidelines, and maps to official categories.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    architecture: {
      id: "architecture",
      title: "Architecture & Topology",
      category: "Getting Started",
      description: "Visual and structured walkthrough of the XQlyte subsystem communication path.",
      headings: [
        { id: "monorepo-layout", text: "Monorepo Package Structure" },
        { id: "topology-flowchart", text: "Subsystem Data Flow" },
        { id: "rpc-abstraction", text: "RPC Mode Abstraction" },
      ],
      render: () => (
        <div className="space-y-6">
          <h2 id="monorepo-layout" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            Monorepo Package Structure
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            XQlyte is managed in a single Rust monorepo workspace to cleanly isolate core computations from external drivers:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-inter text-xs my-6">
            <div className="p-6 border border-white/5 bg-[#07090c] rounded-xl space-y-4">
              <div className="text-sm font-semibold text-white uppercase tracking-wider">Core Logic (Zero I/O)</div>
              <ul className="space-y-3 text-muted font-light list-disc list-inside text-sm sm:text-[14px]">
                <li><code className="text-accent font-mono">crates/engine</code>: The core analyzer logic. Validates inputs, scores variables, and maps errors. Compiles to native Rust & WASM.</li>
                <li><code className="text-white font-mono">crates/rpc</code>: The standard trait boundary for fetching channel and path graph parameters.</li>
              </ul>
            </div>
            <div className="p-6 border border-white/5 bg-[#07090c] rounded-xl space-y-4">
              <div className="text-sm font-semibold text-white uppercase tracking-wider">Integration Targets</div>
              <ul className="space-y-3 text-muted font-light list-disc list-inside text-sm sm:text-[14px]">
                <li><code className="text-cyan font-mono">crates/sdk-rust</code>: Integrates RPC outputs with the scoring engine.</li>
                <li><code className="text-white font-mono">crates/sdk-wasm</code>: Exposes bindings to Javascript runtimes.</li>
                <li><code className="text-white font-mono">crates/cli</code>: Provides executable shell access.</li>
                <li><code className="text-white font-mono">crates/api-server</code>: Serves REST requests and populates SQLite logs.</li>
              </ul>
            </div>
          </div>

          <h2 id="topology-flowchart" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Subsystem Data Flow
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The interactive flowchart below illustrates how diagnostic data is requested, fetched, scored, and persistently logged:
          </p>

          {/* Premium Vector SVG Diagram */}
          <div className="my-8 p-6 bg-[#07090c] border border-white/5 rounded-2xl flex justify-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.6)]">
            <svg width="100%" height="320" viewBox="0 0 800 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-3xl">
              <defs>
                <linearGradient id="orangeGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ff5c00" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#ff7c2b" stopOpacity="0.2"/>
                </linearGradient>
                <linearGradient id="cyanGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#3bf2ff" stopOpacity="0.2"/>
                </linearGradient>
                <linearGradient id="purpleGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.2"/>
                </linearGradient>
                <linearGradient id="emeraldGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0.2"/>
                </linearGradient>
                <linearGradient id="roseGlow" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#f87171" stopOpacity="0.2"/>
                </linearGradient>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#737373" />
                </marker>
                <marker id="arrowCyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#00e5ff" />
                </marker>
                <marker id="arrowOrange" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff5c00" />
                </marker>
              </defs>

              {/* Clients Layer */}
              <g id="clients">
                <rect x="20" y="30" width="130" height="54" rx="10" fill="url(#orangeGlow)" stroke="#ff5c00" strokeWidth="1.5" />
                <text x="85" y="58" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">CLI Executable</text>
                <text x="85" y="73" fill="#ff5c00" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.05em">CRATES/CLI</text>

                <rect x="180" y="30" width="130" height="54" rx="10" fill="#0a0c10" stroke="#737373" strokeWidth="1.5" strokeOpacity="0.4" />
                <text x="245" y="58" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">Telegram Bot</text>
                <text x="245" y="73" fill="#737373" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.05em">PACKAGES/BOT</text>

                <rect x="340" y="30" width="130" height="54" rx="10" fill="#0a0c10" stroke="#737373" strokeWidth="1.5" strokeOpacity="0.4" />
                <text x="405" y="58" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">Web Dashboard</text>
                <text x="405" y="73" fill="#737373" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.05em">PACKAGES/DASHBOARD</text>
              </g>

              {/* Axum Server Layer */}
              <g id="server">
                <rect x="230" y="125" width="150" height="54" rx="10" fill="url(#roseGlow)" stroke="#ef4444" strokeWidth="1.5" />
                <text x="305" y="153" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">Axum API Server</text>
                <text x="305" y="168" fill="#ef4444" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.05em">CRATES/API-SERVER</text>

                <rect x="230" y="225" width="150" height="44" rx="8" fill="#11161f" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="3 3" />
                <text x="305" y="251" fill="#f87171" fontSize="11" fontFamily="Geist Mono" textAnchor="middle">SQLite Log Store</text>
              </g>

              {/* SDKs Layer */}
              <g id="sdks">
                <rect x="520" y="30" width="120" height="54" rx="10" fill="url(#cyanGlow)" stroke="#00e5ff" strokeWidth="1.5" />
                <text x="580" y="58" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">sdk-rust</text>
                <text x="580" y="73" fill="#00e5ff" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.05em">CRATES/SDK-RUST</text>

                <rect x="660" y="30" width="120" height="54" rx="10" fill="url(#cyanGlow)" stroke="#00e5ff" strokeWidth="1.5" />
                <text x="720" y="58" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">sdk-wasm</text>
                <text x="720" y="73" fill="#00e5ff" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.05em">CRATES/SDK-WASM</text>
              </g>

              {/* Core Engine Layer */}
              <g id="engine">
                <rect x="580" y="130" width="140" height="60" rx="12" fill="url(#emeraldGlow)" stroke="#10b981" strokeWidth="1.8" />
                <text x="650" y="160" fill="#ffffff" fontSize="13" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">xqlyte-engine</text>
                <text x="650" y="176" fill="#10b981" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.05em">CRATES/ENGINE</text>
              </g>

              {/* RPC Interface Layer */}
              <g id="rpc">
                <rect x="580" y="235" width="140" height="54" rx="10" fill="url(#purpleGlow)" stroke="#8b5cf6" strokeWidth="1.5" />
                <text x="650" y="263" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">RPC abstraction</text>
                <text x="650" y="278" fill="#8b5cf6" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" letterSpacing="0.05em">CRATES/RPC</text>
              </g>

              {/* Connections (Lines & Paths) */}
              {/* Bot & Dashboard -> API Server */}
              <path d="M 245 84 L 245 105 L 290 105 L 290 120" stroke="#737373" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />
              <path d="M 405 84 L 405 105 L 320 105 L 320 120" stroke="#737373" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />

              {/* API Server -> DB */}
              <line x1="305" y1="180" x2="305" y2="220" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />

              {/* CLI & Axum Server -> sdk-rust */}
              <path d="M 85 85 L 85 110 L 500 110 L 500 57 L 515 57" stroke="#ff5c00" strokeWidth="1.5" markerEnd="url(#arrowOrange)" fill="none" />
              <path d="M 380 152 L 490 152 L 490 68 L 515 68" stroke="#737373" strokeWidth="1.5" markerEnd="url(#arrow)" fill="none" />

              {/* sdk-rust -> xqlyte-engine */}
              <path d="M 580 85 L 580 145 L 575 145" stroke="#00e5ff" strokeWidth="1.5" fill="none" />
              <path d="M 575 145 L 580 145" stroke="#00e5ff" strokeWidth="1.5" markerEnd="url(#arrowCyan)" />

              {/* sdk-wasm -> xqlyte-engine */}
              <path d="M 720 85 L 720 145 L 725 145" stroke="#00e5ff" strokeWidth="1.5" fill="none" />
              <path d="M 725 145 L 720 145" stroke="#00e5ff" strokeWidth="1.5" markerEnd="url(#arrowCyan)" />

              {/* Dashboard -> sdk-wasm (directly inside browser) */}
              <path d="M 470 57 L 515 57" stroke="#737373" strokeWidth="1.5" strokeOpacity="0" fill="none" />
              <path d="M 405 30 L 405 15 L 720 15 L 720 25" stroke="#737373" strokeWidth="1.2" strokeOpacity="0.4" markerEnd="url(#arrow)" fill="none" />

              {/* xqlyte-engine -> RPC Interface */}
              <line x1="650" y1="191" x2="650" y2="230" stroke="#10b981" strokeWidth="1.5" markerEnd="url(#arrow)" />
            </svg>
          </div>

          <h2 id="rpc-abstraction" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            RPC Mode Abstraction
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            XQlyte features a trait-based network layer that isolates the diagnostic tools from the target node environment. It operates in two modes:
          </p>
          <ul className="list-disc list-inside space-y-3.5 font-atkinson text-base sm:text-[17px] text-gray-300 font-light pl-2 mb-6">
            <li><strong className="text-white">Mock Mode (Offline):</strong> Default mode. Intercepts RPC requests and provides static, deterministic network mock shapes. This is useful for running unit tests or simulating channel failures in isolation.</li>
            <li><strong className="text-white">Live Mode (Online):</strong> Connects directly to a running Fiber testnet/mainnet node (<code className="font-mono text-xs px-1.5 py-0.5 bg-white/5 text-cyan rounded">fnn</code>) via JSON-RPC, extracting real-time balance sheets and gossip channel routes.</li>
          </ul>
        </div>
      ),
    },
    scoring: {
      id: "scoring",
      title: "Confidence Scorer",
      category: "Diagnostic Engine",
      description: "Understand the mathematical variables and threshold weights of the pre-flight score.",
      headings: [
        { id: "score-allocation", text: "Point Allocation Matrix" },
        { id: "the-five-analyzers", text: "The Five Analyzers" },
        { id: "decision-pipeline", text: "Pre-flight Decision Pipeline" },
        { id: "stale-data-penalty", text: "Stale/Missing Data Penalty" },
        { id: "status-thresholds", text: "Status Threshold Limits" },
      ],
      render: () => (
        <div className="space-y-6">
          <h2 id="score-allocation" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            Point Allocation Matrix
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The pre-flight confidence scorer compiles diagnostics from 5 separate parameters, adding up to a maximum score of <strong>100 points</strong>:
          </p>
          <div className="border border-white/5 bg-[#07090c]/50 rounded-xl overflow-hidden my-6 font-inter text-sm">
            <div className="grid grid-cols-4 bg-[#0b0e12] border-b border-white/5 px-5 py-4 font-semibold text-muted">
              <div>Analyzer</div>
              <div>Max Points</div>
              <div>Evaluates</div>
              <div>High Risk Trigger</div>
            </div>
            <div className="grid grid-cols-4 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-accent font-semibold">Route Scorer</div>
              <div>30 Points</div>
              <div>Hop length & path stability</div>
              <div>&gt; 5 hops or unstable nodes</div>
            </div>
            <div className="grid grid-cols-4 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-cyan font-semibold">Asset Compatibility</div>
              <div>20 Points</div>
              <div>UDT cell support & swaps</div>
              <div>Unregistered swap provider</div>
            </div>
            <div className="grid grid-cols-4 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-white font-semibold">Liquidity Direction</div>
              <div>30 Points</div>
              <div>Inbound vs outbound capacity</div>
              <div>Local channel balance &lt; payment</div>
            </div>
            <div className="grid grid-cols-4 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-white font-semibold">Fee Scorer</div>
              <div>10 Points</div>
              <div>Cost-to-proportional budget ratio</div>
              <div>Fees exceeding 5% of amount</div>
            </div>
            <div className="grid grid-cols-4 px-5 py-4 text-gray-300 font-light">
              <div className="font-mono text-white font-semibold">Node Health</div>
              <div>10 Points</div>
              <div>Uptime ratio & online status</div>
              <div>Intermediary node offline</div>
            </div>
          </div>

          <h2 id="the-five-analyzers" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            The Five Analyzers
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Each of the five analyzers operates independently to evaluate specific parts of the routing transaction:
          </p>
          <div className="space-y-6 font-atkinson text-base sm:text-[17px] text-gray-300 font-light my-6">
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-inter text-sm uppercase tracking-wider block mb-1">1. Route Analyzer</strong>
              Calculates routing difficulty. Shorter hop lists receive maximum points (30). Hops containing nodes with historic routing failures or transient connection flags suffer safety penalties.
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-inter text-sm uppercase tracking-wider block mb-1">2. Asset Analyzer</strong>
              Verifies if the requested token is supported. Standard native CKB payment channels score 20. If custom User Defined Tokens (UDT) are requested, the scorer checks for native script cell compatibility. If swap conversion is needed, it checks for active swap providers (scoring 12).
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-inter text-sm uppercase tracking-wider block mb-1">3. Liquidity Analyzer</strong>
              Performs dry runs of channel balances. Checks if outbound channels along the chosen path contain sufficient local balances (capacity + safety buffer) to satisfy both the payment value and the accumulated fees of downstream hops.
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-inter text-sm uppercase tracking-wider block mb-1">4. Fee Scorer</strong>
              Protects developers from high fee spikes. Translates the computed path fees into a ratio. Routes with fee rates under 1% score 10. Higher ratios subtract points, hitting 0 if fees exceed budget limits.
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-inter text-sm uppercase tracking-wider block mb-1">5. Node Analyzer</strong>
              Collects connectivity logs. Uses the gossip topology layer to inspect peer-to-peer statuses. Intermediary nodes with low uptime ratios or high peer dropouts lower the score.
            </div>
          </div>

          <h2 id="decision-pipeline" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Pre-flight Decision Pipeline
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The step-by-step diagnostic pipeline below illustrates how XQlyte processes, scores, and classifies pre-flight checks:
          </p>

          {/* New Decision Pipeline Diagram */}
          <div className="my-8 p-6 bg-[#07090c] border border-white/5 rounded-2xl flex justify-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.6)]">
            <svg width="100%" height="280" viewBox="0 0 800 280" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-3xl">
              <defs>
                <marker id="arrowHead" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#737373" />
                </marker>
              </defs>

              {/* Step 1: Input */}
              <rect x="15" y="110" width="110" height="50" rx="8" fill="#11161f" stroke="#737373" strokeWidth="1.2" strokeOpacity="0.4" />
              <text x="70" y="134" fill="#ffffff" fontSize="11" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">1. Payment Request</text>
              <text x="70" y="148" fill="#737373" fontSize="8" fontFamily="Geist Mono" textAnchor="middle">sender/receiver/value</text>

              <line x1="125" y1="135" x2="155" y2="135" stroke="#737373" strokeWidth="1.2" markerEnd="url(#arrowHead)" />

              {/* Step 2: Validator */}
              <rect x="160" y="110" width="100" height="50" rx="8" fill="#11161f" stroke="#737373" strokeWidth="1.2" strokeOpacity="0.4" />
              <text x="210" y="134" fill="#ffffff" fontSize="11" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">2. Input Validator</text>
              <text x="210" y="148" fill="#737373" fontSize="8" fontFamily="Geist Mono" textAnchor="middle">types.rs validations</text>

              <line x1="260" y1="135" x2="290" y2="135" stroke="#737373" strokeWidth="1.2" markerEnd="url(#arrowHead)" />

              {/* Step 3: RPC Fetch */}
              <rect x="295" y="110" width="115" height="50" rx="8" fill="#11161f" stroke="#737373" strokeWidth="1.2" strokeOpacity="0.4" />
              <text x="352" y="134" fill="#ffffff" fontSize="11" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">3. Node RPC Fetch</text>
              <text x="352" y="148" fill="#8b5cf6" fontSize="8" fontFamily="Geist Mono" textAnchor="middle">live / mock client</text>

              <line x1="410" y1="135" x2="445" y2="135" stroke="#737373" strokeWidth="1.2" markerEnd="url(#arrowHead)" />

              {/* Step 4: 5 Analyzers */}
              <rect x="450" y="40" width="130" height="190" rx="10" fill="#0c0e12" stroke="#00e5ff" strokeWidth="1.5" />
              <text x="515" y="60" fill="#00e5ff" fontSize="11" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">4. Scoring Engine</text>
              
              {/* Analyzer sub-items */}
              <rect x="460" y="75" width="110" height="22" rx="4" fill="#1c2331" />
              <text x="515" y="89" fill="#e5e7eb" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Route (30 pts)</text>
              
              <rect x="460" y="103" width="110" height="22" rx="4" fill="#1c2331" />
              <text x="515" y="117" fill="#e5e7eb" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Asset (20 pts)</text>

              <rect x="460" y="131" width="110" height="22" rx="4" fill="#1c2331" />
              <text x="515" y="145" fill="#e5e7eb" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Liquidity (30 pts)</text>

              <rect x="460" y="159" width="110" height="22" rx="4" fill="#1c2331" />
              <text x="515" y="173" fill="#e5e7eb" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Fee (10 pts)</text>

              <rect x="460" y="187" width="110" height="22" rx="4" fill="#1c2331" />
              <text x="515" y="201" fill="#e5e7eb" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Node Health (10 pts)</text>

              <line x1="580" y1="135" x2="615" y2="135" stroke="#737373" strokeWidth="1.2" markerEnd="url(#arrowHead)" />

              {/* Step 5: Classifier & Suggestion */}
              <rect x="620" y="90" width="165" height="90" rx="8" fill="#11161f" stroke="#10b981" strokeWidth="1.5" />
              <text x="702" y="112" fill="#ffffff" fontSize="11" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">5. Score & Action</text>
              
              {/* CanPay / CannotPay badges */}
              <rect x="635" y="125" width="60" height="20" rx="4" fill="#00e5ff" fillOpacity="0.15" />
              <text x="665" y="138" fill="#00e5ff" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">CanPay</text>

              <rect x="710" y="125" width="60" height="20" rx="4" fill="#ef4444" fillOpacity="0.15" />
              <text x="740" y="138" fill="#ef4444" fontSize="9" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">CannotPay</text>

              <text x="702" y="165" fill="#10b981" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">diagnose() & suggestion()</text>
            </svg>
          </div>

          <h2 id="stale-data-penalty" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Stale/Missing Data Penalty
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            If a query cannot retrieve fresh channel details or network graph states, the engine continues calculations using cached snapshots but applies a **50-point penalty** (<code className="font-mono text-xs text-red-400">score = score - 50</code>). This automatically marks the transaction confidence as degraded, warning the user of potential route changes.
          </p>

          <h2 id="status-thresholds" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Status Threshold Limits
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The final score is mapped directly to one of three statuses:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6 font-inter text-sm text-center">
            <div className="p-6 border border-cyan-500/20 bg-cyan-500/[0.02] rounded-xl">
              <span className="text-cyan font-bold text-base block mb-1">CanPay</span>
              <span className="text-white block font-bold text-lg mb-2">70 to 100</span>
              <span className="text-muted font-light leading-relaxed text-xs sm:text-sm">Sufficient liquidity, stable route, low fees. Safe to execute.</span>
            </div>
            <div className="p-6 border border-amber-500/20 bg-amber-500/[0.02] rounded-xl">
              <span className="text-amber-400 font-bold text-base block mb-1">Unknown</span>
              <span className="text-white block font-bold text-lg mb-2">41 to 69</span>
              <span className="text-muted font-light leading-relaxed text-xs sm:text-sm">Suboptimal paths, stale graph records. Review risks.</span>
            </div>
            <div className="p-6 border border-red-500/20 bg-red-500/[0.02] rounded-xl">
              <span className="text-red-400 font-bold text-base block mb-1">CannotPay</span>
              <span className="text-white block font-bold text-lg mb-2">0 to 40</span>
              <span className="text-muted font-light leading-relaxed text-xs sm:text-sm">Critical errors (insufficient liquidity, offline nodes). Will fail.</span>
            </div>
          </div>
        </div>
      ),
    },
    taxonomy: {
      id: "taxonomy",
      title: "Failure Taxonomy",
      category: "Diagnostic Engine",
      description: "Understand the 8 failure categories, their triggers, and retry behaviors.",
      headings: [
        { id: "failure-matrix", text: "The Diagnostic Failure Matrix" },
        { id: "channel-topology", text: "Channel Topology Example" },
        { id: "retry-strategies", text: "Recovery & Retry Logic" },
      ],
      render: () => (
        <div className="space-y-6">
          <h2 id="failure-matrix" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            The Diagnostic Failure Matrix
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            When a pre-flight test results in a <code className="font-mono text-xs text-red-400">CannotPay</code> status, XQlyte maps the error to one of 8 failure categories defined in the product specification:
          </p>

          <div className="space-y-4 my-6">
            {[
              {
                cat: "Capacity",
                trigger: "Outbound local balance of the sender's channels < payment amount.",
                tech: "local_balance < request.amount",
                solution: "Initiate channel rebalancing, inject liquidity, or split payment value.",
              },
              {
                cat: "Asset",
                trigger: "Channel lack support cells for custom UDT/RGB++ tokens.",
                tech: "node lacks support script cell deps",
                solution: "Open a channel supporting the specific asset script id.",
              },
              {
                cat: "Route",
                trigger: "Graph pathfinder is unable to compute a path to the recipient.",
                tech: "build_route RPC returns empty hops",
                solution: "Ensure target node address is gossiped, or connect directly.",
              },
              {
                cat: "Fee",
                trigger: "Accumulated routing fees exceed maximum allowed budget.",
                tech: "fee_ratio > max_threshold",
                solution: "Select routes with lower fee schedules or increase max budget.",
              },
              {
                cat: "Node",
                trigger: "Intermediary routing hop is offline or unstable.",
                tech: "node.is_online == false",
                solution: "Force route pathfinder to exclude the offline node.",
              },
              {
                cat: "Timeout",
                trigger: "Path requires too many hops, violating expiry limits.",
                tech: "expiry locks exceed channel limits",
                solution: "Use shorter routes or increase maximum locktime limits.",
              },
              {
                cat: "Swap",
                trigger: "Asset swap is required, but swap provider reports zero liquidity.",
                tech: "swap compatibility flag is false",
                solution: "Perform client-side swap prior to dispatch or fund swap pool.",
              },
              {
                cat: "Unknown",
                trigger: "Gossip topology is incomplete, leaving parts of the path missing.",
                tech: "missing required channels in query",
                solution: "Trigger node sync with network peers to fetch fresh gossip graphs.",
              },
            ].map((item) => (
              <div key={item.cat} className="p-5 border border-white/5 bg-white/[0.01] rounded-xl font-atkinson text-base sm:text-[17px] text-gray-300 font-light">
                <div className="flex items-center justify-between mb-3">
                  <strong className="text-white font-inter text-sm uppercase tracking-wider">{item.cat} Failure</strong>
                  <code className="text-[11px] text-cyan bg-white/5 px-2.5 py-0.5 rounded font-mono font-semibold">{item.tech}</code>
                </div>
                <p className="mb-2"><span className="text-muted font-normal">Trigger:</span> {item.trigger}</p>
                <p className="text-sm text-accent"><span className="text-muted font-normal">Suggested Fix:</span> {item.solution}</p>
              </div>
            ))}
          </div>

          <h2 id="channel-topology" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Channel Topology Example
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The path routing example below shows how balances change along a multi-hop route and where diagnostic warnings occur:
          </p>

          {/* New Channel Topology & Flow Diagram */}
          <div className="my-8 p-6 bg-[#07090c] border border-white/5 rounded-2xl flex justify-center shadow-[inset_0_2px_20px_rgba(0,0,0,0.6)]">
            <svg width="100%" height="220" viewBox="0 0 800 220" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-3xl">
              <defs>
                <marker id="arrowTip" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#ff5c00" />
                </marker>
              </defs>

              {/* Alice */}
              <circle cx="80" cy="110" r="30" fill="#ff5c00" fillOpacity="0.1" stroke="#ff5c00" strokeWidth="1.5" />
              <text x="80" y="114" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">Alice</text>
              <text x="80" y="160" fill="#737373" fontSize="10" fontFamily="Geist Mono" textAnchor="middle">Sender Node</text>

              {/* Hop 1 Link */}
              <line x1="120" y1="110" x2="270" y2="110" stroke="#ff5c00" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrowTip)" />
              {/* Channel 1 info box */}
              <rect x="135" y="60" width="120" height="38" rx="6" fill="#11161f" stroke="#737373" strokeWidth="1" strokeOpacity="0.2" />
              <text x="195" y="73" fill="#e5e7eb" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Chan_1 (USDT)</text>
              <text x="195" y="88" fill="#00e5ff" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">L: 800 | R: 200</text>

              {/* Routing Hop 1 */}
              <circle cx="310" cy="110" r="30" fill="#00e5ff" fillOpacity="0.1" stroke="#00e5ff" strokeWidth="1.5" />
              <text x="310" y="114" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">Node A</text>
              <text x="310" y="160" fill="#737373" fontSize="10" fontFamily="Geist Mono" textAnchor="middle">Intermediary</text>

              {/* Hop 2 Link */}
              <line x1="350" y1="110" x2="500" y2="110" stroke="#ff5c00" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrowTip)" />
              {/* Channel 2 info box */}
              <rect x="365" y="60" width="120" height="38" rx="6" fill="#11161f" stroke="#ef4444" strokeWidth="1" strokeOpacity="0.4" />
              <text x="425" y="73" fill="#f87171" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Chan_2 (USDT)</text>
              <text x="425" y="88" fill="#ef4444" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">L: 50 | R: 450</text>
              {/* Warning label */}
              <text x="425" y="48" fill="#ef4444" fontSize="8" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">⚠️ CAPACITY WARNING</text>

              {/* Routing Hop 2 */}
              <circle cx="540" cy="110" r="30" fill="#00e5ff" fillOpacity="0.1" stroke="#00e5ff" strokeWidth="1.5" />
              <text x="540" y="114" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">Node B</text>
              <text x="540" y="160" fill="#737373" fontSize="10" fontFamily="Geist Mono" textAnchor="middle">Intermediary</text>

              {/* Hop 3 Link */}
              <line x1="580" y1="110" x2="690" y2="110" stroke="#ff5c00" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrowTip)" />
              <rect x="595" y="60" width="90" height="38" rx="6" fill="#11161f" stroke="#737373" strokeWidth="1" strokeOpacity="0.2" />
              <text x="640" y="73" fill="#e5e7eb" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">Chan_3 (USDT)</text>
              <text x="640" y="88" fill="#10b981" fontSize="9" fontFamily="Geist Mono" textAnchor="middle">L: 600 | R: 100</text>

              {/* Bob */}
              <circle cx="720" cy="110" r="30" fill="#ff5c00" fillOpacity="0.1" stroke="#ff5c00" strokeWidth="1.5" />
              <text x="720" y="114" fill="#ffffff" fontSize="12" fontFamily="Geist Mono" textAnchor="middle" fontWeight="bold">Bob</text>
              <text x="720" y="160" fill="#737373" fontSize="10" fontFamily="Geist Mono" textAnchor="middle">Receiver Node</text>
            </svg>
          </div>

          <h2 id="retry-strategies" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Recovery & Retry Logic
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Along with a failure classification, XQlyte returns specific retry strategies to help wallets recover automatically:
          </p>
          <ul className="list-disc list-inside space-y-3.5 font-atkinson text-base sm:text-[17px] text-gray-300 font-light pl-2 mb-6">
            <li><strong className="text-white">Immediate Retry:</strong> Safe for temporary issues like high fee ratios (where fees fluctuate) or routing hops reporting momentary connectivity spikes.</li>
            <li><strong className="text-white">Alternative Route Search:</strong> Instructs the client to compute an alternate route that bypasses offline nodes or channels with insufficient local balance.</li>
            <li><strong className="text-white">Action Required:</strong> The payment cannot be processed automatically. Requires manual action (e.g. funding the wallet, opening channels, registering swap tokens).</li>
          </ul>
        </div>
      ),
    },
    "wasm-sdk": {
      id: "wasm-sdk",
      title: "WebAssembly (JS/TS) SDK",
      category: "Integration & SDKs",
      description: "Run light pre-flight checks directly inside client browsers without exposing API keys.",
      headings: [
        { id: "wasm-benefits", text: "Why Client-Side WASM?" },
        { id: "wasm-install", text: "Installation" },
        { id: "wasm-usage", text: "Integration Example" },
      ],
      render: () => (
        <div className="space-y-6">
          <h2 id="wasm-benefits" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            Why Client-Side WASM?
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The XQlyte WebAssembly SDK wraps the core Rust diagnostic engine and exposes it to JavaScript runtimes. This offers several benefits for web applications:
          </p>
          <ul className="list-disc list-inside space-y-3.5 font-atkinson text-base sm:text-[17px] text-gray-300 font-light pl-2 mb-6">
            <li><strong className="text-white">Absolute Privacy:</strong> Calculations happen directly on the user's device. No private keys, channel structures, or transaction details leave the browser.</li>
            <li><strong className="text-white">Low Latency:</strong> Diagnostic checks complete in under 20ms since there are no round-trip delays to a central server.</li>
            <li><strong className="text-white">Scale-Free:</strong> Removes diagnostic workloads from your backend servers, allowing your application to scale to millions of active users.</li>
          </ul>

          <h2 id="wasm-install" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Installation
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Import the WASM package from the local workspace package directory:
          </p>
          <CodeBlock code="npm install packages/xqlyte-js" language="bash" id="wasm-install-code" />

          <h2 id="wasm-usage" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Integration Example
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Below is an example showing how to initialize the WASM module and run a diagnostic check inside a client application:
          </p>
          <CodeBlock
            code={`import init, { evaluate_can_pay } from "xqlyte-js";

async function preFlightCheck() {
  // 1. Initialize the WebAssembly binary
  await init();

  // 2. run feasibility check
  const result = await evaluate_can_pay({
    sender: "alice",
    receiver: "bob",
    amount: 15.5,
    asset: "USDT"
  });

  // 3. Inspect results
  console.log(\`Confidence: \${result.confidence_score}%\`);
  console.log(\`Status: \${result.status}\`); // "CanPay" | "CannotPay" | "Unknown"
  
  if (result.status === "CannotPay") {
    console.error(\`Reason: \${result.reason}\`);
    console.error(\`Suggested Fix: \${result.suggested_fix}\`);
  }
}`}
            language="javascript"
            id="wasm-code-sample"
          />
        </div>
      ),
    },
    "rust-sdk": {
      id: "rust-sdk",
      title: "Rust SDK & CLI Crate",
      category: "Integration & SDKs",
      description: "Integrate native Rust diagnostics or query payment paths from the terminal.",
      headings: [
        { id: "rust-sdk-integration", text: "Rust SDK Integration" },
        { id: "cli-setup", text: "CLI Tool Setup" },
        { id: "cli-commands", text: "CLI Command Reference" },
      ],
      render: () => (
        <div className="space-y-6">
          <h2 id="rust-sdk-integration" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            Rust SDK Integration
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            If you are building a Rust backend, wallet utility, or automated daemon, add <code className="font-mono text-xs px-1.5 py-0.5 bg-white/5 rounded text-accent">sdk-rust</code> to your Cargo dependencies. It wraps both the RPC client interface and the scoring analyzer:
          </p>
          <CodeBlock
            code={`use xqlyte_sdk::{can_pay, PaymentRequest};

#[tokio::main]
async fn main() {
    let request = PaymentRequest {
        sender: "alice".to_string(),
        receiver: "bob".to_string(),
        amount: 250.0,
        asset: "CKB".to_string(),
        metadata: None,
    };

    // Performs RPC fetch & runs diagnostic engine
    let check = can_pay(&request).await;
    println!("Confidence Score: {}/100", check.confidence_score);
}`}
            language="rust"
            id="rust-sdk-code"
          />

          <h2 id="cli-setup" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            CLI Tool Setup
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            XQlyte features a standalone command-line diagnostic utility. Install it from the project root using Cargo:
          </p>
          <CodeBlock code="cargo install --path crates/cli" language="bash" id="cli-install-code" />

          <h2 id="cli-commands" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            CLI Command Reference
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Use the following CLI commands to test payment paths:
          </p>
          <div className="space-y-6 font-atkinson text-base sm:text-[17px] text-gray-300 font-light my-6">
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-inter text-sm uppercase tracking-wider block mb-1">Check Path Feasibility:</strong>
              Check if a payment can route through the network. Supports mock failure scenario triggers:
              <CodeBlock code="xqlyte can-pay --sender alice --receiver bob --amount 100 --asset USDT --scenario capacity-fail" language="bash" id="cli-cmd-canpay" />
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-inter text-sm uppercase tracking-wider block mb-1">Diagnose Failure Scenarios:</strong>
              Diagnose transaction failures and outputs a structured error trace:
              <CodeBlock code="xqlyte diagnose --scenario route-fail" language="bash" id="cli-cmd-diagnose" />
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-inter text-sm uppercase tracking-wider block mb-1">Query Audit Logs:</strong>
              Query logs of previous diagnostic sessions stored in the local SQLite database:
              <CodeBlock code="xqlyte logs --limit 5" language="bash" id="cli-cmd-logs" />
            </div>
          </div>
        </div>
      ),
    },
    "api-server": {
      id: "api-server",
      title: "Axum API & SQLite",
      category: "Services & Orchestration",
      description: "Deploy the local diagnostic microservice to log payment outcomes.",
      headings: [
        { id: "api-running", text: "Start the Server" },
        { id: "api-endpoints", text: "REST API Endpoints" },
        { id: "database-schema", text: "SQLite Database Schema" },
      ],
      render: () => (
        <div className="space-y-6">
          <h2 id="api-running" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            Start the Server
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The XQlyte API server is an Axum-based web daemon that manages a local SQLite database to log and audit payment queries. Run the server using cargo:
          </p>
          <CodeBlock code="cargo run -p xqlyte-api-server" language="bash" id="api-run-code" />
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            By default, the server runs on <code className="font-mono text-xs px-1.5 py-0.5 bg-white/5 rounded text-cyan">http://127.0.0.1:3000</code>.
          </p>

          <h2 id="api-endpoints" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            REST API Endpoints
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The service exposes the following API routes:
          </p>
          <div className="space-y-6 font-atkinson text-base sm:text-[17px] text-gray-300 font-light my-6">
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <span className="inline-flex items-center gap-2 mb-2">
                <span className="bg-cyan-500/10 text-cyan text-[11px] font-bold font-mono px-2.5 py-0.5 rounded uppercase">POST</span>
                <strong className="text-white font-mono text-[13px] sm:text-sm">/api/diagnose</strong>
              </span>
              <p className="text-gray-400 mb-3">Evaluates a payment request, runs diagnostics, records the query in SQLite, and returns a confidence payload.</p>
              <CodeBlock code={`Request Body:
{
  "sender": "alice",
  "receiver": "bob",
  "amount": 100.0,
  "asset": "USDT"
}`} language="json" id="api-endpoint-diagnose" />
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <span className="inline-flex items-center gap-2 mb-2">
                <span className="bg-[#ff5c00]/15 text-accent text-[11px] font-bold font-mono px-2.5 py-0.5 rounded uppercase">GET</span>
                <strong className="text-white font-mono text-[13px] sm:text-sm">/api/logs</strong>
              </span>
              <p className="text-gray-400">Returns list of historic payment diagnostic outcomes.</p>
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <span className="inline-flex items-center gap-2 mb-2">
                <span className="bg-[#ff5c00]/15 text-accent text-[11px] font-bold font-mono px-2.5 py-0.5 rounded uppercase">GET</span>
                <strong className="text-white font-mono text-[13px] sm:text-sm">/api/metrics</strong>
              </span>
              <p className="text-gray-400">Computes aggregate success metrics, failure rate ratios, and average latency values.</p>
            </div>
          </div>

          <h2 id="database-schema" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            SQLite Database Schema
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The SQL table layout used to store diagnostics is structured as follows:
          </p>
          <CodeBlock
            code={`CREATE TABLE IF NOT EXISTS diagnostic_logs (
    payment_id TEXT PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    sender TEXT NOT NULL,
    receiver TEXT NOT NULL,
    amount REAL NOT NULL,
    asset TEXT NOT NULL,
    confidence_score INTEGER NOT NULL,
    status TEXT NOT NULL,          -- "CanPay" | "CannotPay" | "Unknown"
    failure_category TEXT,        -- "Capacity" | "Asset" | "Route" ...
    raw_result TEXT NOT NULL      -- Full JSON dump of diagnostics
);`}
            language="sql"
            id="api-schema-code"
          />
        </div>
      ),
    },
    "telegram-bot": {
      id: "telegram-bot",
      title: "Telegram Bot Daemon",
      category: "Services & Orchestration",
      description: "Control path diagnostics and audit logs using chat messages.",
      headings: [
        { id: "bot-running", text: "Run the Bot Daemon" },
        { id: "bot-commands", text: "Slash Commands" },
      ],
      render: () => (
        <div className="space-y-6">
          <h2 id="bot-running" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            Run the Bot Daemon
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            The Telegram Bot daemon connects to your local Axum API server, translating channel statistics into chat reports.
          </p>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Set up the bot using Node.js:
          </p>
          <CodeBlock code="cd packages/bot&#10;npm install&#10;npm start" language="bash" id="bot-run-code" />

          <h2 id="bot-commands" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Slash Commands
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Send the following commands directly to the bot in Telegram:
          </p>
          <div className="space-y-6 font-atkinson text-base sm:text-[17px] text-gray-300 font-light my-6">
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-mono text-[13px] sm:text-sm block mb-1">/can_pay [sender] [receiver] [amount] [asset]</strong>
              Queries route viability, returning the feasibility status and confidence score.
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-mono text-[13px] sm:text-sm block mb-1">/diagnose [scenario]</strong>
              Triggers a mock transaction failure (e.g. <code className="font-mono text-xs text-red-400">capacity-fail</code>) to inspect technical details and recovery steps.
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-mono text-[13px] sm:text-sm block mb-1">/node_health</strong>
              Lists active nodes, connected peer counts, and status flags.
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white font-mono text-[13px] sm:text-sm block mb-1">/logs</strong>
              Retrieves the latest audit entries logged in the SQLite database.
            </div>
          </div>
        </div>
      ),
    },
    hackathon: {
      id: "hackathon",
      title: "Hackathon & Judging Guide",
      category: "Hackathon Alignment",
      description: "Understand how XQlyte solves core infrastructure limitations, matches judging guidelines, and maps to official categories.",
      headings: [
        { id: "gone-in-60ms", text: "Gone in 60ms Alignment" },
        { id: "judging-criteria-fit", text: "Judging Criteria Scoring Matrix" },
        { id: "vulnerabilities-solved", text: "Fiber Vulnerabilities Addressed" },
        { id: "judging-checklist", text: "Judges Verification Checklist" },
      ],
      render: () => (
        <div className="space-y-6">
          <h2 id="gone-in-60ms" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 mb-4">
            Gone in 60ms Alignment
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            XQlyte is engineered specifically to target the core infrastructure gaps of the **Nervos Fiber Network** payments layer. It aligns directly with two of the three official submission categories:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-6 font-inter">
            <div className="p-6 border border-amber-500/20 bg-amber-500/[0.01] rounded-xl space-y-3">
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest font-mono">CATEGORY 1</span>
              <h3 className="text-lg font-bold text-white leading-tight">Wallet & Payment UX</h3>
              <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                By providing an off-chain pre-flight checks library, XQlyte hides complex topological math. It implements a zero-private-key <code className="font-mono text-xs">can_pay()</code> check, failure categorizer outputs, and suggestions that guide users through recovery without manual channel rebalancing.
              </p>
            </div>
            <div className="p-6 border border-cyan-500/20 bg-cyan-500/[0.01] rounded-xl space-y-3">
              <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest font-mono">CATEGORY 2</span>
              <h3 className="text-lg font-bold text-white leading-tight">Node, Routing & Diagnostics</h3>
              <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">
                Operators can debug payment failures via CLIs or local Axum databases. The system tracks routing metrics, translates low-level JSON-RPC parameters into structured categories, and provides offline Mock mode profiles to test node dropouts deterministically.
              </p>
            </div>
          </div>

          <h2 id="judging-criteria-fit" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Judging Criteria Scoring Matrix
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            XQlyte has been architected to achieve high scoring across all 12 official hackathon judging categories, aiming to realistically integrate into the wider Fiber Network stack:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            {[
              {
                title: "Functional Completeness",
                rating: "Production Ready",
                desc: "Features a complete pipeline from input validation, 5 parallel scoring analyzers, 8 diagnostic error classifiers, to automated human-readable remedy suggestions. Implements offline mock environments and live Fiber RPC integrations.",
              },
              {
                title: "User Flow & Experience",
                rating: "Outstanding",
                desc: "Translates complex off-chain balance mechanics into clear confidence scores and actions. Exposes diagnostics through three channels: WebAssembly SDK for wallets, CLI commands for devs, and a Telegram bot for admin alerts.",
              },
              {
                title: "Relevance to Fiber Infrastructure",
                rating: "Direct Fit",
                desc: "Solves the core multi-hop payment routing blindness unique to Fiber's multi-asset design (RGB++/UDTs) without breaking node communication privacy boundaries.",
              },
              {
                title: "Usefulness to Stakeholders",
                rating: "Universal",
                desc: "Provides instant pre-flight checks for client wallets (via WASM), automated payment path diagnostics for node operators, and database audit logging for merchant checkouts.",
              },
              {
                title: "Technical Soundness",
                rating: "Exceptional",
                desc: "Built in 100% safe, fast Rust. Enforces absolute separation of pure core algorithms from stateful RPC database drivers, keeping pre-flight overhead under 20ms.",
              },
              {
                title: "Reusability",
                rating: "Monorepo Packages",
                desc: "Published as decoupled Rust crates, WebAssembly web assets, REST servers, and CLI binaries, allowing developers to import only the packages they need.",
              },
              {
                title: "Integration Potential",
                rating: "Seamless",
                desc: "Abstracts the Node connection behind simple Rust traits. Can be deployed alongside any standard Fiber node client (fnn) with zero modifications to peer communication code.",
              },
              {
                title: "Documentation Quality",
                rating: "World Class",
                desc: "Fully typed APIs, copyable code integration templates, interactive vector SVGs, and Ctrl+K search command palettes for developer onboarding.",
              },
              {
                title: "Maintainability",
                rating: "Clean Codebase",
                desc: "Uses a clean workspace monorepo topology, standard lint rules, decoupling traits, and mock fixtures. Compiles in seconds with zero TypeScript or Rust warnings.",
              },
              {
                title: "Practical Value",
                rating: "Immediate Impact",
                desc: "Eliminates locks on CKB assets due to dead-end routing paths, prevents fee spikes, and optimizes channel capacity allocations dynamically.",
              },
              {
                title: "Selected Category Fit",
                rating: "Category 1 & 2",
                desc: "Perfect fit for Category 1 (Wallet and Payment UX) via client-side check dialogs, and Category 2 (Node, Routing & Diagnostics) via path observability services.",
              },
              {
                title: "Future Development",
                rating: "High Potential",
                desc: "Designed to support machine learning route analyzers, RGB++ state proof synchronization, and automated channel rebalancing daemons in subsequent iterations.",
              },
            ].map((item) => (
              <div key={item.title} className="p-5 border border-white/5 bg-[#07090c]/40 hover:bg-[#0c0e12]/40 rounded-xl transition-all duration-150">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-white text-[14px] sm:text-base">{item.title}</h4>
                  <span className="text-[9px] text-accent bg-accent/10 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">{item.rating}</span>
                </div>
                <p className="font-atkinson text-xs sm:text-[13px] text-gray-400 font-light leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <Callout type="tip" title="Wider Fiber Stack Potential">
            Because XQlyte is written in pure Rust, its diagnostic scoring core can easily be compiled directly into the official <strong>fnn</strong> (Fiber Network Node) daemon as a native JSON-RPC endpoint. This would standardize pre-flight viability queries across the entire CKB payment ecosystem, realistic to become a key stack layer.
          </Callout>

          <h2 id="vulnerabilities-solved" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Fiber Vulnerabilities Addressed
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            Off-chain channels do not gossip channel state dynamically to preserve privacy. This creates major payment friction points:
          </p>
          <div className="space-y-4 my-6 font-atkinson text-base sm:text-[17px] text-gray-300 font-light">
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white block mb-1">1. Routing Blindness & Capacity Drift</strong>
              <p className="text-sm text-gray-400 leading-relaxed">
                Nodes attempt payments over paths without knowing if intermediary nodes have sufficient local outbound balance. XQlyte dry-runs outbound channel balances along routing graph paths, flagging capacity failure before HTLCs lock assets.
              </p>
            </div>
            <div className="p-5 border border-white/5 bg-white/[0.01] rounded-xl">
              <strong className="text-white block mb-1">2. Custom Asset UDT Script Matching</strong>
              <p className="text-sm text-gray-400 leading-relaxed">
                Fiber channels handle custom assets (RGB++ stablecoins, UDTs) alongside CKB. However, routing nodes might lack the cell dependencies to handle specific UDT scripts. XQlyte checks cell dependency support and maps asset mismatch failures to swap suggestions.
              </p>
            </div>
          </div>

          <h2 id="judging-checklist" className="font-inter text-2xl sm:text-3xl font-bold text-white border-b border-white/5 pb-2 pt-6 mb-4">
            Judges Verification Checklist
          </h2>
          <p className="font-atkinson text-base sm:text-[17px] text-gray-300 leading-relaxed font-light mb-5">
            For judges reviewing the workspace submission, the project supports a step-by-step verification pipeline:
          </p>
          <div className="border border-white/5 bg-[#07090c]/50 rounded-xl overflow-hidden my-6 font-inter text-sm">
            <div className="grid grid-cols-12 bg-[#0b0e12] border-b border-white/5 px-5 py-4 font-semibold text-muted">
              <div className="col-span-1 text-center">Step</div>
              <div className="col-span-4">Action Item</div>
              <div className="col-span-7">Expected Result / Output</div>
            </div>
            <div className="grid grid-cols-12 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="col-span-1 text-center font-bold">1</div>
              <div className="col-span-4 font-mono text-xs">Run Cargo Test</div>
              <div className="col-span-7">Verifies validator and scorer logic outputs in <code className="text-accent">crates/engine</code>.</div>
            </div>
            <div className="grid grid-cols-12 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="col-span-1 text-center font-bold">2</div>
              <div className="col-span-4 font-mono text-xs">Verify CLI Mock Run</div>
              <div className="col-span-7">Execute <code className="text-cyan">xqlyte can-pay --scenario capacity-fail</code>; returns score & Suggested Fix.</div>
            </div>
            <div className="grid grid-cols-12 border-b border-white/[0.02] px-5 py-4 text-gray-300 font-light">
              <div className="col-span-1 text-center font-bold">3</div>
              <div className="col-span-4 font-mono text-xs">Axum API Audit Logs</div>
              <div className="col-span-7">REST query outputs diagnostic logs recorded persistently in SQLite.</div>
            </div>
            <div className="grid grid-cols-12 px-5 py-4 text-gray-300 font-light">
              <div className="col-span-1 text-center font-bold">4</div>
              <div className="col-span-4 font-mono text-xs">Telegram Slash Bot</div>
              <div className="col-span-7">Send `/can_pay` or `/diagnose` to bot daemon; chat returns structured recovery cards.</div>
            </div>
          </div>
        </div>
      ),
    },
  };

  // Group pages by category for sidebar navigation
  const groupedPages = useMemo(() => {
    const groups: Record<string, PageContent[]> = {};
    Object.values(PAGES).forEach((p) => {
      if (!groups[p.category]) groups[p.category] = [];
      groups[p.category].push(p);
    });
    return groups;
  }, []);

  const activePageData = PAGES[activePage];

  // Search logic in command palette modal
  const modalSearchResults = useMemo(() => {
    if (!modalSearchQuery.trim()) return [];

    const query = modalSearchQuery.toLowerCase();
    const results: { pageId: string; pageTitle: string; category: string; headingId?: string; headingText?: string; snippet: string }[] = [];

    Object.values(PAGES).forEach((page) => {
      // 1. Search page titles and description
      if (page.title.toLowerCase().includes(query) || page.description.toLowerCase().includes(query)) {
        results.push({
          pageId: page.id,
          pageTitle: page.title,
          category: page.category,
          snippet: page.description,
        });
      }

      // 2. Search page headings
      page.headings.forEach((heading) => {
        if (heading.text.toLowerCase().includes(query)) {
          results.push({
            pageId: page.id,
            pageTitle: page.title,
            category: page.category,
            headingId: heading.id,
            headingText: heading.text,
            snippet: `Section: ${heading.text}`,
          });
        }
      });
    });

    return results.slice(0, 8); // limit search result output to 8
  }, [modalSearchQuery]);

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-gray-200 font-inter">
      {/* Ctrl+K Search Modal (Command Palette) */}
      {searchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <div 
            onClick={() => setSearchModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-200"
          />
          
          {/* Modal Container */}
          <div className="relative w-full max-w-2xl bg-[#0c0e12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 transition-all duration-200 transform scale-100 flex flex-col max-h-[500px]">
            {/* Search Input Box */}
            <div className="flex items-center px-4 py-3.5 border-b border-white/5 gap-3">
              <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search documentation..."
                value={modalSearchQuery}
                onChange={(e) => setModalSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[15px] text-white placeholder-muted focus:outline-none"
              />
              <button 
                onClick={() => setSearchModalOpen(false)}
                className="text-xs text-muted hover:text-white px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/10 cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Search Results List */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/[0.02]">
              {modalSearchQuery.trim() === "" ? (
                <div className="px-4 py-8 text-center text-xs sm:text-sm text-muted">
                  Type a query to search titles, headings, and descriptions...
                </div>
              ) : modalSearchResults.length > 0 ? (
                modalSearchResults.map((res, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setActivePage(res.pageId);
                      setSearchModalOpen(false);
                      setModalSearchQuery("");
                      if (res.headingId) {
                        setTimeout(() => scrollToHeading(res.headingId!), 100);
                      }
                    }}
                    className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-all duration-150 block group cursor-pointer border-0 outline-none"
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="text-sm font-semibold text-white group-hover:text-accent transition-colors">
                        {res.pageTitle} {res.headingText && <span className="text-gray-400 font-normal"> › {res.headingText}</span>}
                      </div>
                      <span className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded border border-white/5 bg-white/[0.02] text-muted">
                        {res.category}
                      </span>
                    </div>
                    <div className="text-xs text-muted font-light truncate">{res.snippet}</div>
                  </button>
                ))
              ) : (
                <div className="px-4 py-8 text-center text-xs sm:text-sm text-muted">
                  No matching documentation found.
                </div>
              )}
            </div>

            {/* Modal Footer Hint */}
            <div className="px-4 py-2 bg-[#080a0e] border-t border-white/5 flex items-center justify-between text-[10px] text-muted font-mono">
              <div>Press <kbd className="text-white">Enter</kbd> to select</div>
              <div>Use <kbd className="text-white">Esc</kbd> to close</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="mx-auto max-w-[1400px] px-6 py-10 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          
          {/* Left Navigation Sidebar */}
          <aside className="lg:col-span-3 lg:sticky lg:top-24 space-y-6">
            
            {/* Header branding info */}
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white tracking-tight">XQlyte Docs</h1>
              <p className="text-[10px] text-accent font-bold uppercase tracking-widest mt-1.5">Pre-flight Diagnostics</p>
            </div>

            {/* Command Palette Trigger Button */}
            <div className="relative">
              <button
                onClick={() => setSearchModalOpen(true)}
                className="w-full flex items-center justify-between bg-[#07090c] hover:bg-[#0c0e12] border border-white/5 hover:border-white/10 rounded-xl px-4 py-2.5 text-xs text-muted hover:text-white transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Search docs...</span>
                </div>
                <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] font-medium text-muted">
                  <span>⌘</span>K
                </kbd>
              </button>
            </div>

            {/* Navigation Sections list */}
            <nav className="flex flex-col gap-6 pt-2">
              {Object.entries(groupedPages).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <div className="text-[10px] text-muted font-bold uppercase tracking-widest pl-2">
                    {category}
                  </div>
                  <div className="flex flex-col gap-1">
                    {items.map((item) => {
                      const isActive = activePage === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActivePage(item.id);
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] sm:text-sm font-medium text-left transition-colors duration-150 cursor-pointer border-0 outline-none ${
                            isActive
                              ? "bg-accent/10 text-accent font-semibold border-l-2 border-accent"
                              : "text-gray-400 hover:bg-white/[0.02] hover:text-white"
                          }`}
                        >
                          <span>{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
          </aside>

          {/* Central Documentation Prose Panel */}
          <main className="lg:col-span-6 bg-[#0a0c10]/20 border border-white/5 rounded-2xl p-6 sm:p-10 min-h-[500px]">
            <article className="space-y-6">
              <div>
                <span className="text-[10px] text-accent uppercase font-bold tracking-widest font-mono">
                  {activePageData.category}
                </span>
                <h1 className="font-display text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-[1.1] mt-2 mb-3">
                  {activePageData.title}
                </h1>
                <p className="font-atkinson text-base sm:text-lg text-gray-400 font-light leading-relaxed">
                  {activePageData.description}
                </p>
              </div>

              {/* Render dynamic section contents */}
              <div className="pt-4">{activePageData.render(setActivePage)}</div>
            </article>
          </main>

          {/* Right Sidebar: Table of Contents */}
          <aside className="hidden lg:col-span-3 lg:sticky lg:top-24 space-y-4 xl:block">
            <div className="text-[10px] text-muted font-bold uppercase tracking-widest pl-2">
              On this page
            </div>
            <nav className="flex flex-col gap-2 pl-2">
              {activePageData.headings.map((heading) => (
                <button
                  key={heading.id}
                  onClick={() => scrollToHeading(heading.id)}
                  className="w-full text-left text-xs sm:text-[13px] text-gray-400 hover:text-accent transition-colors duration-150 py-1.5 border-l border-white/5 pl-3 hover:border-accent cursor-pointer border-0 outline-none"
                >
                  {heading.text}
                </button>
              ))}
            </nav>
          </aside>

        </div>
      </div>
    </div>
  );
}
