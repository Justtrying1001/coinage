# Armament Factory

## 1. Résumé
- ID technique: `armament_factory`
- Branche / catégorie: `military`
- Statut dans le code: implémenté
- Rôle gameplay réel: Bonus puissance/entretien/formation des troupes.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 36
- Condition de déblocage HQ: HQ >= 8
- Prérequis globaux: research_lab >= 10, barracks >= 10
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): troopCombatPowerPct, troopUpkeepEfficiencyPct, trainingSpeedPct
- Effets lus explicitement par le runtime ('cityEconomySystem'): troopCombatPowerPct, troopUpkeepEfficiencyPct, trainingSpeedPct
- Entrée de catalogue correspondante: oui (phase=later, definitionStatus=partially_defined, gameplayImplemented=false)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 100 | 200 | 120 | 107 | 3 | trainingSpeedPct=0.6 ; troopCombatPowerPct=0.8 ; troopUpkeepEfficiencyPct=0.7 | HQ>=8 | research_lab>=10, barracks>=10 |
| 2 | 231 | 429 | 276 | 509 | 6 | trainingSpeedPct=1.2 ; troopCombatPowerPct=1.6 ; troopUpkeepEfficiencyPct=1.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 3 | 378 | 670 | 448 | 1266 | 9 | trainingSpeedPct=1.8 ; troopCombatPowerPct=2.4 ; troopUpkeepEfficiencyPct=2.1 | HQ>=8 | research_lab>=10, barracks>=10 |
| 4 | 535 | 919 | 633 | 2419 | 12 | trainingSpeedPct=2.4 ; troopCombatPowerPct=3.2 ; troopUpkeepEfficiencyPct=2.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 5 | 701 | 1175 | 828 | 3997 | 15 | trainingSpeedPct=3 ; troopCombatPowerPct=4 ; troopUpkeepEfficiencyPct=3.5 | HQ>=8 | research_lab>=10, barracks>=10 |
| 6 | 874 | 1435 | 1030 | 6024 | 18 | trainingSpeedPct=3.6 ; troopCombatPowerPct=4.8 ; troopUpkeepEfficiencyPct=4.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 7 | 1053 | 1701 | 1240 | 8522 | 21 | trainingSpeedPct=4.2 ; troopCombatPowerPct=5.6 ; troopUpkeepEfficiencyPct=4.9 | HQ>=8 | research_lab>=10, barracks>=10 |
| 8 | 1238 | 1970 | 1455 | 11508 | 24 | trainingSpeedPct=4.8 ; troopCombatPowerPct=6.4 ; troopUpkeepEfficiencyPct=5.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 9 | 1428 | 2242 | 1676 | 15000 | 27 | trainingSpeedPct=5.4 ; troopCombatPowerPct=7.2 ; troopUpkeepEfficiencyPct=6.3 | HQ>=8 | research_lab>=10, barracks>=10 |
| 10 | 1622 | 2518 | 1902 | 19013 | 30 | trainingSpeedPct=6 ; troopCombatPowerPct=8 ; troopUpkeepEfficiencyPct=7 | HQ>=8 | research_lab>=10, barracks>=10 |
| 11 | 1820 | 2796 | 2132 | 23799 | 33 | trainingSpeedPct=6.6 ; troopCombatPowerPct=8.8 ; troopUpkeepEfficiencyPct=7.7 | HQ>=8 | research_lab>=10, barracks>=10 |
| 12 | 2022 | 3077 | 2367 | 26533 | 36 | trainingSpeedPct=7.2 ; troopCombatPowerPct=9.6 ; troopUpkeepEfficiencyPct=8.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 13 | 2228 | 3360 | 2606 | 29326 | 39 | trainingSpeedPct=7.8 ; troopCombatPowerPct=10.4 ; troopUpkeepEfficiencyPct=9.1 | HQ>=8 | research_lab>=10, barracks>=10 |
| 14 | 2437 | 3646 | 2848 | 32172 | 42 | trainingSpeedPct=8.4 ; troopCombatPowerPct=11.2 ; troopUpkeepEfficiencyPct=9.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 15 | 2649 | 3933 | 3094 | 35070 | 45 | trainingSpeedPct=9 ; troopCombatPowerPct=12 ; troopUpkeepEfficiencyPct=10.5 | HQ>=8 | research_lab>=10, barracks>=10 |
| 16 | 2864 | 4222 | 3343 | 38016 | 48 | trainingSpeedPct=9.6 ; troopCombatPowerPct=12.8 ; troopUpkeepEfficiencyPct=11.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 17 | 3082 | 4514 | 3595 | 41009 | 51 | trainingSpeedPct=10.2 ; troopCombatPowerPct=13.6 ; troopUpkeepEfficiencyPct=11.9 | HQ>=8 | research_lab>=10, barracks>=10 |
| 18 | 3303 | 4807 | 3850 | 44046 | 54 | trainingSpeedPct=10.8 ; troopCombatPowerPct=14.4 ; troopUpkeepEfficiencyPct=12.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 19 | 3526 | 5101 | 4109 | 47126 | 57 | trainingSpeedPct=11.4 ; troopCombatPowerPct=15.2 ; troopUpkeepEfficiencyPct=13.3 | HQ>=8 | research_lab>=10, barracks>=10 |
| 20 | 3752 | 5397 | 4369 | 50246 | 60 | trainingSpeedPct=12 ; troopCombatPowerPct=16 ; troopUpkeepEfficiencyPct=14 | HQ>=8 | research_lab>=10, barracks>=10 |
| 21 | 3980 | 5695 | 4633 | 53407 | 63 | trainingSpeedPct=12.6 ; troopCombatPowerPct=16.8 ; troopUpkeepEfficiencyPct=14.7 | HQ>=8 | research_lab>=10, barracks>=10 |
| 22 | 4210 | 5994 | 4899 | 56603 | 66 | trainingSpeedPct=13.2 ; troopCombatPowerPct=17.6 ; troopUpkeepEfficiencyPct=15.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 23 | 4443 | 6294 | 5167 | 59838 | 69 | trainingSpeedPct=13.8 ; troopCombatPowerPct=18.4 ; troopUpkeepEfficiencyPct=16.1 | HQ>=8 | research_lab>=10, barracks>=10 |
| 24 | 4678 | 6596 | 5438 | 63108 | 72 | trainingSpeedPct=14.4 ; troopCombatPowerPct=19.2 ; troopUpkeepEfficiencyPct=16.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 25 | 4915 | 6899 | 5711 | 66411 | 75 | trainingSpeedPct=15 ; troopCombatPowerPct=20 ; troopUpkeepEfficiencyPct=17.5 | HQ>=8 | research_lab>=10, barracks>=10 |
| 26 | 5154 | 7203 | 5986 | 69748 | 78 | trainingSpeedPct=15.6 ; troopCombatPowerPct=20.8 ; troopUpkeepEfficiencyPct=18.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 27 | 5394 | 7508 | 6264 | 73117 | 81 | trainingSpeedPct=16.2 ; troopCombatPowerPct=21.6 ; troopUpkeepEfficiencyPct=18.9 | HQ>=8 | research_lab>=10, barracks>=10 |
| 28 | 5637 | 7815 | 6543 | 76518 | 84 | trainingSpeedPct=16.8 ; troopCombatPowerPct=22.4 ; troopUpkeepEfficiencyPct=19.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 29 | 5882 | 8122 | 6824 | 79949 | 87 | trainingSpeedPct=17.4 ; troopCombatPowerPct=23.2 ; troopUpkeepEfficiencyPct=20.3 | HQ>=8 | research_lab>=10, barracks>=10 |
| 30 | 6128 | 8431 | 7108 | 83410 | 90 | trainingSpeedPct=18 ; troopCombatPowerPct=24 ; troopUpkeepEfficiencyPct=21 | HQ>=8 | research_lab>=10, barracks>=10 |
| 31 | 6376 | 8740 | 7393 | 86900 | 93 | trainingSpeedPct=18.6 ; troopCombatPowerPct=24.8 ; troopUpkeepEfficiencyPct=21.7 | HQ>=8 | research_lab>=10, barracks>=10 |
| 32 | 6626 | 9051 | 7680 | 90418 | 96 | trainingSpeedPct=19.2 ; troopCombatPowerPct=25.6 ; troopUpkeepEfficiencyPct=22.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 33 | 6877 | 9363 | 7969 | 93964 | 99 | trainingSpeedPct=19.8 ; troopCombatPowerPct=26.4 ; troopUpkeepEfficiencyPct=23.1 | HQ>=8 | research_lab>=10, barracks>=10 |
| 34 | 7130 | 9675 | 8260 | 97536 | 102 | trainingSpeedPct=20.4 ; troopCombatPowerPct=27.2 ; troopUpkeepEfficiencyPct=23.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 35 | 7385 | 9989 | 8552 | 101135 | 105 | trainingSpeedPct=21 ; troopCombatPowerPct=28 ; troopUpkeepEfficiencyPct=24.5 | HQ>=8 | research_lab>=10, barracks>=10 |
| 36 | 7641 | 10303 | 8846 | 104760 | 108 | trainingSpeedPct=21.6 ; troopCombatPowerPct=28.8 ; troopUpkeepEfficiencyPct=25.2 | HQ>=8 | research_lab>=10, barracks>=10 |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- aucun bâtiment ne référence ce bâtiment comme prérequis direct

### Unités liées
- aucune unité liée directement

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- aucune

## 6. Détails runtime importants
- Contribue à `trainingSpeedPct`, `troopCombatPowerPct`, `troopUpkeepEfficiencyPct` via `getCityDerivedStats`.

## 7. Statut d’implémentation / zones d’attention
- Runtime construction: implémenté (canStartConstruction, startConstruction, resolveCompletedConstruction).
- Divergence config/runtime: catalog présent, comparer son statut (phase=later, gameplayImplemented=false) avec l’état runtime réel ci-dessus.
- Écarts docs existantes: non utilisés comme source de vérité dans cette génération (code prioritaire).

## 8. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityBuildingLevelTables.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)
