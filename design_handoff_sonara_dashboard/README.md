# Handoff : Dashboard SaaS « Sonara » → Next.js

## Overview

Dashboard B2B complet pour **Sonara**, plateforme SaaS d'appels sortants automatisés par IA vocale (marché Côte d'Ivoire). Les clients (banques, télécoms, instituts d'études) lancent des campagnes d'appels menés par une IA (« Awa »), suivent les résultats en temps réel et exploitent les analyses (sentiment, NPS, verbatims).

Périmètre couvert : 10 vues navigables + 3 modals/drawers, thème sombre/clair, responsive mobile.

## About the Design Files

⚠️ **Les fichiers de ce package sont des références de design créées en HTML** — des prototypes montrant l'apparence et le comportement attendus, **pas du code de production à copier tel quel**.

La tâche : **recréer ces écrans dans votre projet Next.js** (App Router recommandé) en utilisant vos conventions — Tailwind CSS, CSS Modules ou styled-components au choix. Le fichier `Sonara Dashboard.html` s'ouvre dans n'importe quel navigateur pour servir de référence interactive pendant le développement. `Sonara Dashboard.dc.html` contient le source annoté (template + logique JS lisible) — utile pour récupérer les valeurs exactes et la logique d'état.

## Fidelity

**High-fidelity (hifi).** Couleurs, typographies, espacements, états et micro-interactions sont finaux. Reproduire au pixel près avec votre stack.

## Architecture Next.js suggérée

```
app/
  (dashboard)/
    layout.tsx          ← Sidebar + Topbar + ThemeProvider
    page.tsx            ← Accueil (KPIs)
    campaigns/
      page.tsx          ← Liste campagnes
      new/page.tsx      ← Nouvelle campagne
      [id]/page.tsx     ← Détail (onglets: générale/résultats/appels/contacts/paramètres)
    live/page.tsx       ← Live monitoring
    contacts/page.tsx
    reports/page.tsx
    billing/page.tsx    ← Facturation & crédit
    notifications/page.tsx
    settings/page.tsx
    support/page.tsx
components/
  Sidebar.tsx, Topbar.tsx, SearchCommand.tsx, NotificationsPopover.tsx,
  ProfilePopover.tsx, ProfileModal.tsx, ConfirmDialog.tsx, ToastStack.tsx,
  KpiCard.tsx, StatusBadge.tsx, ProgressBar.tsx, VolumeChart.tsx,
  WaveformCanvas.tsx, AudioPlayer.tsx, CallDrawer.tsx, DataTable.tsx,
  NpsCard.tsx, HistogramQ1.tsx, CityBreakdown.tsx, PlanCard.tsx, FaqAccordion.tsx
lib/
  demo-data.ts          ← reprendre demo-data.json de ce package
  theme.ts
```

## Design Tokens

### Couleurs — thème sombre (défaut)

| Token | Valeur | Usage |
|---|---|---|
| `bg` | `#0B0B0C` | Fond de page |
| `side` | `#101013` | Sidebar |
| `panel` | `#141417` | Cartes, tableaux, popovers |
| `panel2` | `#17171B` | Surfaces secondaires (boutons neutres, carte crédit sidebar) |
| `inset` | `#0E0E10` | Champs de saisie, zones encastrées (waveform, brief IA) |
| `drawer` | `#121215` | Drawer détail d'appel |
| `bubble` | `#1C1C21` | Bulles de transcription côté client |
| `text` | `#FFFFFF` | Texte principal |
| `topbar` | `rgba(11,11,12,.9)` | Header |
| `bnav` | `rgba(16,16,19,.96)` | Bottom nav mobile |
| Blanc alpha | `rgba(255,255,255,.03 → .88)` | Bordures (.06/.07), séparateurs (.04/.05), texte secondaire (.45/.55/.62), etc. |

### Couleurs — thème clair

| Token | Valeur |
|---|---|
| `bg` | `#F3F4F6` |
| `side` / `panel` / `drawer` | `#FFFFFF` |
| `panel2` / `bubble` | `#EFF0F3` |
| `inset` | `#E9EAEE` |
| `text` | `#121212` |
| Les alphas blancs deviennent `rgba(18,18,18, alpha+~.03–.12)` (texte/bordures sombres) |

### Accents (les deux thèmes)

| Token | Sombre | Clair | Usage |
|---|---|---|---|
| `blue` (marque) | `#0052FF` | `#0052FF` | CTA, actif, lien — ne change pas |
| `blue2` | `#4D86FF` | `#0046DB` | Liens, icônes bleues |
| `blue3` | `#80A8FF` | `#0040C0` | Hover des liens |
| `green` | `#2BD576` | `#0E8C46` | Succès, live, sentiment positif |
| `amber` | `#FFB02E` | `#9A6B00` | Avertissement, pause |
| `red` | `#FF5C5C` | `#C53030` | Erreur, échec, opt-out |
| Gradient marque | `linear-gradient(90deg, #0052FF, #00D4A6)` | idem | Barres de progression, avatar, waveform |

Fonds de badges : couleur accent à ~11–16 % d'alpha (ex. `rgba(43,213,118,.11)`).

### Typographie

| Rôle | Police | Tailles |
|---|---|---|
| UI / titres | **Satoshi** (fontshare.com ; fallback : `sans-serif`) | h1 27px/700, titres de carte 16px/700, corps 13–14.5px/500–600, KPI 33px/700 |
| Données / labels techniques | **JetBrains Mono** (Google Fonts) | Labels 10–10.5px + `letter-spacing: .1–.14em` MAJUSCULES, valeurs 11–13px |

Letter-spacing des titres : `-.015em` à `-.02em`.

### Espacements & formes

- Rayons : cartes **16px**, boutons/champs **10–12px**, badges/pills **14–20px**, modals **17–18px**
- Padding cartes : **20–24px** ; gap de grille : **14px** ; padding page : **28px** (desktop), 18/14px (mobile)
- Ombres : CTA bleu `0 8px 24px rgba(0,82,255,.32)` ; popovers `0 24px 60px rgba(0,0,0,.35)` ; modals `0 30px 80px rgba(0,0,0,.5)`
- Sidebar : **248px** fixe ; topbar : **64px** ; bottom nav mobile : **68px**

## Screens / Views

### 1. Layout global
- Sidebar gauche 248px : logo (blanc en sombre / noir en clair — fichiers dans `assets/`), sections « VUE D'ENSEMBLE » (Accueil, Campagnes, Contacts, Rapports), « TEMPS RÉEL » (Live monitoring + badge compteur vert pulsant), « COMPTE » (Paramètres, Facturation, Aide & support), carte crédit en bas (cliquable → Facturation). Item actif : fond `rgba(0,82,255,.16)` + texte blanc.
- Topbar : burger (mobile), recherche 340px, chip « 4 appels en cours » (→ Live), toggle thème (soleil/lune), cloche avec point bleu si non-lues, avatar 36px.
- Mobile (≤1080px) : sidebar en tiroir avec scrim ; (≤720px) : bottom nav 3 items (Accueil, Campagnes, Live), recherche masquée.

### 2. Accueil
- « Bonjour, {prénom} » + date GMT Abidjan + CTA « Nouvelle campagne »
- 4 KpiCards (compteurs animés ~1,4 s ease-out au montage) : Appels aujourd'hui (1 284, +12 %), Taux de réponse (68 %, +3 pts), Campagnes actives (3), Crédit restant (12 450, ambre)
- Graphique volume (SVG 600×200) : aire dégradée bleue + ligne « Décrochés », pointillés « Tentatives », point final pulsant, sélecteur **7J/14J/30J** qui recalcule les courbes
- Carte Live monitoring : waveform canvas animée (barres verticales, gradient bleu→teal, ~25 fps via setInterval 40 ms) + 4 appels en cours avec durées qui s'incrémentent chaque seconde
- Campagnes récentes (4 lignes cliquables) + donut SVG « Issues des appels » (71 % complétés / 14 % non joignables / 9 % messagerie / 6 % refus)

### 3. Campagnes (liste)
Filtres pills (Toutes/En cours/Planifiées/Terminées), tableau : nom+secteur, badge statut, barre de progression, taux rép., sentiment coloré (vert ≥7, ambre ≥5.5, rouge <5.5), date, chevron. Min-width 880px + scroll horizontal mobile.

### 4. Détail campagne — 5 onglets
- Header : titre + badge statut + bouton **Pause/Reprendre** (Pause → ConfirmDialog ; le statut change partout) + **Export CSV** (→ toast)
- **Vue générale** : 4 KPIs, « Points clés détectés par l'IA » (3 verbatims clusterisés numérotés avec % colorés), carte Progression (37 transferts, 73 opt-out…)
- **Résultats** : NpsCard (+42, barre empilée 54/34/12 promoteurs/passifs/détracteurs), histogramme Q1 notes 0–10 (barres colorées par segment : ≥9 vert, 7–8 bleu, 5–6 ambre, <5 rouge), Q2 temps d'attente (4 barres + insight ⚠), Sentiment par ville (6 villes, barres + score coloré)
- **Appels** : tableau avec avatar initiales, heure, durée, sentiment, statut (Terminé/Transféré/Non joignable/Messagerie/Échec) ; lignes sans résumé non cliquables (opacity .55) ; clic → CallDrawer
- **Contacts** : tableau téléphones +225, segments, tentatives n/2
- **Paramètres** : règles d'appel (plage 08:00–19:00, 2 tentatives max…) + Brief IA en JetBrains Mono sur fond inset

### 5. CallDrawer (480px, droite, slide-in .32s cubic-bezier(.3,.8,.3,1))
Identité + chips (durée, sentiment n/10, humeur), **AudioPlayer** : play/pause fonctionnel — 44 barres se colorent progressivement (gradient bleu→teal), temps `0:14 / 3:24` (tick 250 ms), reset à la fermeture. Résumé IA (fond bleu 7 %), action recommandée (badge coloré ok/warn/alert), transcription en bulles IA (gauche, bleutées, avatar) / client (droite, neutres).

### 6. Live monitoring
4 KPIs (slots 4/10, file 36, latence 472 ms, taux décroché 1 h), waveform pleine largeur, 4 cartes d'appels live (durée qui défile, égaliseur 5 barres `scaleY` animées, phase alternante « L'IA parle » / « Écoute en cours »), journal d'événements horodaté.

