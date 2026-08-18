// ─────────────────────────────────────────────────────────────────────────────
// Sonara — Client API typé (à destination de l'équipe frontend)
//
// Wrapper léger et SANS dépendance autour de fetch. Toutes les fonctions :
//  - utilisent les cookies httpOnly de session (credentials: "include")
//  - dépaquettent l'enveloppe { success, data, error, meta }
//  - lèvent une ApiError en cas d'échec (à catcher côté UI)
//
// Exemple :
//   import { api } from "@/lib/api-client";
//   const { data, meta } = await api.campaigns.list({ page: 1 });
// ─────────────────────────────────────────────────────────────────────────────

// ─── TYPES DE BASE ────────────────────────────────────────────────────────────

export interface ApiMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  meta?: ApiMeta;
  error?: { code: string; message: string; details?: Array<{ field: string; message: string }> };
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: Array<{ field: string; message: string }>;
  constructor(
    message: string,
    code: string,
    status: number,
    details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

// ─── DOMAIN TYPES ───────────────────────────────────────────────────────────

export type Role = "ADMIN" | "MANAGER" | "VIEWER";
export type CampaignStatus =
  | "DRAFT" | "SCHEDULED" | "RUNNING" | "PAUSED" | "COMPLETED" | "STOPPED";
export type CallStatus =
  | "INITIATED" | "RINGING" | "IN_PROGRESS" | "COMPLETED"
  | "FAILED" | "VOICEMAIL" | "NO_ANSWER" | "TRANSFERRED" | "BUSY";

export interface Company {
  id: string;
  name: string;
  email: string;
  plan: string;
  apiCredit: number;
  isSandbox?: boolean;
  twoFactorEnabled?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  avatarUrl?: string | null;
}

/** Réglages voix ElevenLabs renvoyés par le détail campagne. */
export interface VoiceSettings {
  voiceId: string | null;
  model: string;
  stability: number;
  similarity: number;
  style: number;
  speed: number;
  speakerBoost: boolean;
}

/** Champs voix acceptés à la création/màj d'une campagne. */
export interface VoiceSettingsInput {
  aiVoiceId: string | null;
  aiVoiceModel: string;
  aiStability: number;
  aiSimilarity: number;
  aiStyle: number;
  aiSpeed: number;
  aiSpeakerBoost: boolean;
}

export interface CampaignStats {
  totalContacts: number;
  totalCalls: number;
  completed: number;
  failed: number;
  voicemail: number;
  responseRate: number;
  progress: number;
}

export interface Campaign {
  id: string;
  name: string;
  sector: string | null;
  status: CampaignStatus;
  aiVoice: string;
  maxRetries: number;
  timeStart: string;
  timeEnd: string;
  scheduledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  stats: CampaignStats;
}

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp?: string;
}

export interface Call {
  id: string;
  status: CallStatus;
  durationSec: number | null;
  costFcfa: number | null;
  startedAt: string | null;
  endedAt: string | null;
  summary: string | null;
  sentimentScore?: number | null;
  transcript: TranscriptEntry[];
  contact: { id: string; firstName: string | null; lastName: string | null; phone: string; city?: string | null };
}

/** Entrée de l'annuaire global (agrégée par numéro, toutes campagnes). */
export interface DirectoryContact {
  name: string;
  phone: string;
  city: string;
  segment: string;
  campaigns: number;
  lastCall: string;
  optout: boolean;
}

/** Appel en cours (monitoring temps réel). */
export interface LiveCall {
  name: string;
  campaign: string;
  startedSecondsAgo: number;
}

export interface DashboardData {
  credit: number;
  creditLimit: number;
  live: { active: number; capacity: number; queued: number };
  responseRate: number;
  calls: { launched: number; answered: number };
  today: { launched: number; answered: number; responseRate: number };
  lastHour: { launched: number; answered: number; responseRate: number };
  outcomes: { completed: number; unreachable: number; voicemail: number; failed: number };
  daily: Array<{ date: string; started: number; answered: number }>;
  events: Array<{ type: string; at: string; kind: "ok" | "info" | "warn" | "alert"; text: string }>;
}

export interface NotificationRecord {
  id: string;
  type: "INFO" | "CAMPAIGN" | "CALL" | "CREDIT" | "SECURITY";
  title: string;
  message: string;
  readAt: string | null;
  createdAt: string;
}

export interface CompanyMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: Role;
  isActive: boolean;
}

// ─── FETCH WRAPPER ────────────────────────────────────────────────────────────

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T; meta?: ApiMeta }> {
  const res = await fetch(`/api${path}`, {
    credentials: "include",
    // Les états d'appel et les transcriptions évoluent après les webhooks :
    // ne jamais réutiliser une réponse navigateur/Vercel obsolète.
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    ...options,
  });

  let json: ApiEnvelope<T>;
  try {
    json = (await res.json()) as ApiEnvelope<T>;
  } catch {
    throw new ApiError("Réponse serveur illisible.", "PARSE_ERROR", res.status);
  }

  if (!res.ok || !json.success) {
    throw new ApiError(
      json.error?.message ?? "Erreur inconnue.",
      json.error?.code ?? "UNKNOWN",
      res.status,
      json.error?.details
    );
  }

  return { data: json.data as T, meta: json.meta };
}

