import { createHash } from "node:crypto";

/**
 * Les refresh tokens sont des justificatifs d'identité. La base ne conserve que
 * leur empreinte afin qu'une fuite de table ne fournisse pas de sessions actives.
 */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

/** Inclut temporairement la valeur brute pour migrer les sessions historiques. */
export function refreshTokenLookupValues(token: string): string[] {
  return [hashRefreshToken(token), token];
}

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(`invite:${token}`, "utf8").digest("hex");
}

export function inviteTokenLookupValues(token: string): string[] {
  return [hashInviteToken(token), token];
}

export function passwordStateFingerprint(passwordHash: string): string {
  return createHash("sha256").update(`password-state:${passwordHash}`, "utf8").digest("hex");
}
