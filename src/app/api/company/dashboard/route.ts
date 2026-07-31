import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";

const ANSWERED = ["IN_PROGRESS", "COMPLETED", "TRANSFERRED"] as const;
const ACTIVE = ["RINGING", "IN_PROGRESS"] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const baseWhere = { campaign: { companyId: auth.companyId } };
    const [company, settings, calls, live, queued, events] = await Promise.all([
      db.company.findUnique({
        where: { id: auth.companyId },
        select: { apiCredit: true },
      }),
      db.companySetting.findUnique({
        where: { companyId: auth.companyId },
        select: { maxConcurrentCalls: true },
      }),
      db.call.findMany({
        where: { ...baseWhere, createdAt: { gte: since } },
        select: { status: true, createdAt: true, startedAt: true },
      }),
      db.call.findMany({
        where: { ...baseWhere, status: { in: [...ACTIVE] } },
        select: { id: true },
      }),
      db.contact.count({
        where: { campaign: { companyId: auth.companyId, status: "RUNNING" }, status: "PENDING" },
      }),
      db.callEvent.findMany({
        where: { call: { campaign: { companyId: auth.companyId } } },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: { eventType: true, createdAt: true },
      }),
    ]);
    if (!company) return unauthorized("Compte introuvable.");

    const dayMap = new Map<string, { started: number; answered: number }>();
    for (let i = 0; i < 30; i += 1) {
      const day = new Date(since);
      day.setDate(since.getDate() + i);
      dayMap.set(day.toISOString().slice(0, 10), { started: 0, answered: 0 });
    }
    for (const call of calls) {
      const key = call.createdAt.toISOString().slice(0, 10);
      const row = dayMap.get(key);
      if (!row) continue;
      row.started += 1;
      if (ANSWERED.includes(call.status as (typeof ANSWERED)[number])) row.answered += 1;
    }
    const launched = calls.length;
    const answered = calls.filter((call) => ANSWERED.includes(call.status as (typeof ANSWERED)[number])).length;
    const countStatus = (statuses: readonly string[]) => calls.filter((call) => statuses.includes(call.status)).length;

    return ok({
      credit: company.apiCredit,
      // La limite sera lue depuis CompanySetting dès que la migration de ce
      // modèle aura été appliquée. En attendant, aucune donnée client n'est
      // inventée : 10 est la capacité technique MVP déjà appliquée au scheduler.
      live: { active: live.length, capacity: settings?.maxConcurrentCalls ?? 10, queued },
      responseRate: launched ? Math.round((answered / launched) * 100) : 0,
      calls: { launched, answered },
      outcomes: {
        completed: countStatus(["COMPLETED"]),
        unreachable: countStatus(["NO_ANSWER", "BUSY"]),
        voicemail: countStatus(["VOICEMAIL"]),
        failed: countStatus(["FAILED", "TRANSFERRED"]),
      },
      daily: Array.from(dayMap, ([date, values]) => ({ date, ...values })),
      events: events.map((event) => ({ type: event.eventType, at: event.createdAt })),
    });
  } catch (error) {
    return handleError(error);
  }
}
