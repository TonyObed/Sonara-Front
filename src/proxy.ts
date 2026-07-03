// Proxy Next.js 16 — Protection des routes authentifiées
// (ex-"middleware", renommé "proxy" dans Next.js 16)
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessToken } from "@/lib/auth";

// Routes qui nécessitent une authentification
const PROTECTED_PREFIXES = ["/dashboard", "/api/campaigns", "/api/calls", "/api/company", "/api/contacts"];

// Routes API publiques (pas d'auth)
const PUBLIC_API_ROUTES = [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/refresh",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/invite",
  "/api/auth/accept-invite",
  "/api/auth/2fa/verify",
  "/api/auth/oauth",
  "/api/webhooks/vapi",
  "/api/jobs/call-scheduler",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Protection des pages dashboard ────────────────────────────────────────
  if (pathname.startsWith("/dashboard")) {
    const token = request.cookies.get("sonara_access")?.value;

    if (!token) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = await verifyAccessToken(token);
    if (!payload) {
      // Token expiré — tenter le refresh côté client
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      loginUrl.searchParams.set("expired", "1");
      return NextResponse.redirect(loginUrl);
    }

    // Injecter le companyId dans les headers pour les Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-company-id", payload.companyId);
    requestHeaders.set("x-user-role", payload.role);

    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // ─── Protection des routes API ──────────────────────────────────────────────
  if (pathname.startsWith("/api/")) {
    // Laisser passer les routes publiques
    if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Routes API protégées
    if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
      const token =
        request.cookies.get("sonara_access")?.value ??
        request.headers.get("authorization")?.replace("Bearer ", "");

      if (!token) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Non autorisé." } },
          { status: 401 }
        );
      }

      const payload = await verifyAccessToken(token);
      if (!payload) {
        return NextResponse.json(
          { success: false, error: { code: "UNAUTHORIZED", message: "Token invalide ou expiré." } },
          { status: 401 }
        );
      }

      // Passer les infos d'auth aux handlers
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set("x-company-id", payload.companyId);
      requestHeaders.set("x-user-role", payload.role);
      requestHeaders.set("x-user-sub", payload.sub ?? "");

      return NextResponse.next({ request: { headers: requestHeaders } });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Dashboard pages
    "/dashboard/:path*",
    // API routes protégées
    "/api/campaigns/:path*",
    "/api/calls/:path*",
    "/api/company/:path*",
    "/api/contacts/:path*",
    // Auth routes (public mais on les laisse passer)
    "/api/auth/:path*",
    // Webhooks
    "/api/webhooks/:path*",
    // Jobs
    "/api/jobs/:path*",
  ],
};
