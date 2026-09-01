# Sonara — passation complète, changements et feuille de route

Date de référence : **1er septembre 2026**

Branche de référence : **`main`**

Commit de départ de cette passation : **`c2580b6`**

Dépôt : **`TonyObed/Sonara-Front`**

Projet local : **`C:\Users\Administrator\Desktop\Influenceuse\Sonara-Front`**

Production : **https://sonara-front.vercel.app/**

> Ce document devient la source principale pour reprendre le projet sur un autre système. Les anciens documents restent utiles pour l'historique, mais ils contiennent parfois des informations dépassées, notamment l'ancienne branche `implementation`, les anciens modèles vocaux et des fonctionnalités autrefois fictives qui sont maintenant reliées à la base.

## 1. Résumé exécutif

Sonara est un SaaS multi-entreprise permettant de créer des campagnes d'appels téléphoniques assistés par IA, importer des contacts, déclencher les appels, suivre leur progression, collecter les réponses, analyser les résultats et générer des rapports.

État actuel vérifié :

- application Next.js compilable et déployable ;
- base PostgreSQL Supabase reliée par Prisma ;
- authentification, profils, onboarding et rôles persistants ;
- appels de test et campagnes reliés à Vapi ;
- téléphonie sortante fournie à Vapi par le numéro configuré ;
- transcription Deepgram, conversation LLM et voix ElevenLabs configurables ;
- webhooks, réconciliation et scheduler présents ;
- dashboard alimenté majoritairement par des données réelles isolées par entreprise ;
- rapports CSV réels disponibles ;
- support enrichi de tutoriels visuels annotés ;
- paiement réel non intégré ;
- nouveau rapport PDF avec graphiques seulement défini, pas encore développé ;
- dette ESLint importante à corriger.

Vérifications du 1er septembre 2026 :

| Contrôle | Résultat |
|---|---:|
| Tests Vitest | **45/45 réussis**, 12 fichiers |
| Build Next.js + TypeScript | **Réussi** |
| Modèles Prisma | **22** |
| Routes API | **51** |
| Pages dashboard | **11** |
| ESLint global | **Échec : 51 erreurs, 58 avertissements** |

Le MVP est fonctionnel pour poursuivre les tests, mais il ne doit pas être présenté comme prêt pour une exploitation commerciale à grande échelle avant validation complète des campagnes, de la conformité, des coûts, des cron jobs et de la sécurité opérationnelle.

## 2. Architecture et flux actuel

### Stack

| Couche | Technologie | Utilisation |
|---|---|---|
| Frontend | Next.js 16, React 19, TypeScript | Landing, authentification, onboarding et dashboard |
| Backend | Routes API Next.js | Auth, campagnes, appels, équipes, rapports, webhooks et jobs |
| Base | PostgreSQL Supabase | Toutes les données métier persistantes |
| ORM | Prisma 7 avec adaptateur `pg` | Schéma et accès aux données |
| Stockage | Supabase Storage | Avatars et rapports privés |
| Orchestration vocale | Vapi | Assistant dynamique, appels et événements |
| Téléphonie | Numéro configuré dans Vapi/Twilio | Acheminement des appels sortants |
| STT | Deepgram Nova | Transcription en français et vocabulaire local |
| LLM par défaut | OpenAI géré par Vapi | Intelligence conversationnelle |
| LLM optionnels | OpenRouter ou Gemini | Activables par variables d'environnement |
| TTS | ElevenLabs Flash | Voix Ingrid et Loïc |
| Hébergement | Vercel | Application publique, API, webhook et cron |
| E-mails | Resend prévu dans le code | Invitations/rapports, à valider en production |
| Tests | Vitest et Playwright | Tests unitaires/intégration et squelette E2E |

### Flux d'une campagne

```text
Création campagne
    -> questions extraites/persistées dans campaign_questions
    -> import CSV et normalisation des contacts
    -> lancement ou reprise
    -> scheduler réclame atomiquement les contacts
    -> Vapi déclenche les appels par vagues limitées
    -> Deepgram transcrit
    -> le LLM dialogue et structure les réponses
    -> ElevenLabs produit la voix
    -> webhook Vapi met à jour call, transcript, summary et call_insights
    -> réconciliation récupère les appels dont le webhook manque
    -> APIs recalculent KPIs, résultats, NPS et graphiques
    -> dashboard et rapports affichent uniquement les données de l'entreprise
```

