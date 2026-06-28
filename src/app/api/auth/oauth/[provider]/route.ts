// GET /api/auth/oauth/<provider> — Démarre le flux OAuth (Google / Microsoft).
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getProvider,
  isConfigured,
  buildAuthorizationUrl,
  type OAuthProvider,
} from "@/lib/oauth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const cfg = getProvider(provider);

  const loginUrl = new URL("/login", request.url);

  if (!cfg) {
    loginUrl.searchParams.set("error", "provider_inconnu");
    return NextResponse.redirect(loginUrl);
  }

  if (!isConfigured(cfg)) {
    // Identifiants OAuth non renseignés en .env → message clair côté UI.
    loginUrl.searchParams.set("error", "oauth_non_configure");
    return NextResponse.redirect(loginUrl);
  }

  // State anti-CSRF : stocké en cookie httpOnly et revérifié au callback.
  const state = randomUUID();
  const authUrl = buildAuthorizationUrl(provider as OAuthProvider, cfg, state);

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // "lax" requis : le cookie doit revenir lors du redirect cross-site
    maxAge: 600, // 10 min
    path: "/",
  });
  return res;
}
