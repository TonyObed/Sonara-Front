// ─────────────────────────────────────────────────────────────────────────────
// Module d'intégration Vapi.ai — Sonara (orchestration voix Phase 1)
//
// Pipeline temps réel : Deepgram (STT) → OpenAI (LLM) → ElevenLabs (TTS)
// Vapi intègre nativement ElevenLabs & Deepgram : on référence les providers
// dans la config de l'assistant, Vapi gère les clés provider sous-jacentes.
// ─────────────────────────────────────────────────────────────────────────────

const VAPI_BASE = "https://api.vapi.ai";

// Map voix logique (stockée en BDD) → voiceId ElevenLabs (configurable via env).
// Les IDs par défaut sont des voix ElevenLabs publiques disponibles via Vapi ;
// remplacer par des voix françaises/ivoiriennes dédiées en renseignant les env.
export const VOICE_MAP: Record<string, string> = {
  awa_female_ci: process.env.ELEVENLABS_VOICE_AWA ?? "21m00Tcm4TlvDq8ikWAM", // Rachel (fallback)
  koffi_male_ci: process.env.ELEVENLABS_VOICE_KOFFI ?? "pNInz6obpgDQGcFmaJgB", // Adam (fallback)
};

// Vocabulaire local CI injecté dans Deepgram pour fiabiliser la transcription
// (toponymes, opérateurs, expressions nouchi). CDC E2 / D6.
const CI_KEYWORDS = [
  "Abidjan", "Cocody", "Yopougon", "Angré", "Plateau", "Treichville", "Marcory",
  "Bouaké", "Yamoussoukro", "Orange", "MTN", "Moov", "Wave", "FCFA",
  "nouchi", "yako", "djaah", "enjaillé", "gbô", "deh", "ô",
];

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────

function buildSystemPrompt(params: {
  aiBrief: string;
  contactFirstName?: string | null;
  contactCity?: string | null;
  contactSegment?: string | null;
  callId: string;
}): string {
  return `${params.aiBrief}

Variables contextuelles de l'appel :
- Prénom du contact : ${params.contactFirstName ?? "Client"}
- Ville : ${params.contactCity ?? "non renseignée"}
- Segment : ${params.contactSegment ?? "non renseigné"}
- Référence interne de l'appel : ${params.callId}

Règles impératives (non négociables) :
1. Dès le début, identifie-toi comme représentante de l'entreprise cliente (conformité ARTCI / CDC J1). Ne te présente jamais comme « Sonara ».
2. Parle un français ivoirien naturel et chaleureux. Tu peux utiliser des expressions locales légères, sans excès.
3. Si le client demande à parler à un humain, utilise l'outil de transfert si disponible, sinon indique que tu transmets la demande et termine poliment.
4. Ne révèle pas que tu es une IA, sauf si le client le demande explicitement.
5. Adapte-toi : réponse vague → relance ; contradiction → recoupe ; client irrité → apaise ; hors-sujet → reviens au fil.
6. Heure et fuseau : Abidjan, Côte d'Ivoire.`;
}

// ─── CONSTRUCTION DE L'ASSISTANT VAPI ─────────────────────────────────────────

export interface VoiceSettings {
  /** voiceId ElevenLabs explicite (voix clonée). Prioritaire sur aiVoice. */
  voiceId?: string | null;
  model?: string;          // eleven_turbo_v2_5, eleven_multilingual_v2, ...
  stability?: number;      // 0-1
  similarityBoost?: number;// 0-1
  style?: number;          // 0-1
  speed?: number;          // 0.7-1.2
  speakerBoost?: boolean;
}

export interface BuildAssistantParams extends VoiceSettings {
  aiBrief: string;
  aiVoice: string;
  aiTemperature: number;
  maxDuration: number;
  callId: string;
  contactFirstName?: string | null;
  contactCity?: string | null;
  contactSegment?: string | null;
  /** Numéro de transfert vers un agent humain (CDC D4). */
  transferNumber?: string | null;
}

