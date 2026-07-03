// GET /api/contacts — Annuaire global de l'entreprise
// Agrège les contacts de toutes les campagnes, dédupliqués par téléphone.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ok, unauthorized, handleError } from "@/lib/response";

// Plafond MVP : on borne la lecture pour éviter une requête non bornée (cf. api-design).
const MAX_ROWS = 5_000;

interface DirectoryContact {
  name: string;
  phone: string;
  city: string;
  segment: string;
  campaigns: number; // nombre de campagnes distinctes où le numéro apparaît
  lastCall: string; // libellé court FR ou "Jamais"
  optout: boolean; // blacklisté (liste noire entreprise ou statut BLACKLISTED)
}

// ISO → "02 juin" ; null/invalide → "Jamais"
function frLastCall(iso: Date | null): string {
  if (!iso) return "Jamais";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Jamais";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" });
}

function fullName(firstName: string | null, lastName: string | null, phone: string): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || phone;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const [rows, blacklist] = await Promise.all([
      db.contact.findMany({
        where: { campaign: { companyId: auth.companyId } },
        orderBy: { lastCalledAt: "desc" },
        take: MAX_ROWS,
        select: {
          phone: true,
          firstName: true,
          lastName: true,
          city: true,
          segment: true,
          status: true,
          lastCalledAt: true,
          campaignId: true,
        },
      }),
      db.blacklist.findMany({
        where: { companyId: auth.companyId },
        select: { phone: true },
      }),
    ]);

    const blacklistSet = new Set(blacklist.map((b: { phone: string }) => b.phone));

    // Déduplication par numéro : une entrée par téléphone, agrège les campagnes.
    type Row = (typeof rows)[number];
    const byPhone = new Map<
      string,
      { row: Row; campaignIds: Set<string>; lastCalledAt: Date | null; optout: boolean }
    >();

    for (const row of rows) {
      const existing = byPhone.get(row.phone);
      const isOptout = blacklistSet.has(row.phone) || row.status === "BLACKLISTED";

      if (!existing) {
        byPhone.set(row.phone, {
          row,
          campaignIds: new Set([row.campaignId]),
          lastCalledAt: row.lastCalledAt,
          optout: isOptout,
        });
        continue;
      }

      existing.campaignIds.add(row.campaignId);
      existing.optout = existing.optout || isOptout;
      // rows triés par lastCalledAt desc → le premier vu porte déjà la date la plus récente
      if (!existing.lastCalledAt && row.lastCalledAt) existing.lastCalledAt = row.lastCalledAt;
    }

    const directory: DirectoryContact[] = Array.from(byPhone.values()).map((e) => ({
      name: fullName(e.row.firstName, e.row.lastName, e.row.phone),
      phone: e.row.phone,
      city: e.row.city ?? "—",
      segment: e.row.segment ?? "Particulier",
      campaigns: e.campaignIds.size,
      lastCall: frLastCall(e.lastCalledAt),
      optout: e.optout,
    }));

    return ok(directory, { total: directory.length, optout: directory.filter((d) => d.optout).length });
  } catch (error) {
    return handleError(error);
  }
}