### Principales tables

- `companies`, `users`, `refresh_tokens` ;
- `company_onboarding`, `company_settings`, `company_api_keys` ;
- `campaigns`, `campaign_questions`, `contacts`, `blacklist` ;
- `calls`, `test_calls`, `call_events`, `call_insights` ;
- `credit_transactions`, `notifications` ;
- `reports`, `report_schedules` ;
- `support_tickets`, `service_statuses`, `service_incidents` ;
- `leads`.

## 3. Fonctionnalités ajoutées et améliorées

### 3.1 Authentification, comptes et onboarding

- inscription et connexion email/mot de passe reliées au backend ;
- mots de passe hashés avec bcrypt ;
- sessions JWT avec access token, refresh token et cookies sécurisés ;
- déconnexion réelle ;
- mot de passe oublié et réinitialisation ;
- Google OAuth présent ; Microsoft OAuth préparé mais dépend de ses identifiants ;
- 2FA TOTP : préparation, activation, vérification et désactivation ;
- rate limiting sur les routes sensibles ;
- onboarding persistant après la première inscription ;
- formulaire de découverte : provenance, métier, objectif et volume ;
- identité saisie à l'inscription sauvegardée et réutilisée dans le dashboard ;
- nouvel onboarding animé inspiré de la référence fournie, adapté aux couleurs Sonara ;
- message intermédiaire fictif de connexion réussie retiré ;
- redirection cohérente vers onboarding ou dashboard.

### 3.2 Profil, avatar et entreprise

- prénom, nom et email chargés depuis PostgreSQL ;
- affichage du prénom dans le message « Bonjour » ;
- modification persistante du profil ;
- upload d'avatar JPG, PNG ou WebP, maximum 1 Mo ;
- bucket Supabase en minuscules ;
- URL Supabase normalisée ;
- lecture de l'avatar via une route Sonara authentifiée ;
- prise en charge des clés Supabase opaques ;
- paramètres de l'entreprise persistés ;
- nouveau compte isolé : aucun journal, campagne, appel ou résultat d'une autre entreprise.

### 3.3 Collaborateurs et permissions

- invitation de collaborateurs ;
- acceptation d'invitation ;
- rôles `ADMIN`, `MANAGER`, `VIEWER` et `SUPER_ADMIN` ;
- ajout et révocation/désactivation de membres ;
- clés API créées, hashées et révocables ;
- valeur brute d'une clé renvoyée seulement lors de sa création ;
- clés API réservées aux administrateurs ;
- un viewer ne peut pas modifier/lancer/pause une campagne, exporter des données ou modifier une programmation de rapport ;
- isolation systématique par `companyId` côté serveur.

### 3.4 Campagnes et contacts

- création et sauvegarde de campagnes ;
- statuts persistants : brouillon, planifiée, active, pause, terminée et arrêtée ;
- lancement d'une campagne en brouillon ;
- reprise effective après pause ;
- horaires configurables ;
- horaires de test MVP élargis à la journée entière ;
- nombre de tentatives, délai de relance, durée maximale, concurrence et voix persistés ;
- import CSV réellement rattaché à la campagne ;
- normalisation des numéros ivoiriens vers le format international ;
- déduplication, blacklist et contrôle des contacts ;
- export CSV sécurisé ;
- annuaire global filtrable par nom, numéro, ville ou segment ;
- bouton de relance pour les contacts éligibles ;
- réclamation SQL atomique avec `FOR UPDATE SKIP LOCKED` ;
- mise à jour conditionnelle pour éviter qu'un même contact soit appelé deux fois ;
- limitation des vagues d'appels afin de réduire la saturation et la latence.

### 3.5 Appels de test et appels de campagne

