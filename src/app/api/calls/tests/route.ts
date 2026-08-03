import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { handleError, ok, unauthorized } from "@/lib/response";

// Historique isolé des appels de validation d'une entreprise.
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const tests = await db.testCall.findMany({
      where: { companyId: auth.companyId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, phone: true, firstName: true, aiVoice: true, status: true,
        durationSec: true, startedAt: true, endedAt: true, summary: true,
        recordingUrl: true, error: true, createdAt: true,
      },
    });
    return ok(tests);
  } catch (error) {
    return handleError(error);
  }
}
