# Sonara — état du MVP et recette manuelle

Date : 10 août 2026  
Branche de travail : `main`  
Derniers commits : `8a24e7e` et `2c53845`

Ce document résume les ajouts réalisés dans Sonara, ce qui doit être testé à la main et ce qui reste volontairement hors du MVP actuel.

## Ce qui est opérationnel

### Comptes, entreprise et sécurité

- Inscription et connexion par email/mot de passe.
- Sessions JWT avec rafraîchissement et limitation des tentatives de connexion.
- Isolation des données par entreprise : un nouveau compte ne doit pas voir les campagnes, appels, contacts ou notifications d'une autre entreprise.
- Profil modifiable et avatar enregistré dans Supabase Storage.
- Paramètres entreprise sauvegardés : nom, numéro affiché, fuseau horaire.
- Invitations de collaborateurs, rôles, création/révocation de clés API et double authentification.

### Campagnes et contacts

- Création, planification, lancement, pause et reprise de campagnes.
- Import CSV de contacts dans une campagne brouillon ou planifiée.
- Normalisation des numéros, déduplication et prise en compte de la liste noire.
- Export CSV réel des résultats d'une campagne.
- Protection contre le double appel du même contact lorsque deux schedulers se déclenchent en même temps (`FOR UPDATE SKIP LOCKED`).
- Liste de contacts propre à chaque campagne dans son détail.
- Recherche de contacts par nom, numéro, ville ou segment depuis l'annuaire.

### Appels Vapi et données réelles

- Déclenchement des appels via Vapi avec l'assistant dynamique configuré par Sonara.
- Webhook Vapi sécurisé par secret/HMAC et gestion idempotente des événements de fin d'appel.
- Sauvegarde des statuts, durée, résumé, coût, transcription technique et URL d'enregistrement côté serveur.
- Les appels de test sont séparés des appels de campagne : ils n'impactent pas les KPIs ni les crédits clients.
- Réconciliation des appels bloqués : le job récupère les statuts Vapi et corrige les appels test ou campagne restés à `RINGING`/`IN_PROGRESS`.
- Historique des appels de test dans l'onglet Campagnes.
- Les appels de test terminés précédemment ont été réconciliés en base.

### Analytics et résultats

- Les questions de campagne sont persistées dans `campaign_questions`.
- Les réponses structurées, thèmes et sentiment remontés par Vapi sont stockés dans `call_insights`.
- Le détail d'une campagne affiche désormais les vraies données disponibles : taux de réponse, durée moyenne, sentiment, thèmes, réponses par question, villes et statuts.
- Filtres d'historique des appels : tous, terminés, non joignables, messagerie et échecs.
- Aucune écoute ni téléchargement de transcription/enregistrement n'est proposé dans le dashboard client, par choix de confidentialité.

### Rapports

- Génération manuelle d'un rapport CSV pour une campagne ou toutes les campagnes.
- Bouton de génération présent dans l'onglet Rapports et dans le détail de chaque campagne.
- Rapport construit à partir des appels, contacts, statuts, coûts, résumés, réponses et insights disponibles.
- Création d'un enregistrement `Report` en base avec état `GENERATING`, `READY` ou `FAILED`.
- Fichier CSV placé dans un bucket Supabase Storage privé (`sonara-reports`), créé automatiquement si nécessaire.
- Téléchargement via une route authentifiée : un autre compte ne peut pas accéder au fichier.
- Notification créée quand un rapport est prêt.
- Création et activation/désactivation de programmations de rapports depuis le dashboard.
- Le job de programmation génère les rapports dans le dashboard. Les destinataires email sont conservés pour la future étape d'envoi.

### Dashboard et support

- Notifications réelles chargées depuis la base, marquage lu et navigation vers la zone pertinente (rapport, campagnes, facturation ou paramètres).
- Live monitoring alimenté par les appels réellement en cours ; la latence audio reste non affichée tant qu'elle n'est pas fournie de façon fiable par Vapi.
- Support : création de tickets et lecture des statuts de services depuis la base.

## Tests automatisés déjà effectués

- `npm run build` : réussi.
- `npm test` : 21 tests réussis.
- Déploiements Vercel récents : état `Ready` observé après les pushes sur `main`.

## Recette manuelle à effectuer sur Vercel

Utiliser de préférence deux comptes différents : un compte de démonstration existant avec données et un compte nouvellement créé vide.

### 1. Isolation et compte

- Créer un nouveau compte.
- Vérifier que le dashboard est vide : aucune campagne, aucun appel, aucune notification, aucun rapport d'une autre entreprise.
- Vérifier que le prénom/nom s'affiche correctement dans le dashboard et les paramètres.
- Modifier le profil et envoyer un avatar JPG, PNG ou WebP inférieur à 1 Mo.
- Se déconnecter puis se reconnecter : avatar, nom et paramètres doivent rester présents.

### 2. Campagne et contacts

- Créer une campagne brouillon.
- Télécharger le modèle CSV, importer quelques contacts valides.
- Vérifier le nombre de contacts, la ville, le segment et les doublons ignorés.
- Vérifier la recherche dans l'onglet Contacts.
- Ouvrir la campagne et vérifier que seuls ses contacts apparaissent dans l'onglet Contacts de la campagne.
- Tester pause/reprise uniquement sur une campagne en cours.
- Télécharger l'export CSV de campagne et vérifier son contenu dans Excel/Google Sheets.

### 3. Appel test et statuts

