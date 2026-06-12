/* ============================================================
   SONARA — Données de démonstration (Côte d'Ivoire)
   Données réalistes : secteurs CI, FCFA, français ivoirien.
   ============================================================ */
window.SONARA = (function () {

  const company = { name: "Banque Atlantique CI", short: "BA", user: "Awa Koffi", role: "Resp. Relation Client" };

  // KPIs — page d'accueil (module G1)
  const kpis = [
    { id: "calls", label: "Appels aujourd'hui", value: "1 284", icon: "phone", tone: "accent",
      delta: 12.4, dir: "up", foot: "vs hier · 1 142" },
    { id: "rate", label: "Taux de réponse moyen", value: "67", suffix: "%", icon: "activity", tone: "ok",
      delta: 3.1, dir: "up", foot: "sur 7 jours" },
    { id: "active", label: "Campagnes actives", value: "5", icon: "layers", tone: "violet",
      delta: 0, dir: "flat", foot: "2 en file d'attente" },
    { id: "credit", label: "Crédit d'appels restant", value: "6 410", icon: "wallet", tone: "warn",
      delta: 18, dir: "down", foot: "Plan Business · 10 000/mois" },
  ];

  // Appels en direct (live monitoring)
  const liveCalls = [
    { id: "AP-90412", name: "Kouadio Yao", phone: "+225 07 48 ** 12", campaign: "Satisfaction agence Q2", agent: "Awa", sentiment: "pos", dur: 86, state: "live" },
    { id: "AP-90411", name: "Mariam Touré", phone: "+225 05 06 ** 77", campaign: "Relance crédit conso", agent: "Awa", sentiment: "neu", dur: 142, state: "live" },
    { id: "AP-90410", name: "Ibrahim Bamba", phone: "+225 01 22 ** 39", campaign: "NPS mobile banking", agent: "Koffi", sentiment: "pos", dur: 53, state: "live" },
    { id: "AP-90409", name: "Aya N'Guessan", phone: "+225 07 77 ** 04", campaign: "Satisfaction agence Q2", agent: "Awa", sentiment: "neg", dur: 211, state: "transfer" },
    { id: "AP-90408", name: "Seydou Coulibaly", phone: "+225 05 41 ** 88", campaign: "NPS mobile banking", agent: "Koffi", sentiment: "neu", dur: 24, state: "live" },
  ];

  // Activité par heure (appels aboutis / manqués)
  const activity = [
    { x: "08h", a: 62, m: 28 }, { x: "09h", a: 110, m: 44 }, { x: "10h", a: 148, m: 52 },
    { x: "11h", a: 134, m: 49 }, { x: "12h", a: 78, m: 36 }, { x: "13h", a: 54, m: 30 },
    { x: "14h", a: 142, m: 58 }, { x: "15h", a: 168, m: 61 }, { x: "16h", a: 156, m: 55 },
    { x: "17h", a: 124, m: 47 }, { x: "18h", a: 88, m: 39 },
  ];

  // Sentiment global
  const sentiment = [
    { k: "Positif", v: 58, c: "var(--ok)" },
    { k: "Neutre", v: 29, c: "var(--info)" },
    { k: "Négatif", v: 13, c: "var(--danger)" },
  ];

  // Campagnes (module G2)
  const campaigns = [
    { id: "C-2041", name: "Satisfaction agence Q2", sector: "Banque", client: "Réseau agences", color: "#2dd4bf",
      status: "running", done: 3120, total: 5000, rate: 71, sentiment: 4.1, updated: "il y a 4 min", created: "12 mai 2026" },
    { id: "C-2038", name: "NPS mobile banking", sector: "Banque", client: "App Atlantik", color: "#7c5cff",
      status: "running", done: 1840, total: 4000, rate: 64, sentiment: 4.4, updated: "il y a 12 min", created: "08 mai 2026" },
    { id: "C-2035", name: "Relance crédit conso", sector: "Recouvrement", client: "Impayés < 30j", color: "#f59e0b",
      status: "running", done: 920, total: 2500, rate: 58, sentiment: 3.2, updated: "il y a 26 min", created: "02 mai 2026" },
    { id: "C-2030", name: "Renouvellement assurance auto", sector: "Assurance", client: "NSIA partenariat", color: "#38bdf8",
      status: "paused", done: 640, total: 1800, rate: 62, sentiment: 3.9, updated: "hier", created: "28 avr. 2026" },
    { id: "C-2026", name: "Enquête ouverture compte", sector: "Acquisition", client: "Prospects 18-35", color: "#34d399",
      status: "running", done: 410, total: 1200, rate: 49, sentiment: 3.7, updated: "il y a 1 h", created: "24 avr. 2026" },
    { id: "C-2018", name: "KYC vocal — mise à jour", sector: "Conformité", client: "Comptes inactifs", color: "#f472b6",
      status: "scheduled", done: 0, total: 3200, rate: 0, sentiment: 0, updated: "démarre demain 08h", created: "20 avr. 2026" },
    { id: "C-2009", name: "Satisfaction agence Q1", sector: "Banque", client: "Réseau agences", color: "#2dd4bf",
      status: "done", done: 4800, total: 4800, rate: 69, sentiment: 4.0, updated: "12 avr. 2026", created: "01 avr. 2026" },
    { id: "C-2001", name: "Sondage frais de tenue de compte", sector: "Étude", client: "Panel clients", color: "#a78bfa",
      status: "done", done: 2600, total: 2600, rate: 73, sentiment: 3.5, updated: "28 mars 2026", created: "18 mars 2026" },
  ];

  // Résumés d'appels récents (module F2 — résumé auto 3 lignes)
  const summaries = [
    { id: "AP-90388", name: "Kouadio Yao", campaign: "Satisfaction agence Q2", sentiment: "pos", dur: 174, when: "il y a 6 min",
      text: "Client globalement satisfait (note 4/5). Apprécie l'accueil en agence mais déplore les files d'attente le vendredi. Intéressé par l'app mobile, à recontacter pour une démo." },
    { id: "AP-90385", name: "Fatou Diabaté", campaign: "Relance crédit conso", sentiment: "neg", dur: 233, when: "il y a 14 min",
      text: "Retard de paiement confirmé, difficultés de trésorerie. Demande un rééchelonnement sur 3 mois. Ton tendu — transfert conseiller recommandé. Promesse de rappel sous 48h." },
    { id: "AP-90377", name: "Adama Ouattara", campaign: "NPS mobile banking", sentiment: "pos", dur: 98, when: "il y a 22 min",
      text: "Promoteur (note 9/10). Utilise l'app quotidiennement pour les transferts Wave. Suggère l'ajout du paiement de factures CIE. Aucune réclamation en cours." },
    { id: "AP-90362", name: "Grace Aka", campaign: "Renouvellement assurance auto", sentiment: "neu", dur: 156, when: "il y a 38 min",
      text: "Hésite à renouveler, compare avec un concurrent. Sensible au prix de la prime. Accepte de recevoir une offre fidélité par SMS. Échéance le 30 juin." },
  ];

  // Transcription d'exemple (module G4) — basée sur l'exemple du document maître
  const transcript = {
    callId: "AP-90388", name: "Kouadio Yao", phone: "+225 07 48 ** 12",
    campaign: "Satisfaction agence Q2", agent: "Awa", dur: 174, sentiment: "pos", rate: "4 / 5",
    date: "7 juin 2026 · 14h32", recovered: null,
    summary: "Client globalement satisfait (note 4/5). Apprécie l'accueil en agence mais déplore les files d'attente le vendredi. Intéressé par l'app mobile, à recontacter pour une démo.",
    turns: [
      { who: "ai", name: "Awa (IA Sonara)", t: "Bonjour Monsieur Kouadio ! Je suis Awa, de la Banque Atlantique. J'ai besoin de 3 minutes pour recueillir votre avis sur nos services. C'est possible pour vous ?", at: "00:00" },
      { who: "client", name: "Kouadio Yao", t: "Oui oui, allez-y, je vous écoute.", at: "00:07" },
      { who: "ai", name: "Awa (IA Sonara)", t: "Merci beaucoup ! Sur une échelle de 1 à 5, comment évaluez-vous globalement nos services ?", at: "00:12" },
      { who: "client", name: "Kouadio Yao", t: "Je vais dire 3... non, 4. C'est correct hein. Mais les files d'attente en agence le vendredi là, c'est vraiment trop long dèh.", at: "00:21" },
      { who: "ai", name: "Awa (IA Sonara)", t: "Je comprends tout à fait, le vendredi c'est chargé. Est-ce que vous avez déjà essayé notre application mobile pour éviter le déplacement ?", at: "00:34" },
      { who: "client", name: "Kouadio Yao", t: "Non, je savais même pas qu'il y avait une application.", at: "00:45" },
      { who: "ai", name: "Awa (IA Sonara)", t: "Elle est vraiment pratique pour ça ! Vous pouvez consulter votre solde et faire vos virements sans passer en agence. Je note votre intérêt, un conseiller pourra vous faire une démo.", at: "00:52" },
      { who: "client", name: "Kouadio Yao", t: "Ah d'accord, ça m'arrange ça. Vous pouvez m'envoyer le lien ?", at: "01:08" },
      { who: "ai", name: "Awa (IA Sonara)", t: "Bien sûr, je vous l'envoie par SMS juste après notre appel. Une dernière chose : êtes-vous intéressé par notre nouveau compte épargne rémunéré ?", at: "01:16" },
      { who: "client", name: "Kouadio Yao", t: "Pourquoi pas, ça dépend des conditions. On verra.", at: "01:31" },
      { who: "ai", name: "Awa (IA Sonara)", t: "Parfait, je transmets votre intérêt à l'équipe. Merci beaucoup pour votre temps Monsieur Kouadio, très bonne journée à vous !", at: "01:39" },
    ],
  };

  // Notifications (module G5)
  const notifications = [
    { id: 1, type: "done", title: "Campagne terminée", text: "« Satisfaction agence Q1 » — 4 800 appels traités.", when: "il y a 2 h" },
    { id: 2, type: "transfer", title: "Transfert demandé", text: "Aya N'Guessan a demandé un conseiller (Satisfaction agence Q2).", when: "il y a 8 min" },
    { id: 3, type: "warn", title: "Crédit bientôt épuisé", text: "Il reste 6 410 appels sur votre forfait mensuel.", when: "il y a 1 h" },
  ];

  const sectorColor = {
    Banque: "#2dd4bf", Recouvrement: "#f59e0b", Assurance: "#38bdf8",
    Acquisition: "#34d399", Conformité: "#f472b6", Étude: "#a78bfa",
  };

  return { company, kpis, liveCalls, activity, sentiment, campaigns, summaries, transcript, notifications, sectorColor };
})();
