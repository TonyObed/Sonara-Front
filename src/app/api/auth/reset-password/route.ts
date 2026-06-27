// POST /api/auth/reset-password — Définir un nouveau mot de passe (A3, P1)
import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { verifyResetToken } from "@/lib/auth";
import { ResetPasswordSchema } from "@/lib/validation";
import { ok, badRequest, unauthorized, zodError, handleError } from "@/lib/response";
import { ZodError } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = ResetPasswordSchema.parse(body);

    // Vérifier le token signé (expiration 1h gérée par jose)
    const payload = await verifyResetToken(input.token);
    if (!payload) {
      return unauthorized("Lien de réinitialisation invalide ou expiré.");
    }

    const company = await db.company.findUnique({
      where: { id: payload.sub },
    });

    if (!company || company.email !== payload.email) {
      return badRequest("Lien de réinitialisation invalide.");
    }

    // Hasher le nouveau mot de passe (bcrypt cost 12)
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Mettre à jour le hash sur l'entreprise ET l'utilisateur admin (source unique)
    await db.$transaction([
      db.company.update({
        where: { id: company.id },
        data: { passwordHash },
      }),
      db.user.updateMany({
        where: { companyId: company.id, email: company.email },
        data: { passwordHash },
      }),
      // Révoquer toutes les sessions existantes (sécurité)
      db.refreshToken.deleteMany({
        where: { companyId: company.id },
      }),
    ]);

    return ok({
      message: "Mot de passe réinitialisé avec succès. Veuillez vous reconnecter.",
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
