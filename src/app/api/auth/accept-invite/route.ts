// POST /api/auth/accept-invite — Finalise une invitation (A4)
// L'invité définit son nom + mot de passe → compte activé + connexion auto.
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  getRefreshTokenExpiry,
} from "@/lib/auth";
import { AcceptInviteSchema } from "@/lib/validation";
import { ok, badRequest, zodError, handleError } from "@/lib/response";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = AcceptInviteSchema.parse(body);

    // Retrouver l'invité par son token
    const user = await db.user.findUnique({
      where: { inviteToken: input.token },
      include: { company: { select: { id: true, name: true, email: true, plan: true, apiCredit: true } } },
    });

    if (!user) {
      return badRequest("Lien d'invitation invalide.");
    }
    if (user.isActive) {
      return badRequest("Cette invitation a déjà été utilisée.");
    }
    if (!user.inviteExpiry || user.inviteExpiry < new Date()) {
      return badRequest("Ce lien d'invitation a expiré. Demandez une nouvelle invitation.");
    }

    // Hasher le mot de passe (bcrypt cost 12) et activer le compte
    const passwordHash = await bcrypt.hash(input.password, 12);

    const activatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        passwordHash,
        isActive: true,
        inviteToken: null,
        inviteExpiry: null,
        lastLoginAt: new Date(),
      },
    });

    // Connexion automatique : émettre les tokens pour CET utilisateur (son rôle)
    const accessToken = await generateAccessToken({
      sub: activatedUser.id,
      companyId: user.company.id,
      role: activatedUser.role,
    });
    const refreshToken = await generateRefreshToken(user.company.id, activatedUser.id);

    await db.refreshToken.create({
      data: {
        token: refreshToken,
        companyId: user.company.id,
        userId: activatedUser.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    await setAuthCookies(accessToken, refreshToken);

    return ok({
      company: user.company,
      user: {
        id: activatedUser.id,
        email: activatedUser.email,
        firstName: activatedUser.firstName,
        lastName: activatedUser.lastName,
        role: activatedUser.role,
      },
      accessToken,
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
