# Warehouse

## 1. Identité / mapping
- ID runtime: `warehouse`
- Nom affiché: `Warehouse`
- Équivalent Grepolis cible: **Warehouse**
- Branche: `economy`
- Asset UI: `/assets/warehouse.png`
- Statut visuel: **OK** (pas de fallback)

## 2. Table de progression
- Prérequis: aucun prérequis additionnel (`unlockAtHq=1`)
- Niveau max: 35
- L1: coût `0/0/0`, temps `0s`, population `0`, effet `storageCap=300/300/300`
- Progression:
  - coûts: croissants
  - temps: croissants
  - population: reste `0` sur tous les niveaux
  - effet: storage cap croît de `300` à `28142`
- Anomalies évidentes détectées: aucune (pas de doublon bloquant/non-monotonicité)

## 3. Runtime réel
- Effet appliqué: `getStorageCaps` retourne `warehouse.effect.storageCap` du niveau courant.
- Impact claim/load/clamp:
  - claim offline clamp les ressources au cap courant (`applyClaimOnAccess` + `getStorageCaps`),
  - chargement persistence clamp aussi au cap courant (`toEconomyState` via `getStorageCaps`).
- Si stock > cap: stock réduit au cap (ore/stone/iron).
- Population corrigée:
  - occupation bâtiment = coût pop du niveau courant (warehouse = 0),
  - requirement upgrade = `max(0, targetPop-currentPop)` (warehouse = 0).

## 4. UI réelle
- Prochain coût: affiché via coût runtime (`getConstructionCostResources`)
- Prochain temps: affiché via durée runtime (`getConstructionDurationSeconds`)
- Prochaine population: affichée incrémentale (`Population + (target-current)`), donc `+0` pour warehouse
- Effet: affiché via `Storage cap O:x S:y I:z`
- Affichage des caps stockage: cohérent avec `getStorageCaps` (header + sections)
- Wording trompeur détecté: aucun spécifique warehouse

## 5. Verdict
**OK** — warehouse est cohérent bout en bout (data/runtime/UI/doc) avec l’équivalent Grepolis.

## 6. Sources
- Grepolis Warehouse (support): https://support.innogames.com/kb/Grepolis/en_DK/3281
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
