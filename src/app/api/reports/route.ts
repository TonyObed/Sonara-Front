import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, ok, unauthorized } from "@/lib/response";
import { generateReport } from "@/lib/reports";

// Toutes les ressources de reporting sont isolées par companyId. Un compte
// sans campagne n'a simplement aucun rapport ni programmation à afficher.
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const [reports, schedules, insights] = await Promise.all([
      db.report.findMany({
        where: { companyId: auth.companyId },
        include: { campaign: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.reportSchedule.findMany({
        where: { companyId: auth.companyId },
        include: { campaign: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.callInsight.findMany({
        where: { call: { campaign: { companyId: auth.companyId } } },
        select: { sentimentScore: true, topics: true },
      }),
    ]);
    const sentimentValues = insights.flatMap((insight) => insight.sentimentScore === null ? [] : [insight.sentimentScore]);
    const topicCounts = new Map<string, number>();
    for (const insight of insights) {
      if (!Array.isArray(insight.topics)) continue;
      for (const topic of insight.topics) {
        if (typeof topic !== "string" || !topic.trim()) continue;
        const label = topic.trim();
        topicCounts.set(label, (topicCounts.get(label) ?? 0) + 1);
      }
    }
    const topTopic = Array.from(topicCounts, ([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count)[0] ?? null;
    return ok({
      reports,
      schedules,
      analytics: {
        analyzedCalls: insights.length,
        averageSentiment: sentimentValues.length
          ? Math.round((sentimentValues.reduce((sum, value) => sum + value, 0) / sentimentValues.length) * 10) / 10
          : null,
        topTopic,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (auth.role === "VIEWER") return forbidden("La génération de rapports est réservée aux administrateurs et managers.");
    const body = await request.json().catch(() => ({}));
    if (body.campaignId !== undefined && (typeof body.campaignId !== "string" || !body.campaignId.trim())) {
      return badRequest("campaignId doit être une chaîne non vide.");
    }
    const report = await generateReport({ companyId: auth.companyId, campaignId: body.campaignId?.trim() || null });
    return ok(report, undefined, 201);
  } catch (error) {
    return handleError(error);
  }
}
