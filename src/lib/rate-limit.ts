// Rate limiting — Sonara Backend (CDC §6)
// Implémentation in-memory (token bucket) pour le MVP P1.
// ⚠️ P2 : migrer vers Redis (Upstash) pour le multi-instance / scale horizontal.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Nettoyage périodique des buckets expirés (évite la fuite mémoire)
let lastCleanup = Date.now();
function cleanup(now: number) {
  if (now - lastCleanup < 60_000) return; // au plus 1x/min
  lastCleanup = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/**
 * Vérifie et incrémente le compteur pour une clé donnée.
 * @param key    identifiant unique (ex: "login:1.2.3.4" ou "jwt:companyId")
 * @param limit  nombre de requêtes autorisées dans la fenêtre
 * @param windowSec  durée de la fenêtre en secondes
 */
export function rateLimit(key: string, limit: number, windowSec: number): RateLimitResult {
  const now = Date.now();
  cleanup(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    // Nouvelle fenêtre
    const resetAt = now + windowSec * 1000;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: bucket.resetAt,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    resetAt: bucket.resetAt,
    retryAfterSec: 0,
  };
}

/**
 * Extrait l'IP du client depuis les headers (proxy-aware).
 */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return (
    headers.get("x-real-ip") ??
    headers.get("cf-connecting-ip") ?? // Cloudflare (P2)
    "unknown"
  );
}

// ─── PRÉSETS (CDC §6) ─────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  // Brute-force protection sur l'authentification : strict
  AUTH: { limit: 10, windowSec: 60 },       // 10 tentatives / min / IP
  // Routes publiques : 100 req/min
  PUBLIC: { limit: 100, windowSec: 60 },
  // Routes authentifiées : 1000 req/min par JWT
  AUTHENTICATED: { limit: 1000, windowSec: 60 },
} as const;
