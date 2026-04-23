# HQ

## 1. Identité
- Nom canonique: HQ
- ID technique: `hq`
- Branche: `economy`
- Rôle exact: gate global de progression bâtiment + normalisation de durée de construction (équivalent Senate).
- Niveau max: 25.

## 2. Coûts / temps / population
- L1: coût `0/0/0`, temps `0s`, population `1`.
- L25: coût `6077/6884/3283`, temps `46114s`, population `8`.
- Progression: coûts/temps globalement croissants; population croît de 1 à 8 (avec paliers répétés).
- Anomalie détectée: aucune valeur non-monotone sur HQ.

## 3. Prérequis
- Config: aucun prérequis additionnel, `unlockAtHq=1`.
- Runtime: `isBuildingUnlockedForTargetLevel` retourne directement `true` pour `hq`.
- Mismatch: aucun.

## 4. Effet attendu vs runtime réel
- Attendu: rôle Senate pour accélérer les autres constructions.
- Runtime: `getConstructionDurationSeconds` applique le ratio Senate pour les autres bâtiments.
- Règle critique vérifiée: HQ **n’accélère pas son propre upgrade** (`senateMultiplier=1` si building=`hq`).

## 5. Population (logique réelle)
- Où définie: `populationCost` par niveau de table.
- Calcul `used` bâtiment: valeur du niveau courant uniquement (`currentRow.populationCost`).
- Nature: requirement de population libre.
- Vérification runtime: `canStartConstruction` compare `requiredPopulation = max(0, targetPop-currentPop)` à `getPopulationSnapshot(state).free`.
- Blocage réel: oui, retour `Not enough population` si insuffisant.
- UI: la fiche bâtiment affiche la population incrémentale `Population + (target-current)` pour le prochain niveau.

## 6. UI / visuel
- Coûts affichés: oui (coût runtime affiché via calcul de coût de construction).
- Temps affichés: oui (`formatDuration` sur durée runtime).
- Population affichée: oui (population incrémentale `Population + (target-current)`).
- Effets affichés: aucun effet direct sur fiche niveau (normal pour HQ table).
- Asset: `/assets/HQ.png` (présent, non manquant).

## 7. Verdict
**OK** — logique population désormais alignée parité stricte (niveau courant + requirement incrémental).

## 8. Sources
- Grepolis Senate (support): https://support.innogames.com/kb/Grepolis/en_DK/3266
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/render/modes/CityFoundationMode.ts`
