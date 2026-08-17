// POST /api/webhooks/vapi — Réception des événements Vapi.ai
// Sécurisé par HMAC-SHA256 (CDC J1 — Validation webhook Vapi)
import { NextRequest } from "next/server";
import { createHash, createHmac, timingSafeEqual } from "crypto";
import { db } from "@/lib/db";
import { ok, unauthorized, handleError } from "@/lib/response";
import { recomputeCampaignStatus } from "@/lib/campaign-status";

// ─── TYPES WEBHOOK VAPI ────────────────────────────────────────────────────────

interface VapiTranscriptEntry {
  role: "assistant" | "user";
  message: string;
  time?: number;
  endTime?: number;
  secondsFromStart?: number;
}

interface VapiCallEndedPayload {
  type: "end-of-call-report";
  call: {
    id: string;
    status: string;
    startedAt: string;
    endedAt: string;
    durationSeconds?: number;
    transcript?: VapiTranscriptEntry[];
    summary?: string;
    recordingUrl?: string;
    cost?: number; // en USD
    endedReason?: string;
  };
  analysis?: {
    summary?: string;
    structuredData?: Record<string, unknown>;
    successEvaluation?: string;
  };
  artifact?: {
    // Vapi envoie normalement `messages`; `transcript` est conservé pour
    // compatibilité avec les anciens événements.
    messages?: VapiTranscriptEntry[];
    transcript?: VapiTranscriptEntry[] | string;
    recordingUrl?: string;
  };
  // Dans le format actuel de Vapi, ces valeurs sont portées par le message,
  // pas nécessairement par `call`.
  endedReason?: string;
  durationSeconds?: number;
  startedAt?: string;
  endedAt?: string;
  summary?: string;
  recordingUrl?: string;
  cost?: number;
}

interface VapiCallStartedPayload {
  type: "call-started";
  call: {
    id: string;
    status: string;
  };
}

type VapiWebhookPayload =
  | VapiCallEndedPayload
  | VapiCallStartedPayload
  | { type: string; [key: string]: unknown };

/**
 * Vapi encapsule ses Server URL events dans `{ message: { ... } }`.
 * On accepte aussi l'ancien format à plat afin de ne pas casser les appels
 * déjà émis avec une configuration antérieure.
 */
function unwrapVapiMessage(raw: unknown): VapiWebhookPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const envelope = raw as { message?: unknown };
  const candidate = envelope.message ?? raw;
  if (!candidate || typeof candidate !== "object") return null;
  return candidate as VapiWebhookPayload;
}

function endTextField(payload: VapiCallEndedPayload, field: "endedReason" | "startedAt" | "endedAt" | "summary" | "recordingUrl"): string | undefined {
  const value = payload[field] ?? payload.call[field as keyof VapiCallEndedPayload["call"]];
  return typeof value === "string" ? value : undefined;
}

function endNumberField(payload: VapiCallEndedPayload, field: "durationSeconds" | "cost"): number | undefined {
  const value = payload[field] ?? payload.call[field as keyof VapiCallEndedPayload["call"]];
  return typeof value === "number" ? value : undefined;
}

function extractTranscript(payload: VapiCallEndedPayload): VapiTranscriptEntry[] {
  const artifact = payload.artifact;
  if (Array.isArray(artifact?.messages)) return artifact.messages;
  if (Array.isArray(artifact?.transcript)) return artifact.transcript;
  if (Array.isArray(payload.call.transcript)) return payload.call.transcript;
  return [];
}

function formatTranscript(entries: VapiTranscriptEntry[]) {
  return entries.map((entry) => ({
    speaker: entry.role === "assistant" ? "IA (Ingrid)" : "Client",
    text: entry.message,
    timestamp: entry.secondsFromStart === undefined
      ? undefined
      : `${Math.floor(entry.secondsFromStart / 60)}:${String(Math.floor(entry.secondsFromStart % 60)).padStart(2, "0")}`,
  }));
}

// ─── VÉRIFICATION HMAC ────────────────────────────────────────────────────────

function verifyVapiSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  // Comparaison à temps constant pour éviter les timing attacks
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/** Accepts Vapi's legacy inline secret and its credential-based HMAC mode. */
function verifyVapiAuthentication(
  rawBody: string,
  signature: string | null,
  receivedSecret: string | null,
  secret: string
): boolean {
  // `assistant.server.secret` is delivered by Vapi in X-Vapi-Secret.
  if (receivedSecret) {
    if (receivedSecret.length !== secret.length) return false;
    return timingSafeEqual(Buffer.from(receivedSecret), Buffer.from(secret));
  }

  // Future-compatible with a Vapi HMAC credential.
  return verifyVapiSignature(rawBody, signature, secret);
}

