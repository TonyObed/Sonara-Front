# Intégration Backend → Sonara-Front

Backend (issu de `Desktop/Gem 2 Sonara`) intégré progressivement dans le frontend
`Sonara-Front`. **Aucun commit** : tout est en working-tree, à relire avant de committer.

## ✅ Fait (fondations + auth) — build vérifié (`npm run build` OK)

### Dépendances & config
- `package.json` : deps backend ajoutées (prisma, @prisma/client, @prisma/adapter-pg,
  pg, bcryptjs, jose, otplib, qrcode, zod, papaparse, xlsx, uuid) **+ gsap conservé**.
  Scripts `db:*` et `test-call` ajoutés.
- `next.config.ts` : en-têtes de sécurité (X-Frame-Options, HSTS, etc.).
- `.gitignore` : `/src/generated` ignoré (client Prisma régénérable).
- `.env` local créé (placeholders, **gitignoré**) + `.env.example` (modèle).
- `prisma.config.ts` ajouté.

### Backend porté tel quel
- `src/app/api/**` — 27 routes (auth, campaigns, calls, company, leads, webhooks/vapi, jobs).
- `src/lib/{api-client,auth,db,rate-limit,response,validation,vapi}.ts`
  (les libs frontend existantes `sonara-data.ts`, `landing-data.ts`, `demo-data.json` intactes).
- `prisma/` (schema + seed), `scripts/`, `src/hooks/useSonara.ts`.

### Adaptations à la divergence frontend
- `src/proxy.ts` : redirections d'auth `/auth/login` → **`/login`** (route réelle de Sonara-Front).
- `src/components/auth/AuthPage.tsx` : formulaire branché sur l'API réelle
  (`api.auth.login` / `api.auth.register`) au lieu du mock `setTimeout`.
  Gestion des erreurs serveur (champ + global), interception 2FA, validation
  mot de passe alignée (maj + chiffre à l'inscription), redirection `?redirect=` puis `/dashboard`.
- `src/app/dashboard/layout.tsx` : bouton **Déconnexion** branché sur `api.auth.logout()`
  (vide les cookies httpOnly) puis redirige vers `/login`.

### Dashboard — câblage progressif (commencé)
- `src/lib/dashboard-adapters.ts` (nouveau) : adaptateurs API → formes `demo-data.json`
  (statuts `RUNNING→live`…, dates FR, taux `71%`).
- **Page liste Campagnes** (`dashboard/campaigns/page.tsx`) : alimentée par `useCampaigns()`
  + `mapApiCampaignToFront`, avec **repli sur les données demo** si non authentifié / erreur.

## ⏳ Étape suivante (progressive) : reste du dashboard

Continuer à brancher **une vue à la fois** via `src/hooks/useSonara.ts` + adaptateurs :
- **Détail campagne** (`campaigns/[id]`) : `useCampaign(id)` + `useCampaignCalls(id)`.
  ⚠️ L'UI utilise `insights`/`breakdown` (analytics IA) **non encore exposés par l'API** —
  ces blocs resteront en demo tant que le backend ne les fournit pas.
- **Appels / drawer** : `useCall(id)` — attention `Call.id` front `number` ↔ API `string`,
  et champs `mood`/`action` absents de l'API.
- **Accueil (KPIs)** : `useUsage()` pour le crédit (`kcr`) et les compteurs.
- **Contacts / Rapports / Settings** : endpoints dédiés à mapper.

Recommandation : tester chaque vue avec une vraie base Supabase renseignée dans `.env`.

## Pour faire tourner réellement
1. Renseigner `.env` (Supabase `DATABASE_URL`/`DIRECT_URL`, secrets JWT, clés Vapi…).
2. `npm run db:generate` puis `npm run db:push` (ou `db:migrate`), `npm run db:seed`.
3. `npm run dev` → tester `/signup`, `/login`, accès protégé `/dashboard`.

## Source du backend
Copie de référence : `C:\Users\Administrator\Desktop\Gem 2 Sonara` (origin `Gem-2-Sonara`).
Ce dossier (`Sonara-Full`) a pour origin `Sonara-Front`.
