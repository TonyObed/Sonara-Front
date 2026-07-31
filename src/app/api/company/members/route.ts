import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    return ok(await db.user.findMany({ where: { companyId: auth.companyId }, select: { id: true, firstName: true, lastName: true, email: true, role: true, isActive: true, lastLoginAt: true, avatarUrl: true }, orderBy: { createdAt: 'asc' } }));
  } catch (error) { return handleError(error); }
}
