// POST /api/campaigns/[id]/contacts — Import CSV de contacts
// GET  /api/campaigns/[id]/contacts — Liste des contacts d'une campagne
import { NextRequest } from "next/server";
import Papa from "papaparse";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { ContactRowSchema, normalizePhoneCI } from "@/lib/validation";
import {
  ok,
  created,
  unauthorized,
  forbidden,
  notFound,
  badRequest,
  handleError,
  tooManyRequests,
} from "@/lib/response";
import { rateLimit, RATE_LIMITS } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ id: string }> };

// ─── GET : Liste des contacts ─────────────────────────────────────────────────

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
    });
    if (!campaign) return notFound("Campagne");

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50")));
    const status = searchParams.get("status") ?? undefined;

    const where = {
      campaignId: id,
      ...(status ? { status: status as "PENDING" | "CALLING" | "COMPLETED" | "FAILED" | "UNREACHABLE" | "TRANSFERRED" | "VOICEMAIL" | "BLACKLISTED" } : {}),
    };

    const [contacts, total] = await Promise.all([
      db.contact.findMany({
        where,
        orderBy: { createdAt: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.contact.count({ where }),
    ]);

    return ok(contacts, {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    return handleError(error);
  }
}

// ─── POST : Import CSV ────────────────────────────────────────────────────────

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    if (auth.role === "VIEWER") return forbidden("Accès refusé.");

    const rl = await rateLimit(`csv-import:${auth.companyId}:${auth.sub}`, RATE_LIMITS.CSV_IMPORT.limit, RATE_LIMITS.CSV_IMPORT.windowSec);
    if (!rl.allowed) return tooManyRequests(`Trop d'imports rapprochés. Réessayez dans ${rl.retryAfterSec} secondes.`);

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
    });
    if (!campaign) return notFound("Campagne");

    // Seules les campagnes en DRAFT ou SCHEDULED acceptent de nouveaux contacts
    if (!["DRAFT", "SCHEDULED"].includes(campaign.status)) {
      return badRequest(
        "Impossible d'importer des contacts sur une campagne déjà lancée."
      );
    }

    // Vérifier la limite P1 : 10 000 contacts / campagne
    const existingCount = await db.contact.count({ where: { campaignId: id } });
    if (existingCount >= 10_000) {
      return badRequest(
        "Limite de 10 000 contacts par campagne atteinte (Phase 1 MVP)."
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return badRequest("Fichier CSV requis. Envoyez un champ 'file' de type multipart/form-data.");
    }

    if (file.size > 10 * 1024 * 1024) {
      return badRequest("Fichier trop volumineux (max 10 Mo).");
    }

    const csvText = await file.text();

    // Parser le CSV avec PapaParse
    const parsed = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
    });

    if (parsed.errors.length > 0 && parsed.data.length === 0) {
      return badRequest("Fichier CSV invalide ou mal formaté.", parsed.errors.slice(0, 5));
    }

    if (parsed.data.length === 0) {
      return badRequest("Le fichier CSV est vide.");
    }

    if (parsed.data.length + existingCount > 10_000) {
      return badRequest(
        `Import impossible : le fichier contient ${parsed.data.length} contacts, mais la campagne en a déjà ${existingCount}. Limite : 10 000.`
      );
    }

    // Récupérer la liste noire de l'entreprise
    const blacklistEntries = await db.blacklist.findMany({
      where: { companyId: auth.companyId },
      select: { phone: true },
    });
    const blacklistSet = new Set(blacklistEntries.map((b: { phone: string }) => b.phone));

    // Numéros déjà présents dans la campagne (déduplication)
    const existingPhones = await db.contact.findMany({
      where: { campaignId: id },
      select: { phone: true },
    });
    const existingPhoneSet = new Set(existingPhones.map((c: { phone: string }) => c.phone));

    // Traiter chaque ligne
    const toInsert: {
      campaignId: string;
      phone: string;
      firstName?: string;
      lastName?: string;
      city?: string;
      segment?: string;
      notes?: string;
      status: "PENDING" | "BLACKLISTED";
    }[] = [];

    const errors: { row: number; phone: string; reason: string }[] = [];
    const seenInBatch = new Set<string>();

    for (let i = 0; i < parsed.data.length; i++) {
      const row = parsed.data[i] as Record<string, string>;
      const validation = ContactRowSchema.safeParse(row);

      if (!validation.success) {
        errors.push({
          row: i + 2,
          phone: String(row.phone ?? ""),
          reason: validation.error.issues[0]?.message ?? "Ligne invalide",
        });
        continue;
      }

      const { phone: rawPhone, first_name, last_name, city, segment, notes } = validation.data;

      // Normaliser le numéro Côte d'Ivoire
      const normalizedPhone = normalizePhoneCI(rawPhone);
      if (!normalizedPhone) {
        errors.push({
          row: i + 2,
          phone: rawPhone,
          reason: `Numéro invalide ou non reconnu : "${rawPhone}". Format attendu : 07XXXXXXXX ou +22507XXXXXXXX`,
        });
        continue;
      }

      // Déduplication dans le batch
      if (seenInBatch.has(normalizedPhone)) {
        errors.push({ row: i + 2, phone: normalizedPhone, reason: "Doublon dans le fichier CSV" });
        continue;
      }
      seenInBatch.add(normalizedPhone);

      // Déjà dans la campagne
      if (existingPhoneSet.has(normalizedPhone)) {
        errors.push({
          row: i + 2,
          phone: normalizedPhone,
          reason: "Numéro déjà présent dans cette campagne",
        });
        continue;
      }

      const isBlacklisted = blacklistSet.has(normalizedPhone);

      toInsert.push({
        campaignId: id,
        phone: normalizedPhone,
        firstName: first_name || undefined,
        lastName: last_name || undefined,
        city: city || undefined,
        segment: segment || undefined,
        notes: notes || undefined,
        status: isBlacklisted ? "BLACKLISTED" : "PENDING",
      });
    }

    // Insertion en batch (chunked pour éviter les limites Postgres)
    const CHUNK_SIZE = 500;
    let inserted = 0;

    for (let i = 0; i < toInsert.length; i += CHUNK_SIZE) {
      const chunk = toInsert.slice(i, i + CHUNK_SIZE);
      const result = await db.contact.createMany({ data: chunk, skipDuplicates: true });
      inserted += result.count;
    }

    return created({
      imported: inserted,
      skipped: errors.length,
      blacklisted: toInsert.filter((c) => c.status === "BLACKLISTED").length,
      total: parsed.data.length,
      errors: errors.slice(0, 20), // Retourner les 20 premières erreurs max
    });
  } catch (error) {
    return handleError(error);
  }
}
