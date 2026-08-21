// Génère les rapports programmés. L'envoi email sera branché lorsqu'un
// fournisseur transactionnel sera configuré ; le rapport est déjà disponible
// dans le dashboard et une notification est créée pour l'entreprise.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { generateReport } from "@/lib/reports";
import { handleError, ok, unauthorized } from "@/lib/response";
import { sendReportReadyEmail } from "@/lib/report-email";

function isAuthorized(request: NextRequest) {
  const expected = process.env.INTERNAL_JOB_KEY;
  return Boolean(expected) && request.headers.get("x-internal-key") === expected;
}

function intervalMs(frequency: string) {
  switch (frequency.toUpperCase()) {
    case "DAILY": return 24 * 60 * 60 * 1000;
    case "WEEKLY": return 7 * 24 * 60 * 60 * 1000;
    case "MONTHLY": return 28 * 24 * 60 * 60 * 1000;
    default: return Number.POSITIVE_INFINITY;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isAuthorized(request)) return unauthorized("Tâche interne non autorisée.");
    const schedules = await db.reportSchedule.findMany({ where: { isActive: true }, take: 25 });
    let generated = 0;
    let emailed = 0;
    let emailSkipped = 0;
    for (const schedule of schedules) {
      const lastRun = schedule.lastSentAt?.getTime() ?? 0;
      if (Date.now() - lastRun < intervalMs(schedule.frequency)) continue;
      try {
        const report = await generateReport({ companyId: schedule.companyId, campaignId: schedule.campaignId });
        const recipients = Array.isArray(schedule.recipients)
          ? schedule.recipients.filter((value): value is string => typeof value === "string" && value.includes("@"))
          : [];
        const email = await sendReportReadyEmail({ recipients, reportName: report.name });
        if (email.status === "sent") emailed += 1;
        else emailSkipped += 1;
        await db.reportSchedule.update({ where: { id: schedule.id }, data: { lastSentAt: new Date() } });
        generated++;
      } catch (error) {
        console.error("[Report scheduler]", schedule.id, error);
      }
    }
    return ok({ checked: schedules.length, generated, emailed, emailSkipped });
  } catch (error) {
    return handleError(error);
  }
}