- appels de test persistés dans `test_calls` ;
- appels de test séparés des KPIs, crédits et rapports clients ;
- historique des tests dans l'onglet Campagnes ;
- appels de campagne persistés dans `calls` ;
- association correcte entre le contact sélectionné et son appel/transcript ;
- statuts Vapi mappés vers les statuts Sonara ;
- issue réelle : terminé, refus, indisponible, rappel demandé, messagerie, occupé, sans réponse ou échec ;
- fin d'appel formelle : vouvoiement, nom du client si disponible, remerciement et raccrochage après l'au revoir ;
- outil Vapi `endCall` disponible ;
- transfert vers un agent possible si un numéro est configuré ;
- durée maximale sélectionnable de 2 à 8 minutes ;
- résumé post-appel limité aux déclarations réelles du client ;
- réponse « Aucun retour exploitable » utilisée si aucune information fiable n'existe.

### 3.6 Voix, LLM, transcription et latence

- voix actives : **Ingrid** et **Loïc** via ElevenLabs ;
- anciens identifiants de voix découplés des nouvelles variables ;
- modèle TTS par défaut : `eleven_flash_v2_5` ;
- transcription Deepgram Nova avec langue française/multilingue et termes ivoiriens ;
- modèle LLM par défaut : OpenAI géré par Vapi ;
- OpenRouter et Gemini restent possibles mais ne sont pas le défaut fiable ;
- réponses LLM plafonnées pour empêcher la lecture complète du questionnaire ;
- interruption de l'assistante activée ;
- première phrase interruptible ;
- backchannel automatique désactivé ;
- endpointing ramené dans la limite Vapi de 500 ms ;
- délais de début/arrêt de parole ajustés pour réduire la latence ;
- vocabulaire local ajouté pour améliorer les noms et expressions ivoiriennes ;
- schéma d'analyse généré à partir des vraies questions de campagne.

### 3.7 Webhook, scheduler et réconciliation

- webhook Vapi public sur Vercel ;
- protection HMAC avec comparaison constante ;
- support du secret transmis selon les formats acceptés ;
- empreinte d'événement unique pour rendre le webhook idempotent ;
- sauvegarde des événements bruts dans `call_events` ;
- stockage de la transcription, du résumé, de la durée, du coût et des insights ;
- scheduler protégé par secret interne/cron ;
- lancement immédiat attendu lors de la création ou reprise ;
- réconciliation des appels restés `RINGING` ou `IN_PROGRESS` ;
- correction des anciens appels test bloqués ;
- récupération du rapport final Vapi lorsque le webhook a été perdu ;
- règles de concurrence centralisées et testées.

### 3.8 Dashboard dynamique

- accueil alimenté par l'API entreprise ;
- appels du jour, taux de réponse, crédits et évolution issus de la base ;
- issues d'appels réelles sur l'accueil ;
- liste des campagnes alimentée par l'API ;
- détail campagne avec onglets Vue générale, Résultats, Appels, Contacts et Paramètres ;
- appel sélectionné relié au bon résumé et à la bonne transcription ;
- résultats alimentés par `campaign_questions` et `call_insights` ;
- NPS calculé seulement lorsqu'une vraie question 0–10 existe ;
- score NPS, réponses, thèmes, villes et sentiments non inventés ;
- live monitoring limité aux appels réellement actifs et récents ;
- anciennes sessions terminées retirées du live ;
- notifications persistantes et marquage lu/non lu ;
- facturation alimentée par crédits, appels et transactions existants ;
- états vides explicites pour les nouveaux comptes.

### 3.9 Rapports actuels

- génération d'un rapport pour une campagne ou toutes les campagnes ;
- rapport CSV produit à partir des appels, contacts et insights réels ;
- synthèse : volume, taux de réponse, appels terminés, durée, sentiment et coût ;
- détail : identité, téléphone, ville, segment, statut, durée, date, sentiment, réponses, thèmes et résumé ;
- protection contre les formules Excel injectées dans le CSV ;
- stockage privé dans le bucket `sonara-reports` ;
- téléchargement uniquement via une route authentifiée et isolée par entreprise ;
- historique et statut `GENERATING`, `READY` ou `FAILED` ;
- programmation quotidienne, hebdomadaire ou mensuelle ;
- notification lorsqu'un rapport est prêt ;
- code d'envoi Resend présent, à valider avec de vraies variables et une adresse expéditrice autorisée.

### 3.10 Support et tutoriels

