import { db } from "@/lib/db";
import { getSupabaseOrigin, getSupabaseServiceHeaders } from "@/lib/supabase";

const REPORT_BUCKET = "sonara-reports";

type ReportScope = { companyId: string; campaignId?: string | null };

type ReportQuestion = { key: string; label: string; position: number };

const CALL_STATUS_LABELS: Record<string, string> = {
  INITIATED: "Initialisé",
  RINGING: "En sonnerie",
  IN_PROGRESS: "En cours",
  COMPLETED: "Enquête terminée",
  FAILED: "Échec technique",
  VOICEMAIL: "Messagerie vocale",
  NO_ANSWER: "Sans réponse",
  TRANSFERRED: "Transféré",
  BUSY: "Ligne occupée",
};

function formatDuration(seconds: number | null): string {
  if (seconds == null || seconds < 0) return "—";
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return minutes > 0 ? `${minutes} min ${remainingSeconds.toString().padStart(2, "0")} s` : `${remainingSeconds} s`;
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(date);
}

function formatAnswers(answers: unknown, questions: ReportQuestion[]): string {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return "";
  const values = answers as Record<string, unknown>;
  const labels = new Map(questions.map((question) => [question.key, question.label]));
  const metadata = new Set(["callDisposition", "sentimentScore", "topics"]);

  return Object.entries(values)
    .filter(([key, value]) => !metadata.has(key) && value !== null && value !== undefined && value !== "")
    .map(([key, value]) => `${labels.get(key) ?? key} : ${Array.isArray(value) ? value.join(", ") : String(value)}`)
    .join(" | ");
}

function csvEscape(value: unknown): string {
  const text = String(value ?? "").replace(/\r?\n/g, " ");
  // Empêche l'interprétation d'une valeur comme formule dans Excel.
  const safe = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\r\n");
}

async function ensureBucket(origin: string, key: string) {
  const response = await fetch(`${origin}/storage/v1/bucket`, {
    method: "POST",
    headers: { ...getSupabaseServiceHeaders(key), "content-type": "application/json" },
    body: JSON.stringify({ id: REPORT_BUCKET, name: REPORT_BUCKET, public: false }),
  });
  // 400 signifie généralement que le bucket existe déjà.
  if (!response.ok && response.status !== 400) {
    throw new Error("Le stockage des rapports n'est pas disponible.");
  }
}

async function uploadReport(path: string, content: string) {
  const origin = getSupabaseOrigin(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!origin || !key) throw new Error("Le stockage des rapports n'est pas configuré.");

  await ensureBucket(origin, key);
  const response = await fetch(`${origin}/storage/v1/object/${REPORT_BUCKET}/${path}`, {
    method: "POST",
    headers: {
      ...getSupabaseServiceHeaders(key),
      "content-type": "text/csv; charset=utf-8",
      "x-upsert": "false",
    },
    body: content,
  });
  if (!response.ok) throw new Error("Impossible d'enregistrer le fichier du rapport.");
}

export async function getStoredReport(path: string) {
  const origin = getSupabaseOrigin(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!origin || !key) throw new Error("Le stockage des rapports n'est pas configuré.");
  const response = await fetch(`${origin}/storage/v1/object/${REPORT_BUCKET}/${path}`, {
    headers: getSupabaseServiceHeaders(key),
  });
  if (!response.ok) throw new Error("Le fichier du rapport est introuvable.");
  return response;
}

