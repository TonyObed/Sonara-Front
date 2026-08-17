# Audit qualité et dynamisation du dashboard Sonara

Date : 17 août 2026
Branche auditée : `main`

## 1. Résultat exécutif

Le dashboard actif ne dépend plus de valeurs fictives pour les résultats de campagne, les indicateurs d'appels, l'activité live, les notifications, l'équipe, la consommation et la synthèse des rapports.

Le nouveau flux de données des sondages est maintenant le suivant :

`brief de campagne` → `campaign_questions` → `schéma d'analyse Vapi` → `webhook Vapi` → `call_insights` → `API campagne` → `onglet Résultats`.

Les campagnes enregistrées en brouillon ou planifiées peuvent être lancées depuis leur page de détail. Les reprises de campagne passent aussi par le moteur d'appels. Les contacts sont réclamés atomiquement afin d'empêcher deux schedulers d'appeler la même personne.

Le design existant a été conservé. Les changements concernent les données, les API, la base et les actions réelles.

## 2. État par écran

| Zone | Source actuelle | État | Remarque |
|---|---|---:|---|
| Accueil dashboard | API entreprise/dashboard | Réel | Appels du jour, taux de réponse, crédits, tendances et événements viennent de la base. |
| Liste des campagnes | API campagnes | Réel | Statuts, progression, réponses, sentiment et appels test sont chargés par API. |
| Campagne — Vue générale | Appels, contacts et insights | Réel | Les indicateurs sont calculés pour la campagne et l'entreprise connectées. |
| Campagne — Résultats | `campaign_questions` + `call_insights.answers` | Réel pour les nouveaux appels | NPS, distributions, réponses, thèmes et villes n'utilisent plus de chiffres fixes. |
| Campagne — Appels | Table `calls` | Réel | Statut, durée, résumé et détail proviennent des appels enregistrés. |
| Campagne — Contacts | Table `contacts` | Réel | Aucun contact de démonstration n'est injecté. |
| Campagne — Paramètres | Table `campaigns` | Réel | Voix, horaires, tentatives, délai entre tentatives, durée et brief sont persistés. |
| Contacts globaux | API contacts | Réel | Recherche et import sont reliés aux données du compte. Le CSV proposé est seulement un modèle téléchargeable. |
| Rapports | Tables `reports` et `report_schedules` | Réel/partiel | Les rapports, programmations et statistiques IA sont réels. L'envoi e-mail doit encore être validé en production. |
| Live monitoring | Appels et événements | Réel | Activité, file, capacité et journal sont réels. La latence reste vide car elle n'est pas encore mesurée. |
| Paramètres | Profil, entreprise, membres, 2FA, clés API | Réel | Les actions sont persistées et protégées par rôle. |
| Facturation | Crédits, transactions et appels | Réel/partiel | La consommation est réelle. Les factures restent vides tant que le paiement n'est pas activé. |
| Notifications | Table `notifications` | Réel | Chargement, compteur et lecture sont persistés. Les liens restent génériques lorsque la notification n'a pas de cible. |
| Support | API support + contenu produit | Réel | Les demandes sont enregistrées. Les articles d'aide sont du contenu produit constant, pas des données client. |

## 3. Changements réalisés

### Base de données

- ajout de `Campaign.retryDelayMinutes` ;
- alignement des horaires par défaut sur `00:00`–`23:59` pour la phase MVP ;
- migration Prisma créée et appliquée ;
- création automatique des lignes `CampaignQuestion` depuis les questions numérotées du brief ;
- rétro-remplissage initial effectué sur les campagnes existantes : 16 campagnes analysées, 10 mises à jour et 48 questions créées ;
- seconde synchronisation effectuée après contrôle métier : 9 questions corrigées. Une question de recommandation oui/non reste désormais booléenne ; un NPS n'est calculé que si une note de 0 à 10 est réellement demandée.

### Vapi et webhook

- chaque appel reçoit un schéma d'analyse structuré correspondant aux questions de sa campagne ;
- Vapi doit produire le sentiment, les thèmes et les réponses `q1`, `q2`, etc. ;
- le webhook stocke ces valeurs dans `CallInsight` ;
- les anciens appels sans réponses structurées restent honnêtement vides ; aucune donnée n'est inventée ;
- la déduplication du webhook protège les crédits et écritures contre les événements rejoués.

### Campagnes

- bouton de lancement réel pour les brouillons et campagnes planifiées ;
- reprise d'une campagne en pause reliée au scheduler ;
- paramètres de tentatives, délai, durée, concurrence et horaires persistés ;
- verrou SQL `FOR UPDATE SKIP LOCKED` pour empêcher les doublons d'appels ;
- délai entre tentatives appliqué directement dans la réclamation SQL ;
- NPS calculé à partir des réponses enregistrées, sans benchmark fictif ;
- graphiques générés à partir des vraies questions de la campagne ;
- thèmes et villes calculés à partir des vraies données d'appels et contacts.

### Dashboard global

- indicateurs « aujourd'hui » et « dernière heure » corrigés ;
- journal live alimenté par `CallEvent` ;
- statistiques de rapports calculées depuis `CallInsight` ;
- consommation mensuelle calculée depuis les appels et leurs coûts ;
- notifications et collaborateurs chargés depuis leurs API ;
- lecture des notifications persistée ;
- badges de rôle dynamiques au lieu de toujours afficher « Admin » ;
- suppression des transcriptions, résultats et coûts de démonstration actifs.

