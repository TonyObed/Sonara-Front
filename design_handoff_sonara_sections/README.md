# Handoff : Sonara — Sections Landing Page (migration Next.js)

## Overview

Ce package documente **7 sections de landing page** pour Sonara, un SaaS ivoirien d'agents vocaux IA (enquêtes et appels sortants automatisés, marché Côte d'Ivoire). Ces sections s'insèrent **sous un hero existant** (non inclus, déjà géré côté client) :

1. **Stats** — chiffres clés avec compteurs animés
2. **How It Works** — fonctionnement en 4 étapes
3. **Use Cases** — 6 cas d'usage sectoriels
4. **Interactive Simulator** — simulateur d'appel scénarisé (pièce maîtresse interactive)
5. **Platform Showcase** — dashboard mocké dans un cadre navigateur
6. **Integrations Marquee** — double marquee horizontal de logos
7. **Testimonials Wall** — mur de témoignages en colonnes verticales défilantes

## About the Design Files

⚠️ **Les fichiers de ce bundle sont des références de design créées en HTML** — des prototypes montrant l'apparence et le comportement attendus, **pas du code de production à copier tel quel**. La tâche consiste à **recréer ces designs dans votre codebase Next.js** en utilisant ses patterns établis (App Router, composants React, Tailwind si présent, etc.).

Le fichier `design/Sonara Sections.dc.html` est le prototype de référence. Il contient :
- Tout le markup avec styles inline (entre `<x-dc>` et `</x-dc>`)
- Toute la logique dans une classe `Component` (dans le `<script type="text/x-dc">` en bas de fichier) : données des scénarios du simulateur, machine à états, génération des marquees et du mur de témoignages
- Les keyframes CSS et media queries dans le bloc `<style>` du haut

Ouvrez-le dans un navigateur pour voir le comportement de référence. Ignorez `support.js`, `<x-dc>`, `{{ ... }}`, `<sc-for>`, `<sc-if>` — ce sont les mécanismes du prototype ; en Next.js ce sont des composants React standards avec JSX (`.map()`, ternaires, `useState`).

## Fidelity

**High-fidelity (hifi).** Couleurs, typographie, espacements, contenus et interactions sont finaux. Recréer au pixel près. Les seuls éléments placeholder sont signalés : citations des témoignages (fictives), photos Unsplash, logos d'intégrations via favicons Google.

---

## Design Tokens

### Couleurs
| Token | Valeur | Usage |
|---|---|---|
| `bleu-primaire` | `#0052FF` | Accent principal : CTA, eyebrows, compteur −75%, carte étape 03, waveform, barres de progression, anneaux d'avatars |
| `bleu-hover` | `#0041CC` | Hover du bouton principal du simulateur |
| `noir-fond` | `#121212` | Fond des sections sombres (01, 03, 05, 07) + carte d'appel du simulateur |
| `gris-clair` | `#F4F4F2` | Fond des sections claires (02, 06) + panneau analyse du simulateur |
| `blanc` | `#FFFFFF` | Fond section 04, cartes sur fond clair |
| `blanc-65` | `rgba(255,255,255,0.65)` | Paragraphes d'intro sur fond sombre |
| `blanc-60` | `rgba(255,255,255,0.6)` | Légendes des stats, descriptions de cartes sombres |
| `noir-60` | `rgba(18,18,18,0.6)` | Paragraphes d'intro sur fond clair |
| `bordure-sombre` | `rgba(255,255,255,0.14)` à `0.16` | Bordures de cartes / séparateurs sur fond sombre |
| `rouge-sentiment` | `#D14343` | Sentiment négatif (simulateur) |
| `vert-statut` | `#1F9D55` | Pastille « appel terminé » (simulateur) |
| `bleu-clair-resume` | `#5C8AFF` / `#9DBAFF` | Labels dans la carte résumé sombre du simulateur |

Alternance des fonds : 01 sombre → 02 clair → 03 sombre → 04 blanc → 05 sombre → 06 clair → 07 sombre.

