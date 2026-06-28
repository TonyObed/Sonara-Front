# Politique de sécurité — Sonara

> Principes adaptés depuis le repo de référence [affaan-m/ecc](https://github.com/affaan-m/ecc)
> (gagnant d'un hackathon Claude), recentrés sur le périmètre Sonara.

## Signaler une vulnérabilité

N'ouvrez **pas** d'issue publique pour une faille. Contactez l'équipe Sonara en privé
(canal interne / email du mainteneur du dépôt `Sonara-Front`). Incluez :

- fichier / route / commit concernés et étapes de reproduction depuis un checkout propre ;
- impact attendu et frontière de confiance franchie (utilisateur non authentifié, autre
  entreprise/tenant, admin…) ;
- logs de PoC avec **tokens, clés et données privées masqués**.

## Mesures de sécurité déjà en place (Phase 1)

| Domaine | Implémentation |
| --- | --- |
| **Mots de passe** | `bcrypt` cost 12 (`src/app/api/auth/register/route.ts`) |
| **Sessions** | JWT signés (`jose`), cookies `httpOnly` + `secure` (prod) + `sameSite:strict` (`src/lib/auth.ts`) |
| **2FA** | TOTP (`otplib`) + interception au login (`src/app/api/auth/2fa/*`) |
| **Protection des routes** | `src/proxy.ts` — pages `/dashboard` et API protégées exigent un access token valide ; injection `x-company-id`/`x-user-role` |
| **Isolation multi-tenant** | chaque requête est scopée par `companyId` issu du token |
| **Validation des entrées** | schémas `zod` à la frontière (`src/lib/validation.ts`) |
| **Rate limiting** | par IP/entreprise sur login, register, appels test (`src/lib/rate-limit.ts`) |
| **Webhooks Vapi** | vérification **HMAC-SHA256** à temps constant (`src/app/api/webhooks/vapi/route.ts`) |
| **Jobs internes** | `/api/jobs/call-scheduler` protégé par `x-internal-key` = `INTERNAL_JOB_KEY` |
| **En-têtes HTTP** | X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS (`next.config.ts`) |
| **Anti-énumération** | messages d'erreur identiques email/mot de passe au login |

## Gestion des secrets — règles strictes

- **Jamais** de secret en dur dans le code ni commité. Tout passe par `.env` (gitignoré).
- `.env.example` est un **modèle** : toutes les valeurs réelles (Supabase, JWT, Vapi)
  sont injectées au déploiement.
- Si un secret est commité par accident : **le révoquer immédiatement** chez le fournisseur
  (Supabase, Twilio, Vapi…) puis réécrire l'historique. Un simple revert ne suffit pas.
- Audit rapide avant commit :

  ```bash
  git diff --cached | grep -En '(SECRET|TOKEN|KEY|PASSWORD|postgres://|sk-)[^=]*=.+'
  ```

## Périmètre MVP — ce qui est volontairement bloqué/simulé

Pour la phase de tests MVP, certaines parties sont **stubées** et NE doivent pas être
considérées comme productives :

- **Paiement / facturation** : la recharge « Wave CI » (`src/app/dashboard/billing/page.tsx`)
  est **simulée** (Mode MVP) — aucun encaissement réel. CTAs tarifaires étiquetés « (Mode MVP) ».
- À brancher en Phase 2 : intégration paiement réelle (Wave/Orange Money), avant toute mise en prod.

## À durcir en Phase 2

- **CSP** : politique Content-Security-Policy testée (omise en P1 pour ne pas casser Next/Mux).
- **JWT secrets** : refuser le démarrage en production si `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET`
  sont absents (actuellement fallback dev non sécurisé dans `src/lib/auth.ts`).
- **Rate limiting** : backend distribué (Redis) au lieu de l'in-memory actuel (mono-instance).
