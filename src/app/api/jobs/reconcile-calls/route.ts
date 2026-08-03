// POST /api/jobs/reconcile-calls — récupération prudente des appels bloqués.
// Ce job est prévu pour être planifié par le futur scheduler de production.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";
import { recomputeCampaignStatus } from "@/lib/campaign-status";

const ACTIVE_CALL_STATUSES = ["INITIATED", "RINGING", "IN_PROGRESS"] as const;
const GRACE_MS = Number(process.env.CALL_RECONCILE_GRACE_MINUTES ?? 10) * 60_000;

export async function POST(request: NextRequest) {
  try {
    const expectedKey = process.env.INTERNAL_JOB_KEY;
    if (process.env.NODE_ENV === "production" && (!expectedKey || expectedKey.length < 16)) {
      return unauthorized("Configuration serveur invalide.");
    }
    if (request.headers.get("x-internal-key") !== (expectedKey ?? "dev-key")) {
      return unauthorized("Clé interne invalide.");
    }

    const candidates = await db.call.findMany({
      where: { status: { in: [...ACTIVE_CALL_STATUSES] } },
      include: {
        contact: { select: { id: true, attempts: true } },
        campaign: { select: { id: true, maxRetries: true, maxDuration: true } },
      },
      take: 100,
    });

    let recovered = 0;
    const affectedCampaigns = new Set<string>();
    for (const call of candidates) {
      const expiresAt = call.updatedAt.getTime() + call.campaign.maxDuration * 1000 + GRACE_MS;
      if (expiresAt > Date.now()) continue;

      // Condition sur le statut : un webhook arrivé entre-temps gagne la course.
      const updated = await db.call.updateMany({
        where: { id: call.id, status: { in: [...ACTIVE_CALL_STATUSES] } },
        data: { status: "FAILED", endedAt: new Date() },
      });
      if (updated.count === 0) continue;

      const retry = call.contact.attempts + 1 < call.campaign.maxRetries;
      await db.contact.update({
        where: { id: call.contact.id },
        data: {
          status: retry ? "PENDING" : "FAILED",
          attempts: { increment: 1 },
          lastCalledAt: new Date(),
        },
      });
      recovered++;
      affectedCampaigns.add(call.campaign.id);
    }

    await Promise.all([...affectedCampaigns].map(recomputeCampaignStatus));
    return ok({ recovered, examined: candidates.length });
  } catch (error) {
    return handleError(error);
  }
}
