<!-- BEGIN:nextjs-agent-rules -->
# Next.js 16 — attention aux changements de rupture

Cette version a des changements de rupture (APIs, conventions, structure de fichiers)
par rapport aux données d'entraînement. Notamment : le middleware s'appelle désormais
`proxy.ts` (voir `src/proxy.ts`). Vérifier la doc Next 16 avant d'écrire du code.
<!-- END:nextjs-agent-rules -->

# Sonara — Instructions pour agents / contributeurs

Plateforme d'enquêtes vocales IA (Côte d'Ivoire). Frontend Next.js 16 + backend API
intégré (App Router), PostgreSQL/Supabase via Prisma 7, orchestration voix via Vapi.

> Lignes directrices adaptées du repo de référence [affaan-m/ecc](https://github.com/affaan-m/ecc).

## Principes

1. **Sécurité d'abord** — valider toutes les entrées, ne jamais affaiblir une vérif existante. Voir `SECURITY.md`.
2. **Tester avant de livrer** — un changement ne passe que si `npm run build` + `npm test` passent.
3. **Immutabilité** — créer de nouveaux objets plutôt que muter l'état partagé.
4. **Suivre les patterns existants** avant d'en inventer (enveloppe API, hooks, adaptateurs).
5. **Périmètre MVP** — paiement simulé, pas de prod. Ne pas brancher de vrai encaissement sans validation.

## Stack & structure

```
src/app/            Pages (App Router) + API routes sous src/app/api/**
src/components/      Composants UI (auth, dashboard, landing)
src/lib/             Backend (auth, db, vapi, validation, response, rate-limit) + clients/adaptateurs
src/hooks/           Hooks data (useSonara)
src/proxy.ts         Protection des routes (ex-"middleware" Next 16)
prisma/              schema.prisma + seed
tests/               vitest (unit) + tests/e2e (playwright)
```

## Avant tout commit

- Aucun secret en dur (clés, mots de passe, tokens) — tout via `.env` (gitignoré).
- Toutes les entrées utilisateur validées (schémas `zod` dans `src/lib/validation.ts`).
- Requêtes DB paramétrées (Prisma) — pas de SQL concaténé.
- Auth/autorisation vérifiées ; isolation par `companyId`.
- Les messages d'erreur ne fuitent pas de données sensibles.
- `npm run build` **et** `npm test` passent.

## Enveloppe API (à respecter)

Toutes les routes renvoient `{ success, data?, error?, meta? }` via `src/lib/response.ts`.
Côté front, consommer via `src/lib/api-client.ts` (dépaquette l'enveloppe, lève `ApiError`).

## Style

- Fichiers focalisés (< ~400 lignes), fonctions courtes, peu d'imbrication.
- Gérer les erreurs à chaque niveau : message clair côté UI, log détaillé côté serveur, jamais d'erreur avalée en silence.
- Commits conventionnels : `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
