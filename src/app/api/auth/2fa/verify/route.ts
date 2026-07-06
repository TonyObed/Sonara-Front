// POST /api/auth/2fa/verify — Vérification du code 2FA pour la connexion
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  getRefreshTokenExpiry,
  verifyPreAuthToken,
} from "@/lib/auth";
import { verify } from "otplib";
import bcrypt from "bcryptjs";
import { ok, unauthorized, tooManyRequests, handleError } from "@/lib/response";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // 1. Protection brute-force par IP
    const ip = getClientIp(request);
    const rl = await rateLimit(`2fa-verify:${ip}`, RATE_LIMITS.AUTH.limit, RATE_LIMITS.AUTH.windowSec);
    if (!rl.allowed) {
      return tooManyRequests(
        `Trop de tentatives. Réessayez dans ${rl.retryAfterSec} secondes.`
      );
    }

    const body = await request.json();
    const { preAuthToken, code } = body;

    if (!preAuthToken || !code) {
      return unauthorized("Jeton ou code de vérification manquant.");
    }

    // 2. Valider le jeton de pré-authentification
    const payload = await verifyPreAuthToken(preAuthToken);
    if (!payload) {
      return unauthorized("Le jeton de session temporaire est invalide ou expiré.");
    }

    const { companyId, userId } = payload;

    // 3. Récupérer l'entreprise
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company || !company.isActive || !company.twoFactorEnabled || !company.twoFactorSecret) {
      return unauthorized("Double authentification non active ou compte introuvable.");
    }

    let isCodeValid = false;
    let backupCodeUsed = false;
    let usedBackupCodeIndex = -1;

    const rawCode = code.trim();

    // 4. Code TOTP : uniquement si 6 chiffres (sinon otplib lève sur un code de secours)
    if (/^\d{6}$/.test(rawCode)) {
      try {
        const result = await verify({ token: rawCode, secret: company.twoFactorSecret });
        isCodeValid = result.valid;
      } catch {
        isCodeValid = false;
      }
    }

    // 5. Sinon (ou si échec) : tenter un code de secours
    if (!isCodeValid && company.twoFactorBackupCodes) {
      const normalized = rawCode.replace(/-/g, "").toLowerCase();
      const backupCodes = (company.twoFactorBackupCodes as string[]) || [];
      for (let i = 0; i < backupCodes.length; i++) {
        const matches = await bcrypt.compare(normalized, backupCodes[i]);
        if (matches) {
          isCodeValid = true;
          backupCodeUsed = true;
          usedBackupCodeIndex = i;
          break;
        }
      }
    }

    if (!isCodeValid) {
      return unauthorized("Code de double authentification incorrect.");
    }

    // 6. Si un code de secours a été utilisé, le consommer (supprimer du tableau)
    if (backupCodeUsed && company.twoFactorBackupCodes) {
      const backupCodes = [...(company.twoFactorBackupCodes as string[])];
      backupCodes.splice(usedBackupCodeIndex, 1);
      await db.company.update({
        where: { id: company.id },
        data: {
          twoFactorBackupCodes: backupCodes,
        },
      });
    }

    // 7. Récupérer le collaborateur (s'il y en a un spécifié dans le token)
    let user = null;
    if (userId) {
      user = await db.user.findUnique({
        where: { id: userId },
      });
    } else {
      user = await db.user.findFirst({
        where: { companyId: company.id, role: "ADMIN", isActive: true },
      });
    }

    // 8. Générer les jetons définitifs
    const accessToken = await generateAccessToken({
      sub: user?.id ?? company.id,
      companyId: company.id,
      role: user?.role ?? "ADMIN",
    });

    const refreshToken = await generateRefreshToken(company.id, user?.id ?? company.id);

    // 9. Stocker le token de rafraîchissement
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        companyId: company.id,
        userId: user?.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // 10. Mettre à jour la date de dernière connexion
    if (user) {
      await db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // 11. Poser les cookies httpOnly de session
    await setAuthCookies(accessToken, refreshToken);

    return ok({
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        plan: company.plan,
        apiCredit: company.apiCredit,
      },
      user: user
        ? {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
          }
        : null,
      accessToken,
    });
  } catch (error) {
    return handleError(error);
  }
}
