"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/features" },
  { label: "Documentation", href: "/docs" },
] as const;

export default function Navbar() {
  const pathname = usePathname();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-canvas/30 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="font-display text-[17px] font-semibold tracking-tight text-foreground">
            XQ<span className="text-accent">lyte</span>
          </span>
          <span className="hidden md:inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Pre-flight
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-7 text-[15px] text-white">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`cursor-pointer transition-colors duration-200 hover:text-foreground ${
                  isActive ? "text-foreground" : ""
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/user/xqlyte"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden cursor-pointer text-[15px] text-white transition-colors hover:text-foreground sm:block"
          >
            GitHub
          </a>
          <Link
            href="/dashboard"
            style={{ color: "#000000" }}
            className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-[15px] font-semibold transition-all duration-200 ease-out hover:bg-foreground/90 active:scale-[0.98]"
          >
            Open dashboard
          </Link>
        </div>
      </div>
    </header>
  );
}