export function buildAssistant(params: BuildAssistantParams): Record<string, unknown> {
  const systemPrompt = buildSystemPrompt(params);
  // Priorité : voiceId explicite (voix clonée) > mapping logique > fallback Awa
  const voiceId =
    params.voiceId || VOICE_MAP[params.aiVoice] || VOICE_MAP.awa_female_ci;
  const firstName = params.contactFirstName ?? "cher client";

  // Outil de transfert vers humain (CDC D4) — uniquement si un numéro est fourni
  const tools = params.transferNumber
    ? [
        {
          type: "transferCall",
          destinations: [
            {
              type: "number",
              number: params.transferNumber,
              message: "Je vous mets en relation avec un conseiller, un instant.",
            },
          ],
        },
      ]
    : undefined;

  const assistant: Record<string, unknown> = {
    // ── LLM : intelligence conversationnelle (CDC E1) ──
    model: {
      provider: "openai",
      model: process.env.OPENAI_MODEL ?? "gpt-4o",
      temperature: params.aiTemperature,
      messages: [{ role: "system", content: systemPrompt }],
      ...(tools ? { tools } : {}),
    },

    // ── TTS : ElevenLabs Turbo (voix naturelle FR, latence < 300ms — CDC) ──
    // Provider configurable via env (Vapi accepte "11labs" ; certaines docs "elevenlabs").
    voice: {
      provider: process.env.ELEVENLABS_PROVIDER ?? "11labs",
      voiceId,
      model: params.model ?? process.env.ELEVENLABS_MODEL ?? "eleven_turbo_v2_5",
      stability: params.stability ?? 0.5,
      similarityBoost: params.similarityBoost ?? 0.75,
      style: params.style ?? 0.0,
      useSpeakerBoost: params.speakerBoost ?? true,
      speed: params.speed ?? 1.0,
      optimizeStreamingLatency: 3,
    },

    // ── STT : Deepgram Nova-2 (fr + vocabulaire local CI — CDC D6/E2) ──
    transcriber: {
      provider: "deepgram",
      model: process.env.DEEPGRAM_MODEL ?? "nova-2",
      language: "fr",
      smartFormat: true,
      keywords: CI_KEYWORDS,
    },

    firstMessage: `Bonjour ${firstName} ! `,
    maxDurationSeconds: params.maxDuration,
    silenceTimeoutSeconds: 30,
    backchannelingEnabled: true,

    // ── Analyse post-appel : résumé automatique (CDC F2) ──
    analysisPlan: {
      summaryPrompt:
        "Résume en 3 lignes maximum les points clés de cette conversation, en français.",
    },
  };

  // Webhook de retour d'événements (HMAC) — uniquement si configuré
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (appUrl) {
    assistant.server = {
      url: `${appUrl}/api/webhooks/vapi`,
      ...(webhookSecret ? { secret: webhookSecret } : {}),
    };
  }

  return assistant;
}

// ─── DÉCLENCHEMENT D'UN APPEL SORTANT ─────────────────────────────────────────

export interface OutboundCallParams extends BuildAssistantParams {
  phone: string;
  metadata?: Record<string, string>;
}

export interface OutboundCallResult {
  ok: boolean;
  vapiCallId?: string;
  error?: string;
}

/**
 * Déclenche un appel sortant via Vapi.ai (POST /call/phone).
 * Retourne { ok:false, error } plutôt que de lever, pour que l'appelant gère le retry.
 */
export async function triggerOutboundCall(params: OutboundCallParams): Promise<OutboundCallResult> {
  const apiKey = process.env.VAPI_API_KEY;
  const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;

  if (!apiKey || !phoneNumberId) {
    return { ok: false, error: "VAPI_API_KEY ou VAPI_PHONE_NUMBER_ID non configuré." };
  }

  const assistant = buildAssistant(params);

  const body = {
    phoneNumberId,
    customer: {
      number: params.phone,
      ...(params.contactFirstName ? { name: params.contactFirstName } : {}),
    },
    assistant,
    ...(params.metadata ? { metadata: params.metadata } : {}),
  };

  try {
    const response = await fetch(`${VAPI_BASE}/call/phone`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[Vapi] Erreur déclenchement appel:", response.status, errText);
      return { ok: false, error: `Vapi ${response.status}: ${errText.slice(0, 200)}` };
    }

    const data = (await response.json()) as { id?: string };
    if (!data.id) return { ok: false, error: "Réponse Vapi sans id d'appel." };

    return { ok: true, vapiCallId: data.id };
  } catch (error) {
    console.error("[Vapi] Exception déclenchement appel:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Erreur réseau Vapi." };
  }
}
