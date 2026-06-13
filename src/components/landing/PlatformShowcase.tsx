"use client";

import React, { useEffect, useRef, useState } from "react";
import { Reveal } from "./Reveal";

export function PlatformShowcase() {
  const [isVisible, setIsVisible] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -60px 0px" }
    );
    if (tiltRef.current) {
      observer.observe(tiltRef.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    setIsLight(document.body.classList.contains("light-mode"));
    const observer = new MutationObserver(() => {
      setIsLight(document.body.classList.contains("light-mode"));
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="platform"
      data-screen-label="Plateforme"
      style={{
        background: "var(--bg-secondary)",
        color: "var(--text-primary)",
        padding: "clamp(50px, 6vw, 80px) clamp(16px, 4vw, 32px)",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        <Reveal style={{ display: "flex", flexDirection: "column", gap: "14px", maxWidth: "760px" }}>

          <h2
            style={{
              margin: 0,
              fontSize: "clamp(30px, 4vw, 48px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
            }}
          >
            Tout le terrain, dans un seul dashboard.
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
            Campagnes, appels en direct, transcriptions, exports — vos résultats arrivent pendant que les appels tournent.
          </p>
        </Reveal>

        {/* 3D tilt perspective container */}
        <div
          ref={tiltRef}
          style={{
            perspective: "1400px",
            marginTop: "clamp(36px, 5vw, 60px)",
            transformStyle: "preserve-3d",
          }}
        >
          {/* Browser mockup frame */}
          <div
            style={{
              borderRadius: "18px",
              border: "1px solid var(--border-strong)",
              overflow: "hidden",
              boxShadow: "var(--shadow-lg)",
              background: "var(--bg-primary)",
              transform: isVisible
                ? "rotateX(0deg) translateY(0)"
                : "rotateX(12deg) translateY(70px)",
              opacity: isVisible ? 1 : 0,
              transition: "transform 1.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 1.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.3s ease, border-color 0.3s ease",
            }}
          >
            {/* Top Browser Bar */}
            <div
              style={{
                background: "var(--bg-tertiary)",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "var(--border-strong)" }}></div>
              <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "var(--border-strong)" }}></div>
              <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "var(--border-strong)" }}></div>
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div
                  style={{
                    background: "var(--bg-primary)",
                    borderRadius: "8px",
                    padding: "6px 18px",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                  }}
                >
                  app.sonara.ci/campagnes
                </div>
              </div>
              <div style={{ width: "50px" }}></div>
            </div>

            {/* Dashboard Inner Body */}
            <div style={{ display: "flex", minHeight: "440px" }}>
              {/* Sidebar (Hidden on mobile <760px via custom media query in globals.css) */}
              <div
                className="son-dash-side"
                style={{
                  width: "208px",
                  flexShrink: 0,
                  background: "var(--bg-secondary)",
                  padding: "20px 14px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                  borderRight: "1px solid var(--border)",
                }}
              >
                <img
                  src={isLight ? "/assets/logo-noir.png" : "/assets/logo-blanc.png"}
                  alt="Sonara"
                  style={{ width: "96px", margin: "4px 8px 0" }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ padding: "9px 12px", borderRadius: "9px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                    Accueil
                  </div>
                  <div
                    style={{
                      padding: "9px 12px",
                      borderRadius: "9px",
                      fontSize: "13px",
                      fontWeight: 700,
                      color: "var(--brand-accent)",
                      background: "var(--brand-accent-t)",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--brand-accent)" }}></span>
                    Campagnes
                  </div>
                  <div style={{ padding: "9px 12px", borderRadius: "9px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                    Contacts
                  </div>
                  <div style={{ padding: "9px 12px", borderRadius: "9px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                    Rapports
                  </div>
                  <div style={{ padding: "9px 12px", borderRadius: "9px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                    Paramètres
                  </div>
                </div>
                <div style={{ flex: 1 }}></div>
                <div style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border)", borderRadius: "12px", padding: "14px" }}>
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "1px",
                      color: "var(--text-muted)",
                      marginBottom: "6px",
                    }}
                  >
                    CRÉDIT RESTANT
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--text-primary)" }}>
                    8 752 <span style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)" }}>appels</span>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div
                style={{
                  flex: 1,
                  background: "var(--bg-primary)",
                  color: "var(--text-primary)",
                  padding: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                  minWidth: 0,
                }}
              >
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <div style={{ fontSize: "18px", fontWeight: 900, letterSpacing: "-0.01em" }}>Campagnes</div>
                  <div style={{ flex: 1 }}></div>
                  <div
                    style={{
                      background: "var(--brand-accent)",
                      color: "#FFFFFF",
                      borderRadius: "999px",
                      padding: "8px 16px",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "default",
                    }}
                  >
                    + Nouvelle campagne
                  </div>
                </div>

                {/* KPI Grid */}
                <div className="son-dash-kpis" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "13px", padding: "14px" }}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      APPELS AUJOURD'HUI
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 900 }}>1 248</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-accent)", marginTop: "3px" }}>
                      +12% vs hier
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "13px", padding: "14px" }}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      TAUX DE RÉPONSE
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 900 }}>68%</div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-accent)", marginTop: "3px" }}>
                      +4 pts
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "13px", padding: "14px" }}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      CAMPAGNES ACTIVES
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 900 }}>3</div>
                    <div style={{ fontSize: "11px", fontWeight: 500, color: "var(--text-muted)", marginTop: "3px" }}>
                      2 planifiées
                    </div>
                  </div>
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "13px", padding: "14px" }}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        color: "var(--text-muted)",
                        marginBottom: "6px",
                      }}
                    >
                      SENTIMENT MOYEN
                    </div>
                    <div style={{ fontSize: "18px", fontWeight: 900 }}>
                      7,4<span style={{ fontSize: "11px", color: "var(--text-muted)" }}>/10</span>
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-accent)", marginTop: "3px" }}>
                      +0,6
                    </div>
                  </div>
                </div>

                {/* Campaign Rows list */}
                <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "13px", padding: "6px 0", overflow: "hidden" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Satisfaction agences — Q2
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                        3 214 / 5 000 appels
                      </div>
                    </div>
                    <div style={{ width: "110px", height: "6px", background: "var(--border-strong)", borderRadius: "999px", overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ width: "64%", height: "100%", background: "var(--brand-accent)", borderRadius: "999px" }}></div>
                    </div>
                    <div style={{ background: "var(--brand-accent-t)", color: "var(--brand-accent)", fontSize: "10px", fontWeight: 700, borderRadius: "999px", padding: "4px 10px", flexShrink: 0 }}>
                      En cours
                    </div>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        NPS post-appel SAV
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                        10 000 / 10 000 appels
                      </div>
                    </div>
                    <div style={{ width: "110px", height: "6px", background: "var(--border-strong)", borderRadius: "999px", overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ width: "100%", height: "100%", background: "var(--text-primary)", borderRadius: "999px" }}></div>
                    </div>
                    <div style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)", fontSize: "10px", fontWeight: 700, borderRadius: "999px", padding: "4px 10px", flexShrink: 0 }}>
                      Terminée
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Relance renouvellements — Juillet
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                        0 / 4 200 appels · départ lundi 8 h
                      </div>
                    </div>
                    <div style={{ width: "110px", height: "6px", background: "var(--border-strong)", borderRadius: "999px", overflow: "hidden", flexShrink: 0 }}>
                      <div style={{ width: "0%", height: "100%", background: "var(--brand-accent)" }}></div>
                    </div>
                    <div style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)", fontSize: "10px", fontWeight: 700, borderRadius: "999px", padding: "4px 10px", flexShrink: 0 }}>
                      Planifiée
                    </div>
                  </div>
                </div>

                {/* Bottom Row Charts / Live */}
                <div className="son-dash-bottom" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "12px" }}>
                  {/* Daily Chart */}
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "13px", padding: "14px" }}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        color: "var(--text-muted)",
                        marginBottom: "12px",
                      }}
                    >
                      APPELS PAR JOUR — 7 DERNIERS JOURS
                    </div>
                    <svg viewBox="0 0 280 90" style={{ width: "100%", height: "auto", display: "block" }}>
                      <rect x="8" y="48" width="24" height="42" rx="4" fill={isLight ? "rgba(18,18,18,0.1)" : "rgba(255,255,255,0.1)"}></rect>
                      <rect x="46" y="38" width="24" height="52" rx="4" fill={isLight ? "rgba(18,18,18,0.1)" : "rgba(255,255,255,0.1)"}></rect>
                      <rect x="84" y="52" width="24" height="38" rx="4" fill={isLight ? "rgba(18,18,18,0.1)" : "rgba(255,255,255,0.1)"}></rect>
                      <rect x="122" y="28" width="24" height="62" rx="4" fill={isLight ? "rgba(18,18,18,0.1)" : "rgba(255,255,255,0.1)"}></rect>
                      <rect x="160" y="20" width="24" height="70" rx="4" fill={isLight ? "rgba(18,18,18,0.1)" : "rgba(255,255,255,0.1)"}></rect>
                      <rect x="198" y="34" width="24" height="56" rx="4" fill={isLight ? "rgba(18,18,18,0.1)" : "rgba(255,255,255,0.1)"}></rect>
                      <rect x="236" y="6" width="24" height="84" rx="4" fill="var(--brand-accent)"></rect>
                    </svg>
                  </div>

                  {/* Live monitoring */}
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: "13px", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "1px",
                        color: "var(--text-muted)",
                      }}
                    >
                      EN DIRECT
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--brand-accent)",
                          animation: "son-pulse 1.4s ease-in-out infinite",
                        }}
                      ></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}>
                        +225 07 58 •• •• 41
                      </span>
                      <span style={{ flex: 1 }}></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--text-muted)" }}>
                        01:34
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--brand-accent)",
                          animation: "son-pulse 1.4s ease-in-out infinite 0.4s",
                        }}
                      ></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}>
                        +225 05 02 •• •• 89
                      </span>
                      <span style={{ flex: 1 }}></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--text-muted)" }}>
                        02:47
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: "var(--brand-accent)",
                          animation: "son-pulse 1.4s ease-in-out infinite 0.8s",
                        }}
                      ></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px" }}>
                        +225 01 71 •• •• 16
                      </span>
                      <span style={{ flex: 1 }}></span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--text-muted)" }}>
                        00:52
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
