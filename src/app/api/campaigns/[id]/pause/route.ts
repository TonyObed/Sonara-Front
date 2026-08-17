// POST /api/campaigns/[id]/pause  — Mettre en pause
// POST /api/campaigns/[id]/resume — Reprendre (si besoin d'un endpoint dédié)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, forbidden, notFound, badRequest, internalError, handleError } from "@/lib/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    if (auth.role === "VIEWER") return forbidden("Accès refusé.");

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
    });

    if (!campaign) return notFound("Campagne");

    const body = await request.json().catch(() => ({}));
    const action: "pause" | "resume" | "stop" = body.action ?? "pause";

    const transitions: Record<string, { from: string[]; to: string }> = {
      pause:  { from: ["RUNNING"],          to: "PAUSED"  },
      resume: { from: ["PAUSED"],            to: "RUNNING" },
      stop:   { from: ["RUNNING", "PAUSED"], to: "STOPPED" },
    };

    const transition = transitions[action];
    if (!transition) {
      return badRequest(`Action invalide : "${action}". Valeurs acceptées : pause, resume, stop.`);
    }

    if (!transition.from.includes(campaign.status)) {
      return badRequest(
        `Impossible d'effectuer "${action}" sur une campagne en statut "${campaign.status}".`
      );
    }

    const updated = await db.campaign.update({
      where: { id },
      data: {
        status: transition.to as "PAUSED" | "RUNNING" | "STOPPED",
        ...(transition.to === "STOPPED" ? { completedAt: new Date() } : {}),
        ...(transition.to === "RUNNING" && campaign.status === "PAUSED"
          ? { startedAt: campaign.startedAt ?? new Date() }
          : {}),
      },
    });

    // Une reprise doit repartir immédiatement dans la file d'appels. Comme
    // pour le lancement initial, on attend le scheduler : sur Vercel une
    // requête non attendue peut être interrompue à la fin de cette réponse.
    if (action === "resume") {
      // Les previews Vercel peuvent être protégées par SSO. Utiliser APP_URL
      // évite que la relance interne soit rejetée par cette protection.
      const schedulerOrigin = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
      const schedulerResponse = await fetch(`${schedulerOrigin}/api/jobs/call-scheduler`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-key": process.env.INTERNAL_JOB_KEY ?? "dev-key",
        },
        body: JSON.stringify({ campaignId: id }),
      }).catch((error) => {
        console.error("[resume] scheduler trigger failed:", error);
        return null;
      });

      if (!schedulerResponse?.ok) {
        await db.campaign.update({
          where: { id },
          data: { status: "PAUSED" },
        });
        const detail = schedulerResponse ? await schedulerResponse.text() : "Erreur réseau interne.";
        console.error("[resume] scheduler refused campaign:", detail);
        return internalError("Le moteur d'appels n'a pas pu reprendre la campagne. Réessayez dans un instant.");
      }
    }

    const messages: Record<string, string> = {
      pause:  "Campagne mise en pause. Les appels en cours se terminent normalement.",
      resume: "Campagne reprise. Les appels reprennent.",
      stop:   "Campagne arrêtée définitivement.",
    };

    return ok({
      campaignId: id,
      status: updated.status,
      message: messages[action],
    });
  } catch (error) {
    return handleError(error);
  }
}
