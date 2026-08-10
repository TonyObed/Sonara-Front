// Tests unitaires — validation/normalisation (cœur métier : numéros CI + auth).
import { describe, it, expect } from "vitest";
import {
  normalizePhoneCI,
  RegisterSchema,
  LoginSchema,
} from "@/lib/validation";

describe("normalizePhoneCI — numéros Côte d'Ivoire", () => {
  it("normalise un numéro Orange local (07…) en E.164", () => {
    expect(normalizePhoneCI("07 08 23 45 67")).toBe("+2250708234567");
  });

  it("normalise un numéro MTN local (05…) en E.164", () => {
    expect(normalizePhoneCI("0585215962")).toBe("+2250585215962");
  });

  it("accepte un numéro déjà au format international +225", () => {
    expect(normalizePhoneCI("+225 05 85 21 59 62")).toBe("+2250585215962");
  });

  it("accepte le format international sans le +", () => {
    expect(normalizePhoneCI("225 0708234567")).toBe("+2250708234567");
  });

  it("conserve le 0 de tête (numérotation CI 10 chiffres, pas de trunk prefix)", () => {
    const out = normalizePhoneCI("0708234567");
    expect(out).toMatch(/^\+2250/);
  });

  it("rejette une entrée non numérique", () => {
    expect(normalizePhoneCI("pas-un-numero")).toBeNull();
  });

  it("rejette un numéro trop court", () => {
    expect(normalizePhoneCI("12345")).toBeNull();
  });
});

describe("RegisterSchema — règles d'inscription", () => {
  it("accepte un mot de passe valide (maj + chiffre + 8 car.) et minuscule l'email", () => {
    const parsed = RegisterSchema.parse({
      fullName: "Koffi N'Guessan",
      companyName: "Banque XYZ",
      email: "Admin@Test.CI",
      password: "Sonara2026",
    });
    expect(parsed.email).toBe("admin@test.ci");
  });

  it("refuse un mot de passe sans majuscule", () => {
    expect(() =>
      RegisterSchema.parse({ fullName: "Koffi N'Guessan", companyName: "ACME", email: "a@b.ci", password: "sonara2026" })
    ).toThrow();
  });

  it("refuse un mot de passe sans chiffre", () => {
    expect(() =>
      RegisterSchema.parse({ fullName: "Koffi N'Guessan", companyName: "ACME", email: "a@b.ci", password: "SonaraPass" })
    ).toThrow();
  });

  it("refuse un nom d'entreprise trop court", () => {
    expect(() =>
      RegisterSchema.parse({ fullName: "Koffi N'Guessan", companyName: "A", email: "a@b.ci", password: "Sonara2026" })
    ).toThrow();
  });

  it("refuse une inscription sans identité utilisateur", () => {
    expect(() =>
      RegisterSchema.parse({ fullName: "", companyName: "ACME", email: "a@b.ci", password: "Sonara2026" })
    ).toThrow();
  });
});

describe("LoginSchema", () => {
  it("accepte des identifiants bien formés", () => {
    const parsed = LoginSchema.parse({ email: "admin@banquexyz.ci", password: "x" });
    expect(parsed.email).toBe("admin@banquexyz.ci");
  });

  it("refuse un email invalide", () => {
    expect(() => LoginSchema.parse({ email: "notanemail", password: "x" })).toThrow();
  });
});