// ─── CALCUL COÛT EN FCFA ──────────────────────────────────────────────────────

function usdToFcfa(usd: number): number {
  const RATE = 650; // 1 USD = 650 FCFA (taux de référence)
  return Math.round(usd * RATE * 100) / 100;
}

function extractSentimentScore(data: Record<string, unknown> | undefined): number | null {
  if (!data) return null;
  for (const key of ["sentimentScore", "sentiment_score", "score", "satisfactionScore"]) {
    const value = data[key];
    const number = typeof value === "number" ? value : typeof value === "string" ? Number(value.replace(",", ".")) : NaN;
    if (Number.isFinite(number)) return Math.max(0, Math.min(10, number));
  }
  const sentiment = typeof data.sentiment === "string" ? data.sentiment.toLowerCase() : "";
  if (["positive", "positif", "satisfait"].includes(sentiment)) return 8;
  if (["negative", "négatif", "insatisfait"].includes(sentiment)) return 3;
  if (["neutral", "neutre"].includes(sentiment)) return 5;
  return null;
}

function extractTopics(data: Record<string, unknown> | undefined): string[] | null {
  if (!data) return null;
  const value = data.topics ?? data.keywords ?? data.themes;
  if (!Array.isArray(value)) return null;
  const topics = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 20);
  return topics.length ? topics : null;
}

// ─── GÉNÉRATION DE SECOURS DU RÉSUMÉ ──────────────────────────────────────────

