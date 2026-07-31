// POST /api/auth/register — Inscription entreprise
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  getRefreshTokenExpiry,
} from "@/lib/auth";
import { RegisterSchema } from "@/lib/validation";
import {
  ok,
  conflict,
  tooManyRequests,
  zodError,
  handleError,
} from "@/lib/response";
import { rateLimit, getClientIp, RATE_LIMITS } from "@/lib/rate-limit";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    // VULN-003 : limiter la création de comptes par IP
    const ip = getClientIp(request);
    const rl = await rateLimit(`register:${ip}`, RATE_LIMITS.AUTH.limit, RATE_LIMITS.AUTH.windowSec);
    if (!rl.allowed) {
      return tooManyRequests(
        `Trop de tentatives. Réessayez dans ${rl.retryAfterSec} secondes.`
      );
    }

    const body = await request.json();
    const input = RegisterSchema.parse(body);

    // Vérifier email unique
    const existing = await db.company.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      return conflict("Un compte existe déjà avec cet email.");
    }

    // Hasher le mot de passe — bcrypt cost 12 (CDC J1)
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Créer l'entreprise + l'admin
    const company = await db.company.create({
      data: {
        name: input.companyName,
        email: input.email,
        passwordHash,
        plan: "STARTER",
        apiCredit: 0,
        settings: { create: {} },
      },
    });

    // Créer l'utilisateur admin principal
    await db.user.create({
      data: {
        companyId: company.id,
        email: input.email,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    });

    // Générer les tokens JWT
    const accessToken = await generateAccessToken({
      sub: company.id,
      companyId: company.id,
      role: "ADMIN",
    });

    const refreshToken = await generateRefreshToken(company.id, company.id);

    // Stocker le refresh token en BDD
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        companyId: company.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    // Poser les cookies httpOnly
    await setAuthCookies(accessToken, refreshToken);

    return ok(
      {
        company: {
          id: company.id,
          name: company.name,
          email: company.email,
          plan: company.plan,
          apiCredit: company.apiCredit,
        },
        accessToken,
      },
      undefined,
      201
    );
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
