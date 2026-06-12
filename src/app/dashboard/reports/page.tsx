"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";

export default function ReportsPage() {
  const { reports } = useDashboard();
  const [scheduled, setScheduled] = useState([
    { id: 1, name: "Satisfaction Service Client — Q2", meta: "HEBDOMADAIRE · LUNDI 08:00 → direction@banquehorizon.ci", active: true },
    { id: 2, name: "Relance crédit conso — J+15", meta: "QUOTIDIEN · 18:00 → recouvrement@banquehorizon.ci", active: false },
  ]);

  const toggleScheduled = (id: number) => {
    setScheduled((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleDownload = (name: string) => {
    alert(`Téléchargement du rapport PDF pour "${name}" lancé.`);
  };

  const sentColor = (sentiment: number | null) => {
    if (sentiment === null) return "var(--sn-w55)";
    if (sentiment >= 7) return "var(--sn-green)";
    if (sentiment >= 5.5) return "var(--sn-amber)";
    return "var(--sn-red)";
  };

  return (
    <div data-screen-label="Rapports" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>
          Rapports
        </h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
          GÉNÉRÉS AUTOMATIQUEMENT EN FIN DE CAMPAGNE — PDF + EXPORT CSV
        </div>
      </div>

      {/* Reports Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "14px" }}>
        {reports.map((r, index) => (
          <div
            key={index}
            className="sn-hover-border"
            style={{
              background: "var(--sn-panel)",
              border: "1px solid var(--sn-w07)",
              borderRadius: "16px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              transition: "border-color 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "11px",
                  background: "rgba(0,82,255,.13)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--sn-blue2)",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"></path>
                  <path d="M14 2.5v4h4"></path>
                  <path d="M9 13h6M9 17h4"></path>
                </svg>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)" }}>{r.size}</span>
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.35 }}>{r.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)", marginTop: "6px" }}>{r.meta}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w65)", background: "var(--sn-w05)", padding: "4px 9px", borderRadius: "12px" }}>
                RÉP. {r.responseRate}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10.5px",
                  color: sentColor(r.sentiment),
                  background: "rgba(43,213,118,.09)",
                  padding: "4px 9px",
                  borderRadius: "12px",
                }}
              >
                SENT. {r.sentiment !== null ? r.sentiment.toFixed(1) : "—"}
              </span>
            </div>
            <button
              onClick={() => handleDownload(r.name)}
              className="sn-hover-blue3"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "var(--sn-panel2)",
                color: "var(--sn-text)",
                border: "1px solid var(--sn-w12)",
                borderRadius: "10px",
                padding: "10px 14px",
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                width: "100%",
                transition: "all 0.15s ease",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v11M7 10l5 5 5-5"></path>
                <path d="M4 19h16"></path>
              </svg>
              Télécharger le PDF
            </button>
          </div>
        ))}
      </div>

      {/* Scheduled Reports Card */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Rapports programmés</div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".1em", color: "var(--sn-w4)" }}>
            ENVOI AUTOMATIQUE PAR EMAIL
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
          {scheduled.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 4px",
                borderBottom: s.id === 1 ? "1px solid var(--sn-w05)" : "none",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)", marginTop: "3px" }}>
                  {s.meta}
                </div>
              </div>
              <div
                onClick={() => toggleScheduled(s.id)}
                style={{
                  width: "40px",
                  height: "22px",
                  borderRadius: "12px",
                  background: s.active ? "#0052FF" : "var(--sn-w12)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: s.active ? "20px" : "2px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: s.active ? "#fff" : "var(--sn-w6)",
                    transition: "left 0.2s ease, background 0.2s ease",
                  }}
                ></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
