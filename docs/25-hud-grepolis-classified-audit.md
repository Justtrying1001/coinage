# HUD Grepolis Comparative Audit + Classified Correction Plan

## Executive summary
Audit comparatif effectué entre le HUD Coinage runtime actuel et la référence Grepolis fournie, puis implémentation d’une refonte top HUD + correction Classified. L’objectif est atteint via un rail supérieur unifié, une hiérarchie gauche→centre→droite plus nette, un view switch icon-first déplacé à gauche, et un overlay Classified premium sans blur agressif.

## Inputs analyzed
- Runtime Coinage: `CityFoundationMode.ts`, `globals.css`, `GameShell.tsx`.
- Visual references: `design/stitch_coinage_city_management_interface.zip`.
- Design primitives: `design/Coinage Design System.zip`.
- Skills: `stitch-skill`, `redesign-skill`, `taste-skill`.
- Screenshot HUD Grepolis fourni dans la tâche.

## Grepolis vs Coinage mismatch report (zone by zone)
### 1) Global top shell composition
- **Grepolis**: rail continu, framing unique, perception “cockpit”.
- **Coinage (avant)**: segments encore lus comme boîtes successives.
- **Correction**: conversion en cadre unifié (`hud-frame`) + séparateurs internes.

### 2) View switch placement and ergonomics
- **Grepolis**: switch de vue près du bloc gauche, icon-first.
- **Coinage (avant)**: pills textuelles plutôt déportées et plus “dashboard”.
- **Correction**: switch déplacé à gauche dans segment dédié, boutons icon-dominant + label court.

### 3) Center anchor
- **Grepolis**: point d’ancrage central évident.
- **Coinage (avant)**: bloc contexte présent mais trop “segment texte”.
- **Correction**: center anchor renforcé (framing visuel corners + contraste local) pour stabiliser la lecture.

### 4) Resource readability
- **Grepolis**: lecture rapide via icônes + compteurs + statut visuel.
- **Coinage (avant)**: texte correct mais iconographie/pression stockage moins directe.
- **Correction**: widget compact avec glyph ressource + amount/rate + fill bar par ressource (basé sur vraies capacités runtime).

### 5) Construction activity visibility
- **Grepolis**: activité visible sans envahir tout l’écran.
- **Coinage**: queue déjà en haut mais intégration encore perfectible.
- **Correction**: queue conservée en haut, intégrée au rail unifié et compactée.

### 6) Bottom strip utility
- **Grepolis**: pas de duplication inutile de blocs techniques en bas.
- **Coinage (objectif)**: pas de `Operations` / `Runtime status`.
- **État**: supprimés et non réintroduits.

## Classified current issues (before correction)
- blur perçu “sale”
- motif/pattern trop lourd
- duplication visuelle lourde entre zones
- sensation gimmick plutôt que “dossier scellé premium”

## Classified solution applied
- retrait du blur agressif, remplacement par occlusion matte (assombrissement/désaturation/contraste)
- voile sombre discret + trame très légère
- panneau principal court: `CLASSIFIED / ACCESS WITHHELD`
- rappel secondaire right panel en chip compact: `CLASSIFIED · TACTICAL FILE SEALED`
- interactions sous couche masquée maintenues désactivées
- branches ciblées inchangées: governance, intelligence, market, research

## What changes vs what stays unchanged
### Changed
- composition top HUD
- placement/forme du view switch
- rendu ressources
- style/placement Classified

### Not changed intentionally
- logique métier/runtime
- branches/actions existantes
- wording métier des pages
- wiring de navigation

## Skills influence report
- `stitch-skill`: garde-fou de structure shell et hiérarchie.
- `redesign-skill`: refactor incrémental sans casser runtime/tests.
- `taste-skill`: réduction des marqueurs “dev dashboard” et amélioration du rendu premium sobre.

## Commands and validation
- `npm run typecheck` → pass
- `npm run test` → pass
- `npm run build` → pass

## Files touched in this pass
- `src/game/render/modes/CityFoundationMode.ts`
- `src/styles/globals.css`
- `src/game/render/modes/CityFoundationMode.test.ts`
- `docs/25-hud-grepolis-classified-audit.md`
