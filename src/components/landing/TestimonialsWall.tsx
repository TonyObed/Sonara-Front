import React from "react";
import { Reveal } from "./Reveal";

interface Testimonial {
  text: string;
  name: string;
  role: string;
  img: string;
}

const TESTIMONIALS_DATA: Testimonial[] = [
  {
    text: "On a interrogé 4\u202f000 clients en un week-end. Avant Sonara, la même enquête nous prenait trois semaines et deux prestataires.",
    name: "Aïcha Koné",
    role: "Directrice Expérience Client · Microfinance",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    text: "Les clients répondent normalement, comme à un vrai agent. Ce qui change tout, c'est le rapport qui tombe deux minutes après l'appel.",
    name: "Yves Tanoh",
    role: "Responsable Marketing · Assurance",
    img: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    text: "40 francs l'appel, résultats dans Google Sheets le matin même. On a arrêté de débattre, on a signé.",
    name: "Mariam Doumbia",
    role: "Fondatrice · E-commerce",
    img: "https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    text: "L'intégration avec notre CRM a pris une journée. Les transcriptions arrivent directement dans les fiches clients.",
    name: "Jean-Marc Kouassi",
    role: "DSI · Banque régionale",
    img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    text: "10\u202f000 répondants en 48 heures, avec verbatims transcrits. Nos enquêtes terrain ne seront plus jamais les mêmes.",
    name: "Fatou Bamba",
    role: "Cheffe de projet · Institut d'études",
    img: "https://images.unsplash.com/photo-1593104547489-5cfb3839a3b5?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    text: "La détection de churn nous a permis de rappeler les bons clients au bon moment. Le taux de rétention a suivi.",
    name: "Serge N'Guessan",
    role: "Directeur Commercial · Télécom",
    img: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    text: "La voix est tellement naturelle que les clients restent en ligne. Notre taux de réponse complète a doublé.",
    name: "Aminata Traoré",
    role: "Responsable SAV · Retail",
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    text: "On a remplacé un prestataire à 2 millions par mois. Même volume d'appels, rapports plus précis, budget divisé par dix.",
    name: "Olivier Brou",
    role: "Directeur Général · PME Services",
    img: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=150&h=150",
  },
  {
    text: "Pour mesurer l'impact de nos programmes, on appelle désormais chaque bénéficiaire. Avant, on échantillonnait à 5%.",
    name: "Clarisse Yapi",
    role: "Analyste M&E · ONG internationale",
    img: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=150&h=150",
  },
];

export function TestimonialsWall() {
  const col1 = TESTIMONIALS_DATA.slice(0, 3);
  const col2 = TESTIMONIALS_DATA.slice(3, 6);
  const col3 = TESTIMONIALS_DATA.slice(6, 9);

  const renderCard = (t: Testimonial, key: number | string) => (
    <figure
      key={key}
      className="son-tcard"
      style={{
        margin: 0,
        background: "var(--bg-glass, rgba(255,255,255,0.05))",
        border: "1px solid var(--border, rgba(255,255,255,0.12))",
        borderRadius: "24px",
        padding: "28px",
        display: "flex",
        flexDirection: "column",
        gap: "22px",
        cursor: "default",
      }}
    >
      <blockquote
        style={{
          margin: 0,
          fontSize: "15px",
          lineHeight: 1.6,
          color: "var(--text-primary, rgba(255,255,255,0.85))",
          fontStyle: "normal",
        }}
      >
        «&nbsp;{t.text}&nbsp;»
      </blockquote>
      <figcaption style={{ display: "flex", alignItems: "center", gap: "13px" }}>
        <img
          src={t.img}
          alt={t.name}
          loading="lazy"
          style={{
            width: "42px",
            height: "42px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid var(--brand-accent, rgba(0,82,255,0.6))",
            flexShrink: 0,
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--text-primary, #ffffff)",
            }}
          >
            {t.name}
          </div>
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10.5px",
              color: "var(--text-secondary, rgba(255,255,255,0.5))",
            }}
          >
            {t.role}
          </div>
        </div>
      </figcaption>
    </figure>
  );

  const renderColumn = (items: Testimonial[], duration: number, extraClass: string) => (
    <div
      className={`son-tcol ${extraClass}`}
      style={{
        flex: 1,
        minWidth: 0,
        maxWidth: "380px",
        overflow: "hidden",
      }}
    >
      <div
        className="son-ttrack"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "18px",
          paddingBottom: "18px",
          animation: `son-vscroll ${duration}s linear infinite`,
        }}
      >
        {items.concat(items).map((t, i) => renderCard(t, i))}
      </div>
    </div>
  );

  return (
    <section
      id="testimonials-wall"
      data-screen-label="Témoignages"
      style={{
        background: "var(--bg-primary, #121212)",
        color: "var(--text-primary, #FFFFFF)",
        padding: "clamp(50px, 6vh, 90px) clamp(20px, 5vw, 48px)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: "1180px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "clamp(36px, 4.5vw, 56px)",
        }}
      >
        <Reveal
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "18px",
            maxWidth: "620px",
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "12px",
              letterSpacing: "2.5px",
              color: "var(--brand-accent, #0052FF)",
              fontWeight: 700,
              border: "1px solid var(--border-accent, rgba(0,82,255,0.45))",
              borderRadius: "999px",
              padding: "8px 18px",
              background: "var(--brand-accent-t, rgba(0,82,255,0.12))",
            }}
          >
            07 — TÉMOIGNAGES
          </div>
          <h2
            style={{
              margin: 0,
              fontSize: "clamp(34px, 4.6vw, 60px)",
              fontWeight: 900,
              lineHeight: 1.04,
              letterSpacing: "-0.02em",
              color: "var(--text-primary, #ffffff)",
            }}
          >
            Ce qu'en disent les équipes.
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "clamp(16px, 1.6vw, 19px)",
              lineHeight: 1.6,
              color: "var(--text-secondary, rgba(255,255,255,0.65))",
            }}
          >
            Banques, télécoms, instituts d'études — voici ce qui change quand l'IA prend les appels.
          </p>
        </Reveal>

        <Reveal>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "18px",
              maxHeight: "660px",
              overflow: "hidden",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)",
              maskImage: "linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)",
            }}
          >
            {renderColumn(col1, 26, "")}
            {renderColumn(col2, 34, "son-tcol-2")}
            {renderColumn(col3, 30, "son-tcol-3")}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
