"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import demoData from "@/lib/demo-data.json";

// Type definitions based on demo-data.json
export interface UserProfile {
  name: string;
  email: string;
  role: string;
  photo: string | null;
}

export interface CompanyInfo {
  name: string;
  phone: string;
  tz: string;
  plan: string;
}

export interface Campaign {
  id: string;
  name: string;
  sector: string;
  status: "live" | "paused" | "done" | "scheduled" | "draft";
  done: number;
  total: number;
  responseRate: string | null;
  sentiment: number | null;
  date: string | null;
  brief?: string;
  voice?: string;
  rules?: {
    hours: string;
    maxAttempts: number;
    retryDelay: string;
    maxDuration: string;
    concurrency: number;
  };
}

export interface Call {
  id: number;
  name: string;
  city: string;
  phone: string;
  time: string;
  dur: string | null;
  status: "completed" | "transferred" | "unreachable" | "voicemail" | "failed";
  sentiment: number | null;
  mood?: string;
  summary?: string;
  action?: {
    label: string;
    kind: "ok" | "warn" | "alert";
  };
  transcript?: Array<{
    speaker: "ai" | "client";
    time: string;
    text: string;
  }>;
}

export interface LiveCall {
  name: string;
  campaign: string;
  startedSecondsAgo: number;
}

export interface Contact {
  name: string;
  phone: string;
  city: string;
  segment: string;
  campaigns: number;
  lastCall: string;
  optout: boolean;
}

export interface Report {
  name: string;
  meta: string;
  size: string;
  responseRate: string;
  sentiment: number;
}

export interface TeamMember {
  name: string;
  email: string;
  role: string;
}

export interface LiveEvent {
  time: string;
  kind: "ok" | "info" | "warn" | "alert";
  text: string;
}

export interface Toast {
  id: string;
  text: string;
  kind: "ok" | "warn" | "info";
}

export interface ConfirmData {
  title: string;
  desc: string;
  label: string;
  danger?: boolean;
  action: () => void;
}

interface DashboardContextType {
  view: string;
  setView: (v: string) => void;
  tab: string;
  setTab: (t: string) => void;
  campaignId: string;
  setCampaignId: (id: string) => void;
  callId: number | null;
  setCallId: (id: number | null) => void;
  menuOpen: boolean;
  setMenuOpen: (o: boolean) => void;
  
  // Animated KPIs
  ka: number;
  kt: number;
  kc: number;
  kcr: number;
  
  tick: number;
  theme: "dark" | "light";
  setTheme: (t: "dark" | "light") => void;
  toggleTheme: () => void;
  
  notifOpen: boolean;
  setNotifOpen: (o: boolean) => void;
  profileOpen: boolean;
  setProfileOpen: (o: boolean) => void;
  faqOpen: number | null;
  setFaqOpen: (idx: number | null) => void;
  
  company: CompanyInfo;
  setCompany: (c: CompanyInfo) => void;
  profile: UserProfile;
  setProfile: (p: UserProfile) => void;
  
  companyEdit: boolean;
  setCompanyEdit: (e: boolean) => void;
  companyDraft: CompanyInfo | null;
  setCompanyDraft: (c: CompanyInfo | null) => void;
  profileModalOpen: boolean;
  setProfileModalOpen: (o: boolean) => void;
  profileDraft: UserProfile | null;
  setProfileDraft: (p: UserProfile | null) => void;
  
  plan: string;
  setPlan: (p: string) => void;
  autoRecharge: boolean;
  setAutoRecharge: (r: boolean) => void;
  toggleAutoRecharge: () => void;
  
  notifUnread: string[];
  setNotifUnread: React.Dispatch<React.SetStateAction<string[]>>;
  notifFilter: "all" | "unread";
  setNotifFilter: (f: "all" | "unread") => void;
  
  toasts: Toast[];
  pushToast: (text: string, kind: "ok" | "warn" | "info") => void;
  confirm: ConfirmData | null;
  setConfirm: (c: ConfirmData | null) => void;
  
