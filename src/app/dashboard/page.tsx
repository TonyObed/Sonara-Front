"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDashboard } from "./DashboardContext";

export default function DashboardHome() {
  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const {
    profile,
    ka: kAppels,
    kt: kTaux,
    kc: kCamp,
    kcr: kCredit,
    liveCalls,
    campaigns,
    dashboard,
    chartRange,
    setChartRange,
    go,
    stOver,
    tick,
  } = useDashboard();

  const helloFirst = profile.name.split(" ")[0] || "";
  const recentCampaigns = campaigns.slice(0, 3);
  const outcomes = dashboard?.outcomes ?? { completed: 0, unreachable: 0, voicemail: 0, failed: 0 };
  const outcomeTotal = Object.values(outcomes).reduce((sum, value) => sum + value, 0);
  const outcomePct = (value: number) => outcomeTotal ? Math.round((value / outcomeTotal) * 100) : 0;
  const completedPct = outcomePct(outcomes.completed);

  // Waveform canvas animation on mount (runs at ~25fps / 40ms)
  useEffect(() => {
    let t = 0;
    const interval = setInterval(() => {
      t += 40;
      const cv = canvasRef.current;
      if (cv) {
        const dpr = window.devicePixelRatio || 1;
        const w = cv.clientWidth;
        const h = cv.clientHeight;
        if (w && (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr))) {
          cv.width = Math.round(w * dpr);
          cv.height = Math.round(h * dpr);
        }
        if (w) {
          const ctx = cv.getContext("2d");
          if (ctx) {
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            ctx.clearRect(0, 0, w, h);
            const time = t / 1000;
            const n = Math.max(28, Math.floor(w / 7));
            const gap = w / n;
            const bw = Math.min(3.5, gap * 0.55);
            
            // Gradient blue -> teal
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, "#0052FF");
            grad.addColorStop(1, "#00D4A6");
            ctx.fillStyle = grad;

            for (let i = 0; i < n; i++) {
              const ph = Math.sin(i * 0.34 + time * 2.4) * Math.sin(i * 0.083 + time * 0.7);
              const amp = (0.14 + 0.86 * Math.abs(ph)) * (h * 0.42);
              const x = i * gap + gap / 2;
              ctx.beginPath();
              
              // Draw rounded rect
              const rx = x - bw / 2;
              const ry = h / 2 - amp;
              const rw = bw;
              const rh = amp * 2;
              const radius = 2;
              
              ctx.moveTo(rx + radius, ry);
              ctx.lineTo(rx + rw - radius, ry);
              ctx.quadraticCurveTo(rx + rw, ry, rx + rw, ry + radius);
              ctx.lineTo(rx + rw, ry + rh - radius);
              ctx.quadraticCurveTo(rx + rw, ry + rh, rx + rw - radius, ry + rh);
              ctx.lineTo(rx + radius, ry + rh);
              ctx.quadraticCurveTo(rx, ry + rh, rx, ry + rh - radius);
              ctx.lineTo(rx, ry + radius);
              ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
              ctx.closePath();
              ctx.fill();
            }
          }
        }
      }
    }, 40);

    return () => clearInterval(interval);
  }, []);

  // Format tick durations
  const mmss = (s: number) => {
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };

  // Helper formatting values
  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

  // Chart paths generation based on active range
  const getChartPaths = (range: 7 | 14 | 30) => {
    const points = (dashboard?.daily ?? []).slice(-range);
    const done = points.map((point) => point.answered);
    const tent = points.map((point) => point.started);
    const fallback = { done: [0, 0], tent: [0, 0] };
    const all = (done.length ? done : fallback.done).concat(tent.length ? tent : fallback.tent);
    const max = Math.max(1, ...all);
    const x0 = 8;
    const x1 = 580;
    const yTop = 42;
    const yBot = 174;
    const pts = (arr: number[]) =>
      arr.map((v, i) => [
        Math.round(x0 + (i * (x1 - x0)) / (arr.length - 1)),
        Math.round(yBot - (v / max) * (yBot - yTop)),
      ]);
    const path = (p: number[][]) => p.map((pt, i) => (i ? "L" : "M") + pt[0] + " " + pt[1]).join(" ");
    const dPts = pts(done.length ? done : fallback.done);
    const tPts = pts(tent.length ? tent : fallback.tent);
    const last = dPts[dPts.length - 1];
    const labels = points.length ? [points[0], points[Math.floor((points.length - 1) / 2)], points[points.length - 1]] : [];
    const L = labels.length;
    return {
      lineD: path(dPts),
      tentD: path(tPts),
      areaD: path(dPts) + " L" + x1 + " 178 L" + x0 + " 178 Z",
      lastX: last[0],
      lastY: last[1],
      chartSub: `${range} DERNIERS JOURS — ${fmt(tent.reduce((sum, value) => sum + value, 0))} APPEL(S)`,
      chartLabels: labels.map((point, i) => ({
        t: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short" }).format(new Date(point.date)).toUpperCase(),
        x: L > 1 ? Math.round(x0 + (i * (x1 - x0)) / (L - 1)) : x0,
        anchor: i === 0 ? ("start" as const) : i === L - 1 ? ("end" as const) : ("middle" as const),
      })),
    };
  };

  const activeChart = getChartPaths(chartRange);

  const STATUS_DICT = {
    live: { label: "En cours", color: "var(--sn-green)", bg: "rgba(43,213,118,.11)" },
    paused: { label: "En pause", color: "var(--sn-amber)", bg: "rgba(255,176,46,.11)" },
    done: { label: "Terminée", color: "var(--sn-w6)", bg: "var(--sn-w08)" },
    scheduled: { label: "Planifiée", color: "var(--sn-blue2)", bg: "rgba(0,82,255,.14)" },
    draft: { label: "Brouillon", color: "var(--sn-w5)", bg: "var(--sn-w06)" },
  };

  return (
    <div data-screen-label="Accueil — KPIs" style={{ display: "flex", flexDirection: "column", gap: "22px", animation: "snFadeUp .45s ease both" }}>
      
      {/* Greeting Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Bonjour{helloFirst ? `, ${helloFirst}` : ""}</h1>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
            {new Intl.DateTimeFormat("fr-FR", { weekday: "short", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date()).toUpperCase()}
          </div>
        </div>
        <Link href="/dashboard/campaigns/new" style={{ textDecoration: "none" }}>
          <button style={{ display: "inline-flex", alignItems: "center", gap: "9px", background: "#0052FF", color: "#fff", border: "none", borderRadius: "12px", padding: "12px 20px", fontFamily: "'Satoshi', sans-serif", fontSize: "14px", fontWeight: 700, cursor: "pointer", boxShadow: "0 8px 24px rgba(0,82,255,.32)" }} className="sn-hover-btn-primary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 5v14M5 12h14"></path></svg>
            Nouvelle campagne
          </button>
        </Link>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: "14px" }}>
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "20px", animation: "snFadeUp .5s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>APPELS AUJOURD'HUI</div>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(0,82,255,.13)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sn-blue2)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.7 1.5C10 19.6 4.4 14 3.5 5.7A1.5 1.5 0 0 1 5 4z"></path></svg>
            </div>
          </div>
          <div style={{ fontSize: "33px", fontWeight: 700, letterSpacing: "-.02em", marginTop: "10px" }}>{kAppels}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "9px", fontSize: "12px", fontWeight: 500, color: "var(--sn-w55)", background: "var(--sn-w06)", padding: "3px 9px", borderRadius: "14px" }}>Données en cours de collecte</div>
        </div>

        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "20px", animation: "snFadeUp .55s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>TAUX DE RÉPONSE</div>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(0,212,166,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "#00D4A6" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9.5 17 4 11.5"></path></svg>
            </div>
          </div>
          <div style={{ fontSize: "33px", fontWeight: 700, letterSpacing: "-.02em", marginTop: "10px" }}>{kTaux}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "9px", fontSize: "12px", fontWeight: 500, color: "var(--sn-w55)", background: "var(--sn-w06)", padding: "3px 9px", borderRadius: "14px" }}>Pas encore de tendance</div>
        </div>

        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "20px", animation: "snFadeUp .6s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>CAMPAGNES ACTIVES</div>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(0,82,255,.13)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sn-blue2)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l14-5v12L3 13v-2z"></path><path d="M20 9.5a3 3 0 0 1 0 5"></path></svg>
            </div>
          </div>
          <div style={{ fontSize: "33px", fontWeight: 700, letterSpacing: "-.02em", marginTop: "10px" }}>{kCamp}</div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "9px", fontSize: "12px", fontWeight: 500, color: "var(--sn-w55)", background: "var(--sn-w06)", padding: "3px 9px", borderRadius: "14px" }}>{campaigns.length ? "Synchronisé avec vos campagnes" : "Aucune campagne active"}</div>
        </div>

        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "20px", animation: "snFadeUp .65s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>CRÉDIT RESTANT</div>
            <div style={{ width: "34px", height: "34px", borderRadius: "10px", background: "rgba(255,176,46,.12)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sn-amber)" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5"></circle><path d="M12 7.5V12l3 2"></path></svg>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "7px", marginTop: "10px" }}><span style={{ fontSize: "33px", fontWeight: 700, letterSpacing: "-.02em" }}>{kCredit}</span><span style={{ fontSize: "13px", color: "var(--sn-w45)" }}>appels</span></div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "5px", marginTop: "9px", fontSize: "12px", fontWeight: 500, color: "var(--sn-w55)", background: "var(--sn-w06)", padding: "3px 9px", borderRadius: "14px" }}>Solde actuel</div>
        </div>
      </div>

      {/* Chart + Live Row */}
      <div id="sn-chartrow" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "14px" }}>
        
        {/* Call Volume Chart */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px", minWidth: 0, animation: "snFadeUp .6s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>Volume d'appels</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".1em", color: "var(--sn-w4)", marginTop: "5px" }}>{activeChart.chartSub}</div>
            </div>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--sn-w6)" }}><span style={{ width: "8px", height: "8px", borderRadius: "3px", background: "#0052FF" }}></span>Décrochés</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--sn-w6)" }}><span style={{ width: "8px", height: "8px", borderRadius: "3px", background: "var(--sn-w18)" }}></span>Tentatives</span>
              
              <div style={{ display: "flex", gap: "3px", background: "var(--sn-inset)", border: "1px solid var(--sn-w06)", borderRadius: "9px", padding: "3px" }}>
                <span onClick={() => setChartRange(7)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", fontWeight: 700, padding: "5px 9px", borderRadius: "7px", cursor: "pointer", background: chartRange === 7 ? "var(--sn-panel2)" : "transparent", color: chartRange === 7 ? "var(--sn-blue3)" : "var(--sn-w45)" }}>7J</span>
                <span onClick={() => setChartRange(14)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", fontWeight: 700, padding: "5px 9px", borderRadius: "7px", cursor: "pointer", background: chartRange === 14 ? "var(--sn-panel2)" : "transparent", color: chartRange === 14 ? "var(--sn-blue3)" : "var(--sn-w45)" }}>14J</span>
                <span onClick={() => setChartRange(30)} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", fontWeight: 700, padding: "5px 9px", borderRadius: "7px", cursor: "pointer", background: chartRange === 30 ? "var(--sn-panel2)" : "transparent", color: chartRange === 30 ? "var(--sn-blue3)" : "var(--sn-w45)" }}>30J</span>
              </div>
            </div>
          </div>
          
          <svg viewBox="0 0 600 200" style={{ width: "100%", height: "auto", display: "block", marginTop: "14px" }} preserveAspectRatio="xMidYMid meet">
            <defs>
              <linearGradient id="snArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0052FF" stopOpacity="0.28"></stop>
                <stop offset="100%" stopColor="#0052FF" stopOpacity="0"></stop>
              </linearGradient>
            </defs>
            <g style={{ stroke: "var(--sn-w06)" }} strokeWidth="1">
              <line x1="0" y1="40" x2="600" y2="40"></line>
              <line x1="0" y1="80" x2="600" y2="80"></line>
              <line x1="0" y1="120" x2="600" y2="120"></line>
              <line x1="0" y1="160" x2="600" y2="160"></line>
            </g>
            <path d={activeChart.areaD} fill="url(#snArea)" stroke="none"></path>
            <path d={activeChart.tentD} fill="none" style={{ stroke: "var(--sn-w22)" }} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="3 5"></path>
            <path d={activeChart.lineD} fill="none" stroke="#0052FF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"></path>
            <circle cx={activeChart.lastX} cy={activeChart.lastY} r="5" fill="#0052FF" style={{ animation: "snPulseBlue 2s infinite" }}></circle>
            <circle cx={activeChart.lastX} cy={activeChart.lastY} r="3.5" fill="#fff"></circle>
            <g fontFamily="JetBrains Mono, monospace" fontSize="10" style={{ fill: "var(--sn-w35)" }}>
              {activeChart.chartLabels.map((cl, i) => (
                <text key={i} x={cl.x} y="196" textAnchor={cl.anchor}>{cl.t}</text>
              ))}
            </g>
          </svg>
        </div>

        {/* Live monitoring mini card */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px", minWidth: 0, display: "flex", flexDirection: "column", animation: "snFadeUp .65s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Live monitoring</div>
            <span onClick={() => go("live")} style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-green)", cursor: "pointer" }}><span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--sn-green)", animation: "snPulse 1.8s infinite" }}></span>EN DIRECT</span>
          </div>
          <div style={{ marginTop: "14px", borderRadius: "12px", background: "var(--sn-inset)", border: "1px solid var(--sn-w05)", padding: "10px 12px" }}>
            <canvas ref={canvasRef} style={{ width: "100%", height: "110px", display: "block" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "12px" }}>
            {liveCalls.map((lc, idx) => (
              <div key={idx} onClick={() => go("live")} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 6px", borderRadius: "9px", cursor: "pointer" }} className="sn-hover-w04">
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--sn-green)", animation: "snPulse 1.8s infinite" }}></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13.5px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lc.name}</div>
                  <div style={{ fontSize: "11px", color: "var(--sn-w4)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{lc.campaign}</div>
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--sn-w65)" }}>{mmss(lc.startedSecondsAgo + tick)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent campaigns & outcomes */}
      <div id="sn-row2" style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "14px" }}>
        
        {/* Recent campaigns list */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px", minWidth: 0, animation: "snFadeUp .7s ease both" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Campagnes récentes</div>
            <Link href="/dashboard/campaigns" style={{ fontSize: "13px", fontWeight: 500, color: "var(--sn-blue2)", cursor: "pointer", textDecoration: "none" }} className="sn-hover-support-faq">Voir tout →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "10px" }}>
            {recentCampaigns.map((c) => {
              const currentStatus = stOver[c.id] || c.status;
              const st = STATUS_DICT[currentStatus];
              const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
              const pctW = pct + "%";
              const barColor = currentStatus === "done" ? "var(--sn-w3)" : "linear-gradient(90deg, #0052FF, #00D4A6)";
              const metaStr = c.sector + " · " + fmt(c.total) + " CONTACTS · " + c.date;
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/campaigns/${c.id}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", padding: "13px 8px", borderTop: "1px solid var(--sn-w05)", cursor: "pointer", borderRadius: "8px" }} className="sn-hover-w03">
                    <div style={{ flex: 1.4, minWidth: 0 }}>
                      <div style={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w38)", marginTop: "3px" }}>{metaStr}</div>
                    </div>
                    <div style={{ flex: 1, minWidth: "90px", maxWidth: "170px" }}>
                      <div style={{ height: "5px", background: "var(--sn-w08)", borderRadius: "4px", overflow: "hidden" }}>
                        <div style={{ width: pctW, height: "100%", background: barColor, borderRadius: "4px", transition: "width .8s ease" }}></div>
                      </div>
                    </div>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 600, color: st.color, background: st.bg, padding: "4px 10px", borderRadius: "14px", whiteSpace: "nowrap" }}>{st.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Outcomes Donut Chart */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px", minWidth: 0, animation: "snFadeUp .75s ease both" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Issues des appels</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", position: "relative", marginTop: "8px" }}>
            <svg viewBox="0 0 160 160" style={{ width: "158px", height: "158px" }}>
              <g transform="rotate(-90 80 80)" fill="none" strokeWidth="15">
                <circle cx="80" cy="80" r="58" style={{ stroke: "var(--sn-w06)" }}></circle>
              </g>
            </svg>
            <div style={{ position: "absolute", textAlign: "center" }}>
              <div style={{ fontSize: "26px", fontWeight: 700 }}>{completedPct}%</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".1em", color: "var(--sn-w42)" }}>COMPLÉTÉS</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "9px", marginTop: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px" }}><span style={{ width: "9px", height: "9px", borderRadius: "3px", background: "#0052FF" }}></span><span style={{ flex: 1, color: "var(--sn-w7)" }}>Enquêtes complétées</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{completedPct}%</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px" }}><span style={{ width: "9px", height: "9px", borderRadius: "3px", background: "#5E5E68" }}></span><span style={{ flex: 1, color: "var(--sn-w7)" }}>Non joignables</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{outcomePct(outcomes.unreachable)}%</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px" }}><span style={{ width: "9px", height: "9px", borderRadius: "3px", background: "var(--sn-amber)" }}></span><span style={{ flex: 1, color: "var(--sn-w7)" }}>Messagerie vocale</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{outcomePct(outcomes.voicemail)}%</span></div>
            <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px" }}><span style={{ width: "9px", height: "9px", borderRadius: "3px", background: "var(--sn-red)" }}></span><span style={{ flex: 1, color: "var(--sn-w7)" }}>Refus / échecs</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{outcomePct(outcomes.failed)}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