### 7. Contacts (annuaire)
Import CSV (+ modèle), filtres segments, tableau 10 lignes : avatar, téléphone, ville, segment, nb campagnes, dernier appel, statut Actif/Opt-out.

### 8. Rapports
Grille de cartes PDF (taille, taux rép., sentiment, bouton télécharger) + rapports programmés avec toggles.

### 9. Facturation & crédit
- Carte **Plan actuel** (Business 60 FCFA/appel, badge Actif, 4 features cochées, renouvellement, « Changer de plan ↓ » → scroll doux)
- Carte **Crédit** : 12 450/20 000, barre, « 7 550 utilisés ce mois », toggle recharge auto sous 2 000, CTA « Recharger via Wave CI »
- **Consommation ce mois** : 3 barres par campagne (appels + FCFA)
- **Changer de plan** : 3 PlanCards (Starter 75 / Business 60 / Enterprise sur devis) — badge « PLAN ACTUEL », le changement de plan met à jour tout le dashboard
- **Historique** : 3 factures + lien PDF

### 10. Notifications (page + popover)
Popover (370px) : 4 dernières + « Tout marquer lu » + « Voir toutes → ». Page : groupes AUJOURD'HUI/HIER/CETTE SEMAINE, filtres Toutes(8)/Non lues(n), clic = marque lue + navigue vers la cible (billing, reports, contacts…), état vide « Tout est lu ✓ ».

