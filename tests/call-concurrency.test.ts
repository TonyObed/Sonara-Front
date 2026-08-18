import { describe, expect, it } from "vitest";
import { getEffectiveCallConcurrency } from "@/lib/call-concurrency";

describe("limite de vague d'appels", () => {
  it("protège le MVP avec deux appels maximum par défaut", () => {
    expect(getEffectiveCallConcurrency(10, 10, 2)).toBe(2);
  });

  it("respecte une limite plus stricte définie par l'entreprise ou la campagne", () => {
    expect(getEffectiveCallConcurrency(1, 10, 2)).toBe(1);
    expect(getEffectiveCallConcurrency(10, 1, 2)).toBe(1);
  });

  it("permet une montée contrôlée quand le plafond serveur est relevé", () => {
    expect(getEffectiveCallConcurrency(5, 4, 8)).toBe(4);
  });
});
