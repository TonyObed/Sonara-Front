"use client";

import { useDashboard } from "../DashboardContext";
import { useLiveCalls } from "@/hooks/useSonara";

export default function LiveMonitoringPage() {
  const { tick, dashboard } = useDashboard();
  // Appels en cours réels (rafraîchis toutes les 5 s) ; repli démo si non auth / erreur.
  const { data, error } = useLiveCalls(5000);
  const liveCalls = data && !error ? data : [];

  const inProgress = liveCalls.length;
  const liveSlots = dashboard?.live.capacity ?? 10;
  const slotsPct = Math.min(100, Math.round((inProgress / liveSlots) * 100));
  const liveEvents = (dashboard?.events ?? []).map((event) => ({
    time: new Date(event.at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    kind: event.kind,
    text: event.text,
  }));

  const mmss = (s: number) => {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  };

  const liveCards = liveCalls.map((l) => {
    const initials = l.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    return {
      ...l,
      dur: mmss((l.startedSecondsAgo || 0) + tick),
      initials,
      phase: "Appel en cours",
      phaseColor: "var(--sn-blue2)",
      phaseBg: "rgba(0,82,255,.14)",
    };
  });

  return (
    <div data-screen-label="Live monitoring" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Live monitoring</h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "7px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                color: "var(--sn-green)",
                background: "rgba(43,213,118,.08)",
                border: "1px solid rgba(43,213,118,.22)",
                padding: "6px 12px",
                borderRadius: "20px",
              }}
            >
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--sn-green)", animation: "snPulse 1.8s infinite" }}></span>
              EN DIRECT
            </span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
            FLUX VOCAL TEMPS RÉEL
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
        {/* KPI 1: Appels en cours */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>APPELS EN COURS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "8px" }}>
            <span style={{ fontSize: "28px", fontWeight: 700 }}>{inProgress}</span>
            <span style={{ fontSize: "13px", color: "var(--sn-w45)" }}>/ {liveSlots} slots</span>
          </div>
          <div style={{ height: "5px", background: "var(--sn-w08)", borderRadius: "4px", marginTop: "10px", overflow: "hidden" }}>
            <div style={{ width: `${slotsPct}%`, height: "100%", background: "linear-gradient(90deg, #0052FF, #00D4A6)", borderRadius: "4px" }}></div>
          </div>
        </div>

        {/* KPI 2: File d'attente */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>FILE D&apos;ATTENTE</div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "8px" }}>{dashboard?.live.queued ?? 0}</div>
          <div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "4px" }}>contacts à appeler</div>
        </div>

        {/* KPI 3: Latence moyenne */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>LATENCE MOYENNE</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "8px" }}>
            <span style={{ fontSize: "28px", fontWeight: 700, color: "var(--sn-green)" }}>—</span>
            <span style={{ fontSize: "14px", color: "var(--sn-w45)" }}>ms</span>
          </div>
          <div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "4px" }}>objectif &lt; 800 ms</div>
        </div>

        {/* KPI 4: Taux décroché */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>TAUX DÉCROCHÉ — 1H</div>
          <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "8px" }}>{dashboard?.lastHour.responseRate ?? 0}%</div>
          <div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "4px" }}>{dashboard?.lastHour.launched ?? 0} appels lancés</div>
        </div>
      </div>

      {/* Aggregate Audio Waveform Canvas */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Flux audio agrégé</div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)" }}>{inProgress} CANAL(AUX) ACTIF(S)</span>
        </div>
        <div style={{ marginTop: "14px", borderRadius: "12px", background: "var(--sn-inset)", border: "1px solid var(--sn-w05)", padding: "12px 14px" }}>
          <div style={{ minHeight: "150px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sn-w45)", fontSize: "13px", textAlign: "center" }}>
            Le flux audio en direct n’est pas encore disponible. Les appels affichés ci-dessous proviennent des données réelles.
          </div>
        </div>
      </div>

      {/* Live Calls Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(255px, 1fr))", gap: "14px" }}>
        {liveCards.map((lv, index) => (
          <div key={index} style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px", display: "flex", flexDirection: "column", gap: "13px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
              <div style={{ width: "38px", height: "38px", minWidth: "38px", borderRadius: "10px", background: "rgba(0,82,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12.5px", fontWeight: 700, color: "var(--sn-blue3)" }}>
                {lv.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "14.5px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lv.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {lv.campaign}
                </div>
              </div>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--sn-green)", animation: "snPulse 1.8s infinite" }}></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "22px", fontWeight: 700 }}>{lv.dur}</span>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "22px" }}>
                <span style={{ width: "4px", height: "100%", borderRadius: "2px", background: "linear-gradient(180deg, #0052FF, #00D4A6)", animation: "snEq .9s ease-in-out infinite", transformOrigin: "bottom" }}></span>
                <span style={{ width: "4px", height: "100%", borderRadius: "2px", background: "linear-gradient(180deg, #0052FF, #00D4A6)", animation: "snEq .7s ease-in-out .15s infinite", transformOrigin: "bottom" }}></span>
                <span style={{ width: "4px", height: "100%", borderRadius: "2px", background: "linear-gradient(180deg, #0052FF, #00D4A6)", animation: "snEq 1.1s ease-in-out .3s infinite", transformOrigin: "bottom" }}></span>
                <span style={{ width: "4px", height: "100%", borderRadius: "2px", background: "linear-gradient(180deg, #0052FF, #00D4A6)", animation: "snEq .8s ease-in-out .45s infinite", transformOrigin: "bottom" }}></span>
                <span style={{ width: "4px", height: "100%", borderRadius: "2px", background: "linear-gradient(180deg, #0052FF, #00D4A6)", animation: "snEq 1s ease-in-out .6s infinite", transformOrigin: "bottom" }}></span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
              <span style={{ fontSize: "11.5px", fontWeight: 600, color: lv.phaseColor, background: lv.phaseBg, padding: "4px 10px", borderRadius: "12px" }}>
                {lv.phase}
              </span>
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "var(--sn-w45)" }}>Audio indisponible</span>
            </div>
          </div>
        ))}
      </div>

      {/* Events Log List */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>Journal des événements</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "10px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
          {liveEvents.map((ev, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "9px 4px",
                borderTop: index > 0 ? "1px solid var(--sn-w04)" : "none",
              }}
            >
              <span style={{ color: "var(--sn-w35)" }}>{ev.time}</span>
              <span style={{ width: "7px", height: "7px", minWidth: "7px", borderRadius: "50%", background: ev.kind === "ok" ? "var(--sn-green)" : ev.kind === "warn" ? "var(--sn-amber)" : ev.kind === "alert" ? "var(--sn-red)" : "var(--sn-blue2)" }}></span>
              <span style={{ color: "var(--sn-w75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.text}</span>
            </div>
          ))}
          {liveEvents.length === 0 && <div style={{ padding: "14px 4px", color: "var(--sn-w45)", fontSize: "13px" }}>Aucun événement d’appel enregistré.</div>}
        </div>
      </div>
    </div>
  );
}
