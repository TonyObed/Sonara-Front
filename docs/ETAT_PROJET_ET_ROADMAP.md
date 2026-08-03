# Sonara — état du projet et feuille de route

> Document de passation. Il décrit le travail réellement réalisé, l'état actuel du SaaS et l'ordre recommandé pour continuer sans créer de comportements fictifs.

## 1. Produit et architecture

Sonara est un SaaS de campagnes d'appels vocaux assistés par IA : une entreprise crée une campagne, importe des contacts, lance des appels, puis consulte les résultats, insights et rapports.

| Domaine | Technologie / service | Rôle |
|---|---|---|
| Application | Next.js 16, TypeScript, React | Dashboard et API serveur |
| Données | PostgreSQL Supabase | Données métiers persistantes |
| ORM | Prisma 7 + adaptateur PostgreSQL | Schéma, requêtes et migrations |
| Téléphonie IA | Vapi | Assistants, appels et webhooks |
| Opérateur téléphonique | Twilio | Numéros et acheminement des appels |
| Voix | ElevenLabs / voix Vapi | Synthèse vocale des assistants |
| Hébergement | Vercel | Application publique et webhooks |
| Stockage | Supabase Storage | Avatars utilisateurs |

Le dépôt GitHub est `TonyObed/Sonara-Front`. La branche de travail est `implementation`. Les changements doivent être poussés sur cette branche ; ne fusionner vers `main` que sur demande explicite.

## 2. Réalisé et persistant

### Authentification et isolation des entreprises

- Authentification par e-mail / mot de passe, rafraîchissement de session et rôles.
- Les données principales sont filtrées par `companyId` : un nouveau compte ne doit pas voir les campagnes, appels, contacts, notifications ou métriques d'une autre entreprise.
- Profil utilisateur persistant : prénom, nom, e-mail et URL d'avatar.
- API de modification du profil : `PATCH /api/auth/profile`.
- Invitations, OAuth et routes 2FA existent côté API ; leur interface doit encore être finalisée et testée de bout en bout.

### Données du dashboard

- Les entités métier sont persistées dans PostgreSQL : entreprises, utilisateurs, campagnes, contacts, appels, questions de campagne, insights, événements, notifications, rapports, paramètres, crédits et clés API.
- Les campagnes, contacts et appels ne doivent pas provenir de données statiques pour les comptes nouvellement créés.
- Une entreprise de démonstration peut être en mode sandbox (`Company.isSandbox`) : ses crédits ne sont pas débités ni bloquants. Ce mode ne rend pas gratuits les coûts réels Vapi/Twilio.

### Campagnes et appels

- Création, lecture et mise à jour de campagnes via API.
- Pause et reprise persistantes via `POST /api/campaigns/[id]/pause`.
- Export CSV sécurisé : un rôle `VIEWER` ne peut plus exporter les données d'une campagne.
- Appels de test enregistrés dans l'historique prévu à cet effet.
- Correctif de concurrence scheduler : les contacts doivent être réclamés de façon atomique avant un appel afin d'éviter deux appels simultanés au même contact.
- Routes présentes pour planification et réconciliation :
  - `POST /api/jobs/call-scheduler`
  - `POST /api/jobs/reconcile-calls`

### Permissions et clés API

- Un `VIEWER` ne peut plus modifier une programmation de rapport.
- Un `VIEWER` ne peut plus exporter une campagne.
- Consultation, création et révocation des clés API limitées aux administrateurs.
- Les clés API sont générées une fois, stockées sous forme de hash et leur valeur brute n'est renvoyée qu'à la création.

### Avatar et Supabase Storage

- Route d'envoi : `POST /api/auth/avatar`.
- Types autorisés : JPG, PNG, WebP ; taille maximale 1 Mo.
- Bucket attendu : `avatars` (minuscules), public, avec les mêmes trois MIME types.
- Les fichiers sont rangés par entreprise et utilisateur.
- L'URL source est sauvegardée dans PostgreSQL.
- Route de diffusion protégée ajoutée : `GET /api/auth/avatar/image`. L'interface charge maintenant l'image à travers Sonara afin de ne plus dépendre de l'accès direct du navigateur à Supabase Storage.
- Le dernier correctif avatar est en attente de vérification manuelle après rechargement du dashboard.

