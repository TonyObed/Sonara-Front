import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, forbidden, handleError } from "@/lib/response";
import { CompanySettingsSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    return ok(await db.companySetting.upsert({
      where: { companyId: auth.companyId },
      create: { companyId: auth.companyId },
      update: {},
    }));
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (!["ADMIN", "MANAGER"].includes(auth.role)) return forbidden();

    const data = CompanySettingsSchema.parse(await request.json());
    return ok(await db.companySetting.upsert({
      where: { companyId: auth.companyId },
      create: { companyId: auth.companyId, ...data },
      update: data,
    }));
  } catch (error) {
    return handleError(error);
  }
}