### Permissions confirmées

- un `VIEWER` ne peut pas lancer, modifier, mettre en pause ou exporter une campagne ;
- un `VIEWER` ne peut pas créer ni modifier une programmation de rapport ;
- les clés API sont réservées aux administrateurs ;
- les invitations et retraits de collaborateurs sont réservés aux administrateurs ;
- toutes les requêtes métier sont filtrées par `companyId`.

## 4. Vérifications automatiques

- `npm test` : **30 tests réussis sur 30**, 7 fichiers de tests ;
- `npm run build` : **réussi**, compilation Next.js et contrôle TypeScript validés ;
- `git diff --check` : aucune erreur de patch ou d'espace ;
- `npm run lint` : **échec global**, 51 erreurs et 58 avertissements.

Le build est donc publiable, mais la dette ESLint doit être traitée dans un chantier dédié. Elle comprend principalement des apostrophes JSX non échappées, des états modifiés directement dans certains effets, des types `any`, des imports inutilisés et des images non optimisées.

## 5. Tests manuels obligatoires

1. Créer une campagne avec 3 à 5 questions clairement numérotées dans le brief.
2. Importer un CSV de contacts puis enregistrer la campagne en brouillon.
3. Ouvrir la fiche du brouillon et cliquer sur **Lancer la campagne**.
4. Vérifier le passage `DRAFT` → `RUNNING`, puis l'arrivée d'un appel.
5. Terminer une conversation avec des réponses exploitables.
6. Vérifier dans un délai de quelques secondes :
   - le statut final dans **Appels** ;
   - le statut du contact ;
   - le résumé et le sentiment ;
   - les réponses dans **Résultats** ;
   - le NPS si une question de recommandation existe ;
   - les thèmes, villes et indicateurs de la vue générale.
7. Mettre une deuxième campagne en pause puis la reprendre.
8. Vérifier qu'un même contact ne reçoit pas deux appels simultanés.
9. Vérifier les pages Live, Rapports, Notifications et Facturation après l'appel.
10. Tester les rôles `ADMIN`, `MANAGER` et `VIEWER` avec trois comptes distincts.

## 6. Limites connues et solutions recommandées

### Priorité P0 — avant une vraie démonstration client

1. **Valider un appel complet après ce déploiement.** Les anciens appels ne peuvent pas fournir rétroactivement des réponses structurées absentes du webhook.
2. **Vérifier le cron Vercel en production.** Il doit appeler le scheduler et la réconciliation avec `CRON_SECRET` et `INTERNAL_JOB_KEY` correctement configurés.
3. **Vérifier les variables Vercel de production.** En particulier l'URL publique, Vapi, le webhook, la base, le fournisseur LLM et les secrets internes.
4. **Régler la dette ESLint des fichiers actifs.** Le build passe, mais un pipeline qualité strict refuserait actuellement le dépôt.

### Priorité P1 — MVP solide

1. Ajouter un éditeur de questions explicite dans le formulaire de campagne. L'inférence actuelle fonctionne pour les questions numérotées, mais un formulaire structuré sera plus fiable qu'un brief libre.
2. Ajouter à `Notification` une cible persistée (`actionUrl`, `campaignId`, `callId` ou `reportId`) pour ouvrir directement la bonne ressource.
3. Instrumenter la latence réelle : temps STT, premier token LLM, premier audio TTS et délai total de réponse.
4. Faire interroger Vapi par la réconciliation pour tous les appels de campagne bloqués, comme cela existe déjà pour les appels test, afin de récupérer un résultat même si le webhook final manque.
5. Ajouter des tests d'intégration avec une base de test et des tests E2E authentifiés sur les parcours campagne, brouillon, pause/reprise et résultats.
6. Centraliser le catalogue des offres. Les tarifs de la landing et ceux du dashboard ne doivent pas évoluer séparément.
7. Ajouter l'envoi réel des invitations et des rapports par e-mail ; le lien d'invitation est actuellement créé mais sa livraison dépend encore d'une action manuelle.

### Priorité P2 — évolution produit

1. Paiement, factures et recharge automatique lorsque le modèle commercial sera validé.
2. Historisation du taux de change USD/FCFA au lieu d'un taux technique fixe pour les coûts.
3. Comparaison de périodes sur le dashboard et filtres de dates côté API.
4. Exports de rapports asynchrones avec état, stockage et expiration des fichiers.
5. Observabilité centralisée : erreurs serveur, erreurs Vapi, temps de traitement webhook et alertes sur appels bloqués.
6. Archivage des anciens composants et fichiers de démonstration inutilisés afin de réduire la confusion et la taille du code.

## 7. Verdict MVP

Le socle fonctionnel est maintenant cohérent : les données variables visibles dans le dashboard actif ont une source API/base réelle ou un état vide explicite. Le point de validation décisif est un nouvel appel de campagne complet, car c'est lui qui prouvera en production la chaîne Vapi → webhook → `CallInsight` → graphiques.

Après ce test, la priorité n'est plus d'ajouter des chiffres au front : elle est de fiabiliser la réconciliation, mesurer la latence, réduire la dette ESLint et ajouter des tests E2E.
