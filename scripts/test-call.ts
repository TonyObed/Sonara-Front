// ─────────────────────────────────────────────────────────────────────────────
// Sonara — Déclencheur d'appel de DÉMO en une commande.
//
//   npm run test-call -- +2250700000000
//   npm run test-call -- 0700000000           (numéro CI, normalisé auto)
//
// Réutilise le vrai module d'orchestration (src/lib/vapi.ts) : Deepgram (STT)
// + GPT-4o (LLM) + ElevenLabs (TTS). Fait sonner le téléphone pour la présentation.
// ─────────────────────────────────────────────────────────────────────────────
import "dotenv/config";
import { triggerOutboundCall } from "../src/lib/vapi";
import { normalizePhoneCI } from "../src/lib/validation";

const DEMO_BRIEF = `Tu es Ingrid, conseillère virtuelle d'une banque ivoirienne de démonstration.
Présente-toi chaleureusement en français ivoirien, demande comment va la personne,
pose une courte question de satisfaction (note sur 5 sur la qualité du service en agence),
rebondis sur la réponse, remercie et termine poliment en moins d'une minute.`;

async function main() {
  const rawPhone = process.argv[2];

  if (!rawPhone) {
    console.error("\n❌ Usage : npm run test-call -- <numéro>\n   ex : npm run test-call -- 0700000000\n");
    process.exit(1);
  }

  // Vérifier les clés Vapi
  const missing: string[] = [];
  if (!process.env.VAPI_API_KEY) missing.push("VAPI_API_KEY");
  if (!process.env.VAPI_PHONE_NUMBER_ID) missing.push("VAPI_PHONE_NUMBER_ID");
  if (missing.length > 0) {
    console.error(`\n❌ Clés Vapi manquantes dans .env : ${missing.join(", ")}`);
    console.error("   → Récupérez-les sur https://dashboard.vapi.ai et collez-les dans .env\n");
    process.exit(1);
  }

  const phone = normalizePhoneCI(rawPhone) ?? rawPhone;
  console.log(`\n📞 Déclenchement de l'appel de démo vers ${phone} ...`);
  console.log("   Pipeline : Deepgram (STT) → GPT-4o (LLM) → ElevenLabs (TTS)\n");

  const result = await triggerOutboundCall({
    phone,
    callId: `demo-${Date.now()}`,
    aiBrief: DEMO_BRIEF,
    aiVoice: "awa_female_ci",
    aiTemperature: 0.6,
    maxDuration: 120,
    metadata: { type: "demo-cli" },
  });

  if (result.ok) {
    console.log(`✅ Appel déclenché ! Le téléphone va sonner dans quelques secondes.`);
    console.log(`   Vapi call id : ${result.vapiCallId}\n`);
  } else {
    console.error(`❌ Échec : ${result.error}\n`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Erreur :", e);
  process.exit(1);
});
