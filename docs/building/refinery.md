# Refinery

## 1. Identité / mapping
- ID runtime: `refinery`
- Nom affiché: `Refinery`
- Équivalent Grepolis cible: **Silver Mine**
- Branche: `economy`
- Visuel asset: `/assets/refinery.png` (présent)
- Statut visuel: **OK** (pas de fallback)

## 2. Table de progression
- Prérequis: `mine >= 1`, `unlockAtHq = 1`
- Niveau max: 40
- L1: coût `ore 5 / stone 2 / iron 4`, temps `2s`, population `1`, effet `ironPerHour=8`
- Progression:
  - coûts: croissants jusqu’au niveau max
  - temps: croissants jusqu’au niveau max
  - population: `1..4` (paliers), sans baisse
  - effet: `ironPerHour` croît de `8` à `275`
- Anomalies évidentes: aucune (pas de doublon bloquant/non-monotonicité détectée)

## 3. Runtime réel
- Effet appliqué: oui, `getProductionPerHour` lit `refinery.effect.ironPerHour`.
- Claim offline: oui, `applyClaimOnAccess` crédite l’iron selon production horaire.
- Clamp cap stockage: oui, clamp via `getStorageCaps` dans le claim.
- Population (logique corrigée):
  - occupation bâtiment = coût pop du niveau courant uniquement
  - requirement upgrade = `max(0, targetPop - currentPop)`
  - blocage réel via `canStartConstruction` si population libre insuffisante

## 4. UI réelle
- Prochain coût: affiché via `getConstructionCostResources` (coût runtime)
- Temps construction: affiché via `getConstructionDurationSeconds` (runtime)
- Population prochain niveau: affichée en incrémental `Population + (target-current)`
- Effet: affiché (format `+X Iron/h`)
- Wording trompeur détecté: aucun spécifique refinery

## 5. Verdict
**OK** — data/config/runtime/UI cohérents pour refinery comme équivalent Silver Mine.

## 6. Sources
- Grepolis Silver Mine (support): https://support.innogames.com/kb/Grepolis/en_DK/3284
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/render/modes/CityFoundationMode.ts`
