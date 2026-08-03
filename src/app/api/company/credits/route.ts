import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, handleError } from "@/lib/response";
export async function GET(request: NextRequest) { try { const auth = await authenticateRequest(request); if (!auth) return unauthorized(); const [company, history] = await Promise.all([db.company.findUnique({ where: { id: auth.companyId }, select: { apiCredit: true, isSandbox: true } }), db.creditTransaction.findMany({ where: { companyId: auth.companyId }, orderBy: { createdAt: "desc" }, take: 100 })]); return ok({ balance: company?.apiCredit ?? 0, isUnlimited: company?.isSandbox ?? false, history }); } catch (error) { return handleError(error); } }
