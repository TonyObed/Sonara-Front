import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const PREFIX = "enc:v1:";

function encryptionKey(): Buffer {
  const material = process.env.TOTP_ENCRYPTION_KEY ?? process.env.JWT_REFRESH_SECRET;
  if (!material || (process.env.NODE_ENV === "production" && material.length < 32)) {
    throw new Error(
      "TOTP_ENCRYPTION_KEY (ou JWT_REFRESH_SECRET) doit contenir au moins 32 caractères.",
    );
  }
  return createHash("sha256").update(material, "utf8").digest();
}

export function isEncryptedTotpSecret(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptTotpSecret(secret: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

export function decryptTotpSecret(storedSecret: string): string {
  // Compatibilité avec les secrets historiques en clair : ils seront réécrits
  // chiffrés lors de la prochaine activation réussie.
  if (!isEncryptedTotpSecret(storedSecret)) return storedSecret;

  const [ivValue, tagValue, ciphertextValue] = storedSecret.slice(PREFIX.length).split(".");
  if (!ivValue || !tagValue || !ciphertextValue) {
    throw new Error("Secret TOTP chiffré invalide.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivValue, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertextValue, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
