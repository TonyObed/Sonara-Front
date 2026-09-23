import { describe, expect, it } from "vitest";
import { CompanySettingsSchema } from "@/lib/validation";

describe("validation des paramètres entreprise", () => {
  it("refuse un webhook non chiffré", () => {
    expect(() => CompanySettingsSchema.parse({ webhookUrl: "http://example.com/hook" })).toThrow();
  });

  it("refuse les champs inconnus et les limites excessives", () => {
    expect(() => CompanySettingsSchema.parse({ isAdmin: true })).toThrow();
    expect(() => CompanySettingsSchema.parse({ maxConcurrentCalls: 101 })).toThrow();
  });

  it("accepte les paramètres attendus", () => {
    expect(CompanySettingsSchema.parse({
      timezone: "Africa/Abidjan",
      webhookUrl: "https://example.com/hook",
      maxConcurrentCalls: 10,
    })).toEqual({
      timezone: "Africa/Abidjan",
      webhookUrl: "https://example.com/hook",
      maxConcurrentCalls: 10,
    });
  });
});
