import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, notFound, ok, unauthorized } from "@/lib/response";
import { getStoredReport } from "@/lib/reports";
import { NextResponse } from "next/server";

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

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    const { id } = await params;
    const report = await db.report.findFirst({ where: { id, companyId: auth.companyId } });
    if (!report) return notFound("Rapport");
    if (report.status !== "READY" || !report.fileUrl) return badRequest("Ce rapport n'est pas encore disponible.");
    const stored = await getStoredReport(report.fileUrl);
    const filename = `sonara-${report.name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "") || "rapport"}.csv`;
    return new NextResponse(stored.body, {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${filename}"`, "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return handleError(error);
  }
}
