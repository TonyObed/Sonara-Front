// POST /api/webhooks/vapi — Réception des événements Vapi.ai
// Sécurisé par HMAC-SHA256 (CDC J1 — Validation webhook Vapi)
import { NextRequest } from "next/server";
import { createHmac } from "crypto";
import { db } from "@/lib/db";
import { ok, unauthorized, handleError } from "@/lib/response";

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
    transcript?: VapiTranscriptEntry[];
    recordingUrl?: string;
  };
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

  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }

  return mismatch === 0;
}

// ─── CALCUL COÛT EN FCFA ──────────────────────────────────────────────────────

function usdToFcfa(usd: number): number {
  const RATE = 650; // 1 USD = 650 FCFA (taux de référence)
  return Math.round(usd * RATE * 100) / 100;
}

// ─── GÉNÉRATION RÉSUMÉ VIA GPT-4o ─────────────────────────────────────────────

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
    const webhookSecret = process.env.VAPI_WEBHOOK_SECRET ?? "";

    // Vérification de la signature HMAC (si secret configuré)
    if (webhookSecret && !verifyVapiSignature(rawBody, signature, webhookSecret)) {
      return unauthorized("Signature webhook invalide.");
    }

    let payload: VapiWebhookPayload;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return ok({ received: false, error: "JSON invalide" });
    }

    const eventType = payload.type;

    // ─── call-started ──────────────────────────────────────────────────────────
    if (eventType === "call-started") {
      const callPayload = payload as VapiCallStartedPayload;
      const vapiCallId = callPayload.call?.id;

      if (vapiCallId) {
        await db.call.updateMany({
          where: { vapiCallId },
          data: {
            status: "IN_PROGRESS",
            startedAt: new Date(),
          },
        });
      }

      return ok({ received: true, event: "call-started" });
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
          campaign: { select: { companyId: true, maxRetries: true } },
        },
      });

      if (!call) {
        console.warn(`[Vapi Webhook] Appel introuvable pour vapiCallId: ${vapiCallId}`);
        return ok({ received: true, warning: "Appel non trouvé en BDD" });
      }

      // Déterminer le statut final
      const endedReason = callPayload.call.endedReason ?? "";
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
      const rawTranscript =
        callPayload.artifact?.transcript ?? callPayload.call.transcript ?? [];

      const formattedTranscript = rawTranscript.map((t) => ({
        speaker: t.role === "assistant" ? "IA (Awa)" : "Client",
        text: t.message,
        timestamp: t.secondsFromStart !== undefined
          ? `${Math.floor(t.secondsFromStart / 60)}:${String(Math.floor(t.secondsFromStart % 60)).padStart(2, "0")}`
          : undefined,
      }));

      // Durée en secondes
      const durationSec = callPayload.call.durationSeconds
        ?? (callPayload.call.startedAt && callPayload.call.endedAt
            ? Math.round(
                (new Date(callPayload.call.endedAt).getTime() -
                  new Date(callPayload.call.startedAt).getTime()) /
                  1000
              )
            : null);

      // Coût en FCFA
      const costFcfa = callPayload.call.cost
        ? usdToFcfa(callPayload.call.cost)
        : null;

      // Résumé : priorité au résumé Vapi, sinon GPT-4o
      const summary =
        callPayload.analysis?.summary ??
        callPayload.call.summary ??
        (finalStatus === "COMPLETED" && formattedTranscript.length > 0
          ? await generateSummary(rawTranscript)
          : null);

      // Mise à jour de l'appel en BDD
      await db.call.update({
        where: { id: call.id },
        data: {
          status: finalStatus,
          durationSec,
          startedAt: callPayload.call.startedAt ? new Date(callPayload.call.startedAt) : call.startedAt,
          endedAt: callPayload.call.endedAt ? new Date(callPayload.call.endedAt) : new Date(),
          transcript: formattedTranscript,
          summary,
          recordingUrl: callPayload.artifact?.recordingUrl ?? callPayload.call.recordingUrl ?? null,
          costFcfa,
        },
      });

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

      await db.contact.update({
        where: { id: call.contactId },
        data: {
          ...contactUpdate,
          status: shouldRetry ? "PENDING" : contactUpdate.status,
          attempts: { increment: 1 },
        },
      });

      // Logger l'événement
      await db.callEvent.create({
        data: {
          callId: call.id,
          eventType: "end-of-call-report",
          payload: payload as object,
        },
      });

      // VULN-002 corrigée : déduire le crédit de la BONNE entreprise
      // (companyId récupéré via la relation campaign, pas un campaignId)
      if (call.campaign?.companyId) {
        await db.company
          .update({
            where: { id: call.campaign.companyId },
            data: { apiCredit: { decrement: 1 } },
          })
          .catch((e) => console.error("[Vapi Webhook] Échec décrément crédit:", e));
      }

      // Vérifier si la campagne est terminée (tous les contacts traités)
      const pendingCount = await db.contact.count({
        where: { campaignId: call.campaignId, status: "PENDING" },
      });

      if (pendingCount === 0) {
        await db.campaign.update({
          where: { id: call.campaignId },
          data: { status: "COMPLETED", completedAt: new Date() },
        });
      } else {
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
