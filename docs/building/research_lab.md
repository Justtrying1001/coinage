# Research Lab

## 1. Résumé
- ID technique: `research_lab`
- Branche / catégorie: `research`
- Statut dans le code: implémenté
- Rôle gameplay réel: Capacité de recherche et gate des recherches.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 36
- Condition de déblocage HQ: HQ >= 8
- Prérequis globaux: housing_complex >= 6, barracks >= 5
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): researchCapacity
- Effets lus explicitement par le runtime ('cityEconomySystem'): researchCapacity
- Entrée de catalogue correspondante: oui (phase=later, definitionStatus=partially_defined, gameplayImplemented=false)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 100 | 200 | 120 | 107 | 3 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 2 | 231 | 429 | 276 | 509 | 6 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 3 | 378 | 670 | 448 | 1266 | 9 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 4 | 535 | 919 | 633 | 2419 | 12 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 5 | 701 | 1175 | 828 | 3997 | 15 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 6 | 874 | 1435 | 1030 | 6024 | 18 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 7 | 1053 | 1701 | 1240 | 8522 | 21 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 8 | 1238 | 1970 | 1455 | 11508 | 24 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 9 | 1428 | 2242 | 1676 | 15000 | 27 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 10 | 1622 | 2518 | 1902 | 19013 | 30 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 11 | 1820 | 2796 | 2132 | 23799 | 33 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 12 | 2022 | 3077 | 2367 | 26533 | 36 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 13 | 2228 | 3360 | 2606 | 29326 | 39 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 14 | 2437 | 3646 | 2848 | 32172 | 42 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 15 | 2649 | 3933 | 3094 | 35070 | 45 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 16 | 2864 | 4222 | 3343 | 38016 | 48 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 17 | 3082 | 4514 | 3595 | 41009 | 51 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 18 | 3303 | 4807 | 3850 | 44046 | 54 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 19 | 3526 | 5101 | 4109 | 47126 | 57 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 20 | 3752 | 5397 | 4369 | 50246 | 60 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 21 | 3980 | 5695 | 4633 | 53407 | 63 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 22 | 4210 | 5994 | 4899 | 56603 | 66 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 23 | 4443 | 6294 | 5167 | 59838 | 69 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 24 | 4678 | 6596 | 5438 | 63108 | 72 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 25 | 4915 | 6899 | 5711 | 66411 | 75 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 26 | 5154 | 7203 | 5986 | 69748 | 78 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 27 | 5394 | 7508 | 6264 | 73117 | 81 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 28 | 5637 | 7815 | 6543 | 76518 | 84 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 29 | 5882 | 8122 | 6824 | 79949 | 87 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 30 | 6128 | 8431 | 7108 | 83410 | 90 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 31 | 6376 | 8740 | 7393 | 86900 | 93 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 32 | 6626 | 9051 | 7680 | 90418 | 96 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 33 | 6877 | 9363 | 7969 | 93964 | 99 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 34 | 7130 | 9675 | 8260 | 97536 | 102 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 35 | 7385 | 9989 | 8552 | 101135 | 105 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |
| 36 | 7641 | 10303 | 8846 | 104760 | 108 | researchCapacity=4 | HQ>=8 | housing_complex>=6, barracks>=5 |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- `armament_factory`
- `council_chamber`

### Unités liées
- aucune unité liée directement

### Recherches liées
- slinger (lab 1)
- archer (lab 1)
- city_guard (lab 1)
- hoplite (lab 4)
- diplomacy (lab 4)
- meteorology (lab 4)
- espionage (lab 7)
- booty (lab 7)
- ceramics (lab 7)
- villagers_loyalty (lab 7)
- horseman (lab 10)
- architecture (lab 10)
- trainer (lab 10)
- colony_ship (lab 13)
- bireme (lab 13)
- crane (lab 13)
- shipwright (lab 13)
- chariot (lab 16)
- light_ship (lab 16)
- conscription (lab 16)
- fire_ship (lab 19)
- catapult (lab 19)
- cryptography (lab 19)
- democracy (lab 19)
- light_transport_ships (lab 22)
- plow (lab 22)
- bunks (lab 22)
- trireme (lab 25)
- phalanx (lab 25)
- breakthrough (lab 25)
- mathematics (lab 25)
- ram (lab 28)
- cartography (lab 28)
- conquest (lab 28)
- stone_hail (lab 31)
- temple_looting (lab 31)
- divine_selection (lab 31)
- battle_experience (lab 34)
- strong_wine (lab 34)
- set_sail (lab 34)

### Politiques liées
- aucune

## 6. Détails runtime importants
- `canStartResearch` exige un niveau mini par recherche; capacité calculée par `getResearchPointsCapacity` (= niveau * 4), pas via `effect.researchCapacity`.

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
