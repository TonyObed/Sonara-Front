import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  decryptTotpSecret,
  encryptTotpSecret,
  isEncryptedTotpSecret,
} from "@/lib/totp-secret";

describe("chiffrement des secrets TOTP", () => {
  const previousKey = process.env.TOTP_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.TOTP_ENCRYPTION_KEY = "test-key-with-at-least-thirty-two-characters";
  });

  afterEach(() => {
    if (previousKey === undefined) delete process.env.TOTP_ENCRYPTION_KEY;
    else process.env.TOTP_ENCRYPTION_KEY = previousKey;
  });

  it("chiffre puis déchiffre sans stocker le secret en clair", () => {
    const raw = "JBSWY3DPEHPK3PXP";
    const encrypted = encryptTotpSecret(raw);

    expect(isEncryptedTotpSecret(encrypted)).toBe(true);
    expect(encrypted).not.toContain(raw);
    expect(decryptTotpSecret(encrypted)).toBe(raw);
  });

  it("accepte temporairement les anciens secrets en clair", () => {
    expect(decryptTotpSecret("LEGACYBASE32")).toBe("LEGACYBASE32");
  });
});
