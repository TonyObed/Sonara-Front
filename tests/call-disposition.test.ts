import { describe, expect, it } from "vitest";
import { inferCallDisposition } from "@/lib/call-disposition";

describe("inferCallDisposition", () => {
  it("programme une relance quand le client est temporairement indisponible", () => {
    expect(inferCallDisposition(undefined, false, [
      { role: "user", message: "Je ne suis pas disponible maintenant, rappelez-moi plus tard." },
    ])).toBe("TEMPORARILY_UNAVAILABLE");
  });

  it("respecte un refus définitif", () => {
    expect(inferCallDisposition(undefined, false, [
      { role: "user", message: "Je ne veux pas participer, ne me rappelez pas." },
    ])).toBe("REFUSED");
  });

  it("fait confiance à la disposition structurée Vapi", () => {
    expect(inferCallDisposition({ callDisposition: "CALLBACK_REQUESTED" }, false, [])).toBe("CALLBACK_REQUESTED");
  });
});