async function generateSummary(transcript: VapiTranscriptEntry[]): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || transcript.length === 0) return null;

  const transcriptText = transcript
    .map((t) => `${t.role === "assistant" ? "IA" : "Client"}: ${t.message}`)
    .join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Tu es un assistant d'analyse de satisfaction client. Génère un résumé court (2-3 phrases max) en français de la conversation suivante. Mets en évidence : le sentiment global du client, les points clés mentionnés, et l'action recommandée si nécessaire.",
          },
          {
            role: "user",
            content: `Transcription de l'appel :\n\n${transcriptText}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-vapi-signature");
    const receivedSecret = request.headers.get("x-vapi-secret");
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET ?? "";

    // En production, un webhook sans secret est une erreur de configuration :
    // il ne doit jamais devenir un endpoint public non authentifié.
    if (process.env.NODE_ENV === "production" && !webhookSecret) {
      console.error("[Vapi Webhook] VAPI_WEBHOOK_SECRET manquant en production.");
      return unauthorized("Webhook Vapi non configuré.");
    }

    if (
      webhookSecret &&
      !verifyVapiAuthentication(rawBody, signature, receivedSecret, webhookSecret)
    ) {
      return unauthorized("Authentification webhook invalide.");
    }

    let parsedPayload: unknown;
    try {
      parsedPayload = JSON.parse(rawBody);
    } catch {
      return ok({ received: false, error: "JSON invalide" });
    }

    const payload = unwrapVapiMessage(parsedPayload);
    if (!payload) return ok({ received: false, error: "Message Vapi invalide" });

    const eventType = payload.type;

    // ─── Démarrage / états d'appel ─────────────────────────────────────────────
    // Les Server URL events actuels utilisent `status-update` (ringing,
    // in-progress, ended). `call-started` est accepté pour les anciens appels.
    if (eventType === "call-started" || eventType === "status-update") {
      const callPayload = payload as VapiCallStartedPayload & { status?: string };
      const vapiCallId = callPayload.call?.id;
      const remoteStatus = `${callPayload.status ?? callPayload.call?.status ?? ""}`.toLowerCase();
      const status = remoteStatus === "ringing" ? "RINGING" : "IN_PROGRESS";

      if (vapiCallId) {
        await db.call.updateMany({
          where: { vapiCallId },
          data: {
            status,
            startedAt: new Date(),
          },
        });
        await db.testCall.updateMany({
          where: { vapiCallId },
          data: { status, startedAt: new Date() },
        });
      }

      return ok({ received: true, event: eventType, status: remoteStatus || "in-progress" });
    }

    // ─── end-of-call-report ───────────────────────────────────────────────────
    if (eventType === "end-of-call-report") {
      const callPayload = payload as VapiCallEndedPayload;
      const vapiCallId = callPayload.call?.id;

      if (!vapiCallId) return ok({ received: true, warning: "vapiCallId manquant" });

      // Trouver l'appel en BDD (avec la campagne pour récupérer le companyId)
      const call = await db.call.findUnique({
        where: { vapiCallId },
        include: {
          contact: true,
          campaign: { select: { companyId: true, maxRetries: true, company: { select: { isSandbox: true } } } },
        },
      });

      if (!call) {
        const testCall = await db.testCall.findUnique({ where: { vapiCallId } });
        if (!testCall) {
          console.warn(`[Vapi Webhook] Appel introuvable pour vapiCallId: ${vapiCallId}`);
          return ok({ received: true, warning: "Appel non trouvé en BDD" });
        }

        const reason = (endTextField(callPayload, "endedReason") ?? "").toLowerCase();
        const status = reason.includes("voicemail") ? "VOICEMAIL"
          : reason.includes("no-answer") || reason.includes("no_answer") ? "NO_ANSWER"
          : reason.includes("busy") ? "BUSY"
          : reason.includes("error") || reason.includes("failed") ? "FAILED"
          : "COMPLETED";
        const transcript = formatTranscript(extractTranscript(callPayload));
        const startedAt = endTextField(callPayload, "startedAt");
        const endedAt = endTextField(callPayload, "endedAt");
        const durationSec = endNumberField(callPayload, "durationSeconds") ?? (startedAt && endedAt
          ? Math.round((new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000)
          : null);
        await db.testCall.update({
          where: { id: testCall.id },
          data: {
            status, durationSec, transcript,
            startedAt: startedAt ? new Date(startedAt) : testCall.startedAt,
            endedAt: endedAt ? new Date(endedAt) : new Date(),
            summary: callPayload.analysis?.summary ?? endTextField(callPayload, "summary") ?? null,
            recordingUrl: callPayload.artifact?.recordingUrl ?? endTextField(callPayload, "recordingUrl") ?? null,
          },
        });
        return ok({ received: true, event: "end-of-call-report", testCallId: testCall.id });
      }

      // Déterminer le statut final
      const endedReason = (endTextField(callPayload, "endedReason") ?? "").toLowerCase();
      let finalStatus: "COMPLETED" | "FAILED" | "NO_ANSWER" | "VOICEMAIL" | "BUSY" = "COMPLETED";

      if (endedReason.includes("voicemail") || endedReason.includes("answering-machine")) {
        finalStatus = "VOICEMAIL";
      } else if (endedReason.includes("no-answer") || endedReason.includes("no_answer")) {
        finalStatus = "NO_ANSWER";
      } else if (endedReason.includes("busy")) {
        finalStatus = "BUSY";
      } else if (endedReason.includes("error") || endedReason.includes("failed")) {
        finalStatus = "FAILED";
      }

      // Extraire la transcription (priorité : artifact > call.transcript)
      const rawTranscript = extractTranscript(callPayload);
      const formattedTranscript = formatTranscript(rawTranscript);

      // Durée en secondes
      const startedAt = endTextField(callPayload, "startedAt");
      const endedAt = endTextField(callPayload, "endedAt");
      const durationSec = endNumberField(callPayload, "durationSeconds")
        ?? (startedAt && endedAt
            ? Math.round(
                (new Date(endedAt).getTime() -
                  new Date(startedAt).getTime()) /
                  1000
              )
            : null);

      // Coût en FCFA
      const cost = endNumberField(callPayload, "cost");
      const costFcfa = cost !== undefined
        ? usdToFcfa(cost)
        : null;

      // Résumé : priorité au résumé Vapi, sinon modèle OpenAI configurable
      const summary =
        callPayload.analysis?.summary ??
        endTextField(callPayload, "summary") ??
        (finalStatus === "COMPLETED" && formattedTranscript.length > 0
          ? await generateSummary(rawTranscript)
          : null);
      const structuredData = callPayload.analysis?.structuredData;
      const sentimentScore = extractSentimentScore(structuredData);
      const topics = extractTopics(structuredData);

      // Vapi peut rejouer un webhook après un timeout. Le hash du corps brut est
      // stable pour un même événement et sa contrainte unique protège aussi les
      // réceptions concurrentes. Toutes les écritures métier sont dans la même
      // transaction : aucun crédit ne peut être débité partiellement.
      const eventFingerprint = createHash("sha256").update(rawBody).digest("hex");

      // Mise à jour du contact
      const contactUpdate: {
        status: "COMPLETED" | "FAILED" | "UNREACHABLE" | "VOICEMAIL";
        lastCalledAt: Date;
        attempts?: { increment: number };
      } = {
        status:
          finalStatus === "COMPLETED"
            ? "COMPLETED"
            : finalStatus === "VOICEMAIL"
            ? "VOICEMAIL"
            : "FAILED",
        lastCalledAt: new Date(),
      };

      // Vérifier si le contact doit être repassé à PENDING pour retry
      // (campaign déjà chargée via l'include — pas de requête supplémentaire)
      const shouldRetry =
        finalStatus !== "COMPLETED" &&
        call.contact.attempts + 1 < (call.campaign?.maxRetries ?? 2);

      try {
        await db.$transaction(async (tx) => {
          await tx.callEvent.create({
            data: { callId: call.id, eventType: "end-of-call-report", eventFingerprint, payload: payload as object },
          });
          await tx.call.update({
            where: { id: call.id },
            data: {
              status: finalStatus, durationSec,
              startedAt: startedAt ? new Date(startedAt) : call.startedAt,
              endedAt: endedAt ? new Date(endedAt) : new Date(),
              transcript: formattedTranscript, summary,
              recordingUrl: callPayload.artifact?.recordingUrl ?? endTextField(callPayload, "recordingUrl") ?? null,
              costFcfa,
            },
          });
          await tx.callInsight.upsert({
            where: { callId: call.id },
            create: { callId: call.id, sentimentScore, topics: topics as never, answers: (structuredData ?? undefined) as never, providerMeta: { successEvaluation: callPayload.analysis?.successEvaluation ?? null } as never },
            update: { sentimentScore, topics: topics as never, answers: (structuredData ?? undefined) as never, providerMeta: { successEvaluation: callPayload.analysis?.successEvaluation ?? null } as never },
          });
          await tx.contact.update({
            where: { id: call.contactId },
            data: { ...contactUpdate, status: shouldRetry ? "PENDING" : contactUpdate.status, attempts: { increment: 1 } },
          });

          if (!call.campaign?.companyId) return;
          if (!call.campaign.company.isSandbox) {
          const company = await tx.company.update({
            where: { id: call.campaign.companyId },
            data: { apiCredit: { decrement: 1 } },
            select: { apiCredit: true },
          });
          await tx.creditTransaction.create({
            data: {
              companyId: call.campaign.companyId,
              callId: call.id,
              type: "CALL_DEBIT",
              amount: -1,
              balanceAfter: company.apiCredit,
              reason: `Appel ${call.id} terminé`,
            },
          });
          }
          await tx.notification.create({
            data: {
              companyId: call.campaign.companyId,
              type: "CALL",
              title: "Appel terminé",
              message: "Un appel de campagne a été enregistré.",
            },
          });
        });
      } catch (error) {
        if ((error as { code?: string }).code === "P2002") {
          return ok({ received: true, duplicate: true, event: "end-of-call-report", callId: call.id });
        }
        throw error;
      }

      const campaignState = await recomputeCampaignStatus(call.campaignId);
      if (!campaignState.completed) {
        // Scheduler récurrent : un slot de concurrence vient de se libérer,
        // on relance le moteur d'appels pour traiter le contact suivant.
        const appUrl =
          process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        fetch(`${appUrl}/api/jobs/call-scheduler`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-key": process.env.INTERNAL_JOB_KEY ?? "dev-key",
          },
          body: JSON.stringify({ campaignId: call.campaignId }),
        }).catch((e) => console.error("[Vapi Webhook] relance scheduler échouée:", e));
      }

      return ok({ received: true, event: "end-of-call-report", callId: call.id });
    }

    // ─── Autres événements Vapi ───────────────────────────────────────────────
    // transcript, hang, speech-update, model-output, etc. — logés pour debug

    const vapiCallId = (payload as { call?: { id?: string } }).call?.id;
    if (vapiCallId) {
      const call = await db.call.findUnique({ where: { vapiCallId } });
      if (call) {
        await db.callEvent.create({
          data: {
            callId: call.id,
            eventType,
            payload: payload as object,
          },
        }).catch(() => {});
      }
    }

    return ok({ received: true, event: eventType });
  } catch (error) {
    return handleError(error);
  }
}
