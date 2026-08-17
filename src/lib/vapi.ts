// ─────────────────────────────────────────────────────────────────────────────
// Module d'intégration Vapi.ai — Sonara (orchestration voix Phase 1)
//
// Pipeline temps réel : Deepgram (STT) → OpenAI (LLM) → ElevenLabs (TTS)
// Vapi intègre nativement ElevenLabs & Deepgram : on référence les providers
// dans la config de l'assistant, Vapi gère les clés provider sous-jacentes.
// ─────────────────────────────────────────────────────────────────────────────

const VAPI_BASE = "https://api.vapi.ai";

// Map voix logique (stockée en BDD) → voiceId ElevenLabs (configurable via env).
// Les identifiants logiques historiques restent en base pour ne pas casser les
// campagnes existantes, mais pointent désormais vers Ingrid et Loïc.
export const VOICE_MAP: Record<string, string> = {
  awa_female_ci: process.env.ELEVENLABS_VOICE_INGRID ?? "FFXYdAYPzn8Tw8KiHZqg", // Ingrid
  koffi_male_ci: process.env.ELEVENLABS_VOICE_LOIC ?? "ojsdYNTmnPdf7yAl8rI5", // Loïc
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
2. Vouvoie systématiquement le client. Ne le tutoie jamais, même s'il te tutoie.
3. Au début de l'appel, adresse-toi au client par « Monsieur ${params.contactFirstName ?? ""} » ou « Madame ${params.contactFirstName ?? ""} » si sa civilité est évidente. Si elle ne l'est pas, utilise « Bonjour ${params.contactFirstName ?? ""} » sans inventer de civilité.
4. Parle un français ivoirien naturel, chaleureux et respectueux. Tu peux utiliser des expressions locales légères, sans excès.
5. Si le client demande à parler à un humain, utilise l'outil de transfert si disponible, sinon indique que tu transmets la demande et termine poliment.
6. Ne révèle pas que tu es une IA, sauf si le client le demande explicitement.
7. Adapte-toi : réponse vague → relance ; contradiction → recoupe ; client irrité → apaise ; hors-sujet → reviens au fil.
8. Heure et fuseau : Abidjan, Côte d'Ivoire.
9. Pose une seule question à la fois. Après chaque question, attends explicitement la réponse complète du client avant de passer à la suivante.
10. Ne réponds jamais à la place du client, ne résume pas toutes les questions dans un seul message et ne conclus pas l'appel tant que le client n'a pas répondu ou demandé à terminer.
11. Si le client dit seulement « allô », « oui » ou te salue, réponds brièvement puis pose la première question et attends sa réponse.
12. Règle de tour de parole : après une question, ton prochain message est interdit tant que le client n'a pas parlé. Son silence ne vaut pas une réponse.
13. Tes réponses font 1 ou 2 phrases courtes (25 mots maximum), sauf si le client demande une explication. Ne récite jamais un script, une liste ou un questionnaire.
14. Quand le client dit clairement « au revoir », « bonne journée », « à bientôt », ou confirme qu'il n'a plus rien à ajouter : réponds une seule fois « Merci beaucoup pour votre temps. Excellente journée. », puis utilise immédiatement l'outil endCall pour raccrocher. Ne pose aucune nouvelle question et ne prolonge jamais l'échange après cette clôture.
15. Le brief décrit un objectif et une progression ; il ne t'autorise jamais à annoncer ou conclure les étapes avant les réponses du client.`;
}

// ─── CONSTRUCTION DE L'ASSISTANT VAPI ─────────────────────────────────────────

export interface VoiceSettings {
  /** voiceId ElevenLabs explicite (voix clonée). Prioritaire sur aiVoice. */
  voiceId?: string | null;
  model?: string;          // eleven_flash_v2_5, eleven_multilingual_v2, ...
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
  questions?: Array<{
    key: string;
    label: string;
    kind: string;
    choices?: unknown;
  }>;
}

