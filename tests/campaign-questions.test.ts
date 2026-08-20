import { describe, expect, it } from "vitest";
import { inferCampaignQuestions } from "@/lib/campaign-questions";

describe("inferCampaignQuestions", () => {
  it("transforme un questionnaire Markdown en variables persistables", () => {
    const questions = inferCampaignQuestions(`
      Questions à couvrir :
      > 1. Globalement, comment évalueriez-vous votre expérience sur 10 ?
      > 2. Avez-vous rencontré une difficulté ?
      > 3. Quelle amélioration aimeriez-vous voir ?
      > 4. Recommanderiez-vous Sonara à un proche ?
      > 5. Sur une note de 0 à 10, recommanderiez-vous Sonara à un proche ?
    `);

    expect(questions).toEqual([
      expect.objectContaining({ key: "q1", kind: "SCALE_0_10", position: 0 }),
      expect.objectContaining({ key: "q2", kind: "BOOLEAN", position: 1 }),
      expect.objectContaining({ key: "q3", kind: "TEXT", position: 2 }),
      expect.objectContaining({ key: "q4", kind: "NPS", position: 3 }),
      expect.objectContaining({ key: "q5", kind: "NPS", position: 4 }),
    ]);
  });

  it("ne crée aucune donnée fictive si le brief ne contient pas de liste numérotée", () => {
    expect(inferCampaignQuestions("Menez un entretien naturel et recueillez les attentes du client.")).toEqual([]);
  });

  it("ne mélange pas les consignes finales avec la dernière question", () => {
    const questions = inferCampaignQuestions(`
      1. Comment évaluez-vous le service ?
      2. Recommanderiez-vous Sonara ? Pourquoi ?
      Ton objectif est de recueillir un retour honnête. Reste chaleureuse et concise.
    `);

    expect(questions[1].label).toBe("Recommanderiez-vous Sonara ? Pourquoi ?");
  });
});
