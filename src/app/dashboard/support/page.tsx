"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useDashboard } from "../DashboardContext";

type TutorialKey = "test-call" | "campaign";

const TUTORIALS: Record<TutorialKey, {
  title: string;
  duration: string;
  description: string;
  steps: Array<{ title: string; text: string; image: string }>;
}> = {
  "test-call": {
    title: "Recevoir un appel test",
    duration: "2 min",
    description: "Vérifiez la voix, le brief et la qualité de la conversation avant de contacter vos clients.",
    steps: [
      { title: "Ouvrez une nouvelle campagne", text: "Dans le menu, cliquez sur Campagnes, puis sur Nouvelle campagne. Le test se prépare depuis ce même formulaire.", image: "/support/tutorials/test-01-ouvrir-campagnes.png" },
      { title: "Préparez l’assistante", text: "Saisissez un nom, choisissez le secteur et décrivez clairement l’objectif dans le Brief IA. Sélectionnez ensuite Ingrid ou Loïc.", image: "/support/tutorials/test-02-preparer-assistante.png" },
      { title: "Saisissez votre numéro", text: "Dans Tester avant de lancer, entrez le numéro qui doit recevoir l’appel. Utilisez de préférence le format complet +225XXXXXXXXXX.", image: "/support/tutorials/test-03-saisir-numero.png" },
      { title: "Lancez et vérifiez", text: "Cliquez sur Recevoir un appel test. Répondez naturellement, puis consultez l’historique des tests pour vérifier le statut, la durée, le résumé et la transcription.", image: "/support/tutorials/test-04-lancer-test.png" },
    ],
  },
  campaign: {
    title: "Créer et lancer une campagne",
    duration: "5 min",
    description: "Configurez l’enquête, importez les contacts et lancez les appels en quelques étapes.",
    steps: [
      { title: "Nommez la campagne", text: "Indiquez un nom reconnaissable et sélectionnez le secteur correspondant à votre activité.", image: "/support/tutorials/campagne-01-nommer.png" },
      { title: "Rédigez le Brief IA", text: "Expliquez l’objectif, les questions à poser, le ton attendu et la manière de terminer l’appel. L’assistante doit poser les questions une par une.", image: "/support/tutorials/campagne-02-brief.png" },
      { title: "Importez le fichier CSV", text: "Déposez un CSV contenant au minimum les colonnes prénom, nom et téléphone. Sonara normalise automatiquement les numéros ivoiriens au format +225.", image: "/support/tutorials/campagne-03-importer-csv.png" },
      { title: "Réglez les appels", text: "Choisissez la plage horaire, le nombre de tentatives, le délai de relance, la durée maximale et la voix de l’assistante.", image: "/support/tutorials/campagne-04-regles-appel.png" },
      { title: "Testez puis lancez", text: "Effectuez d’abord un appel test. Si la conversation est correcte, cliquez sur Lancer la campagne. Vous pouvez aussi enregistrer le travail comme brouillon.", image: "/support/tutorials/campagne-05-lancer.png" },
    ],
  },
};

