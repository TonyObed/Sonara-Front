"use client";

import React from "react";
import { useDashboard } from "../DashboardContext";

export default function SupportPage() {
  const { faq, faqOpen, setFaqOpen, pushToast } = useDashboard();

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const handleTicketOpen = () => {
    pushToast("Ouverture d'un nouveau ticket support...", "info");
  };

  return (
    <div data-screen-label="Aide et support" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      {/* Header */}
      <div>
        <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Centre d&apos;aide</h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
          SUPPORT 7J/7 — 08:00–20:00 GMT · RÉPONSE &lt; 2 H EN JOURNÉE
        </div>
      </div>

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
                TOUS OPÉRATIONNELS
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13px", justifyContent: "space-between" }}>
                <span style={{ color: "var(--sn-w55)" }}>Téléphonie — Africa&apos;s Talking</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", color: "var(--sn-green)", fontWeight: 600, fontSize: "12px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--sn-green)" }}></span>Opérationnel
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "11px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13px", justifyContent: "space-between" }}>
                <span style={{ color: "var(--sn-w55)" }}>IA vocale — STT / LLM / TTS</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", color: "var(--sn-green)", fontWeight: 600, fontSize: "12px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--sn-green)" }}></span>Opérationnel
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", padding: "11px 0", fontSize: "13px", justifyContent: "space-between" }}>
                <span style={{ color: "var(--sn-w55)" }}>Dashboard &amp; API</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", color: "var(--sn-green)", fontWeight: 600, fontSize: "12px" }}>
                  <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "var(--sn-green)" }}></span>Opérationnel
                </span>
              </div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "12px" }}>
              DERNIER INCIDENT : 14 MAI — LATENCE TTS · RÉSOLU EN 22 MIN
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
