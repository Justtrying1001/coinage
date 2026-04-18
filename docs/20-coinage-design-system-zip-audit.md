# Audit complet — `design/Coinage Design System.zip` (phase analyse uniquement)

_Date d’audit : 2026-04-18_

## 1) Executive summary

Le zip est **majoritairement un design system HTML/CSS + UI kit React statique déjà dérivé de Coinage** (et non un design system externe totalement nouveau). Il contient :
- des tokens détaillés (`colors_and_type.css`, `ui_kits/.../tokens.css`),
- une librairie de previews atomiques (`preview/*.html`),
- des composants mock React en `.jsx` (Landing/Map/City),
- des assets bâtiments en PNG,
- un snapshot de docs/références du repo (`reference/`).

Conclusion stratégique :
- **gains immédiats** possibles sur les tokens globaux et la normalisation typographique/composants,
- **intégration ciblée** possible sur certains patterns UI City (rail, queue, inspect, strips),
- **à éviter** : reprendre les pages mock en bloc (elles sont démonstratives, pas runtime-first) et dupliquer les références déjà présentes dans le repo. 

## 2) Extraction report (contenu réel du zip)

### 2.1 Arborescence principale
- `README.md`
- `SKILL.md`
- `colors_and_type.css`
- `assets/buildings/*.png` (13 rendus)
- `preview/*.html` + `_card.css` (29 cartes de preview)
- `ui_kits/coinage_game/*` (`Landing.jsx`, `MapView.jsx`, `CityView.jsx`, `Primitives.jsx`, `tokens.css`, `index.html`, `README.md`)
- `reference/*` (2 `.tsx`, `globals.css`, + docs copiées)
- `uploads/*.png` (13 images source/provenance)

### 2.2 Typologie de fichiers
- Total: **92 fichiers**
- `.html`: 29
- `.md`: 27
- `.png`: 26
- `.css`: 4
- `.jsx`: 4
- `.tsx`: 2

### 2.3 Faits structurels importants
- Le zip embarque son propre skill (`SKILL.md`) qui impose une direction visuelle HUD Coinage (cyan + brass + Rajdhani/Inter/JetBrains Mono). 
- `README.md` du zip confirme explicitement que `reference/` est un miroir de fichiers repo existants (extraits code/docs), donc **pas une source produit nouvelle**.
- `assets/buildings/` et `uploads/` contiennent la même famille d’art (version canonique + provenance), donc attention à la duplication.

## 3) Design system inventory (classé)

## 3.1 Design tokens / variables
**Présent et riche**
- Palette core, neutrals, semantic states, resource inks, borders, shadows, easing, spacing, radii, type scale dans `colors_and_type.css`.
- Tokens kit dédiés via import dans `ui_kits/coinage_game/tokens.css`.

## 3.2 Typography
**Présent et formalisé**
- Font stack: Rajdhani (display), Inter (body), JetBrains Mono (numeric/telemetry).
- Scale explicite (`--cg-fs-overline` à `--cg-fs-h1`) + tracking + line-height.
- Previews dédiées : `type-scale`, `type-display-rajdhani`, `type-body-mono`, etc.

## 3.3 Color system
**Présent et structuré**
- Core palette + cyan/brass accents + semantic states + resource colors.
- Previews dédiées (`color-core-palette`, `color-accent-cyan`, `color-accent-brass`, `color-semantic`, etc.).

## 3.4 Spacing / radius / shadows / borders
**Présent et cohérent**
- Scale spacing 4-based (`--cg-s-*`), radii (`--cg-r-*`), shadow stack (`--cg-sh-*`), strokes (`--cg-stroke-*`).
- Previews dédiées: `space-scale`, `space-radii`, `space-shadows`, `space-borders`.

## 3.5 Component library
**Présent (niveau mock/prototype avancé)**
- Boutons, chips/badges, input, panel, inspect panel, queue, rail nav, resource strip, telemetry card.
- Composants React mock dans `Primitives.jsx` + `CityView.jsx` + `MapView.jsx` + `Landing.jsx`.

