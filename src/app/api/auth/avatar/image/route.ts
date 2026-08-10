import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { unauthorized } from "@/lib/response";
import { getSupabaseOrigin, getSupabaseServiceHeaders } from "@/lib/supabase";

const AVATAR_BUCKET = "avatars";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await authenticateRequest(request);
  if (!auth?.sub) return unauthorized();

  const user = await db.user.findFirst({
    where: { id: auth.sub, companyId: auth.companyId },
    select: { avatarUrl: true },
  });
  if (!user?.avatarUrl) return new Response(null, { status: 404 });

  const supabaseUrl = getSupabaseOrigin(process.env.SUPABASE_URL);
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !secretKey) return new Response(null, { status: 503 });

  const source = new URL(user.avatarUrl);
  const expectedPath = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
  if (source.origin !== supabaseUrl || !source.pathname.startsWith(expectedPath)) {
    return new Response(null, { status: 404 });
  }

  const storedImage = await fetch(source, {
    headers: getSupabaseServiceHeaders(secretKey),
    cache: "no-store",
  });
  if (!storedImage.ok) return new Response(null, { status: storedImage.status });

  return new Response(await storedImage.arrayBuffer(), {
    headers: {
      "content-type": storedImage.headers.get("content-type") ?? "image/png",
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}
