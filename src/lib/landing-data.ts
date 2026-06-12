export interface ScenarioMessage {
  who: "ia" | "client";
  text: string;
}

export interface ScenarioPoint {
  at: number;
  text: string;
}

export interface ScenarioSentiment {
  at: number;
  val: number;
  label: string;
}

export interface Scenario {
  company: string;
  contact: string;
  script: ScenarioMessage[];
  points: ScenarioPoint[];
  sentiment: ScenarioSentiment[];
  summary: string;
  action: string;
}

export interface IntegrationItem {
  label: string;
  domain: string;
}

export const SCENARIOS: Record<string, Scenario> = {
  banque: {
    company: "Banque Lagune",
    contact: "M. Koné",
    script: [
      { who: "ia", text: "Bonjour Monsieur Koné ! Je suis Awa de la Banque Lagune. J'ai besoin de 3 minutes pour votre avis sur nos services. C'est possible ?" },
      { who: "client", text: "Oui, allez-y." },
      { who: "ia", text: "Merci ! Sur une échelle de 1 à 5, comment évaluez-vous globalement nos services ?" },
      { who: "client", text: "Je mets 3… les files d'attente en agence, c'est vraiment long." },
      { who: "ia", text: "Je comprends. Avez-vous déjà essayé notre application mobile pour éviter le déplacement ?" },
      { who: "client", text: "Non, je ne savais même pas qu'il y en avait une." },
      { who: "ia", text: "Elle est très pratique pour ça, je le note. Êtes-vous intéressé par notre nouveau compte épargne rémunéré ?" },
      { who: "client", text: "Pourquoi pas, ça dépend des conditions." },
      { who: "ia", text: "Parfait, je transmets à notre équipe. Merci beaucoup Monsieur Koné, excellente journée !" }
    ],
    points: [
      { at: 4, text: "Friction détectée : files d'attente en agence" },
      { at: 6, text: "Opportunité : application mobile inconnue du client" },
      { at: 8, text: "Intention d'achat : compte épargne rémunéré" }
    ],
    sentiment: [
      { at: 0, val: 50, label: "Neutre" },
      { at: 4, val: 36, label: "Frustré" },
      { at: 6, val: 55, label: "Neutre" },
      { at: 8, val: 72, label: "Positif" }
    ],
    summary: "Client globalement satisfait (3/5) mais frustré par l'attente en agence. Ne connaissait pas l'application mobile — présentée pendant l'appel. Intérêt exprimé pour le compte épargne rémunéré.",
    action: "ACTION SUGGÉRÉE : RAPPEL COMMERCIAL SOUS 48 H"
  },
  telecom: {
    company: "Ivoire Télécom",
    contact: "Mme Diabaté",
    script: [
      { who: "ia", text: "Bonjour Madame Diabaté, je suis Awa d'Ivoire Télécom. Auriez-vous 2 minutes pour votre avis sur la qualité du réseau ?" },
      { who: "client", text: "Oui, mais faites vite, je suis au marché." },
      { who: "ia", text: "Promis ! Sur une échelle de 0 à 10, recommanderiez-vous nos services à un proche ?" },
      { who: "client", text: "Je dirais 6. La connexion coupe trop à Yopougon, surtout le soir." },
      { who: "ia", text: "Merci pour votre franchise. C'est plutôt l'internet mobile ou les appels qui coupent ?" },
      { who: "client", text: "L'internet surtout. Les appels, ça va." },
      { who: "ia", text: "C'est noté, je transmets à l'équipe réseau pour la zone de Yopougon. Merci Madame Diabaté, bon marché !" },
      { who: "client", text: "Merci, c'était rapide au moins !" }
    ],
    points: [
      { at: 4, text: "NPS : 6/10 — passif, risque de churn modéré" },
      { at: 6, text: "Problème localisé : data mobile, Yopougon, en soirée" },
      { at: 8, text: "Expérience d'enquête jugée positive par la cliente" }
    ],
    sentiment: [
      { at: 0, val: 50, label: "Neutre" },
      { at: 4, val: 34, label: "Agacée" },
      { at: 6, val: 48, label: "Neutre" },
      { at: 8, val: 70, label: "Positif" }
    ],
    summary: "NPS de 6/10. Cause principale : coupures de l'internet mobile à Yopougon en soirée — la voix n'est pas concernée. Cliente pressée mais coopérative, appel bien reçu.",
    action: "ACTION SUGGÉRÉE : ALERTE ÉQUIPE RÉSEAU — YOPOUGON"
  },
  assurance: {
    company: "Assurances Baobab",
    contact: "M. Yao",
    script: [
      { who: "ia", text: "Bonjour Monsieur Yao, je suis Awa des Assurances Baobab. Votre contrat auto arrive à échéance le 30 juin." },
      { who: "client", text: "Ah, déjà ? Le temps passe vite." },
      { who: "ia", text: "Eh oui ! Souhaitez-vous le renouveler aux mêmes conditions que cette année ?" },
      { who: "client", text: "Ça dépend… le tarif a augmenté ou pas ?" },
      { who: "ia", text: "Bonne nouvelle : le tarif reste identique, et l'assistance dépannage 24h/24 est offerte cette année." },
      { who: "client", text: "Dans ce cas, c'est bon pour moi. On renouvelle." },
      { who: "ia", text: "Parfait ! Vous recevrez la confirmation par SMS d'ici demain. Merci Monsieur Yao, très bonne journée !" },
      { who: "client", text: "Merci à vous, au revoir." }
    ],
    points: [
      { at: 4, text: "Sensibilité prix détectée avant décision" },
      { at: 6, text: "Renouvellement confirmé à l'oral" },
      { at: 7, text: "Confirmation SMS programmée automatiquement" }
    ],
    sentiment: [
      { at: 0, val: 50, label: "Neutre" },
      { at: 4, val: 45, label: "Hésitant" },
      { at: 6, val: 80, label: "Satisfait" },
      { at: 8, val: 86, label: "Très satisfait" }
    ],
    summary: "Renouvellement du contrat auto confirmé à l'oral. Client sensible au prix, rassuré par le maintien du tarif et l'assistance dépannage offerte. Confirmation SMS avant le 30 juin.",
    action: "ACTION SUGGÉRÉE : ENVOYER SMS DE CONFIRMATION + AVENANT"
  }
};

export const INTEGRATIONS_TECHS: IntegrationItem[] = [
  { label: "OpenAI", domain: "openai.com" },
  { label: "ElevenLabs", domain: "elevenlabs.io" },
  { label: "Deepgram", domain: "deepgram.com" },
  { label: "Africa's Talking", domain: "africastalking.com" },
  { label: "Twilio", domain: "twilio.com" },
  { label: "Supabase", domain: "supabase.com" },
  { label: "PostgreSQL", domain: "postgresql.org" },
  { label: "Vapi", domain: "vapi.ai" }
];

export const INTEGRATIONS_CLIENTS: IntegrationItem[] = [
  { label: "Wave", domain: "wave.com" },
  { label: "WhatsApp Business", domain: "whatsapp.com" },
  { label: "Salesforce", domain: "salesforce.com" },
  { label: "HubSpot", domain: "hubspot.com" },
  { label: "Zoho CRM", domain: "zoho.com" },
  { label: "Google Sheets", domain: "sheets.google.com" },
  { label: "Microsoft Excel", domain: "microsoft.com" },
  { label: "Slack", domain: "slack.com" }
];
