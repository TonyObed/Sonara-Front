"use client";

import { useState } from "react";
import { useDashboard } from "../DashboardContext";

export default function ContactsPage() {
  const { directory } = useDashboard();
  const [filter, setFilter] = useState<"all" | "Particulier" | "PME" | "Premium" | "opt-out">("all");

  const counts = {
    all: directory.length,
    Particulier: directory.filter((d) => d.segment === "Particulier" && !d.optout).length,
    PME: directory.filter((d) => d.segment === "PME" && !d.optout).length,
    Premium: directory.filter((d) => d.segment === "Premium" && !d.optout).length,
    "opt-out": directory.filter((d) => d.optout).length,
  };

  const decoratedDirectory = directory.map((d) => {
    const initials = d.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    return {
      ...d,
      initials,
      stLabel: d.optout ? "Opt-out" : "Actif",
      stColor: d.optout ? "var(--sn-red)" : "var(--sn-green)",
      stBg: d.optout ? "rgba(255,92,92,.11)" : "rgba(43,213,118,.11)",
    };
  });

  const filteredDirectory = decoratedDirectory.filter((d) => {
    if (filter === "all") return true;
    if (filter === "opt-out") return d.optout;
    return d.segment === filter && !d.optout;
  });

  const tabStyle = (active: boolean) => ({
    fontSize: "13px",
    fontWeight: active ? 600 : 500,
    padding: "8px 16px",
    borderRadius: "20px",
    background: active ? "rgba(0,82,255,.16)" : "var(--sn-panel)",
    color: active ? "var(--sn-blue3)" : "var(--sn-w6)",
    border: active ? "1px solid rgba(0,82,255,.4)" : "1px solid var(--sn-w08)",
    cursor: "pointer",
    marginRight: "8px",
    marginBottom: "8px",
  });

  const handleCsvDownload = () => {
    alert("Téléchargement du modèle CSV...");
  };

  const handleCsvUpload = () => {
    alert("Sélectionnez un fichier CSV à importer...");
  };

  return (
    <div data-screen-label="Contacts — annuaire" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>
            Contacts
          </h1>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
            8 432 CONTACTS — 312 OPT-OUT — DÉDUPLIQUÉS SUR NUMÉRO
          </div>
        </div>
        <div style={{ display: "flex", gap: "9px" }}>
          <button
            onClick={handleCsvDownload}
            className="sn-hover-border"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--sn-panel2)",
              color: "var(--sn-text)",
              border: "1px solid var(--sn-w12)",
              borderRadius: "11px",
              padding: "11px 16px",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Télécharger le modèle CSV
          </button>
          <button
            onClick={handleCsvUpload}
            className="sn-hover-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              background: "#0052FF",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "11px 18px",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(0,82,255,.32)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15V4M7 9l5-5 5 5"></path>
              <path d="M4 19h16"></path>
            </svg>
            Importer CSV
          </button>
        </div>
      </div>

      {/* Filter Segment tabs */}
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <button style={tabStyle(filter === "all")} onClick={() => setFilter("all")}>
          Tous ({counts.all})
        </button>
        <button style={tabStyle(filter === "Particulier")} onClick={() => setFilter("Particulier")}>
          Particulier ({counts.Particulier})
        </button>
        <button style={tabStyle(filter === "PME")} onClick={() => setFilter("PME")}>
          PME ({counts.PME})
        </button>
        <button style={tabStyle(filter === "Premium")} onClick={() => setFilter("Premium")}>
          Premium ({counts.Premium})
        </button>
        <button style={tabStyle(filter === "opt-out")} onClick={() => setFilter("opt-out")}>
          Opt-out ({counts["opt-out"]})
        </button>
      </div>

      {/* Contacts Table */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", overflowX: "auto" }}>
        <div style={{ minWidth: "1020px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 165px 120px 110px 110px 110px 100px",
              gap: "12px",
              alignItems: "center",
              padding: "14px 20px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: ".12em",
              color: "var(--sn-w38)",
              borderBottom: "1px solid var(--sn-w06)",
            }}
          >
            <span>CONTACT</span>
            <span>TÉLÉPHONE</span>
            <span>VILLE</span>
            <span>SEGMENT</span>
            <span>CAMPAGNES</span>
            <span>DERNIER APPEL</span>
            <span>STATUT</span>
          </div>

          {filteredDirectory.map((d, index) => (
            <div
              key={index}
              className="sn-hover-w03"
              style={{
                display: "grid",
                gridTemplateColumns: "1.8fr 165px 120px 110px 110px 110px 100px",
                gap: "12px",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid var(--sn-w04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    minWidth: "32px",
                    borderRadius: "10px",
                    background: "var(--sn-w07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "var(--sn-w75)",
                  }}
                >
                  {d.initials}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {d.name}
                </span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--sn-w6)" }}>
                {d.phone}
              </span>
              <span style={{ fontSize: "13px", color: "var(--sn-w6)" }}>
                {d.city}
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--sn-w6)" }}>
                {d.segment}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px" }}>
                {d.campaigns}
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--sn-w5)" }}>
                {d.lastCall}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: d.stColor,
                  background: d.stBg,
                  padding: "5px 10px",
                  borderRadius: "14px",
                  whiteSpace: "nowrap",
                  width: "fit-content",
                }}
              >
                {d.stLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
