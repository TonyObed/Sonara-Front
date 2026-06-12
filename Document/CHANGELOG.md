# SONARA — Journal des changements majeurs

> Ce fichier retrace tous les grands changements apportés au projet.
> Il sert de fil conducteur pour retrouver l'état du projet à tout moment.

---

## [v0.4] — 2026-06-11 · Corrections navigation auth
**Commit :** `e7174f0` + modifications non commitées

### Changements
- **`src/app/page.tsx`** — Ajout d'un lien **"Se connecter"** (`/login`) dans la navbar
- **`src/app/page.tsx`** — Le bouton **"Commencer"** transformé en `<a>` pointant vers `/signup`
- **`src/app/page.tsx`** — Le bouton hero principal changé de `/dashboard` → `#demo` ("Voir une Démo")
- **`src/components/auth/AuthPage.tsx`** — Suppression du `onClick={switchMode}` qui bloquait la navigation entre `/login` et `/signup`
- **`src/components/auth/AuthPage.tsx`** — Nettoyage : suppression de la fonction `switchMode` devenue inutile

---

## [v0.3] — 2026-06-11 · Suppression du Dashboard Next.js (revert)
**Commit :** `e7174f0`

### Contexte
Le dashboard Next.js implémenté précédemment a été supprimé pour permettre l'intégration d'une nouvelle version redesignée.

### Fichiers supprimés
- `src/app/dashboard/` — toutes les routes (home, campaigns, contacts, analytics, settings)
- `src/components/dashboard/` — tous les composants (ActivityChart, CallModal, DashboardSidebar, DashboardTopbar, Icon, NotifPanel, Primitives, SentimentDonut)
- `src/lib/sonara-data.ts` — données mock du dashboard

### Sauvegarde
Un commit de backup existe : **`94e4d7b`** — contient la version complète du dashboard supprimé.  
Pour restaurer : `git checkout 94e4d7b -- src/app/dashboard src/components/dashboard src/lib`

---

## [v0.2] — 2026-06-11 · Intégration des pages Auth (Connexion / Inscription)
**Commit :** `94e4d7b` (inclus dans le backup)

### Fichiers créés
| Fichier | Rôle |
|---|---|
| `src/app/(auth)/layout.tsx` | Layout transparent pour le groupe auth (sans navbar landing) |
| `src/app/(auth)/login/page.tsx` | Route `/login` — charge `AuthPage` en mode connexion |
| `src/app/(auth)/signup/page.tsx` | Route `/signup` — charge `AuthPage` en mode inscription |
| `src/components/auth/AuthPage.tsx` | Composant principal : formulaire + carousel témoignages |
| `src/components/auth/AuthPage.module.css` | Styles CSS Module dédiés à la page auth |
| `src/components/auth/ParticleGrid.tsx` | Animation de grille de particules (panneau droit) |

### Design
- Split-screen : formulaire à gauche / témoignages + particules à droite
- Basculement entre login et signup via Next.js `Link` (navigation réelle)
- Police : Satoshi + Space Mono
- Social login : Google + Microsoft (UI uniquement, non fonctionnel)
- Validation côté client (email, mot de passe ≥ 8 chars, nom/entreprise en signup)

---

## [v0.1] — 2026-06-11 · Intégration Next.js de la landing page
**Commit :** `f9c7c9d`

### Contexte
Migration de la landing page HTML statique vers Next.js (App Router).

### Changements majeurs
- Conversion du HTML en TSX React (`src/app/page.tsx`)
- Navbar en français, liens internes
- Intégration Turbopack (Next.js 16.2.7)
- Gestion des states React : thème clair/sombre, carousel, pricing toggle, FAQ, simulateur d'appel

---

## [v0.0] — Initial · Landing page statique + Branding
**Commit :** `4676ce7` puis `dc4e442`

### Contenu initial
- Landing page HTML/CSS statique (`src/app/page.tsx` — original)
- Assets branding : logos Sonara dans `public/Branding bard sonara/`
- Vidéo hero : `public/test 1.mp4`
- Corrections : bug logo click, latence vidéo, contraste mode clair, animations texte

---

## Architecture actuelle (état stable)

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx          ← Layout vide pour le groupe auth
│   │   ├── login/page.tsx      ← Route /login
│   │   └── signup/page.tsx     ← Route /signup
│   ├── globals.css             ← Styles globaux landing page
│   ├── layout.tsx              ← Layout racine Next.js
│   └── page.tsx                ← Landing page principale (/)
│
└── components/
    └── auth/
        ├── AuthPage.tsx         ← Composant formulaire auth
        ├── AuthPage.module.css  ← CSS Module auth
        └── ParticleGrid.tsx     ← Animation particules

public/
├── Branding bard sonara/       ← Logos, branding PDF
├── test 1.mp4                  ← Vidéo hero (background)
└── test 2.mp4                  ← Vidéo alternative

Dashboard/                      ← ⚠️ À IMPLÉMENTER (nouvelle version)
```

---

## Prochaine étape prévue
- [ ] Implémenter le nouveau dashboard (`src/app/dashboard/`) basé sur le nouveau design
