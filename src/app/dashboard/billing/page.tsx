"use client";

import React, { useEffect, useRef, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { api } from "@/lib/api-client";

const invoices: Array<{ ref: string; date: string; amountFcfa: number; status: "paid" | "pending" }> = [];

export default function BillingPage() {
  const {
    plan,
    plans,
    pushToast,
    kcr: credit,
    company,
  } = useDashboard();

  const plansRef = useRef<HTMLDivElement>(null);
  const [usageThisMonth, setUsageThisMonth] = useState<Array<{ campaign: string; calls: number; costFcfa: number; pct: number }>>([]);
  const [creditReferenceLimit, setCreditReferenceLimit] = useState(0);

  useEffect(() => {
    let mounted = true;
    api.company.usage().then(({ data }) => {
      if (!mounted) return;
      setUsageThisMonth(data.calls.usageThisMonth.map((item) => ({
        campaign: item.campaign,
        calls: item.calls,
        costFcfa: item.costFcfa,
        pct: item.percentage,
      })));
      setCreditReferenceLimit(data.credit.referenceLimit);
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const scrollToPlans = () => {
    plansRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const currentPlanObj = plans.find((p) => p.id === plan) || plans[1];
  const isSandbox = company.isSandbox;
  const planBadge = currentPlanObj.contactSales ? "SUR DEVIS" : `${currentPlanObj.price} FCFA / APPEL`;

  const handleChoosePlan = (_planId: string, name: string) => {
    pushToast(`Le passage au plan ${name} nécessite l'intégration du paiement. Aucun changement n'a été effectué.`, "info");
  };

  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");

  return (
    <div data-screen-label="Facturation et crédit" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Facturation &amp; crédit</h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
          PAIEMENT ET ABONNEMENT — CONFIGURATION À VENIR
        </div>
      </div>

      {/* Plan actuel + Crédit */}
      <div id="sn-bilrow" style={{ display: "grid", gridTemplateColumns: "1.35fr 1fr", gap: "14px", alignItems: "stretch" }}>
        
        {/* Plan Actuel Card */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>PLAN ACTUEL</div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 600, color: "var(--sn-green)", background: "rgba(43,213,118,.11)", padding: "5px 11px", borderRadius: "14px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--sn-green)" }}></span>Actif
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginTop: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-.02em" }}>{currentPlanObj.name}</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: "var(--sn-blue2)" }}>{planBadge}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "9px 18px", marginTop: "18px" }}>
            {currentPlanObj.features.map((feature, idx) => (
              <div key={idx} style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13.5px", color: "var(--sn-w75)" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--sn-green)", minWidth: "14px" }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6 9.5 17 4 11.5"></path>
                </svg>
                <span>{feature}</span>
              </div>
            ))}
          </div>
          <div style={{ flex: 1 }}></div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--sn-w06)", flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)" }}>RENOUVELLEMENT : NON CONFIGURÉ</span>
            <button onClick={scrollToPlans} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "transparent", color: "var(--sn-blue2)", border: "1px solid rgba(0,82,255,.4)", borderRadius: "10px", padding: "9px 15px", fontFamily: "'Satoshi', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer" }} className="sn-hover-border">
              Changer de plan ↓
            </button>
          </div>
        </div>

        {/* Crédit Card */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "24px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>CRÉDIT RESTANT</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "10px" }}>
            <span style={{ fontSize: "32px", fontWeight: 700, letterSpacing: "-.02em" }}>{isSandbox ? "Illimité" : fmt(credit)}</span>
            <span style={{ fontSize: "13px", color: "var(--sn-w45)" }}>{isSandbox ? "tests" : "appels"}</span>
          </div>
          <div style={{ height: "8px", background: "var(--sn-w08)", borderRadius: "5px", marginTop: "12px", overflow: "hidden" }}>
            <div style={{ width: isSandbox ? "100%" : creditReferenceLimit ? `${Math.min(100, Math.round((credit / creditReferenceLimit) * 100))}%` : "0%", height: "100%", background: "linear-gradient(90deg, #0052FF, #00D4A6)", borderRadius: "5px" }}></div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "8px" }}>
            <span>{creditReferenceLimit ? `SOLDE DE RÉFÉRENCE : ${fmt(creditReferenceLimit)}` : "AUCUN CRÉDIT ATTRIBUÉ"}</span>
            <span>{creditReferenceLimit ? `${Math.round((credit / creditReferenceLimit) * 100)}%` : "—"}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", padding: "12px 14px", background: "var(--sn-inset)", border: "1px solid var(--sn-w06)", borderRadius: "11px", fontSize: "13px" }}>
            <span style={{ color: "var(--sn-w55)" }}>Recharge automatique</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "9px" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--sn-w5)" }}>BIENTÔT</span>
              <span aria-disabled="true" style={{ width: "38px", height: "21px", borderRadius: "12px", background: "var(--sn-w14)", position: "relative", cursor: "not-allowed" }}>
                <span style={{ position: "absolute", top: "2px", left: "2px", width: "17px", height: "17px", borderRadius: "50%", background: "#fff" }}></span>
              </span>
            </span>
          </div>
          <div style={{ flex: 1 }}></div>
          <button onClick={() => {
            pushToast("La recharge sera disponible après l’intégration du paiement.", "info");
          }} style={{ marginTop: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "9px", background: "#0052FF", color: "#fff", border: "none", borderRadius: "11px", padding: "13px 18px", fontFamily: "'Satoshi', sans-serif", fontSize: "14px", fontWeight: 700, cursor: "pointer", width: "100%", boxShadow: "0 8px 24px rgba(0,82,255,.32)" }} className="sn-hover-btn-primary">
            Recharge bientôt disponible
          </button>
        </div>
      </div>

      {/* Consommation du mois */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Consommation ce mois</div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)" }}>
            DONNÉES RÉELLES DE CONSOMMATION UNIQUEMENT
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", marginTop: "18px" }}>
          {usageThisMonth.map((u, idx) => (
            <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
                <span style={{ fontSize: "13.5px", fontWeight: 500 }}>{u.campaign}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--sn-w55)" }}>
                  {fmt(u.calls)} appels · {fmt(u.costFcfa)} FCFA
                </span>
              </div>
              <div style={{ height: "6px", background: "var(--sn-w08)", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${u.pct}%`, height: "100%", background: idx === 0 ? "linear-gradient(90deg, #0052FF, #00D4A6)" : idx === 1 ? "#0052FF" : "var(--sn-w3)", borderRadius: "4px" }}></div>
              </div>
            </div>
          ))}
          {usageThisMonth.length === 0 && <div style={{ color: "var(--sn-w45)", fontSize: "13px" }}>Aucun appel facturable enregistré ce mois-ci.</div>}
        </div>
      </div>

      {/* Changer de plan section */}
      <div ref={plansRef}>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>Changer de plan</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(245px, 1fr))", gap: "14px", marginTop: "14px" }}>
          {plans.map((p) => {
            const isCurrent = p.id === plan;
            const borderStyle = isCurrent ? "rgba(0,82,255,.55)" : "var(--sn-w07)";
            const btnLabel = isCurrent ? "Plan actuel" : p.contactSales ? "Contacter les ventes" : `Passer à ${p.name}`;
            const btnBg = isCurrent ? "transparent" : p.contactSales ? "var(--sn-panel2)" : "#0052FF";
            const btnColor = isCurrent ? "var(--sn-w45)" : p.contactSales ? "var(--sn-text)" : "#fff";
            const btnBorder = isCurrent ? "1px solid var(--sn-w12)" : p.contactSales ? "1px solid var(--sn-w14)" : "none";
            const btnCursor = isCurrent ? "default" : "pointer";

            return (
              <div key={p.id} style={{ background: "var(--sn-panel)", border: `1.5px solid ${borderStyle}`, borderRadius: "16px", padding: "22px", display: "flex", flexDirection: "column", gap: "14px", position: "relative" }}>
                {isCurrent && (
                  <span style={{ position: "absolute", top: "-10px", left: "18px", fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".1em", fontWeight: 700, color: "#fff", background: "#0052FF", padding: "4px 10px", borderRadius: "10px" }}>
                    PLAN ACTUEL
                  </span>
                )}
                <div>
                  <div style={{ fontSize: "15.5px", fontWeight: 700 }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "8px" }}>
                    <span style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "-.02em" }}>{p.price}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w45)" }}>
                      {p.contactSales ? "VOLUME & SLA DÉDIÉS" : "FCFA / APPEL"}
                    </span>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--sn-w5)", marginTop: "7px", lineHeight: "1.5" }}>{p.desc}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {p.features.map((f, fIdx) => (
                    <div key={fIdx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--sn-w65)" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--sn-green)", minWidth: "12px" }} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9.5 17 4 11.5"></path>
                      </svg>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1 }}></div>
                <button
                  onClick={() => !isCurrent && handleChoosePlan(p.id, p.name)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: btnBg,
                    color: btnColor,
                    border: btnBorder,
                    borderRadius: "10px",
                    padding: "11px 16px",
                    fontFamily: "'Satoshi', sans-serif",
                    fontSize: "13.5px",
                    fontWeight: 700,
                    cursor: btnCursor,
                    width: "100%",
                  }}
                  className={!isCurrent ? (p.contactSales ? "sn-hover-border" : "sn-hover-btn-primary") : ""}
                >
                  {btnLabel}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historique */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "24px" }}>
        <div style={{ fontSize: "16px", fontWeight: 700 }}>Historique de facturation</div>
        <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
          {invoices.map((inv, idx) => (
            <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", padding: "13px 0", borderBottom: idx < invoices.length - 1 ? "1px solid var(--sn-w05)" : "none", fontSize: "13px", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--sn-w5)" }}>
                {inv.ref} · {inv.date}
              </span>
              <span style={{ display: "inline-flex", gap: "12px", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmt(inv.amountFcfa)} FCFA</span>
                <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--sn-green)", background: "rgba(43,213,118,.11)", padding: "3px 9px", borderRadius: "11px" }}>
                  {inv.status === "paid" ? "Payée" : "En attente"}
                </span>
                <span onClick={() => pushToast(`Téléchargement de la facture ${inv.ref}...`, "info")} style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontSize: "12px", fontWeight: 600, color: "var(--sn-blue2)", cursor: "pointer" }} className="sn-hover-support-faq">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4v11M7 10l5 5 5-5"></path>
                    <path d="M4 19h16"></path>
                  </svg>
                  PDF
                </span>
              </span>
            </div>
          ))}
          {invoices.length === 0 && <div style={{ padding: "14px 0", color: "var(--sn-w45)", fontSize: "13px" }}>Aucune facture : le paiement n’est pas encore activé.</div>}
        </div>
      </div>
    </div>
  );
}
