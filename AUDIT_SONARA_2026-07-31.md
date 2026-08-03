# Audit technique et sécurité — Sonara

Date : 31 juillet 2026  
Périmètre : application Next.js, API, Prisma/Supabase, authentification, appels Vapi, Gemini, dépendances et qualité.  
Méthodes : revue du code, lecture du schéma Prisma, analyse des routes sensibles, `npm test`, `npm run build` et `npm audit --omit=dev`.

## Résumé exécutif

Sonara possède déjà de bonnes fondations pour un MVP : isolation des données par `companyId`, mots de passe bcrypt, JWT courts, cookies `httpOnly`, 2FA, contrôles de rôles sur une grande partie des routes, validation Zod et webhook Vapi signé lorsque le secret est configuré.

Le projet n’est pas encore prêt pour une mise en production avec des clients payants. Les priorités sont : rendre le webhook Vapi strict et idempotent, corriger les dépendances vulnérables, supprimer les chemins de paiement simulés, et rendre le rate-limit fiable en production.

## Correctifs appliqués le 2 août 2026

- Webhook Vapi : signature obligatoire en production, comparaison constante et empreinte SHA-256 unique pour ignorer les rejouements sans doubler les crédits.
- Traitement de fin d’appel : appel, contact, insight, crédit et notification sont maintenant écrits dans une transaction unique.
- Scheduler : statut de campagne centralisé et endpoint de réconciliation des appels bloqués ajouté. Sa planification automatique reste à faire au déploiement.
- Rate-limit : échec fermé en production ; compteur local restrictif en développement.
- Seed : refus hors développement, confirmation explicite et mot de passe de démonstration fourni uniquement par variable d’environnement.
- Dépendances : Next.js mis à jour en 16.2.12, Prisma en 7.9.1 ; `xlsx` supprimé et export remplacé par CSV protégé contre l’injection de formules.
- Latence : réglages Vapi rendus configurables ; attente de fin de parole réduite de 1,5 s à 0,9 s par défaut, avec interruption plus réactive.

## Vérifications réalisées

| Vérification | Résultat |
| --- | --- |
| Compilation de production | OK — `npm run build` passe |
| Tests unitaires | OK — 20 tests, 4 fichiers |
| Audit npm production | 10 vulnérabilités : 5 high, 5 moderate |
| Protection anti-double lancement scheduler | Corrigée localement avec `FOR UPDATE SKIP LOCKED` |
| Connexion Supabase locale | Fonctionnelle via pooler et TLS local |
| Gemini | Clé et modèle Gemini 3.1 Flash Lite validés |

## Points solides

- Les mots de passe sont hachés avec bcrypt (coût 12 sur les créations et réinitialisations).
- Les tokens d’accès expirent en 15 minutes, les refresh tokens en 7 jours.
- Les cookies de session sont `httpOnly`, `SameSite=Strict` et `Secure` en production.
- Les données du dashboard sont désormais majoritairement chargées depuis les API et filtrées par entreprise.
- Les appels Vapi possèdent un lien unique `vapiCallId`.
- Le scheduler réclame désormais les contacts avec un verrou SQL atomique afin d’éviter deux appels au même contact.
- Les validations d’entrées utilisent Zod pour les parcours principaux.

## Problèmes à corriger

### P0 — à traiter avant tout client réel

#### 1. Webhook Vapi non idempotent : risque de double débit et double traitement

**Constat.** Un `end-of-call-report` reçu deux fois met à jour l’appel, incrémente les tentatives, crée un événement, débite le crédit et crée une notification à chaque réception. Vapi peut rejouer un webhook après un timeout ou un échec réseau.

**Impact.** Un seul appel peut coûter plusieurs crédits, fausser les statistiques, changer le statut d’un contact plusieurs fois et produire des notifications en double.

**Emplacement.** `src/app/api/webhooks/vapi/route.ts` — traitement de `end-of-call-report`, création de `CallEvent`, débit de `CreditTransaction`.

**Solution.**

1. Ajouter un identifiant externe d’événement Vapi dans `CallEvent` et une contrainte `@@unique([callId, providerEventId])` ou une table `webhook_receipts` avec `provider + eventId` unique.
2. Réclamer l’événement dans une transaction avant toute écriture métier.
3. Ne débiter le crédit que lors de la transition atomique d’un appel non final vers un statut final.
4. Retourner 200 pour les doublons déjà traités.

**Test à ajouter.** Poster deux fois exactement le même `end-of-call-report` et vérifier : un seul débit, un seul événement final, une seule tentative.

