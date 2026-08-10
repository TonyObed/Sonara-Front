"use client";

import React, { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import "./dashboard.css";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import { api } from "@/lib/api-client";
import { useCall } from "@/hooks/useSonara";

// Heuristique : un tour de parole côté "assistant" (IA) selon le speaker Vapi.
const isAiSpeaker = (speaker: string | undefined): boolean =>
  /assist|bot|awa|^ia$|^ai$/i.test(speaker ?? "");

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const photoInputRef = useRef<HTMLInputElement>(null);
  
  const {
    view,
    setView,
    tab,
    setTab,
    campaignId,
    setCampaignId,
    callId,
    setCallId,
    menuOpen,
    setMenuOpen,
    kcr,
    tick,
    theme,
    toggleTheme,
    notifOpen,
    setNotifOpen,
    profileOpen,
    setProfileOpen,
    faqOpen,
    setFaqOpen,
    company,
    setCompany,
    profile,
    setProfile,
    companyEdit,
    setCompanyEdit,
    companyDraft,
    setCompanyDraft,
    profileModalOpen,
    setProfileModalOpen,
    profileDraft,
    setProfileDraft,
    plan,
    setPlan,
    autoRecharge,
    toggleAutoRecharge,
    notifUnread,
    setNotifUnread,
    notifFilter,
    setNotifFilter,
    toasts,
    pushToast,
    confirm,
    setConfirm,
    stOver,
    searchQ,
    setSearchQ,
    playing,
    setPlaying,
    playT,
    setPlayT,
    testCall,
    testNum,
    setTestNum,
    chartRange,
    setChartRange,
    go,
    persistAccount,
    markAllRead,
    startTestCall,
    
    campaigns,
    liveCalls,
    dashboard,
    directory,
    reports,
    team,
    notifications,
    plans,
  } = useDashboard();

  // Route synchronization
  useEffect(() => {
    if (pathname === "/dashboard") setViewState("home");
    else if (pathname.startsWith("/dashboard/campaigns/new")) setViewState("new");
    else if (pathname.startsWith("/dashboard/campaigns/")) setViewState("campaign");
    else if (pathname.startsWith("/dashboard/campaigns")) setViewState("campaigns");
    else if (pathname.startsWith("/dashboard/contacts")) setViewState("contacts");
    else if (pathname.startsWith("/dashboard/reports")) setViewState("reports");
    else if (pathname.startsWith("/dashboard/live")) setViewState("live");
    else if (pathname.startsWith("/dashboard/settings")) setViewState("settings");
    else if (pathname.startsWith("/dashboard/billing")) setViewState("billing");
    else if (pathname.startsWith("/dashboard/support")) setViewState("support");
    else if (pathname.startsWith("/dashboard/notifications")) setViewState("notifications");
  }, [pathname]);

  const setViewState = (v: string) => {
    setView(v);
  };

  // Helper functions matching original code logic
  const fmt = (n: number) => Math.round(n).toLocaleString("fr-FR");
  const initials = (n: string) =>
    n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const avBgOf = (_photo: string | null) => "linear-gradient(135deg, #0052FF, #00D4A6)";
  const avatarSrc = (photo: string | null) => photo ? "/api/auth/avatar/image" : undefined;

  const closeCall = () => {
    setPlaying(false);
    setPlayT(0);
    setCallId(null);
  };

  const parseDuration = (dStr: string | null) => {
    if (!dStr || dStr === "—") return 0;
    const pts = dStr.split(":");
    if (pts.length !== 2) return 0;
    return parseInt(pts[0], 10) * 60 + parseInt(pts[1], 10);
  };

  const mmssP = (s: number) =>
    Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0");

  const mmss = (s: number) =>
    Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");

  // Détail d'appel réel (transcription + résumé) via l'API ; null si aucun appel ouvert.
  const { data: apiCall } = useCall(callId);
  const activeCall = apiCall
    ? {
        id: apiCall.id,
        name:
          [apiCall.contact.firstName, apiCall.contact.lastName].filter(Boolean).join(" ").trim() ||
          apiCall.contact.phone,
        phone: apiCall.contact.phone,
        city: apiCall.contact.city ?? "",
        time: apiCall.startedAt
          ? new Date(apiCall.startedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
          : "—",
        dur:
          apiCall.durationSec !== null && apiCall.durationSec !== undefined
            ? `${Math.floor(apiCall.durationSec / 60)}:${String(apiCall.durationSec % 60).padStart(2, "0")}`
            : null,
        // Sentiment / humeur / action recommandée ne sont pas exposés par l'API (Phase 2).
        sentiment: null as number | null,
        mood: null as string | null,
        summary: apiCall.summary ?? "",
        action: null as { label: string; kind: "ok" | "warn" | "alert" } | null,
        transcript: (apiCall.transcript ?? []).map((t) => ({
          ai: isAiSpeaker(t.speaker),
          time: t.timestamp ?? "",
          text: t.text,
        })),
      }
    : null;
  const durS = activeCall ? parseDuration(activeCall.dur) : 0;
  const playFrac = durS ? Math.min(1, playT / durS) : 0;

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    const start = playT >= durS ? 0 : playT;
    setPlayT(start);
    setPlaying(true);
  };

  // Search filter
  const q = searchQ.trim().toLowerCase();
  const campHits = q
    ? campaigns
        .filter((c) => c.name.toLowerCase().includes(q) || c.sector.toLowerCase().includes(q))
        .slice(0, 4)
        .map((c) => ({
          label: c.name,
          sub: "CAMPAGNE · " + (stOver[c.id] || c.status).toUpperCase(),
          glyph: "◎",
          iconBg: "rgba(0,82,255,.13)",
          iconColor: "var(--sn-blue2)",
          open: () => {
            setSearchQ("");
            router.push(`/dashboard/campaigns/${c.id}`);
          },
        }))
    : [];

  const contactHits = q
    ? directory
        .filter(
          (d) =>
            d.name.toLowerCase().includes(q) ||
            d.city.toLowerCase().includes(q) ||
            d.phone.replace(/\s/g, "").includes(q.replace(/\s/g, ""))
        )
        .slice(0, 4)
        .map((d) => ({
          label: d.name,
          sub: "CONTACT · " + d.city.toUpperCase() + " · " + d.phone,
          glyph: initials(d.name),
          iconBg: "var(--sn-w07)",
          iconColor: "var(--sn-w75)",
          open: () => {
            setSearchQ("");
            router.push(`/dashboard/contacts`);
          },
        }))
    : [];

  const searchResults = campHits.concat(contactHits);

  // Notifications Popover
  const decoNotifs = notifications.map((n) => {
    const unread = notifUnread.includes(n.id);
    return {
      ...n,
      unread,
      dotBg: unread ? "#0052FF" : "transparent",
      iconBg:
        n.kind === "alert"
          ? "rgba(255,92,92,.11)"
          : n.kind === "ok"
          ? "rgba(43,213,118,.11)"
          : n.kind === "warn"
          ? "rgba(255,176,46,.11)"
          : "rgba(0,82,255,.13)",
      iconColor:
        n.kind === "alert"
          ? "var(--sn-red)"
          : n.kind === "ok"
          ? "var(--sn-green)"
          : n.kind === "warn"
          ? "var(--sn-amber)"
          : "var(--sn-blue2)",
      glyph: n.kind === "alert" ? "!" : n.kind === "ok" ? "✓" : n.kind === "warn" ? "◔" : "↧",
      open: () => {
        setNotifUnread((prev) => prev.filter((id) => id !== n.id));
        setNotifOpen(false);
        setProfileOpen(false);
        setMenuOpen(false);
        if (n.target === "campaign:c1:calls") {
          router.push(`/dashboard/campaigns/c1?tab=calls`);
        } else if (n.target === "billing") {
          router.push(`/dashboard/billing`);
        } else if (n.target === "contacts") {
          router.push(`/dashboard/contacts`);
        } else if (n.target === "reports") {
          router.push(`/dashboard/reports`);
        } else if (n.target === "campaigns") {
          router.push(`/dashboard/campaigns`);
        } else if (n.target === "settings") {
          router.push(`/dashboard/settings`);
        }
      },
    };
  });

  const popoverNotifications = decoNotifs.slice(0, 4);

  // Audio player bar heights
  const audioBars = Array.from({ length: 44 }, (_, i) => {
    const val = Math.abs(Math.sin(i * 1.7) * Math.sin(i * 0.43 + 2));
    return {
      h: Math.round(5 + val * 26) + "px",
      c: i < Math.round(playFrac * 44) ? "linear-gradient(180deg,#0052FF,#00D4A6)" : "var(--sn-w16)",
    };
  });

  // Action styles for transcription drawer
  const actionStyles = {
    ok: { c: "var(--sn-green)", bg: "rgba(43,213,118,.09)", bd: "rgba(43,213,118,.3)" },
    warn: { c: "var(--sn-amber)", bg: "rgba(255,176,46,.09)", bd: "rgba(255,176,46,.3)" },
    alert: { c: "var(--sn-red)", bg: "rgba(255,92,92,.09)", bd: "rgba(255,92,92,.3)" },
  };
  const as = activeCall ? actionStyles[activeCall.action?.kind || "ok"] : actionStyles.ok;

  // Short transcription fallback if not id = 1
  const shortTranscript = activeCall
    ? [
        { ai: true, time: "00:02", text: "Bonjour, est-ce que je parle bien à " + activeCall.name + " ?" },
        { ai: false, time: "00:05", text: "Oui, c'est moi." },
        {
          ai: true,
          time: "00:08",
          text:
            "Je suis Awa, j'appelle de la part de Banque Horizon pour un court sondage sur votre expérience en agence. Ça prend trois minutes — vous avez un moment ?",
        },
        { ai: false, time: "00:17", text: "D'accord, on peut faire ça." },
      ]
    : [];

  // Transcription réelle si disponible ; sinon repli court (appel sans transcript stocké).
  const rawTranscript = activeCall
    ? activeCall.transcript && activeCall.transcript.length > 0
      ? activeCall.transcript
      : shortTranscript
    : [];

  const transcript = rawTranscript.map((t) => {
    const isAi = "ai" in t ? t.ai : (t as any).speaker === "ai";
    return {
      isAi,
      who: isAi ? "AWA · IA" : "CLIENT",
      time: t.time,
      text: t.text,
      align: isAi ? "flex-start" : "flex-end",
      bg: isAi ? "rgba(0,82,255,.1)" : "var(--sn-bubble)",
      bd: isAi ? "rgba(0,82,255,.28)" : "var(--sn-w07)",
      radius: isAi ? "4px 14px 14px 14px" : "14px 4px 14px 14px",
    };
  });

  // Nav styles
  const getNavStyle = (v: string) => {
    const active = view === v;
    return {
      background: active ? "rgba(0,82,255,.16)" : "transparent",
      color: active ? "var(--sn-text)" : "var(--sn-w62)",
    };
  };

  // Profile pick photo
  const handlePhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const size = 256;
        const cv = document.createElement("canvas");
        cv.width = size;
        cv.height = size;
        const ctx = cv.getContext("2d");
        if (ctx) {
          const s = Math.min(img.width, img.height);
          ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
          const url = cv.toDataURL("image/jpeg", 0.85);
          if (profileDraft) {
            setProfileDraft({ ...profileDraft, photo: url });
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const handleProfileSave = () => {
    if (profileDraft) {
      setProfile(profileDraft);
      persistAccount(company, profileDraft);
      pushToast("Profil mis à jour", "ok");
    }
    setProfileModalOpen(false);
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await fetch("/api/auth/avatar", { method: "POST", credentials: "include", body: formData });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.error?.message ?? "Upload impossible.");
      if (profileDraft) setProfileDraft({ ...profileDraft, photo: payload.data.avatarUrl });
      pushToast("Photo envoyee.", "ok");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Upload impossible.", "warn");
    }
  };

  const handlePersistentProfileSave = async () => {
    if (!profileDraft) return;
    const [firstName, ...lastNameParts] = profileDraft.name.trim().split(/\s+/);
    try {
      const result = await api.auth.updateProfile({
        firstName: firstName || undefined,
        lastName: lastNameParts.join(" ") || undefined,
        email: profileDraft.email,
        avatarUrl: profileDraft.photo,
      });
      const saved = {
        ...profileDraft,
        name: [result.data.firstName, result.data.lastName].filter(Boolean).join(" "),
        email: result.data.email,
        photo: result.data.avatarUrl ?? null,
      };
      setProfile(saved);
      persistAccount(company, saved);
      setProfileModalOpen(false);
      pushToast("Profil mis a jour.", "ok");
    } catch (error) {
      pushToast(error instanceof Error ? error.message : "Enregistrement impossible.", "warn");
    }
  };

  // Déconnexion réelle : vide les cookies de session côté API puis redirige.
  const handleLogout = async () => {
    try {
      await api.auth.logout();
    } catch {
      /* ignore — on redirige quand même */
    }
    router.push("/login");
  };

  const handleCompanySave = () => {
    if (companyDraft) {
      setCompany(companyDraft);
      persistAccount(companyDraft, profile);
      pushToast("Informations entreprise enregistrées", "ok");
    }
    setCompanyEdit(false);
  };

  return (
    <div
      id="sn-root"
      data-theme={theme}
      style={{
        display: "flex",
        height: "100vh",
        width: "100%",
        background: "var(--sn-bg)",
        color: "var(--sn-text)",
        fontFamily: "'Satoshi', sans-serif",
        overflow: "hidden",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      {/* Scrim mobile */}
      <div
        id="sn-scrim"
        onClick={() => setMenuOpen(false)}
        style={{
          display: menuOpen ? "block" : "none",
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.6)",
          zIndex: 49,
          backdropFilter: "blur(2px)",
        }}
      ></div>

      {/* Close popovers on click outside */}
      {(notifOpen || profileOpen) && (
        <div
          onClick={() => {
            setNotifOpen(false);
            setProfileOpen(false);
          }}
          style={{ position: "fixed", inset: 0, zIndex: 65 }}
        ></div>
      )}

      {/* ============ SIDEBAR ============ */}
      <nav
        id="sn-sidebar"
        style={{
          width: "248px",
          minWidth: "248px",
          height: "100%",
          background: "var(--sn-side)",
          borderRight: "1px solid var(--sn-w06)",
          display: "flex",
          flexDirection: "column",
          zIndex: 50,
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform .28s ease",
        }}
      >
        <div style={{ padding: "22px 22px 18px 22px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {theme === "light" ? (
            <img src="/assets/logo-dark.png" alt="Sonara" style={{ height: "28px", display: "block" }} />
          ) : (
            <img src="/assets/logo-white.png" alt="Sonara" style={{ height: "28px", display: "block" }} />
          )}
          <button
            className="sn-sidebar-close"
            onClick={() => setMenuOpen(false)}
            aria-label="Fermer le menu"
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "var(--sn-panel2)",
              border: "1px solid var(--sn-w08)",
              color: "var(--sn-text)",
              cursor: "pointer",
              padding: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "6px 12px", display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w36)", padding: "8px 12px" }}>
              VUE D'ENSEMBLE
            </div>
            <Link
              href="/dashboard"
              className="sn-hover-w05"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14.5px",
                textDecoration: "none",
                ...getNavStyle("home"),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path><path d="M9.5 21v-6h5v6"></path></svg>
              <span>Accueil</span>
            </Link>
            <Link
              href="/dashboard/campaigns"
              className="sn-hover-w05"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14.5px",
                textDecoration: "none",
                ...getNavStyle("campaigns"),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l14-5v12L3 13v-2z"></path><path d="M7 13.5V18a2 2 0 0 0 4 0v-3"></path><path d="M20 9.5a3 3 0 0 1 0 5"></path></svg>
              <span>Campagnes</span>
            </Link>
            <Link
              href="/dashboard/contacts"
              className="sn-hover-w05"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14.5px",
                textDecoration: "none",
                ...getNavStyle("contacts"),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.2"></circle><path d="M3.5 19c.7-3 2.9-4.5 5.5-4.5S13.8 16 14.5 19"></path><path d="M15.5 5.4a3.2 3.2 0 0 1 0 5.2"></path><path d="M17.5 14.8c1.7.7 2.7 2.1 3 4.2"></path></svg>
              <span>Contacts</span>
            </Link>
            <Link
              href="/dashboard/reports"
              className="sn-hover-w05"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14.5px",
                textDecoration: "none",
                ...getNavStyle("reports"),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 20V10"></path><path d="M10 20V4"></path><path d="M16 20v-7"></path><path d="M21 20H3"></path></svg>
              <span>Rapports</span>
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w36)", padding: "8px 12px" }}>TEMPS RÉEL</div>
            <Link
              href="/dashboard/live"
              className="sn-hover-w05"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14.5px",
                textDecoration: "none",
                ...getNavStyle("live"),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 12h3l2.5-6 4 12 2.5-6h7"></path></svg>
              <span style={{ flex: 1 }}>Live monitoring</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-green)", background: "rgba(43,213,118,.1)", padding: "2px 8px", borderRadius: "20px" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "var(--sn-green)", animation: "snPulse 1.8s infinite" }}></span>{liveCalls.length}
              </span>
            </Link>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w36)", padding: "8px 12px" }}>COMPTE</div>
            <Link
              href="/dashboard/settings"
              className="sn-hover-w05"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14.5px",
                textDecoration: "none",
                ...getNavStyle("settings"),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2"></circle><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"></path></svg>
              <span style={{ flex: 1 }}>Paramètres</span>
            </Link>
            <Link
              href="/dashboard/billing"
              className="sn-hover-w05"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14.5px",
                textDecoration: "none",
                ...getNavStyle("billing"),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.5"></rect><path d="M3 10.5h18"></path><path d="M7 15.5h4"></path></svg>
              <span style={{ flex: 1 }}>Facturation</span>
            </Link>
            <Link
              href="/dashboard/support"
              className="sn-hover-w05"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "11px",
                padding: "10px 12px",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 500,
                fontSize: "14.5px",
                textDecoration: "none",
                ...getNavStyle("support"),
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.6"></circle><path d="M9.4 9.2a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.2-2.6 3.6"></path><circle cx="12" cy="17" r=".4" fill="currentColor"></circle></svg>
              <span style={{ flex: 1 }}>Aide &amp; support</span>
            </Link>
          </div>
        </div>

        <div style={{ padding: "14px" }}>
          <Link
            href="/dashboard/billing"
            style={{ textDecoration: "none", display: "block" }}
          >
            <div className="sn-hover-border" style={{ background: "var(--sn-panel2)", border: "1px solid var(--sn-w07)", borderRadius: "14px", padding: "16px", cursor: "pointer" }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w42)" }}>CRÉDIT RESTANT</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: "6px", marginTop: "8px" }}>
                <span style={{ fontSize: "24px", fontWeight: 700, letterSpacing: "-.01em", color: "var(--sn-text)" }}>{fmt(kcr)}</span>
                <span style={{ fontSize: "12px", color: "var(--sn-w45)" }}>appels</span>
              </div>
              <div style={{ height: "5px", background: "var(--sn-w08)", borderRadius: "4px", marginTop: "12px", overflow: "hidden" }}>
                <div style={{ width: "0%", height: "100%", borderRadius: "4px", background: "linear-gradient(90deg, #0052FF, #00D4A6)" }}></div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10.5px", color: "var(--sn-w4)", marginTop: "8px" }}>{dashboard ? "Solde synchronisé" : "Synchronisation…"}</div>
            </div>
          </Link>
        </div>
      </nav>

      {/* ============ MAIN ============ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100%" }}>
        
        {/* Topbar */}
        <header id="sn-topbar" style={{ height: "64px", minHeight: "64px", borderBottom: "1px solid var(--sn-w06)", display: "flex", alignItems: "center", gap: "14px", padding: "0 28px", background: "var(--sn-topbar)", zIndex: (notifOpen || profileOpen || searchQ.trim().length > 0) ? 80 : 40 }}>
          <button id="sn-burger" onClick={() => setMenuOpen(true)} style={{ display: "none", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "10px", background: "var(--sn-panel2)", border: "1px solid var(--sn-w08)", color: "var(--sn-text)", cursor: "pointer" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h10"></path></svg>
          </button>
          
          <div id="sn-search" style={{ position: "relative", width: "340px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "var(--sn-panel)", border: "1px solid var(--sn-w07)", borderRadius: "11px", padding: "0 14px", height: "40px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--sn-w4)" }} strokeWidth="1.8" strokeLinecap="round"><circle cx="11" cy="11" r="6.5"></circle><path d="M20 20l-4-4"></path></svg>
              <input type="text" value={searchQ} onChange={(e) => setSearchQ(e.target.value)} placeholder="Rechercher une campagne, un contact…" style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--sn-text)", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px" }} />
              {searchQ.length > 0 && (
                <span onClick={() => setSearchQ("")} style={{ fontSize: "11px", fontWeight: 700, color: "var(--sn-w4)", cursor: "pointer", padding: "3px" }} className="sn-hover-text">✕</span>
              )}
            </div>
            {searchQ.length > 0 && (
              <div style={{ position: "absolute", top: "46px", left: 0, right: 0, background: "var(--sn-panel)", border: "1px solid var(--sn-w12)", borderRadius: "13px", boxShadow: "0 24px 60px rgba(0,0,0,.35)", zIndex: 70, overflow: "hidden", animation: "snFadeUp .18s ease both" }}>
                {searchResults.length === 0 ? (
                  <div style={{ padding: "22px 16px", textAlign: "center", fontSize: "13px", color: "var(--sn-w45)" }}>Aucun résultat pour « {searchQ} »</div>
                ) : (
                  searchResults.map((r, idx) => (
                    <div key={idx} onClick={r.open} style={{ display: "flex", alignItems: "center", gap: "11px", padding: "11px 14px", borderBottom: "1px solid var(--sn-w04)", cursor: "pointer" }} className="sn-hover-w03">
                      <div style={{ width: "30px", height: "30px", minWidth: "30px", borderRadius: "9px", background: r.iconBg, color: r.iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700 }}>{r.glyph}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w4)", marginTop: "2px" }}>{r.sub}</div>
                      </div>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={{ stroke: "var(--sn-w35)" }} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"></path></svg>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          
          <div style={{ flex: 1 }}></div>
          
          <Link
            href="/dashboard/live"
            style={{ textDecoration: "none" }}
          >
            <div id="sn-livechip" style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-green)", background: "rgba(43,213,118,.08)", border: "1px solid rgba(43,213,118,.22)", padding: "7px 13px", borderRadius: "20px", cursor: "pointer" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--sn-green)", animation: "snPulse 1.8s infinite" }}></span>
              <span>{liveCalls.length} appel{liveCalls.length > 1 ? "s" : ""} en cours</span>
            </div>
          </Link>
          
          <button onClick={toggleTheme} title="Changer de thème" style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "10px", background: "var(--sn-panel2)", border: "1px solid var(--sn-w08)", color: "var(--sn-w75)", cursor: "pointer" }} className="sn-hover-border">
            {theme === "dark" ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4.2"></circle><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5 5l1.6 1.6M17.4 17.4 19 19M19 5l-1.6 1.6M6.6 17.4 5 19"></path></svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"></path></svg>
            )}
          </button>
          
          <div style={{ position: "relative" }}>
            <button onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }} style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", width: "38px", height: "38px", borderRadius: "10px", background: "var(--sn-panel2)", border: "1px solid var(--sn-w08)", color: "var(--sn-w75)", cursor: "pointer" }} className="sn-hover-border">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13.5 6 9.5z"></path><path d="M10 18.5a2.1 2.1 0 0 0 4 0"></path></svg>
              {notifUnread.length > 0 && (
                <span style={{ position: "absolute", top: "9px", right: "10px", width: "7px", height: "7px", borderRadius: "50%", background: "#0052FF", border: "2px solid var(--sn-panel2)" }}></span>
              )}
            </button>
            
            {notifOpen && (
              <div style={{ position: "absolute", top: "47px", right: 0, width: "370px", maxWidth: "86vw", background: "var(--sn-panel)", border: "1px solid var(--sn-w12)", borderRadius: "16px", boxShadow: "0 24px 60px rgba(0,0,0,.35)", zIndex: 70, overflow: "hidden", animation: "snFadeUp .22s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "15px 18px", borderBottom: "1px solid var(--sn-w06)" }}>
                  <span style={{ fontSize: "14.5px", fontWeight: 700 }}>Notifications</span>
                  <span onClick={markAllRead} style={{ fontSize: "12px", fontWeight: 600, color: "var(--sn-blue2)", cursor: "pointer" }} className="sn-hover-support-faq">Tout marquer lu</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", maxHeight: "380px", overflowY: "auto" }}>
                  {popoverNotifications.map((n) => (
                    <div key={n.id} onClick={n.open} style={{ display: "flex", gap: "12px", padding: "13px 18px", borderBottom: "1px solid var(--sn-w04)", cursor: "pointer" }} className="sn-hover-w03">
                      <div style={{ width: "34px", height: "34px", minWidth: "34px", borderRadius: "10px", background: n.iconBg, color: n.iconColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700 }}>{n.glyph}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: "13.5px", fontWeight: 600 }}>{n.title}</div>
                        <div style={{ fontSize: "12.5px", color: "var(--sn-w55)", marginTop: "3px", lineHeight: 1.45 }}>{n.desc}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".08em", color: "var(--sn-w4)", marginTop: "6px" }}>{n.time}</div>
                      </div>
                      <span style={{ width: "7px", height: "7px", minWidth: "7px", borderRadius: "50%", background: n.dotBg, marginTop: "5px" }}></span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/dashboard/notifications"
                  style={{ textDecoration: "none" }}
                  onClick={() => setNotifOpen(false)}
                >
                  <div style={{ padding: "12px 18px", textAlign: "center", fontSize: "12.5px", fontWeight: 600, color: "var(--sn-blue2)", cursor: "pointer" }} className="sn-hover-w03">Voir toutes les notifications →</div>
                </Link>
              </div>
            )}
          </div>
          
          <div style={{ position: "relative" }}>
            <div onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }} style={{ width: "36px", height: "36px", borderRadius: "50%", background: avBgOf(profile.photo), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "13px", cursor: "pointer", overflow: "hidden" }}>
              {profile.photo ? <img src={avatarSrc(profile.photo)} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(profile.name || "A")}
            </div>
            
            {profileOpen && (
              <div style={{ position: "absolute", top: "47px", right: 0, width: "290px", background: "var(--sn-panel)", border: "1px solid var(--sn-w12)", borderRadius: "16px", boxShadow: "0 24px 60px rgba(0,0,0,.35)", zIndex: 70, overflow: "hidden", animation: "snFadeUp .22s ease both" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 18px", borderBottom: "1px solid var(--sn-w06)" }}>
                  <div style={{ width: "42px", height: "42px", minWidth: "42px", borderRadius: "50%", background: avBgOf(profile.photo), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "14px", overflow: "hidden" }}>
                    {profile.photo ? <img src={avatarSrc(profile.photo)} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(profile.name || "A")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "14px", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.name}</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "var(--sn-w45)", marginTop: "3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{profile.email}</div>
                  </div>
                  <span style={{ fontSize: "10.5px", fontWeight: 700, color: "var(--sn-blue2)", background: "rgba(0,82,255,.13)", padding: "4px 9px", borderRadius: "11px" }}>Admin</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", padding: "8px" }}>
                  <div onClick={() => { setProfileModalOpen(true); setProfileOpen(false); setProfileDraft({ ...profile }); }} style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 11px", borderRadius: "9px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--sn-w75)" }} className="sn-hover-w04">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3.4"></circle><path d="M5.5 19.5c.8-3.3 3.3-5 6.5-5s5.7 1.7 6.5 5"></path></svg>
                    Mon profil
                  </div>
                  <Link
                    href="/dashboard/settings"
                    style={{ textDecoration: "none" }}
                    onClick={() => setProfileOpen(false)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 11px", borderRadius: "9px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--sn-w75)" }} className="sn-hover-w04">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3.2"></circle><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7"></path></svg>
                      Paramètres
                    </div>
                  </Link>
                  <div onClick={toggleTheme} style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 11px", borderRadius: "9px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--sn-w75)" }} className="sn-hover-w04">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z"></path></svg>
                    <span style={{ flex: 1 }}>{theme === "light" ? "Thème clair" : "Thème sombre"}</span>
                    <span style={{ width: "36px", height: "20px", borderRadius: "11px", background: theme === "light" ? "#0052FF" : "var(--sn-w14)", position: "relative", transition: "background .2s" }}>
                      <span style={{ position: "absolute", top: "2px", left: theme === "light" ? "18px" : "2px", width: "16px", height: "16px", borderRadius: "50%", background: "#fff", transition: "left .2s" }}></span>
                    </span>
                  </div>
                  <div style={{ height: "1px", background: "var(--sn-w06)", margin: "7px 4px" }}></div>
                  <div onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "11px", padding: "10px 11px", borderRadius: "9px", cursor: "pointer", fontSize: "13.5px", fontWeight: 500, color: "var(--sn-red)" }} className="sn-hover-w04">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H9"></path><path d="M15 8l4 4-4 4M19 12H9"></path></svg>
                    Se déconnecter
                  </div>
                </div>
              </div>
            )}
          </div>
        </header>
        
        {/* Content */}
        <main id="sn-content" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "28px" }}>
          {children}
        </main>
      </div>

      {/* ============ DRAWER APPEL ============ */}
      {callId !== null && (
        <div
          onClick={closeCall}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            zIndex: 60,
            backdropFilter: "blur(2px)",
          }}
        ></div>
      )}
      <aside
        id="sn-drawer"
        data-screen-label="Détail appel — transcription"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "480px",
          maxWidth: "100vw",
          background: "var(--sn-drawer)",
          borderLeft: "1px solid var(--sn-w08)",
          zIndex: 61,
          transform: callId !== null ? "translateX(0)" : "translateX(108%)",
          transition: "transform .32s cubic-bezier(.3,.8,.3,1)",
          display: "flex",
          flexDirection: "column",
          boxShadow: "-30px 0 60px rgba(0,0,0,.45)",
        }}
      >
        {activeCall && (
          <>
            <div style={{ padding: "20px 22px", borderBottom: "1px solid var(--sn-w07)", display: "flex", alignItems: "flex-start", gap: "14px" }}>
              <div style={{ width: "42px", height: "42px", minWidth: "42px", borderRadius: "50%", background: "rgba(0,82,255,.16)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 700, color: "var(--sn-blue3)" }}>
                {initials(activeCall.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "16.5px", fontWeight: 700 }}>{activeCall.name}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--sn-w45)", marginTop: "4px" }}>
                  {activeCall.phone} · {activeCall.city.toUpperCase()} · 10 JUIN, {activeCall.time}
                </div>
              </div>
              <button onClick={closeCall} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", borderRadius: "9px", background: "var(--sn-panel2)", border: "1px solid var(--sn-w09)", color: "var(--sn-w7)", cursor: "pointer" }} className="sn-hover-text">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--sn-w65)", background: "var(--sn-panel2)", border: "1px solid var(--sn-w08)", padding: "6px 11px", borderRadius: "16px" }}>
                  ⏱ {activeCall.dur || "—"}
                </span>
                {activeCall.sentiment !== null && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--sn-green)", background: "rgba(43,213,118,.09)", border: "1px solid rgba(43,213,118,.25)", padding: "6px 11px", borderRadius: "16px" }}>
                    SENTIMENT {activeCall.sentiment.toFixed(1)}/10
                  </span>
                )}
                {activeCall.mood && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "var(--sn-w65)", background: "var(--sn-panel2)", border: "1px solid var(--sn-w08)", padding: "6px 11px", borderRadius: "16px" }}>
                    HUMEUR : {activeCall.mood}
                  </span>
                )}
              </div>

              <div style={{ background: "var(--sn-panel2)", border: "1px solid var(--sn-w07)", borderRadius: "14px", padding: "14px 16px", display: "flex", alignItems: "center", gap: "14px" }}>
                <button onClick={togglePlay} style={{ width: "38px", height: "38px", minWidth: "38px", borderRadius: "50%", background: "#0052FF", border: "none", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} className="sn-hover-btn-primary">
                  {playing ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z"></path></svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5L7 4.5z"></path></svg>
                  )}
                </button>
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "2.5px", height: "34px" }}>
                  {audioBars.map((b, idx) => (
                    <span key={idx} style={{ flex: 1, height: b.h, background: b.c, borderRadius: "2px" }}></span>
                  ))}
                </div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", color: "var(--sn-w5)" }}>
                  {durS ? `${mmssP(playT)} / ${activeCall.dur}` : activeCall.dur}
                </span>
              </div>

              {activeCall.summary && (
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w42)" }}>RÉSUMÉ IA</div>
                  <div style={{ marginTop: "9px", background: "rgba(0,82,255,.07)", border: "1px solid rgba(0,82,255,.22)", borderRadius: "13px", padding: "15px 17px", fontSize: "13.5px", lineHeight: "1.6", color: "var(--sn-w85)" }}>
                    {activeCall.summary}
                  </div>
                </div>
              )}

              {activeCall.action && (
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w42)" }}>ACTION RECOMMANDÉE</div>
                  <div style={{ marginTop: "9px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 600, color: as.c, background: as.bg, border: `1px solid ${as.bd}`, padding: "9px 14px", borderRadius: "11px" }}>
                    {activeCall.action.label}
                  </div>
                </div>
              )}

              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".14em", color: "var(--sn-w42)", marginBottom: "12px" }}>TRANSCRIPTION</div>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {transcript.map((t, idx) => (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: t.align, gap: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        {t.isAi && (
                          <img src="/assets/ear-dark.png" alt="" style={{ width: "20px", height: "20px", borderRadius: "6px" }} />
                        )}
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".1em", color: "var(--sn-w4)" }}>
                          {t.who} · {t.time}
                        </span>
                      </div>
                      <div style={{ maxWidth: "82%", background: t.bg, border: `1px solid ${t.bd}`, borderRadius: t.radius, padding: "11px 14px", fontSize: "13.5px", lineHeight: "1.55", color: "var(--sn-w88)" }}>
                        {t.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>

      {/* ============ TOASTS ============ */}
      <div style={{ position: "fixed", right: "20px", bottom: "84px", display: "flex", flexDirection: "column-reverse", gap: "10px", zIndex: 95, pointerEvents: "none" }}>
        {toasts.map((t) => {
          const accent = t.kind === "warn" ? "var(--sn-amber)" : t.kind === "info" ? "var(--sn-blue2)" : "var(--sn-green)";
          return (
            <div key={t.id} style={{ display: "flex", alignItems: "center", gap: "11px", background: "var(--sn-panel)", border: "1px solid var(--sn-w12)", borderLeft: `3px solid ${accent}`, borderRadius: "12px", padding: "13px 17px", boxShadow: "0 16px 44px rgba(0,0,0,.4)", fontSize: "13px", fontWeight: 600, maxWidth: "360px", animation: "snFadeUp .25s ease both", pointerEvents: "auto" }}>
              <span style={{ width: "8px", height: "8px", minWidth: "8px", borderRadius: "50%", background: accent }}></span>
              <span>{t.text}</span>
            </div>
          );
        })}
      </div>

      {/* ============ MODAL CONFIRMATION ============ */}
      {confirm !== null && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setConfirm(null);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            zIndex: 88,
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "390px",
              maxWidth: "calc(100vw - 24px)",
              background: "var(--sn-panel)",
              border: "1px solid var(--sn-w12)",
              borderRadius: "17px",
              boxShadow: "0 30px 80px rgba(0,0,0,.5)",
              animation: "snFadeUp .22s ease both",
              padding: "24px",
            }}
          >
            <div style={{ fontSize: "16.5px", fontWeight: 700 }}>{confirm.title}</div>
            <div style={{ fontSize: "13.5px", lineHeight: "1.6", color: "var(--sn-w6)", marginTop: "9px" }}>{confirm.desc}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "9px", marginTop: "22px" }}>
              <button onClick={() => setConfirm(null)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "var(--sn-w7)", border: "1px solid var(--sn-w14)", borderRadius: "10px", padding: "10px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 600, cursor: "pointer" }} className="sn-hover-border">Annuler</button>
              <button
                onClick={() => {
                  confirm.action();
                  setConfirm(null);
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  background: confirm.danger ? "var(--sn-red)" : "#0052FF",
                  color: "#fff",
                  border: "none",
                  borderRadius: "10px",
                  padding: "10px 18px",
                  fontFamily: "'Satoshi', sans-serif",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {confirm.label}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL PROFIL ============ */}
      {profileModalOpen && profileDraft && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setProfileModalOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.55)",
            zIndex: 80,
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            data-screen-label="Mon profil — édition"
            style={{
              width: "440px",
              maxWidth: "calc(100vw - 24px)",
              maxHeight: "calc(100vh - 40px)",
              overflowY: "auto",
              background: "var(--sn-panel)",
              border: "1px solid var(--sn-w12)",
              borderRadius: "18px",
              boxShadow: "0 30px 80px rgba(0,0,0,.5)",
              animation: "snFadeUp .25s ease both",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", padding: "18px 22px", borderBottom: "1px solid var(--sn-w06)" }}>
              <div style={{ fontSize: "16.5px", fontWeight: 700 }}>Mon profil</div>
              <button onClick={() => setProfileModalOpen(false)} style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "32px", height: "32px", borderRadius: "9px", background: "var(--sn-panel2)", border: "1px solid var(--sn-w09)", color: "var(--sn-w7)", cursor: "pointer" }} className="sn-hover-text">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"></path></svg>
              </button>
            </div>
            <div style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "76px", height: "76px", minWidth: "76px", borderRadius: "50%", background: avBgOf(profileDraft.photo), display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "24px", border: "2px solid var(--sn-w09)", overflow: "hidden" }}>
                  {profileDraft.photo ? <img src={avatarSrc(profileDraft.photo)} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initials(profileDraft.name || "A")}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => { void uploadAvatar(event); }} ref={photoInputRef} style={{ display: "none" }} />
                  <button onClick={() => photoInputRef.current?.click()} style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "var(--sn-panel2)", color: "var(--sn-text)", border: "1px solid var(--sn-w12)", borderRadius: "10px", padding: "9px 14px", fontFamily: "'Satoshi', sans-serif", fontSize: "13px", fontWeight: 600, cursor: "pointer" }} className="sn-hover-border">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8h3l2-2.5h6L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"></path><circle cx="12" cy="13.5" r="3.4"></circle></svg>
                    Changer la photo
                  </button>
                  {profileDraft.photo && (
                    <span onClick={() => setProfileDraft({ ...profileDraft, photo: null })} style={{ fontSize: "12px", fontWeight: 600, color: "var(--sn-red)", cursor: "pointer" }}>Retirer la photo</span>
                  )}
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", letterSpacing: ".06em", color: "var(--sn-w4)" }}>JPG OU PNG — RECADRÉE EN CARRÉ AUTOMATIQUEMENT</span>
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w45)", marginBottom: "7px" }}>NOM COMPLET</div>
                <input type="text" value={profileDraft.name} onChange={(e) => setProfileDraft({ ...profileDraft, name: e.target.value })} style={{ width: "100%", background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "10px", padding: "11px 13px", color: "var(--sn-text)", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", outline: "none" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: ".12em", color: "var(--sn-w45)", marginBottom: "7px" }}>EMAIL</div>
                <input type="email" value={profileDraft.email} onChange={(e) => setProfileDraft({ ...profileDraft, email: e.target.value })} style={{ width: "100%", background: "var(--sn-inset)", border: "1px solid var(--sn-w09)", borderRadius: "10px", padding: "11px 13px", color: "var(--sn-text)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12.5px", outline: "none" }} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--sn-inset)", border: "1px solid var(--sn-w06)", borderRadius: "10px", padding: "12px 14px", fontSize: "13px" }}>
                <span style={{ color: "var(--sn-w55)" }}>Rôle</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}><span style={{ fontSize: "11px", fontWeight: 700, color: "var(--sn-blue2)", background: "rgba(0,82,255,.13)", padding: "4px 10px", borderRadius: "11px" }}>Admin</span><span style={{ fontSize: "11.5px", color: "var(--sn-w4)" }}>géré par votre organisation</span></span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "9px", padding: "16px 22px", borderTop: "1px solid var(--sn-w06)" }}>
              <button onClick={() => setProfileModalOpen(false)} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", background: "transparent", color: "var(--sn-w7)", border: "1px solid var(--sn-w14)", borderRadius: "10px", padding: "11px 16px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 600, cursor: "pointer" }} className="sn-hover-border">Annuler</button>
              <button onClick={() => { void handlePersistentProfileSave(); }} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", background: "#0052FF", color: "#fff", border: "none", borderRadius: "10px", padding: "11px 20px", fontFamily: "'Satoshi', sans-serif", fontSize: "13.5px", fontWeight: 700, cursor: "pointer" }} className="sn-hover-btn-primary">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ BOTTOM NAV MOBILE ============ */}
      <nav
        id="sn-bottomnav"
        style={{
          display: "none",
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: "68px",
          background: "var(--sn-bnav)",
          backdropFilter: "blur(12px)",
          borderTop: "1px solid var(--sn-w08)",
          zIndex: 45,
          alignItems: "stretch",
          justifyContent: "space-around",
          padding: "0 8px",
        }}
      >
        <Link
          href="/dashboard"
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer", textDecoration: "none", color: view === "home" ? "var(--sn-text)" : "var(--sn-w62)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5"></path><path d="M5 9.5V21h14V9.5"></path></svg>
          <span style={{ fontSize: "10.5px", fontWeight: 600 }}>Accueil</span>
        </Link>
        <Link
          href="/dashboard/campaigns"
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer", textDecoration: "none", color: (view === "campaigns" || view === "campaign" || view === "new") ? "var(--sn-text)" : "var(--sn-w62)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 11l14-5v12L3 13v-2z"></path><path d="M20 9.5a3 3 0 0 1 0 5"></path></svg>
          <span style={{ fontSize: "10.5px", fontWeight: 600 }}>Campagnes</span>
        </Link>
        <Link
          href="/dashboard/live"
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", cursor: "pointer", textDecoration: "none", color: view === "live" ? "var(--sn-text)" : "var(--sn-w62)" }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 12h3l2.5-6 4 12 2.5-6h7"></path></svg>
          <span style={{ fontSize: "10.5px", fontWeight: 600 }}>Live</span>
        </Link>
      </nav>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </DashboardProvider>
  );
}
