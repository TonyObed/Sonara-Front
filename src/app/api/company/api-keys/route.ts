import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, forbidden, handleError, notFound, ok, unauthorized } from "@/lib/response";

const keySelect = {
  id: true,
  name: true,
  prefix: true,
  lastUsedAt: true,
  revokedAt: true,
  createdAt: true,
} as const;

function canManageKeys(role: string) {
  return role === "ADMIN";
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (!canManageKeys(auth.role)) return forbidden("Les clés API sont réservées aux administrateurs.");

    const keys = await db.companyApiKey.findMany({
      where: { companyId: auth.companyId },
      select: keySelect,
      orderBy: { createdAt: "desc" },
    });
    return ok(keys);
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (!canManageKeys(auth.role)) return forbidden("Les clés API sont réservées aux administrateurs.");

    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (name.length < 2 || name.length > 80) return badRequest("Le nom de la clé doit contenir entre 2 et 80 caractères.");

    const rawKey = `snr_${crypto.randomBytes(32).toString("base64url")}`;
    const prefix = rawKey.slice(0, 12);
    const secretHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const created = await db.$transaction(async (tx) => {
      const key = await tx.companyApiKey.create({
        data: { companyId: auth.companyId, name, prefix, secretHash },
        select: keySelect,
      });
      await tx.notification.create({ data: { companyId: auth.companyId, userId: auth.sub, type: "SECURITY", title: "Clé API créée", message: `La clé « ${name} » (${prefix}…) a été créée.` } });
      return key;
    });

    // Le secret n'est retourné qu'à sa création et n'est jamais stocké en clair.
    return ok({ key: created, secret: rawKey }, undefined, 201);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (!canManageKeys(auth.role)) return forbidden("Les clés API sont réservées aux administrateurs.");

    const body = await request.json();
    const id = typeof body.id === "string" ? body.id : "";
    if (!id) return badRequest("Identifiant de clé requis.");

    const updated = await db.$transaction(async (tx) => {
      const result = await tx.companyApiKey.updateMany({
        where: { id, companyId: auth.companyId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
      if (result.count) await tx.notification.create({ data: { companyId: auth.companyId, userId: auth.sub, type: "SECURITY", title: "Clé API révoquée", message: `La clé ${id.slice(0, 8)}… a été révoquée.` } });
      return result;
    });
    if (!updated.count) return notFound("Clé API");
    return ok({ id, revoked: true });
  } catch (error) {
    return handleError(error);
  }
}
