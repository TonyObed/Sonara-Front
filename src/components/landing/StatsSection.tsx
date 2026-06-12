import React from "react";
import { Reveal, Counter } from "./Reveal";

export function StatsSection() {
  return (
    <section
      data-screen-label="Stats"
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
            01 — CHIFFRES CLÉS
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(30px, 4vw, 48px)",
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: "-0.02em",
              color: "var(--text-primary)",
            }}
          >
            Le centre d'appels, sans le centre d'appels.
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
            Une IA vocale qui appelle, converse en français ivoirien et livre des rapports structurés — pendant que vos équipes font autre chose.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
            gap: "30px 24px",
            marginTop: "clamp(36px, 5vw, 60px)",
          }}
        >
          <Reveal
            delay={0}
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "clamp(42px, 4.5vw, 64px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "var(--brand-accent)",
              }}
            >
              <Counter target={75} prefix="−" suffix="%" />
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                lineHeight: 1.5,
                color: "var(--text-secondary)",
              }}
            >
              de coûts par rapport à un centre d'appels classique
            </div>
          </Reveal>

          <Reveal
            delay={0.08}
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "clamp(42px, 4.5vw, 64px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "var(--text-primary)",
              }}
            >
              <Counter target={10} prefix="<" suffix=" min" />
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                lineHeight: 1.5,
                color: "var(--text-secondary)",
              }}
            >
              pour obtenir vos premiers résultats exploitables
            </div>
          </Reveal>

          <Reveal
            delay={0.16}
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "clamp(42px, 4.5vw, 64px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "var(--text-primary)",
              }}
            >
              <Counter target={40} prefix="~" suffix=" F" />
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                lineHeight: 1.5,
                color: "var(--text-secondary)",
              }}
            >
              CFA par appel — contre 150 000 à 300 000 FCFA par agent et par mois
            </div>
          </Reveal>

          <Reveal
            delay={0.24}
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "20px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            <div
              style={{
                fontSize: "clamp(42px, 4.5vw, 64px)",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1,
                color: "var(--text-primary)",
              }}
            >
              <Counter target={100} suffix="%" />
            </div>
            <div
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12px",
                lineHeight: 1.5,
                color: "var(--text-secondary)",
              }}
            >
              des appels transcrits, résumés et exportables automatiquement
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
