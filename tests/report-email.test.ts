import { afterEach, describe, expect, it, vi } from "vitest";
import { sendReportReadyEmail } from "@/lib/report-email";

describe("report email", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("n'appelle aucun fournisseur si Resend n'est pas configuré", async () => {
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("REPORT_EMAIL_FROM", "");
    await expect(sendReportReadyEmail({ recipients: ["client@example.com"], reportName: "Rapport" }))
      .resolves.toEqual({ status: "skipped", reason: "not-configured" });
  });
});
