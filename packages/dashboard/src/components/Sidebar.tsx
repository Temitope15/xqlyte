"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface MenuItem {
  name: string;
  path: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { name: "Overview", path: "/", icon: "📊" },
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
    <aside className="sidebar">
      <div className="sidebar-logo">
        XQ<span>lyte</span>
      </div>
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
    </aside>
  );
}
