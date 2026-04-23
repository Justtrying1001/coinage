# Mine

## 1. Identité
- Nom canonique: Mine
- ID technique: `mine`
- Branche: `economy`
- Rôle exact: production `ore/h` (équivalent Timber Camp Grepolis).
- Niveau max: 40.

## 2. Coûts / temps / population
- L1: coût `3/2/1`, temps `2s`, population `1`.
- L40: coût `2877/4628/3448`, temps `93576s`, population `4`.
- Progression: coûts/temps/population croissants par paliers; pas de non-monotonicité détectée.

## 3. Prérequis
- Config: aucun prérequis additionnel, `unlockAtHq=1`.
- Runtime: vérification HQ + prereqs dans `canStartConstruction`; aucun prereq spécifique mine.
- Mismatch: aucun.

## 4. Effet attendu vs runtime réel
- Attendu: produire ore/h.
- Runtime: `getProductionPerHour` lit `mine.effect.orePerHour`.
- Claim offline: `applyClaimOnAccess` crédite ore selon production horaire puis clamp aux caps via `getStorageCaps`.

## 5. Population (logique réelle)
- Où définie: `populationCost` dans table mine.
- Calcul `used` bâtiment: valeur du niveau courant uniquement (mine lvl1=1, lvl2=2, lvl3=2).
- Nature: requirement de population libre.
- Vérification runtime: `canStartConstruction` bloque si `requiredPopulation = max(0, targetPop-currentPop)` dépasse `free`.
- Blocage réel: oui (`Not enough population`).
- UI: affiche la population incrémentale `Population + (target-current)` sur prochain niveau.

## 6. UI / visuel
- Coûts/temps/population affichés: oui dans le panneau bâtiment.
- Rendement ore affiché: basé sur `getProductionPerHour` runtime.
- Asset bâtiment: **manquant** (pas d’entrée `mine` dans `BUILDING_ASSETS`), fallback “No Art” affiché.

## 7. Verdict
**PARTIAL** — runtime production/population corrects; asset bâtiment mine manquant.

## 8. Sources
- Grepolis Timber Camp (support): https://support.innogames.com/kb/Grepolis/en_DK/3269
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/render/modes/CityFoundationMode.ts`
