// Utilitaires d'authentification JWT — Sonara Backend
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface AccessTokenPayload extends JWTPayload {
  sub: string;          // companyId (admin) ou userId (collaborateur)
  companyId: string;
  role: string;
  type: "access";
}

export interface RefreshTokenPayload extends JWTPayload {
  sub: string;
  companyId: string;
  type: "refresh";
}

// ─── SECRETS ──────────────────────────────────────────────────────────────────

function requireSecret(name: "JWT_ACCESS_SECRET" | "JWT_REFRESH_SECRET"): Uint8Array {
  const value = process.env[name];

  // En production, un secret manquant ou trop court est une faille critique (VULN-001)
  if (process.env.NODE_ENV === "production") {
    if (!value || value.length < 32) {
      throw new Error(
        `[Sonara Security] ${name} manquant ou trop court (min 32 caractères). Refus de démarrer.`
      );
    }
    return new TextEncoder().encode(value);
  }

  // En développement uniquement : fallback explicite + avertissement
  if (!value) {
    console.warn(
      `[Sonara] ⚠️  ${name} non défini — utilisation d'un secret de dev. NE JAMAIS utiliser en production.`
    );
    return new TextEncoder().encode(`dev-only-insecure-${name}-00000000000000000000`);
  }

  return new TextEncoder().encode(value);
}

const getAccessSecret = () => requireSecret("JWT_ACCESS_SECRET");
const getRefreshSecret = () => requireSecret("JWT_REFRESH_SECRET");

// ─── GENERATE TOKENS ──────────────────────────────────────────────────────────

export async function generateAccessToken(
  payload: Omit<AccessTokenPayload, "type" | "iat" | "exp">
): Promise<string> {
  return new SignJWT({ ...payload, type: "access" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAccessSecret());
}

export async function generateRefreshToken(
  companyId: string,
  sub: string
): Promise<string> {
  return new SignJWT({ sub, companyId, type: "refresh" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshSecret());
}

// ─── VERIFY TOKENS ────────────────────────────────────────────────────────────

export async function verifyAccessToken(
  token: string
): Promise<AccessTokenPayload | null> {
  try {
    const { payload } = await jwtVerify<AccessTokenPayload>(token, getAccessSecret());
    if (payload.type !== "access") return null;
    return payload;
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(
  token: string
): Promise<RefreshTokenPayload | null> {
  try {
    const { payload } = await jwtVerify<RefreshTokenPayload>(token, getRefreshSecret());
    if (payload.type !== "refresh") return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── COOKIE HELPERS ───────────────────────────────────────────────────────────

export async function setAuthCookies(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  const cookieStore = await cookies();
  const isProduction = process.env.NODE_ENV === "production";

  cookieStore.set("sonara_access", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 60 * 15, // 15 minutes
    path: "/",
  });

  // VULN-004 : path "/" pour que /api/auth/logout reçoive aussi le cookie et
  // puisse révoquer le token en base. La protection repose sur httpOnly +
  // Secure + SameSite=Strict, pas sur le scoping de path.
  cookieStore.set("sonara_refresh", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
    path: "/",
  });
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete({ name: "sonara_access", path: "/" });
  cookieStore.delete({ name: "sonara_refresh", path: "/" });
}

// ─── EXTRACT TOKEN FROM REQUEST ───────────────────────────────────────────────

export function extractTokenFromRequest(request: NextRequest): string | null {
  // 1. Cookie httpOnly
  const cookieToken = request.cookies.get("sonara_access")?.value;
  if (cookieToken) return cookieToken;

  // 2. Bearer header (pour API publique P2)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
}

// ─── AUTHENTICATE REQUEST ─────────────────────────────────────────────────────

export async function authenticateRequest(
  request: NextRequest
): Promise<AccessTokenPayload | null> {
  const token = extractTokenFromRequest(request);
  if (!token) return null;
  return verifyAccessToken(token);
}

// ─── REFRESH TOKEN EXPIRY ─────────────────────────────────────────────────────

export function getRefreshTokenExpiry(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d;
}

// ─── PASSWORD RESET TOKEN (A3 — lien signé, expiration 1h) ────────────────────

interface ResetTokenPayload extends JWTPayload {
  sub: string;       // companyId
  email: string;
  type: "password-reset";
}

export async function generateResetToken(companyId: string, email: string): Promise<string> {
  // Réutilise le secret refresh (distinct du secret access) + type dédié
  return new SignJWT({ sub: companyId, email, type: "password-reset" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h") // CDC A3 : expiration 1h
    .sign(getRefreshSecret());
}

export async function verifyResetToken(token: string): Promise<ResetTokenPayload | null> {
  try {
    const { payload } = await jwtVerify<ResetTokenPayload>(token, getRefreshSecret());
    if (payload.type !== "password-reset") return null;
    return payload;
  } catch {
    return null;
  }
}

// ─── PRE-AUTH TOKENS (2FA Pont de Connexion) ──────────────────────────────────

export interface PreAuthTokenPayload extends JWTPayload {
  companyId: string;
  userId?: string;
  type: "pre-auth";
}

export async function generatePreAuthToken(
  companyId: string,
  userId?: string
): Promise<string> {
  // Expire après 5 minutes pour des raisons de sécurité
  return new SignJWT({ companyId, userId, type: "pre-auth" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(getAccessSecret());
}

export async function verifyPreAuthToken(
  token: string
): Promise<PreAuthTokenPayload | null> {
  try {
    const { payload } = await jwtVerify<PreAuthTokenPayload>(token, getAccessSecret());
    if (payload.type !== "pre-auth") return null;
    return payload;
  } catch {
    return null;
  }
}

