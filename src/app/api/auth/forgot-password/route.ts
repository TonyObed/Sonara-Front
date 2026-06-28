// POST /api/auth/forgot-password — Demande de réinitialisation (A3, P1)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateResetToken } from "@/lib/auth";
import { ForgotPasswordSchema } from "@/lib/validation";
import { ok, tooManyRequests, zodError, handleError } from "@/lib/response";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`forgot:${ip}`, RATE_LIMITS.AUTH.limit, RATE_LIMITS.AUTH.windowSec);
    if (!rl.allowed) {
      return tooManyRequests(`Trop de demandes. Réessayez dans ${rl.retryAfterSec} secondes.`);
    }

    const body = await request.json();
    const input = ForgotPasswordSchema.parse(body);

    const company = await db.company.findUnique({
      where: { email: input.email },
      select: { id: true, email: true, isActive: true },
    });

    // Réponse identique que le compte existe ou non (anti-énumération)
    const genericResponse = ok({
      message:
        "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.",
    });

    if (!company || !company.isActive) {
      return genericResponse;
    }

    // Générer un token signé expirant en 1h (CDC A3)
    const resetToken = await generateResetToken(company.id, company.email);
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

    // TODO Phase 2 : envoyer l'email via SMTP
    // await sendResetEmail({ to: company.email, resetUrl });

    // En dev, on retourne le lien pour faciliter les tests
    if (process.env.NODE_ENV !== "production") {
      return ok({
        message: "Lien de réinitialisation généré (mode dev).",
        resetUrl,
      });
    }

    return genericResponse;
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
