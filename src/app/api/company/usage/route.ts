// GET /api/company/usage — Crédit restant + statistiques d'usage
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, handleError } from "@/lib/response";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const [company, campaignStats, callStats] = await Promise.all([
      db.company.findUnique({
        where: { id: auth.companyId },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          apiCredit: true,
          isSandbox: true,
          createdAt: true,
        },
      }),
      db.campaign.groupBy({
        by: ["status"],
        where: { companyId: auth.companyId },
        _count: { status: true },
      }),
      db.call.aggregate({
        where: { campaign: { companyId: auth.companyId } },
        _count: { id: true },
        _sum: {
          durationSec: true,
          costFcfa: true,
        },
      }),
    ]);

    if (!company) return unauthorized("Compte introuvable.");
    const creditPeak = await db.creditTransaction.aggregate({
      where: { companyId: auth.companyId },
      _max: { balanceAfter: true },
    });

    // Statistiques du mois en cours
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyStats = await db.call.aggregate({
      where: {
        campaign: { companyId: auth.companyId },
        createdAt: { gte: startOfMonth },
      },
      _count: { id: true },
      _sum: { costFcfa: true },
    });
    const monthlyByCampaignRows = await db.call.groupBy({
      by: ["campaignId"],
      where: {
        campaign: { companyId: auth.companyId },
        createdAt: { gte: startOfMonth },
      },
      _count: { id: true },
      _sum: { costFcfa: true },
      orderBy: { _count: { id: "desc" } },
    });
    const monthlyCampaigns = monthlyByCampaignRows.length
      ? await db.campaign.findMany({
          where: { id: { in: monthlyByCampaignRows.map((row) => row.campaignId) }, companyId: auth.companyId },
          select: { id: true, name: true },
        })
      : [];
    const campaignNames = new Map(monthlyCampaigns.map((campaign) => [campaign.id, campaign.name]));

    // Formatter les stats campagnes
    const campaignMap = Object.fromEntries(
      campaignStats.map((s: { status: string; _count: { status: number } }) => [s.status, s._count.status])
    );

    // Estimation durée restante avec le crédit (basée sur 2 min / appel = 120 sec)
    const AVG_CALL_SEC = 120;
    const estimatedMinutesRemaining = Math.floor(
      (company.apiCredit * AVG_CALL_SEC) / 60
    );

    return ok({
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        plan: company.plan,
        isSandbox: company.isSandbox,
        memberSince: company.createdAt,
      },
      credit: {
        remaining: company.apiCredit,
        referenceLimit: Math.max(company.apiCredit, creditPeak._max.balanceAfter ?? 0),
        isUnlimited: company.isSandbox,
        estimatedCallsRemaining: company.apiCredit,
        estimatedMinutesRemaining,
      },
      campaigns: {
        total:
          Object.values(campaignMap).reduce((a, b) => a + b, 0),
        active: campaignMap["RUNNING"] ?? 0,
        scheduled: campaignMap["SCHEDULED"] ?? 0,
        paused: campaignMap["PAUSED"] ?? 0,
        completed: campaignMap["COMPLETED"] ?? 0,
        draft: campaignMap["DRAFT"] ?? 0,
      },
      calls: {
        total: callStats._count.id,
        totalDurationSec: callStats._sum.durationSec ?? 0,
        totalDurationMin: Math.round((callStats._sum.durationSec ?? 0) / 60),
        totalCostFcfa: Math.round(callStats._sum.costFcfa ?? 0),
        thisMonth: {
          count: monthlyStats._count.id,
          costFcfa: Math.round(monthlyStats._sum.costFcfa ?? 0),
        },
        usageThisMonth: monthlyByCampaignRows.map((row) => ({
          campaignId: row.campaignId,
          campaign: campaignNames.get(row.campaignId) ?? "Campagne supprimée",
          calls: row._count.id,
          costFcfa: Math.round(row._sum.costFcfa ?? 0),
          percentage: monthlyStats._count.id
            ? Math.round((row._count.id / monthlyStats._count.id) * 1000) / 10
            : 0,
        })),
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
