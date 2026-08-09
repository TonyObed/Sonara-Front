// GET /api/campaigns/[id]/calls — Liste des appels d'une campagne (paginée)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { CallsQuerySchema } from "@/lib/validation";
import { ok, unauthorized, notFound, zodError, handleError } from "@/lib/response";
import { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
    });
    if (!campaign) return notFound("Campagne");

    const { searchParams } = new URL(request.url);
    const query = CallsQuerySchema.parse(Object.fromEntries(searchParams));

    const where = {
      campaignId: id,
      ...(query.status ? { status: query.status } : {}),
    };

    const [calls, total] = await Promise.all([
      db.call.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          insight: { select: { sentimentScore: true } },
          contact: {
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
              city: true,
              segment: true,
            },
          },
        },
      }),
      db.call.count({ where }),
    ]);

    const formatted = calls.map((call: typeof calls[number]) => ({
      id: call.id,
      status: call.status,
      durationSec: call.durationSec,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      summary: call.summary,
      attemptNumber: call.attemptNumber,
      costFcfa: call.costFcfa,
      sentimentScore: call.insight?.sentimentScore ?? null,
      contact: call.contact,
      // Transcription non incluse dans la liste — récupérée via GET /calls/[id]
    }));

    return ok(formatted, {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
