# Defensive Wall

## 1. Résumé
- ID technique: `defensive_wall`
- Nom affiché runtime: `Defensive Wall`
- Branche: `defense`
- Inspiration produit: Grepolis `Wall`
- Règle Coinage: bonus mur **uniquement** pour unités issues du `barracks`, en **défense de ville**.

## 2. Prérequis et identité
- Déblocage: `HQ >= 5`.
- Prérequis additionnel Coinage (remplacement Temple): `barracks >= 3`.
- Niveau max: 25.
- Asset UI: `/assets/walls.png`.
- Mapping Grepolis: progression/courbe Wall-like, avec adaptation explicite Temple→Barracks.

## 3. Table runtime (niveau 1 et progression)
- L1: `ore 400 / stone 350 / iron 200`, `80s`, `populationCost=2`.
- Effets L1 (runtime):
  - `groundWallDefensePct = 3.7`
  - `groundWallBaseDefense = 1.5`
- Progression: 25 niveaux, courbe monotone sur coûts/temps/population/effets.

## 4. Population (runtime + UI)
- Occupation bâtiment = coût population du niveau courant.
- Upgrade = delta `targetPopulationCost - currentPopulationCost`.
- UI de construction affiche la population incrémentale issue du runtime.

## 5. Effet runtime réel du mur
- Le mur expose désormais des stats dédiées scope terrestre:
  - `groundWallDefensePct`
  - `groundWallBaseDefense`
- Application runtime:
  - **uniquement** pour unités `requiredBuildingId='barracks'`
  - **uniquement** en contexte `city_defense`
  - n’affecte pas les unités `space_dock`
  - n’ajoute aucun bonus offensif.
- Formule appliquée aux défenses terrestres:
  - `defense = (defenseBase + groundWallBaseDefense) * (1 + groundWallDefensePct/100)`

## 6. Comparaison Grepolis / décision produit
- Grepolis Wall applique un bonus défensif de ville et requiert Temple 3.
- Coinage conserve l’esprit Wall-like mais remplace Temple par `barracks >= 3` (Temple absent du jeu).
- Décision tranchée: adaptation Coinage assumée, cohérente avec le split défensif voulu:
  - `defensive_wall` = défense des unités Barracks,
  - `skyshield_battery` = pendant défensif Space Dock.

## 7. Tests de scope attendus
- prereq `HQ 5 + barracks 3`
- bonus mur sur unités Barracks en `city_defense`
- aucun bonus pour unités Space Dock
- aucun bonus en contexte `offense`
- base defense terrestre appliquée

## 8. Sources code
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomySystem.test.ts`
- `src/game/render/modes/CityFoundationMode.ts`