#### 2. Signature webhook Vapi optionnelle

**Constat.** Si `VAPI_WEBHOOK_SECRET` est absent, le webhook accepte tout JSON, y compris depuis Internet.

**Impact.** Une personne peut forger des fins d’appels, modifier des statuts ou déclencher le flux du scheduler.

**Emplacement.** `src/app/api/webhooks/vapi/route.ts:137-141`.

**Solution.** En production, retourner 503 au démarrage ou 401 sur chaque requête tant que `VAPI_WEBHOOK_SECRET` n’est pas défini. Vérifier la signature à chaque requête, avec comparaison constante (`timingSafeEqual`).

#### 3. Dépendances avec vulnérabilités connues

**Constat.** `npm audit --omit=dev` remonte 5 vulnérabilités high et 5 moderate.

| Dépendance | Gravité | Action |
| --- | --- | --- |
| `next@16.2.7` | High | Mettre à jour au moins vers `16.2.12` puis refaire build + tests. |
| `postcss`, `sharp` via Next | High | Corrigés avec la mise à jour de Next. |
| `xlsx@0.18.5` | High | Aucune correction npm disponible : limiter strictement l’import, isoler le parseur, fixer une taille maximale et prévoir remplacement ou service d’import sécurisé. |
| `prisma` transitif | Moderate | Mettre Prisma et les paquets `@prisma/*` sur une version corrigée cohérente. |

**Priorité pratique.** Mettre Next à jour en premier, puis réévaluer l’usage de `xlsx` avant d’accepter des fichiers clients non fiables.

### P1 — à traiter avant facturation et montée en charge

#### 4. Rate-limit en mode fail-open

**Constat.** Si Redis est absent ou indisponible, le rate-limit laisse passer les requêtes. Les valeurs par défaut sont volontairement fictives.

**Impact.** Les routes login, inscription, reset et appels test deviennent plus vulnérables au brute-force, au spam et aux coûts Vapi.

**Emplacement.** `src/lib/rate-limit.ts:9` et `:58`.

**Solution.**

- En production : exiger les variables Upstash/Redis au démarrage.
- Pour login, reset, inscription, appels test et scheduler : fail-closed ou fallback local très restrictif.
- Ajouter une limite par entreprise, IP et utilisateur pour les appels sortants.
- Mesurer les refus et alertes de rate-limit.

#### 5. Paiement simulé

**Constat.** Le service paiement retourne une URL `mock-payment`.

**Impact.** Aucun abonnement payant, crédit, remboursement, facture ou preuve de paiement ne peut être considéré comme réel.

**Emplacement.** `src/lib/payments.ts`.

**Solution.** Intégrer un PSP adapté au marché cible, ne créditer un compte qu’après webhook PSP signé et idempotent, puis enregistrer `providerTransactionId`, montant, devise, statut et événement de paiement.

#### 6. Script de seed destructif et identifiants connus

**Constat.** Le seed efface les tables métier et contient un mot de passe de démonstration connu.

**Impact.** Exécuté contre une mauvaise base, il peut détruire les données et créer un accès administrateur prévisible.

**Emplacement.** `prisma/seed.ts`.

**Solution.** Refuser l’exécution hors développement, exiger `ALLOW_DESTRUCTIVE_SEED=true`, ne jamais utiliser la base de production, et générer le mot de passe de démonstration via variable locale non commitée.

#### 7. Secrets et rotation

**Constat.** Sonara dépend de secrets Supabase, JWT, Vapi, Gemini, ElevenLabs et éventuellement Redis.

**Risque.** Une fuite de `.env.local`, d’un historique Git, d’un partage d’écran ou d’un log donne un accès direct à des services payants ou aux données.

**Solution.**

- Garder `.env.local` ignoré par Git et utiliser les secrets de la plateforme de déploiement.
- Créer une clé par environnement : développement, test, production.
- Rotation immédiate de toute clé montrée dans un chat, une capture ou un commit.
- Limites de dépenses, alertes de consommation et droits minimaux chez Vapi/Gemini/ElevenLabs.

### P2 — fiabilité et produit

#### 8. Reprise après incident du scheduler

Le verrou SQL empêche désormais les doublons simultanés. En revanche, si le processus tombe après avoir réclamé un contact (`CALLING`) mais avant le retour Vapi, ce contact peut rester bloqué.