## 3.6 Page mockups / shells
**Présent mais démonstratif**
- `Landing.jsx`, `MapView.jsx`, `CityView.jsx` simulent des surfaces complètes avec données locales mock.
- `index.html` orchestre les vues via mode switch localStorage.

## 3.7 Icons / iconography
**Présent sous forme glyphes unicode**
- Vocabulaire glyphes (◈ ◆ ▲ ✦ ◉ ◎ …) en README + preview iconographie.
- Pas de librairie d’icônes SVG produit complète.

## 3.8 Assets images
**Présent, utile**
- 13 PNG bâtiments dans `assets/buildings/` (canonique dans ce zip) + uploads source.

## 3.9 Documentation
**Présent en volume**
- `README.md` + `SKILL.md` du zip.
- `reference/docs/*.md` = copie des docs stratégiques déjà connues dans le repo.

## 3.10 CSS/Tailwind/variables
- CSS variables détaillées; pas de Tailwind natif ici.
- Styles majoritairement en CSS classique (tokens + classes `cg-*`).

## 3.11 React/HTML/static exports
- React `.jsx` non branché au runtime Coinage actuel (mock kit).
- HTML preview statique pour inspection visuelle.

## 3.12 “Figma-like exports / mock-only”
- Le dossier `preview/` joue ce rôle: cartes atomiques de validation visuelle, sans logique runtime.

## 4) Reusability audit (valeur par catégorie)

## 4.1 Catégorie 1 — Réutilisable directement
1. **Tokens CSS globaux** (`colors_and_type.css`) : excellente base de normalisation (naming, palette, spacing, radii, shadows, easing).
2. **Hiérarchie typo HUD** (Rajdhani/Inter/JetBrains + tracking/casing) : réutilisable immédiatement pour harmoniser labels/telemetry.
3. **Patterns de composants atomiques déjà compatibles Coinage** :
   - boutons pill + mode toggles,
   - chips/badges,
   - resource strip,
   - queue rows simples.
4. **Assets bâtiments PNG** déjà cohérents avec l’univers Coinage.

## 4.2 Catégorie 2 — Réutilisable avec adaptation
1. **Rail nav / inspect panel / panel ticks** : bons patterns, mais à porter dans la shell runtime réelle (`city-stitch`) au lieu d’injecter les mocks.
2. **Layouts City (3 colonnes 220 / 1fr / 380)** : utile mais à adapter aux contraintes réelles de données et contrôleurs actuels.
3. **Map HUD cards + event feed styling** : récupérable visuellement, mais à brancher aux vraies sources runtime.
4. **Composants `.jsx` du kit** : bonne matière de référence, mais non plug-and-play avec l’architecture actuelle.

## 4.3 Catégorie 3 — Inspiration seulement
1. **Pages complètes mock (`Landing.jsx`, `MapView.jsx`, `CityView.jsx`)** : intéressantes pour composition/UI tone, mais trop statiques pour intégration directe.
2. **Certaines valeurs visuelles “showcase” de preview** (glow/effets) : à doser pour lisibilité runtime.
3. **`reference/`** : utile pour contexte, pas pour import produit.

## 4.4 Catégorie 4 — À ne pas utiliser tel quel
1. **Copie brute de `reference/docs` et `reference/*.tsx`** : redondant, risque de divergence et confusion source-of-truth.
2. **Remplacement global en une fois via `ui_kits`** : casserait la logique existante (contrôleurs, états, événements, tests).
3. **Import direct de toutes classes `cg-*` sans mapping progressif** : risque élevé de collision style/cohérence avec la shell Stitch déjà active.

## 5) Compatibility with current Coinage codebase

