import { describe, expect, it } from "vitest";
import { getLiveCallCutoff } from "@/lib/live-calls";

describe("fenêtre du live monitoring", () => {
  it("exclut par défaut les appels âgés de plus de 25 minutes", () => {
    const now = Date.UTC(2026, 7, 18, 12, 0, 0);
    expect(getLiveCallCutoff(now).toISOString()).toBe("2026-08-18T11:35:00.000Z");
  });

  it("rejette une configuration de fenêtre invalide", () => {
    const original = process.env.LIVE_CALL_MAX_AGE_MINUTES;
    process.env.LIVE_CALL_MAX_AGE_MINUTES = "0";
    const now = Date.UTC(2026, 7, 18, 12, 0, 0);
    expect(getLiveCallCutoff(now).toISOString()).toBe("2026-08-18T11:35:00.000Z");
    process.env.LIVE_CALL_MAX_AGE_MINUTES = original;
  });
});
