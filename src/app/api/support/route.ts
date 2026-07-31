import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, ok, unauthorized } from "@/lib/response";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    const [tickets, services, incident] = await Promise.all([
      db.supportTicket.findMany({ where: { companyId: auth.companyId }, orderBy: { createdAt: "desc" }, take: 20 }),
      db.serviceStatus.findMany({ orderBy: { label: "asc" } }),
      db.serviceIncident.findFirst({ orderBy: { startedAt: "desc" } }),
    ]);
    return ok({ tickets, services, latestIncident: incident });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (!["ADMIN", "MANAGER", "VIEWER"].includes(auth.role)) return forbidden();
    const body = await request.json();
    if (typeof body.subject !== "string" || !body.subject.trim() || typeof body.message !== "string" || !body.message.trim()) {
      return badRequest("Sujet et message requis.");
    }
    const ticket = await db.supportTicket.create({
      data: { companyId: auth.companyId, userId: auth.sub, subject: body.subject.trim(), message: body.message.trim() },
    });
    return ok(ticket, undefined, 201);
  } catch (error) {
    return handleError(error);
  }
}