  stOver: Record<string, "live" | "paused" | "done" | "scheduled" | "draft">;
  setStOver: React.Dispatch<React.SetStateAction<Record<string, "live" | "paused" | "done" | "scheduled" | "draft">>>;
  
  searchQ: string;
  setSearchQ: (q: string) => void;
  
  playing: boolean;
  setPlaying: (p: boolean) => void;
  playT: number;
  setPlayT: (t: number) => void;
  testCall: "idle" | "calling";
  setTestCall: (t: "idle" | "calling") => void;
  testNum: string;
  setTestNum: (n: string) => void;
  chartRange: 7 | 14 | 30;
  setChartRange: (r: 7 | 14 | 30) => void;
  
  // Actions
  go: (target: string) => void;
  persistAccount: (company: CompanyInfo, profile: UserProfile) => void;
  markAllRead: () => void;
  startTestCall: () => void;
  
  // Full static-dynamic records
  campaigns: Campaign[];
  calls: Call[];
  liveCalls: LiveCall[];
  directory: Contact[];
  reports: Report[];
  team: TeamMember[];
  notifications: typeof demoData.notifications;
  faq: typeof demoData.faq;
  plans: typeof demoData.plans;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load persistent states
  const [theme, setThemeState] = useState<"dark" | "light">("dark");
  const [profile, setProfileState] = useState<UserProfile>({
    name: demoData.user.name,
    email: demoData.user.email,
    role: demoData.user.role,
    photo: null,
  });
  const [company, setCompanyState] = useState<CompanyInfo>({
    name: demoData.company.name,
    phone: demoData.company.phone,
    tz: demoData.company.tz,
    plan: demoData.company.plan,
  });

  const [view, setViewState] = useState<string>("home");
  const [tab, setTab] = useState<string>("overview");
  const [campaignId, setCampaignId] = useState<string>("c1");
  const [callId, setCallId] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  
  // KPI Count Up animations
  const [ka, setKa] = useState(0);
  const [kt, setKt] = useState(0);
  const [kc, setKc] = useState(0);
  const [kcr, setKcr] = useState(0);
  
  const [tick, setTick] = useState<number>(0);
  const [notifOpen, setNotifOpen] = useState<boolean>(false);
  const [profileOpen, setProfileOpen] = useState<boolean>(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  
  const [companyEdit, setCompanyEdit] = useState<boolean>(false);
  const [companyDraft, setCompanyDraft] = useState<CompanyInfo | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);
  const [profileDraft, setProfileDraft] = useState<UserProfile | null>(null);
  
  const [plan, setPlan] = useState<string>(demoData.company.plan);
  const [autoRecharge, setAutoRecharge] = useState<boolean>(true);
  
