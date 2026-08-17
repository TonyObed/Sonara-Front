// GET  /api/campaigns — Liste des campagnes de l'entreprise
// POST /api/campaigns — Créer une campagne
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { CreateCampaignSchema, CampaignsQuerySchema } from "@/lib/validation";
import { ok, created, unauthorized, forbidden, zodError, handleError } from "@/lib/response";
import { ZodError } from "zod";
import { inferCampaignQuestions } from "@/lib/campaign-questions";

// ─── GET : Liste des campagnes ────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(request.url);
    const query = CampaignsQuerySchema.parse(Object.fromEntries(searchParams));

    const where = {
      companyId: auth.companyId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [campaigns, total] = await Promise.all([
      db.campaign.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          _count: {
            select: { contacts: true, calls: true },
          },
        },
      }),
      db.campaign.count({ where }),
    ]);

    // PERF : un SEUL groupBy pour toutes les campagnes de la page (élimine le N+1).
    // On regroupe ensuite les stats par campaignId en mémoire.
    const campaignIds = campaigns.map((c: typeof campaigns[number]) => c.id);

    const allStats =
      campaignIds.length > 0
        ? await db.call.groupBy({
            by: ["campaignId", "status"],
            where: { campaignId: { in: campaignIds } },
            _count: { status: true },
          })
        : [];

    // Map : campaignId -> { status -> count }
    const statsByCampaign = new Map<string, Record<string, number>>();
    for (const s of allStats as Array<{
      campaignId: string;
      status: string;
      _count: { status: number };
    }>) {
      const entry = statsByCampaign.get(s.campaignId) ?? {};
      entry[s.status] = s._count.status;
      statsByCampaign.set(s.campaignId, entry);
    }

    // Enrichir chaque campagne avec ses KPIs (sans requête supplémentaire)
    const enriched = campaigns.map((campaign: typeof campaigns[number]) => {
      const statMap = statsByCampaign.get(campaign.id) ?? {};

      const totalCalls = campaign._count.calls;
      const completed = statMap["COMPLETED"] ?? 0;
      const failed =
        (statMap["FAILED"] ?? 0) +
        (statMap["NO_ANSWER"] ?? 0) +
        (statMap["BUSY"] ?? 0);
      const voicemail = statMap["VOICEMAIL"] ?? 0;

      return {
          id: campaign.id,
          name: campaign.name,
          sector: campaign.sector,
          status: campaign.status,
          aiVoice: campaign.aiVoice,
          maxRetries: campaign.maxRetries,
          timeStart: campaign.timeStart,
          timeEnd: campaign.timeEnd,
          scheduledAt: campaign.scheduledAt,
          startedAt: campaign.startedAt,
          completedAt: campaign.completedAt,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
          stats: {
            totalContacts: campaign._count.contacts,
            totalCalls,
            completed,
            failed,
            voicemail,
            responseRate:
              totalCalls > 0 ? Math.round((completed / totalCalls) * 100) : 0,
            progress:
              campaign._count.contacts > 0
                ? Math.round((completed / campaign._count.contacts) * 100)
                : 0,
          },
        };
      });

    return ok(enriched, {
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

// ─── POST : Créer une campagne ────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    // Viewers n'ont pas accès en écriture
    if (auth.role === "VIEWER") {
      return forbidden("Les viewers ne peuvent pas créer de campagnes.");
    }

    const body = await request.json();
    const input = CreateCampaignSchema.parse(body);
    const inferredQuestions = inferCampaignQuestions(input.aiBrief);

    const campaign = await db.campaign.create({
      data: {
        companyId: auth.companyId,
        name: input.name,
        sector: input.sector,
        aiBrief: input.aiBrief,
        aiVoice: input.aiVoice,
        aiTemperature: input.aiTemperature,
        // Réglages voix ElevenLabs (defaults Prisma si non fournis)
        aiVoiceId: input.aiVoiceId ?? null,
        ...(input.aiVoiceModel ? { aiVoiceModel: input.aiVoiceModel } : {}),
        ...(input.aiStability !== undefined ? { aiStability: input.aiStability } : {}),
        ...(input.aiSimilarity !== undefined ? { aiSimilarity: input.aiSimilarity } : {}),
        ...(input.aiStyle !== undefined ? { aiStyle: input.aiStyle } : {}),
        ...(input.aiSpeed !== undefined ? { aiSpeed: input.aiSpeed } : {}),
        ...(input.aiSpeakerBoost !== undefined ? { aiSpeakerBoost: input.aiSpeakerBoost } : {}),
        maxRetries: input.maxRetries,
        retryDelayMinutes: input.retryDelayMinutes,
        timeStart: input.timeStart,
        timeEnd: input.timeEnd,
        maxDuration: input.maxDuration,
        concurrency: input.concurrency,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
        ...(inferredQuestions.length > 0
          ? {
              questions: {
                create: inferredQuestions,
              },
            }
          : {}),
      },
    });

    return created({
      id: campaign.id,
      name: campaign.name,
      status: campaign.status,
      scheduledAt: campaign.scheduledAt,
      createdAt: campaign.createdAt,
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
