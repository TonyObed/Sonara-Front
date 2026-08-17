"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api, type DashboardData } from "@/lib/api-client";
import { mapApiCampaignToFront } from "@/lib/dashboard-adapters";

export interface UserProfile { name: string; email: string; role: string; photo: string | null; }
export interface CompanyInfo { name: string; phone: string; tz: string; plan: string; isSandbox: boolean; }
export interface Campaign { id: string; name: string; sector: string; status: "live" | "paused" | "done" | "scheduled" | "draft"; done: number; total: number; responseRate: string | null; sentiment: number | null; date: string | null; brief?: string; voice?: string; rules?: { hours: string; maxAttempts: number; retryDelay: string; maxDuration: string; concurrency: number; }; }
export interface Call { id: string; name: string; city: string; phone: string; time: string; dur: string | null; status: "completed" | "transferred" | "unreachable" | "voicemail" | "failed"; sentiment: number | null; mood?: string; summary?: string; transcript?: Array<{ speaker: "ai" | "client"; time: string; text: string }>; }
export interface LiveCall { name: string; campaign: string; startedSecondsAgo: number; }
export interface Contact { name: string; phone: string; city: string; segment: string; campaigns: number; lastCall: string; optout: boolean; }
export interface Report { name: string; meta: string; size: string; responseRate: string; sentiment: number; }
export interface TeamMember { name: string; email: string; role: string; }
export interface Toast { id: string; text: string; kind: "ok" | "warn" | "info"; }
export interface ConfirmData { title: string; desc: string; label: string; danger?: boolean; action: () => void; }
export interface NotificationItem { id: string; group: string; kind: "ok" | "warn" | "alert" | "info"; title: string; desc: string; time: string; target: string | null; }
export interface FaqItem { q: string; a: string; }
export interface PlanInfo { id: string; name: string; price: number; contactSales?: boolean; desc: string; features: string[]; }

interface DashboardContextType {
  view: string; setView: (v: string) => void; tab: string; setTab: (t: string) => void; campaignId: string; setCampaignId: (id: string) => void; callId: string | null; setCallId: (id: string | null) => void; menuOpen: boolean; setMenuOpen: (o: boolean) => void;
  ka: number; kt: number; kc: number; kcr: number; tick: number; theme: "dark" | "light"; setTheme: (t: "dark" | "light") => void; toggleTheme: () => void;
  notifOpen: boolean; setNotifOpen: (o: boolean) => void; profileOpen: boolean; setProfileOpen: (o: boolean) => void; faqOpen: number | null; setFaqOpen: (i: number | null) => void;
  company: CompanyInfo; setCompany: (c: CompanyInfo) => void; profile: UserProfile; setProfile: (p: UserProfile) => void;
  companyEdit: boolean; setCompanyEdit: (e: boolean) => void; companyDraft: CompanyInfo | null; setCompanyDraft: (c: CompanyInfo | null) => void; profileModalOpen: boolean; setProfileModalOpen: (o: boolean) => void; profileDraft: UserProfile | null; setProfileDraft: (p: UserProfile | null) => void;
  plan: string; setPlan: (p: string) => void; autoRecharge: boolean; setAutoRecharge: (r: boolean) => void; toggleAutoRecharge: () => void;
  notifUnread: string[]; setNotifUnread: React.Dispatch<React.SetStateAction<string[]>>; notifFilter: "all" | "unread"; setNotifFilter: (f: "all" | "unread") => void;
  toasts: Toast[]; pushToast: (t: string, k: "ok" | "warn" | "info") => void; confirm: ConfirmData | null; setConfirm: (c: ConfirmData | null) => void; stOver: Record<string, Campaign["status"]>; setStOver: React.Dispatch<React.SetStateAction<Record<string, Campaign["status"]>>>;
  searchQ: string; setSearchQ: (q: string) => void; playing: boolean; setPlaying: (p: boolean) => void; playT: number; setPlayT: (t: number) => void; testCall: "idle" | "calling"; setTestCall: (t: "idle" | "calling") => void; testNum: string; setTestNum: (n: string) => void; chartRange: 7 | 14 | 30; setChartRange: (r: 7 | 14 | 30) => void;
  go: (target: string) => void; persistAccount: (c: CompanyInfo, p: UserProfile) => void; markAllRead: () => void; startTestCall: (options?: { aiBrief?: string; aiVoice?: string; aiTemperature?: number }) => Promise<void>; isLoading: boolean;
  campaigns: Campaign[]; setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>; calls: Call[]; setCalls: React.Dispatch<React.SetStateAction<Call[]>>; liveCalls: LiveCall[]; dashboard: DashboardData | null; directory: Contact[]; reports: Report[]; team: TeamMember[]; notifications: NotificationItem[]; faq: FaqItem[]; plans: PlanInfo[];
}