### Typographie
| Rôle | Police | Taille | Graisse | Détails |
|---|---|---|---|---|
| Titres H2 de section | **Satoshi** | `clamp(34px, 4.6vw, 60px)` | 900 | `line-height: 1.04; letter-spacing: -0.02em` |
| Paragraphe d'intro | Satoshi | `clamp(16px, 1.6vw, 19px)` | 400 | `line-height: 1.6; max-width: 560px` |
| Eyebrow (« 01 — CHIFFRES CLÉS ») | **JetBrains Mono** | 12px | 700 | `letter-spacing: 2.5px; color: #0052FF` |
| Gros chiffres (stats) | Satoshi | `clamp(52px, 5.5vw, 80px)` | 900 | `letter-spacing: -0.03em; line-height: 1` |
| Légendes stats / méta | JetBrains Mono | 13px | 400 | `line-height: 1.65` |
| Titres de cartes | Satoshi | 21–22px | 700 | `letter-spacing: -0.01em` |
| Corps de cartes | Satoshi | 15px | 400 | `line-height: 1.6` |
| Labels techniques (10–11px) | JetBrains Mono | 9–13px | 400–700 | `letter-spacing: 1–2.5px`, souvent uppercase |

Chargement : Satoshi via Fontshare (`https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900`), JetBrains Mono via Google Fonts (400/500/700). En Next.js : `next/font` recommandé (JetBrains Mono dispo dans `next/font/google` ; Satoshi en `next/font/local` ou link Fontshare).

### Espacements & rythme
- Padding vertical de section : `clamp(80px, 9vw, 130px)` ; horizontal : `clamp(20px, 5vw, 48px)`
- Largeur max du contenu : **1180px**, centré
- Gap titre → contenu : `clamp(44px, 5vw, 70px)` (stats : `clamp(48px, 6vw, 80px)`)
- En-tête de section : colonne flex, `gap: 18px`, `max-width: 760px`
- Gaps de grilles : 16–22px ; stats : `44px 36px`

