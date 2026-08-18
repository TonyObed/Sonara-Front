// Helpers de réponse HTTP standardisés — Sonara Backend

import { NextResponse } from "next/server";
import { ZodError } from "zod";

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

// ─── SUCCESS RESPONSES ────────────────────────────────────────────────────────

export function ok<T>(data: T, meta?: Record<string, unknown>, status = 200) {
  return NextResponse.json<ApiSuccess<T>>(
    { success: true, data, ...(meta ? { meta } : {}) },
    // Une API authentifiée qui retourne des états d'appel ne doit pas être
    // mise en cache par un CDN ou par le navigateur.
    { status, headers: { "Cache-Control": "no-store, max-age=0" } }
  );
}

export function created<T>(data: T) {
  return ok(data, undefined, 201);
}

// ─── ERROR RESPONSES ─────────────────────────────────────────────────────────

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json<ApiError>(
    { success: false, error: { code: "BAD_REQUEST", message, details } },
    { status: 400 }
  );
}

export function unauthorized(message = "Non autorisé. Veuillez vous connecter.") {
  return NextResponse.json<ApiError>(
    { success: false, error: { code: "UNAUTHORIZED", message } },
    { status: 401 }
  );
}

export function forbidden(message = "Accès refusé.") {
  return NextResponse.json<ApiError>(
    { success: false, error: { code: "FORBIDDEN", message } },
    { status: 403 }
  );
}

export function notFound(resource = "Ressource") {
  return NextResponse.json<ApiError>(
    { success: false, error: { code: "NOT_FOUND", message: `${resource} introuvable.` } },
    { status: 404 }
  );
}

export function conflict(message: string) {
  return NextResponse.json<ApiError>(
    { success: false, error: { code: "CONFLICT", message } },
    { status: 409 }
  );
}

export function tooManyRequests(message = "Trop de requêtes. Réessayez plus tard.") {
  return NextResponse.json<ApiError>(
    { success: false, error: { code: "RATE_LIMIT", message } },
    { status: 429 }
  );
}

export function internalError(message = "Erreur interne du serveur.") {
  return NextResponse.json<ApiError>(
    { success: false, error: { code: "INTERNAL_ERROR", message } },
    { status: 500 }
  );
}

// ─── ZOD VALIDATION HELPER ───────────────────────────────────────────────────

export function zodError(error: ZodError) {
  const issues = error.issues ?? [];
  const details = issues.map((e) => ({
    field: e.path.join("."),
    message: e.message,
  }));
  return badRequest("Données invalides.", details);
}

// ─── GENERIC ERROR HANDLER ────────────────────────────────────────────────────

export function handleError(error: unknown) {
  if (error instanceof ZodError) return zodError(error);

  console.error("[Sonara API Error]", error);
  return internalError();
}
