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
import { inferCampaignQuestions } from "@/lib/campaign-questions";

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
        questions: { orderBy: { position: "asc" } },
      },
    });

    if (!campaign) return notFound("Campagne");

    // Les campagnes créées avant l'introduction de CampaignQuestion sont
    // normalisées une seule fois à partir de leur brief. Les graphiques et le
    // schéma d'analyse Vapi utilisent ensuite exclusivement ces lignes en BDD.
    let questions = campaign.questions;
    if (questions.length === 0) {
      const inferredQuestions = inferCampaignQuestions(campaign.aiBrief);
      if (inferredQuestions.length > 0) {
        await db.campaignQuestion.createMany({
          data: inferredQuestions.map((question) => ({ ...question, campaignId: campaign.id })),
          skipDuplicates: true,
        });
        questions = await db.campaignQuestion.findMany({
          where: { campaignId: campaign.id },
          orderBy: { position: "asc" },
        });
      }
    }

    // KPIs détaillés
    const [callStats, sentimentStats, insights, avgDuration] = await Promise.all([
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
      db.callInsight.findMany({
        where: { call: { campaignId: id } },
        select: { callId: true, sentimentScore: true, answers: true, topics: true, call: { select: { contact: { select: { city: true } } } } },
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
    const answerRows = insights.flatMap((insight) => {
      if (!insight.answers || typeof insight.answers !== "object" || Array.isArray(insight.answers)) return [];
      return [insight.answers as Record<string, unknown>];
    });
    const questionAnalytics = questions.map((question) => {
      const counts = new Map<string, number>();
      for (const answers of answerRows) {
        const answer = answers[question.key];
        if (answer === undefined || answer === null || answer === "") continue;
        const label = Array.isArray(answer) ? answer.map(String).join(", ") : String(answer);
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      const responseCount = Array.from(counts.values()).reduce((total, value) => total + value, 0);
      return {
        id: question.id,
        key: question.key,
        label: question.label,
        kind: question.kind,
        responseCount,
        distribution: Array.from(counts, ([label, count]) => ({ label, count, percentage: responseCount ? Math.round((count / responseCount) * 1000) / 10 : 0 })).sort((a, b) => b.count - a.count),
      };
    });
    const cities = new Map<string, { calls: number; sentimentTotal: number; sentimentCount: number }>();
    const topicCounts = new Map<string, number>();
    for (const insight of insights) {
      if (Array.isArray(insight.topics)) {
        for (const topic of insight.topics) {
          if (typeof topic !== "string" || !topic.trim()) continue;
          const label = topic.trim();
          topicCounts.set(label, (topicCounts.get(label) ?? 0) + 1);
        }
      }
      const city = insight.call.contact.city?.trim();
      if (!city) continue;
      const current = cities.get(city) ?? { calls: 0, sentimentTotal: 0, sentimentCount: 0 };
      current.calls += 1;
      if (insight.sentimentScore !== null) { current.sentimentTotal += insight.sentimentScore; current.sentimentCount += 1; }
      cities.set(city, current);
    }

    const npsQuestion = questions.find((question) => question.kind === "NPS");
    const npsValues = npsQuestion
      ? answerRows.flatMap((answers) => {
          const raw = answers[npsQuestion.key];
          const value = typeof raw === "number"
            ? raw
            : typeof raw === "string"
            ? Number(raw.replace(",", ".").match(/-?\d+(?:\.\d+)?/)?.[0])
            : NaN;
          return Number.isFinite(value) && value >= 0 && value <= 10 ? [value] : [];
        })
      : [];
    const npsPromoters = npsValues.filter((value) => value >= 9).length;
    const npsPassives = npsValues.filter((value) => value >= 7 && value < 9).length;
    const npsDetractors = npsValues.filter((value) => value < 7).length;
    const npsPercentage = (count: number) => npsValues.length
      ? Math.round((count / npsValues.length) * 1000) / 10
      : 0;
    const nps = npsQuestion
      ? {
          questionId: npsQuestion.id,
          key: npsQuestion.key,
          label: npsQuestion.label,
          responseCount: npsValues.length,
          score: npsValues.length ? Math.round(npsPercentage(npsPromoters) - npsPercentage(npsDetractors)) : null,
          promoters: { count: npsPromoters, percentage: npsPercentage(npsPromoters) },
          passives: { count: npsPassives, percentage: npsPercentage(npsPassives) },
          detractors: { count: npsDetractors, percentage: npsPercentage(npsDetractors) },
        }
      : null;

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
      questions,
      insights: insights.map((insight) => ({
        callId: insight.callId,
        sentimentScore: insight.sentimentScore,
        answers: insight.answers,
        topics: insight.topics,
        city: insight.call.contact.city,
      })),
      analytics: {
        nps,
        questions: questionAnalytics,
        cities: Array.from(cities, ([name, value]) => ({ name, calls: value.calls, sentiment: value.sentimentCount ? Math.round((value.sentimentTotal / value.sentimentCount) * 10) / 10 : null })).sort((a, b) => b.calls - a.calls),
        topics: Array.from(topicCounts, ([label, count]) => ({ label, count, percentage: insights.length ? Math.round((count / insights.length) * 1000) / 10 : 0 })).sort((a, b) => b.count - a.count).slice(0, 5),
      },
      status: campaign.status,
      maxRetries: campaign.maxRetries,
      retryDelayMinutes: campaign.retryDelayMinutes,
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
        ...(input.retryDelayMinutes !== undefined && { retryDelayMinutes: input.retryDelayMinutes }),
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

    if (input.aiBrief !== undefined && ["DRAFT", "SCHEDULED"].includes(campaign.status)) {
      const inferredQuestions = inferCampaignQuestions(input.aiBrief);
      await db.$transaction([
        db.campaignQuestion.deleteMany({ where: { campaignId: id } }),
        ...(inferredQuestions.length > 0
          ? [db.campaignQuestion.createMany({
              data: inferredQuestions.map((question) => ({ ...question, campaignId: id })),
            })]
          : []),
      ]);
    }

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
