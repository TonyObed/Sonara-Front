// POST /api/leads — Capture publique d'un prospect (« Demander une démo »)
// GET  /api/leads — Liste des leads (réservé ADMIN, backoffice)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { CreateLeadSchema } from "@/lib/validation";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { ok, created, unauthorized, forbidden, tooManyRequests, zodError, handleError } from "@/lib/response";
import { ZodError } from "zod";

// ─── POST : capture publique ──────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Anti-spam : limiter par IP
    const ip = getClientIp(request);
    const rl = rateLimit(`lead:${ip}`, RATE_LIMITS.PUBLIC.limit, RATE_LIMITS.PUBLIC.windowSec);
    if (!rl.allowed) {
      return tooManyRequests(`Trop de demandes. Réessayez dans ${rl.retryAfterSec} secondes.`);
    }

    const body = await request.json();
    const input = CreateLeadSchema.parse(body);

    await db.lead.create({
      data: {
        name: input.name,
        email: input.email,
        company: input.company,
        phone: input.phone,
        message: input.message,
        source: input.source,
      },
    });

    // TODO Phase 2 : notifier l'équipe commerciale (email / Slack)

    return created({
      message: "Merci ! Notre équipe vous recontacte très vite.",
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}

// ─── GET : backoffice (ADMIN uniquement) ──────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN") return forbidden("Accès réservé aux administrateurs.");

    const leads = await db.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    return ok(leads);
  } catch (error) {
    return handleError(error);
  }
}
