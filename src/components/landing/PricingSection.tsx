"use client";

import React, { useState, useEffect, useRef } from "react";
import { Reveal } from "./Reveal";

// Testimonial types & data for the carousel in Business Plan card
interface BusinessTestimonial {
  id: number;
  initials: string;
  name: string;
  role: string;
  quote: string;
}

const BUSINESS_TESTIMONIALS: BusinessTestimonial[] = [
  {
    id: 1,
    initials: "AK",
    name: "Aïcha Koné",
    role: "Directrice Expérience Client — Banque, Abidjan",
    quote: "Nos enquêtes de satisfaction prenaient trois semaines avec le centre d'appels. Avec Sonara, 4 000 clients interrogés en deux jours — et les verbatims sont d'une précision impressionnante.",
  },
  {
    id: 2,
    initials: "JB",
    name: "Jean-Marc Brou",
    role: "Responsable Études — Opérateur télécom",
    quote: "On a divisé le coût de nos campagnes NPS par quatre. L'IA comprend même le nouchi de nos abonnés, ce qu'aucun outil n'avait réussi avant.",
  },
  {
    id: 3,
    initials: "MD",
    name: "Mariam Diabaté",
    role: "Chargée d'études — Institut de sondage",
    quote: "10 000 répondants en 48 heures au lieu de trois semaines de terrain. Le rapport tombe en temps réel pendant que la campagne tourne encore.",
  },
];

// ROI Counter Component with custom count-up/count-down animations
interface RoiCounterProps {
  start: number;
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

function RoiCounter({ start, end, prefix = "", suffix = "", duration = 1600 }: RoiCounterProps) {
  const [value, setValue] = useState(start);
  const [hasStarted, setHasStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!hasStarted) return;
    let startTime: number | null = null;

    function animate(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const progressPercent = Math.min(progress / duration, 1);
      // easeOutCubic: 1 - (1 - x)^3
      const easedProgress = 1 - Math.pow(1 - progressPercent, 3);
      
      setValue(Math.round(start + easedProgress * (end - start)));

      if (progressPercent < 1) {
        requestAnimationFrame(animate);
      } else {
        setValue(end);
      }
    }
    requestAnimationFrame(animate);
  }, [hasStarted, start, end, duration]);

  return (
    <span ref={ref}>
      {prefix}{value}{suffix}
    </span>
  );
}

