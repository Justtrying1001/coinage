# Planet pipeline v2 (canonique)

## Flow
1. `PlanetFamily` -> sélection d'une `FamilyRecipe` (direction artistique + contraintes physiques).
2. `FamilyRecipe` -> `PlanetClassification` + `PlanetVisualDNA` (seeds, palettes, budgets de relief/clouds/atmosphere/rings).
3. Mapping `visualDNA` -> `PlanetRenderProfile` (contrat unique pour rendu galaxy + planet view).
4. `createPlanetRenderInstance` applique une recette de mesh + shaders selon `surfaceModel` (`solid` vs `gaseous`).

## Séparation structurelle
- **Identité**: `PlanetIdentity`.
- **Génération**: `FamilyRecipe` + `PlanetVisualDNA`.
- **Rendu**: `PlanetRenderProfile`.
- **Vue**: `PlanetViewProfile` (LOD/budgets distincts galaxy vs planet).

## Masques procéduraux ajoutés
Le sampler terrain produit maintenant:
- continent, land/coast/ocean
- humidity, temperature
- erosion, crater, thermal
- band mask (géantes gazeuses)

Ces masques pilotent à la fois displacement et shading, ce qui évite l'ancienne logique “une planète = une couleur + bruit unique”.

## Règles de familles
Chaque famille a désormais sa recette dédiée (palettes, couverture océanique, amplitude relief, roughness/specular, densité atmosphère, banding, anneaux).
Les familles gazeuses (`gas-giant`, `ringed-giant`) utilisent une logique distincte (bandes/storms, displacement faible, anneaux renforcés).
