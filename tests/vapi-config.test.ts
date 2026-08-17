import { afterEach, describe, expect, it } from "vitest";
import { buildAssistant } from "@/lib/vapi";

const originalProvider = process.env.LLM_PROVIDER;
const originalModel = process.env.OPENROUTER_MODEL;
const originalElevenLabsModel = process.env.ELEVENLABS_MODEL;
const originalEndpointing = process.env.VAPI_ENDPOINTING_MS;
const originalWaitSeconds = process.env.VAPI_START_SPEAKING_WAIT_SECONDS;

afterEach(() => {
  process.env.LLM_PROVIDER = originalProvider;
  process.env.OPENROUTER_MODEL = originalModel;
  process.env.ELEVENLABS_MODEL = originalElevenLabsModel;
  process.env.VAPI_ENDPOINTING_MS = originalEndpointing;
  process.env.VAPI_START_SPEAKING_WAIT_SECONDS = originalWaitSeconds;
});

describe("Configuration Vapi", () => {
  it("sélectionne GPT-4o via OpenRouter quand le fournisseur est activé", () => {
    process.env.LLM_PROVIDER = "openrouter";
    process.env.OPENROUTER_MODEL = "openai/gpt-4o";

    const assistant = buildAssistant({
      aiBrief: "Mène une conversation courte.", aiVoice: "awa_female_ci",
      aiTemperature: 0.3, maxDuration: 120, callId: "call-test",
    });

    expect(assistant.model).toMatchObject({ provider: "openrouter", model: "openai/gpt-4o" });
    expect(assistant.model).toMatchObject({ maxTokens: 100 });
    expect(assistant.transcriber).toMatchObject({ endpointing: 350 });
  });

  it("utilise le profil vocal faible latence par défaut", () => {
    delete process.env.ELEVENLABS_MODEL;
    delete process.env.VAPI_ENDPOINTING_MS;
    delete process.env.VAPI_START_SPEAKING_WAIT_SECONDS;

    const assistant = buildAssistant({
      aiBrief: "Mène une conversation courte.", aiVoice: "awa_female_ci",
      aiTemperature: 0.3, maxDuration: 120, callId: "latency-test",
    });

    expect(assistant.voice).toMatchObject({ model: "eleven_flash_v2_5" });
    expect(assistant.voice).not.toHaveProperty("optimizeStreamingLatency");
    expect(assistant.transcriber).toMatchObject({ endpointing: 350 });
    expect(assistant.startSpeakingPlan).toMatchObject({
      waitSeconds: 0.1,
      transcriptionEndpointingPlan: {
        onPunctuationSeconds: 0.1,
        onNoPunctuationSeconds: 0.9,
        onNumberSeconds: 0.35,
      },
    });
  });

  it("présente le bon prénom pour chacune des deux voix Sonara", () => {
    const ingrid = buildAssistant({
      aiBrief: "Mène une conversation courte.", aiVoice: "awa_female_ci",
      aiTemperature: 0.3, maxDuration: 120, callId: "ingrid-test",
    });
    const loic = buildAssistant({
      aiBrief: "Mène une conversation courte.", aiVoice: "koffi_male_ci",
      aiTemperature: 0.3, maxDuration: 120, callId: "loic-test",
    });

    expect(ingrid.firstMessage).toContain("ici Ingrid");
    expect(loic.firstMessage).toContain("ici Loïc");
  });

  it("utilise le modèle géré par Vapi hors modes Gemini et OpenRouter", () => {
    process.env.LLM_PROVIDER = "vapi";
    const assistant = buildAssistant({
      aiBrief: "Mène une conversation courte.", aiVoice: "awa_female_ci",
      aiTemperature: 0.3, maxDuration: 120, callId: "vapi-test",
    });

    expect(assistant.model).toMatchObject({ provider: "openai", model: "gpt-4o" });
  });

  it("demande une analyse structurée alignée sur les questions de la campagne", () => {
    const assistant = buildAssistant({
      aiBrief: "Pose les questions une par une.", aiVoice: "awa_female_ci",
      aiTemperature: 0.3, maxDuration: 120, callId: "analysis-test",
      questions: [
        { key: "q1", label: "Quelle note sur 10 ?", kind: "SCALE_0_10" },
        { key: "q2", label: "Pourquoi ?", kind: "TEXT" },
      ],
    });

    expect(assistant.analysisPlan).toMatchObject({
      structuredDataSchema: {
        type: "object",
        required: ["sentimentScore", "topics"],
        properties: {
          q1: { type: "number", minimum: 0, maximum: 10 },
          q2: { type: "string" },
        },
      },
    });
  });
});
