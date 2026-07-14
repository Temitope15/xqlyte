"use client";

import { useState } from "react";

interface NodeStatus {
  id: string;
  uptime: number;
  peer_count: number;
  stability_score: number;
  is_online: boolean;
}

export default function NodeHealthPage() {
  const [nodes] = useState<NodeStatus[]>([
    { id: "nodeA", uptime: 0.985, peer_count: 5, stability_score: 95, is_online: true },
    { id: "nodeB", uptime: 0.920, peer_count: 3, stability_score: 85, is_online: true },
    { id: "nodeC", uptime: 0.999, peer_count: 8, stability_score: 98, is_online: true },
    { id: "node_offline", uptime: 0.100, peer_count: 0, stability_score: 10, is_online: false },
  ]);

  return (
    <div className="animate-fade-in">
      <header style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "2rem", marginBottom: "8px" }}>Node Health</h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Monitor routing node availability, peer connections, and calculated routing stability indices.
        </p>
      </header>

      {/* Grid Summary */}
      <section className="dashboard-grid">
        <div className="card">
          <div className="card-title">Total Nodes</div>
          <div className="card-value">4</div>
          <div className="card-subtitle">In current subnet topology</div>
        </div>
        <div className="card">
          <div className="card-title">Online Ratio</div>
          <div className="card-value">75%</div>
          <div className="card-subtitle">3 online, 1 offline node</div>
        </div>
        <div className="card">
          <div className="card-title">Avg Subnet Stability</div>
          <div className="card-value">72%</div>
          <div className="card-subtitle">Impacted by 'node_offline' degradation</div>
        </div>
      </section>

      {/* Active Nodes Table */}
      <section>
        <h2 style={{ fontSize: "1.25rem", marginBottom: "16px" }}>Node Topology</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Node Identifier</th>
                <th>Status</th>
                <th>Calculated Uptime</th>
                <th>Active Peer Hops</th>
                <th>Stability Score</th>
                <th>Uptime Grade</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.id}>
                  <td style={{ fontWeight: 600 }}>{node.id}</td>
                  <td>
                    <span className={`badge ${node.is_online ? "badge-success" : "badge-error"}`}>
                      {node.is_online ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td>{(node.uptime * 100).toFixed(1)}%</td>
                  <td>{node.peer_count} peers</td>
                  <td style={{ fontWeight: 600 }}>{node.stability_score} / 100</td>
                  <td>
                    <span className={`badge ${
                      node.stability_score >= 90 
                        ? "badge-success" 
                        : node.stability_score >= 50 
                        ? "badge-warning" 
                        : "badge-error"
                    }`}>
                      {node.stability_score >= 90 ? "Grade A" : node.stability_score >= 50 ? "Grade B" : "Grade F"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
