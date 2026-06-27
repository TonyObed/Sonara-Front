// POST /api/auth/refresh — Renouvellement access token
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  getRefreshTokenExpiry,
} from "@/lib/auth";
import { unauthorized, handleError, ok } from "@/lib/response";

export async function POST(request: NextRequest) {
  try {
    // Lire le refresh token depuis le cookie httpOnly
    const refreshToken = request.cookies.get("sonara_refresh")?.value;

    if (!refreshToken) {
      return unauthorized("Refresh token manquant.");
    }

    // Vérifier la signature JWT
    const payload = await verifyRefreshToken(refreshToken);
    if (!payload) {
      return unauthorized("Refresh token invalide ou expiré.");
    }

    // Vérifier que le token existe en BDD (pas révoqué)
    const storedToken = await db.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { company: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      return unauthorized("Session expirée. Veuillez vous reconnecter.");
    }

    const { company } = storedToken;

    if (!company.isActive) {
      return unauthorized("Compte désactivé.");
    }

    // Récupérer le user pour le rôle
    const user = storedToken.userId
      ? await db.user.findUnique({ where: { id: storedToken.userId } })
      : null;

    // Rotation du refresh token (one-time use)
    const newRefreshToken = await generateRefreshToken(
      company.id,
      storedToken.userId ?? company.id
    );

    const newAccessToken = await generateAccessToken({
      sub: storedToken.userId ?? company.id,
      companyId: company.id,
      role: user?.role ?? "ADMIN",
    });

    // Remplacer l'ancien refresh token
    await db.$transaction([
      db.refreshToken.delete({ where: { token: refreshToken } }),
      db.refreshToken.create({
        data: {
          token: newRefreshToken,
          companyId: company.id,
          userId: storedToken.userId,
          expiresAt: getRefreshTokenExpiry(),
        },
      }),
    ]);

    await setAuthCookies(newAccessToken, newRefreshToken);

    return ok({ accessToken: newAccessToken });
  } catch (error) {
    return handleError(error);
  }
}
