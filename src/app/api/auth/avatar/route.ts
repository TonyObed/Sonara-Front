import crypto from "node:crypto";
import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, handleError, ok, unauthorized } from "@/lib/response";

const ALLOWED_TYPES = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);
const MAX_FILE_SIZE = 1_000_000;

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth?.sub) return unauthorized();

    const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
    const secretKey = process.env.SUPABASE_SECRET_KEY;
    if (!supabaseUrl || !secretKey) return badRequest("Stockage des avatars non configuré.");

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) return badRequest("Fichier image requis.");
    const extension = ALLOWED_TYPES.get(file.type);
    if (!extension) return badRequest("Format non autorisé. Utilisez JPG, PNG ou WebP.");
    if (file.size <= 0 || file.size > MAX_FILE_SIZE) return badRequest("L'image doit faire au maximum 1 Mo.");

    const path = `${auth.companyId}/${auth.sub}/${crypto.randomUUID()}.${extension}`;
    const upload = await fetch(`${supabaseUrl}/storage/v1/object/avatars/${path}`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${secretKey}`,
        apikey: secretKey,
        "content-type": file.type,
        "x-upsert": "false",
      },
      body: await file.arrayBuffer(),
    });
    if (!upload.ok) {
      console.error("[Avatar upload]", await upload.text());
      return badRequest("Impossible d'envoyer l'avatar dans le stockage.");
    }

    const avatarUrl = `${supabaseUrl}/storage/v1/object/public/avatars/${path}`;
    const updated = await db.user.updateMany({
      where: { id: auth.sub, companyId: auth.companyId },
      data: { avatarUrl },
    });
    if (!updated.count) return unauthorized();

    return ok({ avatarUrl });
  } catch (error) {
    return handleError(error);
  }
}
