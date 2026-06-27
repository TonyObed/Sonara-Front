// POST /api/auth/login — Connexion JWT
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  getRefreshTokenExpiry,
  generatePreAuthToken,
} from "@/lib/auth";
import { LoginSchema } from "@/lib/validation";
import { ok, unauthorized, tooManyRequests, zodError, handleError } from "@/lib/response";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // VULN-003 : protection brute-force par IP
    const ip = getClientIp(request);
    const rl = rateLimit(`login:${ip}`, RATE_LIMITS.AUTH.limit, RATE_LIMITS.AUTH.windowSec);
    if (!rl.allowed) {
      return tooManyRequests(
        `Trop de tentatives de connexion. Réessayez dans ${rl.retryAfterSec} secondes.`
      );
    }

    const body = await request.json();
    const input = LoginSchema.parse(body);

    // Chercher l'entreprise par email
    const company = await db.company.findUnique({
      where: { email: input.email },
    });

    if (!company || !company.isActive) {
      // Même message pour éviter l'énumération d'emails
      return unauthorized("Email ou mot de passe incorrect.");
    }

    // Vérifier le mot de passe
    const passwordValid = await bcrypt.compare(input.password, company.passwordHash);
    if (!passwordValid) {
      return unauthorized("Email ou mot de passe incorrect.");
    }

    // Récupérer l'admin principal pour le rôle
    const adminUser = await db.user.findFirst({
      where: { companyId: company.id, role: "ADMIN", isActive: true },
    });

    // ── INTERCEPTION 2FA ──
    if (company.twoFactorEnabled) {
      const preAuthToken = await generatePreAuthToken(company.id, adminUser?.id);
      return ok({
        twoFactorRequired: true,
        preAuthToken,
      });
    }

    // Générer les tokens
    const accessToken = await generateAccessToken({
      sub: adminUser?.id ?? company.id,
      companyId: company.id,
      role: adminUser?.role ?? "ADMIN",
    });

    const refreshToken = await generateRefreshToken(company.id, adminUser?.id ?? company.id);

    // Stocker le refresh token (invalider les anciens si besoin)
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        companyId: company.id,
        userId: adminUser?.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Mettre à jour lastLoginAt
    if (adminUser) {
      await db.user.update({
        where: { id: adminUser.id },
        data: { lastLoginAt: new Date() },
      });
    }

    // Poser les cookies httpOnly sécurisés
    await setAuthCookies(accessToken, refreshToken);

    return ok({
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        plan: company.plan,
        apiCredit: company.apiCredit,
      },
      user: adminUser
        ? {
            id: adminUser.id,
            email: adminUser.email,
            firstName: adminUser.firstName,
            lastName: adminUser.lastName,
            role: adminUser.role,
          }
        : null,
      accessToken,
    });

  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
