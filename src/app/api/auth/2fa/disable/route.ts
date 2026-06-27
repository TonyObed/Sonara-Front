// POST /api/auth/2fa/disable — Désactive la double authentification
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, badRequest, handleError } from "@/lib/response";
import { verify } from "otplib";
import bcrypt from "bcryptjs";
import { Prisma } from "@/generated/prisma/client";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const company = await db.company.findUnique({
      where: { id: auth.companyId },
    });

    if (!company) {
      return unauthorized("Compte introuvable.");
    }

    if (!company.twoFactorEnabled) {
      return badRequest("La double authentification n'est pas activée.");
    }

    const body = await request.json();
    const { code, password } = body;

    if (!code && !password) {
      return badRequest("Un code 2FA ou le mot de passe actuel est requis pour confirmer la désactivation.");
    }

    let isConfirmed = false;

    // 1. Essayer de valider via TOTP (6 chiffres)
    if (code && company.twoFactorSecret && /^\d{6}$/.test(code.trim())) {
      try {
        const result = await verify({ token: code.trim(), secret: company.twoFactorSecret });
        isConfirmed = result.valid;
      } catch {
        isConfirmed = false;
      }
    }

    // 2. Si échec, essayer de valider via le mot de passe de l'entreprise
    if (!isConfirmed && password) {
      isConfirmed = await bcrypt.compare(password, company.passwordHash);
    }

    if (!isConfirmed) {
      return badRequest("Code 2FA ou mot de passe incorrect.");
    }

    // Désactiver la double authentification et réinitialiser les clés
    await db.company.update({
      where: { id: company.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: Prisma.DbNull,
      },
    });

    return ok({
      success: true,
    });
  } catch (error) {
    return handleError(error);
  }
}
