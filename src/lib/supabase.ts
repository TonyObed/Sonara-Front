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
