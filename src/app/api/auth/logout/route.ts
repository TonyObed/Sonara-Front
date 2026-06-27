// POST /api/auth/logout — Déconnexion
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clearAuthCookies, verifyRefreshToken } from "@/lib/auth";
import { ok } from "@/lib/response";

export async function POST(request: NextRequest) {
  // Récupérer le refresh token du cookie pour l'invalider en BDD
  const refreshToken = request.cookies.get("sonara_refresh")?.value;

  if (refreshToken) {
    const payload = await verifyRefreshToken(refreshToken);
    if (payload) {
      // Supprimer le refresh token de la BDD
      await db.refreshToken
        .delete({ where: { token: refreshToken } })
        .catch(() => {}); // Ne pas planter si déjà supprimé
    }
  }

  // Effacer les cookies côté client
  await clearAuthCookies();

  return ok({ message: "Déconnexion réussie." });
}
