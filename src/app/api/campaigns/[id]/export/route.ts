// GET /api/campaigns/[id]/export — Export CSV des résultats d'une campagne
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { unauthorized, forbidden, notFound, badRequest, handleError } from "@/lib/response";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (value: unknown) => {
    const text = String(value ?? "").replace(/\r?\n/g, " ");
    // Neutralise les formules à l'ouverture dans Excel/LibreOffice.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  return [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\r\n");
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();
    if (auth.role === "VIEWER") return forbidden("Les exports sont réservés aux administrateurs et managers.");

    const { id } = await params;

    const campaign = await db.campaign.findFirst({
      where: { id, companyId: auth.companyId },
    });
    if (!campaign) return notFound("Campagne");

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") ?? "csv";

    if (format !== "csv") {
      return badRequest("Export CSV uniquement pour le moment.");
    }

    // Récupérer toutes les données d'appels avec contacts
    const calls = await db.call.findMany({
      where: { campaignId: id },
      include: {
        contact: true,
      },
      orderBy: { createdAt: "asc" },
    });

    type CallWithContact = typeof calls[number];

    // Formatter les données pour l'export
    const rows = calls.map((call: CallWithContact) => {
      const transcript = call.transcript as Array<{ speaker: string; text: string; timestamp?: string }> | null;
      const transcriptText = transcript
        ? transcript.map((t) => `[${t.speaker}] ${t.text}`).join(" | ")
        : "";

      return {
        "Prénom": call.contact.firstName ?? "",
        "Nom": call.contact.lastName ?? "",
        "Téléphone": call.contact.phone,
        "Ville": call.contact.city ?? "",
        "Segment": call.contact.segment ?? "",
        "Statut Contact": call.contact.status,
        "Statut Appel": call.status,
        "Durée (sec)": call.durationSec ?? 0,
        "Durée (min)": call.durationSec ? (call.durationSec / 60).toFixed(1) : "0",
        "Date Appel": call.startedAt
          ? new Date(call.startedAt).toLocaleString("fr-FR", { timeZone: "Africa/Abidjan" })
          : "",
        "Tentative N°": call.attemptNumber,
        "Résumé IA": call.summary ?? "",
        "Coût (FCFA)": call.costFcfa ?? 0,
        "Transcription (extrait)": transcriptText.slice(0, 500),
      };
    });

    const campaignSlug = campaign.name.toLowerCase().replace(/\s+/g, "-").slice(0, 30);
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `sonara-${campaignSlug}-${dateStr}`;

    return new NextResponse(`\uFEFF${toCsv(rows)}`, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
