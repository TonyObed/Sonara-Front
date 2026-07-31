import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, ok, unauthorized } from "@/lib/response";

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (!['ADMIN', 'MANAGER'].includes(auth.role)) return forbidden();
    const { name } = await request.json();
    if (typeof name !== 'string' || !name.trim()) return badRequest('Nom de société requis.');
    return ok(await db.company.update({ where: { id: auth.companyId }, data: { name: name.trim() }, select: { id: true, name: true, email: true, plan: true, apiCredit: true } }));
  } catch (error) { return handleError(error); }
}
