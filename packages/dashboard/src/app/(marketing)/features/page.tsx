"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

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
];

/* ── Interactive Telegram Bot Simulator ─────────────────── */
interface Message {
  sender: "user" | "bot";
  text: string;
  isMarkdown?: boolean;
}

function TelegramBotSimulator() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "bot",
      text: "⚡ **XQlyte Diagnostics Bot** — Nervos Fiber Network ⚡\n\nExposing the XQlyte diagnostics & confidence engine via chat. Check routing, channel health, and analyze failures instantly.\n\n*Try one of the preset commands below or type your own!*",
      isMarkdown: true,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleCommand = async (command: string) => {
    if (isTyping) return;
    setMessages((prev) => [...prev, { sender: "user", text: command }]);
    setIsTyping(true);

    // Simulate thinking delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    let botResponse = "";

    try {
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (cmd === "/canpay") {
        const sender = args[0] || "alice";
        const receiver = args[1] || "bob";
        const amount = parseFloat(args[2]) || 10;
        const asset = args[3] || "USDT";

        const res = await fetch(`${BACKEND_URL}/can-pay`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender, receiver, amount, asset, metadata: null }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === "CanPay") {
            const path = data.best_route && data.best_route.hops
              ? [sender, ...data.best_route.hops].join(" → ")
              : `${sender} → ${receiver}`;
            botResponse = `✔ **Payment likely to succeed.**\nConfidence: **${data.confidence_score}%**\nBest route: ${path}\nFee: **${data.best_route?.total_fee || 0.01} ${asset}**`;
          } else {
            botResponse = `❌ **Payment failed.**\nReason: ${data.reason}\nSuggested fix: **${data.suggested_fix}**`;
          }
        } else {
          throw new Error("HTTP failure");
        }
      } else if (cmd === "/whyfail") {
        const id = args[0] || "capacity-fail";
        const res = await fetch(`${BACKEND_URL}/diagnose/${id}`);
        if (res.ok) {
          const data = await res.json();
          botResponse = `❌ **Payment failed.**\nReason: ${data.human_reason}\nSuggested fix: **${data.suggested_fix}**`;
        } else {
          throw new Error("HTTP failure");
        }
      } else if (cmd === "/bestasset") {
        const receiver = args[0] || "bob";
        const amount = parseFloat(args[1]) || 100;
        const res = await fetch(`${BACKEND_URL}/best-asset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender: "alice", receiver, amount, asset: "USDT", metadata: null }),
        });
        if (res.ok) {
          const data = await res.json();
          botResponse = `Recommended asset: **${data.asset}**\nConfidence: **${data.confidence}%**\nReason: ${data.reason}`;
        } else {
          throw new Error("HTTP failure");
        }
      } else if (cmd === "/bestroute") {
        const receiver = args[0] || "bob";
        const asset = args[1] || "USDT";
        const res = await fetch(`${BACKEND_URL}/best-route`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender: "alice", receiver, amount: 100, asset, metadata: null }),
        });
        if (res.ok) {
          const data = await res.json();
          const path = ["alice", ...data.route.hops].join(" → ");
          botResponse = `Best route:\n${path}\nScore: **${data.score}%**\nReason: ${data.reason}`;
        } else {
          throw new Error("HTTP failure");
        }
      } else if (cmd === "/liquidity") {
        const channel = args[0] || "chan_01";
        if (channel === "chan_01" || channel === "0x123") {
          botResponse = `**Inbound:** 12 USDT\n**Outbound:** 3 USDT\nStatus: **Healthy**`;
        } else if (channel === "chan_03") {
          botResponse = `**Inbound:** 0 CKB\n**Outbound:** 10000 CKB\nStatus: **Depleted**`;
        } else {
          botResponse = `Channel details for **${channel}**:\n**Inbound:** 50 USDT\n**Outbound:** 50 USDT\nStatus: **Healthy**`;
        }
      } else if (cmd === "/help") {
        botResponse = `⚡ **XQlyte Commands:**\n\n• \`/canpay [sender] [receiver] [amount] [asset]\`\n• \`/whyfail [payment_id]\`\n• \`/bestasset [receiver] [amount]\`\n• \`/bestroute [receiver] [asset]\`\n• \`/liquidity [channel]\``;
      } else {
        botResponse = `❓ Unknown command: **${cmd}**\nType \`/help\` to list all available diagnostic commands.`;
      }
    } catch (e) {
      // Mock Fallbacks if server is offline
      const parts = command.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      if (cmd === "/canpay") {
        const receiver = args[1] || "bob";
        if (receiver.toLowerCase() === "bob") {
          botResponse = `✔ **Payment likely to succeed.**\nConfidence: **94%**\nBest route: alice → channel_node → bob\nFee: **0.05 USDT**`;
        } else {
          botResponse = `❌ **Payment failed.**\nReason: Capacity depleted along routing path.\nSuggested fix: **Initiate channel rebalancing or lower amount.**`;
        }
      } else if (cmd === "/whyfail") {
        const id = args[0] || "capacity";
        if (id.includes("capacity")) {
          botResponse = `❌ **Payment failed.**\nReason: Intermediary channel does not have enough local balance to forward the transfer.\nSuggested fix: **Initiate channel rebalancing, reduce payment amount, or choose an alternate routing channel.**`;
        } else {
          botResponse = `❌ **Payment failed.**\nReason: Peer node is disconnected or unresponsive.\nSuggested fix: **Route around the failing node and temporarily blacklist the host.**`;
        }
      } else if (cmd === "/bestasset") {
        botResponse = `Recommended asset: **USDT**\nConfidence: **98%**\nReason: Optimal liquid depth and lower fee rates.`;
      } else if (cmd === "/bestroute") {
        botResponse = `Best route:\nalice → node_b1 → node_b2 → bob\nScore: **92%**\nReason: Highest peer stability and balanced capacities.`;
      } else if (cmd === "/liquidity") {
        botResponse = `**Inbound:** 12 USDT\n**Outbound:** 3 USDT\nStatus: **Healthy**`;
      } else {
        botResponse = `⚡ **XQlyte Commands:**\n\n• \`/canpay [sender] [receiver] [amount] [asset]\`\n• \`/whyfail [payment_id]\`\n• \`/bestasset [receiver] [amount]\`\n• \`/bestroute [receiver] [asset]\`\n• \`/liquidity [channel]\``;
      }
    }

    setMessages((prev) => [...prev, { sender: "bot", text: botResponse, isMarkdown: true }]);
    setIsTyping(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    handleCommand(inputText);
    setInputText("");
  };

  const presets = [
    { label: "Check payment route", cmd: "/canpay alice bob 10 USDT" },
    { label: "Diagnose capacity error", cmd: "/whyfail capacity-fail" },
    { label: "Query channel health", cmd: "/liquidity chan_01" },
    { label: "Find optimal route", cmd: "/bestroute bob USDT" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Bot Sidebar (Info & Launch Button) */}
      <div className="lg:col-span-4 space-y-6 text-left">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5c00]">
          Telegram Integration
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-white font-display">
          Diagnostics via Telegram Bot
        </h2>
        <p className="text-sm text-white/60 leading-relaxed font-sans">
          The XQlyte diagnostics daemon runs a grammY worker. Teams and node operators can perform pre-flight checks, debug path status, and check liquidity metrics using slash commands in Telegram.
        </p>

        <div className="space-y-3 font-mono text-xs text-white/50 bg-[#07080a] p-4 rounded-xl border border-white/5">
          <p className="text-white/80 font-semibold mb-2">Available commands:</p>
          <p><span className="text-[#ff5c00]">/canpay</span> - Payment audit</p>
          <p><span className="text-[#ff5c00]">/whyfail</span> - Failure classifier</p>
          <p><span className="text-[#ff5c00]">/bestasset</span> - Asset compatibility</p>
          <p><span className="text-[#ff5c00]">/bestroute</span> - Route optimizer</p>
          <p><span className="text-[#ff5c00]">/liquidity</span> - Channel capacity</p>
        </div>

        <div>
          <a
            href="https://t.me/xqlyte_bot"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#000000" }}
            className="w-full justify-center inline-flex items-center gap-2 rounded-full bg-[#0088cc] px-6 py-3 text-sm font-semibold text-black transition-all duration-200 hover:bg-[#0088cc]/90 active:scale-[0.98] shadow-[0_0_20px_rgba(0,136,204,0.2)]"
          >
            Launch Telegram Bot ↗
          </a>
        </div>
      </div>

      {/* Bot Chat UI Simulator */}
      <div className="lg:col-span-8 border border-white/[0.08] bg-[#0c0d12] rounded-2xl overflow-hidden flex flex-col h-[520px]">
        {/* Header */}
        <div className="bg-[#17212b] px-5 py-3.5 flex items-center gap-3 border-b border-black/20 text-left">
          <div className="size-10 rounded-full bg-[#ff5c00]/10 border border-[#ff5c00]/20 flex items-center justify-center text-lg">
            🤖
          </div>
          <div>
            <h4 className="font-semibold text-white text-sm">XQlyte Diagnostics Bot</h4>
            <span className="text-xs text-[#0088cc]">bot</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0e1621] scrollbar-thin">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs text-left whitespace-pre-wrap ${
                  msg.sender === "user"
                    ? "bg-[#2b5278] text-white rounded-tr-none"
                    : "bg-[#182533] text-white/90 border border-white/5 rounded-tl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#182533] text-white/60 border border-white/5 rounded-2xl rounded-tl-none px-4 py-2 text-xs flex items-center gap-1.5">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce [animation-delay:0.2s]">●</span>
                <span className="animate-bounce [animation-delay:0.4s]">●</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Presets List */}
        <div className="bg-[#17212b] p-3 border-t border-black/10 flex flex-wrap gap-2 justify-start">
          {presets.map((preset) => (
            <button
              key={preset.cmd}
              onClick={() => handleCommand(preset.cmd)}
              className="text-[10px] font-medium bg-[#24303f] hover:bg-[#2b394a] border border-white/5 text-white/80 px-2.5 py-1 rounded-full transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <form onSubmit={handleSend} className="bg-[#17212b] p-3 border-t border-black/20 flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a command like /canpay or /help..."
            className="flex-1 bg-[#24303f] border border-white/5 rounded-xl px-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#ff5c00]/40"
          />
          <button
            type="submit"
            className="bg-[#ff5c00] hover:bg-[#ff5c00]/90 text-black font-semibold rounded-xl px-4 py-2 text-xs transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Interactive Integration SDK Playground ─────────────── */
function IntegrationPlayground() {
  const [activeTab, setActiveTab] = useState<"ts" | "rust" | "cli">("ts");
  const [copied, setCopied] = useState(false);

  const snippets = {
    ts: `import { XQlyte } from "@xqlyte/sdk";

// Initialize XQlyte with optional configuration
const check = await XQlyte.canPay({
  sender: "alice",
  receiver: "bob",
  amount: 500.0,
  asset: "USDT"
});

if (check.status === "CanPay") {
  console.log("Success! Confidence score:", check.confidence_score);
  console.log("Optimal route:", check.best_route.hops.join(" -> "));
} else {
  console.error("Error code:", check.error_code);
  console.error("Suggested mitigation:", check.suggested_fix);
}`,
    rust: `use sdk_rust::client::XQlyteClient;
use sdk_rust::types::CanPayRequest;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Connect to local or remote diagnostic daemon
    let client = XQlyteClient::new("http://localhost:3000");

    let req = CanPayRequest {
        sender: "alice".to_string(),
        receiver: "bob".to_string(),
        amount: 2500.0,
        asset: "CKB".to_string(),
        metadata: None,
    };

    let response = client.can_pay(req).await?;
    println!("Verdict: {:?}", response.status);
    println!("Uptime confidence: {}%", response.confidence_score);
    
    Ok(())
}`,
    cli: `# Run instant audits on node connectivity and topology channels
$ xqlyte diagnose --peer bob --amount 2500 --asset USDT

⚡ Intercepting route parameters...
✔ Path analysis: 3 hops resolved (12ms)
✔ Channel capacity: sufficient liquidity
✔ PRE-FLIGHT VERDICT: CAN_PAY

# Diagnose specific transaction failure profiles
$ xqlyte whyfail capacity-fail

❌ Reason: Intermediary channel does not have enough local balance to forward.
✔ Suggested fix: Initiate channel rebalancing, or choose alternate route.`
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(snippets[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start text-left">
      {/* Description Panel */}
      <div className="lg:col-span-4 space-y-6">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#ff5c00]">
          Developer Playground
        </span>
        <h2 className="text-3xl font-bold tracking-tight text-white font-display">
          Integrate Pre-flight Audits
        </h2>
        <p className="text-sm text-white/60 leading-relaxed font-sans">
          Embed XQlyte checks directly into wallet frontends, transaction builder backends, or run queries using our developer CLI utility.
        </p>

        <div className="flex flex-col gap-2 font-sans">
          <button
            onClick={() => setActiveTab("ts")}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
              activeTab === "ts"
                ? "bg-[#ff5c00]/10 border-[#ff5c00]/30 text-white"
                : "bg-transparent border-white/5 text-white/50 hover:text-white"
            }`}
          >
            📦 TypeScript SDK (WASM Client)
          </button>
          <button
            onClick={() => setActiveTab("rust")}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
              activeTab === "rust"
                ? "bg-[#ff5c00]/10 border-[#ff5c00]/30 text-white"
                : "bg-transparent border-white/5 text-white/50 hover:text-white"
            }`}
          >
            🦀 Rust Core Client (Native Crate)
          </button>
          <button
            onClick={() => setActiveTab("cli")}
            className={`w-full text-left px-4 py-3 rounded-xl border text-xs font-semibold transition-all duration-200 ${
              activeTab === "cli"
                ? "bg-[#ff5c00]/10 border-[#ff5c00]/30 text-white"
                : "bg-transparent border-white/5 text-white/50 hover:text-white"
            }`}
          >
            💻 CLI Utility tool
          </button>
        </div>
      </div>

      {/* Code Display Console */}
      <div className="lg:col-span-8 border border-white/[0.08] bg-[#07080a] rounded-2xl overflow-hidden flex flex-col">
        {/* Console Header */}
        <div className="bg-white/[0.02] border-b border-white/5 px-5 py-3 flex items-center justify-between font-mono text-[10px] text-white/40">
          <span>{activeTab === "ts" ? "index.ts" : activeTab === "rust" ? "main.rs" : "terminal.sh"}</span>
          <button
            onClick={handleCopy}
            className="hover:text-white transition-colors duration-200 border border-white/5 bg-white/[0.02] px-2.5 py-1 rounded"
          >
            {copied ? "Copied! ✔" : "Copy code"}
          </button>
        </div>
        {/* Console Body */}
        <pre className="p-6 overflow-x-auto font-mono text-xs md:text-sm text-white/80 leading-relaxed bg-[#0a0b0d]/50 select-text max-h-[380px] scrollbar-thin">
          <code>{snippets[activeTab]}</code>
        </pre>
      </div>
    </div>
  );
}

export default function FeaturesPage() {
  const [hoveredLayer, setHoveredLayer] = useState<number | null>(null);

  return (
    <div className="bg-[#050608] min-h-screen py-24 px-6">
      <div className="mx-auto max-w-[1300px] space-y-32">
        
        {/* Header Block */}
        <div className="max-w-[750px] space-y-6 text-left">
          <h1 className="font-display text-5xl sm:text-6xl font-extrabold tracking-tight text-white leading-none">
            Features & <br />
            <span className="text-[#ff5c00]">Integration Hub</span>
          </h1>
          <p className="font-sans text-base sm:text-lg text-white/60 leading-relaxed font-light">
            XQlyte breaks down Nervos Fiber Network routing complexity into modular interfaces: a TypeScript SDK, native Rust client, CLI diagnostic engine, and conversational Telegram bot.
          </p>
        </div>

        {/* 1. Interactive Telegram Bot Section */}
        <section className="py-8">
          <TelegramBotSimulator />
        </section>

        {/* 2. Interactive SDK Section */}
        <section className="py-8">
          <IntegrationPlayground />
        </section>

        {/* 3. Core Analytical Layers */}
        <section className="space-y-12">
          <div className="text-left">
            <h2 className="font-display text-3xl font-bold text-white tracking-tight">
              Pre-flight analytical layers
            </h2>
            <p className="text-sm text-white/50 mt-2 font-light">
              XQlyte evaluates five core network layers on every diagnostic call to produce deterministic route scores.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {ANALYTICAL_LAYERS.map((layer, idx) => {
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
                  className={`${colSpanClass} border border-white/[0.08] bg-[#0c0d12] hover:bg-[#0c0d12] hover:border-white/20 hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(255,92,0,0.08)] rounded-2xl p-6 transition-all duration-300 relative group overflow-hidden text-left`}
                >
                  <div
                    className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,92,0,0.03),transparent_60%)] transition-opacity duration-300 pointer-events-none ${
                      hoveredLayer === idx ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <div className="flex items-start gap-4 relative z-10">
                    <span className="text-3xl size-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
                      {layer.icon}
                    </span>
                    <div className="space-y-2 flex-1">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <h3 className="font-display text-lg font-bold text-white group-hover:text-[#ff5c00] transition-colors duration-200">
                          {layer.title}
                        </h3>
                        <span className="font-mono text-[10px] uppercase tracking-wider bg-white/[0.05] border border-white/10 text-white/70 px-2.5 py-0.5 rounded-full">
                          {layer.metric}
                        </span>
                      </div>
                      <p className="text-sm text-white/90 font-normal">
                        {layer.description}
                      </p>
                      <p className="text-sm text-white/60 font-light leading-relaxed pt-3 border-t border-white/[0.06] mt-3">
                        {layer.detail}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 4. Failure Classifications */}
        <section className="space-y-12">
          <div className="text-left">
            <h2 className="font-display text-3xl font-bold text-white tracking-tight">
              Failure Taxonomies
            </h2>
            <p className="text-sm text-white/50 mt-2 font-light">
              We classify common off-chain errors into structured classifications to provide immediate mitigation advice.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {FAILURE_CLASSIFICATIONS.map((fail) => (
              <div
                key={fail.category}
                className="border border-white/[0.08] bg-[#0c0d12] hover:border-[#ff5c00]/30 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_rgba(255,92,0,0.12)] rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 group"
              >
                <div>
                  <div className="space-y-1 mb-4">
                    <h3 className="font-display text-lg font-bold text-white">
                      {fail.category}
                    </h3>
                    <p className="font-mono text-[10px] text-[#ff5c00] font-semibold tracking-tight">
                      {fail.code}
                    </p>
                  </div>
                  <p className="text-sm text-white/85 leading-relaxed font-light mb-6 mt-3">
                    {fail.reason}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/[0.05] space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#ff5c00] block">
                    Suggested Action
                  </span>
                  <p className="text-xs sm:text-sm text-emerald-400 font-semibold leading-relaxed">
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
