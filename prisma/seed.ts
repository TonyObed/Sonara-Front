// Seed de données de développement — Sonara
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Seed via le Session pooler (DIRECT_URL) — meilleure compat pour les écritures en masse
const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL!,
});
const db = new PrismaClient({ adapter });

async function main() {
  if (process.env.NODE_ENV !== "development" || process.env.ALLOW_DESTRUCTIVE_SEED !== "true") {
    throw new Error(
      "Seed refusé : exécutez uniquement en développement avec ALLOW_DESTRUCTIVE_SEED=true."
    );
  }

  const demoPassword = process.env.DEMO_SEED_PASSWORD;
  if (!demoPassword || demoPassword.length < 12) {
    throw new Error("DEMO_SEED_PASSWORD (12 caractères minimum) est requis pour le seed.");
  }

  console.log("🌱 Seeding Sonara database...");

  // Nettoyer les données existantes
  await db.callEvent.deleteMany();
  await db.call.deleteMany();
  await db.contact.deleteMany();
  await db.campaign.deleteMany();
  await db.refreshToken.deleteMany();
  await db.user.deleteMany();
  await db.blacklist.deleteMany();
  await db.company.deleteMany();

  // ─── ENTREPRISE DE DEMO ────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash(demoPassword, 12);

  const company = await db.company.create({
    data: {
      name: "Banque XYZ Côte d'Ivoire",
      email: "admin@banquexyz.ci",
      passwordHash,
      plan: "BUSINESS",
      apiCredit: 5000,
    },
  });

  // ─── ADMIN ────────────────────────────────────────────────────────────────
  await db.user.create({
    data: {
      companyId: company.id,
      email: "admin@banquexyz.ci",
      passwordHash,
      firstName: "Koffi",
      lastName: "Kouassi",
      role: "ADMIN",
      isActive: true,
      lastLoginAt: new Date(),
    },
  });

  // ─── MANAGER ──────────────────────────────────────────────────────────────
  await db.user.create({
    data: {
      companyId: company.id,
      email: "manager@banquexyz.ci",
      passwordHash,
      firstName: "Aminata",
      lastName: "Traoré",
      role: "MANAGER",
      isActive: true,
    },
  });

  // ─── BLACKLIST ────────────────────────────────────────────────────────────
  await db.blacklist.create({
    data: {
      companyId: company.id,
      phone: "+22507000000001",
      reason: "Demande d'opt-out du client",
    },
  });

  // ─── CAMPAGNE 1 (EN COURS) ────────────────────────────────────────────────
  const campaign1 = await db.campaign.create({
    data: {
      companyId: company.id,
      name: "Satisfaction Client Retail — Juin 2026",
      sector: "banque",
      aiBrief: `Tu es Awa, conseillère virtuelle pour la Banque XYZ. Tu appelles des clients pour une enquête de satisfaction rapide (2-3 minutes max).

Objectif : Mesurer la satisfaction des clients sur l'accueil en agence et les services digitaux.

Questions à poser :
1. Sur une échelle de 1 à 5, comment évaluez-vous globalement nos services ?
2. Avez-vous rencontré des difficultés lors de votre dernière visite en agence ?
3. Utilisez-vous notre application mobile pour vos transactions ?

Ton : chaleureux, naturel, ivoirien. Utilise "ô" et "yako" naturellement. Sois à l'écoute et reformule si la réponse est vague.`,
      aiVoice: "awa_female_ci",
      aiTemperature: 0.5,
      status: "RUNNING",
      maxRetries: 2,
      timeStart: "08:00",
      timeEnd: "19:00",
      maxDuration: 480,
      concurrency: 10,
      startedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Contacts campagne 1
  const contacts1 = [
    { phone: "+22507489210032", firstName: "Koné", lastName: "Mamadou", city: "Abidjan", segment: "premium" },
    { phone: "+22505128843090", firstName: "Awa", lastName: "Diop", city: "Abidjan", segment: "standard" },
    { phone: "+22501034422011", firstName: "Koffi", lastName: "N'Guessan", city: "Bouaké", segment: "standard" },
    { phone: "+22507993322011", firstName: "Marie-Claire", lastName: "Yao", city: "Abidjan", segment: "premium" },
    { phone: "+22501223344556", firstName: "Ibrahim", lastName: "Coulibaly", city: "Yamoussoukro", segment: "standard" },
    { phone: "+22507112233445", firstName: "Fatoumata", lastName: "Bamba", city: "Abidjan", segment: "premium" },
    { phone: "+22505998877665", firstName: "Jean-Pierre", lastName: "Akossi", city: "San-Pédro", segment: "standard" },
    { phone: "+22501887766554", firstName: "Nathalie", lastName: "Touré", city: "Abidjan", segment: "premium" },
    { phone: "+22507443322110", firstName: "Oumar", lastName: "Sanogo", city: "Korhogo", segment: "standard" },
    { phone: "+22505667788990", firstName: "Cécile", lastName: "Assi", city: "Abidjan", segment: "premium" },
  ];

  for (const c of contacts1) {
    await db.contact.create({
      data: {
        campaignId: campaign1.id,
        ...c,
        status: "COMPLETED",
        attempts: 1,
        lastCalledAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      },
    });
  }

  // ─── CAMPAGNE 2 (TERMINÉE) ────────────────────────────────────────────────
  await db.campaign.create({
    data: {
      companyId: company.id,
      name: "KYC Microcrédit Abidjan — Mai 2026",
      sector: "banque",
      aiBrief: `Tu es Awa, assistante de validation pour la Banque XYZ. Tu appelles des candidats au microcrédit pour vérifier leurs informations et expliquer les étapes suivantes.`,
      aiVoice: "awa_female_ci",
      aiTemperature: 0.3,
      status: "COMPLETED",
      maxRetries: 1,
      timeStart: "08:00",
      timeEnd: "18:00",
      maxDuration: 300,
      concurrency: 5,
      startedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      completedAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
    },
  });

  // ─── CAMPAGNE 3 (BROUILLON) ───────────────────────────────────────────────
  await db.campaign.create({
    data: {
      companyId: company.id,
      name: "NPS Application Mobile — Q3 2026",
      sector: "banque",
      aiBrief: `Tu es Awa de la Banque XYZ. Tu appelles des clients qui ont téléchargé notre application mobile pour mesurer leur satisfaction et comprendre les problèmes rencontrés.`,
      aiVoice: "koffi_male_ci",
      aiTemperature: 0.5,
      status: "DRAFT",
      maxRetries: 2,
      timeStart: "09:00",
      timeEnd: "18:00",
      maxDuration: 360,
      concurrency: 15,
    },
  });

  // ─── APPELS SIMULÉS pour la campagne 1 ────────────────────────────────────
  const completedContacts = await db.contact.findMany({
    where: { campaignId: campaign1.id, status: "COMPLETED" },
    take: 4,
  });

  const sampleTranscripts = [
    [
      { speaker: "IA (Awa)", text: "Bonjour Monsieur Koné ! Je suis Awa de la Banque XYZ. Yako pour l'attente l'autre jour ô. J'ai besoin de 2 petites minutes pour avoir votre avis sur nos services, c'est possible ?", timestamp: "0:00" },
      { speaker: "Client", text: "Oui bonjour Awa, y a pas de soucis, tu peux y aller, je t'écoute.", timestamp: "0:08" },
      { speaker: "IA (Awa)", text: "Super, merci ! Globalement, sur une échelle de 1 à 5, comment vous évaluez l'accueil physique dans notre agence d'Angré ?", timestamp: "0:13" },
      { speaker: "Client", text: "Franchement, je mets 3... Les rangs là-bas c'est trop décourageant, on perd tout notre temps.", timestamp: "0:19" },
      { speaker: "IA (Awa)", text: "Ah, Yako pour ça ô ! L'attente dans les rangs à Angré, je comprends tout à fait. Mais dites-moi, pour éviter les rangs, est-ce que vous avez déjà testé notre application mobile ?", timestamp: "0:26" },
      { speaker: "Client", text: "Ah bon ? Non, je ne savais pas du tout que c'était possible de faire ça depuis la maison.", timestamp: "0:35" },
      { speaker: "IA (Awa)", text: "Djaah, mais c'est très simple ô ! Je viens de vous envoyer le lien de téléchargement direct par SMS. Merci infiniment pour votre temps !", timestamp: "0:42" },
    ],
    [
      { speaker: "IA (Awa)", text: "Bonjour Madame Diop, je suis Awa de votre service client Banque XYZ. Je vous contacte pour savoir si vous recommanderiez nos services.", timestamp: "0:00" },
      { speaker: "Client", text: "Franchement non, pas du tout ! Les files d'attente sont trop longues.", timestamp: "0:07" },
      { speaker: "IA (Awa)", text: "Je suis sincèrement désolée pour ce désagrément, Madame Diop. Depuis combien de temps êtes-vous cliente chez nous ?", timestamp: "0:15" },
      { speaker: "Client", text: "Depuis 5 ans. Avant c'était mieux, mais là...", timestamp: "0:22" },
      { speaker: "IA (Awa)", text: "Je note immédiatement votre retour pour notre équipe. Souhaitez-vous qu'un conseiller vous rappelle pour vous présenter nos solutions digitales ?", timestamp: "0:30" },
      { speaker: "Client", text: "Oui, pourquoi pas.", timestamp: "0:38" },
    ],
  ];

  const summaries = [
    "Client insatisfait de l'attente en agence (note 3/5). Ne connaissait pas l'application mobile. Lien SMS de téléchargement envoyé automatiquement. Client potentiellement intéressé par les comptes épargne.",
    "Cliente fidèle depuis 5 ans, mais frustrée par les files d'attente. Ouverte à une prise de contact par un conseiller pour découvrir les services digitaux. Action recommandée : rappel commercial.",
  ];

  for (let i = 0; i < Math.min(completedContacts.length, 2); i++) {
    await db.call.create({
      data: {
        contactId: completedContacts[i].id,
        campaignId: campaign1.id,
        status: "COMPLETED",
        durationSec: 85 + Math.floor(Math.random() * 120),
        startedAt: new Date(Date.now() - (i + 1) * 3 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - (i + 1) * 3 * 60 * 60 * 1000 + 90000),
        transcript: sampleTranscripts[i],
        summary: summaries[i],
        attemptNumber: 1,
        costFcfa: 65 + Math.random() * 30,
      },
    });
  }

  // Appel en échec
  if (completedContacts[2]) {
    await db.call.create({
      data: {
        contactId: completedContacts[2].id,
        campaignId: campaign1.id,
        status: "NO_ANSWER",
        durationSec: 20,
        startedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        endedAt: new Date(Date.now() - 4 * 60 * 60 * 1000 + 20000),
        transcript: [],
        attemptNumber: 1,
        costFcfa: 8,
      },
    });
  }

  console.log("✅ Seed terminé !");
  console.log("─".repeat(50));
  console.log("📧 Email     : admin@banquexyz.ci");
  console.log("🔑 Mot de passe : défini dans DEMO_SEED_PASSWORD");
  console.log("🏢 Entreprise: Banque XYZ Côte d'Ivoire");
  console.log("─".repeat(50));
}

main()
  .catch((e) => {
    console.error("❌ Erreur seed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