export async function generateReport(scope: ReportScope) {
  if (scope.campaignId) {
    const campaign = await db.campaign.findFirst({ where: { id: scope.campaignId, companyId: scope.companyId }, select: { id: true, name: true } });
    if (!campaign) throw new Error("Campagne introuvable.");
  }

  const report = await db.report.create({
    data: {
      companyId: scope.companyId,
      campaignId: scope.campaignId ?? null,
      name: "Génération du rapport…",
      format: "CSV",
      status: "GENERATING",
    },
  });

  try {
    const calls = await db.call.findMany({
      where: { campaign: { companyId: scope.companyId }, ...(scope.campaignId ? { campaignId: scope.campaignId } : {}) },
      include: {
        campaign: {
          select: {
            name: true,
            questions: { select: { key: true, label: true, position: true }, orderBy: { position: "asc" } },
          },
        },
        contact: true,
        insight: true,
      },
      orderBy: { createdAt: "asc" },
    });
    const totalCalls = calls.length;
    const completedCalls = calls.filter((call) => call.status === "COMPLETED");
    const answeredCalls = calls.filter((call) => ["COMPLETED", "TRANSFERRED"].includes(call.status));
    const averageDuration = completedCalls.length
      ? Math.round(completedCalls.reduce((sum, call) => sum + (call.durationSec ?? 0), 0) / completedCalls.length)
      : 0;
    const scores = calls.flatMap((call) => call.insight?.sentimentScore == null ? [] : [call.insight.sentimentScore]);
    const sentiment = scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : null;
    const responseRate = totalCalls ? Math.round((answeredCalls.length / totalCalls) * 1000) / 10 : 0;
    const totalCostFcfa = calls.reduce((sum, call) => sum + (call.costFcfa ?? 0), 0);
    const statusCounts = Object.fromEntries(Array.from(new Set(calls.map((call) => call.status))).map((status) => [status, calls.filter((call) => call.status === status).length]));

    const summary = { totalCalls, completedCalls: completedCalls.length, answeredCalls: answeredCalls.length, responseRate, averageDurationSec: averageDuration, sentiment, totalCostFcfa, statusCounts };
    const rows: Record<string, unknown>[] = [
      { "Type": "Synthèse", "Indicateur": "Appels passés", "Valeur": totalCalls },
      { "Type": "Synthèse", "Indicateur": "Taux de réponse", "Valeur": `${responseRate}%` },
      { "Type": "Synthèse", "Indicateur": "Appels terminés", "Valeur": completedCalls.length },
      { "Type": "Synthèse", "Indicateur": "Durée moyenne", "Valeur": formatDuration(averageDuration) },
      { "Type": "Synthèse", "Indicateur": "Sentiment moyen (/10)", "Valeur": sentiment ?? "" },
      { "Type": "Synthèse", "Indicateur": "Coût total (FCFA)", "Valeur": totalCostFcfa },
      ...calls.map((call) => ({
        "Type": "Appel",
        "Campagne": call.campaign.name,
        "Prénom": call.contact.firstName ?? "",
        "Nom": call.contact.lastName ?? "",
        "Téléphone": call.contact.phone,
        "Ville": call.contact.city ?? "",
        "Segment": call.contact.segment ?? "",
        "Statut": CALL_STATUS_LABELS[call.status] ?? call.status,
        "Durée": formatDuration(call.durationSec),
        "Date et heure": formatDate(call.startedAt),
        "Sentiment (/10)": call.insight?.sentimentScore ?? "",
        "Réponses clés": formatAnswers(call.insight?.answers, call.campaign.questions),
        "Thèmes": Array.isArray(call.insight?.topics) ? call.insight?.topics.join(", ") : "",
        "Résumé de l'échange": call.summary?.trim() || "Aucun retour exploitable.",
      })),
    ];
    const content = `\uFEFF${toCsv(rows)}`;
    const path = `${scope.companyId}/${report.id}.csv`;
    await uploadReport(path, content);
    const name = scope.campaignId
      ? `Rapport — ${calls[0]?.campaign.name ?? "campagne"}`
      : "Rapport — toutes les campagnes";
    const updated = await db.report.update({
      where: { id: report.id },
      data: { name, fileUrl: path, fileSizeBytes: Buffer.byteLength(content), summary, status: "READY", generatedAt: new Date() },
    });
    await db.notification.create({ data: { companyId: scope.companyId, type: "INFO", title: "Rapport prêt", message: `${name} est disponible au téléchargement.` } });
    return updated;
  } catch (error) {
    await db.report.update({ where: { id: report.id }, data: { name: "Rapport non généré", status: "FAILED" } });
    throw error;
  }
}
