# SONARA — Fichiers non essentiels

> Ce fichier liste tous les fichiers du projet qui ne font **pas partie** du build Next.js
> et qui peuvent être archivés, supprimés ou ignorés sans impacter l'application.

---

## 🗂️ Fichiers de prototypage HTML (référence design uniquement)

Ces fichiers sont les **maquettes HTML statiques** originales. Ils ont été convertis en Next.js.
Ils servent de **référence visuelle** mais ne sont pas exécutés par Next.js.

| Fichier | Rôle initial | Statut |
|---|---|---|
| `Sonara - Connexion.html` | Maquette HTML de la page connexion/inscription | ✅ Converti → `src/components/auth/AuthPage.tsx` |
| `Dashboard sonara/Sonara Dashboard.html` | Maquette HTML du dashboard | ⏳ En attente d'implémentation |
| `Dashboard sonara/app.jsx` | Prototype React du dashboard | ⏳ Référence pour la prochaine implémentation |
| `Dashboard sonara/components.jsx` | Composants React du prototype | ⏳ Référence pour la prochaine implémentation |
| `Dashboard sonara/screens-home.jsx` | Écran home du prototype | ⏳ Référence |
| `Dashboard sonara/screens-detail.jsx` | Écran détail du prototype | ⏳ Référence |
| `Dashboard sonara/tweaks-panel.jsx` | Panneau de réglages du prototype | ⏳ Référence |
| `Dashboard sonara/data.js` | Données mock du prototype | ⏳ Référence |
| `Dashboard sonara/styles.css` | CSS du prototype dashboard | ⏳ Référence |

---

## 🛠️ Scripts de conversion (outils de build one-shot)

Ces scripts ont été utilisés **une seule fois** pour convertir le HTML en JSX.
Ils ne sont plus nécessaires au fonctionnement de l'application.

| Fichier | Description |
|---|---|
| `scratch/convert_html_to_jsx.js` | Convertisseur HTML → JSX |
| `scratch/fix_svg_attributes.js` | Correction des attributs SVG pour React |
| `scratch/build_page_tsx.js` | Script de génération de `page.tsx` |
| `scratch/extract.js` | Extraction de contenu HTML |
| `scratch/extract_styles.js` | Extraction des styles CSS |
| `scratch/scripts.js` | Scripts JS divers de conversion |
| `scratch/body_jsx.txt` | Fichier intermédiaire de conversion (JSX brut) |

---

## 📄 Documents texte (documentation interne)

Ces fichiers sont des **documents de référence** pour le produit, pas pour le code.

| Fichier | Description |
|---|---|
| `scratch/Sonara_CDC_Technique_Global.txt` | Cahier des charges technique global |
| `scratch/Sonara_Document_Maitre.txt` | Document maître produit Sonara |
| `scratch/doc1_text.txt` | Document texte extrait (doc1) |
| `scratch/doc2_text.txt` | Document texte extrait (doc2) |
| `scratch/doc1.zip` / `scratch/doc1/` | Archive document source |
| `scratch/doc2.zip` / `scratch/doc2/` | Archive document source |

---

## 🖼️ Assets publics non utilisés par Next.js

Ces fichiers sont dans `/public` mais ne sont **pas référencés** dans le code actuel.

| Fichier | Description |
|---|---|
| `public/file.svg` | Icône générique Next.js (starter) |
| `public/globe.svg` | Icône générique Next.js (starter) |
| `public/next.svg` | Logo Next.js (starter) |
| `public/vercel.svg` | Logo Vercel (starter) |
| `public/window.svg` | Icône générique Next.js (starter) |
| `public/test 2.mp4` | Vidéo alternative (non utilisée dans le code actuel) |

---

## 📊 Fichiers de diff (debug git)

Générés lors d'analyses de différences, non nécessaires.

| Fichier | Description |
|---|---|
| `diff.txt` | Diff git généré manuellement |
| `diff_files.txt` | Liste des fichiers du diff |

---

## 📦 Assets branding (référence, non modifiables)

Ces fichiers sont dans `public/Branding bard sonara/` et sont **utilisés** par l'app,
sauf ceux listés ici qui ne sont pas encore référencés dans le code :

| Fichier | Statut |
|---|---|
| `Sonara_Branding_01.png` à `_05.png` | Non référencés dans le code (réservés) |
| `Sonara_Logo_Noir_Sans_Fond.png` | Non référencé (version fond transparent) |
| `Sonara branding Board.pdf` | Document branding — référence design uniquement |

---

## ✅ Récapitulatif

| Catégorie | Fichiers | Action suggérée |
|---|---|---|
| Maquettes HTML | 9 fichiers | Garder comme référence, ne pas supprimer |
| Scripts de conversion | 7 fichiers | Peuvent être archivés ou supprimés |
| Documents texte | 6 fichiers | Garder comme référence produit |
| SVG/assets starters | 5 fichiers | Peuvent être supprimés |
| Fichiers diff | 2 fichiers | Peuvent être supprimés |

> ⚠️ **Recommandation** : Ne rien supprimer avant que le dashboard soit implémenté.
> Les fichiers `Dashboard sonara/` sont encore nécessaires comme référence de design.
