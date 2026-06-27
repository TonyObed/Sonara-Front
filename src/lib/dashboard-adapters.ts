// ─────────────────────────────────────────────────────────────────────────────
// Sonara — Adaptateurs API → formes attendues par le dashboard (demo-data.json)
//
// Le dashboard a été conçu sur des données statiques (`demo-data.json`) dont les
// formes diffèrent des types de l'API (`@/lib/api-client`). Ces fonctions font le
// pont, vue par vue, pendant l'intégration progressive du backend.
// ─────────────────────────────────────────────────────────────────────────────

import type { Campaign as ApiCampaign, CampaignStatus } from "@/lib/api-client";
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
