import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, handleError } from "@/lib/response";

export async function GET(request: NextRequest) {
  try { const auth = await authenticateRequest(request); if (!auth) return unauthorized();
    const items = await db.notification.findMany({ where: { companyId: auth.companyId, OR: [{ userId: null }, { userId: auth.sub }] }, orderBy: { createdAt: "desc" }, take: 100 });
    return ok(items);
  } catch (error) { return handleError(error); }
}

export async function PATCH(request: NextRequest) {
  try { const auth = await authenticateRequest(request); if (!auth) return unauthorized(); const { ids } = await request.json();
    await db.notification.updateMany({ where: { companyId: auth.companyId, id: { in: Array.isArray(ids) ? ids : [] } }, data: { readAt: new Date() } }); return ok({ message: "Notifications mises à jour." });
  } catch (error) { return handleError(error); }
}