## 5.1 Niveau global (tokens/variables)
Compatibilité forte:
- Le `src/styles/globals.css` actuel et `reference/globals.css` du zip sont quasi-alignés, ce qui indique une filiation directe.
- Intégration possible: migrer progressivement vers des tokens `--cg-*` consolidés pour réduire les hardcoded rgba et homogénéiser ombres/bordures.

Points d’attention:
- garder les alias existants (`--bg-deep`, `--cyan`, etc.) pendant une phase de transition,
- éviter une bascule brutale qui casserait les surfaces déjà testées.

## 5.2 Niveau composants
Peut être branché proprement:
- boutons mode, chips, resource cards, queue strips, panel blocks,
- section headers/titles + badges état,
- right-panel blocks (inspect / production / adjacency patterns).

Demande adaptation:
- props/data contracts alignés sur `cityEconomySystem` + `CityFoundationMode` actuel,
- éviter le style inline local des mocks; extraire en classes système.

## 5.3 Niveau pages/shell
- Les shells du zip sont utiles comme **spécification visuelle**, pas comme implémentation runtime.
- Intégration recommandée: reprendre la grille et les blocs de structure, mais conserver la logique de montage de `CityFoundationMode` / `CoinageRenderApp`.

## 5.4 Conflits avec Stitch déjà intégré
Compatibles avec la shell Stitch actuelle:
- langage visuel HUD (bleu acier + cyan + brass rare),
- navigation de branche, strips, panneaux inspect,
- iconographie glyphes et style console tactique.

Conflits possibles:
- classes globales `cg-*` injectées sans namespace (risque de collision avec `.city-stitch*`),
- duplication de patterns de nav/topbar déjà corrigés récemment,
- re-introduction de mock pages pouvant diluer la cohérence runtime Stitch.

Améliorations possibles pour Stitch:
- renforcer tokens et états visuels normalisés,
- ajouter “corner ticks” et standard de stroke/shadow sur les panneaux clés,
- unifier typographie mono pour toutes valeurs chiffrées.

## 6) Focus sur les éléments les plus intéressants

## 6.1 Typographie
Observé dans le zip:
- Display: Rajdhani 500/600/700 (majuscule + tracking large)
- Body: Inter 400/500/600
- Mono: JetBrains Mono 400/500/600
- Echelle: H1 clamp 2.7–5.3rem, H2 1.75rem, H3 1.25rem, body 0.88rem, caption 0.72rem, overline 0.62rem

Valeur pour Coinage:
- Très bonne adéquation HUD/command-console.
- Plus robuste que l’état actuel pour stabiliser hiérarchie micro-UI (labels/meta/chiffres).
- Point à arbitrer: le skill “taste” global bannit Inter en premium; ici Inter reste cohérent avec l’identité Coinage actuelle. Donc **dans ce projet précis, conserver Inter pour body est acceptable** tant que la hiérarchie display/mono est stricte.

## 6.2 Charte graphique
Forces:
- Palette nocturne maîtrisée, accent cyan clair, brass rare pour hiérarchie forte.
- Contrastes globalement lisibles en dark HUD.
- Système de bordures/strokes/shadows structuré.

Risques:
- Surutilisation possible de glows si reprise sans règle.
- certains tons de resource inks (violet shards) doivent rester secondaires pour éviter dérive “neon template”.

## 6.3 Éléments UI premium à reprendre en priorité
1. rail nav branch states (active/locked)
2. queue slots avec barre de progression + états
3. inspect/right panel en blocs compacts
4. resource strip mono/chiffré
5. panel treatment (stroke + gradient + léger blur)
6. corner ticks sur panneaux de telemetry

## 6.4 Cohérence système ou patchwork ?
Verdict: **quasi-vrai design system**, pas un simple collage.
- Pourquoi: tokens structurés, previews atomiques, composants récurrents, règles de voix/ton et iconographie explicites.
- Limite: le kit React reste orienté prototype (pas branché au runtime produit), donc ce n’est pas une librairie prête à plugger.

## 7) Recommended integration roadmap (sans casser le repo)

