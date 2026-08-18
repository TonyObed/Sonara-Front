"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useDashboard, type Campaign as FrontCampaign } from "../../DashboardContext";
import { useCampaignCalls } from "@/hooks/useSonara";
import { mapApiCallToRow } from "@/lib/dashboard-adapters";

type CampaignAnalytics = {
  nps: null | {
    questionId: string; key: string; label: string; responseCount: number; score: number | null;
    promoters: { count: number; percentage: number };
    passives: { count: number; percentage: number };
    detractors: { count: number; percentage: number };
  };
  questions: Array<{ id: string; key: string; label: string; kind: string; responseCount: number; distribution: Array<{ label: string; count: number; percentage: number }> }>;
  cities: Array<{ name: string; calls: number; sentiment: number | null }>;
  topics: Array<{ label: string; count: number; percentage: number }>;
};
type CampaignDetail = {
  id: string; name: string; sector: string | null; aiBrief: string; aiVoice: string;
  status: "DRAFT" | "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED" | "STOPPED";
  maxRetries: number; retryDelayMinutes: number; timeStart: string; timeEnd: string; maxDuration: number; concurrency: number;
  kpis: { totalContacts: number; totalCalls: number; completed: number; failed: number; voicemail: number; transferred: number; responseRate: number; progress: number; avgDurationSec: number };
  insights: Array<{ sentimentScore: number | null }>;
};
type CampaignContact = { id: string; firstName: string | null; lastName: string | null; phone: string; city: string | null; segment: string | null; status: string; attempts: number; nextRetryAt: string | null };

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    campaigns,
    stOver,
    setStOver,
    setCallId,
    pushToast,
    setConfirm,
  } = useDashboard();

  // Appels réels de la campagne (transcription accessible via le drawer / useCall).
  const { data: apiCalls } = useCampaignCalls(id, 8_000);
  const callRows = (apiCalls ?? []).map(mapApiCallToRow);
  const [callFilter, setCallFilter] = useState("all");
  const filteredCallRows = callFilter === "all" ? callRows : callRows.filter((call) => call.status === callFilter);
  // L'API trie les appels par date décroissante : le premier retenu est donc
  // bien le dernier échange du contact, sans mélanger deux personnes.
  const latestCallByContact = new Map<string, typeof callRows[number]>();
  for (const row of callRows) {
    if (!latestCallByContact.has(row.contactId)) latestCallByContact.set(row.contactId, row);
  }
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [detail, setDetail] = useState<CampaignDetail | null>(null);
  const [campaignContacts, setCampaignContacts] = useState<CampaignContact[]>([]);
  const [launching, setLaunching] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [retryingContacts, setRetryingContacts] = useState(false);
  useEffect(() => {
    let mounted = true;
    const load = () => {
      fetch(`/api/campaigns/${id}`, { credentials: "include" })
        .then((response) => response.json())
        .then((payload) => { if (mounted && payload.success) { setAnalytics(payload.data.analytics); setDetail(payload.data); } })
        .catch(() => {});
      fetch(`/api/campaigns/${id}/contacts?limit=100`, { credentials: "include" }).then((response) => response.json()).then((payload) => { if (mounted && payload.success) setCampaignContacts(payload.data); }).catch(() => {});
    };
    load();
    const timer = window.setInterval(load, 8_000);
    return () => { mounted = false; window.clearInterval(timer); };
  }, [id]);

  // Sur le forfait Vercel gratuit, les crons fréquents ne sont pas disponibles.
  // Tant que la campagne est ouverte dans le dashboard, ce battement léger
  // réveille les relances arrivées à échéance sans forcer leur délai.
  useEffect(() => {
    if (detail?.status !== "RUNNING") return;
    const dispatchDueRetries = () => {
      void fetch(`/api/campaigns/${id}/retry`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: false }),
      });
    };
    dispatchDueRetries();
    const timer = window.setInterval(dispatchDueRetries, 60_000);
    return () => window.clearInterval(timer);
  }, [detail?.status, id]);

  // Load initial tab from query string or default to 'overview'
  const requestedTab = searchParams.get("tab");
  const initialTab: "overview" | "results" | "calls" | "contacts" | "settings" =
    requestedTab === "results" || requestedTab === "calls" || requestedTab === "contacts" || requestedTab === "settings"
      ? requestedTab
      : "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "results" | "calls" | "contacts" | "settings">(initialTab);

  const STATUS_DICT = {
    live: { label: "En cours", color: "var(--sn-green)", bg: "rgba(43,213,118,.11)" },
    paused: { label: "En pause", color: "var(--sn-amber)", bg: "rgba(255,176,46,.11)" },
    done: { label: "Terminée", color: "var(--sn-w6)", bg: "var(--sn-w08)" },
    scheduled: { label: "Planifiée", color: "var(--sn-blue2)", bg: "rgba(0,82,255,.14)" },
    draft: { label: "Brouillon", color: "var(--sn-w5)", bg: "var(--sn-w06)" },
  };

  const CALL_STATUS_DICT = {
    completed: { label: "Terminé", color: "var(--sn-green)", bg: "rgba(43,213,118,.11)" },
    transferred: { label: "Transféré", color: "var(--sn-blue2)", bg: "rgba(0,82,255,.14)" },
    unreachable: { label: "Non joignable", color: "var(--sn-w55)", bg: "var(--sn-w07)" },
    voicemail: { label: "Messagerie", color: "var(--sn-amber)", bg: "rgba(255,176,46,.11)" },
    failed: { label: "Échec", color: "var(--sn-red)", bg: "rgba(255,92,92,.11)" },
  };

  const CONTACT_STATUS_DICT = {
    completed: { label: "Complété", color: "var(--sn-green)", bg: "rgba(43,213,118,.11)" },
    calling: { label: "En appel", color: "var(--sn-blue2)", bg: "rgba(0,82,255,.14)" },
    pending: { label: "En attente", color: "var(--sn-w55)", bg: "var(--sn-w07)" },
    retry: { label: "Relance prévue", color: "var(--sn-amber)", bg: "rgba(255,176,46,.11)" },
    transferred: { label: "Transféré", color: "var(--sn-amber)", bg: "rgba(255,176,46,.11)" },
    unreachable: { label: "Non joignable", color: "var(--sn-red)", bg: "rgba(255,92,92,.11)" },
  };

  // La fiche API est la source de vérité : un brouillon récemment créé n'est
  // jamais remplacé visuellement par la première campagne chargée en mémoire.
  const contextCampaign = campaigns.find((c) => c.id === id);
  const API_STATUS: Record<CampaignDetail["status"], FrontCampaign["status"]> = {
    DRAFT: "draft", SCHEDULED: "scheduled", RUNNING: "live", PAUSED: "paused", COMPLETED: "done", STOPPED: "done",
  };
  const campaign: FrontCampaign | undefined = detail
    ? {
        id: detail.id,
        name: detail.name,
        sector: detail.sector ?? "—",
        status: API_STATUS[detail.status],
        done: detail.kpis.totalCalls,
        total: detail.kpis.totalContacts,
        responseRate: detail.kpis.totalCalls ? `${detail.kpis.responseRate}%` : null,
        sentiment: null,
        date: null,
        brief: detail.aiBrief,
        voice: detail.aiVoice === "koffi_male_ci" ? "Loïc — masculin" : "Ingrid — chaleureuse",
        rules: {
          hours: `${detail.timeStart} – ${detail.timeEnd}`,
          maxAttempts: detail.maxRetries,
          retryDelay: detail.retryDelayMinutes === 0 ? "Immédiat" : detail.retryDelayMinutes % 60 === 0 ? `${detail.retryDelayMinutes / 60} h` : `${detail.retryDelayMinutes} min`,
          maxDuration: `${Math.round(detail.maxDuration / 60)} min`,
          concurrency: detail.concurrency,
        },
      }
    : contextCampaign;
  if (!campaign) {
    return <div style={{ padding: "40px", color: "var(--sn-w55)" }}>Chargement de la campagne…</div>;
  }
  const currentStatus = stOver[campaign.id] || campaign.status;
  const st = STATUS_DICT[currentStatus] || STATUS_DICT.draft;

  // Format values
  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
  const initials = (n: string) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const sentColor = (v: number | null) => {
    if (v === null) return "var(--sn-w35)";
    if (v >= 7) return "var(--sn-green)";
    if (v >= 5.5) return "var(--sn-amber)";
    return "var(--sn-red)";
  };

  const totalContacts = detail?.kpis.totalContacts ?? campaign.total;
  const totalCalls = detail?.kpis.totalCalls ?? campaign.done;
  const completedCalls = detail?.kpis.completed ?? 0;
  const averageDurationSec = detail?.kpis.avgDurationSec ?? 0;
  const sentimentValues = detail?.insights.flatMap((insight) => insight.sentimentScore === null ? [] : [insight.sentimentScore]) ?? [];
  const averageSentiment = sentimentValues.length
    ? sentimentValues.reduce((sum, value) => sum + value, 0) / sentimentValues.length
    : campaign.sentiment;
  const pct = totalContacts ? Math.round((completedCalls / totalContacts) * 100) : 0;
  const campPct = pct + "%";
  const campProgress = fmt(completedCalls) + " / " + fmt(totalContacts);
  const campSentiment = averageSentiment !== null && Number.isFinite(averageSentiment) ? averageSentiment.toFixed(1) : "—";
  const campSentimentColor = sentColor(averageSentiment);
  const topics = analytics?.topics ?? [];
  const nps = analytics?.nps ?? null;

  // Tab Header Styling helper
  const tabHeaderStyle = (tabName: typeof activeTab) => {
    const active = activeTab === tabName;
    return {
      padding: "11px 16px",
      fontSize: "14px",
      fontWeight: 600,
      cursor: "pointer",
      whiteSpace: "nowrap" as const,
      color: active ? "var(--sn-text)" : "var(--sn-w45)",
      borderBottom: `2px solid ${active ? "#0052FF" : "transparent"}`,
      marginBottom: "-1px",
      transition: "all 0.15s ease",
    };
  };

  // Q1 note bars data
  const resultQuestions = analytics?.questions.filter((question) => question.kind !== "NPS") ?? [];
  const answeredQuestions = resultQuestions.filter((question) => question.responseCount > 0);
  const q1 = answeredQuestions[0] ?? resultQuestions[0];
  const q2 = answeredQuestions.find((question) => question.id !== q1?.id)
    ?? resultQuestions.find((question) => question.id !== q1?.id);
  const remainingQuestions = resultQuestions.filter((question) => question.id !== q1?.id && question.id !== q2?.id);
  const q1Number = q1 ? resultQuestions.findIndex((question) => question.id === q1.id) + 1 : 1;
  const q2Number = q2 ? resultQuestions.findIndex((question) => question.id === q2.id) + 1 : 2;
  const q1Max = Math.max(...(q1?.distribution.map((item) => item.percentage) ?? [1]));
  const q1Bars = (q1?.distribution ?? []).map((item, index) => ({
    note: item.label,
    pct: `${item.percentage}%`,
    h: `${Math.round(6 + (item.percentage / q1Max) * 78)}px`,
    color: index === 0 ? "var(--sn-green)" : index === 1 ? "#0052FF" : index === 2 ? "var(--sn-amber)" : "var(--sn-red)",
  }));
  const q2Rows = (q2?.distribution ?? []).map((item, index) => ({ label: item.label, pct: `${item.percentage}%`, color: index === 0 ? "var(--sn-green)" : index === 1 ? "#0052FF" : index === 2 ? "var(--sn-amber)" : "var(--sn-red)" }));
  const cities = analytics?.cities ?? [];
  const cityMax = Math.max(...(cities.map((city) => city.calls)), 1);

  const applyCampaignAction = async (action: "pause" | "resume") => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/pause`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Action impossible.");
      setStOver((previous) => ({ ...previous, [campaign.id]: action === "pause" ? "paused" : "live" }));
      pushToast(payload.data.message, action === "pause" ? "warn" : "ok");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Action impossible.", "warn");
    }
  };

  const exportCampaignCsv = () => {
    window.location.assign(`/api/campaigns/${campaign.id}/export?format=csv`);
  };
  const generateCampaignReport = async () => {
    if (generatingReport) return;
    setGeneratingReport(true);
    try {
      const response = await fetch("/api/reports", { method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ campaignId: campaign.id }) });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Génération impossible.");
      pushToast("Rapport généré. Ouverture de l'onglet Rapports…", "ok");
      router.push(`/dashboard/reports?report=${encodeURIComponent(payload.data.id)}`);
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Génération impossible.", "warn");
    } finally {
      setGeneratingReport(false);
    }
  };

  const retryPendingContacts = async () => {
    if (retryingContacts) return;
    setRetryingContacts(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/retry`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Relance impossible.");
      pushToast(payload.data.message, payload.data.processed > 0 ? "ok" : "warn");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Relance impossible.", "warn");
    } finally {
      setRetryingContacts(false);
    }
  };

  const launchCampaign = async () => {
    if (launching) return;
    setLaunching(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/launch`, {
        method: "POST",
        credentials: "include",
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Lancement impossible.");
      setStOver((previous) => ({ ...previous, [campaign.id]: "live" }));
      setDetail((previous) => previous ? { ...previous, status: "RUNNING" } : previous);
      pushToast(payload.data.message, "ok");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Lancement impossible.", "warn");
    } finally {
      setLaunching(false);
    }
  };

  // Pausing Campaign logic
  const handlePauseToggle = () => {
    if (currentStatus === "live") {
      setConfirm({
        title: "Mettre la campagne en pause ?",
        desc: "Les appels en cours se terminent normalement, mais aucun nouvel appel ne sera lancé jusqu'à la reprise. Le crédit n'est pas décompté pendant la pause.",
        label: "Mettre en pause",
        danger: false,
        action: () => {
          void applyCampaignAction("pause");
        },
      });
    } else {
      void applyCampaignAction("resume");
    }
  };

  const pauseLabel = currentStatus === "live" ? "Pause" : "Reprendre";
  const campCanPause = currentStatus === "live" || currentStatus === "paused";
  const campCanLaunch = currentStatus === "draft" || currentStatus === "scheduled";
  const retryableContacts = campaignContacts.filter((contact) => contact.status === "PENDING" && contact.attempts > 0);

  return (
    <div data-screen-label="Détail campagne" style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "snFadeUp .45s ease both" }}>
      
      {/* Back button */}
      <Link href="/dashboard/campaigns" className="sn-hover-text" style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13px", fontWeight: 500, color: "var(--sn-w5)", cursor: "pointer", width: "fit-content", textDecoration: "none" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"></path></svg>
        Campagnes
      </Link>

      {/* Header Info */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <h1 style={{ margin: 0, fontSize: "25px", fontWeight: 700, letterSpacing: "-.015em" }}>{campaign.name}</h1>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "11.5px", fontWeight: 600, color: st.color, background: st.bg, padding: "5px 11px", borderRadius: 14 }}>{st.label}</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w42)", marginTop: "8px" }}>
            {campaign.sector} · {fmt(totalContacts)} CONTACTS · VOIX : {campaign.voice ?? "—"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          {campCanLaunch && (
            <button disabled={launching} onClick={() => { void launchCampaign(); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0052FF", color: "#fff", border: "none", borderRadius: "11px", padding: "10px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 700, cursor: launching ? "wait" : "pointer", opacity: launching ? .65 : 1 }} className="sn-hover-btn-primary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5L7 4.5z"></path></svg>
              {launching ? "Lancement…" : "Lancer la campagne"}
            </button>
          )}
          {campCanPause && (
            <button onClick={handlePauseToggle} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--sn-panel2)", color: "var(--sn-text)", border: "1px solid var(--sn-w12)", borderRadius: "11px", padding: "10px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 600, cursor: "pointer" }} className="sn-hover-border">
              {currentStatus === "live" ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M9 5v14M15 5v14"></path></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5L7 4.5z"></path></svg>
              )}
              {pauseLabel}
            </button>
          )}
          {currentStatus === "live" && retryableContacts.length > 0 && (
            <button disabled={retryingContacts} onClick={() => { void retryPendingContacts(); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--sn-panel2)", color: "var(--sn-text)", border: "1px solid var(--sn-w12)", borderRadius: "11px", padding: "10px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 600, cursor: retryingContacts ? "wait" : "pointer", opacity: retryingContacts ? .65 : 1 }} className="sn-hover-border">
              {retryingContacts ? "Relance…" : `Relancer (${retryableContacts.length})`}
            </button>
          )}
          <button onClick={exportCampaignCsv} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "var(--sn-panel2)", color: "var(--sn-text)", border: "1px solid var(--sn-w12)", borderRadius: "11px", padding: "10px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 600, cursor: "pointer" }} className="sn-hover-border">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5"></path><path d="M4 19h16"></path></svg>
            Export CSV
          </button>
          <button disabled={generatingReport} onClick={() => { void generateCampaignReport(); }} style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0052FF", color: "#fff", border: "none", borderRadius: "11px", padding: "10px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 700, cursor: generatingReport ? "wait" : "pointer", opacity: generatingReport ? .65 : 1 }} className="sn-hover-btn-primary">
            {generatingReport ? "Génération…" : "Générer le rapport"}
          </button>
        </div>
      </div>

      {/* Tabs list */}
      <div style={{ display: "flex", gap: "4px", borderBottom: "1px solid var(--sn-w07)", overflowX: "auto" }}>
        <div onClick={() => setActiveTab("overview")} style={tabHeaderStyle("overview")}>Vue générale</div>
        <div onClick={() => setActiveTab("results")} style={tabHeaderStyle("results")}>Résultats</div>
        <div onClick={() => setActiveTab("calls")} style={tabHeaderStyle("calls")}>Appels</div>
        <div onClick={() => setActiveTab("contacts")} style={tabHeaderStyle("contacts")}>Contacts</div>
        <div onClick={() => setActiveTab("settings")} style={tabHeaderStyle("settings")}>Paramètres</div>
      </div>

      {/* Tab Contents */}
      
      {/* 1. Overview */}
      {activeTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px" }}>
            <div style={{ display: "flex", flexDirection: "column", background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>APPELS PASSÉS</div>
              <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "8px" }}>{fmt(totalCalls)}</div>
              <div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "auto", paddingTop: "4px" }}>sur {fmt(totalContacts)} contacts</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>TAUX DE RÉPONSE</div>
              <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "8px" }}>{detail ? `${detail.kpis.responseRate}%` : campaign.responseRate || "—"}</div>
              <div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "auto", paddingTop: "4px" }}>calculé sur les appels de cette campagne</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>DURÉE MOYENNE</div>
              <div style={{ fontSize: "28px", fontWeight: 700, marginTop: "8px" }}>{averageDurationSec ? `${Math.floor(averageDurationSec / 60)}:${String(averageDurationSec % 60).padStart(2, "0")}` : "—"}</div>
              <div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "auto", paddingTop: "4px" }}>sur les appels terminés</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "18px" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".12em", color: "var(--sn-w45)" }}>SENTIMENT MOYEN</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "5px", marginTop: "8px" }}>
                <span style={{ fontSize: "28px", fontWeight: 700, color: campSentimentColor }}>{campSentiment}</span>
                <span style={{ fontSize: "14px", color: "var(--sn-w45)" }}>/10</span>
              </div>
              <div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "auto", paddingTop: "4px" }}>selon les analyses enregistrées</div>
            </div>
          </div>

          <div id="sn-camprow" style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "14px" }}>
            
            {/* Key Verbatims */}
            <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>Points clés détectés par l’IA</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".1em", color: "var(--sn-w4)", marginTop: "5px" }}>
                THÈMES EXTRAITS — {fmt(detail?.insights.length ?? 0)} APPELS ANALYSÉS
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "18px" }}>
                {topics.length ? topics.map((topic, index) => <div key={topic.label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ width: 34, height: 34, minWidth: 34, borderRadius: 10, background: "rgba(0,82,255,.13)", color: "var(--sn-blue2)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700 }}>{index + 1}</span>
                  <div style={{ flex: 1 }}><div style={{ fontSize: "14px", fontWeight: 500 }}>{topic.label}</div><div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "2px" }}>{topic.count} mention(s) dans les analyses</div></div>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--sn-blue2)" }}>{topic.percentage}%</span>
                </div>) : <div style={{ color: "var(--sn-w45)", fontSize: "13px" }}>Les thèmes apparaîtront après les premiers appels analysés.</div>}
              </div>
            </div>

            {/* Progression */}
            <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>Progression</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "14px" }}>
                <span style={{ fontSize: "34px", fontWeight: 700 }}>{campPct}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--sn-w45)" }}>{campProgress}</span>
              </div>
              <div style={{ height: "8px", background: "var(--sn-w08)", borderRadius: "5px", marginTop: "12px", overflow: "hidden" }}>
                <div style={{ width: campPct, height: "100%", background: "linear-gradient(90deg, #0052FF, #00D4A6)", borderRadius: "5px", transition: "width .8s ease" }}></div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
                <div style={{ display: "flex", fontSize: "13px", justifyContent: "space-between" }}><span style={{ color: "var(--sn-w55)" }}>Enquêtes complétées</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{completedCalls}</span></div>
                <div style={{ display: "flex", fontSize: "13px", justifyContent: "space-between" }}><span style={{ color: "var(--sn-w55)" }}>Non joignables</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{detail?.kpis.failed ?? 0}</span></div>
                <div style={{ display: "flex", fontSize: "13px", justifyContent: "space-between" }}><span style={{ color: "var(--sn-w55)" }}>Messagerie vocale</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{detail?.kpis.voicemail ?? 0}</span></div>
                <div style={{ display: "flex", fontSize: "13px", justifyContent: "space-between" }}><span style={{ color: "var(--sn-w55)" }}>Transferts agent humain</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{detail?.kpis.transferred ?? 0}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Results */}
      {activeTab === "results" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          
          <div id="sn-camprow" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "14px" }}>
            
            {/* NPS Card */}
            <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>Score NPS</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".1em", color: "var(--sn-w4)", marginTop: "5px" }}>{nps ? `« ${nps.label.toUpperCase()} »` : "AUCUNE QUESTION NPS CONFIGURÉE"}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginTop: "16px" }}>
                <span style={{ fontSize: "44px", fontWeight: 700, letterSpacing: "-.02em", color: nps?.score === null || !nps ? "var(--sn-w45)" : nps.score >= 30 ? "var(--sn-green)" : nps.score >= 0 ? "var(--sn-amber)" : "var(--sn-red)" }}>{nps?.score === null || !nps ? "—" : `${nps.score > 0 ? "+" : ""}${nps.score}`}</span>
                <span style={{ fontSize: "12.5px", color: "var(--sn-w45)" }}>{nps ? `${nps.responseCount} réponse(s) exploitable(s)` : "Le NPS apparaîtra si le brief contient une question de recommandation."}</span>
              </div>
              <div style={{ display: "flex", height: "9px", borderRadius: "5px", overflow: "hidden", marginTop: "14px", gap: "2px" }}>
                <span style={{ width: `${nps?.promoters.percentage ?? 0}%`, background: "var(--sn-green)" }}></span>
                <span style={{ width: `${nps?.passives.percentage ?? 0}%`, background: "var(--sn-amber)" }}></span>
                <span style={{ width: `${nps?.detractors.percentage ?? 0}%`, background: "var(--sn-red)" }}></span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px" }}><span style={{ width: "9px", height: "9px", borderRadius: "3px", background: "var(--sn-green)" }}></span><span style={{ flex: 1, color: "var(--sn-w7)" }}>Promoteurs (9–10)</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{nps?.promoters.percentage ?? 0}%</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px" }}><span style={{ width: "9px", height: "9px", borderRadius: "3px", background: "var(--sn-amber)" }}></span><span style={{ flex: 1, color: "var(--sn-w7)" }}>Passifs (7–8)</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{nps?.passives.percentage ?? 0}%</span></div>
                <div style={{ display: "flex", alignItems: "center", gap: "9px", fontSize: "13px" }}><span style={{ width: "9px", height: "9px", borderRadius: "3px", background: "var(--sn-red)" }}></span><span style={{ flex: 1, color: "var(--sn-w7)" }}>Détracteurs (0–6)</span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{nps?.detractors.percentage ?? 0}%</span></div>
              </div>
            </div>

            {/* Histogram Notes Q1 */}
            <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{q1 ? `Q${q1Number} — ${q1.label}` : "Question structurée"}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".1em", color: "var(--sn-w4)", marginTop: "5px" }}>{q1 ? `${q1.responseCount} RÉPONSES ENREGISTRÉES` : "AUCUNE QUESTION CONFIGURÉE"}</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "6px", height: "120px", marginTop: "18px" }}>
                {q1Bars.map((b, idx) => (
                  <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", height: "100%", justifyContent: "flex-end" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "var(--sn-w4)" }}>{b.pct}</span>
                    <div style={{ width: "100%", height: b.h, background: b.color, borderRadius: "5px 5px 2px 2px", minHeight: "3px" }}></div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", color: "var(--sn-w45)" }}>{b.note}</span>
                  </div>
                ))}
                {q1Bars.length === 0 && <div style={{ width: "100%", alignSelf: "center", textAlign: "center", color: "var(--sn-w45)", fontSize: "12px" }}>Le graphique apparaîtra après une réponse exploitable.</div>}
              </div>
            </div>
          </div>

          {remainingQuestions.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
              {remainingQuestions.map((question) => (
                <div key={question.id} style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
                  <div style={{ fontSize: "16px", fontWeight: 700 }}>{`Q${resultQuestions.findIndex((item) => item.id === question.id) + 1} — ${question.label}`}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".1em", color: "var(--sn-w4)", marginTop: "5px" }}>{question.responseCount} RÉPONSE(S) ENREGISTRÉE(S)</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "13px", marginTop: "18px" }}>
                    {question.distribution.slice(0, 8).map((answer, answerIndex) => (
                      <div key={`${question.id}-${answer.label}`} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", fontSize: "13px" }}>
                          <span style={{ color: "var(--sn-w7)", overflow: "hidden", textOverflow: "ellipsis" }}>{answer.label}</span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", whiteSpace: "nowrap" }}>{answer.percentage}%</span>
                        </div>
                        <div style={{ height: "7px", background: "var(--sn-w08)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{ width: `${answer.percentage}%`, height: "100%", background: answerIndex === 0 ? "var(--sn-green)" : answerIndex === 1 ? "#0052FF" : "var(--sn-amber)", borderRadius: "4px" }}></div>
                        </div>
                      </div>
                    ))}
                    {question.responseCount === 0 && <div style={{ fontSize: "12px", color: "var(--sn-w45)" }}>Aucune réponse structurée enregistrée pour cette question.</div>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div id="sn-camprow" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            
            {/* Q2 wait time percipient */}
            <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>{q2 ? `Q${q2Number} — ${q2.label}` : "Question structurée"}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "13px", marginTop: "18px" }}>
                {q2Rows.map((r, idx) => (
                  <div key={idx} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                      <span style={{ color: "var(--sn-w7)" }}>{r.label}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>{r.pct}</span>
                    </div>
                    <div style={{ height: "7px", background: "var(--sn-w08)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: r.pct, height: "100%", background: r.color, borderRadius: "4px" }}></div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: "12px", color: "var(--sn-w45)", marginTop: "16px", lineHeight: "1.55" }}>{q2 ? `${q2.responseCount} réponses structurées enregistrées pour cette question.` : "Aucune deuxième question structurée n'est configurée."}</div>
            </div>

            {/* Cities sentiment */}
            <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>Sentiment par ville</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", letterSpacing: ".1em", color: "var(--sn-w4)", marginTop: "5px" }}>{cities.reduce((total, city) => total + city.calls, 0)} APPELS GÉOLOCALISÉS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "11px", marginTop: "16px" }}>
                {cities.map((c, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ width: "124px", minWidth: "124px", fontSize: "13px", color: "var(--sn-w7)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                    <div style={{ flex: 1, height: "7px", background: "var(--sn-w08)", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${Math.round((c.calls / cityMax) * 100)}%`, height: "100%", background: "linear-gradient(90deg, #0052FF, #00D4A6)", borderRadius: "4px" }}></div>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--sn-w45)", width: "56px", textAlign: "right" }}>{c.calls}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", fontWeight: 700, color: sentColor(c.sentiment), width: "32px", textAlign: "right" }}>{c.sentiment ?? "—"}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Calls List */}
      {activeTab === "calls" && (
        <>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["all", "completed", "unreachable", "voicemail", "failed"].map((status) => <button key={status} onClick={() => setCallFilter(status)} style={{ border: "1px solid var(--sn-w12)", borderRadius: "18px", padding: "7px 11px", background: callFilter === status ? "rgba(0,82,255,.16)" : "var(--sn-panel)", color: callFilter === status ? "var(--sn-blue3)" : "var(--sn-w6)", cursor: "pointer", fontSize: "12px", fontWeight: 600 }}>{status === "all" ? "Tous" : CALL_STATUS_DICT[status as keyof typeof CALL_STATUS_DICT]?.label}</button>)}
          </div>
          {filteredCallRows.length > 0 ? (
            <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", overflowX: "auto" }}>
              <div style={{ minWidth: "760px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 90px 90px 110px 130px 36px", gap: "12px", alignItems: "center", padding: "14px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w38)", borderBottom: "1px solid var(--sn-w06)" }}>
                  <span>CONTACT</span>
                  <span>HEURE</span>
                  <span>DURÉE</span>
                  <span>SENTIMENT</span>
                  <span>STATUT</span>
                  <span></span>
                </div>
                {filteredCallRows.map((a) => {
                  const cst = CALL_STATUS_DICT[a.status] || CALL_STATUS_DICT.completed;
                  const canOpen = !!a.summary;
                  return (
                    <div
                      key={a.id}
                      onClick={() => {
                        if (canOpen) setCallId(a.id);
                      }}
                      className={canOpen ? "sn-hover-w03" : ""}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 90px 90px 110px 130px 36px",
                        gap: "12px",
                        alignItems: "center",
                        padding: "14px 20px",
                        borderBottom: "1px solid var(--sn-w04)",
                        cursor: canOpen ? "pointer" : "default",
                        opacity: canOpen ? "1" : ".55",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "34px",
                            height: "34px",
                            minWidth: "34px",
                            borderRadius: "10px",
                            background: canOpen ? "rgba(0,82,255,.15)" : "var(--sn-w06)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            fontWeight: 700,
                            color: canOpen ? "var(--sn-blue3)" : "var(--sn-w45)",
                          }}
                        >
                          {initials(a.name)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--sn-text)" }}>{a.name}</div>
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w38)", marginTop: "2px" }}>{a.city}</div>
                        </div>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", color: "var(--sn-w6)" }}>{a.time}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px" }}>{a.dur || "—"}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", color: sentColor(a.sentiment) }}>
                        {a.sentiment !== null ? a.sentiment.toFixed(1) : "—"}
                      </span>
                      <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11.5px", fontWeight: 600, color: cst.color, background: cst.bg, padding: "5px 10px", borderRadius: "14px", whiteSpace: "nowrap", width: "fit-content" }}>
                        {cst.label}
                      </span>
                      {canOpen ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--sn-w35)" }}>
                          <path d="M9 5l7 7-7 7" />
                        </svg>
                      ) : (
                        <span></span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ background: "var(--sn-panel)", border: "1px dashed var(--sn-w14)", borderRadius: "16px", padding: "60px 20px", textAlign: "center" }}>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--sn-w7)" }}>Aucun appel pour le moment</div>
              <div style={{ fontSize: "13px", color: "var(--sn-w4)", marginTop: "6px" }}>Les appels apparaîtront ici dès le lancement de la campagne.</div>
            </div>
          )}
        </>
      )}

      {/* 4. Contacts List */}
      {activeTab === "contacts" && (
        <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", overflowX: "auto" }}>
          <div style={{ minWidth: "760px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.8fr 160px 130px 110px 110px 90px", gap: "12px", alignItems: "center", padding: "14px 20px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w38)", borderBottom: "1px solid var(--sn-w06)" }}>
              <span>CONTACT</span>
              <span>TÉLÉPHONE</span>
              <span>VILLE</span>
              <span>SEGMENT</span>
              <span>STATUT</span>
              <span style={{ textAlign: "center" }}>TENTATIVES</span>
            </div>
            {campaignContacts.map((ct) => {
              const statusKey = (ct.status === "PENDING" && ct.attempts > 0 ? "retry" : ct.status.toLowerCase()) as keyof typeof CONTACT_STATUS_DICT;
              const cst = CONTACT_STATUS_DICT[statusKey] ?? CONTACT_STATUS_DICT.pending;
              const name = [ct.firstName, ct.lastName].filter(Boolean).join(" ") || "—";
              const latestCall = latestCallByContact.get(ct.id);
              return (
                <div
                  key={ct.id}
                  onClick={() => { if (latestCall) setCallId(latestCall.id); }}
                  role={latestCall ? "button" : undefined}
                  tabIndex={latestCall ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (latestCall && (event.key === "Enter" || event.key === " ")) setCallId(latestCall.id);
                  }}
                  aria-label={latestCall ? `Ouvrir le détail de l'appel de ${name}` : undefined}
                  style={{ display: "grid", gridTemplateColumns: "1.8fr 160px 130px 110px 110px 90px", gap: "12px", alignItems: "center", padding: "14px 20px", borderBottom: "1px solid var(--sn-w04)", cursor: latestCall ? "pointer" : "default" }}
                  className={latestCall ? "sn-hover-w03" : ""}
                >
                  <span style={{ fontSize: "14px", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--sn-text)" }}>{name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--sn-w6)" }}>{ct.phone}</span>
                  <span style={{ fontSize: "13px", color: "var(--sn-w6)" }}>{ct.city ?? "—"}</span>
                  <span style={{ fontSize: "12.5px", color: "var(--sn-w6)" }}>{ct.segment ?? "—"}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11.5px", fontWeight: 600, color: cst.color, background: cst.bg, padding: "5px 10px", borderRadius: "14px", whiteSpace: "nowrap", width: "fit-content" }}>
                    {cst.label}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", textAlign: "center" }}>{ct.attempts}</span>
                </div>
              );
            })}
            {campaignContacts.length === 0 && <div style={{ padding: "24px 20px", color: "var(--sn-w45)", fontSize: "13px" }}>Aucun contact pour cette campagne.</div>}
          </div>
        </div>
      )}

      {/* 5. Campaign Settings */}
      {activeTab === "settings" && (
        <div id="sn-camprow" style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "14px" }}>
          
          {/* Rules Card */}
          <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700 }}>Règles d’appel</div>
            <div style={{ display: "flex", flexDirection: "column", marginTop: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Plage horaire</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{campaign.rules?.hours || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Tentatives max</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{campaign.rules?.maxAttempts ?? "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Délai entre tentatives</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{campaign.rules?.retryDelay || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Durée max par appel</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{campaign.rules?.maxDuration || "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", borderBottom: "1px solid var(--sn-w05)", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Appels simultanés</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{campaign.rules?.concurrency ?? "—"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "13px 0", fontSize: "13.5px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Voix IA</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace" }}>{campaign.voice || "—"}</span>
              </div>
            </div>
          </div>

          {/* Prompt Brief Card */}
          <div style={{ background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "16px", padding: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "16px", fontWeight: 700 }}>Brief IA</div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".1em", color: "var(--sn-w4)" }}>
                PROMPT CONVERSATIONNEL — MODÈLE CONFIGURÉ CÔTÉ SERVEUR
              </span>
            </div>
            <div
              style={{
                marginTop: "14px",
                background: "var(--sn-inset)",
                border: "1px solid var(--sn-w06)",
                borderRadius: "12px",
                padding: "18px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12.5px",
                lineHeight: 1.75,
                color: "var(--sn-w72)",
              }}
            >
              {campaign.brief || "Aucun brief enregistré pour cette campagne."}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
