export function getSupabaseOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;

  // Tolerate an accidental `SUPABASE_URL=` prefix when a .env line was pasted
  // directly into a hosting provider's value field.
  const normalized = value.trim().replace(/^SUPABASE_URL=/i, "");
  try {
    return new URL(normalized).origin;
  } catch {
    return undefined;
  }
}

function normalizeSupabaseKey(value: string): string {
  const normalized = value.trim().replace(/^SUPABASE_SECRET_KEY=/i, "").trim();
  if (
    normalized.length >= 2 &&
    ((normalized.startsWith('"') && normalized.endsWith('"')) ||
      (normalized.startsWith("'") && normalized.endsWith("'")))
  ) {
    return normalized.slice(1, -1);
  }
  return normalized;
}

/**
 * Les nouvelles clés Supabase `sb_secret_…` sont opaques et ne sont pas des
 * JWT. Les envoyer dans `Authorization: Bearer` provoque `Invalid Compact JWS`.
 * Les anciennes clés service_role restent des JWT et nécessitent encore cet
 * en-tête pour les versions de Storage qui ne traduisent pas `apikey`.
 */
export function getSupabaseServiceHeaders(value: string): Record<string, string> {
  const key = normalizeSupabaseKey(value);
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_") && !key.startsWith("sb_publishable_")) {
    headers.authorization = `Bearer ${key}`;
  }
  return headers;
}
