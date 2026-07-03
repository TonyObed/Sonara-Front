// GET /api/auth/oauth/<provider>/callback — Fin du flux OAuth.
// Échange le code, récupère l'email, crée/retrouve la Company+User, pose les
// cookies de session Sonara (mêmes que login/register), puis redirige.
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshTokenExpiry,
} from "@/lib/auth";
import {
  getProvider,
  isConfigured,
  exchangeCodeForToken,
  fetchUserInfo,
  splitName,
  type OAuthProvider,
} from "@/lib/oauth";

const isProd = process.env.NODE_ENV === "production";

function redirectTo(request: NextRequest, path: string, error?: string) {
  const url = new URL(path, request.url);
  if (error) url.searchParams.set("error", error);
  const res = NextResponse.redirect(url);
  res.cookies.delete("oauth_state");
  return res;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  const cfg = getProvider(provider);

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const cookieState = request.cookies.get("oauth_state")?.value;

  // Vérifs : provider connu+configuré, code présent, state CSRF concordant.
  if (!cfg || !isConfigured(cfg)) return redirectTo(request, "/login", "oauth_non_configure");
  if (!code || !state || !cookieState || state !== cookieState) {
    return redirectTo(request, "/login", "oauth_invalide");
  }

  try {
    const accessToken = await exchangeCodeForToken(provider as OAuthProvider, cfg, code);
    if (!accessToken) return redirectTo(request, "/login", "oauth_echec");

    const info = await fetchUserInfo(cfg, accessToken);
    if (!info?.email) return redirectTo(request, "/login", "oauth_email_absent");

    const email = info.email.toLowerCase();
    const { firstName, lastName } = splitName(info.name);

    // Retrouver l'entreprise par email, ou en créer une (1er login = inscription).
    let company = await db.company.findUnique({ where: { email } });
    let user;

    if (!company) {
      // Compte OAuth : pas de mot de passe utilisable → hash aléatoire (l'utilisateur
      // pourra définir un mot de passe via "mot de passe oublié" s'il le souhaite).
      const randomHash = await bcrypt.hash(randomUUID(), 12);
      company = await db.company.create({
        data: {
          name: info.name || email,
          email,
          passwordHash: randomHash,
          plan: "STARTER",
          apiCredit: 0,
        },
      });
      user = await db.user.create({
        data: {
          companyId: company.id,
          email,
          firstName: firstName || null,
          lastName: lastName || null,
          role: "ADMIN",
          isActive: true,
        },
      });
    } else {
      if (!company.isActive) return redirectTo(request, "/login", "compte_desactive");
      user = await db.user.findFirst({
        where: { companyId: company.id, role: "ADMIN", isActive: true },
      });
    }

    // NB : en MVP, la connexion OAuth ne repasse pas par la 2FA (le provider fait
    // déjà office de second facteur). À durcir en Phase 2 si nécessaire.

    const at = await generateAccessToken({
      sub: user?.id ?? company.id,
      companyId: company.id,
      role: user?.role ?? "ADMIN",
    });
    const rt = await generateRefreshToken(company.id, user?.id ?? company.id);

    await db.refreshToken.create({
      data: {
        token: rt,
        companyId: company.id,
        userId: user?.id,
        expiresAt: getRefreshTokenExpiry(),
      },
    });

    if (user) {
      await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    }

    // Poser les cookies puis rediriger via une page interstitielle côté client.
    // Une redirection HTTP directe ne marche pas ici : la navigation vient d'un
    // site tiers (Google) et les cookies SameSite=Strict ne seraient pas envoyés
    // sur le GET /dashboard qui suit. Une fois cette page chargée sur notre
    // origine, la navigation devient same-site → les cookies Strict passent.
    const interstitial = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0;url=/dashboard">
  <title>Connexion…</title>
</head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#0A0A0F;color:#fff">
  <p>Connexion réussie, redirection…&nbsp;<a href="/dashboard" style="color:#4D8AFF">Continuer</a></p>
  <script>window.location.replace("/dashboard");</script>
</body>
</html>`;
    const res = new NextResponse(interstitial, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
    res.cookies.set("sonara_access", at, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 60 * 15,
      path: "/",
    });
    res.cookies.set("sonara_refresh", rt, {
      httpOnly: true,
      secure: isProd,
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    res.cookies.delete("oauth_state");
    return res;
  } catch (error) {
    console.error("[OAuth callback] exception:", error);
    return redirectTo(request, "/login", "oauth_echec");
  }
}