function buildStructuredDataSchema(questions: BuildAssistantParams["questions"]) {
  const properties: Record<string, Record<string, unknown>> = {
    sentimentScore: {
      type: "number",
      minimum: 0,
      maximum: 10,
      description: "Sentiment ou satisfaction globale du client de 0 à 10, uniquement d'après ses propos.",
    },
    topics: {
      type: "array",
      items: { type: "string" },
      description: "Trois à cinq thèmes courts réellement abordés pendant l'appel.",
    },
  };

  for (const question of questions ?? []) {
    const choices = Array.isArray(question.choices)
      ? question.choices.filter((choice): choice is string => typeof choice === "string")
      : [];
    properties[question.key] = question.kind === "NPS" || question.kind === "SCALE_0_10"
      ? { type: "number", minimum: 0, maximum: 10, description: question.label }
      : question.kind === "BOOLEAN"
      ? { type: "boolean", description: `${question.label} Convertir seulement une réponse explicitement affirmative ou négative.` }
      : {
          type: "string",
          description: question.label,
          ...(choices.length > 0 ? { enum: choices } : {}),
        };
  }

  return {
    type: "object",
    properties,
    required: ["sentimentScore", "topics"],
  };
}

export function buildAssistant(params: BuildAssistantParams): Record<string, unknown> {
  const systemPrompt = buildSystemPrompt(params);
  // Priorité : voiceId explicite (voix clonée) > mapping logique > fallback Ingrid
  const voiceId =
    params.voiceId || VOICE_MAP[params.aiVoice] || VOICE_MAP.awa_female_ci;
  const assistantName = params.aiVoice === "koffi_male_ci" ? "Loïc" : "Ingrid";
  const firstName = params.contactFirstName ?? "cher client";

  // Outil de transfert vers humain (CDC D4) — uniquement si un numéro est fourni
  // endCall est toujours disponible : le prompt lui impose de ne l'utiliser
  // qu'après un au revoir explicite du client. Ce n'est donc pas seulement une
  // instruction textuelle : Vapi reçoit l'ordre effectif de raccrocher.
  const tools: Array<Record<string, unknown>> = [{ type: "endCall" }];
  if (params.transferNumber) {
    tools.push({
      type: "transferCall",
      destinations: [
        {
          type: "number",
          number: params.transferNumber,
          message: "Je vous mets en relation avec un conseiller, un instant.",
        },
      ],
    });
  }

  // Le fournisseur est explicitement piloté par LLM_PROVIDER. Le mode Vapi
  // (OpenAI géré par Vapi) est le défaut fiable pour les appels : une clé
  // Gemini gratuite peut atteindre son quota pendant une conversation et
  // provoquer un `pipeline-error-custom-llm-429`.
  const llmProvider = process.env.LLM_PROVIDER?.toLowerCase() ?? "vapi";
  const model = llmProvider === "openrouter"
    ? {
        provider: "openrouter",
        model: process.env.OPENROUTER_MODEL ?? "openai/gpt-4o",
        temperature: params.aiTemperature,
        // Une réponse téléphonique doit rester brève : ce plafond évite qu'un
        // modèle récite le questionnaire au lieu d'attendre le client.
        maxTokens: Number(process.env.VAPI_MAX_RESPONSE_TOKENS ?? 100),
        messages: [{ role: "system", content: systemPrompt }],
        tools,
      }
    : llmProvider === "gemini" && process.env.GEMINI_API_KEY
    ? {
        provider: "custom-llm",
        url:
          process.env.GEMINI_OPENAI_BASE_URL ??
          "https://generativelanguage.googleapis.com/v1beta/openai/",
        model: process.env.GEMINI_MODEL ?? "gemini-3.1-flash-lite",
        temperature: params.aiTemperature,
        maxTokens: Number(process.env.VAPI_MAX_RESPONSE_TOKENS ?? 100),
        messages: [{ role: "system", content: systemPrompt }],
        metadataSendMode: "off",
        tools,
      }
    : {
        provider: "openai",
        model: process.env.OPENAI_MODEL ?? "gpt-4o",
        temperature: params.aiTemperature,
        maxTokens: Number(process.env.VAPI_MAX_RESPONSE_TOKENS ?? 100),
        messages: [{ role: "system", content: systemPrompt }],
        tools,
      };

  const assistant: Record<string, unknown> = {
    // ── LLM : intelligence conversationnelle (CDC E1) ──
    model,

    // ── TTS : ElevenLabs Flash (voix naturelle FR, optimisée conversation) ──
    // Provider configurable via env (Vapi accepte "11labs" ; certaines docs "elevenlabs").
    voice: {
      provider: process.env.ELEVENLABS_PROVIDER ?? "11labs",
      voiceId,
      model: params.model ?? process.env.ELEVENLABS_MODEL ?? "eleven_flash_v2_5",
      stability: params.stability ?? 0.5,
      similarityBoost: params.similarityBoost ?? 0.75,
      style: params.style ?? 0.0,
      useSpeakerBoost: params.speakerBoost ?? true,
      speed: params.speed ?? 1.0,
    },

    // ── STT : Deepgram (fr + vocabulaire local CI — CDC D6/E2) ──
    transcriber: {
      provider: "deepgram",
      model: process.env.DEEPGRAM_MODEL ?? "nova-2",
      language: "fr",
      smartFormat: true,
      keywords: CI_KEYWORDS,
      // 350 ms laisse au client le temps de respirer sans ajouter une seconde
      // complète avant chaque réponse. Vapi impose une valeur <= 500 ms.
      endpointing: Number(process.env.VAPI_ENDPOINTING_MS ?? 350),
    },

    // Ouverture courte : le client peut répondre ou interrompre immédiatement.
    firstMessage: `Bonjour ${firstName}, ici ${assistantName}. Est-ce que vous avez une minute ?`,
    firstMessageInterruptionsEnabled: true,
    maxDurationSeconds: params.maxDuration,
    silenceTimeoutSeconds: 30,
    // Les acquiescements automatiques peuvent être perçus comme une interruption.
    backchannelingEnabled: false,

    // ── Latence : quand l'IA décide que l'utilisateur a fini de parler ──
    // Le défaut Vapi attend 1.5s sans ponctuation (réponses courtes type "oui",
    // "trois") : c'est la principale source de latence perçue. On resserre tout.
    startSpeakingPlan: {
      waitSeconds: Number(process.env.VAPI_START_SPEAKING_WAIT_SECONDS ?? 0.1),
      transcriptionEndpointingPlan: {
        // Réglage Vapi recommandé pour les langues autres que l'anglais.
        onPunctuationSeconds: Number(process.env.VAPI_PUNCTUATION_SECONDS ?? 0.1),
        onNoPunctuationSeconds: Number(process.env.VAPI_NO_PUNCTUATION_SECONDS ?? 0.9),
        onNumberSeconds: Number(process.env.VAPI_NUMBER_SECONDS ?? 0.35),
      },
    },

    // Permet au client de prendre la parole à tout instant, y compris pendant
    // une phrase de l'IA, comme dans une conversation vocale naturelle.
    stopSpeakingPlan: {
      numWords: 0,
      voiceSeconds: Number(process.env.VAPI_STOP_SPEAKING_VOICE_SECONDS ?? 0.15),
      backoffSeconds: Number(process.env.VAPI_STOP_SPEAKING_BACKOFF_SECONDS ?? 0.5),
    },

    // ── Analyse post-appel : résumé automatique (CDC F2) ──
    analysisPlan: {
      summaryPrompt:
        "Résume en 3 lignes maximum les points clés de cette conversation, en français.",
      structuredDataPrompt:
        "Analyse uniquement les réponses réellement données par le client. Extrais le sentiment, les thèmes et les réponses aux questions selon le schéma JSON. N'invente aucune réponse : si une question n'a pas reçu de réponse exploitable, omets sa propriété.",
      structuredDataSchema: buildStructuredDataSchema(params.questions),
    },
  };

  // Webhook de retour d'événements (HMAC) — uniquement si configuré
  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL;
  const webhookSecret = process.env.VAPI_WEBHOOK_SECRET;
  if (appUrl) {
    assistant.server = {
      url: `${appUrl}/api/webhooks/vapi`,
      // Demande explicitement les deux événements dont Sonara a besoin. Sans
      // cela, Vapi peut n'envoyer qu'une partie de ses événements selon la
      // configuration du compte ou du numéro de téléphone.
      timeoutSeconds: 20,
      ...(webhookSecret ? { secret: webhookSecret } : {}),
    };
    assistant.serverMessages = ["status-update", "end-of-call-report"];
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