### Déploiement et sécurité déjà traitée

- Déploiement Vercel disponible : `https://sonara-front.vercel.app/`.
- Les secrets doivent rester dans `.env.local` localement et dans les variables d'environnement Vercel en production.
- `DATABASE_URL` doit utiliser le pooler Supabase pour Vercel avec `sslmode=require` et un mot de passe encodé si nécessaire.
- `SUPABASE_URL` et `SUPABASE_SECRET_KEY` doivent être deux variables distinctes, uniquement côté serveur.
- Le webhook Vapi est présent et sécurisé dans l'application. Il doit être configuré avec l'URL Vercel publique, pas `localhost`.

## 3. État actuel : important avant de continuer

### Ce qui est utilisable

- Connexion et isolation par entreprise.
- Création et consultation des campagnes.
- Base de données et schéma Prisma.
- Intégrations Vapi / Twilio existantes dans le code.
- Dashboard, rapports, paramètres, support et monitoring ont déjà leur design.
- Upload avatar et sauvegarde dans Storage.

### Ce qui reste partiellement branché ou doit être vérifié

- Vérifier visuellement le dernier correctif avatar ; si l'image reste cassée, lire la réponse réseau de `/api/auth/avatar/image` (statut HTTP attendu : 200).
- Le comportement conversationnel de l'assistant Vapi doit être retesté : écouter l'utilisateur, interruption naturelle, faible latence et fin d'appel appropriée.
- Les webhooks Vapi doivent être testés sur Vercel avec un appel réel afin de créer / mettre à jour les appels, transcriptions et insights automatiquement.
- Le scheduler Vercel Hobby n'est pas adapté à des campagnes régulières : les crons Hobby sont limités. Il faut Vercel Pro ou un scheduler externe pour une exécution fréquente.

## 4. Fonctionnalités à finir sans modifier le design

### Priorité 1 — supprimer les actions fictives du dashboard

Chaque bouton doit appeler une API réelle ou afficher clairement qu'il est indisponible. Aucun bouton ne doit simuler une action métier.

1. **Paramètres**
   - Relier l'invitation de collègues à l'API d'invitation.
   - Relier la création / révocation de clés API à l'API existante.
   - Relier la 2FA aux routes setup, enable et disable.
   - Sauvegarder tous les réglages modifiables en base.

2. **Campagnes**
   - Garder pause / reprise via API et supprimer les anciens toasts locaux redondants.
   - Relier le bouton export au téléchargement réel CSV.
   - Alimenter les graphiques de détail avec `campaign_questions` et `call_insights`, sans Q1/Q2 codés en dur.
   - Faire apparaître clairement les appels de test dans leur historique séparé.

3. **Contacts**
   - Remplacer l'import CSV fictif par un import réel, obligatoirement rattaché à une campagne.
   - Remplacer le téléchargement de modèle fictif par un fichier CSV réel.
   - Afficher les données provenant des API, filtrées par entreprise.

4. **Live monitoring**
   - Remplacer les ondes, événements et écoute fictifs par les vrais appels et événements Vapi reçus en base.
   - Tant que le streaming audio n'est pas réellement disponible, afficher « indisponible » plutôt que de simuler une écoute live.

5. **Rapports et notifications**
   - Relier l'écran rapports aux routes API déjà créées.
   - Ajouter aux notifications une cible persistante : `actionUrl` ou `campaignId`, `callId`, `reportId`.
   - Mettre en place génération de fichier, historique, envoi et statut de rapport. L'envoi e-mail réel nécessite un fournisseur (Resend, Postmark, etc.).

6. **Support**
   - Brancher la création, le chargement et le suivi des tickets aux tables / API support existantes.

### Priorité 2 — qualité des appels IA

