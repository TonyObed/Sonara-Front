import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, conflict, handleError, ok, unauthorized } from "@/lib/response";

function nullableAvatar(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (typeof value !== "string" || value.length > 2_000) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth?.sub) return unauthorized();
    const body = await request.json();

    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : undefined;
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : undefined;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : undefined;
    const avatarUrl = nullableAvatar(body.avatarUrl);

    if ((firstName !== undefined && (firstName.length < 1 || firstName.length > 80)) ||
        (lastName !== undefined && (lastName.length < 1 || lastName.length > 80)) ||
        (email !== undefined && !/^\S+@\S+\.\S+$/.test(email)) ||
        (body.avatarUrl !== undefined && avatarUrl === undefined)) {
      return badRequest("Profil invalide.");
    }

    if (email) {
      const existing = await db.user.findFirst({
        where: { companyId: auth.companyId, email, id: { not: auth.sub } },
        select: { id: true },
      });
      if (existing) return conflict("Cette adresse email est déjà utilisée dans votre entreprise.");
    }

    const updated = await db.user.updateMany({
      where: { id: auth.sub, companyId: auth.companyId },
      data: { firstName, lastName, email, avatarUrl },
    });
    if (!updated.count) return unauthorized();
    const user = await db.user.findUnique({
      where: { id: auth.sub },
      select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true, role: true },
    });
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}
