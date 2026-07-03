# RECAP HANDOFF — Sonara (état au 3 juillet 2026)

## Où on travaille
- **Projet combiné** : `C:\Users\Administrator\Desktop\Sonara-Full` (origin = Sonara-Front).
- **Branche de travail** : `implementation` (PAS poussée sur GitHub — décision en attente).
- **Document budget de référence** : `C:\Users\Administrator\Downloads\Sonara_Budget_Stack_MVP_v1.0.docx`
  (v1.1) — décisions actées : Africa's Talking abandonné au profit d'**Orange Business en direct**,
  Twilio payé (pay-as-you-go), gpt-4o-mini, Deepgram nova-3, ElevenLabs flash_v2_5.

## Ce qui est FAIT et vérifié (build ✓, 14 tests ✓)
- **Backend complet** : 29 routes API (`src/app/api/**`), libs (`auth, db, vapi, validation,
  response, rate-limit, api-client, oauth, dashboard-adapters`), Prisma, proxy, hooks.
- **Auth complète** : email/mdp, **Google OAuth TESTÉ OK** (fix page interstitielle SameSite=Strict
  au callback), mot de passe oublié/reset, 2FA TOTP, logout. Microsoft OAuth : code prêt, clés vides.
- **Dashboard câblé sur l'API réelle** :
  - Accueil (KPIs `useUsage`), Campagnes (liste + création bout en bout + launch),
  - **Contacts** (`GET /api/contacts` — annuaire global dédupliqué par numéro, opt-out blacklist),
  - **Live** (`GET /api/calls/live` — appels en cours, polling 5 s),
  - **Détail campagne onglet Appels** (`useCampaignCalls`) + **drawer d'appel** (`useCall`,
    vraie transcription + résumé IA ; refactor `callId` number→string).
  - Restent en démo (pas de source API — Phase 2) : analytics (NPS/verbatims/villes), Rapports.
- **Landing** : formulaire newsletter du footer → `POST /api/leads` réel (capture prospects).
- **APPELS RÉELS VALIDÉS** 🎉 : 2 appels de test réussis vers de vrais numéros CI via
  `npm run test-call -- <numéro>`. Pipeline Twilio (payé) → Vapi → nova-3 + gpt-4o-mini +
  ElevenLabs. Coût constaté : ~0,07-0,12 $ côté Vapi par appel de 1-2 min.
- **Latence optimisée (2 passes)** : flash_v2_5, optimizeStreamingLatency 4,
  startSpeakingPlan waitSeconds 0,2 + transcriptionEndpointingPlan (0,1/0,8/0,4),
  Deepgram endpointing 150 ms. Config validée contre l'API Vapi. À réévaluer à l'usage.
- **Skills ECC** : 12 installés (`.claude/skills/`), doublons nettoyés.

## État des identifiants (.env, gitignoré)
- **Supabase** : ✅ live + seedé. **JWT** : ✅. **Vapi** : ✅ (crédit ~9,7 $ — suffisant pour la démo).
- **Twilio** : ✅ **PAYÉ** — appels vers n'importe quel numéro CI OK. Numéro affiché = +1 US.
- **Google OAuth** : ✅ configuré et testé. **Microsoft** : ❌ vide (optionnel).
- **Modèles** : OPENAI_MODEL=gpt-4o-mini, DEEPGRAM_MODEL=nova-3, ELEVENLABS_MODEL=eleven_flash_v2_5.

## Identifiants de test
- Login : `admin@banquexyz.ci` / `Sonara2026!` (ou Google avec tonyobed360@gmail.com)

## Stratégie téléphonie (décidée)
- **Cible : SIP trunk Orange Business CI** (numéros +225) branché sur Vapi en BYO SIP.
  Document de consultation prêt : `Downloads\Sonara_Exigences_SIP_Trunk_v1.0.docx`.
  MTN/Moov Business en concurrence. Africa's Talking = plan B écarté pour l'instant.
- En attendant : Twilio payé (+1 affiché), acceptable pour la démo.

## RESTE À FAIRE
1. **Démo clients** : ElevenLabs Starter (6 $) avant la démo ; RDV Orange Business (doc prêt).
2. **Couverture tests** : e2e flux auth→campagne ; tests unitaires adaptateurs/endpoints récents.
3. **Durcissement Phase 2** : CSP, rate-limit Redis, migrations Prisma versionnées (`db push` actuel).
4. **Phase 2 produit** : analytics IA (insights/breakdown API), Rapports, paiement réel Wave/OM.
5. **Décider** : pousser `implementation` sur GitHub ou non.
6. **Déploiement** (plus tard) : Render (backend) + Netlify/Cloudflare Pages — **Vercel Hobby
   interdit en usage commercial**. Supabase Pro (25 $) dès le pilote client.

## Lancer le projet
```
npm run dev            # http://localhost:3000
npm run build          # build prod
npm test               # vitest (14 tests)
npm run test-call -- 07XXXXXXXX   # appel réel de démo
```
