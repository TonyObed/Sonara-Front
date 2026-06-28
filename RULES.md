# Règles — Sonara

> Adapté de [affaan-m/ecc](https://github.com/affaan-m/ecc), recentré sur Sonara.

## Toujours

- Valider les entrées et **conserver** les vérifications de sécurité existantes.
- Écrire/garder des tests sur les chemins critiques ; vérifier `npm run build` + `npm test` avant de livrer.
- Préférer des mises à jour immuables à la mutation d'état partagé.
- Suivre les patterns du dépôt (enveloppe API, hooks `useSonara`, adaptateurs) avant d'en inventer.
- Garder les contributions focalisées et bien décrites (commits conventionnels).

## Jamais

- Mettre des données sensibles (clés API, tokens, secrets, chemins système absolus) dans le code, les logs ou la sortie.
- Soumettre des changements non testés.
- Contourner une validation ou une vérification de sécurité.
- Dupliquer une fonctionnalité existante sans raison claire.
- Brancher un vrai paiement/encaissement en mode MVP (paiement simulé uniquement — voir `SECURITY.md`).

## Commits

- Format conventionnel : `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`.
- Expliquer l'impact utilisateur dans le résumé de PR.
