// GET   /api/campaigns/[id] — Détail + KPIs d'une campagne
// PATCH /api/campaigns/[id] — Modifier une campagne
// DELETE /api/campaigns/[id] — Supprimer une campagne (DRAFT seulement)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { UpdateCampaignSchema } from "@/lib/validation";
import {
  ok,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  zodError,
  handleError,
} from "@/lib/response";
import { ZodError } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET : Détail campagne + KPIs ─────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
      include: {
        _count: { select: { contacts: true, calls: true } },
      },
    });

    if (!campaign) return notFound("Campagne");

    // KPIs détaillés
    const [callStats, sentimentStats, avgDuration] = await Promise.all([
      db.call.groupBy({
        by: ["status"],
        where: { campaignId: id },
        _count: { status: true },
      }),
      db.call.aggregate({
        where: { campaignId: id, status: "COMPLETED" },
        _avg: { durationSec: true },
        _sum: { costFcfa: true },
      }),
      db.call.aggregate({
        where: { campaignId: id, status: "COMPLETED" },
        _avg: { durationSec: true },
      }),
    ]);

    const statMap = Object.fromEntries(
      callStats.map((s: { status: string; _count: { status: number } }) => [s.status, s._count.status])
    );

    const totalCalls = campaign._count.calls;
    const completed = statMap["COMPLETED"] ?? 0;
    const failed = (statMap["FAILED"] ?? 0) + (statMap["NO_ANSWER"] ?? 0) + (statMap["BUSY"] ?? 0);
    const voicemail = statMap["VOICEMAIL"] ?? 0;
    const transferred = statMap["TRANSFERRED"] ?? 0;
    const inProgress = (statMap["IN_PROGRESS"] ?? 0) + (statMap["RINGING"] ?? 0);

    return ok({
      id: campaign.id,
      name: campaign.name,
      sector: campaign.sector,
      aiBrief: campaign.aiBrief,
      aiVoice: campaign.aiVoice,
      aiTemperature: campaign.aiTemperature,
      // Réglages voix ElevenLabs (pour l'UI de paramètres)
      voiceSettings: {
        voiceId: campaign.aiVoiceId,
        model: campaign.aiVoiceModel,
        stability: campaign.aiStability,
        similarity: campaign.aiSimilarity,
        style: campaign.aiStyle,
        speed: campaign.aiSpeed,
        speakerBoost: campaign.aiSpeakerBoost,
      },
      status: campaign.status,
      maxRetries: campaign.maxRetries,
      timeStart: campaign.timeStart,
      timeEnd: campaign.timeEnd,
      maxDuration: campaign.maxDuration,
      concurrency: campaign.concurrency,
      scheduledAt: campaign.scheduledAt,
      startedAt: campaign.startedAt,
      completedAt: campaign.completedAt,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      kpis: {
        totalContacts: campaign._count.contacts,
        totalCalls,
        completed,
        failed,
        voicemail,
        transferred,
        inProgress,
        responseRate: totalCalls > 0 ? Math.round((completed / totalCalls) * 1000) / 10 : 0,
        progress:
          campaign._count.contacts > 0
            ? Math.round((completed / campaign._count.contacts) * 1000) / 10
            : 0,
        avgDurationSec: Math.round(avgDuration._avg.durationSec ?? 0),
        totalCostFcfa: Math.round(sentimentStats._sum.costFcfa ?? 0),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── PATCH : Modifier une campagne ────────────────────────────────────────────

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    if (auth.role === "VIEWER") return forbidden("Accès refusé.");

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
    });

    if (!campaign) return notFound("Campagne");

    const body = await request.json();
    const input = UpdateCampaignSchema.parse(body);

    // Règles métier sur les transitions de statut
    if (input.status) {
      const allowedTransitions: Record<string, string[]> = {
        DRAFT: ["SCHEDULED", "RUNNING"],
        SCHEDULED: ["DRAFT", "RUNNING", "STOPPED"],
        RUNNING: ["PAUSED", "STOPPED"],
        PAUSED: ["RUNNING", "STOPPED"],
        COMPLETED: [],
        STOPPED: [],
      };

      const allowed = allowedTransitions[campaign.status] ?? [];
      if (!allowed.includes(input.status)) {
        return badRequest(
          `Transition invalide : ${campaign.status} → ${input.status}. Transitions autorisées : ${allowed.join(", ") || "aucune"}.`
        );
      }
    }

    const updated = await db.campaign.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.sector !== undefined && { sector: input.sector }),
        ...(input.aiBrief !== undefined && { aiBrief: input.aiBrief }),
        ...(input.aiVoice !== undefined && { aiVoice: input.aiVoice }),
        ...(input.aiTemperature !== undefined && { aiTemperature: input.aiTemperature }),
        ...(input.aiVoiceId !== undefined && { aiVoiceId: input.aiVoiceId }),
        ...(input.aiVoiceModel !== undefined && { aiVoiceModel: input.aiVoiceModel }),
        ...(input.aiStability !== undefined && { aiStability: input.aiStability }),
        ...(input.aiSimilarity !== undefined && { aiSimilarity: input.aiSimilarity }),
        ...(input.aiStyle !== undefined && { aiStyle: input.aiStyle }),
        ...(input.aiSpeed !== undefined && { aiSpeed: input.aiSpeed }),
        ...(input.aiSpeakerBoost !== undefined && { aiSpeakerBoost: input.aiSpeakerBoost }),
        ...(input.maxRetries !== undefined && { maxRetries: input.maxRetries }),
        ...(input.timeStart !== undefined && { timeStart: input.timeStart }),
        ...(input.timeEnd !== undefined && { timeEnd: input.timeEnd }),
        ...(input.maxDuration !== undefined && { maxDuration: input.maxDuration }),
        ...(input.concurrency !== undefined && { concurrency: input.concurrency }),
        ...(input.scheduledAt !== undefined && {
          scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        }),
        ...(input.status !== undefined && {
          status: input.status,
          ...(input.status === "RUNNING" && !campaign.startedAt
            ? { startedAt: new Date() }
            : {}),
          ...(input.status === "COMPLETED" || input.status === "STOPPED"
            ? { completedAt: new Date() }
            : {}),
        }),
      },
    });

    return ok({
      id: updated.id,
      name: updated.name,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}

// ─── DELETE : Supprimer une campagne ─────────────────────────────────────────

export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    if (auth.role !== "ADMIN") return forbidden("Seul l'administrateur peut supprimer.");

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
    });

    if (!campaign) return notFound("Campagne");

    if (!["DRAFT", "STOPPED", "COMPLETED"].includes(campaign.status)) {
      return badRequest(
        "Impossible de supprimer une campagne en cours ou planifiée. Arrêtez-la d'abord."
      );
    }

    await db.campaign.delete({ where: { id } });

    return ok({ message: "Campagne supprimée avec succès." });
  } catch (error) {
    return handleError(error);
  }
}
