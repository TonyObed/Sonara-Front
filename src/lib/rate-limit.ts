// Rate limiting — Sonara Backend (CDC §6)
// Implémentation in-memory (token bucket) pour le MVP P1.
// ⚠️ P2 : migrer vers Redis (Upstash) pour le multi-instance / scale horizontal.

import { Redis } from "@upstash/redis";

const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = redisUrl && redisToken ? new Redis({ url: redisUrl, token: redisToken }) : null;
const localCounters = new Map<string, { count: number; expiresAt: number }>();

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

  const restrictiveFallback = (): RateLimitResult => {
    if (process.env.NODE_ENV === "production") {
      // Les routes appelant cette fonction ne doivent jamais devenir illimitées
      // lorsqu'un service anti-abus est absent ou indisponible en production.
      return { allowed: false, remaining: 0, resetAt: now + 60_000, retryAfterSec: 60 };
    }

    const existing = localCounters.get(redisKey);
    const counter = !existing || existing.expiresAt <= now
      ? { count: 1, expiresAt: now + windowSec * 1000 }
      : { ...existing, count: existing.count + 1 };
    localCounters.set(redisKey, counter);
    const resetAt = counter.expiresAt;
    return {
      allowed: counter.count <= limit,
      remaining: Math.max(0, limit - counter.count),
      resetAt,
      retryAfterSec: counter.count <= limit ? 0 : Math.ceil((resetAt - now) / 1000),
    };
  };

  if (!redis) {
    console.warn("Redis rate-limit non configuré; fallback local appliqué.");
    return restrictiveFallback();
  }

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
    // En production, une panne Redis bloque les routes protégées plutôt que de
    // les rendre illimitées. En développement, un compteur local garde le test utilisable.
    console.warn("Redis rate-limit failed:", err);
    return restrictiveFallback();
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
