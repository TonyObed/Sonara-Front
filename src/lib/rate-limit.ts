// Rate limiting — Sonara Backend (CDC §6)
// Implémentation in-memory (token bucket) pour le MVP P1.
// ⚠️ P2 : migrer vers Redis (Upstash) pour le multi-instance / scale horizontal.

import { Redis } from "@upstash/redis";

// Utilise les variables d'environnement standard de Upstash ou fallback vide pour la démo
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || "https://fake-url-for-build.upstash.io",
  token: process.env.UPSTASH_REDIS_REST_TOKEN || "fake-token",
});

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSec: number;
}

/**
 * Vérifie et incrémente le compteur pour une clé donnée via Redis.
 * @param key    identifiant unique (ex: "login:1.2.3.4" ou "jwt:companyId")
 * @param limit  nombre de requêtes autorisées dans la fenêtre
 * @param windowSec  durée de la fenêtre en secondes
 */
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<RateLimitResult> {
  const now = Date.now();
  // Fenêtre fixe temporelle
  const currentWindow = Math.floor(now / (windowSec * 1000));
  const redisKey = `ratelimit:${key}:${currentWindow}`;

  try {
    const pipeline = redis.pipeline();
    pipeline.incr(redisKey);
    pipeline.expire(redisKey, windowSec);
    
    const results = await pipeline.exec();
    const count = results[0] as number;

    const resetAt = (currentWindow + 1) * windowSec * 1000;

    if (count > limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfterSec: Math.ceil((resetAt - now) / 1000),
      };
    }

    return {
      allowed: true,
      remaining: limit - count,
      resetAt,
      retryAfterSec: 0,
    };
  } catch (err) {
    // Fail-open : si Redis tombe, on laisse passer pour ne pas bloquer l'app (choix MVP)
    console.warn("Redis rate-limit failed:", err);
    return {
      allowed: true,
      remaining: 1,
      resetAt: now + windowSec * 1000,
      retryAfterSec: 0,
    };
  }
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
