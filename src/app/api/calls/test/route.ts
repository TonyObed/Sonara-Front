// POST /api/calls/test — Déclenche un appel de TEST unique via Vapi.
// Permet de valider le pipeline complet (Deepgram + GPT-4o + ElevenLabs)
// avec un vrai numéro, sans créer de campagne. Réservé ADMIN / MANAGER.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { TestCallSchema, normalizePhoneCI } from "@/lib/validation";
import { triggerOutboundCall } from "@/lib/vapi";
import { rateLimit } from "@/lib/rate-limit";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  tooManyRequests,
  zodError,
  handleError,
} from "@/lib/response";
import { ZodError } from "zod";

const DEFAULT_TEST_BRIEF = `Tu es Awa, conseillère virtuelle d'une entreprise ivoirienne.
Cet appel est un test de la plateforme Sonara. Présente-toi chaleureusement, demande
à ton interlocuteur comment il va, pose-lui une courte question de satisfaction
(note sur 5), remercie-le, puis termine poliment l'appel en moins d'une minute.`;

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    // Les VIEWER ne peuvent pas déclencher d'appels
    if (auth.role === "VIEWER") {
      return forbidden("Les utilisateurs en lecture seule ne peuvent pas lancer d'appels.");
    }

    // VULN-007 : limiter les appels de test par entreprise (anti-abus de coûts).
    // 10 appels / minute / entreprise — suffisant pour une démo, bloque le spam.
    const rl = rateLimit(`testcall:${auth.companyId}`, 10, 60);
    if (!rl.allowed) {
      return tooManyRequests(
        `Trop d'appels de test. Réessayez dans ${rl.retryAfterSec} secondes.`
      );
    }

    const body = await request.json();
    const input = TestCallSchema.parse(body);

    // Normaliser le numéro au format CI (+225...)
    const phone = normalizePhoneCI(input.phone);
    if (!phone) {
      return badRequest("Numéro invalide. Format attendu : 07XXXXXXXX ou +225XXXXXXXXXX.");
    }

    // Vérifier le crédit de l'entreprise
    const company = await db.company.findUnique({
      where: { id: auth.companyId },
      select: { apiCredit: true },
    });

    if (!company || company.apiCredit <= 0) {
      return badRequest("Crédit d'appels insuffisant pour lancer un test.");
    }

    // Déclencher l'appel de test (non persisté — c'est un test ponctuel)
    const result = await triggerOutboundCall({
      phone,
      callId: `test-${Date.now()}`,
      aiBrief: input.aiBrief ?? DEFAULT_TEST_BRIEF,
      aiVoice: input.aiVoice,
      aiTemperature: input.aiTemperature,
      maxDuration: 120, // 2 min max pour un test
      contactFirstName: input.firstName ?? null,
      transferNumber: process.env.TRANSFER_AGENT_NUMBER ?? null,
      metadata: {
        type: "test-call",
        companyId: auth.companyId,
      },
    });

    if (!result.ok) {
      return badRequest(
        `Échec du déclenchement de l'appel de test : ${result.error ?? "erreur inconnue"}`
      );
    }

    return ok({
      message: "Appel de test déclenché. Le téléphone va sonner dans quelques secondes.",
      vapiCallId: result.vapiCallId,
      phone,
      voice: input.aiVoice,
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
