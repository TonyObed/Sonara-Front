// GET /api/campaigns/[id]/export — Export Excel/CSV des résultats d'une campagne
import { NextRequest } from "next/server";
import * as XLSX from "xlsx";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { unauthorized, notFound, badRequest, handleError } from "@/lib/response";
import { NextResponse } from "next/server";

type RouteContext = { params: Promise<{ id: string }> };

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
    const format = searchParams.get("format") ?? "xlsx"; // xlsx ou csv

    if (!["xlsx", "csv"].includes(format)) {
      return badRequest("Format invalide. Utilisez 'xlsx' ou 'csv'.");
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

    if (format === "csv") {
      // Export CSV brut
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // Export Excel (.xlsx)
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // Largeurs de colonnes
    worksheet["!cols"] = [
      { wch: 15 }, // Prénom
      { wch: 15 }, // Nom
      { wch: 18 }, // Téléphone
      { wch: 15 }, // Ville
      { wch: 12 }, // Segment
      { wch: 16 }, // Statut Contact
      { wch: 14 }, // Statut Appel
      { wch: 12 }, // Durée sec
      { wch: 10 }, // Durée min
      { wch: 20 }, // Date Appel
      { wch: 12 }, // Tentative
      { wch: 50 }, // Résumé IA
      { wch: 12 }, // Coût
      { wch: 60 }, // Transcription
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, "Résultats Campagne");

    // Feuille KPIs
    const totalCalls = calls.length;
    const completed = calls.filter((c: CallWithContact) => c.status === "COMPLETED").length;
    const failed = calls.filter((c: CallWithContact) => ["FAILED", "NO_ANSWER", "BUSY"].includes(c.status)).length;
    const voicemail = calls.filter((c: CallWithContact) => c.status === "VOICEMAIL").length;
    const totalDuration = calls.reduce((sum: number, c: CallWithContact) => sum + (c.durationSec ?? 0), 0);
    const totalCost = calls.reduce((sum: number, c: CallWithContact) => sum + (c.costFcfa ?? 0), 0);

    const kpiRows = [
      { "Indicateur": "Campagne", "Valeur": campaign.name },
      { "Indicateur": "Export généré le", "Valeur": new Date().toLocaleString("fr-FR") },
      { "Indicateur": "Total appels", "Valeur": totalCalls },
      { "Indicateur": "Appels complétés", "Valeur": completed },
      { "Indicateur": "Appels échoués", "Valeur": failed },
      { "Indicateur": "Messageries vocales", "Valeur": voicemail },
      {
        "Indicateur": "Taux de réponse",
        "Valeur": totalCalls > 0 ? `${Math.round((completed / totalCalls) * 100)}%` : "0%",
      },
      {
        "Indicateur": "Durée totale",
        "Valeur": `${Math.floor(totalDuration / 60)} min ${totalDuration % 60} sec`,
      },
      {
        "Indicateur": "Durée moyenne / appel",
        "Valeur":
          completed > 0
            ? `${Math.round(totalDuration / completed)} sec`
            : "0 sec",
      },
      { "Indicateur": "Coût total (FCFA)", "Valeur": totalCost.toFixed(0) },
    ];

    const kpiSheet = XLSX.utils.json_to_sheet(kpiRows);
    kpiSheet["!cols"] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, kpiSheet, "Résumé KPIs");

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}.xlsx"`,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
