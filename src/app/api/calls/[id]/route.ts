// GET /api/calls/[id] — Détail d'un appel : transcription complète + résumé + méta
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, notFound, handleError } from "@/lib/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const call = await db.call.findUnique({
      where: { id },
      include: {
        contact: true,
        campaign: {
          select: {
            id: true,
            name: true,
            companyId: true,
            sector: true,
          },
        },
        events: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            eventType: true,
            createdAt: true,
          },
        },
        insight: true,
      },
    });

    if (!call) return notFound("Appel");

    // Vérifier l'appartenance à l'entreprise (isolation multi-tenant)
    if (call.campaign.companyId !== auth.companyId) {
      return notFound("Appel"); // 404 plutôt que 403 pour éviter l'énumération
    }

    return ok({
      id: call.id,
      status: call.status,
      durationSec: call.durationSec,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      transcript: call.transcript,     // [{speaker, text, timestamp}]
      summary: call.summary,
      recordingUrl: call.recordingUrl,
      costFcfa: call.costFcfa,
      attemptNumber: call.attemptNumber,
      vapiCallId: call.vapiCallId,
      createdAt: call.createdAt,
      contact: {
        id: call.contact.id,
        phone: call.contact.phone,
        firstName: call.contact.firstName,
        lastName: call.contact.lastName,
        city: call.contact.city,
        segment: call.contact.segment,
        attempts: call.contact.attempts,
      },
      campaign: {
        id: call.campaign.id,
        name: call.campaign.name,
        sector: call.campaign.sector,
      },
      events: call.events,
      insight: call.insight,
    });
  } catch (error) {
    return handleError(error);
  }
}