**Solution.** Ajouter un job de réconciliation : après un délai défini, vérifier les appels `INITIATED`/`RINGING`/`CALLING` sans événement récent auprès de Vapi, puis marquer `FAILED` ou remettre `PENDING` selon une règle explicite.

#### 9. Fin de campagne et appels encore actifs

La logique de fin doit tenir compte des contacts `CALLING` et des appels en cours, pas seulement des contacts `PENDING`. Cela évite de terminer visuellement une campagne alors que Vapi traite encore des appels.

**Solution.** Centraliser une fonction `recomputeCampaignStatus(campaignId)` appelée après chaque transition d’appel, avec une matrice de statuts documentée.

#### 10. Tests encore insuffisants sur les parcours critiques

Les 20 tests unitaires passent, mais ils ne couvrent pas encore les risques métier principaux : idempotence Vapi, isolation multi-tenant, concurrence scheduler, débit des crédits, permissions par rôle et reprise d’échec fournisseur.

**Tests prioritaires.**

1. Deux schedulers concurrents ne doivent réclamer aucun contact commun.
2. Rejeu d’un webhook Vapi : un seul débit.
3. Un utilisateur de l’entreprise A ne peut jamais lire ou exporter les données de B.
4. Un `VIEWER` ne peut ni lancer ni modifier une campagne.
5. Un appel Vapi en erreur remet exactement une fois le contact dans l’état attendu.
6. Un paiement webhook rejoué ne crédite qu’une seule fois.

#### 11. Protection et conservation des données d’appel

Les transcriptions, enregistrements, numéros et résumés sont des données personnelles sensibles dans le contexte métier.

**À mettre en place.**

- Consentement et message d’information avant l’enregistrement.
- Politique de rétention : par exemple suppression ou anonymisation après une durée choisie.
- Accès aux enregistrements contrôlé par rôle et journalisé.
- URL d’enregistrement signées et temporaires, jamais publiques permanentes.
- Export de données et suppression de compte/contacts.
- Chiffrement des informations sensibles additionnelles si elles sont stockées.

## Architecture recommandée pour la prochaine étape

```text
Client → API Sonara → PostgreSQL/Supabase
                    ↘ Outbox durable → worker de jobs → Vapi → client appelé
                                              ↑              ↓
                                      réconciliation     webhook signé + idempotent
                                                           ↓
                                                   PostgreSQL + audit log
```

Le point important est l’**outbox** : l’application écrit d’abord l’intention d’appel dans la base, un worker fiable l’envoie à Vapi, puis le webhook confirmé met à jour l’état. Cela limite les incohérences entre « appel créé en base » et « appel réellement envoyé ».

## Plan de correction conseillé

### Semaine 1 — sécurité et coût

1. Rendre le webhook Vapi obligatoire, signé et idempotent.
2. Mettre Next à jour vers une version corrigée et refaire l’audit npm.
3. Rendre Redis obligatoire en production sur les routes sensibles.
4. Verrouiller le seed de développement.
5. Ajouter budgets et alertes Vapi/Gemini/ElevenLabs.

### Semaine 2 — fiabilité métier

1. Ajouter les tests de concurrence scheduler et de replay webhook.
2. Mettre en place la réconciliation des appels bloqués.
3. Centraliser le calcul du statut de campagne.
4. Créer les métriques : taux de réponse, erreurs fournisseur, appels bloqués, coût par appel, latence IA.

### Avant lancement commercial

1. Remplacer le paiement mock par un PSP et un webhook signé/idempotent.
2. Définir les règles de rétention, consentement et suppression des données.
3. Mettre des environnements distincts dev/staging/prod avec clés séparées.
4. Ajouter des sauvegardes, alertes d’erreur et monitoring de disponibilité.
5. Faire un test de charge réaliste avec une campagne limitée et des numéros consentants.

## Décision produit sur le LLM

Gemini 3.1 Flash Lite convient au test et au coût réduit. Pour une expérience vocale vraiment naturelle, il faut mesurer sur de vrais appels : latence de première réponse, interruptions, taux de transcription correcte en français ivoirien et réponses hors scénario. Le modèle ne remplace pas les règles de tours de parole, l’endpointing, les interruptions et le prompt : ces quatre éléments doivent être testés ensemble.

## État après cet audit

- La protection anti-double déclenchement du scheduler est implémentée localement et validée par compilation.
- Le rapport ne remplace pas un pentest externe ni une revue juridique locale sur les appels et l’enregistrement, mais il donne la liste de corrections techniques à traiter dans le bon ordre.
