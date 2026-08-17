"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDashboard } from "../../DashboardContext";
import { api, ApiError } from "@/lib/api-client";

// Voix UI → identifiant logique attendu par le backend (VOICE_MAP côté Vapi).
function mapVoice(label: string): string {
  return label.toLowerCase().startsWith("loïc") ? "koffi_male_ci" : "awa_female_ci";
}

// Upload d'un CSV de contacts vers une campagne (multipart/form-data).
async function uploadContacts(campaignId: string, csv: Blob, filename: string) {
  const form = new FormData();
  form.append("file", csv, filename);
  const res = await fetch(`/api/campaigns/${campaignId}/contacts`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.error?.message ?? "Échec de l'import des contacts.");
  }
}

export default function NewCampaignPage() {
  const router = useRouter();
  const {
    testCall,
    testNum,
    setTestNum,
    startTestCall,
    pushToast,
    kcr,
  } = useDashboard();

  const [name, setName] = useState("");
  const [selectedSector, setSelectedSector] = useState("Banque");
  const [brief, setBrief] = useState("");
  const [selectedVoice, setSelectedVoice] = useState("Ingrid — chaleureuse");
  const [contactsCount, setContactsCount] = useState(0);
  const [timeStart, setTimeStart] = useState("00:00");
  const [timeEnd, setTimeEnd] = useState("23:59");
  const [maxRetries, setMaxRetries] = useState(2);
  const [retryDelayMinutes, setRetryDelayMinutes] = useState(240);
  const [maxDuration, setMaxDuration] = useState(480);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lecture du CSV choisi : compte les lignes (hors en-tête) pour l'affichage.
  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setCsvFile(f);
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter((l) => l.trim().length > 0);
      setContactsCount(Math.max(0, lines.length - 1));
      pushToast(`${Math.max(0, lines.length - 1)} contacts prêts à l'import`, "ok");
    };
    reader.readAsText(f);
  };

  const sectors = ["Banque", "Télécom", "Assurance", "Études", "Autre"];
  const voices = [
    "Ingrid — chaleureuse",
    "Ingrid — professionnelle",
    "Loïc — masculin",
  ];

  const pillStyle = (active: boolean) => ({
    fontSize: "13px",
    fontWeight: active ? 600 : 500,
    padding: "8px 15px",
    borderRadius: "20px",
    background: active ? "rgba(0,82,255,.16)" : "var(--sn-inset)",
    color: active ? "var(--sn-blue3)" : "var(--sn-w6)",
    border: active ? "1px solid rgba(0,82,255,.4)" : "1px solid var(--sn-w08)",
    cursor: "pointer",
    transition: "all 0.15s ease",
  });

  // Validation commune + création réelle de la campagne. Renvoie l'id ou null.
  const createCampaign = async (): Promise<string | null> => {
    if (name.trim().length < 3) {
      pushToast("Le nom de la campagne doit faire au moins 3 caractères.", "warn");
      return null;
    }
    if (brief.trim().length < 20) {
      pushToast("Le brief IA doit décrire l'objectif (20 caractères minimum).", "warn");
      return null;
    }
    const { data } = await api.campaigns.create({
      name: name.trim(),
      aiBrief: brief.trim(),
      sector: selectedSector,
      aiVoice: mapVoice(selectedVoice),
      timeStart,
      timeEnd,
      maxRetries,
      retryDelayMinutes,
      maxDuration,
    });
    return data.id;
  };

  const handleLaunch = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const id = await createCampaign();
      if (!id) return;
      // Import des contacts : fichier choisi, sinon CSV de démonstration.
      if (!csvFile) {
        pushToast("Importez votre fichier CSV avant de lancer la campagne.", "warn");
        return;
      }
      await uploadContacts(id, csvFile, csvFile.name);
      await api.campaigns.launch(id);
      pushToast(`Campagne "${name.trim()}" lancée avec succès !`, "ok");
      router.push("/dashboard/campaigns");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Erreur au lancement.";
      pushToast(msg, "warn");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const id = await createCampaign();
      if (!id) return;
      if (csvFile) await uploadContacts(id, csvFile, csvFile.name);
      pushToast(`Brouillon "${name.trim()}" enregistré.`, "ok");
      router.push("/dashboard/campaigns");
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Erreur à l'enregistrement.";
      pushToast(msg, "warn");
    } finally {
      setSubmitting(false);
    }
  };

  const testBtnLabel = testCall === "calling" ? "Ingrid vous appelle…" : "Recevoir un appel test";
  const testBtnColor = testCall === "calling" ? "var(--sn-green)" : "var(--sn-blue2)";
  const testBtnBorder = testCall === "calling" ? "rgba(43,213,118,.4)" : "rgba(0,82,255,.4)";
  const testBtnCursor = testCall === "calling" ? "default" : "pointer";

  return (
    <div data-screen-label="Nouvelle campagne" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      
      {/* Back button */}
      <Link
        href="/dashboard/campaigns"
        className="sn-hover-text"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "7px",
          fontSize: "13px",
          fontWeight: 500,
          color: "var(--sn-w5)",
          cursor: "pointer",
          width: "fit-content",
          textDecoration: "none",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6"></path>
        </svg>
        Campagnes
      </Link>

      {/* Title */}
      <div>
        <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>Nouvelle campagne</h1>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
          DÉCRIVEZ VOTRE OBJECTIF — L’IA CONDUIT LA CONVERSATION
        </div>
      </div>

      {/* Grid Content */}
      <div id="sn-newrow" style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: "14px", alignItems: "start" }}>
        
        {/* Main Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px", minWidth: 0 }}>
          
          {/* Card 1: Information */}
          <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Informations</div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w45)", marginBottom: "8px" }}>
                NOM DE LA CAMPAGNE
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex : Satisfaction agences — Q3"
                style={{
                  width: "100%",
                  background: "var(--sn-inset)",
                  border: "1px solid var(--sn-w09)",
                  borderRadius: "11px",
                  padding: "13px 15px",
                  color: "var(--sn-text)",
                  fontFamily: "'Satoshi', sans-serif",
                  fontSize: "14px",
                  outline: "none",
                }}
              />
            </div>
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w45)", marginBottom: "8px" }}>
                SECTEUR
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {sectors.map((s) => (
                  <button key={s} onClick={() => setSelectedSector(s)} style={pillStyle(selectedSector === s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Card 2: AI Brief */}
          <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>Brief IA</div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".1em", color: "var(--sn-w4)" }}>
                LANGAGE NATUREL — PAS DE SCRIPT RIGIDE
              </span>
            </div>
            <textarea
              rows={5}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Ex : Mesurer la satisfaction des clients passés en agence ce mois-ci. Évaluer l'accueil sur 10, le temps d'attente, et l'intention de recommandation. Si la note est basse, creuser la cause."
              style={{
                width: "100%",
                marginTop: "14px",
                background: "var(--sn-inset)",
                border: "1px solid var(--sn-w09)",
                borderRadius: "11px",
                padding: "14px 15px",
                color: "var(--sn-text)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12.5px",
                lineHeight: 1.7,
                outline: "none",
                resize: "vertical",
              }}
            />
          </div>

          {/* Card 3: Contacts upload */}
          <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Contacts</div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={handleFilePick}
            />
            <div
              className="sn-hover-contacts-import"
              onClick={() => fileInputRef.current?.click()}
              style={{
                marginTop: "14px",
                border: "1.5px dashed rgba(0,82,255,.45)",
                background: "rgba(0,82,255,.04)",
                borderRadius: "13px",
                padding: "34px 20px",
                textAlign: "center",
                cursor: "pointer",
                transition: "background 0.15s ease",
              }}
            >
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--sn-text)" }}>
                {contactsCount > 0 ? `${contactsCount} contacts importés ✓` : "Glissez votre fichier CSV ici"}
              </div>
              <div style={{ fontSize: "12.5px", color: "var(--sn-w45)", marginTop: "5px" }}>
                {contactsCount > 0 ? "Cliquez pour remplacer le fichier" : "ou cliquez pour parcourir — modèle disponible"}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w35)", marginTop: "10px" }}>
                NORMALISATION AUTO : 07XXXXXXXX → +22507XXXXXXXX · MAX 10 000 CONTACTS
              </div>
            </div>
          </div>

          {/* Card 4: Rules and Voice */}
          <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Règles d’appel &amp; voix</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Plage horaire</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: "'JetBrains Mono', monospace" }}><input aria-label="Début de la plage horaire" type="time" value={timeStart} onChange={(event) => setTimeStart(event.target.value)} style={{ background: "var(--sn-inset)", color: "var(--sn-text)", border: "1px solid var(--sn-w09)", borderRadius: "8px", padding: "6px" }} /><span>–</span><input aria-label="Fin de la plage horaire" type="time" value={timeEnd} onChange={(event) => setTimeEnd(event.target.value)} style={{ background: "var(--sn-inset)", color: "var(--sn-text)", border: "1px solid var(--sn-w09)", borderRadius: "8px", padding: "6px" }} /></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Tentatives max</span>
                <select aria-label="Tentatives maximum" value={maxRetries} onChange={(event) => setMaxRetries(Number(event.target.value))} style={{ fontFamily: "'JetBrains Mono', monospace", background: "var(--sn-inset)", color: "var(--sn-text)", border: "1px solid var(--sn-w09)", borderRadius: "8px", padding: "6px" }}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Délai entre tentatives</span>
                <select aria-label="Délai entre les tentatives" value={retryDelayMinutes} onChange={(event) => setRetryDelayMinutes(Number(event.target.value))} style={{ fontFamily: "'JetBrains Mono', monospace", background: "var(--sn-inset)", color: "var(--sn-text)", border: "1px solid var(--sn-w09)", borderRadius: "8px", padding: "6px" }}><option value={0}>Immédiat</option><option value={60}>1 h</option><option value={240}>4 h</option><option value={1440}>24 h</option></select>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Durée max par appel</span>
                <select aria-label="Durée maximum d'un appel" value={maxDuration} onChange={(event) => setMaxDuration(Number(event.target.value))} style={{ fontFamily: "'JetBrains Mono', monospace", background: "var(--sn-inset)", color: "var(--sn-text)", border: "1px solid var(--sn-w09)", borderRadius: "8px", padding: "6px" }}><option value={120}>2 min</option><option value={180}>3 min</option><option value={300}>5 min</option><option value={480}>8 min</option></select>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", padding: "12px 0", fontSize: "13.5px", flexWrap: "wrap" }}>
                <span style={{ color: "var(--sn-w55)" }}>Voix de l’IA</span>
                <span style={{ display: "inline-flex", gap: "7px", flexWrap: "wrap" }}>
                  {voices.map((v) => (
                    <button key={v} onClick={() => setSelectedVoice(v)} style={pillStyle(selectedVoice === v)}>
                      {v}
                    </button>
                  ))}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary Column */}
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px", position: "sticky", top: 0 }}>
          <div style={{ fontSize: "16px", fontWeight: 700 }}>Récapitulatif</div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
              <span style={{ color: "var(--sn-w55)" }}>Contacts importés</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{contactsCount}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
              <span style={{ color: "var(--sn-w55)" }}>Coût estimé</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>Calculé après les appels</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
              <span style={{ color: "var(--sn-w55)" }}>Crédit disponible</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{kcr.toLocaleString("fr-FR")} appels</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", fontSize: "13.5px" }}>
              <span style={{ color: "var(--sn-w55)" }}>Lancement</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>IMMÉDIAT</span>
            </div>
          </div>

          {/* Test call panel */}
          <div style={{ marginTop: "16px", background: "var(--sn-inset)", border: "1px solid var(--sn-w06)", borderRadius: "12px", padding: "14px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>TESTER AVANT DE LANCER</div>
            <input
              type="text"
              value={testNum}
              onChange={(e) => setTestNum(e.target.value)}
              style={{
                width: "100%",
                marginTop: "9px",
                background: "var(--sn-panel)",
                border: "1px solid var(--sn-w09)",
                borderRadius: "9px",
                padding: "10px 12px",
                color: "var(--sn-text)",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12.5px",
                outline: "none",
              }}
            />
            <button
              onClick={() => startTestCall({
                aiBrief: brief.trim() || undefined,
                aiVoice: mapVoice(selectedVoice),
              })}
              style={{
                marginTop: "9px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                background: "transparent",
                color: testBtnColor,
                border: `1px solid ${testBtnBorder}`,
                borderRadius: "9px",
                padding: "10px 14px",
                fontFamily: "'Satoshi', sans-serif",
                fontSize: "13px",
                fontWeight: 600,
                cursor: testBtnCursor,
                width: "100%",
                transition: "all 0.15s ease",
              }}
            >
              {testCall === "calling" && (
                <span
                  style={{
                    width: "7px",
                    height: "7px",
                    borderRadius: "50%",
                    background: "var(--sn-green)",
                    animation: "snPulse 1.2s infinite",
                  }}
                ></span>
              )}
              {testBtnLabel}
            </button>
          </div>

          <button
            onClick={handleLaunch}
            className="sn-hover-btn-primary"
            style={{
              marginTop: "12px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "9px",
              background: "#0052FF",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "14px 18px",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "14.5px",
              fontWeight: 700,
              cursor: "pointer",
              width: "100%",
              boxShadow: "0 8px 24px rgba(0,82,255,.32)",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4h4l1.5 4.5L8 10a12 12 0 0 0 6 6l1.5-2.5L20 15v4a1.5 1.5 0 0 1-1.7 1.5C10 19.6 4.4 14 3.5 5.7A1.5 1.5 0 0 1 5 4z"></path>
            </svg>
            Lancer la campagne
          </button>

          <button
            onClick={handleSaveDraft}
            className="sn-hover-border"
            style={{
              marginTop: "9px",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              color: "var(--sn-w7)",
              border: "1px solid var(--sn-w14)",
              borderRadius: "12px",
              padding: "12px 18px",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
              width: "100%",
            }}
          >
            Enregistrer comme brouillon
          </button>

          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".06em", color: "var(--sn-w35)", marginTop: "14px", lineHeight: 1.7, textAlign: "center" }}>
            IDENTIFICATION IA OBLIGATOIRE DÈS LE DÉBUT D’APPEL
            <br />
            CONFORMITÉ ARTCI · LOI 2013-450 CI
          </div>
        </div>
      </div>
    </div>
  );
}