## Niveau 1 — Gains immédiats, faible risque
1. Aligner les tokens globaux (`--cg-*`) et créer une table de mapping depuis variables existantes.
2. Standardiser typo mono pour toutes valeurs numériques HUD.
3. Harmoniser styles boutons/chips/tabs avec variantes actives/disabled.
4. Introduire un pattern commun `panel` + `section header`.

## Niveau 2 — Intégrations ciblées, forte valeur
1. Reprendre le rail nav visuel (states + densité) dans city shell.
2. Reprendre queue/status strips et right-panel blocks.
3. Affiner top HUD (resource strip + meta) sans changer le wiring mode.
4. Unifier cards de stats avec naming/tokens cohérents.

## Niveau 3 — À repousser
1. Import des pages complètes mock du kit (`Landing/Map/City`) en bloc.
2. Refonte totale du shell runtime.
3. Fusion brute des dossiers `reference/` et docs du zip dans la vérité produit.

## Ce qu’il faut reprendre d’abord
- Tokens + typographie + états composants.

## Ce qu’il ne faut surtout pas reprendre tout de suite
- pages mock complètes et structure app du kit.

## Ce qui peut servir plus tard
- previews HTML comme bibliothèque de patterns visuels pour nouvelles features.

## 8) File list inspected + commands run

### 8.1 Fichiers inspectés (principaux)
- `design/coinage-design-system/README.md`
- `design/coinage-design-system/SKILL.md`
- `design/coinage-design-system/colors_and_type.css`
- `design/coinage-design-system/ui_kits/coinage_game/README.md`
- `design/coinage-design-system/ui_kits/coinage_game/tokens.css`
- `design/coinage-design-system/ui_kits/coinage_game/Primitives.jsx`
- `design/coinage-design-system/ui_kits/coinage_game/CityView.jsx`
- `design/coinage-design-system/preview/component-buttons.html`
- `design/coinage-design-system/preview/component-rail-nav.html`
- `design/coinage-design-system/preview/component-queue.html`
- `design/coinage-design-system/preview/type-scale.html`
- `design/coinage-design-system/preview/brand-iconography.html`
- `design/coinage-design-system/preview/brand-building-art.html`
- `src/styles/globals.css`
- `src/components/game/GameShell.tsx`
- `src/components/landing/LandingHero.tsx`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/18-cityview-stitch-audit-correction.md`
- `docs/19-cityview-hud-shell-audit-fix.md`

### 8.2 Commandes exécutées
- `pwd && rg --files -g 'AGENTS.md'`
- `find .. -name AGENTS.md -maxdepth 4`
- `rg --files`
- `unzip -o "skill/taste-skill-main.zip" -d skill/taste-skill-main && rg --files skill/taste-skill-main`
- `sed -n '1,220p' skill/taste-skill-main/taste-skill-main/skills/taste-skill/SKILL.md`
- `sed -n '1,220p' skill/taste-skill-main/taste-skill-main/skills/redesign-skill/SKILL.md`
- `sed -n '1,260p' skill/taste-skill-main/taste-skill-main/skills/stitch-skill/SKILL.md`
- `unzip -o "design/Coinage Design System.zip" -d design/coinage-design-system`
- `find . -maxdepth 4 -type f | sed 's#^./##' | sort` (dans dossier extrait)
- `python` (script de comptage des extensions et top-level)
- `sed -n ...` sur les fichiers listés en 8.1

## 9) Application explicite des skills demandés
- **taste-skill**: utilisé pour filtrer “premium vs template slop” (cohérence tokens, densité, lisibilité, hiérarchie).
- **redesign-skill**: utilisé pour estimer ce qui est réutilisable sans refonte totale ni casse fonctionnelle.
- **stitch-skill**: utilisé pour comparer alignement/conflits avec la shell Stitch déjà intégrée dans le runtime city.

Aucune intégration produit n’a été effectuée dans cette phase (audit only).
