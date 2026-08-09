import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, ok, unauthorized } from "@/lib/response";

const FREQUENCIES = new Set(["DAILY", "WEEKLY", "MONTHLY"]);

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (auth.role === "VIEWER") return forbidden("Les programmations sont réservées aux administrateurs et managers.");
    const body = await request.json() as Record<string, unknown>;
    const frequency = typeof body.frequency === "string" ? body.frequency.toUpperCase() : "";
    const sendAt = typeof body.sendAt === "string" ? body.sendAt : "";
    const campaignId = typeof body.campaignId === "string" && body.campaignId ? body.campaignId : null;
    const recipients = Array.isArray(body.recipients) ? body.recipients.filter((value: unknown): value is string => typeof value === "string" && value.includes("@")) : [];
    if (!FREQUENCIES.has(frequency) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(sendAt)) return badRequest("Fréquence ou heure invalide.");
    if (!recipients.length) return badRequest("Ajoutez au moins une adresse email.");
    if (campaignId) {
      const campaign = await db.campaign.findFirst({ where: { id: campaignId, companyId: auth.companyId }, select: { id: true } });
      if (!campaign) return badRequest("Campagne introuvable.");
    }
    const schedule = await db.reportSchedule.create({ data: { companyId: auth.companyId, campaignId, name: campaignId ? "Rapport de campagne programmé" : "Rapport global programmé", frequency, sendAt, recipients } });
    return ok(schedule, undefined, 201);
  } catch (error) { return handleError(error); }
}