- Vérifier que Sonara utilise l'assistant Vapi choisi, avec la bonne langue, la bonne voix et le bon numéro sortant.
- Vérifier le modèle LLM choisi et son crédit disponible.
- Régler l'endpointing de transcription dans les limites Vapi (la valeur ne doit pas dépasser 500 ms selon l'erreur constatée).
- Raccourcir le prompt système et éviter les scripts lus sans attendre la réponse de l'appelant.
- Activer l'interruption (barge-in), adapter la sensibilité voix et limiter les réponses trop longues.
- Mesurer la latence séparément : téléphonie, STT, LLM, TTS et délai réseau. Ne pas modifier plusieurs composants au hasard en même temps.
- Tester avec un scénario de deux minutes : accueil, consentement, une question, relance naturelle, remerciement, raccrochage.

### Priorité 3 — automatisation fiable

- Déployer le webhook Vapi sur Vercel et configurer le secret de signature.
- Ajouter `CRON_SECRET` dans Vercel.
- Choisir la solution de déclenchement : Vercel Pro ou scheduler externe. Ne pas compter sur Vercel Hobby pour lancer des campagnes fréquemment.
- Déclencher régulièrement : scheduler, réconciliation des appels bloqués, génération de rapports et notifications.
- Conserver l'idempotence : un webhook ou une tâche répétée ne doit jamais créer deux fois le même appel ou le même insight.

## 5. Paiement et crédits — à faire plus tard

Le paiement n'est pas encore configuré ; il ne faut donc pas afficher de changement de plan ou de recharge comme s'ils avaient été encaissés.

Quand ce chantier sera ouvert :

1. Choisir un PSP (Stripe est le choix le plus direct pour ce stack).
2. Créer les produits / plans et webhooks de paiement.
3. Créer une table de transactions / factures immuable.
4. Créditer les minutes uniquement après confirmation du webhook de paiement.
5. Débiter les minutes de manière atomique au déclenchement des appels.
6. Prévoir remboursements, échecs, TVA / factures et historique.
7. Conserver le mode sandbox uniquement pour les comptes de démonstration explicitement marqués.

## 6. Sécurité à poursuivre

- Ne jamais commit `.env.local`, mots de passe, tokens Vapi/Twilio/OpenRouter/Gemini ou clés Supabase.
- Toute clé déjà envoyée dans une conversation ou exposée doit être révoquée et régénérée.
- Vérifier signature et idempotence des webhooks Vapi.
- Ajouter rate limiting sur connexion, reset de mot de passe, appel test, import et endpoints publics futurs.
- Journaliser les actions sensibles : création/révocation clé API, invitations, exports, modifications de campagne, changement de rôle.
- Réserver les actions d'administration aux rôles adéquats, côté API et pas seulement dans l'interface.
- Avant mise en production : CSP, headers de sécurité, sauvegardes DB, monitoring d'erreurs et alertes de coûts.

## 7. Procédure de travail conseillée

1. Travailler dans une branche issue de `implementation`.
2. Lire les routes API et le schéma Prisma avant de toucher à un écran.
3. Ne jamais remplacer une donnée dynamique par une valeur front codée en dur.
4. Ajouter / adapter les migrations pour chaque donnée métier nouvelle.
5. Tester en local : `npm.cmd test -- --run` puis `npm.cmd run build`.
6. Pousser sur `implementation` avec un commit clair.
7. Vérifier le déploiement Preview Vercel.
8. Passer sur `main` uniquement après test métier et validation explicite.

## 8. Commandes utiles

```powershell
# Lancer le projet localement
npm.cmd run dev

# Tests
npm.cmd test -- --run

# Build de production
npm.cmd run build

# Générer le client Prisma
npx prisma generate
```

## 9. Derniers commits significatifs

- `bee9c11` — mode sandbox pour les crédits d'une entreprise de démonstration.
- `2d32cab` — tâche de maintenance sécurisée des campagnes.
- `980b56f` — persistance profils et sécurisation d'actions du dashboard.
- `fb547b9` à `87a29a7` — upload avatar Supabase, URL et bucket normalisés.
- `d7ba989` — rendu direct de l'avatar dans le dashboard.

Le correctif suivant ajoutera la route protégée de diffusion d'avatar et ce document de passation.
