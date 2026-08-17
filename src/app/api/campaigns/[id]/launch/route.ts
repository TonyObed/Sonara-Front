// POST /api/campaigns/[id]/launch — Lancer une campagne (déclenche les appels)
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

    // L'appel au scheduler doit être attendu. Une requête "fire-and-forget"
    // est souvent interrompue par Vercel dès que cette route répond : la
    // campagne restait alors RUNNING mais aucun contact n'était envoyé à Vapi.
    // request.nextUrl.origin désigne exactement le déploiement qui a reçu le
    // lancement, y compris en Preview ou en production.
    const schedulerResponse = await fetch(`${request.nextUrl.origin}/api/jobs/call-scheduler`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-key": process.env.INTERNAL_JOB_KEY ?? "dev-key" },
      body: JSON.stringify({ campaignId: id }),
    }).catch((error) => {
      console.error("[launch] scheduler trigger failed:", error);
      return null;
    });

    if (!schedulerResponse?.ok) {
      // Ne jamais laisser une campagne affichée comme active si le moteur n'a
      // pas pu prendre en charge ses contacts. Le client peut la relancer
      // proprement après correction de la configuration serveur.
      await db.campaign.update({
        where: { id },
        data: {
          status: campaign.status,
          startedAt: campaign.startedAt,
        },
      });
      const detail = schedulerResponse ? await schedulerResponse.text() : "Erreur réseau interne.";
      console.error("[launch] scheduler refused campaign:", detail);
      return internalError("Le moteur d'appels n'a pas pu démarrer la campagne. Réessayez dans un instant.");
    }

    const schedulerData = await schedulerResponse.json().catch(() => null) as {
      data?: { processed?: number; message?: string };
    } | null;

    return ok({
      campaignId: id,
      status: "RUNNING",
      pendingContacts,
      sandbox: campaign.company.isSandbox,
      message: schedulerData?.data?.message ?? `Campagne lancée. ${pendingContacts} contact(s) vont être appelés.`,
    });
  } catch (error) {
    return handleError(error);
  }
}
