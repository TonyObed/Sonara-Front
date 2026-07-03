// GET /api/calls/live — Appels en cours pour l'entreprise (monitoring temps réel)
// Renvoie les appels en statut RINGING / IN_PROGRESS, scopés par companyId.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, handleError } from "@/lib/response";

interface LiveCall {
  name: string;
  campaign: string;
  startedSecondsAgo: number;
}

function fullName(firstName: string | null, lastName: string | null, phone: string): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || phone;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const calls = await db.call.findMany({
      where: {
        campaign: { companyId: auth.companyId },
        status: { in: ["RINGING", "IN_PROGRESS"] },
      },
      orderBy: { startedAt: "asc" },
      take: 50,
      select: {
        startedAt: true,
        contact: { select: { firstName: true, lastName: true, phone: true } },
        campaign: { select: { name: true } },
      },
    });

    const now = Date.now();
    type Row = (typeof calls)[number];
    const live: LiveCall[] = calls.map((c: Row) => ({
      name: fullName(c.contact.firstName, c.contact.lastName, c.contact.phone),
      campaign: c.campaign.name,
      startedSecondsAgo: c.startedAt
        ? Math.max(0, Math.floor((now - new Date(c.startedAt).getTime()) / 1000))
        : 0,
    }));

    return ok(live, { total: live.length });
  } catch (error) {
    return handleError(error);
  }
}
