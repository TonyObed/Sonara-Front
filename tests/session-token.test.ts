import { describe, expect, it } from "vitest";
import {
  hashInviteToken,
  hashRefreshToken,
  inviteTokenLookupValues,
  passwordStateFingerprint,
  refreshTokenLookupValues,
} from "@/lib/session-token";

describe("stockage des refresh tokens", () => {
  it("ne conserve pas le jeton utilisable en clair", () => {
    const raw = "refresh-token-secret";
    const hash = hashRefreshToken(raw);

    expect(hash).not.toBe(raw);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hashRefreshToken(raw)).toBe(hash);
  });

  it("accepte les anciennes sessions pendant leur migration", () => {
    const raw = "legacy-token";
    expect(refreshTokenLookupValues(raw)).toEqual([hashRefreshToken(raw), raw]);
  });

  it("sépare les empreintes par usage", () => {
    const raw = "same-value";
    expect(hashInviteToken(raw)).not.toBe(hashRefreshToken(raw));
    expect(inviteTokenLookupValues(raw)).toEqual([hashInviteToken(raw), raw]);
    expect(passwordStateFingerprint(raw)).not.toBe(hashRefreshToken(raw));
  });
});
