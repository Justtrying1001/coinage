# Phase 2 — Intégration contrôlée du design system (Claude → runtime Coinage)

_Date : 2026-04-18_

## 1) Résumé exécutable

Cette phase 2 implémente une intégration **réelle** et **progressive** du design system audité, en conservant la vérité runtime de Coinage :
- pas d’import de pages mock (`Landing.jsx`, `MapView.jsx`, `CityView.jsx`),
- pas d’ajout de branches produit,
- pas de remapping fantaisiste des assets,
- pas de réécriture du wiring métier.

Le scope a été concentré sur:
1. couche tokens globale compatible,
2. hiérarchie typographique HUD,
3. amélioration concrète de la shell `city-stitch` (top HUD, left rail, right panel, bottom strip),
4. primitives visuelles réutilisables côté styles.

## 2) Skills utilisés explicitement

- **taste-skill**: filtrage anti-template slop + renforcement de lisibilité/hiérarchie (typo, densité, contraste, états).
- **redesign-skill**: amélioration ciblée d’existant sans casser runtime ni faire un redesign total.
- **stitch-skill**: conservation de la structure shell Stitch (top/side/main/right/bottom) et amélioration de cohérence visuelle plutôt qu’un remplacement.

## 3) Ce qui a été repris depuis le design system Claude

## 3.1 Tokens / variables (couche globale)
- Ajout d’une couche `--cg-*` dans `:root` (couleurs, typo, spacing, radii, strokes, shadows, motion).
- Stratégie de transition conservatrice: mapping de compatibilité des anciennes variables (`--bg-deep`, `--cyan`, `--text-main`, etc.) vers les nouveaux tokens.
- Objectif: pouvoir migrer progressivement les surfaces existantes sans big-bang.

## 3.2 Typographie HUD
- Adoption cohérente des rôles typographiques:
  - display/UI: `--cg-font-display`
  - body: `--cg-font-ui`
  - numeric/telemetry: `--cg-font-mono`
- Renforcement des styles overline/caps/tracking sur labels HUD.
- Passage explicite des métriques (ressources, timers, pourcentages) en style mono tabulaire.

## 3.3 Patterns UI repris (sans pages mock)
- Top resource strip: item cards plus lisibles, hiérarchie label/value/rate.
- Left rail nav: états hover/active améliorés, label wrapping propre, framing d’icône/glyphe stabilisé.
- Right inspect panel: panneaux plus structurés, CTA principal brass avec état disabled explicite.
- Bottom strip: ajout de queue rows compactes avec progress bars et états (`ok`, `warn`, `brass`, `cyan`) branchés sur runtime réel.

## 4) Ce qui a été volontairement écarté

- Aucun import brut de `ui_kits/coinage_game/*.jsx`.
- Aucun branch/page mock parallèle au runtime.
- Aucune modification des sections métier (`command/economy/military/...`).
- Aucun changement de logique d’actions runtime (`startCityBuildingUpgrade`, `startCityTroopTraining`, etc.).
- Aucun système fictif ajouté.

## 5) Détail des intégrations par phase demandée

## A) Intégration tokens, pas pages
- ✅ Couche token `--cg-*` ajoutée.
- ✅ Variables historiques gardées avec alias compat.
- ✅ Aucun rename brutal multi-fichiers.

## B) Typographie et hiérarchie
- ✅ Distinction plus nette des niveaux:
  - headings/display,
  - labels/meta,
  - data/telemetry mono,
  - microcopy queue/status.
- ✅ Aucun changement de wording métier runtime.

## C) Shell city ciblée
### C.1 Top HUD
- resource strip densifié/clarifié,
- bloc meta (Population/Storage) lisible,
- boutons Galaxy/Planet/City conservés (surface affinée, logique inchangée).

### C.2 Left rail nav
- meilleure densité verticale,
- meilleur wrapping,
- états hover/active plus explicites,
- framing glyphes homogène.

### C.3 Right inspect panel
- blocs d’info plus lisibles,
- hiérarchie titre/infos/action renforcée,
- bouton principal avec feedback et disabled state clair.

### C.4 Bottom queue/status strip
- passage d’un bloc texte minimal à des rows compactes avec progression runtime calculée,
- rendu des états actifs/idle plus clair (construction/training/research/intel/runtime pressure).

## D) Primitives réutilisables
Côté CSS `city-stitch`, consolidation de primitives de style réutilisables:
- panel blocks,
- row cards de queue,
- progress tracks,
- boutons d’action,
- headers/overlines,
- metric mono helper.

Cela réduit le hardcoding visuel ad hoc sans changer les structures runtime.

## E) Garde-fous respectés
- Pas d’injection de pages mock Claude.
- Pas de refonte gameplay/branches.
- Pas de fantaisie sur assets.
- Conflits Stitch limités via upgrade visuelle de la shell existante au lieu d’un remplacement.

## 6) Fichiers modifiés

- `src/styles/globals.css`
- `src/game/render/modes/CityFoundationMode.ts`

## 7) Compromis assumés

- L’intégration reste concentrée sur la shell city et les tokens pour limiter le risque.
- Certaines améliorations profondes (composants React dédiés à la place du DOM string) sont volontairement reportées pour garder une diff maîtrisée.
- Le bouton principal right panel est uniformisé style “primary”; une future étape pourra introduire explicitement un style secondaire dédié si besoin UX.

## 8) Validation exécutée

- `npm run typecheck` ✅
- `npm run test` ✅
- `npm run build` ✅

Aucune régression détectée sur les tests `CityFoundationMode` existants.