- formulaire support relié à l'API ;
- statuts des services et incidents prévus ;
- tutoriel visuel « Recevoir un appel test » en quatre étapes ;
- tutoriel visuel « Créer et lancer une campagne » en cinq étapes ;
- une capture distincte par étape ;
- flèches, encadrements, numéros et consignes ajoutés aux captures ;
- script reproductible : `scripts/annotate-support-tutorials.ps1` ;
- rendu adapté aux écrans étroits.

### 3.11 Déploiement et base

- application déployée sur `main` ;
- Prisma Client généré pendant le build Vercel ;
- pool PostgreSQL limité pour les fonctions serverless ;
- prise en charge du pooler Supabase et de `sslmode=require` ;
- corrections TLS pour éviter les conflits de paramètres ;
- variables Vercel séparées des variables locales ;
- migrations présentes pour l'idempotence, les appels test, le sandbox, les résultats dynamiques, la latence et les relances.

## 4. Éléments retirés, remplacés ou volontairement désactivés

### Données et comportements fictifs retirés du parcours actif

- faux résultats Q1/Q2 codés en dur ;
- faux NPS et benchmarks ;
- appels, transcriptions, coûts et événements de démonstration injectés dans les comptes réels ;
- faux live monitoring persistant après la fin des appels ;
- faux import CSV depuis Contacts ;
- faux export de campagne ;
- faux changement de plan et fausse recharge présentés comme un paiement réel ;
- faux rapport signalé comme généré sans fichier disponible ;
- relation incorrecte affichant le même résumé pour plusieurs contacts ;
- action locale pause/reprise ne déclenchant pas le scheduler ;
- lancement simultané non contrôlé de tous les contacts.

### Choix techniques remplacés

- GPT-OSS/OpenRouter n'est plus le modèle actif par défaut ;
- Gemini gratuit n'est plus le défaut, car un quota peut interrompre un appel ;
- les anciennes voix ont été remplacées par Ingrid et Loïc ;
- l'assistant temporaire récitant un script a été remplacé par un assistant dynamique construit par appel ;
- les connexions PostgreSQL directes non adaptées à Vercel ont été remplacées par le pooler ;
- le fallback de rate limit qui bloquait une première connexion Vercel a été corrigé.

### Fonctions volontairement non exposées au client

- écoute audio live fictive ;
- lecture/téléchargement de l'enregistrement dans le dashboard ;
- téléchargement de la transcription complète ;
- affichage public des fichiers privés Supabase ;
- paiement réel et changement automatique de plan ;
- caller ID de marque garanti sur le téléphone du destinataire, car il dépend des opérateurs et pays.

Les URLs d'enregistrement peuvent toujours exister côté serveur/Vapi pour le traitement technique. Leur exposition client doit faire l'objet d'une décision de conformité et de rétention.

## 5. Ce qui reste à faire

### P0 — à faire avant la prochaine démonstration importante

1. Exécuter une campagne réelle de trois à cinq contacts depuis la production.
2. Vérifier chaque transition : `PENDING -> CALLING -> COMPLETED/UNREACHABLE/FAILED`.
3. Vérifier le webhook, puis la réconciliation en simulant un webhook final absent.
4. Confirmer que les résultats, NPS, graphiques, résumés et rapports se mettent à jour.
5. Vérifier que les campagnes pause/reprise et brouillon/lancement fonctionnent en production.
6. Vérifier les cron jobs Vercel et leurs secrets.
7. Contrôler les soldes Vapi, Twilio et ElevenLabs avant chaque série de tests.
8. Vérifier les limites d'appels simultanés pour ne pas recréer de latence.
9. Tester les rôles Admin, Manager et Viewer avec trois comptes distincts.
10. Faire une sauvegarde/export de la base avant une migration majeure.

### P1 — qualité et fiabilité MVP

1. Corriger la dette ESLint : actuellement **51 erreurs et 58 avertissements**.
2. Ajouter un vrai fichier `.env.example` sans secret ; il est absent du dépôt actuel.
3. Ajouter des tests E2E authentifiés réellement exécutés en CI.
4. Ajouter des tests d'intégration avec une base de test séparée.
5. Instrumenter la latence : fin de parole, transcription finale, premier token LLM, premier audio et délai total.
6. Ajouter une cible persistante aux notifications (`campaignId`, `callId`, `reportId` ou `actionUrl`).
7. Ajouter un éditeur structuré de questions au lieu de dépendre uniquement du brief libre.
8. Améliorer la reconnaissance des noms avec un champ de prononciation facultatif.
9. Centraliser les offres et crédits entre landing, dashboard et futur paiement.
10. Mettre en place monitoring d'erreurs, alertes de coûts et appels bloqués.
11. Vérifier l'envoi réel des invitations et rapports par email.
12. Définir une politique de rétention des transcripts, événements et enregistrements.