const get = <T>(p: string) => request<T>(p).then((r) => r);
const post = <T>(p: string, body?: unknown) =>
  request<T>(p, { method: "POST", body: body ? JSON.stringify(body) : undefined });
const patch = <T>(p: string, body?: unknown) =>
  request<T>(p, { method: "PATCH", body: body ? JSON.stringify(body) : undefined });

// ─── API SURFACE ────────────────────────────────────────────────────────────

export const api = {
  auth: {
    register: (body: { fullName: string; companyName: string; email: string; password: string }) =>
      post<{ company: Company; user: User; accessToken: string }>("/auth/register", body),
    login: (body: { email: string; password: string }) =>
      post<{ company: Company; user: User; accessToken: string; twoFactorRequired?: boolean; preAuthToken?: string }>("/auth/login", body),
    verify2FA: (body: { preAuthToken: string; code: string }) =>
      post<{ company: Company; user: User; accessToken: string }>("/auth/2fa/verify", body),
    logout: () => post<{ message: string }>("/auth/logout"),
    me: () => get<{ company: Company; user: User }>("/auth/me"),
    updateProfile: (body: { firstName?: string; lastName?: string | null; email?: string; avatarUrl?: string | null }) =>
      patch<User>("/auth/profile", body),
    forgotPassword: (body: { email: string }) =>
      post<{ message: string; resetUrl?: string }>("/auth/forgot-password", body),
    resetPassword: (body: { token: string; password: string }) =>
      post<{ message: string }>("/auth/reset-password", body),
    invite: (body: { email: string; role: Role }) =>
      post<{ inviteUrl: string; email: string; role: Role; expiresAt: string }>("/auth/invite", body),
    validateInvite: (token: string) =>
      get<{ email: string; role: Role; company: { name: string; plan: string }; expiresAt: string }>(
        `/auth/invite?token=${encodeURIComponent(token)}`
      ),
    acceptInvite: (body: { token: string; firstName: string; lastName: string; password: string }) =>
      post<{ company: Company; user: User; accessToken: string }>("/auth/accept-invite", body),
  },

  campaigns: {
    list: (params?: { page?: number; limit?: number; status?: CampaignStatus }) => {
      const q = new URLSearchParams();
      if (params?.page) q.set("page", String(params.page));
      if (params?.limit) q.set("limit", String(params.limit));
      if (params?.status) q.set("status", params.status);
      const qs = q.toString();
      return get<Campaign[]>(`/campaigns${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) =>
      get<Campaign & { kpis: Record<string, number>; voiceSettings: VoiceSettings }>(
        `/campaigns/${id}`
      ),
    create: (body: {
      name: string;
      aiBrief: string;
      sector?: string;
      aiVoice?: string;
      aiTemperature?: number;
      maxRetries?: number;
      retryDelayMinutes?: number;
      timeStart?: string;
      timeEnd?: string;
      maxDuration?: number;
      concurrency?: number;
    } & Partial<VoiceSettingsInput>) => post<Campaign>("/campaigns", body),
    updateStatus: (id: string, status: CampaignStatus) =>
      patch<Campaign>(`/campaigns/${id}`, { status }),
    launch: (id: string) => post<{ message: string }>(`/campaigns/${id}/launch`),
    pause: (id: string) => post<{ message: string }>(`/campaigns/${id}/pause`),
    calls: (id: string) => get<Call[]>(`/campaigns/${id}/calls`),
    exportUrl: (id: string) => `/api/campaigns/${id}/export`,
  },

  calls: {
    get: (id: string) => get<Call>(`/calls/${id}`),
    /** Appels en cours de l'entreprise (monitoring live). */
    live: () => get<LiveCall[]>("/calls/live"),
    /** Déclenche un appel de test (ADMIN/MANAGER) — fait sonner un vrai téléphone. */
    test: (body: { phone: string; aiVoice?: string; aiTemperature?: number; aiBrief?: string; firstName?: string }) =>
      post<{ message: string; vapiCallId: string; phone: string }>("/calls/test", body),
  },

  contacts: {
    /** Annuaire global de l'entreprise (toutes campagnes, dédupliqué par numéro). */
    list: () => get<DirectoryContact[]>("/contacts"),
  },

  company: {
    dashboard: () => get<DashboardData>("/company/dashboard"),
    usage: () =>
      get<{
        credit: { remaining: number; referenceLimit: number; estimatedMinutesRemaining: number };
        campaigns: Record<string, number>;
        calls: {
          total: number;
          totalCostFcfa: number;
          thisMonth: { count: number; costFcfa: number };
          usageThisMonth: Array<{ campaignId: string; campaign: string; calls: number; costFcfa: number; percentage: number }>;
        };
      }>("/company/usage"),
    members: () => get<CompanyMember[]>("/company/members"),
  },

  notifications: {
    list: () => get<NotificationRecord[]>("/notifications"),
    markRead: (ids: string[]) => patch<{ message: string }>("/notifications", { ids }),
  },

  leads: {
    /** Capture publique d'un prospect (« Demander une démo »). */
    create: (body: { name: string; email: string; company?: string; phone?: string; message?: string }) =>
      post<{ message: string }>("/leads", body),
  },
};
