import { afterEach, describe, expect, it } from "vitest";
import { buildAssistant } from "@/lib/vapi";

const originalProvider = process.env.LLM_PROVIDER;
const originalModel = process.env.OPENROUTER_MODEL;

afterEach(() => {
  process.env.LLM_PROVIDER = originalProvider;
  process.env.OPENROUTER_MODEL = originalModel;
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
    expect(assistant.transcriber).toMatchObject({ endpointing: 450 });
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
});
