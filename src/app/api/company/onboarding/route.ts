import { NextRequest } from "next/server";
import { authenticateRequest } from "@/lib/auth";
import { db } from "@/lib/db";
import { badRequest, handleError, ok, unauthorized } from "@/lib/response";

function optionalText(value: unknown, max = 100) {
  return typeof value === "string" && value.trim().length <= max ? value.trim() || null : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    const onboarding = await db.companyOnboarding.findUnique({ where: { companyId: auth.companyId } });
    return ok({ onboarding, shouldShow: Boolean(onboarding && !onboarding.completedAt && !onboarding.skippedAt) });
  } catch (error) { return handleError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    const body = await request.json() as Record<string, unknown>;
    const skipped = body.skipped === true;
    if (!skipped && (!optionalText(body.acquisition) || !optionalText(body.jobRole) || !optionalText(body.primaryGoal) || !optionalText(body.contactVolume))) {
      return badRequest("Répondez aux quatre questions ou passez l'étape.");
    }
    const onboarding = await db.companyOnboarding.update({
      where: { companyId: auth.companyId },
      data: skipped ? { skippedAt: new Date() } : {
        acquisition: optionalText(body.acquisition), jobRole: optionalText(body.jobRole), primaryGoal: optionalText(body.primaryGoal), contactVolume: optionalText(body.contactVolume), completedAt: new Date(), tutorialSeenAt: body.tutorialSeen === true ? new Date() : undefined,
      },
    });
    return ok(onboarding);
  } catch (error) { return handleError(error); }
}
