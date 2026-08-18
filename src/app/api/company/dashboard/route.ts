import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";
import { getLiveCallCutoff } from "@/lib/live-calls";

const ANSWERED = ["IN_PROGRESS", "COMPLETED", "TRANSFERRED"] as const;
const ACTIVE = ["RINGING", "IN_PROGRESS"] as const;

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);
    const liveCutoff = getLiveCallCutoff();

    const baseWhere = { campaign: { companyId: auth.companyId } };
    const [company, settings, calls, live, queued, events, creditPeak] = await Promise.all([
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
        where: {
          campaign: { companyId: auth.companyId, status: "RUNNING" },
          status: { in: [...ACTIVE] },
          OR: [
            { startedAt: { gte: liveCutoff } },
            { startedAt: null, createdAt: { gte: liveCutoff } },
          ],
        },
        select: { id: true },
      }),
      db.contact.count({
        where: { campaign: { companyId: auth.companyId, status: "RUNNING" }, status: "PENDING" },
      }),
      db.callEvent.findMany({
        where: { call: { campaign: { companyId: auth.companyId } } },
        orderBy: { createdAt: "desc" },
        take: 25,
        select: {
          eventType: true,
          createdAt: true,
          call: {
            select: {
              status: true,
              durationSec: true,
              contact: { select: { firstName: true, lastName: true, phone: true } },
              campaign: { select: { name: true } },
            },
          },
        },
      }),
      db.creditTransaction.aggregate({
        where: { companyId: auth.companyId },
        _max: { balanceAfter: true },
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
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const lastHourStart = new Date(Date.now() - 60 * 60 * 1000);
    const todayCalls = calls.filter((call) => call.createdAt >= todayStart);
    const lastHourCalls = calls.filter((call) => call.createdAt >= lastHourStart);
    const answeredCount = (rows: typeof calls) => rows.filter((call) => ANSWERED.includes(call.status as (typeof ANSWERED)[number])).length;
    const todayAnswered = answeredCount(todayCalls);
    const lastHourAnswered = answeredCount(lastHourCalls);
    const countStatus = (statuses: readonly string[]) => calls.filter((call) => statuses.includes(call.status)).length;

    return ok({
      credit: company.apiCredit,
      creditLimit: Math.max(company.apiCredit, creditPeak._max.balanceAfter ?? 0),
      // La limite sera lue depuis CompanySetting dès que la migration de ce
      // modèle aura été appliquée. En attendant, aucune donnée client n'est
      // inventée : 10 est la capacité technique MVP déjà appliquée au scheduler.
      live: { active: live.length, capacity: settings?.maxConcurrentCalls ?? 10, queued },
      responseRate: launched ? Math.round((answered / launched) * 100) : 0,
      calls: { launched, answered },
      today: {
        launched: todayCalls.length,
        answered: todayAnswered,
        responseRate: todayCalls.length ? Math.round((todayAnswered / todayCalls.length) * 100) : 0,
      },
      lastHour: {
        launched: lastHourCalls.length,
        answered: lastHourAnswered,
        responseRate: lastHourCalls.length ? Math.round((lastHourAnswered / lastHourCalls.length) * 100) : 0,
      },
      outcomes: {
        completed: countStatus(["COMPLETED"]),
        unreachable: countStatus(["NO_ANSWER", "BUSY"]),
        voicemail: countStatus(["VOICEMAIL"]),
        failed: countStatus(["FAILED"]),
      },
      daily: Array.from(dayMap, ([date, values]) => ({ date, ...values })),
      events: events.map((event) => {
        const contactName = [event.call.contact.firstName, event.call.contact.lastName].filter(Boolean).join(" ").trim() || event.call.contact.phone;
        const kind = event.eventType === "end-of-call-report" ? "ok" : event.call.status === "FAILED" ? "alert" : "info";
        const text = event.eventType === "end-of-call-report"
          ? `Appel terminé — ${contactName} · ${event.call.campaign.name}${event.call.durationSec ? ` · ${Math.floor(event.call.durationSec / 60)}:${String(event.call.durationSec % 60).padStart(2, "0")}` : ""}`
          : `${event.eventType} — ${contactName} · ${event.call.campaign.name}`;
        return { type: event.eventType, at: event.createdAt, kind, text };
      }),
    });
  } catch (error) {
    return handleError(error);
  }
}