### 11. Paramètres
Entreprise (**éditable** : bouton Modifier → 3 champs → Enregistrer + toast), Équipe (3/5 sièges, rôles Admin/Manager/Viewer, invitation), API & sécurité (clé masquée + Copier, webhook, HMAC-SHA256, conformité ARTCI).

### 12. Nouvelle campagne
Nom, secteur (pills), Brief IA (textarea, langage naturel), dropzone CSV (note : normalisation 07XXXXXXXX → +225...), règles d'appel, choix de voix (pills), colonne récap sticky avec **« Tester avant de lancer »** (champ numéro + bouton → état « Awa vous appelle… » pulsant ~3 s → toast) et CTA « Lancer la campagne ». Mention légale ARTCI en bas.

### 13. ProfileModal
Avatar 76px (photo uploadée recadrée carré 256px via canvas, ou initiales sur gradient), Changer/Retirer la photo, Nom, Email, rôle en lecture seule. Enregistrer → synchronise avatar topbar, popover, « Bonjour, … », liste Équipe + toast.

## Interactions & Behavior

- **Navigation** : scroll reset en haut à chaque changement de vue ; fade-up `.45s ease` sur le contenu (`translateY(14px)→0`)
- **Recherche** : filtre live campagnes (nom, secteur) + contacts (nom, ville, téléphone), max 4+4 résultats, clic navigue et vide le champ, état vide
- **Toasts** : pile en bas à droite, bord gauche 3px coloré (vert ok / ambre warn / bleu info), auto-dismiss 3,8 s
- **ConfirmDialog** : générique (titre, description, label, variante danger rouge)
- **Popovers** : fermeture au clic extérieur (scrim invisible z-65) ; un seul ouvert à la fois
- **Thème** : persisté (`localStorage: sonara-theme`), bascule topbar + interrupteur dans le popover profil, logo swap
- **Persistance démo** : compte/profil (`sonara-account`) — en prod, remplacer par votre backend
- **Animations clés** : pulse vert sur les points live (`box-shadow` 1,8 s), compteurs KPI ease-out cubique, égaliseurs `scaleY` désynchronisés, knobs de toggles `left .2s`
- **Hover** : lignes de tableau `rgba(255,255,255,.03)`, boutons neutres bordure éclaircie, liens bleu→bleu clair

