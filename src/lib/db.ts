// Singleton Prisma Client — évite les connexions multiples en dev (HMR)
// Prisma 7 avec driver adapter @prisma/adapter-pg
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

/**
 * La connexion directe Supabase (`db.<ref>.supabase.co`) résout en IPv6 sur
 * certains réseaux Windows, où elle est bloquée. Le Session Pooler utilise une
 * route IPv4 et convient à Prisma pour l'application web.
 *
 * SUPABASE_POOLER_HOST permet de surcharger la région si nécessaire.
 */
function resolveDatabaseUrl(connectionString: string): string {
  const url = new URL(connectionString);
  // `pg` laisse sslmode pr\u00e9sent dans l'URL remplacer l'option `ssl` du Pool.
  // Le code ci-dessous est la source unique de configuration TLS.
  url.searchParams.delete("sslmode");
  const directMatch = /^db\.([a-z0-9]+)\.supabase\.co$/i.exec(url.hostname);

  if (!directMatch || process.env.SUPABASE_USE_DIRECT_CONNECTION === "true") {
    return url.toString();
  }

  const projectRef = directMatch[1];
  url.hostname =
    process.env.SUPABASE_POOLER_HOST ?? "aws-1-eu-central-1.pooler.supabase.com";
  url.username = `postgres.${projectRef}`;
  url.port = "5432";
  return url.toString();
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL manquante. Vérifiez votre fichier .env");
  }
  const resolvedConnectionString = resolveDatabaseUrl(connectionString);
  // Certains réseaux de développement injectent leur propre certificat TLS.
  // On ne désactive sa vérification que localement ; la production reste stricte.
  const rejectUnauthorized =
    process.env.PG_SSL_REJECT_UNAUTHORIZED === "false"
      ? false
      : process.env.NODE_ENV === "production";
  const pool = new Pool({
    connectionString: resolvedConnectionString,
    ssl: { rejectUnauthorized },
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export type { PrismaClient };
