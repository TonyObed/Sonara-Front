// POST /api/campaigns/[id]/launch — Lancer une campagne (déclenche les appels)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, forbidden, notFound, badRequest, handleError } from "@/lib/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    if (auth.role === "VIEWER") return forbidden("Accès refusé.");

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        _count: { select: { contacts: true } },
        company: { select: { apiCredit: true, plan: true, isSandbox: true } },
      },
    });

    if (!campaign) return notFound("Campagne");

    // Vérifier le statut
    if (!["DRAFT", "SCHEDULED", "PAUSED"].includes(campaign.status)) {
      return badRequest(
        `Impossible de lancer une campagne avec le statut "${campaign.status}".`
      );
    }

    // Vérifier qu'il y a des contacts à appeler
    const pendingContacts = await db.contact.count({
      where: { campaignId: id, status: "PENDING" },
    });

    if (pendingContacts === 0) {
      return badRequest(
        "Aucun contact à appeler. Importez des contacts via CSV avant de lancer."
      );
    }

    // Vérifier le crédit (estimation : 1 crédit = 1 appel)
    if (!campaign.company.isSandbox && campaign.company.apiCredit < pendingContacts) {
      return badRequest(
        `Crédit insuffisant. Vous avez ${campaign.company.apiCredit} crédits, mais il faut en avoir au moins ${pendingContacts} pour cette campagne. Contactez Sonara pour recharger.`
      );
    }

    // Mettre à jour le statut
    await db.campaign.update({
      where: { id },
      data: {
        status: "RUNNING",
        startedAt: new Date(),
      },
    });

    // ─── INTÉGRATION VAPI (Phase 1 — à connecter avec les vraies clés) ──────────
    // En production, ici on déclencherait l'appel via Africa's Talking + Vapi.
    // Pour le MVP, le scheduler (APScheduler / cron Next.js) gère la file d'appels.
    // Le vrai déclenchement se fait dans /api/jobs/call-scheduler (à implémenter P1)

    // Lancer le job de scheduling en background via fetch interne
    // (évite de bloquer la réponse HTTP)
    const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    fetch(`${appUrl}/api/jobs/call-scheduler`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-key": process.env.INTERNAL_JOB_KEY ?? "dev-key" },
      body: JSON.stringify({ campaignId: id }),
    }).catch((e) => console.error("[launch] scheduler trigger failed:", e));

    return ok({
      campaignId: id,
      status: "RUNNING",
      pendingContacts,
      sandbox: campaign.company.isSandbox,
      message: `Campagne lancée. ${pendingContacts} contact(s) vont être appelés.`,
    });
  } catch (error) {
    return handleError(error);
  }
}
