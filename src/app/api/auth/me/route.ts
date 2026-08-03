// GET /api/auth/me — Profil de l'utilisateur connecté
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, handleError } from "@/lib/response";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const company = await db.company.findUnique({
      where: { id: auth.companyId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        apiCredit: true,
        isSandbox: true,
        twoFactorEnabled: true,
        createdAt: true,
        users: {
          where: { isActive: true },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            lastLoginAt: true,
          },
        },
        _count: {
          select: { campaigns: true },
        },
      },
    });

    if (!company) return unauthorized("Compte introuvable.");

    // Trouver l'utilisateur courant
    const currentUser = company.users.find((u: { id: string }) => u.id === auth.sub) ?? company.users[0];

    return ok({
      user: currentUser,
      company: {
        id: company.id,
        name: company.name,
        email: company.email,
        plan: company.plan,
        apiCredit: company.apiCredit,
        isSandbox: company.isSandbox,
        memberSince: company.createdAt,
        totalCampaigns: company._count.campaigns,
        teamSize: company.users.length,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