- Lancer un appel test avec un numéro autorisé par Twilio/Vapi.
- Vérifier qu'il apparaît dans `Campagnes > Appels test`.
- Après la fin de l'appel, actualiser l'écran : le statut doit devenir `COMPLETED`, `FAILED`, `NO_ANSWER`, etc., et ne pas rester indéfiniment sur sonnerie.
- Vérifier résumé/durée quand Vapi les fournit.
- Si le statut reste bloqué plus de quelques minutes, vérifier le webhook Vapi et le job `/api/jobs/reconcile-calls` dans les logs Vercel.

### 4. Résultats d'une campagne

- Lancer une petite campagne réelle avec consentement des contacts.
- Vérifier que chaque appel met à jour son statut dans le détail de campagne.
- Tester les filtres d'appels.
- Vérifier que les KPIs, la durée moyenne, les thèmes et les réponses changent uniquement quand de vraies données sont disponibles.
- Ne pas attendre une valeur de sentiment si le fournisseur Vapi/LLM ne renvoie pas de donnée structurée : l'interface doit afficher un tiret, pas une donnée inventée.

### 5. Rapports

- Ouvrir `Dashboard > Rapports`.
- Générer un rapport global puis un rapport sur une campagne contenant des appels.
- Vérifier l'apparition du rapport et son état `READY`.
- Télécharger le CSV et vérifier les lignes de synthèse puis les lignes d'appels.
- Vérifier qu'un autre compte ne peut pas télécharger ce rapport.
- Créer une programmation quotidienne, hebdomadaire ou mensuelle avec une adresse email valide.
- Vérifier qu'elle apparaît dans la liste et que le bouton d'activation fonctionne.

### 6. Paramètres et permissions

- Avec un administrateur : créer une invitation, une clé API et activer la 2FA.
- Avec un utilisateur `VIEWER` : vérifier qu'il ne peut pas exporter une campagne, modifier les programmations, créer de clé API ni modifier la campagne.
- Révoquer une clé API et vérifier qu'elle disparaît des clés actives.

## Variables et services à vérifier sur Vercel

Ne jamais coller de secrets dans Git, les documents ou les captures d'écran.

- `DATABASE_URL` : URL Supabase Pooler valide avec SSL.
- `SUPABASE_URL` et `SUPABASE_SECRET_KEY` : nécessaires pour avatars et rapports.
- `APP_URL` et `NEXT_PUBLIC_APP_URL` : URL publique Sonara, jamais `localhost` en production.
- `VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `VAPI_WEBHOOK_SECRET` : appels et webhooks.
- Clé Gemini/OpenRouter selon le fournisseur LLM choisi.
- Clé ElevenLabs et voix configurées si cette voix est utilisée.
- `INTERNAL_JOB_KEY` : jobs internes.
- `CRON_SECRET` : nécessaire pour une exécution Vercel Cron/cron externe sécurisée.
- `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN` : rate limiting partagé entre les fonctions Vercel.
- `RESEND_API_KEY` et `REPORT_EMAIL_FROM` : envoi des notifications de rapports programmés. Le lien renvoie vers le dashboard authentifié ; aucune donnée client n'est jointe à l'email.
- `E2E_ADMIN_EMAIL` et `E2E_ADMIN_PASSWORD` : uniquement dans l'environnement sécurisé des tests Playwright, jamais dans Git.

## Optimisations fiabilité — 21 août 2026

- Si le webhook final Vapi manque, la réconciliation consulte désormais l'appel distant et restaure le statut, la transcription, le résumé et les insights de la campagne.
- Les analyses incomplètes des sept derniers jours peuvent être réparées depuis Vapi sans redébiter le crédit ni incrémenter une seconde fois les tentatives.
- `CallInsight.providerMeta` conserve la qualité de l'analyse (`COMPLETE`, `PARTIAL`, `MISSING`), sa source et la latence conversationnelle mesurée.
- Le live monitoring affiche la capacité réellement imposée par le serveur et une latence moyenne uniquement lorsqu'elle repose sur des échantillons horodatés.
- Les rapports programmés peuvent envoyer un email via Resend ; sans configuration email, ils restent disponibles dans le dashboard.
- Les appels test et imports CSV ont un rate limit dédié. Les créations/révocations de clés, suppressions de membres et exports créent une trace de sécurité persistante.
- Les anciens composants et fichiers de démonstration non utilisés ont été supprimés. Les identifiants E2E sont chargés depuis l'environnement.

## Limites connues et prochaines étapes

### À faire avant commercialisation

- Configurer et valider le domaine d'envoi Resend pour activer les emails de rapports programmés en production.
- Ajouter un vrai système de paiement Mobile Money/abonnement : le module de paiement actuel est une simulation.
- Mettre en place les limites de crédits selon le plan, une fois le paiement défini.
- Ajouter une politique de conservation/suppression des transcriptions et enregistrements, consentement et export/suppression des données client.
- Configurer les variables Upstash sur Vercel pour activer le rate limit partagé ; un fallback local reste actif en développement.
- Ajouter suivi d'erreurs et alertes (Sentry ou équivalent).

### À faire après passage à Vercel payant

- Configurer un Cron Vercel régulier pour le scheduler de campagnes, la réconciliation et les rapports programmés.
- Définir la fréquence selon le volume réel d'appels.
- Vérifier les limites d'exécution Vercel et la concurrence Vapi/Twilio.

### Onboarding proposé pour la prochaine étape

Après inscription, afficher un parcours court avant le premier dashboard :

1. rôle / métier ;
2. comment le client a connu Sonara ;
3. objectif principal ;
4. taille approximative de la liste de contacts ;
5. tutoriel de création de première campagne.

Ces réponses devront être persistées par entreprise, sans bloquer le compte si l'utilisateur choisit de passer l'étape.
