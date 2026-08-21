import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, notFound, ok, unauthorized } from "@/lib/response";

type RouteContext = { params: Promise<{ id: string }> };

// Retire un membre sans supprimer son historique. Ses sessions et, si besoin,
// son lien d'invitation sont invalidés immédiatement.
export async function DELETE(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (auth.role !== "ADMIN" && auth.role !== "SUPER_ADMIN") {
      return forbidden("Seul l'administrateur peut retirer un collaborateur.");
    }

    const { id } = await params;
    if (!id) return badRequest("Identifiant du collaborateur requis.");
    if (id === auth.sub) return badRequest("Vous ne pouvez pas retirer votre propre compte.");

    const member = await db.user.findFirst({
      where: { id, companyId: auth.companyId },
      select: { id: true, role: true },
    });
    if (!member) return notFound("Collaborateur");
    if (member.role === "ADMIN" || member.role === "SUPER_ADMIN") {
      return forbidden("Un compte administrateur ne peut pas être retiré ici.");
    }

    await db.$transaction([
      db.user.update({
        where: { id: member.id },
        data: { isActive: false, inviteToken: null, inviteExpiry: null },
      }),
      db.refreshToken.deleteMany({ where: { userId: member.id, companyId: auth.companyId } }),
      db.notification.create({ data: { companyId: auth.companyId, userId: auth.sub, type: "SECURITY", title: "Collaborateur retiré", message: `Le collaborateur ${member.id.slice(0, 8)}… a été désactivé et ses sessions ont été révoquées.` } }),
    ]);

    return ok({ id: member.id, revoked: true });
  } catch (error) {
    return handleError(error);
  }
}
