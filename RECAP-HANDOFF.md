# RECAP HANDOFF — Sonara (état au passage à une nouvelle discussion)

## Où on travaille
- **Projet combiné** : `C:\Users\Administrator\Desktop\Sonara-Full`
  - Clone frais du frontend `github.com/TonyObed/Sonara-Front` (origin = Sonara-Front).
  - Le **backend** y a été intégré progressivement depuis `C:\Users\Administrator\Desktop\Gem 2 Sonara`
    (origin = `Gem-2-Sonara`), qui sert de **source du backend**.
- **Branche de travail** : `implementation` (PAS poussée sur GitHub — décision en attente).
  - Commits : `bd46d81` (Gemini : backend + setup tests + payment stub MVP) →
    `4730e8f` (docs ECC recentrées Sonara + tests validation + données dashboard) →
    `ca3e316` (OAuth + mot de passe oublié/reset + 2FA).

## Ce qui est FAIT et vérifié (build ✓, 14 tests ✓)
- **Backend complet** intégré et commité : `src/app/api/**` (27 routes), `src/lib/*`
  (auth, db, vapi, validation, response, rate-limit, api-client, oauth, dashboard-adapters),
  `prisma/`, `src/proxy.ts`, `src/hooks/useSonara.ts`, `scripts/`.
- **Auth complète** :
  - Email/mot de passe (login/register) branchés sur l'API réelle (`AuthPage.tsx`).
  - **OAuth Google + Microsoft** : `src/lib/oauth.ts` + `/api/auth/oauth/[provider](/callback)`,
    branché sur les cookies JWT custom, state CSRF, crée/retrouve Company+User par email
    (hash aléatoire pour comptes OAuth, **pas de migration DB**). Boutons câblés.
  - **Mot de passe oublié** → API réelle + page `/reset-password` (route-group `(auth)`).
  - **2FA login** → étape code 6 chiffres → `/api/auth/2fa/verify`.
  - Logout → `api.auth.logout()`.
- **Dashboard** : profil/entreprise/campagnes/KPIs câblés sur l'API (`DashboardContext`),
  repli demo conservé pour vues non câblées (contacts/rapports/live).
- **Création de campagne** (`campaigns/new`) câblée de bout en bout : `api.campaigns.create`
  + import CSV réel (`/api/campaigns/[id]/contacts`, fichier ou CSV démo) + `api.campaigns.launch`.
  Testé OK contre Supabase (create 201 → 2 contacts → launch RUNNING → visible dans la liste).
- **Sécurité** (déjà solide côté backend) : HMAC webhook, JWT/bcrypt cost 12, cookies
  httpOnly+secure+sameSite:strict, rate-limit, zod, headers, anti-énumération.
  Docs `SECURITY.md`/`AGENTS.md`/`RULES.md` recentrées sur Sonara (avant : copies verbatim d'ECC).
- **Paiement = stub MVP** : recharge « Wave CI » simulée dans `billing/page.tsx`, CTAs « (Mode MVP) ».
- **Tests** : vitest (`tests/validation.test.ts` = 13 tests numéros CI + auth) + playwright (e2e landing).

## État des identifiants (.env, gitignoré)
- **Supabase** : ✅ live (DATABASE_URL/DIRECT_URL, mot de passe `@`→`%40`). Données seedées :
  1 entreprise, 2 users, 3 campagnes, 10 contacts.
- **JWT secrets** : ✅ générés.
- **Vapi** : ✅ configuré (clé valide, numéro `+15722316719` importé, id `ca49aabf-…`).
- **Twilio** : ⚠️ compte `…beac` en **mode TRIAL** → erreur **21219** (ne peut appeler que des
  numéros vérifiés). **Bloquant pour les appels réels** → upgrade payant requis (CI déjà activée géographiquement, solde 14,35 $).
- **OAuth Google/Microsoft** : ❌ **vides** → boutons affichent « non configuré ».

## Identifiants de test
- Login : `admin@banquexyz.ci` / `Sonara2026!`

## Problème signalé : « Jest worker … child process exceptions »
- C'est un **crash du worker de compile du serveur dev Next.js**, pas l'OAuth (avec creds Google
  vides, le flux redirige vers `/login?error=oauth_non_configure`, il n'atteint pas Google).
- Correctifs à essayer :
  1. Arrêter le dev, **supprimer `.next`** : `Remove-Item -Recurse -Force .next` puis `npm run dev`.
  2. Vérifier la version Node (Next 16 = Node ≥ 18.18 ; éviter une version trop récente instable).
  3. Tester un `npm run build` (prod) pour isoler une vraie erreur de compilation éventuelle.

## RESTE À FAIRE (prochaine session)
1. **Activer Google OAuth** : créer un client OAuth (Google Cloud Console), redirect URI
   `http://localhost:3000/api/auth/oauth/google/callback`, mettre `GOOGLE_CLIENT_ID/SECRET` dans `.env`.
   (Idem Microsoft via Azure si besoin.)
2. **Diagnostiquer/corriger** le crash jest-worker du dev server (cf. ci-dessus).
3. **Twilio** : passer le compte en payant pour débloquer les vrais appels (erreur 21219).
4. **Câbler les vues dashboard restantes** : détail campagne (`campaigns/[id]` → `useCampaign`
   + `useCampaignCalls`), drawer appel (`useCall`). Contacts/Rapports/Live restent en demo
   (pas d'endpoint global — données par-campagne). Landing « Demande de démo » → `api.leads.create`.
5. **Durcissement Phase 2** : refuser démarrage prod sans secrets JWT, CSP testée, rate-limit Redis.
6. **Décider** : pousser la branche `implementation` sur GitHub ou non.

## Lancer le projet
```
cd C:\Users\Administrator\Desktop\Sonara-Full
npm run dev            # http://localhost:3000
npm run build          # build prod
npm test               # vitest
```
