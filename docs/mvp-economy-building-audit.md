# ARMAMENT_FACTORY ONLY — audit runtime/data/UI strict

Date: 2026-04-23  
Scope strict: `armament_factory` uniquement.

## 1) Résumé court
- Runtime armament migré vers 4 axes explicites: `groundAttackPct`, `groundDefensePct`, `airAttackPct`, `airDefensePct`.
- Rôle `trainingSpeedPct` absent (anti-doublon conservé avec `barracks`/`space_dock`).
- Table armament alignée sur `L1..L35` et effets cycliques non linéaires.

## 2) Vérité runtime
- ID: `armament_factory`
- Unlock runtime: `HQ >= 8`, `research_lab >= 10`, `barracks >= 10`
- Max level runtime: `35`
- Effets par niveau: cycle `groundAttackPct` → `groundDefensePct` → `airAttackPct` → `airDefensePct`
- Population runtime:
  - occupation = coût du niveau courant,
  - coût upgrade = delta (`target-current`).

## 3) Branchement gameplay réel
- **Branché et prouvé**: les 4 axes armament remontent dans `getCityDerivedStats` et l’UI city.
- **Non implémenté côté résolution gameplay finale**: consommation combat finale de ces 4 axes (scope ultérieur).

## 4) UI
- Effets armament affichés explicitement dans `formatEffectList`.
- Panneau "City effects" affiche Ground/Air ATK/DEF dérivés.

## 5) Corrections appliquées
- `src/game/city/economy/cityBuildingLevelTables.ts`: table armament passée à 35 niveaux et effets cycliques 4 axes.
- `src/game/city/economy/cityEconomyConfig.ts`: type `BuildingLevelEffect` étendu aux 4 champs armament.
- `src/game/city/economy/cityEconomySystem.ts`: derived stats armament migrées vers ground/air ATK/DEF.
- `src/game/render/modes/cityViewUiHelpers.ts` + `src/game/render/modes/CityFoundationMode.ts`: wording/affichage UI migrés.
- Tests mis à jour:
  - `src/game/city/economy/cityEconomySystem.test.ts`
  - `src/game/render/modes/cityViewUiHelpers.test.ts`
  - `src/game/city/economy/cityContentCatalog.test.ts`

## 6) Verdict
**PARTIAL**:
- migration data/runtime/UI armament: **OK**,
- intégration combat finale (résolution détaillée): **ouverte**.
