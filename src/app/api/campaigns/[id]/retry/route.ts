import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, internalError, notFound, ok, unauthorized } from "@/lib/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (auth.role === "VIEWER") return forbidden("Les utilisateurs en lecture seule ne peuvent pas relancer des appels.");

    const { id } = await params;
    const body = await request.json().catch(() => ({})) as { force?: boolean };
    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
      select: { id: true, status: true, maxRetries: true },
    });
    if (!campaign) return notFound("Campagne");
    if (campaign.status !== "RUNNING") return badRequest("La campagne doit être en cours pour relancer ses contacts.");

    if (body.force === true) {
      await db.contact.updateMany({
        where: {
          campaignId: id,
          status: "PENDING",
          attempts: { gt: 0, lt: campaign.maxRetries },
        },
        data: { nextRetryAt: new Date() },
      });
    }

    const dueContacts = await db.contact.count({
      where: {
        campaignId: id,
        status: "PENDING",
        attempts: { gt: 0, lt: campaign.maxRetries },
        OR: [{ nextRetryAt: null }, { nextRetryAt: { lte: new Date() } }],
      },
    });
    if (dueContacts === 0) {
      return ok({ processed: 0, message: "Aucune relance n'est arrivée à échéance." });
    }

    const schedulerOrigin = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
    const schedulerResponse = await fetch(`${schedulerOrigin}/api/jobs/call-scheduler`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": process.env.INTERNAL_JOB_KEY ?? "dev-key",
      },
      body: JSON.stringify({ campaignId: id }),
    }).catch(() => null);
    if (!schedulerResponse?.ok) return internalError("Le moteur de relance est momentanément indisponible.");

    const schedulerPayload = await schedulerResponse.json().catch(() => null) as {
      data?: { processed?: number; message?: string };
    } | null;
    return ok({
      processed: schedulerPayload?.data?.processed ?? 0,
      message: schedulerPayload?.data?.message ?? `${dueContacts} relance(s) transmise(s) au moteur d'appels.`,
    });
  } catch (error) {
    return handleError(error);
  }
}