// Main Component
export function PricingSection() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [tIndex, setTIndex] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(0); // 0 (item 1) open by default, null = all closed
  const [calcCalls, setCalcCalls] = useState(5000);
  const [testiFade, setTestiFade] = useState(false);

  const carouselTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isAnnual = billing === "annual";

  // Testimonials carousel autoplay logic
  useEffect(() => {
    const startAutoplay = () => {
      carouselTimerRef.current = setInterval(() => {
        setTestiFade(true);
        setTimeout(() => {
          setTIndex((prev) => (prev + 1) % BUSINESS_TESTIMONIALS.length);
          setTestiFade(false);
        }, 150); // duration of fade transition
      }, 6500);
    };

    startAutoplay();

    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, []);

  const jumpToTestimonial = (idx: number) => {
    if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    setTestiFade(true);
    setTimeout(() => {
      setTIndex(idx);
      setTestiFade(false);
    }, 150);
  };

  // Calculator logic
  const annual = billing === "annual";
  const calls = calcCalls;
  const options: [string, number][] = [
    ["PAY-AS-YOU-GO", calls * 150],
    ["STARTER", (annual ? 42500 : 50000) + Math.max(0, calls - 1000) * 80],
    ["BUSINESS", (annual ? 170000 : 200000) + Math.max(0, calls - 10000) * 60],
  ];
  // Find best plan option
  const bestOption = [...options].sort((a, b) => a[1] - b[1])[0];
  const calcPlanName = bestOption[0];
  const calcCostVal = bestOption[1];
  const agents = Math.max(1, Math.ceil(calls / 600));
  const centerCost = agents * 225000;
  const savingsPct = Math.max(0, Math.round((1 - calcCostVal / centerCost) * 100));
  const barWidthPercent = Math.max(3, Math.min(100, (calcCostVal / centerCost) * 100));

  const formatNumber = (num: number) => {
    return num.toLocaleString("fr-FR");
  };

  // Generate top wave strip bars (72 bars)
  const renderWaveStrip = () => {
    return (
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "180px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
          gap: "3px",
          opacity: 0.35,
          pointerEvents: "none",
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        {Array.from({ length: 72 }).map((_, i) => {
          const h = Math.round(16 + Math.abs(Math.sin(i * 0.52)) * 68 + ((i * 37) % 21));
          return (
            <span
              key={i}
              style={{
                width: "3px",
                height: `${h}px`,
                background: "linear-gradient(to bottom, #0052FF, transparent)",
                transformOrigin: "top",
                animation: `scWave ${(1.7 + (i % 5) * 0.23).toFixed(2)}s ease-in-out infinite`,
                animationDelay: `${(i * 0.085).toFixed(3)}s`,
              }}
            />
          );
        })}
      </div>
    );
  };

  // Generate final CTA equalizer bars (72 bars)
  const renderCtaWave = () => {
    return (
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "140px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: "3px",
          opacity: 0.45,
          pointerEvents: "none",
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
          maskImage: "linear-gradient(to right, transparent, #000 12%, #000 88%, transparent)",
        }}
      >
        {Array.from({ length: 72 }).map((_, i) => {
          const h = 10 + Math.abs(Math.cos(i * 0.44)) * 75 + ((i * 29) % 18);
          return (
            <span
              key={i}
              style={{
                width: "3px",
                height: `${h}px`,
                background: "linear-gradient(to top, #ffffff, transparent)",
                transformOrigin: "bottom",
                animation: `scWave ${1.5 + (i % 4) * 0.26}s ease-in-out infinite`,
                animationDelay: `${i * 0.065}s`,
              }}
            />
          );
        })}
      </div>
    );
  };

  const testimonialBlock = BUSINESS_TESTIMONIALS[tIndex];

  return (
    <section
      id="pricing"
      style={{
        background: "var(--bg-primary, #121212)",
        color: "var(--text-primary, #ffffff)",
        padding: "clamp(60px, 7vh, 100px) 24px 56px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          top: "-240px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "980px",
          height: "520px",
          background: "radial-gradient(ellipse at center, rgba(0,82,255,0.20), transparent 65%)",
          pointerEvents: "none",
        }}
      />
      
      {renderWaveStrip()}

      <div style={{ maxWidth: "1180px", margin: "0 auto", position: "relative", zIndex: 1 }}>
        
        {/* ==================== 1. HEADER & TOGGLE ==================== */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "40px",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "clamp(40px, 6vw, 72px)",
          }}
          className="reveal visible"
        >
          <div style={{ minWidth: "280px" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                border: "1px solid var(--border, rgba(255,255,255,0.16))",
                borderRadius: "999px",
                padding: "8px 16px",
                marginBottom: "28px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "var(--brand-accent, #0052FF)",
                  animation: "scPulse 2s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "2.5px",
                  color: "var(--text-secondary, #9A9A9A)",
                }}
              >
                TARIFICATION — EN FCFA, SANS SURPRISE
              </span>
            </div>
            <h2 style={{ margin: 0, lineHeight: 0.95, textWrap: "balance" }}>
              <span
                style={{
                  display: "block",
                  fontSize: "clamp(54px, 8.5vw, 104px)",
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  color: "var(--brand-accent, #0052FF)",
                  textTransform: "uppercase",
                }}
              >
                Un tarif
              </span>
              <span
                style={{
                  display: "block",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: "clamp(34px, 5.6vw, 68px)",
                  letterSpacing: "-0.03em",
                  color: "var(--text-primary, #ffffff)",
                  textTransform: "uppercase",
                  marginTop: "8px",
                }}
              >
                Transparent.
              </span>
            </h2>
          </div>
          <div style={{ maxWidth: "470px", display: "flex", flexDirection: "column", gap: "26px" }}>
            <p style={{ margin: 0, fontSize: "17px", lineHeight: 1.65, color: "var(--text-secondary, #B5B5B5)", textWrap: "pretty" }}>
              Un agent d'enquête coûte 150 000 à 300 000 FCFA par mois. Sonara mène les mêmes appels en français ivoirien, livre les premiers résultats en moins de 10 minutes — pour une fraction du coût.
            </p>
            
            {/* Toggle Switch */}
            <div
              style={{
                display: "inline-flex",
                alignSelf: "flex-start",
                alignItems: "center",
                gap: "4px",
                background: "var(--bg-tertiary, #1A1A1A)",
                border: "1px solid var(--border, rgba(255,255,255,0.10))",
                borderRadius: "999px",
                padding: "5px",
              }}
            >
              <button
                onClick={() => setBilling("monthly")}
                className={`btn-toggle-switch ${billing === "monthly" ? "active" : ""}`}
                style={{
                  padding: "10px 20px",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body), sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  background: billing === "monthly" ? "var(--brand-accent, #0052FF)" : "transparent",
                  color: billing === "monthly" ? "#ffffff" : "#8A8A8A",
                  transition: "background 0.25s ease, color 0.25s ease",
                }}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={`btn-toggle-switch ${billing === "annual" ? "active" : ""}`}
                style={{
                  padding: "10px 20px",
                  borderRadius: "999px",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-body), sans-serif",
                  fontWeight: 700,
                  fontSize: "14px",
                  background: billing === "annual" ? "var(--brand-accent, #0052FF)" : "transparent",
                  color: billing === "annual" ? "#ffffff" : "#8A8A8A",
                  transition: "background 0.25s ease, color 0.25s ease",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                Annuel
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    marginLeft: "7px",
                    opacity: 0.85,
                  }}
                >
                  −15%
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ==================== 2. CARTE HÉROS — PLAN BUSINESS ==================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            background: "#ffffff",
            color: "#121212",
            borderRadius: "24px",
            overflow: "hidden",
            boxShadow: "0 30px 90px rgba(0,0,0,0.5)",
            marginBottom: "18px",
          }}
          className="reveal visible son-hero-pricing-card"
        >
          {/* Left Column : Pricing Info */}
          <div style={{ padding: "clamp(30px, 4.5vw, 52px)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "22px" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "#888" }}>
                PLAN BUSINESS
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "1.5px",
                  background: "var(--brand-accent, #0052FF)",
                  color: "#fff",
                  borderRadius: "999px",
                  padding: "5px 11px",
                }}
              >
                ★ RECOMMANDÉ
              </span>
            </div>
            <h3 style={{ margin: "0 0 8px", fontSize: "30px", fontWeight: 900, letterSpacing: "-0.01em", color: "#121212" }}>
              L'IA qui appelle pour vous
            </h3>
            <p style={{ margin: "0 0 28px", fontSize: "15.5px", lineHeight: 1.6, color: "#5C5C5C", textWrap: "pretty" }}>
              Pour les équipes qui interrogent des milliers de clients chaque mois — banques, télécoms, assurances, instituts.
            </p>

            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "clamp(48px, 6vw, 62px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1 }}>
                {isAnnual ? "170 000" : "200 000"}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "14px", color: "#777" }}>
                FCFA / mois
              </span>
            </div>
            
            {isAnnual && (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "10px" }}>
                <span style={{ fontSize: "15px", color: "#999", textDecoration: "line-through" }}>
                  200 000
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    letterSpacing: "1px",
                    color: "var(--brand-accent, #0052FF)",
                    border: "1px solid rgba(0,82,255,0.35)",
                    borderRadius: "999px",
                    padding: "4px 10px",
                  }}
                >
                  FACTURÉ 2 040 000 FCFA / AN
                </span>
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "14px", margin: "30px 0 34px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="12" fill="rgba(0,82,255,0.10)" />
                  <path d="M7 12.5l3.2 3L17 9" stroke="#0052FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#121212" }}>10 000 appels inclus chaque mois</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="12" fill="rgba(0,82,255,0.10)" />
                  <path d="M7 12.5l3.2 3L17 9" stroke="#0052FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#121212" }}>60 FCFA par appel supplémentaire</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="12" fill="rgba(0,82,255,0.10)" />
                  <path d="M7 12.5l3.2 3L17 9" stroke="#0052FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#121212" }}>Campagnes actives illimitées</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="12" fill="rgba(0,82,255,0.10)" />
                  <path d="M7 12.5l3.2 3L17 9" stroke="#0052FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "#121212" }}>Annulable à tout moment</span>
              </div>
            </div>

            <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
              <a
                href="/signup"
                className="btn btn-primary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  height: "54px",
                  borderRadius: "14px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                Démarrer avec Business<span style={{ fontSize: "18px" }}>→</span>
              </a>
              <a
                href="#demo"
                className="btn btn-secondary"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  width: "100%",
                  height: "54px",
                  border: "1px solid rgba(18,18,18,0.18)",
                  borderRadius: "14px",
                  background: "transparent",
                  color: "#121212",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                Planifier une démo
              </a>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "1.5px", color: "#999", textAlign: "center", marginTop: "4px" }}>
                PAIEMENT WAVE CI OU VIREMENT — TARIFS HT
              </span>
            </div>
          </div>

          {/* Right Column : Features & Testimonials Carousel */}
          <div style={{ padding: "clamp(30px, 4.5vw, 52px)", background: "#F4F4F1" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "#888", marginBottom: "20px" }}>
              TOUT CE QUI EST INCLUS
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "12px" }}>
              {[
                "IA conversationnelle en français ivoirien (nouchi compris)",
                "Brief de campagne en langage naturel — zéro code",
                "Import CSV et normalisation des numéros CI",
                "Transcription + résumé automatique en moins de 2 min",
                "Dashboard temps réel : KPIs, transcriptions, statuts",
                "Détection messagerie vocale et relances automatiques",
                "Transfert vers un agent humain à la demande",
                "Export Excel + accès API",
                "Analyse IA complète et support prioritaire",
              ].map((feature, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "11px" }}>
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "19px", height: "19px", borderRadius: "50%", background: "rgba(0,82,255,0.10)", color: "#0052FF", fontSize: "11px", flexShrink: 0 }}>
                    ✓
                  </span>
                  <span style={{ fontSize: "14.5px", color: "#333" }}>{feature}</span>
                </div>
              ))}
            </div>

            <div style={{ height: "1px", background: "#E1E1DB", margin: "26px 0" }} />

            {/* Testimonial block */}
            <div
              className={`son-testi-card-box ${testiFade ? "fade-out" : "fade-in"}`}
              style={{
                background: "#ffffff",
                border: "1px solid #E8E8E3",
                borderRadius: "16px",
                padding: "20px",
                minHeight: "158px",
                transition: "opacity 0.15s ease",
                opacity: testiFade ? 0 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    background: "var(--brand-accent, #0052FF)",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "13px",
                  }}
                >
                  {testimonialBlock.initials}
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#121212" }}>
                    {testimonialBlock.name}
                  </h4>
                  <p style={{ margin: 0, fontSize: "11px", color: "#666" }}>
                    {testimonialBlock.role}
                  </p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "2px", marginBottom: "10px" }}>
                {[0, 1, 2, 3, 4].map((s) => (
                  <span key={s} style={{ color: "var(--brand-accent, #0052FF)", fontSize: "14px" }}>★</span>
                ))}
              </div>
              <p style={{ margin: 0, fontSize: "13.5px", fontStyle: "italic", lineHeight: 1.5, color: "#444" }}>
                "{testimonialBlock.quote}"
              </p>
            </div>
            
            {/* Carousel dots */}
            <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "16px" }}>
              {BUSINESS_TESTIMONIALS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => jumpToTestimonial(idx)}
                  aria-label={`Témoignage ${idx + 1}`}
                  style={{
                    height: "6px",
                    width: tIndex === idx ? "22px" : "6px",
                    borderRadius: "999px",
                    background: tIndex === idx ? "var(--brand-accent, #0052FF)" : "rgba(18,18,18,0.22)",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    transition: "all 0.3s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ==================== 3. SECONDARY PLANS GRID ==================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
            gap: "18px",
            marginTop: "18px",
          }}
          className="reveal visible"
        >
          {/* Starter Card */}
          <div
            className="son-pricing-card-sec"
            style={{
              background: "var(--bg-secondary, #1A1A1A)",
              border: "1px solid var(--border, rgba(255,255,255,0.09))",
              borderRadius: "20px",
              padding: "34px 30px",
              display: "flex",
              flexDirection: "column",
              transition: "border-color 0.3s ease, transform 0.3s ease",
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "var(--text-muted, #8A8A8A)", marginBottom: "18px" }}>
              STARTER
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>
                {isAnnual ? "42 500" : "50 000"}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--text-muted, #777)" }}>
                FCFA / mois
              </span>
            </div>
            <p style={{ margin: "14px 0 22px", fontSize: "14.5px", lineHeight: 1.6, color: "var(--text-secondary, #9C9C9C)", textWrap: "pretty" }}>
              Pour tester l'IA vocale sur vos premières campagnes.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>1 000 appels inclus / mois</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>80 FCFA par appel supplémentaire</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>1 campagne active</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Export Excel — analyse IA basique</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Support par email</span></div>
            </div>
            <a
              href="/signup"
              className="btn btn-secondary"
              style={{
                marginTop: "auto",
                height: "48px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              Commencer
            </a>
          </div>

          {/* Pay As You Go Card */}
          <div
            className="son-pricing-card-sec"
            style={{
              background: "var(--bg-secondary, #1A1A1A)",
              border: "1px solid var(--border, rgba(255,255,255,0.09))",
              borderRadius: "20px",
              padding: "34px 30px",
              display: "flex",
              flexDirection: "column",
              transition: "border-color 0.3s ease, transform 0.3s ease",
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "var(--text-muted, #8A8A8A)", marginBottom: "18px" }}>
              PAY-AS-YOU-GO
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>
                150
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--text-muted, #777)" }}>
                FCFA / appel
              </span>
            </div>
            <p style={{ margin: "14px 0 22px", fontSize: "14.5px", lineHeight: 1.6, color: "var(--text-secondary, #9C9C9C)", textWrap: "pretty" }}>
              Sans engagement. Payez uniquement les appels passés.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Aucun engagement</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Campagnes illimitées</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Export Excel — analyse IA basique</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Support par email</span></div>
            </div>
            <a
              href="/signup"
              className="btn btn-secondary"
              style={{
                marginTop: "auto",
                height: "48px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              Lancer une campagne
            </a>
          </div>

          {/* Enterprise Card */}
          <div
            className="son-pricing-card-sec enterprise"
            style={{
              background: "linear-gradient(160deg, #16204A 0%, var(--bg-primary, #121212) 60%)",
              border: "1px solid var(--border-accent, rgba(0,82,255,0.35))",
              borderRadius: "20px",
              padding: "34px 30px",
              display: "flex",
              flexDirection: "column",
              transition: "border-color 0.3s ease, transform 0.3s ease",
            }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "#7AA2FF", marginBottom: "18px" }}>
              ENTERPRISE
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
              <span style={{ fontSize: "40px", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1 }}>
                Sur devis
              </span>
            </div>
            <p style={{ margin: "14px 0 22px", fontSize: "14.5px", lineHeight: 1.6, color: "var(--text-secondary, #9C9C9C)", textWrap: "pretty" }}>
              Banques, télécoms, institutions — volumes négociés.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginBottom: "28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Appels illimités, tarif négocié</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Analyse IA personnalisée</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>API + Webhooks, intégrations CRM</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Données hébergées en Côte d'Ivoire</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}><span style={{ color: "var(--brand-accent-h, #4D82FF)", fontSize: "13px" }}>✓</span><span style={{ fontSize: "14px", color: "var(--text-primary, #C9C9C9)" }}>Support dédié à Abidjan + SLA</span></div>
            </div>
            <a
              href="mailto:contact@sonara.ai"
              className="btn btn-primary"
              style={{
                marginTop: "auto",
                height: "48px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
                border: "none",
                background: "var(--brand-accent, #0052FF)",
              }}
            >
              Contacter l'équipe
            </a>
          </div>
        </div>

        {/* ==================== 4. TRUST BADGES STRIP ==================== */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "12px",
            marginTop: "28px",
          }}
          className="reveal visible"
        >
          {[
            "CONFORME ARTCI",
            "DONNÉES HÉBERGÉES EN CÔTE D'IVOIRE",
            "LOI 2013-450 — DONNÉES PERSONNELLES",
          ].map((text, i) => (
            <div
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "9px",
                border: "1px solid var(--border, rgba(255,255,255,0.13))",
                borderRadius: "999px",
                padding: "9px 18px",
                background: "var(--bg-glass, rgba(255,255,255,0.03))",
              }}
            >
              <svg width="13" height="15" viewBox="0 0 13 15" fill="none">
                <path d="M6.5 0.8 12 2.9v4.2c0 3.6-2.3 6.1-5.5 7.1C3.3 13.2 1 10.7 1 7.1V2.9L6.5 0.8z" stroke="#0052FF" strokeWidth="1.3" fill="rgba(0,82,255,0.12)" />
                <path d="M4.2 7.4l1.7 1.6 3-3.3" stroke="#0052FF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: "1.8px", color: "var(--text-secondary, #ABABAB)" }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        {/* ==================== 5. PAYMENT MARQUEE ==================== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "26px",
            marginTop: "clamp(48px, 7vw, 72px)",
          }}
          className="reveal visible"
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "100%", maxWidth: "560px" }}>
            <div style={{ flex: 1, height: "1px", background: "var(--border, rgba(255,255,255,0.10))" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "var(--text-muted, #8A8A8A)", whiteSpace: "nowrap" }}>
              NOS MOYENS DE PAIEMENT
            </span>
            <div style={{ flex: 1, height: "1px", background: "var(--border, rgba(255,255,255,0.10))" }} />
          </div>

          <div
            style={{
              width: "100%",
              maxWidth: "880px",
              overflow: "hidden",
              WebkitMaskImage: "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
              maskImage: "linear-gradient(to right, transparent, #000 14%, #000 86%, transparent)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "14px",
                width: "max-content",
                animation: "scMarquee 26s linear infinite",
              }}
            >
              {/* Payment cards list duplicated twice for continuous loop */}
              {[1, 2].map((loop) => (
                <React.Fragment key={loop}>
                  {/* Wave */}
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", height: "52px", background: "#ffffff", borderRadius: "14px", padding: "0 26px", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 900, fontSize: "21px", letterSpacing: "-0.5px", color: "#00B5E2" }}>wave</span>
                  </div>
                  {/* Orange Money */}
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px", height: "52px", background: "#ffffff", borderRadius: "14px", padding: "0 22px", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "flex-end", justifyContent: "center", width: "30px", height: "30px", background: "#FF7900", borderRadius: "3px", paddingBottom: "3px" }}>
                      <span style={{ color: "#ffffff", fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.2px" }}>orange</span>
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#1A1A1A" }}>Money</span>
                  </div>
                  {/* MTN MoMo */}
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px", height: "52px", background: "#ffffff", borderRadius: "14px", padding: "0 22px", whiteSpace: "nowrap" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "48px", height: "28px", background: "#FFCC00", borderRadius: "50%" }}>
                      <span style={{ color: "#004F9F", fontStyle: "italic", fontWeight: 900, fontSize: "12.5px", letterSpacing: "-0.3px" }}>MTN</span>
                    </span>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#1A1A1A" }}>MoMo</span>
                  </div>
                  {/* Moov Money */}
                  <div style={{ display: "inline-flex", alignItems: "baseline", justifyContent: "center", gap: "6px", height: "52px", background: "#ffffff", borderRadius: "14px", padding: "14px 24px 0", whiteSpace: "nowrap" }}>
                    <span style={{ fontFamily: "'Satoshi', sans-serif", fontWeight: 900, fontSize: "20px", letterSpacing: "-0.6px", color: "#0072BC" }}>moov</span>
                    <span style={{ fontWeight: 700, fontSize: "15px", color: "#F58220" }}>money</span>
                  </div>
                  {/* Visa & Mastercard */}
                  <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "14px", height: "52px", background: "#ffffff", borderRadius: "14px", padding: "0 24px", whiteSpace: "nowrap" }}>
                    <span style={{ fontStyle: "italic", fontWeight: 900, fontSize: "17px", letterSpacing: "0.5px", color: "#1A1F71" }}>VISA</span>
                    <span style={{ width: "1px", height: "22px", background: "rgba(18,18,18,0.12)" }} />
                    <span style={{ display: "inline-flex" }}>
                      <span style={{ width: "19px", height: "19px", borderRadius: "50%", background: "#EB001B" }} />
                      <span style={{ width: "19px", height: "19px", borderRadius: "50%", background: "#F79E1B", marginLeft: "-8px", opacity: 0.92 }} />
                    </span>
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== 6. COST CALCULATOR ==================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "clamp(32px, 5vw, 64px)",
            background: "var(--bg-secondary, #1A1A1A)",
            border: "1px solid var(--border, rgba(255,255,255,0.09))",
            borderRadius: "24px",
            padding: "clamp(32px, 5vw, 56px)",
            marginTop: "clamp(48px, 7vw, 72px)",
          }}
          className="reveal visible"
        >
          {/* Left Panel : Slider */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "var(--text-muted, #8A8A8A)", marginBottom: "16px" }}>
              ESTIMEZ VOTRE BUDGET
            </span>
            <h3 style={{ margin: "0 0 10px", fontSize: "clamp(26px, 3.4vw, 36px)", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-primary, #fff)", lineHeight: 1.05 }}>
              Combien d'appels par&nbsp;mois&nbsp;?
            </h3>
            <p style={{ margin: "0 0 34px", fontSize: "14.5px", lineHeight: 1.6, color: "var(--text-secondary, #9C9C9C)", textWrap: "pretty" }}>
              Déplacez le curseur — on vous recommande le plan le plus économique et on le compare au coût d'un centre d'appels classique.
            </p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "18px" }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: "clamp(40px, 5vw, 56px)",
                  color: "var(--brand-accent, #0052FF)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1,
                }}
              >
                {formatNumber(calcCalls)}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "var(--text-muted, #777)" }}>
                appels / mois
              </span>
            </div>
            
            <input
              type="range"
              min="200"
              max="20000"
              step="200"
              value={calcCalls}
              onChange={(e) => setCalcCalls(parseInt(e.target.value))}
              style={{
                width: "100%",
                accentColor: "var(--brand-accent, #0052FF)",
                cursor: "pointer",
                height: "32px",
              }}
            />
            
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "1px", color: "#666" }}>200</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "1px", color: "#666" }}>20 000</span>
            </div>
          </div>

          {/* Right Panel : Results */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "var(--text-muted, #8A8A8A)" }}>
                PLAN RECOMMANDÉ
              </span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "1.5px",
                  background: "var(--brand-accent, #0052FF)",
                  color: "#fff",
                  borderRadius: "999px",
                  padding: "6px 14px",
                }}
              >
                {calcPlanName}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #fff)" }}>Avec Sonara</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "15px", fontWeight: 700, color: "var(--brand-accent, #0052FF)" }}>
                    {formatNumber(calcCostVal)} FCFA/mois
                  </span>
                </div>
                <div style={{ height: "12px", borderRadius: "999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${barWidthPercent}%`,
                      borderRadius: "999px",
                      background: "linear-gradient(to right, #0052FF, #4D82FF)",
                      transition: "width 0.4s ease",
                      minWidth: "3%",
                    }}
                  />
                </div>
              </div>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
                  <span style={{ fontSize: "14px", color: "var(--text-secondary, #9C9C9C)" }}>Centre d'appels classique</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "var(--text-secondary, #9C9C9C)" }}>
                    ~{formatNumber(centerCost)} FCFA/mois
                  </span>
                </div>
                <div style={{ height: "12px", borderRadius: "999px", background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "100%", borderRadius: "999px", background: "rgba(255,255,255,0.22)" }} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px solid var(--border, rgba(255,255,255,0.09))", paddingTop: "20px" }}>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontStyle: "italic",
                  fontWeight: 700,
                  fontSize: "34px",
                  color: "var(--brand-accent, #0052FF)",
                  letterSpacing: "-0.02em",
                }}
              >
                −{savingsPct}%
              </span>
              <span style={{ fontSize: "13.5px", lineHeight: 1.5, color: "var(--text-secondary, #9C9C9C)" }}>
                d'économie estimée, soit <strong style={{ color: "var(--text-primary, #fff)" }}>{formatNumber(centerCost - calcCostVal)} FCFA</strong> par mois
                <br />
                (équivaut à {agents} agent{agents > 1 ? "s" : ""} dédié{agents > 1 ? "s" : ""})
              </span>
            </div>
          </div>
        </div>

        {/* ==================== 7. ROI STATS ==================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "32px",
            borderTop: "1px solid var(--border, rgba(255,255,255,0.09))",
            borderBottom: "1px solid var(--border, rgba(255,255,255,0.09))",
            padding: "44px 0",
            margin: "clamp(36px, 5vh, 60px) 0",
          }}
          className="reveal visible"
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontStyle: "italic", fontWeight: 700, fontSize: "38px", color: "var(--brand-accent, #0052FF)", letterSpacing: "-0.02em" }}>
              <RoiCounter start={0} end={80} prefix="−" suffix="%" />
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-secondary, #999)", lineHeight: 1.5 }}>
              de coûts vs un centre d'appels classique
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontStyle: "italic", fontWeight: 700, fontSize: "38px", color: "var(--brand-accent, #0052FF)", letterSpacing: "-0.02em" }}>
              <RoiCounter start={0} end={10} prefix="< " suffix=" min" />
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-secondary, #999)", lineHeight: 1.5 }}>
              pour obtenir les premiers résultats d'une campagne
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontStyle: "italic", fontWeight: 700, fontSize: "38px", color: "var(--brand-accent, #0052FF)", letterSpacing: "-0.02em" }}>
              <RoiCounter start={60} end={2} prefix="< " suffix=" min" />
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-secondary, #999)", lineHeight: 1.5 }}>
              entre la fin d'un appel et son rapport complet
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontStyle: "italic", fontWeight: 700, fontSize: "38px", color: "var(--brand-accent, #0052FF)", letterSpacing: "-0.02em" }}>
              <RoiCounter start={5} end={0} suffix="" />
            </span>
            <span style={{ fontSize: "14px", color: "var(--text-secondary, #999)", lineHeight: 1.5 }}>
              développeur requis — brief en langage naturel
            </span>
          </div>
        </div>

        {/* ==================== 8. FAQ ==================== */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "clamp(32px, 5vw, 72px)",
            marginBottom: "clamp(36px, 5vh, 60px)",
          }}
          className="reveal visible"
        >
          {/* FAQ Left Block */}
          <div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "2.5px", color: "var(--text-muted, #8A8A8A)" }}>
              FAQ
            </span>
            <h3 style={{ margin: "14px 0 18px", fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 1.05 }}>
              Questions
              <br />
              fréquentes
            </h3>
            <p style={{ margin: "0 0 26px", fontSize: "15px", lineHeight: 1.65, color: "var(--text-secondary, #9C9C9C)", maxWidth: "360px", textWrap: "pretty" }}>
              Une question spécifique sur les volumes, la conformité ARTCI ou l'intégration ? L'équipe est à Abidjan.
            </p>
            <a
              href="mailto:contact@sonara.ai"
              className="btn btn-secondary"
              style={{
                height: "50px",
                padding: "0 26px",
                borderRadius: "12px",
                fontSize: "15px",
                fontWeight: 700,
              }}
            >
              Parler à l'équipe →
            </a>
          </div>

          {/* FAQ Accordion (Right Block) */}
          <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid var(--border, rgba(255,255,255,0.09))" }}>
            {[
              {
                q: "Qu'est-ce qu'un « appel inclus » ?",
                a: "Un appel correspond à une conversation menée par l'IA avec votre contact (environ 2 minutes en moyenne). La détection de messagerie vocale et les relances automatiques sont incluses.",
              },
              {
                q: "Puis-je changer de plan en cours de route ?",
                a: "Oui. Vous passez de Starter à Business (ou inversement) à tout moment depuis votre dashboard. Le changement prend effet à la période de facturation suivante.",
              },
              {
                q: "Comment se passe le paiement ?",
                a: "En FCFA, par Wave CI ou virement bancaire. Pas de carte en dollars, pas de taux de change : le prix affiché est le prix payé.",
              },
              {
                q: "Où sont hébergées les données ?",
                a: "En Côte d'Ivoire, dans le datacenter ST Digital de Grand-Bassam — en conformité avec l'ARTCI et la loi 2013-450 sur la protection des données personnelles.",
              },
              {
                q: "L'IA parle-t-elle vraiment le français ivoirien ?",
                a: "Oui — accents, expressions locales et nouchi compris. L'IA se présente naturellement en début d'appel et vos contacts peuvent refuser l'enquête ou demander un rappel à tout moment.",
              },
            ].map((faq, idx) => {
              const isOpen = faqOpen === idx;
              return (
                <div key={idx} style={{ borderBottom: "1px solid var(--border, rgba(255,255,255,0.09))" }}>
                  <div
                    onClick={() => setFaqOpen(isOpen ? null : idx)}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "16px",
                      padding: "21px 2px",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "16.5px", fontWeight: 700, color: "var(--text-primary, #fff)" }}>
                      {faq.q}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "20px",
                        fontWeight: 500,
                        color: isOpen ? "var(--brand-accent, #0052FF)" : "var(--text-secondary, #999)",
                        transform: isOpen ? "rotate(45deg)" : "none",
                        transition: "transform 0.3s ease, color 0.3s ease",
                        display: "inline-block",
                        userSelect: "none",
                      }}
                    >
                      +
                    </span>
                  </div>
                  <div
                    style={{
                      maxHeight: isOpen ? "280px" : "0",
                      opacity: isOpen ? 1 : 0,
                      overflow: "hidden",
                      transition: "max-height 0.4s ease, opacity 0.4s ease",
                    }}
                  >
                    <p
                      style={{
                        margin: "0 0 20px",
                        fontSize: "14.5px",
                        lineHeight: 1.6,
                        color: "var(--text-secondary, #b5b5b5)",
                        paddingLeft: "2px",
                        paddingRight: "20px",
                      }}
                    >
                      {faq.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
