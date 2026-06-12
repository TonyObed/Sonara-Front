import React from "react";
import { Reveal } from "./Reveal";
import { INTEGRATIONS_TECHS, INTEGRATIONS_CLIENTS } from "@/lib/landing-data";

export function IntegrationsSection() {
  const renderMarqueeRow = (items: typeof INTEGRATIONS_TECHS, isReverse: boolean) => {
    // Duplicate items to ensure seamless infinite looping
    const duplicated = [...items, ...items, ...items, ...items];

    return (
      <div
        style={{
          overflow: "hidden",
          width: "100%",
          WebkitMaskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
          maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)",
        }}
      >
        <div
          className={isReverse ? "animate-son-marquee-rev" : "animate-son-marquee"}
          style={{
            display: "flex",
            width: "max-content",
          }}
        >
          {duplicated.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "999px",
                padding: "12px 24px 12px 16px",
                marginRight: "14px",
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
                whiteSpace: "nowrap",
                transition: "background 0.3s ease, border-color 0.3s ease, color 0.3s ease",
              }}
            >
              <img
                src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
                alt={item.label}
                loading="lazy"
                style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "6px",
                  objectFit: "contain",
                  flexShrink: 0,
                }}
              />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <section
      data-screen-label="Intégrations"
      style={{
        background: "var(--bg-primary)",
        color: "var(--text-primary)",
        padding: "clamp(50px, 6vw, 80px) 0 clamp(50px, 6vw, 80px)",
        transition: "background 0.3s ease, color 0.3s ease",
      }}
    >
      {/* Title & Description inside 1180px container */}
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "0 clamp(16px, 4vw, 32px)" }}>
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
            06 — INTÉGRATIONS
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
            Adossé aux meilleurs, branché à vos outils.
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
            Sonara s'appuie sur les meilleures technologies vocales du monde — et renvoie vos résultats dans les outils que vous utilisez déjà, de Wave à votre CRM.
          </p>
        </Reveal>
      </div>

      {/* Marquees full screen layout */}
      <Reveal
        style={{
          marginTop: "clamp(36px, 5vw, 54px)",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {renderMarqueeRow(INTEGRATIONS_TECHS, false)}
        {renderMarqueeRow(INTEGRATIONS_CLIENTS, true)}
      </Reveal>
    </section>
  );
}
