// POST /api/calls/test — Déclenche un appel de TEST unique via Vapi.
// Permet de valider le pipeline complet (Deepgram + GPT-4o + ElevenLabs)
// avec un vrai numéro, sans créer de campagne. Réservé ADMIN / MANAGER.
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticateRequest } from "@/lib/auth";
import { TestCallSchema, normalizePhoneCI } from "@/lib/validation";
import { triggerOutboundCall } from "@/lib/vapi";
import {
  ok,
  badRequest,
  unauthorized,
  forbidden,
  zodError,
  handleError,
} from "@/lib/response";
import { ZodError } from "zod";

const DEFAULT_TEST_BRIEF = `Tu es Ingrid, conseillère virtuelle d'une entreprise ivoirienne.
Cet appel est un test de la plateforme Sonara. Après ta présentation, pose une seule
question de satisfaction (une note sur 5), puis attends la réponse du client. Ne donne
ni la réponse ni les remerciements avant que le client ait répondu. Après sa réponse,
remercie-le et termine poliment l'appel en moins d'une minute.`;

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticateRequest(request);
    if (!auth) return unauthorized();

    // Les VIEWER ne peuvent pas déclencher d'appels
    if (auth.role === "VIEWER") {
      return forbidden("Les utilisateurs en lecture seule ne peuvent pas lancer d'appels.");
    }

    const body = await request.json();
    const input = TestCallSchema.parse(body);

    // Normaliser le numéro au format CI (+225...)
    const phone = normalizePhoneCI(input.phone);
    if (!phone) {
      return badRequest("Numéro invalide. Format attendu : 07XXXXXXXX ou +225XXXXXXXXXX.");
    }

    // Persisté séparément des campagnes : aucun KPI, crédit ou rapport client
    // ne sera modifié par cet appel de validation.
    const testCall = await db.testCall.create({
      data: {
        companyId: auth.companyId,
        phone,
        firstName: input.firstName ?? null,
        aiVoice: input.aiVoice,
        aiBrief: input.aiBrief ?? DEFAULT_TEST_BRIEF,
        aiTemperature: input.aiTemperature,
      },
    });

    const result = await triggerOutboundCall({
      phone,
      callId: testCall.id,
      aiBrief: testCall.aiBrief,
      aiVoice: input.aiVoice,
      aiTemperature: input.aiTemperature,
      maxDuration: 120, // 2 min max pour un test
      contactFirstName: input.firstName ?? null,
      transferNumber: process.env.TRANSFER_AGENT_NUMBER ?? null,
      metadata: {
        type: "test-call",
        companyId: auth.companyId,
        testCallId: testCall.id,
      },
    });

    if (!result.ok) {
      await db.testCall.update({
        where: { id: testCall.id },
        data: { status: "FAILED", endedAt: new Date(), error: result.error ?? "Erreur Vapi inconnue" },
      });
      return badRequest(
        `Échec du déclenchement de l'appel de test : ${result.error ?? "erreur inconnue"}`
      );
    }

    await db.testCall.update({
      where: { id: testCall.id },
      data: { vapiCallId: result.vapiCallId, status: "RINGING" },
    });

    return ok({
      message: "Appel de test déclenché. Le téléphone va sonner dans quelques secondes.",
      vapiCallId: result.vapiCallId,
      phone,
      voice: input.aiVoice,
      testCallId: testCall.id,
    });
  } catch (error) {
    if (error instanceof ZodError) return zodError(error);
    return handleError(error);
  }
}