## State Management

État global (Context/Zustand) : `theme`, `profile {name,email,photo}`, `company {name,phone,tz}`, `plan`, `autoRecharge`, `notifUnread[]`, `statusOverrides{campaignId:status}`, `toasts[]`, `confirm`.
État local : `searchQ`, `chartRange (7|14|30)`, `tab` du détail campagne, `callId` + `playing/playT` (lecteur), `testCall`, brouillons d'édition (entreprise/profil), `faqOpen`.
Données : tout est dans `demo-data.json` (campagnes, appels + transcription, contacts, annuaire, notifications, plans, consommation, factures, FAQ, résultats Q1/Q2/villes, données graphique 7/14/30 j).

## Assets

- `assets/logo-white.png` — logo Sonara horizontal blanc (thème sombre)
- `assets/logo-dark.png` — logo noir (thème clair)
- `assets/ear-dark.png` — pictogramme oreille (avatar IA dans la transcription)
- Icônes : SVG inline stroke 1.7–2, `stroke-linecap/linejoin: round`, 13–20px (style Lucide — utilisez `lucide-react`)

## Files

- `Sonara Dashboard.html` — **prototype autonome** (double-clic, hors-ligne, tout embarqué) : la référence interactive principale
- `Sonara Dashboard.dc.html` — source annoté : template HTML lisible + classe JS (logique d'état, données, handlers)
- `demo-data.json` — toutes les données de démo extraites, prêtes pour `lib/demo-data.ts`
- `assets/` — logos et pictogrammes
