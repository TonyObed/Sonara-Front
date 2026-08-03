import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, notFound, ok, unauthorized } from "@/lib/response";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (auth.role === "VIEWER") return forbidden("Les programmations de rapports sont réservées aux administrateurs et managers.");
    const { id } = await params;
    const body = await request.json();
    if (typeof body.isActive !== "boolean") return badRequest("Le statut isActive est requis.");

    const updated = await db.reportSchedule.updateMany({
      where: { id, companyId: auth.companyId },
      data: { isActive: body.isActive },
    });
    if (!updated.count) return notFound("Programmation");
    return ok({ id, isActive: body.isActive });
  } catch (error) {
    return handleError(error);
  }
}
