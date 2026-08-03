// POST /api/jobs/call-scheduler — Moteur d'appels Sonara
// Déclenche les appels via Vapi.ai (orchestration STT/LLM/TTS)
// Sécurisé par clé interne (x-internal-key header)
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { unauthorized, ok, badRequest, handleError } from "@/lib/response";
import { triggerOutboundCall } from "@/lib/vapi";
import { recomputeCampaignStatus } from "@/lib/campaign-status";

type ClaimedContact = {
  id: string;
  phone: string;
  firstName: string | null;
  city: string | null;
  segment: string | null;
  attempts: number;
};

// ─── VÉRIFICATION HEURE ABIDJAN ───────────────────────────────────────────────

function isWithinAllowedHours(timeStart: string, timeEnd: string): boolean {
  const now = new Date();
  const abidjanlTime = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Africa/Abidjan",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);

  // Parser HH:MM
  const [currentH, currentM] = abidjanlTime.split(":").map(Number);
  const [startH, startM] = timeStart.split(":").map(Number);
  const [endH, endM] = timeEnd.split(":").map(Number);

  const currentMinutes = currentH * 60 + currentM;
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

// Le déclenchement d'appel (assistant Vapi : Deepgram + GPT-4o + ElevenLabs)
// est désormais centralisé dans src/lib/vapi.ts (triggerOutboundCall).

// ─── HANDLER PRINCIPAL ────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    // Clé interne pour sécuriser l'endpoint (appelé uniquement par le serveur)
    // VULN-005 : en production, refuser tout fallback faible.
    const internalKey = request.headers.get("x-internal-key");
    const expectedKey = process.env.INTERNAL_JOB_KEY;

    if (process.env.NODE_ENV === "production" && (!expectedKey || expectedKey.length < 16)) {
      console.error("[Scheduler] INTERNAL_JOB_KEY manquant ou trop faible en production.");
      return unauthorized("Configuration serveur invalide.");
    }

    if (internalKey !== (expectedKey ?? "dev-key")) {
      return unauthorized("Clé interne invalide.");
    }

    const body = await request.json().catch(() => ({}));
    const campaignId = body.campaignId as string | undefined;

    if (!campaignId) {
      return badRequest("campaignId requis.");
    }

    // Charger la campagne
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
    });

    if (!campaign || campaign.status !== "RUNNING") {
      return ok({
        processed: 0,
        message: "Campagne non active ou introuvable.",
      });
    }

    // Vérifier les plages horaires Abidjan (CDC D7)
    if (!isWithinAllowedHours(campaign.timeStart, campaign.timeEnd)) {
      return ok({
        processed: 0,
        message: `Hors plage horaire autorisée (${campaign.timeStart}–${campaign.timeEnd} heure Abidjan).`,
      });
    }

    // Compter les appels en cours
    const inProgressCount = await db.call.count({
      where: {
        campaignId,
        status: { in: ["INITIATED", "RINGING", "IN_PROGRESS"] },
      },
    });

    const slotsAvailable = campaign.concurrency - inProgressCount;

    if (slotsAvailable <= 0) {
      return ok({
        processed: 0,
        message: `Concurrence maximale atteinte (${campaign.concurrency} appels simultanés).`,
      });
    }

    // Réclamer les contacts en une seule opération atomique. Le verrou
    // `SKIP LOCKED` évite qu'un second scheduler lise les mêmes PENDING entre
    // la sélection et le passage à CALLING.
    const pendingContacts = await db.$queryRaw<ClaimedContact[]>`
      WITH candidates AS (
        SELECT id
        FROM contacts
        WHERE campaign_id = ${campaignId}
          AND status = 'PENDING'
          AND attempts < ${campaign.maxRetries}
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${slotsAvailable}
      )
      UPDATE contacts
      SET status = 'CALLING',
          last_called_at = NOW(),
          updated_at = NOW()
      FROM candidates
      WHERE contacts.id = candidates.id
        AND contacts.status = 'PENDING'
      RETURNING contacts.id,
                contacts.phone,
                contacts.first_name AS "firstName",
                contacts.city,
                contacts.segment,
                contacts.attempts
    `;

    if (pendingContacts.length === 0) {
      // Si un autre scheduler détient des lignes PENDING, elles ne sont pas
      // retournées par SKIP LOCKED : ne surtout pas terminer la campagne.
      const contactsStillActive = await db.contact.count({
        where: {
          campaignId,
          status: { in: ["PENDING", "CALLING"] },
          attempts: { lt: campaign.maxRetries },
        },
      });

      if (contactsStillActive > 0) {
        return ok({
          processed: 0,
          message: "Aucun contact disponible : un autre scheduler les traite déjà.",
        });
      }

      const state = await recomputeCampaignStatus(campaignId);
      return ok({
        processed: 0,
        message: state.completed
          ? "Campagne terminée — plus de contacts à appeler."
          : "Aucun contact réclamable pour le moment.",
      });
    }

    let processed = 0;

    for (const contact of pendingContacts) {
      // Créer l'enregistrement d'appel en BDD
      const call = await db.call.create({
        data: {
          contactId: contact.id,
          campaignId,
          status: "INITIATED",
          attemptNumber: contact.attempts + 1,
        },
      });

      // Déclencher l'appel via Vapi.ai (Deepgram + GPT-4o + ElevenLabs)
      const vapiResult = await triggerOutboundCall({
        phone: contact.phone,
        callId: call.id,
        aiBrief: campaign.aiBrief,
        aiVoice: campaign.aiVoice,
        aiTemperature: campaign.aiTemperature,
        maxDuration: campaign.maxDuration,
        // Réglages voix ElevenLabs de la campagne
        voiceId: campaign.aiVoiceId,
        model: campaign.aiVoiceModel,
        stability: campaign.aiStability,
        similarityBoost: campaign.aiSimilarity,
        style: campaign.aiStyle,
        speed: campaign.aiSpeed,
        speakerBoost: campaign.aiSpeakerBoost,
        contactFirstName: contact.firstName,
        contactCity: contact.city,
        contactSegment: contact.segment,
        transferNumber: process.env.TRANSFER_AGENT_NUMBER ?? null,
        metadata: {
          callId: call.id,
          campaignId,
          contactId: contact.id,
        },
      });

      if (vapiResult.ok) {
        // Mettre à jour avec l'ID Vapi
        await db.call.update({
          where: { id: call.id },
          data: {
            vapiCallId: vapiResult.vapiCallId,
            status: "RINGING",
          },
        });
        processed++;
      } else {
        // Vapi a échoué — remettre le contact en PENDING pour retry
        await db.call.update({
          where: { id: call.id },
          data: { status: "FAILED", endedAt: new Date() },
        });
        await db.contact.update({
          where: { id: contact.id },
          data: {
            status: "PENDING",
            attempts: { increment: 1 },
          },
        });
      }
    }

    return ok({
      processed,
      slotsUsed: processed,
      slotsAvailable: slotsAvailable - processed,
      message: `${processed} appel(s) déclenchés.`,
    });
  } catch (error) {
    return handleError(error);
  }
}