### P1 — nouveau template de rapport

Le rapport actuel reste un CSV technique. La prochaine version doit fournir :

- un **PDF professionnel** pour la direction ;
- le **CSV détaillé** actuel pour l'exploitation ;
- la transcription consultable seulement dans le dashboard si la politique de confidentialité l'autorise.

Structure PDF validée pour la suite :

1. couverture : entreprise, campagne, période, date et confidentialité ;
2. synthèse exécutive ;
3. performance des appels ;
4. résultats par question ;
5. sentiment, thèmes et recommandations ;
6. fiches individuelles : identité, numéro, ville, durée, statut, résumé et réponses.

Graphiques prévus :

- entonnoir contacts -> appels -> décrochés -> enquêtes terminées ;
- anneau des issues d'appels ;
- courbe des appels/réponses dans le temps ;
- barres des réponses par question ;
- sentiment positif/neutre/négatif ;
- NPS uniquement si la question existe ;
- thèmes les plus cités ;
- durées d'appels.

Implémentation recommandée : d'abord un template HTML imprimable alimenté par les vraies données, graphiques SVG, puis conversion PDF et stockage privé. La pagination doit empêcher la coupure des graphiques et fiches clients. Aucun graphique ne doit être affiché avec des données inventées ; utiliser « Données insuffisantes ».

### P2 — avant commercialisation

1. Paiement réel Wave, Orange Money ou fournisseur compatible avec le marché cible.
2. Webhooks de paiement idempotents et historique immuable des transactions.
3. Factures, taxes, remboursements, échecs et recharge automatique.
4. Débit atomique des crédits et contrôle des dépassements.
5. Conditions générales, politique de confidentialité et politique d'appels.
6. Consentement, opt-out, liste noire et horaires conformes aux pays ciblés.
7. Contrats et consentements pour voix clonées/ElevenLabs.
8. Vercel Pro ou infrastructure adaptée aux cron jobs fréquents et à l'usage commercial.
9. Supabase Pro, sauvegardes, restauration testée et monitoring.
10. Redis distribué pour le rate limiting multi-instance.
11. CSP finalisée et testée.
12. Rotation de tous les secrets déjà partagés dans des conversations ou captures.
13. Revue de dépendances et audit sécurité externe avant premiers gros clients.

### P3 — perspectives produit

- CRM et intégrations webhook/API clientes ;
- campagnes multilingues ;
- modèles de campagnes par secteur ;
- éditeur conversationnel visuel ;
- comparaison de campagnes et périodes ;
- segmentation avancée ;
- rappels intelligents selon la disponibilité annoncée ;
- export PDF personnalisé aux couleurs du client ;
- supervision des coûts par fournisseur ;
- SLA, journal d'audit et gestion avancée des permissions ;
- SIP trunk/numéro local et stratégie caller ID selon les opérateurs.

## 6. Tests manuels à refaire

### Compte et onboarding

- inscription avec prénom/nom ;
- onboarding complet puis reconnexion ;
- « Bonjour, prénom » sans passage préalable dans Paramètres ;
- avatar local et Vercel ;
- invitation, acceptation et révocation d'un collaborateur ;
- activation/désactivation 2FA ;
- création/révocation d'une clé API.

### Campagne

- créer et sauvegarder un brouillon ;
- rouvrir et lancer le brouillon ;
- importer un CSV avec doublon, numéro invalide et numéro ivoirien local ;
- appel test avec Ingrid puis Loïc ;
- campagne de plusieurs contacts ;
- pause puis reprise ;
- relance d'un indisponible ;
- vérifier qu'un contact n'est jamais appelé deux fois simultanément ;
- vérifier respect de la concurrence configurée.

### Données après appel

