export type InferredCampaignQuestion = {
  key: string;
  label: string;
  kind: "NPS" | "SCALE_0_10" | "BOOLEAN" | "TEXT";
  position: number;
};

function cleanQuestion(value: string): string {
  return value
    .replace(/^[-*#\s]+/, "")
    .replace(/[>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+(?:Questions?\s*:|Objectif\s*:|Ton objectif\b|Reste\s+(?:chaleureuse|professionnelle|concis)|Si la personne\b|À la fin\b|A la fin\b|Après cette\b|Apres cette\b).*$/i, "")
    .trim();
}

export function isNpsQuestionLabel(label: string): boolean {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return /recommand/.test(normalized);
}

function questionKind(label: string): InferredCampaignQuestion["kind"] {
  const normalized = label.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const requestsScore = /note|evaluer|evaluation|0\s*(?:a|-)\s*10|sur\s*10/.test(normalized);
  // Une question de recommandation est un NPS : même si le brief ne précise
  // pas l'échelle, l'assistante demandera la note 0–10 avant de la stocker.
  if (isNpsQuestionLabel(label)) return "NPS";
  if (requestsScore) return "SCALE_0_10";
  if (/^(?:avez-vous|est-ce que|pensez-vous|souhaitez-vous|acceptez-vous|recommanderiez-vous)\b/.test(normalized)) return "BOOLEAN";
  return "TEXT";
}

/**
 * Extrait les questions numérotées d'un brief libre. Les campagnes Sonara sont
 * volontairement créées à partir d'un brief, donc cette normalisation permet
 * de conserver une ligne CampaignQuestion par donnée attendue sans imposer un
 * nouveau formulaire ni modifier le design existant.
 */
export function inferCampaignQuestions(aiBrief: string): InferredCampaignQuestion[] {
  const normalized = aiBrief
    .replace(/\r/g, "\n")
    .replace(/>\s*/g, "\n")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const matches = normalized.matchAll(/(?:^|\s)(\d{1,2})[.)]\s+(.+?)(?=\s+\d{1,2}[.)]\s+|$)/g);
  const questions: InferredCampaignQuestion[] = [];

  for (const match of matches) {
    const label = cleanQuestion(match[2]);
    if (!label || label.length < 5) continue;
    const position = questions.length;
    questions.push({
      key: `q${position + 1}`,
      label: label.slice(0, 500),
      kind: questionKind(label),
      position,
    });
  }

  return questions.slice(0, 20);
}
