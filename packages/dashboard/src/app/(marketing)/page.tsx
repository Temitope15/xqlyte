"use client";

import Link from "next/link";
import { useRef, useEffect, useCallback } from "react";
import { UnicornBackground } from "@/components/UnicornBackground";
import Sandbox from "@/components/Sandbox";
import { InfrastructureSection } from "@/components/InfrastructureSection";

/* ── Scroll-reveal hook ───────────────────────────────────── */
function useReveal() {
  const observe = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const items = el.querySelectorAll(".reveal");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.visible = "true";
          }
        });
      },
      { threshold: 0.15 }
    );
    items.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
  return observe;
}

/* ── Staggered hero item ────────────────────────────────── */
function HeroItem({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(14px)";
    el.style.filter = "blur(6px)";

    const timer = setTimeout(() => {
      el.style.transition =
        "opacity 0.7s cubic-bezier(0.23, 1, 0.32, 1), transform 0.7s cubic-bezier(0.23, 1, 0.32, 1), filter 0.7s cubic-bezier(0.23, 1, 0.32, 1)";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
      el.style.filter = "blur(0px)";
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return <div ref={ref}>{children}</div>;
}

export default function MarketingLandingPage() {
  const sandboxRef = useRef<HTMLDivElement>(null);
  const revealRef = useReveal();

  const scrollToSandbox = (e: React.MouseEvent) => {
    e.preventDefault();
    sandboxRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div ref={revealRef}>
      {/* ═══════════════════════════════════════════════════
          SECTION 1 — CINEMATIC HERO
          ═══════════════════════════════════════════════════ */}
      <section className="relative isolate overflow-hidden min-h-screen flex flex-col justify-center -mt-16 pt-16">
        {/* Canvas background */}
        <UnicornBackground className="absolute inset-0 size-full pointer-events-none opacity-80 z-0" />

        {/* Ambient glow — subtle, not overpowering */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[520px] w-[840px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,92,0,0.04),transparent)] blur-3xl"
        />
        {/* Bottom fade to canvas */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-canvas"
        />

        {/* Hero content — Centered */}
        <div className="relative z-10 mx-auto max-w-5xl px-6 flex flex-col items-center text-center">

          <HeroItem delay={130}>
            <h1 className="mt-7 text-center text-5xl font-semibold leading-[1.05] tracking-tighter text-foreground md:text-7xl">
              Evaluate channels.{" "}
              <span className="bg-gradient-to-b from-foreground to-foreground/40 bg-clip-text text-transparent">
                Simulate routing.
              </span>
              <br />
              Prevent silent failures.
            </h1>
          </HeroItem>

          <HeroItem delay={210}>
            <p className="mt-8 max-w-2xl text-center text-lg leading-relaxed text-white md:text-xl mx-auto">
              XQlyte is a pre-flight diagnostic engine for the Nervos Fiber
              Network. It evaluates channel liquidity, route topologies, asset
              compatibility, and peer node stability — client-side — flagging
              routing bottlenecks before you broadcast a transaction.
            </p>
          </HeroItem>

          <HeroItem delay={290}>
            <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <a
                href="#sandbox"
                onClick={scrollToSandbox}
                style={{ color: "#000000" }}
                className="rounded-full bg-accent px-6 py-2.5 text-sm font-medium transition-all duration-200 ease-out hover:bg-accent/90 active:scale-[0.98] shadow-[0_0_20px_rgba(255,92,0,0.2)]"
              >
                Launch sandbox
              </a>
              <Link
                href="/docs"
                className="group flex items-center gap-2 text-sm text-white transition-colors duration-200 hover:text-foreground"
              >
                <span className="inline-block size-4 text-white group-hover:text-foreground">📖</span>
                Read the docs
              </Link>
            </div>
          </HeroItem>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 1.5 — INFRASTRUCTURE
          ═══════════════════════════════════════════════════ */}
      <InfrastructureSection />

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — INTERACTIVE SANDBOX
          ═══════════════════════════════════════════════════ */}
      <section
        id="sandbox"
        ref={sandboxRef}
        className="relative border-y border-border bg-canvas py-24 md:py-32"
      >
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="reveal mb-16 max-w-xl">
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
              Interactive playground
            </span>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Try the diagnostic sandbox
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted">
              Select a failure preset, adjust parameters, and inspect the
              structured JSON trace output in real-time.
            </p>
          </div>
          <div className="reveal" style={{ transitionDelay: "100ms" }}>
            <Sandbox />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — PROBLEM → SOLUTION
          ═══════════════════════════════════════════════════ */}
      <section className="relative border-b border-border bg-canvas py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
            {/* Problem */}
            <div className="reveal space-y-5">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-error">
                The friction
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                The blind broadcast problem
              </h2>
              <p className="text-base leading-relaxed text-muted max-w-lg">
                Off-chain payment networks fail silently. Intermediary nodes go
                offline, script dep cells expire, local channel capacities shift,
                and wallets broadcast blindly. Users are left waiting on locked
                TLC expiries and staring at empty loading spinners.
              </p>
            </div>

            {/* Solution */}
            <div
              className="reveal space-y-5 border-t pt-10 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-24 border-border"
              style={{ transitionDelay: "120ms" }}
            >
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan">
                The resolution
              </span>
              <h2 className="text-3xl font-semibold tracking-tight text-cyan">
                Zero-downtime client scopes
              </h2>
              <p className="text-base leading-relaxed text-muted max-w-lg">
                XQlyte runs client-side or locally as an API server, querying the
                Fiber topology graph and simulating transactions in under 20ms.
                If a path is blocked, it classifies the failure and outputs a
                recovery route instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4 — LIVE OBSERVABILITY STATS
          ═══════════════════════════════════════════════════ */}
      <section className="relative border-b border-border bg-canvas py-16 md:py-20">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="reveal grid grid-cols-2 gap-y-10 md:grid-cols-4 md:gap-4">
            {[
              { value: "340ms", label: "Diagnostic latency" },
              { value: "100%", label: "Client-side WASM execution" },
              { value: "8 Types", label: "Structured failure categories" },
              { value: "20ms", label: "Topology search times" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-3xl font-semibold tracking-tight text-foreground tabular-nums sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5 — FINAL CTA
          ═══════════════════════════════════════════════════ */}
      <section className="relative py-32 md:py-40">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(255,92,0,0.04),transparent)]"
        />
        <div className="reveal relative mx-auto max-w-2xl px-6 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Build bulletproof off-chain payments.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted">
            Diagnose paths, secure liquidity channel uptime, and provide instant
            payment feedback to your users.
          </p>
          <div className="mt-10">
            <Link
              href="/docs"
              style={{ color: "#000000" }}
              className="inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold transition-all duration-200 hover:bg-white/95 active:scale-[0.98]"
            >
              Start integrating →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
