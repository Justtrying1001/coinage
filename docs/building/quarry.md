# Quarry

## 1. Identité
- Nom canonique: Quarry
- ID technique: `quarry`
- Branche: `economy`
- Rôle exact: production `stone/h` (équivalent Quarry Grepolis).
- Niveau max: 40.

## 2. Coûts / temps / population
- L1: coût `1/3/2`, temps `2s`, population `1`.
- L40: coût `3008/2877/5553`, temps `83277s`, population `4`.
- Progression: coûts/temps/population croissants par paliers; pas de non-monotonicité détectée.

## 3. Prérequis
- Config: aucun prérequis additionnel, `unlockAtHq=1`.
- Runtime: vérification HQ + prereqs dans `canStartConstruction`; aucun prereq spécifique quarry.
- Mismatch: aucun.

## 4. Effet attendu vs runtime réel
- Attendu: produire stone/h.
- Runtime: `getProductionPerHour` lit `quarry.effect.stonePerHour`.
- Claim offline: `applyClaimOnAccess` crédite stone selon production horaire puis clamp aux caps via `getStorageCaps`.

## 5. Population (logique réelle)
- Où définie: `populationCost` dans table quarry.
- Calcul `used` bâtiment: valeur du niveau courant uniquement.
- Nature: requirement de population libre.
- Vérification runtime: `canStartConstruction` bloque si `requiredPopulation = max(0, targetPop-currentPop)` dépasse `free`.
- Blocage réel: oui (`Not enough population`).
- UI: affiche la population incrémentale `Population + (target-current)` sur prochain niveau.

## 6. UI / visuel
- Coûts/temps/population affichés: oui dans le panneau bâtiment.
- Rendement stone affiché: basé sur `getProductionPerHour` runtime.
- Asset bâtiment: `/assets/stone.png` (présent).

## 7. Verdict
**OK** — production/claim/clamp/population/UI cohérents après correction population.

## 8. Sources
- Grepolis Quarry (support): https://support.innogames.com/kb/Grepolis/en_DK/3275
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/render/modes/CityFoundationMode.ts`
