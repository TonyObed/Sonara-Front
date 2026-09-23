import { describe, expect, it } from "vitest";
import { toExcelCsv } from "@/lib/csv";

describe("toExcelCsv", () => {
  it("génère un CSV UTF-8 séparé par des points-virgules pour Excel", () => {
    const csv = toExcelCsv([{ prénom: "Awa", ville: "Bouaké" }]);

    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain('"prénom";"ville"\r\n"Awa";"Bouaké"');
  });

  it("neutralise les formules et échappe les guillemets", () => {
    const csv = toExcelCsv([{ nom: '=CMD("test")' }]);

    expect(csv).toContain('"\'=CMD(""test"")"');
  });
});
