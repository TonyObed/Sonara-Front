import React, { useState } from "react";
import { Reveal } from "./Reveal";

export function HowItWorksSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const steps = [
    {
      num: "01",
      title: "Décrivez votre enquête",
      desc: "Un brief en langage naturel suffit : « Tu es Awa, enquêtrice de la Banque… ». L'IA en fait sa feuille de route.",
      isInverted: false,
    },
    {
      num: "02",
      title: "Importez vos contacts",
      desc: "Un fichier CSV, jusqu'à 10 000 contacts. Numéros normalisés au format +225 et dédupliqués automatiquement.",
      isInverted: false,
    },
    {
      num: "03",
      title: "L'IA mène les appels",
      desc: "Awa appelle, écoute, relance et rebondit — en français ivoirien. Les incohérences sont détectées en direct.",
      isInverted: true,
    },
    {
      num: "04",
      title: "Exploitez les résultats",
      desc: "Transcription, résumé en 3 lignes et analyse, moins de 2 minutes après chaque appel. Export Excel en un clic.",
      isInverted: false,
    },
  ];

  return (
    <section
      data-screen-label="Fonctionnement"
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
            02 — FONCTIONNEMENT
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
            De votre brief aux résultats, en 4 étapes.
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
            Aucun script rigide, aucun code. Vous décrivez l'objectif, Sonara s'occupe du reste.
          </p>
        </Reveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
            gap: "18px",
            marginTop: "clamp(36px, 5vw, 60px)",
          }}
        >
          {steps.map((step, idx) => {
            const isHovered = hoveredIndex === idx;
            const cardBg = step.isInverted ? "var(--brand-accent)" : "var(--bg-secondary)";
            const textColor = step.isInverted ? "#FFFFFF" : "var(--text-primary)";
            const labelColor = step.isInverted ? "rgba(255,255,255,0.9)" : "var(--brand-accent)";
            const descColor = step.isInverted ? "rgba(255,255,255,0.85)" : "var(--text-secondary)";

            return (
              <Reveal
                key={idx}
                delay={idx * 0.08}
                style={{ height: "100%" }}
              >
                <div
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    background: cardBg,
                    color: textColor,
                    border: step.isInverted ? "1px solid var(--brand-accent)" : "1px solid var(--border)",
                    borderRadius: "22px",
                    padding: "26px 24px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: "44px",
                    height: "100%",
                    transition: "transform 0.3s ease, box-shadow 0.3s ease, background 0.3s ease, border-color 0.3s ease",
                    transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                    boxShadow: isHovered
                      ? "var(--shadow-md)"
                      : "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: labelColor,
                    }}
                  >
                    ÉTAPE {step.num}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        lineHeight: 1.6,
                        color: descColor,
                      }}
                    >
                      {step.desc}
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
