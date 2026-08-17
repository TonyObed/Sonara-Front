"use client";

import { useEffect, useState } from "react";

type DbReport = { id: string; name: string; fileUrl: string | null; fileSizeBytes: number | null; generatedAt: string | null; createdAt: string; campaign: { name: string } | null; summary: { responseRate?: number; sentiment?: number } | null };
type DbSchedule = { id: string; name: string; frequency: string; sendAt: string; recipients: unknown; isActive: boolean; campaign: { name: string } | null };
type CampaignOption = { id: string; name: string };
type ReportAnalytics = { analyzedCalls: number; averageSentiment: number | null; topTopic: { label: string; count: number } | null };

export default function ReportsPage() {
  const [reports, setReports] = useState<DbReport[]>([]);
  const [scheduled, setScheduled] = useState<DbSchedule[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignOption[]>([]);
  const [campaignId, setCampaignId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [scheduleFrequency, setScheduleFrequency] = useState("WEEKLY");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleEmail, setScheduleEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ReportAnalytics>({ analyzedCalls: 0, averageSentiment: null, topTopic: null });
  const loadReports = () => fetch("/api/reports", { credentials: "include" }).then((r) => r.json()).then((payload) => { if (payload.success) { setReports(payload.data.reports); setScheduled(payload.data.schedules); setAnalytics(payload.data.analytics); } });
  useEffect(() => { void loadReports(); fetch("/api/campaigns?limit=100", { credentials: "include" }).then((r) => r.json()).then((payload) => { if (payload.success) setCampaigns(payload.data.map((item: CampaignOption) => ({ id: item.id, name: item.name }))); }).catch(() => {}); }, []);
  const downloadReport = (report: DbReport) => { if (report.fileUrl) window.open(`/api/reports/${report.id}`, "_blank", "noopener,noreferrer"); };
  const generate = async () => {
    setGenerating(true); setError(null);
    try {
      const response = await fetch("/api/reports", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(campaignId ? { campaignId } : {}) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Génération impossible.");
      await loadReports();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Génération impossible."); }
    finally { setGenerating(false); }
  };
  const createSchedule = async () => {
    setError(null);
    try {
      const response = await fetch("/api/reports/schedules", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: campaignId || undefined, frequency: scheduleFrequency, sendAt: scheduleTime, recipients: scheduleEmail.split(",").map((email) => email.trim()).filter(Boolean) }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Programmation impossible.");
      setScheduleEmail(""); await loadReports();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Programmation impossible."); }
  };
  const toggleSchedule = async (schedule: DbSchedule) => {
    const next = !schedule.isActive;
    const response = await fetch(`/api/reports/${schedule.id}`, { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: next }) });
    if (response.ok) setScheduled((current) => current.map((item) => item.id === schedule.id ? { ...item, isActive: next } : item));
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
          RAPPORTS RÉELS GÉNÉRÉS À PARTIR DES APPELS ET INSIGHTS
        </div>
      </div>

      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "16px", display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
        <select value={campaignId} onChange={(event) => setCampaignId(event.target.value)} style={{ minWidth: "230px", flex: 1, background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "10px", padding: "10px 12px", color: "var(--sn-text)" }}>
          <option value="">Toutes les campagnes</option>
          {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
        </select>
        <button onClick={() => { void generate(); }} disabled={generating} style={{ background: "#0052FF", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 16px", fontWeight: 700, cursor: generating ? "wait" : "pointer", opacity: generating ? .65 : 1 }}>
          {generating ? "Génération…" : "Générer le rapport CSV"}
        </button>
        {error && <span style={{ width: "100%", color: "var(--sn-red)", fontSize: "12px" }}>{error}</span>}
      </div>

      {/* Reports Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "14px" }}>
        {reports.map((r) => (
          <div
            key={r.id}
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
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)" }}>{r.fileSizeBytes ? `${Math.round(r.fileSizeBytes / 1024)} KB` : "—"}</span>
            </div>
            <div>
              <div style={{ fontSize: "15px", fontWeight: 600, lineHeight: 1.35 }}>{r.name}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)", marginTop: "6px" }}>{r.campaign?.name ?? "Toutes campagnes"} · {new Date(r.generatedAt ?? r.createdAt).toLocaleDateString("fr-FR")}</div>
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w65)", background: "var(--sn-w05)", padding: "4px 9px", borderRadius: "12px" }}>
                RÉP. {r.summary?.responseRate !== undefined ? `${r.summary.responseRate}%` : "—"}
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10.5px",
                  color: sentColor(r.summary?.sentiment ?? null),
                  background: "rgba(43,213,118,.09)",
                  padding: "4px 9px",
                  borderRadius: "12px",
                }}
              >
                SENT. {r.summary?.sentiment !== undefined ? r.summary.sentiment.toFixed(1) : "—"}
              </span>
            </div>
            <button
              onClick={() => downloadReport(r)}
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
              Télécharger le CSV
            </button>
          </div>
        ))}
      </div>

      {/* Analytics IA Card */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
        <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px" }}>Aperçu Analytics IA (Insights)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div style={{ padding: "20px", background: "rgba(43,213,118,.05)", border: "1px solid rgba(43,213,118,.2)", borderRadius: "12px" }}>
                <div style={{ fontSize: "12px", color: "var(--sn-w62)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Sentiment majoritaire</div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: sentColor(analytics.averageSentiment) }}>{analytics.averageSentiment === null ? "—" : `${analytics.averageSentiment}/10`}</div>
                <div style={{ fontSize: "13px", color: "var(--sn-w45)", marginTop: "8px" }}>{analytics.averageSentiment === null ? "Disponible après les premiers appels analysés." : `Calculé sur ${analytics.analyzedCalls} appel(s) analysé(s).`}</div>
            </div>
            
            <div style={{ padding: "20px", background: "rgba(255,176,46,.05)", border: "1px solid rgba(255,176,46,.2)", borderRadius: "12px" }}>
                <div style={{ fontSize: "12px", color: "var(--sn-w62)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Mot-clé récurrent</div>
                <div style={{ fontSize: "24px", fontWeight: 700, color: analytics.topTopic ? "var(--sn-amber)" : "var(--sn-w45)" }}>{analytics.topTopic?.label ?? "—"}</div>
                <div style={{ fontSize: "13px", color: "var(--sn-w45)", marginTop: "8px" }}>{analytics.topTopic ? `${analytics.topTopic.count} mention(s) enregistrée(s).` : "Disponible après les premiers appels analysés."}</div>
            </div>
        </div>
      </div>

      {/* Scheduled Reports Card */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Rapports programmés</div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".1em", color: "var(--sn-w4)" }}>
            GÉNÉRATION AUTOMATIQUE DANS LE DASHBOARD
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", padding: "10px 0 16px" }}>
            <select value={scheduleFrequency} onChange={(event) => setScheduleFrequency(event.target.value)} style={{ background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "9px", padding: "9px", color: "var(--sn-text)" }}><option value="DAILY">Quotidien</option><option value="WEEKLY">Hebdomadaire</option><option value="MONTHLY">Mensuel</option></select>
            <input type="time" value={scheduleTime} onChange={(event) => setScheduleTime(event.target.value)} style={{ background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "9px", padding: "9px", color: "var(--sn-text)" }} />
            <input value={scheduleEmail} onChange={(event) => setScheduleEmail(event.target.value)} placeholder="email@entreprise.com" style={{ minWidth: "210px", flex: 1, background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "9px", padding: "9px", color: "var(--sn-text)" }} />
            <button onClick={() => { void createSchedule(); }} style={{ border: "none", borderRadius: "9px", background: "#0052FF", color: "#fff", padding: "9px 13px", fontWeight: 700, cursor: "pointer" }}>Programmer</button>
          </div>
          {scheduled.map((s, index) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "14px 4px",
                borderBottom: index < scheduled.length - 1 ? "1px solid var(--sn-w05)" : "none",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <div style={{ fontSize: "14px", fontWeight: 500 }}>{s.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)", marginTop: "3px" }}>
                  {`${s.frequency} · ${s.sendAt} → ${Array.isArray(s.recipients) ? s.recipients.join(", ") : "—"}`}
                </div>
              </div>
              <div
                aria-label={`Activer ou désactiver ${s.name}`}
                role="switch"
                aria-checked={s.isActive}
                tabIndex={0}
                onClick={() => { void toggleSchedule(s); }}
                onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); void toggleSchedule(s); } }}
                style={{
                  width: "40px",
                  height: "22px",
                  borderRadius: "12px",
                  background: s.isActive ? "#0052FF" : "var(--sn-w12)",
                  position: "relative",
                  cursor: "pointer",
                  transition: "background 0.2s ease",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: "2px",
                    left: s.isActive ? "20px" : "2px",
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    background: s.isActive ? "#fff" : "var(--sn-w6)",
                    transition: "left 0.2s ease, background 0.2s ease",
                  }}
                ></span>
              </div>
            </div>
          ))}
          {scheduled.length === 0 && <div style={{ padding: "14px 4px", color: "var(--sn-w45)", fontSize: "13px" }}>Aucun rapport programmé pour cette entreprise.</div>}
        </div>
      </div>
    </div>
  );
}