const DashboardContext = createContext<DashboardContextType | null>(null);
export const useDashboard = () => { const c = useContext(DashboardContext); if (!c) throw new Error("useDashboard must be used within a DashboardProvider"); return c; };

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true); const [campaigns, setCampaigns] = useState<Campaign[]>([]); const [calls, setCalls] = useState<Call[]>([]); const [liveCalls, setLiveCalls] = useState<LiveCall[]>([]); const [dashboard, setDashboard] = useState<DashboardData | null>(null); const [directory, setDirectory] = useState<Contact[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ name: "", email: "", role: "VIEWER", photo: null }); const [company, setCompany] = useState<CompanyInfo>({ name: "", phone: "", tz: "UTC", plan: "STARTER", isSandbox: false }); const [plan, setPlan] = useState("STARTER");
  const [theme, setThemeState] = useState<"dark" | "light">("dark"); const [view, setView] = useState("home"); const [tab, setTab] = useState("overview"); const [campaignId, setCampaignId] = useState(""); const [callId, setCallId] = useState<string | null>(null); const [menuOpen, setMenuOpen] = useState(false); const [ka, setKa] = useState(0); const [kt, setKt] = useState(0); const [kc, setKc] = useState(0); const [kcr, setKcr] = useState(0); const [tick, setTick] = useState(0); const [notifOpen, setNotifOpen] = useState(false); const [profileOpen, setProfileOpen] = useState(false); const [faqOpen, setFaqOpen] = useState<number | null>(null); const [companyEdit, setCompanyEdit] = useState(false); const [companyDraft, setCompanyDraft] = useState<CompanyInfo | null>(null); const [profileModalOpen, setProfileModalOpen] = useState(false); const [profileDraft, setProfileDraft] = useState<UserProfile | null>(null); const [autoRecharge, setAutoRecharge] = useState(false); const [notifUnread, setNotifUnread] = useState<string[]>([]); const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all"); const [toasts, setToasts] = useState<Toast[]>([]); const [confirm, setConfirm] = useState<ConfirmData | null>(null); const [stOver, setStOver] = useState<Record<string, Campaign["status"]>>({}); const [searchQ, setSearchQ] = useState(""); const [playing, setPlaying] = useState(false); const [playT, setPlayT] = useState(0); const [testCall, setTestCall] = useState<"idle" | "calling">("idle"); const [testNum, setTestNum] = useState(""); const [chartRange, setChartRange] = useState<7 | 14 | 30>(14);

  useEffect(() => { const t = setInterval(() => setTick(v => v + 1), 1000); return () => clearInterval(t); }, []);
  useEffect(() => { document.getElementById("sn-root")?.setAttribute("data-theme", theme); }, [theme]);
  useEffect(() => { let active = true; (async () => { try {
    const [me, cs, usage, dashboardData, live, contacts] = await Promise.all([
      api.auth.me().catch(() => null), api.campaigns.list({ limit: 50 }).catch(() => null), api.company.usage().catch(() => null), api.company.dashboard().catch(() => null), api.calls.live().catch(() => null), api.contacts.list().catch(() => null),
    ]);
    if (!active) return; if (!me?.data) { window.location.assign("/login"); return; }
    const { user, company: dbCompany } = me.data;
    setProfile({ name: [user.firstName, user.lastName].filter(Boolean).join(" "), email: user.email, role: user.role, photo: user.avatarUrl ?? null }); setCompany({ name: dbCompany.name, phone: "", tz: "UTC", plan: dbCompany.plan, isSandbox: Boolean(dbCompany.isSandbox) }); setPlan(dbCompany.plan);
    if (cs?.data) setCampaigns(cs.data.map(mapApiCampaignToFront)); if (usage?.data) { setKa(usage.data.calls.total); setKc(usage.data.campaigns.active); setKcr(usage.data.credit.remaining); } if (dashboardData?.data) { setDashboard(dashboardData.data); setKt(dashboardData.data.responseRate); setKcr(dashboardData.data.credit); } if (live?.data) setLiveCalls(live.data); if (contacts?.data) setDirectory(contacts.data);
  } finally { if (active) setIsLoading(false); } })(); return () => { active = false; }; }, []);
  // Les webhooks mettent à jour la base, puis cette synchronisation légère
  // reflète les résultats sans demander à l'utilisateur de recharger la page.
  useEffect(() => {
    const refresh = async () => {
      const [cs, usage, dashboardData, live, contacts] = await Promise.all([
        api.campaigns.list({ limit: 50 }).catch(() => null),
        api.company.usage().catch(() => null),
        api.company.dashboard().catch(() => null),
        api.calls.live().catch(() => null),
        api.contacts.list().catch(() => null),
      ]);
      if (cs?.data) setCampaigns(cs.data.map(mapApiCampaignToFront));
      if (usage?.data) { setKa(usage.data.calls.total); setKc(usage.data.campaigns.active); setKcr(usage.data.credit.remaining); }
      if (dashboardData?.data) { setDashboard(dashboardData.data); setKt(dashboardData.data.responseRate); setKcr(dashboardData.data.credit); }
      if (live?.data) setLiveCalls(live.data);
      if (contacts?.data) setDirectory(contacts.data);
    };
    const timer = window.setInterval(() => { void refresh(); }, 15_000);
    window.addEventListener("focus", refresh);
    return () => { window.clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, []);
  const setTheme = (t: "dark" | "light") => { setThemeState(t); localStorage.setItem("sonara-theme", t); };
  const pushToast = (text: string, kind: Toast["kind"]) => { const id = crypto.randomUUID(); setToasts(v => [...v, { id, text, kind }]); window.setTimeout(() => setToasts(v => v.filter(x => x.id !== id)), 3800); };
  const startTestCall = async (options?: { aiBrief?: string; aiVoice?: string; aiTemperature?: number }) => { if (!testNum.trim() || testCall === "calling") { if (!testNum.trim()) pushToast("Saisissez un numéro de téléphone.", "warn"); return; } setTestCall("calling"); try { const { data } = await api.calls.test({ phone: testNum.trim(), firstName: profile.name.split(" ")[0] || "Client", ...options }); pushToast(data.message, "ok"); } catch (e) { pushToast(e instanceof Error ? e.message : "Impossible de lancer l’appel test.", "warn"); } finally { setTestCall("idle"); } };
  const accountPlan: PlanInfo = { id: plan, name: company.plan || plan, price: 0, desc: "Plan enregistré pour cette entreprise.", features: [] };
  const value: DashboardContextType = { view, setView, tab, setTab, campaignId, setCampaignId, callId, setCallId, menuOpen, setMenuOpen, ka, kt, kc, kcr, tick, theme, setTheme, toggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"), notifOpen, setNotifOpen, profileOpen, setProfileOpen, faqOpen, setFaqOpen, company, setCompany, profile, setProfile, companyEdit, setCompanyEdit, companyDraft, setCompanyDraft, profileModalOpen, setProfileModalOpen, profileDraft, setProfileDraft, plan, setPlan, autoRecharge, setAutoRecharge, toggleAutoRecharge: () => setAutoRecharge(v => !v), notifUnread, setNotifUnread, notifFilter, setNotifFilter, toasts, pushToast, confirm, setConfirm, stOver, setStOver, searchQ, setSearchQ, playing, setPlaying, playT, setPlayT, testCall, setTestCall, testNum, setTestNum, chartRange, setChartRange, go: setView, persistAccount: (c, p) => { setCompany(c); setProfile(p); }, markAllRead: () => setNotifUnread([]), startTestCall, isLoading, campaigns, setCampaigns, calls, setCalls, liveCalls, dashboard, directory, reports: [], team: [], notifications: [], faq: [], plans: [accountPlan] };
  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}
