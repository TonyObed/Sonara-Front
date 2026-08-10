import { describe, expect, it } from "vitest";
import { getSupabaseOrigin, getSupabaseServiceHeaders } from "@/lib/supabase";

describe("Supabase server configuration", () => {
  it("envoie une nouvelle clé secrète uniquement dans apikey", () => {
    expect(getSupabaseServiceHeaders("sb_secret_test")).toEqual({ apikey: "sb_secret_test" });
  });

  it("conserve Authorization pour une ancienne clé service_role JWT", () => {
    expect(getSupabaseServiceHeaders("eyJlegacy.jwt")).toEqual({
      apikey: "eyJlegacy.jwt",
      authorization: "Bearer eyJlegacy.jwt",
    });
  });

  it("tolère une ligne d'environnement complète copiée dans Vercel", () => {
    expect(getSupabaseServiceHeaders('SUPABASE_SECRET_KEY="sb_secret_test"')).toEqual({ apikey: "sb_secret_test" });
    expect(getSupabaseOrigin("SUPABASE_URL=https://project.supabase.co")).toBe("https://project.supabase.co");
  });
});