- statut final ;
- durée ;
- identité correcte du contact ;
- transcription attachée au bon appel ;
- résumé fidèle ;
- sentiment et thèmes ;
- réponses par question ;
- NPS seulement pour une note 0–10 ;
- issues d'appels sur l'accueil ;
- disparition du live une fois l'appel terminé ;
- notification et journal d'événements.

### Rapports

- générer un CSV depuis une campagne ;
- générer un CSV global ;
- télécharger avec le bon compte ;
- refuser le téléchargement depuis une autre entreprise ;
- vérifier accents, protection formule Excel, durée, ville, sentiment et résumé ;
- créer/désactiver une programmation ;
- vérifier l'email seulement après configuration Resend.

### Sécurité et rôles

- viewer interdit sur export, lancement, pause et programmation ;
- manager autorisé seulement sur son périmètre ;
- admin seul sur membres et clés API ;
- tentative d'accès à une ressource d'une autre entreprise ;
- rejeu d'un webhook Vapi ;
- appels répétés sur login et appel test pour vérifier le rate limit.

## 7. Variables d'environnement à transférer

Ne jamais copier leurs valeurs dans Git ou dans ce document. Les transférer par un gestionnaire de secrets.

### Obligatoires pour le socle

- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_URL`
- `NEXT_PUBLIC_APP_URL`
- `INTERNAL_JOB_KEY`
- `CRON_SECRET`

### Supabase

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- réglages pooler/TLS si nécessaires : `PG_POOL_MAX`, `PG_SSL_REJECT_UNAUTHORIZED`, `SUPABASE_POOLER_HOST`, `SUPABASE_POOLER_PORT`, `SUPABASE_USE_DIRECT_CONNECTION`, `SUPABASE_USE_SESSION_POOLER`

### Vapi et téléphonie

- `VAPI_API_KEY`
- `VAPI_PHONE_NUMBER_ID`
- `VAPI_WEBHOOK_SECRET`
- `TRANSFER_AGENT_NUMBER` si transfert actif
- `CAMPAIGN_MAX_CONCURRENT_CALLS`
- `CALL_RECONCILE_GRACE_MINUTES`
- `LIVE_CALL_MAX_AGE_MINUTES`
- `ALLOW_OUT_OF_HOURS_CALLS` seulement pour les tests contrôlés

### IA vocale

- `LLM_PROVIDER`
- `OPENAI_MODEL`
- `OPENROUTER_MODEL` si OpenRouter
- `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_OPENAI_BASE_URL` si Gemini
- `ELEVENLABS_PROVIDER`
- `ELEVENLABS_MODEL`
- `ELEVENLABS_VOICE_INGRID`
- `ELEVENLABS_VOICE_LOIC`
- `DEEPGRAM_MODEL`
- `DEEPGRAM_LANGUAGE`
- paramètres de latence `VAPI_*` uniquement si l'on veut remplacer les valeurs sûres du code

### Services optionnels

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `REPORT_EMAIL_FROM`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`

## 8. Procédure de changement de système

### Avant de quitter l'ancien système

1. Vérifier que tous les commits sont poussés sur `main`.
2. Sauvegarder les fichiers non suivis nécessaires sans les committer s'ils contiennent des données personnelles.
3. Exporter les secrets vers un gestionnaire sécurisé.
4. Vérifier l'accès aux comptes GitHub, Vercel, Supabase, Vapi, Twilio, ElevenLabs, Deepgram et Resend.
5. Sauvegarder les codes 2FA et méthodes de récupération.
6. Exporter une sauvegarde Supabase si une migration de compte est prévue.

### Sur le nouveau système

```powershell
git clone https://github.com/TonyObed/Sonara-Front.git
cd Sonara-Front
npm ci
npx prisma generate
npx prisma migrate deploy
npm.cmd test -- --run
npm.cmd run build
npm.cmd run dev
```

Puis :

1. recréer `.env.local` depuis le gestionnaire de secrets ;
2. ne jamais recopier un mot de passe non encodé dans une URL PostgreSQL ;
3. confirmer la connexion Supabase avant toute migration ;
4. ouvrir `http://localhost:3000` ;
5. tester connexion, dashboard, avatar et campagne sans lancer d'abord un gros volume ;
6. vérifier que Vercel utilise toujours `main` et les variables Production ;
7. vérifier que `APP_URL` pointe vers l'URL publique en production ;
8. lancer un seul appel test avant une campagne réelle.

