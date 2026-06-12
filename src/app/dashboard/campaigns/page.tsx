"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboard } from "../DashboardContext";

export default function CampaignsPage() {
  const router = useRouter();
  const { campaigns, stOver } = useDashboard();
  const [filter, setFilter] = useState<"all" | "live" | "scheduled" | "done">("all");

  const STATUS_DICT = {
    live: { label: "En cours", color: "var(--sn-green)", bg: "rgba(43,213,118,.11)" },
    paused: { label: "En pause", color: "var(--sn-amber)", bg: "rgba(255,176,46,.11)" },
    done: { label: "Terminée", color: "var(--sn-w6)", bg: "var(--sn-w08)" },
    scheduled: { label: "Planifiée", color: "var(--sn-blue2)", bg: "rgba(0,82,255,.14)" },
    draft: { label: "Brouillon", color: "var(--sn-w5)", bg: "var(--sn-w06)" },
  };

  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
  const sentColor = (v: number | null) => {
    if (v === null) return "var(--sn-w35)";
    if (v >= 7) return "var(--sn-green)";
    if (v >= 5.5) return "var(--sn-amber)";
    return "var(--sn-red)";
  };

  const initials = (n: string) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  // Decorate campaigns with live status overrides and display values
  const decoratedCampaigns = campaigns.map((c) => {
    const currentStatus = stOver[c.id] || c.status;
    const st = STATUS_DICT[currentStatus] || STATUS_DICT.draft;
    const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
    return {
      ...c,
      currentStatus,
      stLabel: st.label,
      stColor: st.color,
      stBg: st.bg,
      pctW: pct + "%",
      barColor: currentStatus === "done" ? "var(--sn-w3)" : "linear-gradient(90deg, #0052FF, #00D4A6)",
      progress: fmt(c.done) + " / " + fmt(c.total),
      sentimentVal: c.sentiment == null ? "—" : c.sentiment.toFixed(1),
      sentColor: sentColor(c.sentiment),
    };
  });

  // Filter campaigns
  const filteredCampaigns = decoratedCampaigns.filter((c) => {
    if (filter === "all") return true;
    if (filter === "live") return c.currentStatus === "live" || c.currentStatus === "paused";
    return c.currentStatus === filter;
  });

  // Count metrics for header/filters
  const totalCount = decoratedCampaigns.length;
  const liveCount = decoratedCampaigns.filter((c) => c.currentStatus === "live" || c.currentStatus === "paused").length;
  const scheduledCount = decoratedCampaigns.filter((c) => c.currentStatus === "scheduled").length;
  const doneCount = decoratedCampaigns.filter((c) => c.currentStatus === "done").length;

  const tabStyle = (active: boolean) => ({
    fontSize: "13px",
    fontWeight: active ? 600 : 500,
    padding: "8px 16px",
    borderRadius: "20px",
    background: active ? "rgba(0,82,255,.16)" : "var(--sn-panel)",
    color: active ? "var(--sn-blue3)" : "var(--sn-w6)",
    border: active ? "1px solid rgba(0,82,255,.4)" : "1px solid var(--sn-w08)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

  return (
    <div data-screen-label="Liste des campagnes" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      
      {/* Header section */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Campagnes</h1>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
            {totalCount} CAMPAGNES — {liveCount} EN COURS
          </div>
        </div>
        <Link href="/dashboard/campaigns/new" style={{ textDecoration: "none" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: "9px", background: "#0052FF", color: "#fff", border: "none", borderRadius: "12px", padding: "12px 20px", fontFamily: "'Satoshi', sans-serif", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,82,255,.32)" }} className="sn-hover-btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>
            Nouvelle campagne
          </button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
        <button style={tabStyle(filter === "all")} onClick={() => setFilter("all")}>Toutes ({totalCount})</button>
        <button style={tabStyle(filter === "live")} onClick={() => setFilter("live")}>En cours ({liveCount})</button>
        <button style={tabStyle(filter === "scheduled")} onClick={() => setFilter("scheduled")}>Planifiées ({scheduledCount})</button>
        <button style={tabStyle(filter === "done")} onClick={() => setFilter("done")}>Terminées ({doneCount})</button>
      </div>

      {/* Table grid */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", overflowX: "auto" }}>
        <div style={{ minWidth: "880px" }}>
          
          {/* Table header row */}
          <div style={{ display: "grid", gridTemplateColumns: "2.2fr 120px 1.5fr 110px 110px 100px 36px", gap: "12px", alignItems: "center", padding: "14px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w38)", borderBottom: "1px solid var(--sn-w06)" }}>
            <span>CAMPAGNE</span>
            <span>STATUT</span>
            <span>PROGRESSION</span>
            <span>TAUX RÉP.</span>
            <span>SENTIMENT</span>
            <span>DATE</span>
            <span></span>
          </div>

          {/* Table rows */}
          {filteredCampaigns.map((c) => (
            <div
              key={c.id}
              onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
              style={{ display: "grid", gridTemplateColumns: "2.2fr 120px 1.5fr 110px 110px 100px 36px", gap: "12px", alignItems: "center", padding: "15px 20px", borderBottom: "1px solid var(--sn-w04)", cursor: "pointer" }}
              className="sn-hover-w03"
            >
              <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "32px", height: "32px", minWidth: "32px", borderRadius: "10px", background: c.currentStatus === "done" ? "var(--sn-w08)" : "linear-gradient(135deg, #0052FF, #00D4A6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "11px", fontWeight: 700 }}>
                  {initials(c.name)}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: "14.5px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--sn-text)" }}>{c.name}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w38)", marginTop: "3px" }}>{c.sector}</div>
                </div>
              </div>
              <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11.5px", fontWeight: 600, color: c.stColor, background: c.stBg, padding: "5px 10px", borderRadius: "14px", whiteSpace: "nowrap", width: "fit-content" }}>{c.stLabel}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div style={{ flex: 1, height: "5px", background: "var(--sn-w08)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: c.pctW, height: "100%", background: c.barColor, borderRadius: "4px" }}></div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--sn-w55)", whiteSpace: "nowrap" }}>{c.progress}</span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px" }}>{c.responseRate || "—"}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: c.sentColor }}>{c.sentimentVal}</span>
              <span style={{ fontSize: "12.5px", color: "var(--sn-w5)" }}>{c.date || "—"}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--sn-w35)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
