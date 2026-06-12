/* ================================================================
   SONARA — Données de démonstration (Côte d'Ivoire) - Version Récente
   Typées en TypeScript. Prêtes pour remplacement par API réelle.
   ================================================================ */

export interface Notification {
  glyph: string;
  iconColor: string;
  iconBg: string;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface Campaign {
  id: string;
  name: string;
  sector: string;
  status: "live" | "paused" | "done" | "scheduled" | "draft";
  done: number;
  total: number;
  response: string;
  sentiment: number | null;
  date: string;
}

export interface Call {
  id: number;
  name: string;
  city: string;
  phone: string;
  time: string;
  dur: string;
  status: "completed" | "transferred" | "unreachable" | "voicemail" | "failed";
  sent: number | null;
  mood?: string;
  summary?: string;
  action?: string;
  actionKind?: "ok" | "warn" | "alert";
}

export interface TranscriptTurn {
  ai: boolean;
  time: string;
  text: string;
}

export interface LiveCall {
  name: string;
  camp: string;
  base: number;
}

export interface Contact {
  name: string;
  phone: string;
  city: string;
  segment: string;
  st: "completed" | "calling" | "pending" | "transferred" | "unreachable";
  attempts: number;
}

export interface DirectoryEntry {
  name: string;
  phone: string;
  city: string;
  segment: string;
  campCount: number;
  lastCall: string;
  optout: boolean;
}

export interface Report {
  name: string;
  meta: string;
  size: string;
  response: string;
  sentiment: string;
}

export interface TeamMember {
  name: string;
  email: string;
  role: string;
  initials: string;
  avBg: string;
  avColor: string;
  roleColor: string;
  roleBg: string;
}

export interface LiveEvent {
  time: string;
  color: string;
  text: string;
}

export const NOTIFS: Notification[] = [
  { glyph: '✓', iconColor: 'var(--sn-green)', iconBg: 'rgba(43,213,118,.11)', title: 'Campagne terminée', desc: 'Churn forfaits prépayés — 5 000 appels complétés, rapport disponible.', time: 'IL Y A 2 H', unread: true },
  { glyph: '!', iconColor: 'var(--sn-red)', iconBg: 'rgba(255,92,92,.11)', title: 'Transfert agent demandé', desc: 'Jean-Marc Kouamé souhaite parler à un conseiller — Satisfaction Q2.', time: '09:46', unread: true },
  { glyph: '◔', iconColor: 'var(--sn-amber)', iconBg: 'rgba(255,176,46,.11)', title: 'Crédit bientôt épuisé', desc: '12 450 appels restants, soit ≈ 9 jours au rythme actuel.', time: 'HIER, 18:02', unread: true },
  { glyph: '↧', iconColor: 'var(--sn-blue2)', iconBg: 'rgba(0,82,255,.13)', title: 'Rapport hebdomadaire prêt', desc: 'Satisfaction Q2 — envoyé à direction@banquehorizon.ci.', time: 'LUN. 08:00', unread: false }
];

export const FAQ: FaqItem[] = [
  { q: "Comment l'IA se présente-t-elle au téléphone ?", a: "L'IA se présente sous un prénom configuré (ex : Awa) comme représentante de votre entreprise, conformément à la loi ivoirienne. Elle ne prétend jamais être humaine si on lui pose la question, et respecte les plages horaires légales 8h–20h." },
  { q: 'Combien coûte un appel ?', a: "Sur le plan Business, chaque appel décompté coûte 60 FCFA, quelle que soit sa durée (max 8 min). Les appels non décrochés ou tombés sur messagerie ne sont pas décomptés de votre crédit." },
  { q: 'Quel format de fichier pour importer mes contacts ?', a: "Un CSV avec les colonnes prénom, nom, téléphone (obligatoire), ville, segment. Les numéros locaux 07XXXXXXXX sont automatiquement normalisés en +225. Les doublons sont dédupliqués sur le numéro. Limite : 10 000 contacts par campagne." },
  { q: "Que se passe-t-il si un client demande à parler à un humain ?", a: "L'appel est transféré immédiatement vers le numéro d'agent que vous avez configuré, et une alerte email est envoyée à votre équipe. Le transfert apparaît dans le statut de l'appel et dans les notifications." },
  { q: 'Comment retirer un numéro de toutes les campagnes ?', a: "Marquez le contact « Opt-out » dans l'onglet Contacts : il rejoint la liste noire permanente et ne sera plus jamais appelé, même dans les campagnes futures. C'est une obligation légale (droit d'opposition, Loi 2013-450)." }
];

export const CAMPAIGNS: Campaign[] = [
  { id: 'c1', name: 'Satisfaction Service Client — Q2', sector: 'BANQUE · AGENCES', status: 'live', done: 1847, total: 3200, response: '71%', sentiment: 7.8, date: '02 juin' },
  { id: 'c2', name: 'Relance crédit conso — J+15', sector: 'RECOUVREMENT', status: 'live', done: 412, total: 980, response: '64%', sentiment: 6.1, date: '05 juin' },
  { id: 'c3', name: 'NPS post-lancement appli mobile', sector: 'DIGITAL', status: 'paused', done: 1240, total: 2500, response: '66%', sentiment: 7.2, date: '28 mai' },
  { id: 'c4', name: 'Churn forfaits prépayés', sector: 'ÉTUDES', status: 'done', done: 5000, total: 5000, response: '69%', sentiment: 7.4, date: '12 mai' },
  { id: 'c5', name: 'KYC vocal — nouveaux comptes', sector: 'CONFORMITÉ', status: 'scheduled', done: 0, total: 1500, response: '—', sentiment: null, date: '12 juin' },
  { id: 'c6', name: 'Étude marché assurance santé', sector: 'ÉTUDES', status: 'draft', done: 0, total: 0, response: '—', sentiment: null, date: '—' }
];

export const STATUS = {
  live: { label: 'En cours', color: 'var(--sn-green)', bg: 'rgba(43,213,118,.11)' },
  paused: { label: 'En pause', color: 'var(--sn-amber)', bg: 'rgba(255,176,46,.11)' },
  done: { label: 'Terminée', color: 'var(--sn-w6)', bg: 'var(--sn-w08)' },
  scheduled: { label: 'Planifiée', color: 'var(--sn-blue2)', bg: 'rgba(0,82,255,.14)' },
  draft: { label: 'Brouillon', color: 'var(--sn-w5)', bg: 'var(--sn-w06)' }
} as const;

export const CALL_STATUS = {
  completed: { label: 'Terminé', color: 'var(--sn-green)', bg: 'rgba(43,213,118,.11)' },
  transferred: { label: 'Transféré', color: 'var(--sn-blue2)', bg: 'rgba(0,82,255,.14)' },
  unreachable: { label: 'Non joignable', color: 'var(--sn-w55)', bg: 'var(--sn-w07)' },
  voicemail: { label: 'Messagerie', color: 'var(--sn-amber)', bg: 'rgba(255,176,46,.11)' },
  failed: { label: 'Échec', color: 'var(--sn-red)', bg: 'rgba(255,92,92,.11)' }
} as const;

export const CALLS: Call[] = [
  { id: 1, name: 'Aya Traoré', city: 'Cocody, Abidjan', phone: '+225 07 08 23 45 67', time: '09:42', dur: '3:24', status: 'completed', sent: 8.2, mood: 'SATISFAITE',
    summary: "Cliente globalement satisfaite (8/10) de l'accueil en agence Cocody. Point de friction majeur : 45 min d'attente pour un retrait de chéquier. Recommanderait malgré tout l'agence à un proche.",
    action: 'Alerte délais — agence Cocody', actionKind: 'warn' },
  { id: 2, name: 'Kouassi Yao', city: 'Yopougon, Abidjan', phone: '+225 05 44 18 02 90', time: '09:38', dur: '2:51', status: 'completed', sent: 7.4, mood: 'SATISFAIT',
    summary: "Client satisfait (7/10). Apprécie la rapidité au guichet de Yopougon. Souhaite davantage de GAB dans sa zone. Aucune réclamation en cours.",
    action: 'Rien à faire', actionKind: 'ok' },
  { id: 3, name: 'Mariam Diabaté', city: 'Bouaké', phone: '+225 07 59 31 76 14', time: '09:35', dur: '—', status: 'unreachable', sent: null },
  { id: 4, name: 'Jean-Marc Kouamé', city: 'Plateau, Abidjan', phone: '+225 01 02 67 88 41', time: '09:31', dur: '4:02', status: 'transferred', sent: 5.1, mood: 'FRUSTRÉ',
    summary: "Client mécontent d'un prélèvement non reconnu sur son compte courant. A demandé à parler à un conseiller humain — transfert effectué à 02:58. Dossier transmis au SAV.",
    action: 'Alerte SAV — prélèvement contesté', actionKind: 'alert' },
  { id: 5, name: 'Fatou Bamba', city: 'Marcory, Abidjan', phone: '+225 07 77 90 12 38', time: '09:27', dur: '2:12', status: 'completed', sent: 9.0, mood: 'ENTHOUSIASTE',
    summary: "Cliente très satisfaite (9/10). Accueil jugé chaleureux à Marcory. Intention d'ouvrir un compte épargne détectée pendant l'appel — opportunité commerciale à saisir.",
    action: 'Rappel commercial — épargne', actionKind: 'ok' },
  { id: 6, name: 'Ibrahim Cissé', city: 'Daloa', phone: '+225 05 81 45 29 03', time: '09:24', dur: '0:00', status: 'voicemail', sent: null },
  { id: 7, name: "Adjoua N'Guessan", city: 'Abobo, Abidjan', phone: '+225 07 12 84 56 70', time: '09:19', dur: '3:45', status: 'completed', sent: 6.8, mood: 'NEUTRE',
    summary: "Cliente neutre (6.8/10). Attente jugée longue à l'agence d'Abobo, surtout en fin de mois. Suggère un renfort de personnel aux périodes de paie. Reste fidèle à la banque.",
    action: 'Surveiller délais — Abobo', actionKind: 'warn' },
  { id: 8, name: 'Seydou Ouattara', city: 'Korhogo', phone: '+225 01 66 73 20 55', time: '09:14', dur: '—', status: 'failed', sent: null }
];

export const TRANSCRIPT_FULL: TranscriptTurn[] = [
  { ai: true, time: '00:02', text: 'Bonjour, est-ce que je parle bien à Madame Aya Traoré ?' },
  { ai: false, time: '00:06', text: "Oui c'est moi, c'est à quel sujet ?" },
  { ai: true, time: '00:09', text: "Bonjour Madame Traoré, je suis Awa, j'appelle de la part de Banque Horizon. Nous faisons un petit sondage sur la qualité du service en agence. Ça prendra trois minutes, pas plus. Vous avez un moment ?" },
  { ai: false, time: '00:21', text: "Ah d'accord… oui ça va, on peut faire." },
  { ai: true, time: '00:24', text: "Merci ! Vous êtes passée à l'agence de Cocody récemment. Sur une note de 0 à 10, comment évaluez-vous l'accueil ?" },
  { ai: false, time: '00:35', text: 'Je vais dire 8. Les gens sont gentils mais il y a trop l’attente même.' },
  { ai: true, time: '00:41', text: "Je comprends, l'attente c'est important. Vous avez patienté combien de temps environ ?" },
  { ai: false, time: '00:48', text: 'Presque 45 minutes ! Pour un simple retrait de chéquier hein.' },
  { ai: true, time: '00:54', text: "Merci pour votre franchise, c'est bien noté. Dernière question : est-ce que vous recommanderiez l'agence à un proche ?" },
  { ai: false, time: '01:03', text: "Oui quand même, malgré l'attente là, je recommande." }
];

export const LIVE: LiveCall[] = [
  { name: 'Mariam Diabaté', camp: 'Satisfaction Q2 · Bouaké', base: 62 },
  { name: 'Seydou Ouattara', camp: 'Relance crédit · Korhogo', base: 147 },
  { name: 'Affoué Koffi', camp: 'Satisfaction Q2 · San-Pédro', base: 201 },
  { name: 'Moussa Sanogo', camp: 'Relance crédit · Abidjan', base: 23 }
];

export const CONTACTS: Contact[] = [
  { name: 'Aya Traoré', phone: '+225 07 08 23 45 67', city: 'Abidjan', segment: 'Particulier', st: 'completed', attempts: 1 },
  { name: 'Kouassi Yao', phone: '+225 05 44 18 02 90', city: 'Abidjan', segment: 'Particulier', st: 'completed', attempts: 1 },
  { name: 'Mariam Diabaté', phone: '+225 07 59 31 76 14', city: 'Bouaké', segment: 'PME', st: 'calling', attempts: 2 },
  { name: 'Jean-Marc Kouamé', phone: '+225 01 02 67 88 41', city: 'Abidjan', segment: 'Premium', st: 'transferred', attempts: 1 },
  { name: 'Fatou Bamba', phone: '+225 07 77 90 12 38', city: 'Abidjan', segment: 'Particulier', st: 'completed', attempts: 1 },
  { name: 'Ibrahim Cissé', phone: '+225 05 81 45 29 03', city: 'Daloa', segment: 'PME', st: 'pending', attempts: 1 },
  { name: "Adjoua N'Guessan", phone: '+225 07 12 84 56 70', city: 'Abidjan', segment: 'Particulier', st: 'completed', attempts: 2 },
  { name: 'Seydou Ouattara', phone: '+225 01 66 73 20 55', city: 'Korhogo', segment: 'Particulier', st: 'unreachable', attempts: 2 }
];

export const DIRECTORY: DirectoryEntry[] = [
  { name: 'Aya Traoré', phone: '+225 07 08 23 45 67', city: 'Abidjan', segment: 'Particulier', campCount: 3, lastCall: '10 juin', optout: false },
  { name: 'Kouassi Yao', phone: '+225 05 44 18 02 90', city: 'Abidjan', segment: 'Particulier', campCount: 2, lastCall: '10 juin', optout: false },
  { name: 'Mariam Diabaté', phone: '+225 07 59 31 76 14', city: 'Bouaké', segment: 'PME', campCount: 4, lastCall: '10 juin', optout: false },
  { name: 'Jean-Marc Kouamé', phone: '+225 01 02 67 88 41', city: 'Abidjan', segment: 'Premium', campCount: 5, lastCall: '10 juin', optout: false },
  { name: 'Fatou Bamba', phone: '+225 07 77 90 12 38', city: 'Abidjan', segment: 'Particulier', campCount: 1, lastCall: '10 juin', optout: false },
  { name: 'Ibrahim Cissé', phone: '+225 05 81 45 29 03', city: 'Daloa', segment: 'PME', campCount: 2, lastCall: '10 juin', optout: false },
  { name: 'Brigitte Ehouman', phone: '+225 07 33 51 09 86', city: 'San-Pédro', segment: 'Particulier', campCount: 1, lastCall: '04 juin', optout: true },
  { name: "Adjoua N'Guessan", phone: '+225 07 12 84 56 70', city: 'Abidjan', segment: 'Particulier', campCount: 3, lastCall: '10 juin', optout: false },
  { name: 'Moussa Sanogo', phone: '+225 01 90 27 64 18', city: 'Yamoussoukro', segment: 'PME', campCount: 2, lastCall: '09 juin', optout: false },
  { name: "N'Dri Kablan", phone: '+225 05 23 78 90 44', city: 'Korhogo', segment: 'Particulier', campCount: 1, lastCall: '28 mai', optout: true }
];

export const REPORTS: Report[] = [
  { name: 'Churn forfaits prépayés', meta: 'TERMINÉE 12 MAI · 5 000 APPELS', size: 'PDF · 2,4 Mo', response: '69%', sentiment: '7.4' },
  { name: 'Satisfaction Service Client — Q1', meta: 'TERMINÉE 28 AVR · 3 100 APPELS', size: 'PDF · 1,9 Mo', response: '73%', sentiment: '7.9' },
  { name: 'Étude tarifs mobile money', meta: 'TERMINÉE 30 MARS · 2 400 APPELS', size: 'PDF · 1,6 Mo', response: '61%', sentiment: '6.8' },
  { name: 'Relance impayés — T1', meta: 'TERMINÉE 15 MARS · 1 800 APPELS', size: 'PDF · 1,2 Mo', response: '58%', sentiment: '5.9' }
];

export const TEAM: TeamMember[] = [
  { name: 'Aminata Koné', email: 'a.kone@banquehorizon.ci', role: 'Admin', initials: 'AK', avBg: 'linear-gradient(135deg, #0052FF, #00D4A6)', avColor: '#fff', roleColor: 'var(--sn-blue2)', roleBg: 'rgba(0,82,255,.14)' },
  { name: 'Didier Assamoi', email: 'd.assamoi@banquehorizon.ci', role: 'Manager', initials: 'DA', avBg: 'rgba(0,82,255,.15)', avColor: 'var(--sn-blue3)', roleColor: 'var(--sn-green)', roleBg: 'rgba(43,213,118,.11)' },
  { name: 'Solange Bly', email: 's.bly@banquehorizon.ci', role: 'Viewer', initials: 'SB', avBg: 'var(--sn-w08)', avColor: 'var(--sn-w75)', roleColor: 'var(--sn-w6)', roleBg: 'var(--sn-w08)' }
];

export const LIVE_EVENTS: LiveEvent[] = [
  { time: '09:47:12', color: 'var(--sn-green)', text: 'Appel connecté — +225 07 •• •• 45 67 · Satisfaction Q2' },
  { time: '09:47:04', color: 'var(--sn-blue2)', text: 'Résumé généré — Kouassi Yao · sentiment 7.4/10' },
  { time: '09:46:51', color: 'var(--sn-amber)', text: 'Messagerie détectée — raccrochage auto · retry planifié 13:46' },
  { time: '09:46:38', color: 'var(--sn-green)', text: 'Enquête complétée — Fatou Bamba · durée 2:12' },
  { time: '09:46:20', color: 'var(--sn-red)', text: 'Transfert agent humain demandé — Jean-Marc Kouamé · alerte email envoyée' },
  { time: '09:45:58', color: 'var(--sn-blue2)', text: 'Webhook sortant livré — crm.banquehorizon.ci · 200 OK' },
  { time: '09:45:31', color: 'var(--sn-green)', text: 'Appel connecté — +225 01 •• •• 20 55 · Relance crédit conso' }
];

export const CONTACT_STATUS = {
  completed: { label: 'Complété', color: 'var(--sn-green)', bg: 'rgba(43,213,118,.11)' },
  calling: { label: 'En appel', color: 'var(--sn-blue2)', bg: 'rgba(0,82,255,.14)' },
  pending: { label: 'En attente', color: 'var(--sn-w55)', bg: 'var(--sn-w07)' },
  transferred: { label: 'Transféré', color: 'var(--sn-amber)', bg: 'rgba(255,176,46,.11)' },
  unreachable: { label: 'Non joignable', color: 'var(--sn-red)', bg: 'rgba(255,92,92,.11)' }
} as const;
