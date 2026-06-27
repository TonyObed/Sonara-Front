// POST /api/auth/2fa/enable — Confirme et active la double authentification
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, badRequest, handleError } from "@/lib/response";
import { verify } from "otplib";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const company = await db.company.findUnique({
      where: { id: auth.companyId },
    });

    if (!company || !company.twoFactorSecret) {
      return badRequest("Aucune configuration 2FA en cours.");
    }

    const body = await request.json();
    const { code } = body;

    if (!code || typeof code !== "string") {
      return badRequest("Le code de vérification est requis.");
    }

    // Valider le code TOTP (6 chiffres attendus)
    let valid = false;
    if (/^\d{6}$/.test(code.trim())) {
      try {
        const result = await verify({ token: code.trim(), secret: company.twoFactorSecret });
        valid = result.valid;
      } catch {
        valid = false;
      }
    }

    if (!valid) {
      return badRequest("Le code de vérification est incorrect.");
    }

    // Générer 10 codes de secours (format XXXX-XXXX)
    const backupCodes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const part1 = crypto.randomBytes(2).toString("hex").toUpperCase();
      const part2 = crypto.randomBytes(2).toString("hex").toUpperCase();
      backupCodes.push(`${part1}-${part2}`);
    }

    // Hacher les codes de secours pour le stockage en base de données
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((c) =>
        bcrypt.hash(c.replace("-", "").toLowerCase(), 10)
      )
    );

    // Activer officiellement la 2FA sur l'entreprise
    await db.company.update({
      where: { id: company.id },
      data: {
        twoFactorEnabled: true,
        twoFactorBackupCodes: hashedBackupCodes,
      },
    });

    return ok({
      backupCodes,
    });
  } catch (error) {
    return handleError(error);
  }
}
