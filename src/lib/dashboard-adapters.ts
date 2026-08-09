// ─────────────────────────────────────────────────────────────────────────────
// Sonara — Adaptateurs API → formes attendues par le dashboard (demo-data.json)
//
// Le dashboard a été conçu sur des données statiques (`demo-data.json`) dont les
// formes diffèrent des types de l'API (`@/lib/api-client`). Ces fonctions font le
// pont, vue par vue, pendant l'intégration progressive du backend.
// ─────────────────────────────────────────────────────────────────────────────

import type { Campaign as ApiCampaign, CampaignStatus, Call as ApiCall } from "@/lib/api-client";
import type { Campaign as FrontCampaign } from "@/app/dashboard/DashboardContext";

// ─── STATUTS ──────────────────────────────────────────────────────────────────
// API (MAJUSCULES) → front ("live" | "paused" | "done" | "scheduled" | "draft")
const STATUS_MAP: Record<CampaignStatus, FrontCampaign["status"]> = {
  RUNNING: "live",
  PAUSED: "paused",
  COMPLETED: "done",
  SCHEDULED: "scheduled",
  DRAFT: "draft",
  STOPPED: "done",
};

// ─── DATE ───────────────────────────────────────────────────────────────────
// ISO → "02 juin" (format court français utilisé par l'UI). null si absente.
function frShortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
}

// ─── APPELS ───────────────────────────────────────────────────────────────────
// Statut API (MAJUSCULES) → statut visuel du tableau d'appels.
type FrontCallStatus = "completed" | "transferred" | "unreachable" | "voicemail" | "failed";
const CALL_STATUS_MAP: Record<string, FrontCallStatus> = {
  COMPLETED: "completed",
  TRANSFERRED: "transferred",
  NO_ANSWER: "unreachable",
  BUSY: "unreachable",
  FAILED: "failed",
  VOICEMAIL: "voicemail",
};

/** Forme d'une ligne du tableau « Appels » (onglet détail campagne). */
export interface CampaignCallRow {
  id: string;
  name: string;
  city: string;
  time: string;
  dur: string | null;
  sentiment: number | null;
  status: FrontCallStatus;
  summary: string | null;
}

// secondes → "m:ss" ; null → null
function durLabel(sec: number | null): string | null {
  if (sec === null || sec === undefined) return null;
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;
}

function callerName(c: ApiCall): string {
  const name = [c.contact.firstName, c.contact.lastName].filter(Boolean).join(" ").trim();
  return name || c.contact.phone;
}

/** Convertit un appel API en ligne du tableau « Appels ». */
export function mapApiCallToRow(c: ApiCall): CampaignCallRow {
  return {
    id: c.id,
    name: callerName(c),
    city: c.contact.city ?? "—",
    time: c.startedAt
      ? new Date(c.startedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
      : "—",
    dur: durLabel(c.durationSec),
    sentiment: c.sentimentScore ?? null,
    status: CALL_STATUS_MAP[c.status] ?? "completed",
    summary: c.summary,
  };
}

/** Convertit une campagne API en la forme consommée par la page liste. */
export function mapApiCampaignToFront(c: ApiCampaign): FrontCampaign {
  const done = c.stats.totalCalls;
  const total = c.stats.totalContacts;
  const hasCalls = c.stats.totalCalls > 0;

  return {
    id: c.id,
    name: c.name,
    sector: c.sector ?? "—",
    status: STATUS_MAP[c.status] ?? "draft",
    done,
    total,
    // L'API renvoie un taux numérique (0–100) ; l'UI attend une chaîne "71%".
    responseRate: hasCalls ? `${Math.round(c.stats.responseRate)}%` : null,
    // Le sentiment moyen par campagne n'est pas encore exposé par l'API.
    sentiment: null,
    date:
      frShortDate(c.completedAt) ??
      frShortDate(c.startedAt) ??
      frShortDate(c.scheduledAt) ??
      frShortDate(c.createdAt),
    voice: c.aiVoice,
  };
}
