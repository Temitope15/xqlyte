"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { name: "Overview", path: "/dashboard", icon: "📊" },
  { name: "Failure Explorer", path: "/failures", icon: "🔍" },
  { name: "Route Analytics", path: "/routes", icon: "🗺️" },
  { name: "Asset Analytics", path: "/assets", icon: "🪙" },
  { name: "Liquidity Health", path: "/liquidity", icon: "💧" },
  { name: "Node Health", path: "/node-health", icon: "🖥️" },
  { name: "Payment Explorer", path: "/payment-explorer", icon: "⚡" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar flex flex-col justify-between h-full">
      <div>
        <Link href="/" className="sidebar-logo flex items-center hover:opacity-80 transition-opacity">
          XQ<span>lyte</span>
        </Link>
        <nav>
          <ul className="sidebar-menu">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <li
                  key={item.path}
                  className={`sidebar-item ${isActive ? "active" : ""}`}
                >
                  <Link href={item.path}>
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="pt-4 border-t border-white/[0.06] mt-auto flex flex-col gap-1">
        <Link
          href="/docs"
          className="text-xs text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <span>📖</span>
          <span>Documentation</span>
        </Link>
        <Link
          href="/features"
          className="text-xs text-gray-400 hover:text-white hover:bg-white/[0.04] transition-all px-4 py-2 rounded-lg flex items-center gap-2 font-medium"
        >
          <span>💡</span>
          <span>Features & Bot</span>
        </Link>
      </div>
    </aside>
  );
}
