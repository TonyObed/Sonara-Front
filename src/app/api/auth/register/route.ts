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

function splitFullName(fullName: string): { firstName: string; lastName: string | null } {
  const [firstName, ...rest] = fullName.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") || null };
}

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
    const { firstName, lastName } = splitFullName(input.fullName);

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
        onboarding: { create: {} },
      },
    });

    // Créer l'utilisateur admin principal avec l'identité saisie à l'inscription.
    const user = await db.user.create({
      data: {
        companyId: company.id,
        email: input.email,
        passwordHash,
        firstName,
        lastName,
        role: "ADMIN",
        isActive: true,
      },
    });

    // Générer les tokens JWT
    const accessToken = await generateAccessToken({
      sub: user.id,
      companyId: company.id,
      role: "ADMIN",
    });

    const refreshToken = await generateRefreshToken(company.id, user.id);

    // Stocker le refresh token en BDD
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        companyId: company.id,
        userId: user.id,
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
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
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