export default function SupportPage() {
  const { faq, faqOpen, setFaqOpen, pushToast } = useDashboard();
  const [services, setServices] = useState<Array<{ serviceKey: string; label: string; status: string }>>([]);
  const [latestIncident, setLatestIncident] = useState<{ title: string; status: string; startedAt: string; resolvedAt: string | null } | null>(null);
  const [tutorialOpen, setTutorialOpen] = useState<TutorialKey | null>(null);
  const [tutorialStep, setTutorialStep] = useState(0);
  useEffect(() => { fetch("/api/support", { credentials: "include" }).then((r) => r.json()).then((payload) => { if (payload.success) { setServices(payload.data.services); setLatestIncident(payload.data.latestIncident); } }).catch(() => {}); }, []);
  const service = (key: string) => services.find((item) => item.serviceKey === key);
  const serviceLabel = (key: string) => service(key)?.status === "OPERATIONAL" ? "Opérationnel" : service(key)?.status ?? "Non renseigné";

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handleTicketOpen = async () => {
    const subject = window.prompt("Sujet du ticket");
    const message = subject ? window.prompt("Décrivez votre demande") : null;
    if (!subject || !message) return;
    const response = await fetch("/api/support", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message }) });
    pushToast(response.ok ? "Ticket support créé." : "Impossible de créer le ticket.", response.ok ? "ok" : "warn");
  };

  const openTutorial = (tutorial: TutorialKey) => {
    setTutorialStep(0);
    setTutorialOpen(tutorial);
  };

  const activeTutorial = tutorialOpen ? TUTORIALS[tutorialOpen] : null;

  return (
    <div data-screen-label="Aide et support" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Centre d&apos;aide</h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
          SUPPORT 7J/7 — 08:00–20:00 GMT · RÉPONSE &lt; 2 H EN JOURNÉE
        </div>
      </div>

      {/* Guided tutorials */}
      <section style={{ background: "linear-gradient(135deg, rgba(0,82,255,.12), rgba(0,212,166,.055))", border: "1px solid rgba(0,82,255,.22)", borderRadius: "18px", padding: "22px" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".13em", color: "var(--sn-blue3)" }}>GUIDES PAS À PAS</div>
            <div style={{ fontSize: "19px", fontWeight: 700, marginTop: "6px" }}>Bien démarrer avec Sonara</div>
            <div style={{ fontSize: "13px", color: "var(--sn-w55)", marginTop: "5px" }}>Suivez les écrans réels du dashboard, étape par étape.</div>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)" }}>2 TUTORIELS VISUELS</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "12px", marginTop: "18px" }}>
          {(Object.entries(TUTORIALS) as Array<[TutorialKey, typeof TUTORIALS[TutorialKey]]>).map(([key, tutorial], index) => (
            <button key={key} onClick={() => openTutorial(key)} className="sn-hover-support-card" style={{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left", background: "var(--sn-panel)", border: "1px solid var(--sn-w09)", borderRadius: "14px", padding: "16px", color: "var(--sn-text)", cursor: "pointer" }}>
              <span style={{ width: "42px", height: "42px", minWidth: "42px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: index === 0 ? "rgba(0,82,255,.15)" : "rgba(0,212,166,.12)", color: index === 0 ? "var(--sn-blue3)" : "#00D4A6", fontWeight: 800 }}>{index + 1}</span>
              <span style={{ flex: 1 }}>
                <span style={{ display: "block", fontSize: "14.5px", fontWeight: 700 }}>{tutorial.title}</span>
                <span style={{ display: "block", fontSize: "12px", color: "var(--sn-w5)", marginTop: "4px", lineHeight: 1.45 }}>{tutorial.description}</span>
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)" }}>{tutorial.duration} →</span>
            </button>
          ))}
        </div>
      </section>

      {/* Search Input */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "var(--sn-panel)", border: "1px solid var(--sn-w08)", borderRadius: "14px", padding: "0 18px", height: "52px", maxWidth: "640px" }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--sn-w4)", flexShrink: 0 }} strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5"></circle>
          <path d="M20 20l-4-4"></path>
        </svg>
        <input
          type="text"
          placeholder="Comment pouvons-nous vous aider ?"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: "var(--sn-text)",
            fontFamily: "'Satoshi', sans-serif",
            fontSize: "14.5px",
          }}
        />
      </div>

      {/* Category Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(225px, 1fr))", gap: "14px" }}>
        {/* Card 1 */}
        <div className="sn-hover-support-card" style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "border-color 0.15s ease" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(0,82,255,.13)", color: "var(--sn-blue2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M3 11l14-5v12L3 13v-2z"></path>
              <path d="M7 13.5V18a2 2 0 0 0 4 0v-3"></path>
              <path d="M20 9.5a3 3 0 0 1 0 5"></path>
            </svg>
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "13px" }}>Lancer une campagne</div>
          <div style={{ fontSize: "12.5px", color: "var(--sn-w5)", marginTop: "5px", lineHeight: "1.5" }}>Brief IA, planification, règles d&apos;appel et bonnes pratiques.</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "11px" }}>12 ARTICLES</div>
        </div>

        {/* Card 2 */}
        <div className="sn-hover-support-card" style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "border-color 0.15s ease" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(0,212,166,.12)", color: "#00D4A6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <circle cx="9" cy="8" r="3.2"></circle>
              <path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5S13.8 16 14.5 19"></path>
              <path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.2"></path>
              <path d="M17.5 14.8c1.7.7 2.7 2.1 3 4.2"></path>
            </svg>
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "13px" }}>Contacts &amp; imports</div>
          <div style={{ fontSize: "12.5px", color: "var(--sn-w5)", marginTop: "5px", lineHeight: "1.5" }}>Format CSV, normalisation +225, segments et liste noire.</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "11px" }}>8 ARTICLES</div>
        </div>

        {/* Card 3 */}
        <div className="sn-hover-support-card" style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "border-color 0.15s ease" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(255,176,46,.12)", color: "var(--sn-amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <rect x="3" y="6" width="18" height="13" rx="2"></rect>
              <path d="M3 10h18"></path>
            </svg>
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "13px" }}>Facturation &amp; crédit</div>
          <div style={{ fontSize: "12.5px", color: "var(--sn-w5)", marginTop: "5px", lineHeight: "1.5" }}>Plans, recharge Wave CI, factures et coût par appel.</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "11px" }}>6 ARTICLES</div>
        </div>

        {/* Card 4 */}
        <div className="sn-hover-support-card" style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "20px", cursor: "pointer", transition: "border-color 0.15s ease" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "11px", background: "rgba(0,82,255,.13)", color: "var(--sn-blue2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
              <path d="M8 9l-4 3 4 3M16 9l4 3-4 3M13 5l-2 14"></path>
            </svg>
          </div>
          <div style={{ fontSize: "15px", fontWeight: 700, marginTop: "13px" }}>API &amp; intégrations</div>
          <div style={{ fontSize: "12.5px", color: "var(--sn-w5)", marginTop: "5px", lineHeight: "1.5" }}>Clés API, webhooks HMAC, CRM et exports automatiques.</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "11px" }}>9 ARTICLES</div>
        </div>
      </div>

      <div id="sn-suprow" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "14px", alignItems: "start" }}>
        {/* FAQs list */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Questions fréquentes</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
            {faq.map((f, i) => {
              const isOpen = faqOpen === i;
              return (
                <div key={i} style={{ borderBottom: "1px solid var(--sn-w05)" }}>
                  <div
                    onClick={() => toggleFaq(i)}
                    className="sn-hover-support-faq"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "15px 4px",
                      cursor: "pointer",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <span style={{ flex: 1, fontSize: "14px", fontWeight: 600 }}>{f.q}</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform .2s",
                        opacity: 0.55,
                        flexShrink: 0,
                      }}
                    >
                      <path d="M6 9l6 6 6-6"></path>
                    </svg>
                  </div>
                  {isOpen && (
                    <div style={{ display: "block", padding: "0 4px 16px 4px", fontSize: "13.5px", lineHeight: "1.65", color: "var(--sn-w6)" }}>
                      {f.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar help items */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* Contact details */}
          <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Contacter le support</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginTop: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", fontSize: "13.5px" }}>
                <span style={{ width: "32px", height: "32px", minWidth: "32px", borderRadius: "9px", background: "rgba(0,82,255,.13)", color: "var(--sn-blue2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <rect x="3" y="5" width="18" height="14" rx="2"></rect>
                    <path d="M3 7l9 6 9-6"></path>
                  </svg>
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px" }}>support@sonara.ci</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "11px", fontSize: "13.5px" }}>
                <span style={{ width: "32px", height: "32px", minWidth: "32px", borderRadius: "9px", background: "rgba(43,213,118,.11)", color: "var(--sn-green)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                    <path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.7 1.5C10 19.6 4.4 14 3.5 5.7A1.5 1.5 0 0 1 5 4z"></path>
                  </svg>
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px" }}>+225 07 00 00 11 22 · WhatsApp</span>
              </div>
            </div>
            <button
              onClick={handleTicketOpen}
              className="sn-hover-btn-primary"
              style={{
                marginTop: "16px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "#0052FF",
                color: "#fff",
                border: "none",
                borderRadius: "11px",
                padding: "12px 16px",
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "13.5px",
                fontWeight: 700,
                cursor: "pointer",
                width: "100%",
              }}
            >
              Ouvrir un ticket
            </button>
          </div>

          {/* System status */}
          <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>État des services</div>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-green)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--sn-green)", animation: "snPulse 1.8s infinite" }}></span>
                {services.length ? "ÉTAT SYNCHRONISÉ" : "ÉTAT NON RENSEIGNÉ"}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13px", justifyContent: "space-between" }}>
                <span style={{ color: "var(--sn-w55)" }}>Téléphonie — Africa&apos;s Talking</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", color: "var(--sn-green)", fontWeight: 600, fontSize: "12px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--sn-green)" }}></span>{serviceLabel("telephony")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13px", justifyContent: "space-between" }}>
                <span style={{ color: "var(--sn-w55)" }}>IA vocale — STT / LLM / TTS</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", color: "var(--sn-green)", fontWeight: 600, fontSize: "12px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--sn-green)" }}></span>{serviceLabel("voice-ai")}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "11px 0", fontSize: "13px", justifyContent: "space-between" }}>
                <span style={{ color: "var(--sn-w55)" }}>Dashboard &amp; API</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", color: "var(--sn-green)", fontWeight: 600, fontSize: "12px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--sn-green)" }}></span>{serviceLabel("dashboard-api")}
                </span>
              </div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "12px" }}>
              {latestIncident ? `DERNIER INCIDENT : ${latestIncident.title}` : "AUCUN INCIDENT ENREGISTRÉ"}
            </div>
          </div>
        </div>
      </div>

      {activeTutorial && tutorialOpen && (
        <div className="sn-tutorial-overlay" onClick={() => setTutorialOpen(null)} role="presentation" style={{ position: "fixed", inset: 0, zIndex: 120, background: "rgba(2,5,10,.82)", backdropFilter: "blur(8px)", padding: "24px", overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div role="dialog" aria-modal="true" aria-label={activeTutorial.title} onClick={(event) => event.stopPropagation()} style={{ width: "min(1120px, 100%)", maxHeight: "min(820px, calc(100vh - 48px))", overflowY: "auto", background: "var(--sn-panel)", border: "1px solid var(--sn-w12)", borderRadius: "20px", boxShadow: "0 32px 100px rgba(0,0,0,.55)" }}>
            <div style={{ position: "sticky", top: 0, zIndex: 2, background: "var(--sn-panel)", borderBottom: "1px solid var(--sn-w07)", padding: "18px 22px", display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "18px", fontWeight: 750 }}>{activeTutorial.title}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "4px" }}>ÉTAPE {tutorialStep + 1} SUR {activeTutorial.steps.length} · {activeTutorial.duration}</div>
              </div>
              <button onClick={() => setTutorialOpen(null)} aria-label="Fermer le tutoriel" style={{ width: "36px", height: "36px", borderRadius: "10px", border: "1px solid var(--sn-w1)", background: "var(--sn-inset)", color: "var(--sn-text)", cursor: "pointer", fontSize: "19px" }}>×</button>
            </div>

            <div className="sn-tutorial-grid" style={{ padding: "22px", display: "grid", gridTemplateColumns: "minmax(230px, .72fr) minmax(420px, 1.8fr)", gap: "20px" }}>
              <div className="sn-tutorial-step-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {activeTutorial.steps.map((step, index) => (
                  <button key={step.title} onClick={() => setTutorialStep(index)} style={{ textAlign: "left", border: tutorialStep === index ? "1px solid rgba(0,82,255,.45)" : "1px solid var(--sn-w07)", background: tutorialStep === index ? "rgba(0,82,255,.12)" : "var(--sn-inset)", color: "var(--sn-text)", borderRadius: "12px", padding: "12px", cursor: "pointer", display: "flex", gap: "10px" }}>
                    <span style={{ width: "24px", height: "24px", minWidth: "24px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: tutorialStep === index ? "#0052FF" : "var(--sn-w09)", color: tutorialStep === index ? "#fff" : "var(--sn-w6)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", fontWeight: 700 }}>{index + 1}</span>
                    <span style={{ fontSize: "13px", fontWeight: 650, lineHeight: 1.4 }}>{step.title}</span>
                  </button>
                ))}
              </div>

              <div>
                <div style={{ position: "relative", overflow: "hidden", border: "1px solid var(--sn-w09)", borderRadius: "14px", background: "#080a0e" }}>
                  <Image src={activeTutorial.steps[tutorialStep].image} alt={`Capture Sonara — ${activeTutorial.steps[tutorialStep].title}`} width={1280} height={720} priority style={{ display: "block", width: "100%", height: "auto" }} />
                </div>
                <h2 style={{ margin: "17px 0 7px", fontSize: "19px" }}>{activeTutorial.steps[tutorialStep].title}</h2>
                <p style={{ margin: 0, color: "var(--sn-w6)", fontSize: "13.5px", lineHeight: 1.65 }}>{activeTutorial.steps[tutorialStep].text}</p>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "18px" }}>
                  <button disabled={tutorialStep === 0} onClick={() => setTutorialStep((step) => Math.max(0, step - 1))} style={{ border: "1px solid var(--sn-w1)", background: "var(--sn-inset)", color: "var(--sn-text)", borderRadius: "10px", padding: "10px 15px", cursor: tutorialStep === 0 ? "default" : "pointer", opacity: tutorialStep === 0 ? .4 : 1 }}>← Précédent</button>
                  {tutorialStep < activeTutorial.steps.length - 1 ? (
                    <button onClick={() => setTutorialStep((step) => Math.min(activeTutorial.steps.length - 1, step + 1))} style={{ border: 0, background: "#0052FF", color: "#fff", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: 700 }}>Étape suivante →</button>
                  ) : (
                    <button onClick={() => setTutorialOpen(null)} style={{ border: 0, background: "#00B98E", color: "#04110d", borderRadius: "10px", padding: "10px 16px", cursor: "pointer", fontWeight: 800 }}>Tutoriel terminé ✓</button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
