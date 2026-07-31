import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";

// Ne renvoie jamais le secret : l'interface peut seulement afficher les clés
// réellement créées et leur état.
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    const keys = await db.companyApiKey.findMany({
      where: { companyId: auth.companyId },
      select: { id: true, name: true, prefix: true, lastUsedAt: true, revokedAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return ok(keys);
  } catch (error) {
    return handleError(error);
  }
}
