import React, { useState } from "react";
import { Reveal } from "./Reveal";

export function UseCasesSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cases = [
    {
      vol: "5 000 – 20 000 APPELS / MOIS",
      title: "Banques & Microfinance",
      desc: "Satisfaction client, relance d'impayés, vérification KYC vocale.",
    },
    {
      vol: "20 000 – 100 000 APPELS / MOIS",
      title: "Télécoms",
      desc: "Enquêtes NPS, prévention du churn, upsell d'offres et de forfaits.",
    },
    {
      vol: "3 000 – 15 000 APPELS / MOIS",
      title: "Assurances",
      desc: "Renouvellements de contrats, réclamations, suivi des sinistres.",
    },
    {
      vol: "10 000 – 50 000 APPELS / MOIS",
      title: "Instituts d'études",
      desc: "Sondages quantitatifs sur 10 000 répondants en 48 h, pas en 3 semaines.",
    },
    {
      vol: "2 000 – 10 000 APPELS / MOIS",
      title: "E-commerce & Retail",
      desc: "Suivi post-achat, satisfaction livraison, mesure du NPS.",
    },
    {
      vol: "1 000 – 5 000 APPELS / MOIS",
      title: "Administrations & ONG",
      desc: "Enquêtes citoyennes, mesure d'impact des programmes.",
    },
  ];

  return (
    <section
      data-screen-label="Cas d'usage"
      style={{
        background: "var(--bg-secondary)",
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
            03 — CAS D'USAGE
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
            Pensé pour les secteurs qui appellent.
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
            Chaque secteur a ses questions. Sonara les pose, à l'échelle.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: "16px",
            marginTop: "clamp(36px, 5vw, 60px)",
          }}
        >
          {cases.map((item, idx) => {
            const isHovered = hoveredIndex === idx;
            const delay = (idx % 3) * 0.06;

            return (
              <Reveal
                key={idx}
                delay={delay}
                style={{ height: "100%" }}
              >
                <div
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    border: isHovered ? "1px solid var(--brand-accent)" : "1px solid var(--border)",
                    borderRadius: "22px",
                    padding: "26px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "36px",
                    height: "100%",
                    transition: "border-color 0.3s ease, background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease",
                    background: isHovered ? "var(--brand-accent-t)" : "var(--bg-primary)",
                    transform: isHovered ? "translateY(-4px)" : "translateY(0)",
                    boxShadow: isHovered ? "var(--shadow-md)" : "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      letterSpacing: "1.2px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {item.vol}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.6,
                        color: "var(--text-secondary)",
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
