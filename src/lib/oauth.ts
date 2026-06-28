// ─────────────────────────────────────────────────────────────────────────────
// Sonara — OAuth (Google / Microsoft) branché sur l'auth custom existante.
//
// Flux "Authorization Code" classique :
//   1. /api/auth/oauth/<provider>        → redirige vers le provider (avec state CSRF)
//   2. /api/auth/oauth/<provider>/callback → échange le code, récupère l'email,
//      crée/retrouve la Company+User, puis pose les cookies JWT Sonara habituels.
//
// Aucune dépendance externe : fetch natif. Les identifiants viennent de l'env
// (GOOGLE_CLIENT_ID/SECRET, MICROSOFT_CLIENT_ID/SECRET) — vides = provider désactivé.
// ─────────────────────────────────────────────────────────────────────────────

export type OAuthProvider = "google" | "microsoft";

interface ProviderConfig {
  authUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string;
  clientId?: string;
  clientSecret?: string;
  /** Normalise la réponse userinfo → { email, name }. */
  parseUserInfo: (raw: Record<string, unknown>) => { email: string; name: string } | null;
}

function providers(): Record<OAuthProvider, ProviderConfig> {
  return {
    google: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userInfoUrl: "https://www.googleapis.com/oauth2/v3/userinfo",
      scope: "openid email profile",
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      parseUserInfo: (u) => {
        const email = typeof u.email === "string" ? u.email : null;
        if (!email) return null;
        return { email, name: typeof u.name === "string" ? u.name : "" };
      },
    },
    microsoft: {
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userInfoUrl: "https://graph.microsoft.com/oidc/userinfo",
      scope: "openid email profile",
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      parseUserInfo: (u) => {
        const email =
          (typeof u.email === "string" && u.email) ||
          (typeof u.preferred_username === "string" && u.preferred_username) ||
          null;
        if (!email) return null;
        return { email, name: typeof u.name === "string" ? u.name : "" };
      },
    },
  };
}

export function getProvider(name: string): ProviderConfig | null {
  const all = providers();
  return name === "google" || name === "microsoft" ? all[name] : null;
}

/** Provider activé seulement si client id + secret sont renseignés. */
export function isConfigured(cfg: ProviderConfig): boolean {
  return Boolean(cfg.clientId && cfg.clientSecret);
}

function appUrl(): string {
  return process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function getRedirectUri(provider: OAuthProvider): string {
  return `${appUrl()}/api/auth/oauth/${provider}/callback`;
}

/** URL d'autorisation du provider (étape 1). */
export function buildAuthorizationUrl(
  provider: OAuthProvider,
  cfg: ProviderConfig,
  state: string
): string {
  const params = new URLSearchParams({
    client_id: cfg.clientId as string,
    redirect_uri: getRedirectUri(provider),
    response_type: "code",
    scope: cfg.scope,
    state,
    access_type: "offline",
    prompt: "select_account",
  });
  return `${cfg.authUrl}?${params.toString()}`;
}

/** Échange le code d'autorisation contre un access_token (étape 2). */
export async function exchangeCodeForToken(
  provider: OAuthProvider,
  cfg: ProviderConfig,
  code: string
): Promise<string | null> {
  const body = new URLSearchParams({
    client_id: cfg.clientId as string,
    client_secret: cfg.clientSecret as string,
    code,
    grant_type: "authorization_code",
    redirect_uri: getRedirectUri(provider),
  });
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    console.error(`[OAuth ${provider}] échange code échoué:`, res.status, (await res.text()).slice(0, 200));
    return null;
  }
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

/** Récupère { email, name } depuis le provider via l'access_token. */
export async function fetchUserInfo(
  cfg: ProviderConfig,
  accessToken: string
): Promise<{ email: string; name: string } | null> {
  const res = await fetch(cfg.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    console.error("[OAuth] userinfo échoué:", res.status);
    return null;
  }
  const raw = (await res.json()) as Record<string, unknown>;
  return cfg.parseUserInfo(raw);
}

/** Découpe un nom complet en prénom / nom. */
export function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}
