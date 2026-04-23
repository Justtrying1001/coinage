# Skyshield Battery

## 1. Résumé
- ID technique: `skyshield_battery`
- Nom affiché runtime: `Skyshield Battery`
- Branche: `defense`
- Statut produit: **CUSTOM Coinage** (pas un copier-coller du Tower Grepolis)
- Rôle cible: pendant anti-aérien/spatial de `defensive_wall` pour les unités `space_dock`.

## 2. Identité / mapping UI
- Asset UI branché: `/assets/watchtower.png`.
- Fallback global UI (si mapping absent): `/assets/buildings/hq.webp`.
- Le bâtiment est custom: inspiration “City Wall logic”, mais appliquée aux unités `space_dock` uniquement.

## 3. Prérequis runtime
- `unlockAtHq = 12`
- `prerequisites = [space_dock >= 3]`
- Décision: prérequis alignés avec son rôle anti-aérien/spatial défensif.

## 4. Table/runtime progression
- Nombre de niveaux: 20.
- L1 exact:
  - coût: `ore 400 / stone 350 / iron 200`
  - temps: `80s`
  - population: `2`
  - effets: `airWallDefensePct=2.2`, `airWallBaseDefense=3.3`
- Progression: monotone sur coûts/temps/population/effets.

## 5. Population
- Occupation = coût population du niveau courant.
- Upgrade requirement = delta `target - current`.
- UI construction: affiche le delta population du prochain niveau (source runtime).

## 6. Effets runtime réels
- Modèle dédié introduit/utilisé:
  - `airWallDefensePct`
  - `airWallBaseDefense`
- Application runtime:
  - uniquement `context='city_defense'`
  - uniquement unités `requiredBuildingId === 'space_dock'`
  - aucun bonus sur unités `barracks`
  - aucun bonus offensif.
- Formule appliquée:
  - `modifiedAirDefense = (baseAirDefense + airWallBaseDefense) * (1 + airWallDefensePct/100)`

## 7. Catalog/runtime alignement
- Catalog aligné sur runtime pour ce scope:
  - rôle/nav wording orientés “space_dock defenders only in city defense”
  - unlock: `HQ 12 + space_dock 3`
  - max level: 20 (aligné runtime + catalog).

## 8. Vérifications ciblées
- prereq `HQ 12 + space_dock 3`
- population current-level + delta upgrade sur `skyshield_battery`
- bonus tower présent sur unités `space_dock` en défense de ville
- bonus tower absent sur barracks et en offense

## 9. Sources code
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomySystem.test.ts`
- `src/game/render/modes/CityFoundationMode.ts`