### Rayons & ombres
- Cartes : **22px** (étapes/cas d'usage), **24px** (témoignages), **26px** (simulateur)
- Petites tuiles dashboard : 13–14px ; pills/boutons : `999px`
- Cadre navigateur : 18px, `box-shadow: 0 40px 100px rgba(0,0,0,0.55)`, bordure `rgba(255,255,255,0.16)`
- Hover témoignage : `0 25px 50px -12px rgba(0,0,0,0.5)`
- `::selection` : fond `#0052FF`, texte blanc

---

## Screens / Sections

### 01 — Stats (fond `#121212`)
- En-tête : eyebrow `01 — CHIFFRES CLÉS` + H2 « Le centre d'appels, sans le centre d'appels. » + paragraphe
- Grille : `repeat(auto-fit, minmax(min(100%, 230px), 1fr))` → 4 colonnes desktop, 2 tablette, 1 mobile
- Chaque stat : `border-top: 1px solid rgba(255,255,255,0.16)`, `padding-top: 26px`, chiffre énorme + légende JetBrains Mono 13px
- Données : **−75%** (en bleu #0052FF) coûts vs centre d'appels · **<10 min** premiers résultats · **~40 F** CFA/appel (vs 150 000–300 000 FCFA/agent/mois) · **100%** appels transcrits
- **Compteurs animés** : de 0 à la valeur cible en 1,8s (`power2.out`) au scroll (préfixes/suffixes : `−`, `<`, `~`, `%`, ` min`, ` F` conservés pendant l'animation)

### 02 — Fonctionnement (fond `#F4F4F2`, texte `#121212`)
- H2 : « De votre brief aux résultats, en 4 étapes. »
- 4 cartes `minmax(min(100%, 250px), 1fr)`, fond blanc, radius 22px, padding `30px 28px`, structure interne : label `ÉTAPE 0X` (JetBrains Mono 13px bleu) … gap 60px … titre 21px + description 15px
- **La carte Étape 03 est inversée** : fond `#0052FF`, texte blanc — c'est le moment « magique » (l'IA appelle)
- Hover : `translateY(-6px)`, transition 0.3s ease
- Contenus exacts dans le fichier HTML (étapes : Décrivez votre enquête / Importez vos contacts / L'IA mène les appels / Exploitez les résultats)

### 03 — Cas d'usage (fond `#121212`)
- H2 : « Pensé pour les secteurs qui appellent. »
- 6 cartes `minmax(min(100%, 310px), 1fr)` → 3×2 desktop. Cartes **outline** : fond transparent, `border: 1px solid rgba(255,255,255,0.14)`, radius 22px
- Structure : volume estimé en haut (JetBrains Mono 11px, ex. « 5 000 – 20 000 APPELS / MOIS ») … gap 46px … titre 22px + description
- Hover : `border-color: #0052FF; background: rgba(0,82,255,0.07)`, transition 0.3s
- Secteurs : Banques & Microfinance · Télécoms · Assurances · Instituts d'études · E-commerce & Retail · Administrations & ONG (volumes et descriptions exacts dans le HTML)

### 04 — Simulateur d'appel (fond `#FFFFFF`) ⭐ composant interactif principal
Deux colonnes `minmax(min(100%, 340px), 1fr)` + rangée d'onglets au-dessus.

**Onglets scénario** (Banque / Télécom / Assurance) : pills `padding: 12px 24px; border-radius: 999px`. Actif : fond `#121212`, texte blanc. Inactif : transparent, `border: 1px solid rgba(18,18,18,0.25)`. Changer d'onglet **réinitialise** la simulation.

**Carte d'appel** (gauche, fond `#121212`, radius 26px, min-height 540px, flex column) :
- Header : avatar icône Sonara 44px (radius 12px) + « Awa » 16px/700 + « Agent vocal · {société} » JetBrains Mono 11px + **waveform** (5 barres 3×20px bleues, `scaleY` 0.25→1 en boucle 0.9s, délais ×0.12s, `animation-play-state: paused` + opacité 0.35 quand l'appel ne tourne pas) + **timer** `MM:SS`
- Zone transcript : scrollable (`max-height: 380px`), auto-scroll vers le bas à chaque message. Bulles max-width 80%, label 9px uppercase au-dessus du texte 14px :
  - IA : alignée à gauche, fond `rgba(255,255,255,0.08)`, texte `#EDEDED`, radius `4px 18px 18px 18px`
  - Client : alignée à droite, fond `#0052FF`, blanc, radius `18px 4px 18px 18px`
- Indicateur de frappe : 3 points 7px, opacité 0.25→1 en boucle (1.1s, délais ×0.18s), aligné du côté du prochain locuteur
- Footer : bouton pleine largeur `#0052FF` radius 999px — libellés : « ▶ Lancer la simulation » → « Appel en cours… » → « ⟲ Rejouer la simulation » ; mention « SIMULATION — AUCUN APPEL RÉEL » (10px)

**Panneau analyse** (droite, fond `#F4F4F2`, radius 26px, padding 28px) :
- Header : « ANALYSE EN TEMPS RÉEL » + pastille de statut (bleue pulsante = en cours, verte = terminé, grise = attente) + texte statut
- 2 tuiles blanches : DURÉE (timer) et RÉPLIQUES (`n / total`)
- Jauge **SENTIMENT CLIENT** : barre 8px radius 999px, largeur = valeur %, couleur : `#D14343` si <42, `#7A7A7A` si <60, `#0052FF` sinon ; label texte (Neutre/Frustré/Positif…) ; transition `width 0.7s ease`
- **POINTS CLÉS DÉTECTÉS** : apparaissent au fil de l'appel (cartes blanches radius 12px, coche ronde bleue 18px)
- **Carte résumé finale** (apparaît à la fin) : fond `#121212`, label « RÉSUMÉ AUTOMATIQUE — GÉNÉRÉ EN 1,8 S » en `#5C8AFF`, résumé 14px, pill « ACTION SUGGÉRÉE : … » (fond `rgba(0,82,255,0.18)`, bordure `rgba(0,82,255,0.5)`, texte `#9DBAFF`)

**Déroulement** : voir « State Management » ci-dessous. Les 3 scénarios complets (scripts de 8–9 répliques, points clés avec index de déclenchement `at`, courbe de sentiment, résumé, action suggérée) sont dans l'objet `scenarios` de la classe `Component` du HTML — à extraire tel quel dans un fichier de données TS.

### 05 — Plateforme (fond `#121212`)
- H2 : « Tout le terrain, dans un seul dashboard. »
- **Cadre navigateur** : barre `#1B1B1B` avec 3 pastilles 11px + URL centrée `app.sonara.ci/campagnes` (pill `#121212`, JetBrains Mono 11px)
- **Entrée animée 3D** : conteneur `perspective: 1400px` ; le cadre part de `rotationX: 12°, y: 70px, opacity: 0` → neutre en 1.2s `power3.out` au scroll
- Layout interne (min-height 480px) :
  - **Sidebar** 208px fond `#161616` : logo blanc 96px, nav (Accueil / **Campagnes** actif avec fond `rgba(0,82,255,0.22)` + point bleu / Contacts / Rapports / Paramètres), carte « CRÉDIT RESTANT : 8 752 appels » en bas. **Masquée < 760px** (classe `.son-dash-side`)
  - **Contenu** fond `#F5F5F3` : titre « Campagnes » + bouton « + Nouvelle campagne » (pill bleue) ; 4 tuiles KPI (APPELS AUJOURD'HUI 1 248 +12% / TAUX DE RÉPONSE 68% +4pts / CAMPAGNES ACTIVES 3 / SENTIMENT MOYEN 7,4/10) — **2 colonnes < 760px** ; liste de 3 campagnes avec barres de progression et badges de statut (En cours bleu / Terminée gris / Planifiée gris clair) ; rangée du bas `1.4fr 1fr` (**1 colonne < 760px**) : bar chart SVG 7 jours (6 barres grises + dernière bleue) + bloc « EN DIRECT » avec 3 appels en cours (pastilles bleues pulsantes décalées 0/0.4/0.8s, numéros masqués `+225 07 58 •• •• 41`, durées)
- Tout le dashboard est **statique** (mock visuel), seules les pastilles pulsent (`opacity 1→0.3`, 1.4s)

### 06 — Intégrations (fond `#F4F4F2`)
- H2 : « Adossé aux meilleurs, branché à vos outils. » — section **crédibilité** : technologies utilisées + outils clients connectés
- **Double marquee horizontal** (gap 16px) :
  - Rangée A (gauche→) : OpenAI, ElevenLabs, Deepgram, Africa's Talking, Twilio, Supabase, PostgreSQL, Vapi
  - Rangée B (sens inverse) : Wave, WhatsApp Business, Salesforce, HubSpot, Zoho CRM, Google Sheets, Microsoft Excel, Slack
- Chips : fond blanc, bordure `rgba(18,18,18,0.08)`, radius 999px, `padding: 14px 28px 14px 18px`, **logo 28px** (radius 7px) + nom Satoshi 15px/700, `margin-right: 14px`
- Animation : liste dupliquée ×2, `translateX(0 → −50%)` (inverse pour la rangée B), **38s linear infinite** ; fondu latéral par `mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)`
- ⚠️ Logos actuels = favicons Google (`https://www.google.com/s2/favicons?domain=<domaine>&sz=64`) — **placeholder**. En production : SVG officiels des press kits, stockés en local
- La section sort du conteneur 1180px (pleine largeur) ; seuls en-tête et pied restent dans le conteneur

### 07 — Témoignages (fond `#121212`)
- En-tête **centré** : badge pill « 07 — TÉMOIGNAGES » (bordure `rgba(0,82,255,0.45)`, padding 8px 18px) + H2 « Ce qu'en disent les équipes. » + paragraphe
- **3 colonnes verticales défilantes** (gap 18px, max-width 380px/colonne), conteneur `max-height: 660px; overflow: hidden` avec `mask-image: linear-gradient(to bottom, transparent, #000 9%, #000 91%, transparent)`
- Chaque colonne : contenu dupliqué ×2, animation `translateY(0 → −50%)` linéaire infinie — durées **26s / 34s / 30s** (vitesses différentes = effet de profondeur)
- **Pause au survol** de la colonne (`animation-play-state: paused`)
- Cartes : fond `rgba(255,255,255,0.05)`, bordure `rgba(255,255,255,0.12)`, radius 24px, padding 28px ; citation 15px/1.6 `rgba(255,255,255,0.85)` entre guillemets français « » ; avatar photo 42px rond avec bordure `2px solid rgba(0,82,255,0.6)` + nom 14px/700 + rôle JetBrains Mono 10.5px
- Hover carte : `translateY(-8px) scale(1.02)` + ombre + bordure bleue, transition 0.35s `cubic-bezier(0.16, 1, 0.3, 1)`
- Responsive : colonne 3 masquée < 1024px, colonne 2 masquée < 700px
- ⚠️ **Les 9 témoignages sont fictifs** (textes dans `_testimonialWall()` du HTML) et les photos sont des stock Unsplash — à remplacer par de vrais clients avant mise en production

---

## Interactions & Behavior

### Reveals au scroll (toutes sections)
- Tout élément marqué `data-reveal` : `opacity: 0, y: 36px` → `opacity: 1, y: 0`, **0.9s `power3.out`**, déclenché quand l'élément atteint **88% du viewport**, une seule fois
- Décalages en cascade : attribut `data-reveal="0.08"` etc. = delay en secondes (pas de 0.06–0.08s entre cartes sœurs)
- Implémentation actuelle : **GSAP 3.12 + ScrollTrigger** (CDN). En Next.js : `npm i gsap` + `useGSAP` (`@gsap/react`) dans des client components, ou IntersectionObserver maison

### Compteurs (section 01)
- Objet `{v: 0}` tweené vers la valeur cible, 1.8s `power2.out`, trigger à 90% viewport, `onUpdate` écrit `prefix + Math.round(v) + suffix` dans le span

### Simulateur — déroulement d'une lecture
1. Clic « Lancer » : reset (`shown=0, seconds=0, finished=false, playing=true`) + démarrage d'un `setInterval` 1s pour le timer
2. Boucle par réplique : indicateur de frappe (950ms si IA, 750ms si client) → la réplique apparaît → pause de `420 + longueurTexte × 13` ms → réplique suivante
3. Auto-scroll du transcript à chaque ajout
4. Sentiment et points clés se mettent à jour selon l'index de réplique atteint (champ `at` des données)
5. Fin de script : `playing=false, finished=true` → pastille verte, carte résumé apparaît, bouton passe en « Rejouer »
6. Changement d'onglet : tout est annulé (clear des timeouts/interval) et remis à zéro
- **Important : nettoyer tous les timers** au changement de scénario et à l'unmount (sinon fuites/chevauchements)

### Marquees (sections 06 et 07)
- CSS pur (`@keyframes` + duplication du contenu) — pas besoin de JS
- Keyframes : `son-marquee` / `son-marquee-rev` (horizontal, 38s), `son-vscroll` (vertical, 26/34/30s)
- Recommandé : ajouter `@media (prefers-reduced-motion: reduce)` pour désactiver (non présent dans le prototype)

### Responsive
- Grilles en `auto-fit/minmax` → adaptation fluide sans breakpoints pour les sections 01–04
- Breakpoints explicites : **760px** (sidebar dashboard masquée, KPIs en 2 col, rangée du bas en 1 col), **1024px** / **700px** (colonnes témoignages)
- Mobile vérifié à 390px : aucun débordement horizontal

---

## State Management

Un seul composant interactif : le **simulateur**. État requis :

```ts
type ScenarioKey = 'banque' | 'telecom' | 'assurance';
interface SimState {
  scenario: ScenarioKey;   // onglet actif
  shown: number;           // nb de répliques affichées
  typing: boolean;         // indicateur de frappe visible
  playing: boolean;        // lecture en cours
  finished: boolean;       // script terminé (affiche le résumé)
  seconds: number;         // timer MM:SS
}
```

Données par scénario (à extraire du HTML vers `data/scenarios.ts`) :
```ts
interface Scenario {
  company: string;                                  // ex. "Banque Lagune"
  contact: string;                                  // ex. "M. Koné"
  script: { who: 'ia' | 'client'; text: string }[]; // 8–9 répliques
  points: { at: number; text: string }[];           // insights, déclenchés à l'index `at`
  sentiment: { at: number; val: number; label: string }[]; // courbe 0–100
  summary: string;                                  // résumé final
  action: string;                                   // pill action suggérée
}
```

Pas de fetching : tout est statique/local. Refs : un ref sur le conteneur du transcript pour l'auto-scroll (`scrollTop = scrollHeight` — **ne pas utiliser `scrollIntoView`**).

## Assets

| Fichier | Usage |
|---|---|
| `assets/logo-blanc.png` | Logo Sonara blanc — sidebar du dashboard (96px) |
| `assets/icone-sombre.png` | Icône carrée Sonara — avatar d'Awa dans le simulateur (44px, radius 12px) |
| `assets/logo-noir.png` | Logo noir (réserve, non utilisé dans ces sections) |
| Favicons Google (`google.com/s2/favicons?domain=…&sz=64`) | Logos d'intégrations — **placeholder, remplacer par les SVG officiels** |
| Photos Unsplash (URLs dans `_testimonialWall()`) | Avatars témoignages — **placeholder, remplacer par de vraies photos** |

## Files

- `design/Sonara Sections.dc.html` — prototype de référence complet (markup + styles + logique + données des 3 scénarios + 9 témoignages)
- `assets/` — logos Sonara
- Ce `README.md`

## Suggestions de découpage Next.js (indicatif)

```
app/(marketing)/page.tsx          // assemble: <Hero/> (existant) + sections
components/sections/StatsSection.tsx
components/sections/HowItWorksSection.tsx
components/sections/UseCasesSection.tsx
components/sections/CallSimulator/    // index.tsx, CallCard.tsx, AnalysisPanel.tsx, useSimulation.ts
components/sections/PlatformShowcase.tsx
components/sections/IntegrationsMarquee.tsx
components/sections/TestimonialsWall.tsx
components/ui/SectionHeader.tsx       // eyebrow + h2 + paragraphe (pattern répété 7×)
components/ui/Reveal.tsx              // wrapper GSAP/IntersectionObserver
data/scenarios.ts
data/testimonials.ts
data/integrations.ts
```

Sections 01–03, 05–07 peuvent être des Server Components avec un petit wrapper client pour les reveals ; le simulateur (04) est un Client Component (`'use client'`).
