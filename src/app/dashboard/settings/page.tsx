"use client";

import React, { useEffect, useState } from "react";
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
    plan,
    plans,
    persistAccount,
    pushToast,
  } = useDashboard();

  const curPlan = plans.find((p) => p.id === plan) || plans[1];
  const planBadge = curPlan.contactSales ? "SUR DEVIS" : `${curPlan.price} FCFA / APPEL`;
  const [teamMembers, setTeamMembers] = useState<Array<{ id: string; name: string; email: string; role: string; avatarUrl: string | null; isActive: boolean }>>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"MANAGER" | "VIEWER">("MANAGER");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [apiKeyPrefix, setApiKeyPrefix] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<Array<{ id: string; prefix: string; revokedAt: string | null }>>([]);
  const [createdApiSecret, setCreatedApiSecret] = useState<string | null>(null);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ qrCodeUrl: string } | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [webhookUrl, setWebhookUrl] = useState<string | null>(null);
  useEffect(() => { fetch("/api/company/settings", { credentials: "include" }).then((r) => r.json()).then((payload) => { if (payload.success) setCompany({ ...company, phone: payload.data.displayPhone ?? "", tz: payload.data.timezone }); }).catch(() => {}); }, []);
  useEffect(() => {
    let mounted = true;
    Promise.all([fetch("/api/company/members", { credentials: "include" }).then((r) => r.json()), fetch("/api/company/api-keys", { credentials: "include" }).then((r) => r.json()), fetch("/api/company/settings", { credentials: "include" }).then((r) => r.json()), fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json())]).then(([members, keys, settings, me]) => {
      if (!mounted) return;
      if (members.success) setTeamMembers(members.data.map((user: { id: string; firstName: string | null; lastName: string | null; email: string; role: string; avatarUrl: string | null; isActive: boolean }) => ({ id: user.id, name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Invitation en attente", email: user.email, role: user.role.toLowerCase(), avatarUrl: user.avatarUrl, isActive: user.isActive })));
      if (keys.success) { setApiKeys(keys.data); setApiKeyPrefix(keys.data.find((key: { revokedAt: string | null }) => !key.revokedAt)?.prefix ?? null); }
      if (settings.success) setWebhookUrl(settings.data.webhookUrl ?? null);
      if (me.success) { setTwoFactorEnabled(Boolean(me.data.company.twoFactorEnabled)); setCurrentUserId(me.data.user.id); }
    }).catch(() => {});
    return () => { mounted = false; };
  }, []);

  const saveCompanyToDatabase = async () => {
    if (!companyDraft) return;
    const [profileResult, settingsResult] = await Promise.all([
      fetch("/api/company/profile", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: companyDraft.name }) }),
      fetch("/api/company/settings", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayPhone: companyDraft.phone, timezone: companyDraft.tz }) }),
    ]);
    if (profileResult.ok && settingsResult.ok) saveCompany();
    else pushToast("Impossible d’enregistrer.", "warn");
  };

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

  const inviteCollaborator = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) { pushToast("Saisissez l'adresse e-mail du collaborateur.", "warn"); return; }
    setInviteSubmitting(true);
    try {
      const response = await fetch("/api/auth/invite", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, role: inviteRole }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Invitation impossible.");
      await navigator.clipboard?.writeText(payload.data.inviteUrl);
      setInviteUrl(payload.data.inviteUrl);
      setTeamMembers((previous) => {
        const pending = { id: `pending-${email}`, name: "Invitation en attente", email, role: inviteRole.toLowerCase(), avatarUrl: null, isActive: false };
        return [pending, ...previous.filter((member) => member.email !== email)];
      });
      pushToast("Invitation créée : lien copié dans le presse-papiers.", "ok");
    } catch (inviteError) {
      pushToast(inviteError instanceof Error ? inviteError.message : "Invitation impossible.", "warn");
    } finally {
      setInviteSubmitting(false);
    }
  };

  const revokeCollaborator = async (member: { id: string; email: string; isActive: boolean }) => {
    if (member.id.startsWith("pending-")) {
      // Une invitation tout juste créée est encore identifiée par l'e-mail dans l'état local.
      const membersResponse = await fetch("/api/company/members", { credentials: "include" });
      const membersPayload = await membersResponse.json();
      const persisted = membersPayload.success ? membersPayload.data.find((entry: { email: string }) => entry.email === member.email) : null;
      if (!persisted) { pushToast("Impossible de retrouver cette invitation.", "warn"); return; }
      member = { id: persisted.id, email: member.email, isActive: persisted.isActive };
    }
    const label = member.isActive ? "Retirer ce collaborateur ? Ses sessions seront fermées." : "Annuler cette invitation ?";
    if (!window.confirm(label)) return;
    try {
      const response = await fetch(`/api/company/members/${member.id}`, { method: "DELETE", credentials: "include" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Retrait impossible.");
      setTeamMembers((previous) => previous.filter((entry) => entry.email !== member.email));
      pushToast(member.isActive ? "Collaborateur retiré. Ses sessions ont été fermées." : "Invitation annulée.", "ok");
    } catch (memberError) {
      pushToast(memberError instanceof Error ? memberError.message : "Retrait impossible.", "warn");
    }
  };

  const createApiKey = async () => {
    const name = window.prompt("Nom de cette clé API :")?.trim();
    if (!name) return;
    try {
      const response = await fetch("/api/company/api-keys", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Création impossible.");
      setCreatedApiSecret(payload.data.secret);
      setApiKeys((previous) => [payload.data.key, ...previous]);
      setApiKeyPrefix(payload.data.key.prefix);
      pushToast("Clé créée. Copiez-la maintenant : elle ne sera plus affichée.", "warn");
    } catch (keyError) {
      pushToast(keyError instanceof Error ? keyError.message : "Création impossible.", "warn");
    }
  };

  const revokeApiKey = async () => {
    const activeKey = apiKeys.find((key) => !key.revokedAt);
    if (!activeKey || !window.confirm("Révoquer la clé API active ? Cette action est définitive.")) return;
    try {
      const response = await fetch("/api/company/api-keys", { method: "PATCH", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: activeKey.id }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Révocation impossible.");
      setApiKeys((previous) => previous.map((key) => key.id === activeKey.id ? { ...key, revokedAt: new Date().toISOString() } : key));
      setApiKeyPrefix(null);
      pushToast("Clé API révoquée.", "ok");
    } catch (keyError) {
      pushToast(keyError instanceof Error ? keyError.message : "Révocation impossible.", "warn");
    }
  };

  const toggleTwoFactor = async () => {
    if (twoFactorEnabled) {
      const code = window.prompt("Entrez votre code 2FA à 6 chiffres pour désactiver :");
      if (!code) return;
      const response = await fetch("/api/auth/2fa/disable", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) { pushToast(payload.error?.message ?? "Désactivation impossible.", "warn"); return; }
      setTwoFactorEnabled(false);
      pushToast("Double authentification désactivée.", "ok");
      return;
    }
    const setupResponse = await fetch("/api/auth/2fa/setup", { method: "POST", credentials: "include" });
    const setup = await setupResponse.json();
    if (!setupResponse.ok || !setup.success) { pushToast(setup.error?.message ?? "Configuration 2FA impossible.", "warn"); return; }
    setTwoFactorCode("");
    setTwoFactorSetup({ qrCodeUrl: setup.data.qrCodeUrl });
  };

  const confirmTwoFactorSetup = async () => {
    if (!twoFactorCode.trim()) return;
    const enableResponse = await fetch("/api/auth/2fa/enable", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: twoFactorCode }) });
    const enabled = await enableResponse.json();
    if (!enableResponse.ok || !enabled.success) { pushToast(enabled.error?.message ?? "Code 2FA invalide.", "warn"); return; }
    setTwoFactorEnabled(true);
    setTwoFactorSetup(null);
    setTwoFactorCode("");
    window.alert(`Conservez ces codes de secours :\n${enabled.data.backupCodes.join("\n")}`);
    pushToast("2FA activée. Conservez vos codes de secours.", "ok");
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
                  <button onClick={() => { void saveCompanyToDatabase(); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#0052FF", color: "#fff", border: "none", borderRadius: "10px", padding: "11px 18px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }} className="sn-hover-btn-primary">
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
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--sn-w45)" }}>{apiKeyPrefix ? `${apiKeyPrefix}••••` : "Non configurée"}</span>
                  <button onClick={createApiKey} style={{ border: "none", background: "transparent", color: "var(--sn-blue2)", cursor: "pointer", fontWeight: 600 }}>Créer</button>
                  {apiKeyPrefix && <button onClick={revokeApiKey} style={{ border: "none", background: "transparent", color: "var(--sn-red)", cursor: "pointer", fontWeight: 600 }}>Révoquer</button>}
                </span>
              </div>
              {createdApiSecret && <div style={{ padding: "10px", borderBottom: "1px solid var(--sn-w05)", background: "rgba(255,176,46,.08)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", wordBreak: "break-all" }}>Copiez cette clé maintenant : {createdApiSecret}</div>}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Webhook sortant</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w7)" }}>
                  {webhookUrl ?? "Non configuré"}
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
                <button onClick={() => { void toggleTwoFactor(); }} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: twoFactorEnabled ? "var(--sn-green)" : "var(--sn-blue2)", border: "1px solid var(--sn-w18)", background: "transparent", padding: "3px 8px", borderRadius: "6px", cursor: "pointer" }}>
                  {twoFactorEnabled ? "ACTIVÉE" : "ACTIVER"}
                </button>
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
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)" }}>{teamMembers.length} MEMBRE(S)</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {teamMembers.map((u, index) => {
                // Highlight active profile settings locally
                const isSelf = u.id === currentUserId;
                const displayName = isSelf ? profile.name : u.name;
                const displayEmail = isSelf ? profile.email : u.email;
                const initials = getInitials(displayName);
                const avatarBg = "rgba(0,82,255,.15)";
                const avatarColor = "var(--sn-blue3)";
                const roleStyles = getRoleStyles(u.role);

                return (
                  <div
                    key={u.id}
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
                        overflow: "hidden",
                      }}
                    >
                      {isSelf && profile.photo ? <img src="/api/auth/avatar/image" alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13.5px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{displayName}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {displayEmail}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                      {!u.isActive && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "var(--sn-amber)", background: "rgba(255,176,46,.12)", padding: "4px 7px", borderRadius: "12px" }}>EN ATTENTE</span>}
                      <span style={{ fontSize: "11px", fontWeight: 600, color: roleStyles.color, background: roleStyles.bg, padding: "4px 10px", borderRadius: "12px" }}>
                        {u.role}
                      </span>
                      {!isSelf && u.role !== "admin" && u.role !== "super_admin" && <button onClick={() => { void revokeCollaborator(u); }} title={u.isActive ? "Retirer le collaborateur" : "Annuler l'invitation"} style={{ border: "none", background: "transparent", color: "var(--sn-red)", cursor: "pointer", fontSize: "15px", padding: "3px 0" }}>×</button>}
                    </div>
                  </div>
                );
              })}
            </div>
            <button
              onClick={() => { setInviteOpen(true); setInviteUrl(null); }}
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
      {twoFactorSetup && (
        <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "min(390px, 100%)", background: "var(--sn-panel)", border: "1px solid var(--sn-w12)", borderRadius: "16px", padding: "22px", boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}>
            <div style={{ fontSize: "17px", fontWeight: 700 }}>Activer la double authentification</div>
            <p style={{ fontSize: "13px", color: "var(--sn-w6)", lineHeight: 1.5 }}>Scanne ce QR code avec une application d'authentification, puis entre le code à six chiffres.</p>
            <img src={twoFactorSetup.qrCodeUrl} alt="QR code 2FA Sonara" style={{ display: "block", width: "190px", height: "190px", margin: "14px auto", background: "#fff", padding: "8px", borderRadius: "10px" }} />
            <input value={twoFactorCode} onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Code à 6 chiffres" style={{ width: "100%", boxSizing: "border-box", background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "10px", padding: "11px 13px", color: "var(--sn-text)", fontSize: "14px", outline: "none" }} />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "9px", marginTop: "16px" }}>
              <button onClick={() => { setTwoFactorSetup(null); setTwoFactorCode(""); }} style={{ background: "transparent", color: "var(--sn-w7)", border: "1px solid var(--sn-w14)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer" }}>Annuler</button>
              <button onClick={() => { void confirmTwoFactorSetup(); }} disabled={twoFactorCode.length !== 6} style={{ background: "#0052FF", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 14px", fontWeight: 700, cursor: "pointer", opacity: twoFactorCode.length === 6 ? 1 : .55 }}>Confirmer</button>
            </div>
          </div>
        </div>
      )}
      {inviteOpen && (
        <div role="dialog" aria-modal="true" aria-label="Inviter un collaborateur" style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ width: "min(430px, 100%)", background: "var(--sn-panel)", border: "1px solid var(--sn-w12)", borderRadius: "16px", padding: "22px", boxShadow: "0 24px 60px rgba(0,0,0,.35)" }}>
            <div style={{ fontSize: "17px", fontWeight: 700 }}>Inviter un collaborateur</div>
            <p style={{ fontSize: "13px", color: "var(--sn-w6)", lineHeight: 1.5 }}>Créez un lien valable 48 h. Vous pourrez le partager directement avec votre collaborateur.</p>
            {inviteUrl ? (
              <div style={{ background: "rgba(43,213,118,.09)", border: "1px solid rgba(43,213,118,.22)", borderRadius: "10px", padding: "12px", fontSize: "12px", color: "var(--sn-w75)", wordBreak: "break-all" }}>
                Lien copié dans le presse-papiers.<br /><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px" }}>{inviteUrl}</span>
              </div>
            ) : <>
              <input value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} type="email" placeholder="email@entreprise.com" style={{ width: "100%", boxSizing: "border-box", background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "10px", padding: "11px 13px", color: "var(--sn-text)", fontSize: "14px", outline: "none" }} />
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                {(["MANAGER", "VIEWER"] as const).map((role) => <button key={role} onClick={() => setInviteRole(role)} style={{ flex: 1, border: `1px solid ${inviteRole === role ? "#0052FF" : "var(--sn-w14)"}`, background: inviteRole === role ? "rgba(0,82,255,.14)" : "transparent", color: inviteRole === role ? "var(--sn-blue2)" : "var(--sn-w7)", borderRadius: "9px", padding: "9px", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}>{role === "MANAGER" ? "Manager" : "Viewer"}</button>)}
              </div>
            </>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "9px", marginTop: "16px" }}>
              <button onClick={() => setInviteOpen(false)} style={{ background: "transparent", color: "var(--sn-w7)", border: "1px solid var(--sn-w14)", borderRadius: "10px", padding: "10px 14px", cursor: "pointer" }}>{inviteUrl ? "Fermer" : "Annuler"}</button>
              {!inviteUrl && <button onClick={() => { void inviteCollaborator(); }} disabled={inviteSubmitting} style={{ background: "#0052FF", color: "#fff", border: "none", borderRadius: "10px", padding: "10px 14px", fontWeight: 700, cursor: "pointer", opacity: inviteSubmitting ? .55 : 1 }}>{inviteSubmitting ? "Création…" : "Créer l'invitation"}</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
