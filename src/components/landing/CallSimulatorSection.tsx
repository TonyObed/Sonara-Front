"use client";

import React, { useState, useEffect, useRef } from "react";
import { Reveal } from "./Reveal";
import { SCENARIOS } from "@/lib/landing-data";

export function CallSimulatorSection() {
  const [scenario, setScenario] = useState<"banque" | "telecom" | "assurance">("banque");
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const [seconds, setSeconds] = useState(0);

  const simTimersRef = useRef<NodeJS.Timeout[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const sc = SCENARIOS[scenario];

  const clearAllTimers = () => {
    simTimersRef.current.forEach(clearTimeout);
    simTimersRef.current = [];
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);

  const scrollDown = () => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollDown();
  }, [shown, typing]);

  const selectTab = (tab: "banque" | "telecom" | "assurance") => {
    clearAllTimers();
    setScenario(tab);
    setShown(0);
    setTyping(false);
    setPlaying(false);
    setFinished(false);
    setSeconds(0);
  };

  const playSimulation = () => {
    clearAllTimers();
    setShown(0);
    setTyping(false);
    setPlaying(true);
    setFinished(false);
    setSeconds(0);

    timerIntervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    step(0);
  };

  const step = (currentShown: number) => {
    const activeSc = SCENARIOS[scenario];
    if (currentShown >= activeSc.script.length) {
      clearAllTimers();
      setPlaying(false);
      setTyping(false);
      setFinished(true);
      return;
    }

    const msg = activeSc.script[currentShown];
    setTyping(true);

    const typingDelay = msg.who === "ia" ? 950 : 750;
    const typingTimer = setTimeout(() => {
      setShown(currentShown + 1);
      setTyping(false);

      const nextStepDelay = 420 + msg.text.length * 13;
      const nextStepTimer = setTimeout(() => {
        step(currentShown + 1);
      }, nextStepDelay);

      simTimersRef.current.push(nextStepTimer);
    }, typingDelay);

    simTimersRef.current.push(typingTimer);
  };

  // Format timer text
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const timerText = `${mm}:${ss}`;

  // Next speaker indicator details
  const nextMsg = sc.script[shown];
  const nextIsIa = !nextMsg || nextMsg.who === "ia";

  // Calculate sentiment details
  let activeSentiment = sc.sentiment[0];
  sc.sentiment.forEach((s) => {
    if (shown >= s.at) activeSentiment = s;
  });
  if (finished) {
    activeSentiment = sc.sentiment[sc.sentiment.length - 1];
  }
  const sentimentVal = shown === 0 && !finished ? 0 : activeSentiment.val;
  const sentimentLabel = shown === 0 && !finished ? "—" : activeSentiment.label;
  const sentimentColor =
    sentimentVal < 42
      ? "#D14343"
      : sentimentVal < 60
      ? "#7A7A7A"
      : "#0052FF";

  // Filter detected points
  const activePoints = sc.points.filter((p) => finished || shown >= p.at);

  return (
    <section
      data-screen-label="Simulateur"
      style={{
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        padding: "clamp(50px, 6vw, 80px) clamp(16px, 4vw, 32px)",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <Reveal style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "760px" }}>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              letterSpacing: "2px",
              color: "var(--brand-accent)",
              fontWeight: 700,
            }}
          >
            04 — SIMULATEUR D'APPEL
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(30px, 4vw, 48px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Écoutez Sonara travailler.
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(15px, 1.4vw, 17px)",
              lineHeight: 1.6,
              color: "var(--text-secondary)",
              maxWidth: "560px",
            }}
          >
            Choisissez un scénario et regardez Awa mener l'appel — pendant que l'analyse se construit en temps réel.
          </p>
        </Reveal>

        {/* Scenarios tabs pills */}
        <Reveal style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "28px" }}>
          {(["banque", "telecom", "assurance"] as const).map((tab) => {
            const isActive = scenario === tab;
            const labelMap = {
              banque: "Banque",
              telecom: "Télécom",
              assurance: "Assurance",
            };
            return (
              <button
                key={tab}
                onClick={() => selectTab(tab)}
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  padding: "10px 20px",
                  borderRadius: "999px",
                  cursor: "pointer",
                  transition: "all 0.25s ease",
                  background: isActive ? "var(--text-primary)" : "transparent",
                  color: isActive ? "var(--bg-secondary)" : "var(--text-primary)",
                  border: isActive ? "1px solid var(--text-primary)" : "1px solid var(--border-strong)",
                }}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </Reveal>

        {/* Simulator Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))",
            gap: "22px",
            marginTop: "22px",
            alignItems: "stretch",
          }}
        >
          {/* Call Card Panel (Left) */}
          <Reveal
            style={{
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              borderRadius: "26px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minHeight: "500px",
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "18px 22px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <img
                src="/assets/icone-sombre.png"
                alt="Sonara"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  border: "1px solid var(--border-strong)",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ fontSize: "16px", fontWeight: 700 }}>Awa</div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Agent vocal · {sc.company}
                </div>
              </div>
              <div style={{ flex: 1 }}></div>

              {/* Waveform */}
              <div style={{ display: "flex", alignItems: "center", gap: "3px", height: "22px" }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: "3px",
                      height: "20px",
                      borderRadius: "2px",
                      background: "var(--brand-accent)",
                      transformOrigin: "center",
                      animation: "son-wave 0.9s ease-in-out infinite",
                      animationDelay: `${i * 0.12}s`,
                      animationPlayState: playing ? "running" : "paused",
                      opacity: playing ? 1 : 0.35,
                    }}
                  />
                ))}
              </div>

              {/* Timer text */}
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  minWidth: "44px",
                  textAlign: "right",
                }}
              >
                {timerText}
              </div>
            </div>

            {/* Transcript scrollable content */}
            <div
              ref={transcriptRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "22px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                maxHeight: "350px",
              }}
            >
              {shown === 0 && !typing && (
                <div
                  style={{
                    margin: "auto",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    padding: "30px 20px",
                  }}
                >
                  <div style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {sc.contact} va décrocher.
                    <br />
                    Lancez la simulation pour écouter la conversation.
                  </div>
                </div>
              )}

              {sc.script.slice(0, shown).map((m, idx) => {
                const isIa = m.who === "ia";
                return (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: isIa ? "flex-start" : "flex-end",
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "80%",
                        padding: "12px 16px",
                        background: isIa ? "var(--bg-primary)" : "var(--brand-accent)",
                        border: isIa ? "1px solid var(--border)" : "none",
                        color: isIa ? "var(--text-primary)" : "#FFFFFF",
                        borderRadius: isIa ? "4px 18px 18px 18px" : "18px 4px 18px 18px",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "9px",
                          letterSpacing: "1.2px",
                          color: isIa ? "var(--text-muted)" : "rgba(255,255,255,0.75)",
                          marginBottom: "5px",
                        }}
                      >
                        {isIa ? "AWA — IA SONARA" : sc.contact.toUpperCase()}
                      </div>
                      <div style={{ fontSize: "14px", lineHeight: "1.55" }}>{m.text}</div>
                    </div>
                  </div>
                );
              })}

              {typing && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: nextIsIa ? "flex-start" : "flex-end",
                  }}
                >
                  <div
                    style={{
                      padding: "14px 18px",
                      background: nextIsIa ? "var(--bg-primary)" : "var(--brand-accent)",
                      border: nextIsIa ? "1px solid var(--border)" : "none",
                      borderRadius: "16px",
                    }}
                  >
                    {/* Typing dots */}
                    <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: nextIsIa ? "var(--text-primary)" : "#FFFFFF",
                            animation: "son-blink 1.1s ease-in-out infinite",
                            animationDelay: `${i * 0.18}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer buttons */}
            <div
              style={{
                padding: "18px 22px",
                borderTop: "1px solid var(--border)",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                flexWrap: "wrap",
              }}
            >
              <button
                onClick={playSimulation}
                disabled={playing}
                style={{
                  fontFamily: "'Satoshi', sans-serif",
                  flex: 1,
                  minWidth: "200px",
                  background: playing ? "var(--brand-accent-h)" : "var(--brand-accent)",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "999px",
                  padding: "13px 26px",
                  fontSize: "15px",
                  fontWeight: 700,
                  cursor: playing ? "default" : "pointer",
                  transition: "background 0.25s ease",
                }}
              >
                {playing
                  ? "Appel en cours…"
                  : finished
                  ? "⟲  Rejouer la simulation"
                  : "▶  Lancer la simulation"}
              </button>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                }}
              >
                SIMULATION — AUCUN APPEL RÉEL
              </div>
            </div>
          </Reveal>

          {/* Real-time Analysis Panel (Right) */}
          <Reveal
            delay={0.1}
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border)",
              borderRadius: "26px",
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "20px",
              transition: "background 0.3s ease, border-color 0.3s ease",
            }}
          >
            {/* Realtime analysis header */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "1.5px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                ANALYSE EN TEMPS RÉEL
              </div>
              <div style={{ flex: 1 }}></div>

              {/* Status Indicator Dot */}
              <span
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: playing ? "var(--brand-accent)" : finished ? "var(--success)" : "var(--border-strong)",
                  animation: playing ? "son-pulse 1.2s ease-in-out infinite" : "none",
                  display: "inline-block",
                }}
              />
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "var(--text-secondary)",
                }}
              >
                {playing ? "APPEL EN COURS" : finished ? "APPEL TERMINÉ" : "EN ATTENTE"}
              </div>
            </div>

            {/* KPI grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "14px", padding: "14px" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "1px",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  DURÉE
                </div>
                <div style={{ fontSize: "20px", fontWeight: 900 }}>{timerText}</div>
              </div>
              <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "14px", padding: "14px" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "1px",
                    color: "var(--text-muted)",
                    marginBottom: "4px",
                  }}
                >
                  RÉPLIQUES
                </div>
                <div style={{ fontSize: "20px", fontWeight: 900 }}>
                  {shown} / {sc.script.length}
                </div>
              </div>
            </div>

            {/* Sentiment Client Gauge */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "1px",
                    color: "var(--text-muted)",
                  }}
                >
                  SENTIMENT CLIENT
                </div>
                <div style={{ flex: 1 }}></div>
                <div style={{ fontSize: "13px", fontWeight: 700, color: sentimentColor }}>
                  {sentimentLabel}
                </div>
              </div>
              <div style={{ height: "8px", background: "var(--border-strong)", borderRadius: "999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    borderRadius: "999px",
                    background: sentimentColor,
                    width: `${sentimentVal}%`,
                    transition: "width 0.7s ease, background 0.7s ease",
                  }}
                />
              </div>
            </div>

            {/* Keypoints */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "1px",
                  color: "var(--text-muted)",
                }}
              >
                POINTS CLÉS DÉTECTÉS
              </div>
              {activePoints.length === 0 && (
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  Les insights apparaîtront pendant l'appel…
                </div>
              )}
              {activePoints.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "flex",
                    gap: "10px",
                    alignItems: "flex-start",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      width: "16px",
                      height: "16px",
                      borderRadius: "50%",
                      background: "var(--brand-accent)",
                      color: "#FFFFFF",
                      fontSize: "10px",
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: "1px",
                    }}
                  >
                    ✓
                  </div>
                  <div style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--text-primary)" }}>
                    {p.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Final summary card */}
            {finished && (
              <div
                style={{
                  background: "var(--bg-primary)",
                  border: "1px solid var(--border)",
                  color: "var(--text-primary)",
                  borderRadius: "18px",
                  padding: "18px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "1px",
                    color: "var(--brand-accent)",
                  }}
                >
                  RÉSUMÉ AUTOMATIQUE — GÉNÉRÉ EN 1,8 S
                </div>
                <div style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--text-primary)" }}>
                  {sc.summary}
                </div>
                <div
                  style={{
                    alignSelf: "flex-start",
                    background: "var(--brand-accent-t)",
                    border: "1px solid var(--border-accent)",
                    color: "var(--brand-accent)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    borderRadius: "999px",
                    padding: "5px 12px",
                  }}
                >
                  {sc.action}
                </div>
              </div>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