Prérequis recommandés : Git, Node.js LTS récent compatible Next.js 16, npm et PowerShell sous Windows.

## 9. Commandes utiles

```powershell
# État Git
git status --short
git log -10 --oneline

# Installation propre
npm ci

# Base et client Prisma
npx prisma generate
npx prisma migrate deploy
npx prisma studio

# Qualité
npm.cmd test -- --run
npm.cmd run build
npm.cmd run lint
npm.cmd run test:e2e

# Développement
npm.cmd run dev
```

## 10. Dette technique connue

- ESLint : 51 erreurs et 58 avertissements au 1er septembre 2026 ;
- nombreux styles inline et ancien `dashboard/layout.tsx` volumineux ;
- imports/états historiques inutilisés ;
- plusieurs balises `<img>` à remplacer ou justifier ;
- effets React avec mises à jour synchrones signalées par les règles récentes ;
- apostrophes JSX non échappées ;
- types `any` dans certains tests ;
- `src/generated/prisma` régénéré au build ;
- `.env.example` absent ;
- anciens documents et composants historiques pouvant créer de la confusion ;
- tests E2E présents mais pas encore preuve d'une exécution systématique en CI ;
- rapports PDF non développés ;
- paiement seulement préparé/simulé ;
- rate limit distribué dépend d'Upstash ; sinon comportement de secours moins robuste ;
- observabilité et alertes encore insuffisantes.

## 11. Ordre recommandé pour continuer

1. sécuriser le changement de système et restaurer l'environnement ;
2. lancer tests, build et un appel test unique ;
3. valider une petite campagne de bout en bout ;
4. corriger le lint des fichiers actifs ;
5. ajouter `.env.example` et CI ;
6. instrumenter la latence et les erreurs fournisseurs ;
7. construire le nouveau rapport HTML/PDF avec graphiques ;
8. renforcer emails, cron et réconciliation ;
9. finaliser conformité et sécurité ;
10. intégrer le paiement seulement après validation du modèle commercial.

## 12. Fichiers de référence

- `prisma/schema.prisma` — source du modèle de données ;
- `src/lib/vapi.ts` — assistant, LLM, transcription, voix et latence ;
- `src/app/api/webhooks/vapi/route.ts` — ingestion des résultats ;
- `src/app/api/jobs/call-scheduler/route.ts` — moteur de campagne ;
- `src/app/api/jobs/reconcile-calls/route.ts` — correction des appels bloqués ;
- `src/lib/reports.ts` — rapport CSV et stockage ;
- `src/app/dashboard/campaigns/[id]/page.tsx` — détail campagne ;
- `src/app/dashboard/reports/page.tsx` — interface des rapports ;
- `src/app/dashboard/support/page.tsx` — support et tutoriels ;
- `SECURITY.md` — règles de sécurité ;
- `AUDIT_QUALITE_DASHBOARD_DYNAMIQUE_2026-08-17.md` — audit dynamique historique ;
- `docs/RECETTE_MVP_2026-08-10.md` — ancienne recette, utile pour l'historique.

## 13. Règles à ne pas casser

1. Une donnée variable du dashboard doit venir d'une API/base réelle ou afficher un état vide.
2. Toute requête métier doit être filtrée par l'entreprise authentifiée.
3. Une action interdite doit être bloquée côté API, pas seulement dans le front.
4. Un appel ou webhook répété ne doit jamais doubler une écriture, un débit ou un appel client.
5. Un appel test ne doit jamais contaminer les KPIs d'une campagne.
6. Ne jamais exposer les clés privées au navigateur.
7. Ne jamais committer `.env.local`, exports clients, transcriptions ou listes de contacts.
8. Ne jamais pousser directement une modification non testée qui peut déclencher des appels réels.
9. Conserver le CSV même après l'ajout du PDF.
10. Ne jamais inventer un NPS, un sentiment, une réponse ou un graphique lorsqu'il manque des données.

---

Dernière validation automatique avant création de ce document : **45 tests réussis**, **build production réussi**, **lint global en échec documenté**.
