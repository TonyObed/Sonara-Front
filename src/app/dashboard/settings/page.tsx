"use client";

import React from "react";
import { useDashboard } from "../DashboardContext";

export default function SettingsPage() {
  const {
    company,
    setCompany,
    companyEdit,
    setCompanyEdit,
    companyDraft,
    setCompanyDraft,
    profile,
    team,
    plan,
    plans,
    persistAccount,
    pushToast,
  } = useDashboard();

  const curPlan = plans.find((p) => p.id === plan) || plans[1];
  const planBadge = curPlan.contactSales ? "SUR DEVIS" : `${curPlan.price} FCFA / APPEL`;

  const startCompanyEdit = () => {
    setCompanyDraft({ ...company });
    setCompanyEdit(true);
  };

  const cancelCompanyEdit = () => {
    setCompanyEdit(false);
    setCompanyDraft(null);
  };

  const saveCompany = () => {
    if (companyDraft) {
      setCompany(companyDraft);
      persistAccount(companyDraft, profile);
      pushToast("Informations entreprise enregistrées", "ok");
    }
    setCompanyEdit(false);
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("sk_live_234897f238947f2a");
    pushToast("Clé API copiée !", "ok");
  };

  // Helper to format initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  };

  // Role styles from the original layout
  const getRoleStyles = (role: string) => {
    if (role === "Admin") {
      return {
        color: "var(--sn-blue2)",
        bg: "rgba(0,82,255,.14)",
      };
    } else if (role === "Manager") {
      return {
        color: "var(--sn-green)",
        bg: "rgba(43,213,118,.11)",
      };
    } else {
      return {
        color: "var(--sn-w6)",
        bg: "var(--sn-w08)",
      };
    }
  };

  return (
    <div data-screen-label="Paramètres" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      <div>
        <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Paramètres</h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
          COMPTE ENTREPRISE — {company.name.toUpperCase()}
        </div>
      </div>

      <div id="sn-setrow" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", alignItems: "stretch" }}>
        
        {/* Entreprise Card */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Entreprise</div>
            {!companyEdit && (
              <span onClick={startCompanyEdit} style={{ fontSize: "13px", fontWeight: 500, color: "var(--sn-blue2)", cursor: "pointer" }} className="sn-hover-support-faq">
                Modifier
              </span>
            )}
          </div>

          {!companyEdit ? (
            <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                  <span style={{ color: "var(--sn-w55)" }}>Société</span>
                  <span style={{ fontWeight: 600 }}>{company.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                  <span style={{ color: "var(--sn-w55)" }}>Plan</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "7px" }}>
                    <span style={{ fontWeight: 600 }}>{curPlan.name}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-blue2)", background: "rgba(0,82,255,.13)", padding: "3px 8px", borderRadius: "10px" }}>
                      {planBadge}
                    </span>
                  </span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                  <span style={{ color: "var(--sn-w55)" }}>Numéro affiché</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{company.phone}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", fontSize: "13.5px" }}>
                  <span style={{ color: "var(--sn-w55)" }}>Fuseau horaire</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{company.tz}</span>
                </div>
              </div>
            </div>
          ) : (
            companyDraft && (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1, justifyContent: "space-between", marginTop: "14px", animation: "snFadeUp .2s ease both" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w45)", marginBottom: "7px" }}>NOM DE LA SOCIÉTÉ</div>
                    <input
                      type="text"
                      value={companyDraft.name}
                      onChange={(e) => setCompanyDraft({ ...companyDraft, name: e.target.value })}
                      style={{ width: "100%", background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "10px", padding: "11px 13px", color: "var(--sn-text)", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", outline: "none" }}
                      className="sn-focus-border"
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w45)", marginBottom: "7px" }}>NUMÉRO AFFICHÉ</div>
                    <input
                      type="text"
                      value={companyDraft.phone}
                      onChange={(e) => setCompanyDraft({ ...companyDraft, phone: e.target.value })}
                      style={{ width: "100%", background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "10px", padding: "11px 13px", color: "var(--sn-text)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", outline: "none" }}
                      className="sn-focus-border"
                    />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w45)", marginBottom: "7px" }}>FUSEAU HORAIRE</div>
                    <input
                      type="text"
                      value={companyDraft.tz}
                      onChange={(e) => setCompanyDraft({ ...companyDraft, tz: e.target.value })}
                      style={{ width: "100%", background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "10px", padding: "11px 13px", color: "var(--sn-text)", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", outline: "none" }}
                      className="sn-focus-border"
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px" }}>
                  <button onClick={saveCompany} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#0052FF", color: "#fff", border: "none", borderRadius: "10px", padding: "11px 18px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }} className="sn-hover-btn-primary">
                    Enregistrer
                  </button>
                  <button onClick={cancelCompanyEdit} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "var(--sn-w7)", border: "1px solid var(--sn-w14)", borderRadius: "10px", padding: "11px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 600, cursor: "pointer" }} className="sn-hover-border">
                    Annuler
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* API & Security Card */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>API &amp; sécurité</div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Clé API</span>
                <span style={{ display: "inline-flex", gap: "9px", alignItems: "center" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>sk_live_••••••••7f2a</span>
                  <span onClick={handleCopyApiKey} className="sn-hover-support-faq" style={{ fontSize: "12px", fontWeight: 600, color: "var(--sn-blue2)", cursor: "pointer" }}>
                    Copier
                  </span>
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Webhook sortant</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w7)" }}>
                  https://crm.banquehorizon.ci/hooks
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Signature webhooks</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px" }}>HMAC-SHA256</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Chiffrement</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px" }}>AES-256 · TLS 1.2+</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Double authentification</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w5)", border: "1px solid var(--sn-w18)", padding: "3px 8px", borderRadius: "6px" }}>
                  P3
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Conformité</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px" }}>ARTCI · LOI 2013-450</span>
              </div>
            </div>
          </div>
        </div>

        {/* Équipe Card */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Équipe</div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)" }}>3 / 5 SIÈGES</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {team.map((u, index) => {
                // Highlight active profile settings locally
                const isSelf = index === 0;
                const displayName = isSelf ? profile.name : u.name;
                const displayEmail = isSelf ? profile.email : u.email;
                const initials = getInitials(displayName);
                const avatarBg = isSelf && profile.photo
                  ? `url(${profile.photo}) center / cover no-repeat`
                  : "rgba(0,82,255,.15)";
                const avatarColor = isSelf && profile.photo ? "transparent" : "var(--sn-blue3)";
                const roleStyles = getRoleStyles(u.role);

                return (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "11px 0",
                      borderBottom: "1px solid var(--sn-w05)",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        minWidth: "34px",
                        borderRadius: "50%",
                        background: avatarBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: avatarColor,
                      }}
                    >
                      {(!isSelf || !profile.photo) && initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {displayEmail}
                      </div>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: roleStyles.color, background: roleStyles.bg, padding: "4px 10px", borderRadius: "12px" }}>
                      {u.role}
                    </span>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => pushToast("Lien d'invitation généré !", "ok")}
              className="sn-hover-ticket"
              style={{
                marginTop: "14px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "transparent",
                color: "var(--sn-blue2)",
                border: "1px dashed rgba(0,82,255,.5)",
                borderRadius: "11px",
                padding: "11px 16px",
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "13.5px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
            >
              + Inviter un collaborateur — lien valable 48 h
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
