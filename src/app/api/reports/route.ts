import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";

// Toutes les ressources de reporting sont isolées par companyId. Un compte
// sans campagne n'a simplement aucun rapport ni programmation à afficher.
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const [reports, schedules] = await Promise.all([
      db.report.findMany({
        where: { companyId: auth.companyId },
        include: { campaign: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.reportSchedule.findMany({
        where: { companyId: auth.companyId },
        include: { campaign: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    return ok({ reports, schedules });
  } catch (error) {
    return handleError(error);
  }
}