  const [notifUnread, setNotifUnread] = useState<string[]>(["n1", "n2", "n3"]);
  const [notifFilter, setNotifFilter] = useState<"all" | "unread">("all");
  
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirm, setConfirm] = useState<ConfirmData | null>(null);
  const [stOver, setStOver] = useState<Record<string, "live" | "paused" | "done" | "scheduled" | "draft">>({});
  const [searchQ, setSearchQ] = useState<string>("");
  
  const [playing, setPlaying] = useState<boolean>(false);
  const [playT, setPlayT] = useState<number>(0);
  const [testCall, setTestCall] = useState<"idle" | "calling">("idle");
  const [testNum, setTestNum] = useState<string>("+225 07 08 23 45 67");
  const [chartRange, setChartRange] = useState<7 | 14 | 30>(14);

  // Audio interval reference
  const audioIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // Viewport scroll reset ref
  const scrollRef = useRef<HTMLElement | null>(null);

  // Sync theme and profile/company from localStorage on mount
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("sonara-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
      }
      const acctStr = localStorage.getItem("sonara-account");
      if (acctStr) {
        const acct = JSON.parse(acctStr);
        if (acct.company) setCompanyState(acct.company);
        if (acct.profile) setProfileState(acct.profile);
      }
    } catch (e) {
      console.warn("Error reading from localStorage", e);
    }
  }, []);

  // Sync theme dataset on DOM
  useEffect(() => {
    const root = document.getElementById("sn-root");
    if (root) {
      root.setAttribute("data-theme", theme);
    }
  }, [theme]);

  // Run KPI Count-Up Animation on mount
  useEffect(() => {
    const T = { ka: demoData.kpis.callsToday, kt: demoData.kpis.responseRate, kc: demoData.kpis.activeCampaigns, kcr: demoData.credit.remaining };
    const t0 = performance.now();
    const dur = 1400; // ms
    let rFrame: number;

    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setKa(Math.round(T.ka * e));
      setKt(Math.round(T.kt * e));
      setKc(Math.round(T.kc * e));
      setKcr(Math.round(T.kcr * e));

      if (p < 1) {
        rFrame = requestAnimationFrame(step);
      }
    };

    rFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rFrame);
  }, []);

  // Tick timer for live monitoring
  useEffect(() => {
    const timer = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Audio player mock logic
  useEffect(() => {
    if (playing) {
      const step = 0.25;
      audioIntervalRef.current = setInterval(() => {
        setPlayT((t) => {
          if (t >= 204) { // 3:24 in seconds is 204
            setPlaying(false);
            if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
            return 0;
          }
          return t + step;
        });
      }, 250);
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
        audioIntervalRef.current = null;
      }
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [playing]);

  // Set theme helper
  const setTheme = (t: "dark" | "light") => {
    setThemeState(t);
    try {
      localStorage.setItem("sonara-theme", t);
    } catch (e) {
      console.warn("Could not save theme", e);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Auto recharge helper
  const toggleAutoRecharge = () => {
    setAutoRecharge((r) => !r);
  };

  // View navigation helper (handles scroll reset)
  const go = (target: string) => {
    setViewState(target);
    setMenuOpen(false);
    setNotifOpen(false);
    setProfileOpen(false);
    
    // Scroll content panel to top
    const sc = document.getElementById("sn-content");
    if (sc) sc.scrollTop = 0;
  };

  // Persist account edits helper
  const persistAccount = (comp: CompanyInfo, prof: UserProfile) => {
    try {
      localStorage.setItem("sonara-account", JSON.stringify({ company: comp, profile: prof }));
    } catch (e) {
      console.warn("Could not persist account details", e);
    }
  };

  const pushToast = (text: string, kind: "ok" | "warn" | "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, text, kind }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const markAllRead = () => {
    setNotifUnread([]);
  };

  const startTestCall = () => {
    if (testCall === "calling") return;
    setTestCall("calling");
    setTimeout(() => {
      setTestCall("idle");
      pushToast("Appel test terminé — " + testNum, "ok");
    }, 3200);
  };

  return (
    <DashboardContext.Provider
      value={{
        view,
        setView: setViewState,
        tab,
        setTab,
        campaignId,
        setCampaignId,
        callId,
        setCallId,
        menuOpen,
        setMenuOpen,
        ka,
        kt,
        kc,
        kcr,
        tick,
        theme,
        setTheme,
        toggleTheme,
        notifOpen,
        setNotifOpen,
        profileOpen,
        setProfileOpen,
        faqOpen,
        setFaqOpen,
        company,
        setCompany: setCompanyState,
        profile,
        setProfile: setProfileState,
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
        setAutoRecharge,
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
        setStOver,
        searchQ,
        setSearchQ,
        playing,
        setPlaying,
        playT,
        setPlayT,
        testCall,
        setTestCall,
        testNum,
        setTestNum,
        chartRange,
        setChartRange,
        go,
        persistAccount,
        markAllRead,
        startTestCall,
        
        // Static data loaded from JSON
        campaigns: demoData.campaigns as Campaign[],
        calls: (demoData.calls as any[]).map((c: any) => ({
          ...c,
          dur: c.duration,
        })) as Call[],
        liveCalls: demoData.liveCalls as LiveCall[],
        directory: demoData.directory as Contact[],
        reports: demoData.reports as Report[],
        team: demoData.team as TeamMember[],
        notifications: demoData.notifications,
        faq: demoData.faq,
        plans: demoData.plans,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};
