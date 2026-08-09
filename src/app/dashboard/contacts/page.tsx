"use client";

import { useRef, useState } from "react";
import { useDashboard } from "../DashboardContext";
import { useCampaigns, useContacts } from "@/hooks/useSonara";

export default function ContactsPage() {
  // Données réelles via l'API ; repli sur l'annuaire démo si non authentifié / erreur.
  const { pushToast } = useDashboard();
  const { data, error, loading, refetch } = useContacts();
  const { data: campaigns } = useCampaigns({ limit: 100 });
  const directory = data && !error ? data : [];

  const [filter, setFilter] = useState<"all" | "Particulier" | "PME" | "Premium" | "opt-out">("all");
  const [search, setSearch] = useState("");
  const [selectedCampaignId, setSelectedCampaignId] = useState("");
  const [showImportTarget, setShowImportTarget] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importableCampaigns = (campaigns ?? []).filter((campaign) => campaign.status === "DRAFT" || campaign.status === "SCHEDULED");

  const totalContacts = directory.length;
  const totalOptout = directory.filter((d) => d.optout).length;

  const counts = {
    all: directory.length,
    Particulier: directory.filter((d) => d.segment === "Particulier" && !d.optout).length,
    PME: directory.filter((d) => d.segment === "PME" && !d.optout).length,
    Premium: directory.filter((d) => d.segment === "Premium" && !d.optout).length,
    "opt-out": directory.filter((d) => d.optout).length,
  };

  const decoratedDirectory = directory.map((d) => {
    const initials = d.name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();

    return {
      ...d,
      initials,
      stLabel: d.optout ? "Opt-out" : "Actif",
      stColor: d.optout ? "var(--sn-red)" : "var(--sn-green)",
      stBg: d.optout ? "rgba(255,92,92,.11)" : "rgba(43,213,118,.11)",
    };
  });

  const filteredDirectory = decoratedDirectory.filter((d) => {
    const matchesSegment = filter === "all" || (filter === "opt-out" ? d.optout : d.segment === filter && !d.optout);
    const query = search.trim().toLocaleLowerCase("fr-FR");
    const matchesSearch = !query || [d.name, d.phone, d.city, d.segment].some((value) => value.toLocaleLowerCase("fr-FR").includes(query));
    return matchesSegment && matchesSearch;
  });

  const tabStyle = (active: boolean) => ({
    fontSize: "13px",
    fontWeight: active ? 600 : 500,
    padding: "8px 16px",
    borderRadius: "20px",
    background: active ? "rgba(0,82,255,.16)" : "var(--sn-panel)",
    color: active ? "var(--sn-blue3)" : "var(--sn-w6)",
    border: active ? "1px solid rgba(0,82,255,.4)" : "1px solid var(--sn-w08)",
    cursor: "pointer",
    marginRight: "8px",
    marginBottom: "8px",
  });

  const handleCsvDownload = () => {
    const content = "first_name,last_name,phone,city,segment,notes\nAwa,Koné,0700000000,Abidjan,Premium,Client pilote\n";
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "modele-contacts-sonara.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = () => {
    if (!selectedCampaignId) {
      setShowImportTarget(true);
      pushToast("Choisissez d'abord une campagne brouillon ou planifiée.", "info");
      return;
    }
    fileInputRef.current?.click();
  };

  const importCsv = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !selectedCampaignId) return;
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/campaigns/${selectedCampaignId}/contacts`, { method: "POST", credentials: "include", body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Import impossible.");
      pushToast(`${payload.data.imported} contact(s) importé(s), ${payload.data.skipped} ignoré(s).`, "ok");
      setShowImportTarget(false);
      refetch();
    } catch (importError) {
      pushToast(importError instanceof Error ? importError.message : "Import impossible.", "warn");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div data-screen-label="Contacts — annuaire" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "27px", fontWeight: 700, letterSpacing: "-.015em" }}>
            Contacts
          </h1>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "7px" }}>
            {loading
              ? "CHARGEMENT…"
              : `${totalContacts.toLocaleString("fr-FR")} CONTACTS — ${totalOptout.toLocaleString("fr-FR")} OPT-OUT — DÉDUPLIQUÉS SUR NUMÉRO`}
          </div>
        </div>
        <div style={{ display: "flex", gap: "9px" }}>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={(event) => { void importCsv(event); }} style={{ display: "none" }} />
          <button
            onClick={handleCsvDownload}
            className="sn-hover-border"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "var(--sn-panel2)",
              color: "var(--sn-text)",
              border: "1px solid var(--sn-w12)",
              borderRadius: "11px",
              padding: "11px 16px",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "13.5px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Télécharger le modèle CSV
          </button>
          <button
            onClick={handleCsvUpload}
            className="sn-hover-btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "9px",
              background: "#0052FF",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "11px 18px",
              fontFamily: "'Satoshi', sans-serif",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 8px 24px rgba(0,82,255,.32)",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 15V4M7 9l5-5 5 5"></path>
              <path d="M4 19h16"></path>
            </svg>
            {importing ? "Import en cours..." : "Importer CSV"}
          </button>
        </div>
      </div>

      {showImportTarget && (
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "14px", padding: "14px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13px", color: "var(--sn-w6)" }}>Importer dans :</span>
          <select value={selectedCampaignId} onChange={(event) => setSelectedCampaignId(event.target.value)} style={{ minWidth: "240px", background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "9px", padding: "9px 11px", color: "var(--sn-text)" }}>
            <option value="">Choisir une campagne</option>
            {importableCampaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
          <button onClick={handleCsvUpload} disabled={!selectedCampaignId || importing} style={{ background: "#0052FF", color: "#fff", border: "none", borderRadius: "9px", padding: "9px 13px", fontWeight: 600, cursor: "pointer", opacity: !selectedCampaignId || importing ? 0.6 : 1 }}>Choisir le fichier</button>
          {importableCampaigns.length === 0 && <span style={{ fontSize: "12px", color: "var(--sn-amber)" }}>Créez d'abord une campagne brouillon ou planifiée.</span>}
        </div>
      )}

      {/* Filter Segment tabs */}
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un contact, numéro, ville ou segment" style={{ maxWidth: "520px", background: "var(--sn-panel)", border: "1px solid var(--sn-w08)", borderRadius: "11px", padding: "12px 14px", color: "var(--sn-text)", fontSize: "13.5px", outline: "none" }} />
      <div style={{ display: "flex", flexWrap: "wrap" }}>
        <button style={tabStyle(filter === "all")} onClick={() => setFilter("all")}>
          Tous ({counts.all})
        </button>
        <button style={tabStyle(filter === "Particulier")} onClick={() => setFilter("Particulier")}>
          Particulier ({counts.Particulier})
        </button>
        <button style={tabStyle(filter === "PME")} onClick={() => setFilter("PME")}>
          PME ({counts.PME})
        </button>
        <button style={tabStyle(filter === "Premium")} onClick={() => setFilter("Premium")}>
          Premium ({counts.Premium})
        </button>
        <button style={tabStyle(filter === "opt-out")} onClick={() => setFilter("opt-out")}>
          Opt-out ({counts["opt-out"]})
        </button>
      </div>

      {/* Contacts Table */}
      <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", overflowX: "auto" }}>
        <div style={{ minWidth: "1020px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.8fr 165px 120px 110px 110px 110px 100px",
              gap: "12px",
              alignItems: "center",
              padding: "14px 20px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              letterSpacing: ".12em",
              color: "var(--sn-w38)",
              borderBottom: "1px solid var(--sn-w06)",
            }}
          >
            <span>CONTACT</span>
            <span>TÉLÉPHONE</span>
            <span>VILLE</span>
            <span>SEGMENT</span>
            <span>CAMPAGNES</span>
            <span>DERNIER APPEL</span>
            <span>STATUT</span>
          </div>

          {filteredDirectory.map((d, index) => (
            <div
              key={index}
              className="sn-hover-w03"
              style={{
                display: "grid",
                gridTemplateColumns: "1.8fr 165px 120px 110px 110px 110px 100px",
                gap: "12px",
                alignItems: "center",
                padding: "14px 20px",
                borderBottom: "1px solid var(--sn-w04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    minWidth: "32px",
                    borderRadius: "10px",
                    background: "var(--sn-w07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11.5px",
                    fontWeight: 700,
                    color: "var(--sn-w75)",
                  }}
                >
                  {d.initials}
                </div>
                <span style={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {d.name}
                </span>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--sn-w6)" }}>
                {d.phone}
              </span>
              <span style={{ fontSize: "13px", color: "var(--sn-w6)" }}>
                {d.city}
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--sn-w6)" }}>
                {d.segment}
              </span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px" }}>
                {d.campaigns}
              </span>
              <span style={{ fontSize: "12.5px", color: "var(--sn-w5)" }}>
                {d.lastCall}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11.5px",
                  fontWeight: 600,
                  color: d.stColor,
                  background: d.stBg,
                  padding: "5px 10px",
                  borderRadius: "14px",
                  whiteSpace: "nowrap",
                  width: "fit-content",
                }}
              >
                {d.stLabel}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
