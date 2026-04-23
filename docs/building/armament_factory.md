# Armament Factory

## 1) Identité
- ID technique: `armament_factory`
- Nom affiché runtime: `Armament Factory`
- Catégorie: `military`
- Prérequis runtime: `HQ >= 8`, `research_lab >= 10`, `barracks >= 10`
- Niveau max runtime: `35`
- Asset UI branché: `/assets/cg_token_slot_placeholder_64.svg` (placeholder)

## 2) Rôle produit figé
`armament_factory` améliore uniquement l’attaque et la défense des unités :
- terrestres (`groundAttackPct`, `groundDefensePct`)
- aériennes (`airAttackPct`, `airDefensePct`)

`armament_factory` n’améliore pas :
- `trainingSpeedPct`
- l’upkeep
- les recherches
- la production d’unités
- les systèmes de généraux

## 3) Vérité runtime actuelle
- Effets runtime exposés: `groundAttackPct`, `groundDefensePct`, `airAttackPct`, `airDefensePct`.
- Le runtime lit la ligne du niveau courant et applique les **effets totaux atteints au niveau N** (valeurs cumulées).
- L35 est un palier final spécial qui buffe les 4 axes (terre + air, attaque + défense).

## 4) Logique de progression (paliers)
Cycle cible explicite :
- L1 = Ground Attack
- L2 = Ground Defense
- L3 = Air Attack
- L4 = Air Defense
- L5 = Ground Attack + Ground Defense
- L6 = Air Attack + Air Defense

Ce cycle est répété jusqu’à L30, puis :
- L31 = Ground Attack
- L32 = Ground Defense
- L33 = Air Attack
- L34 = Air Defense
- **L35 = Ground Attack + Ground Defense + Air Attack + Air Defense (palier final all-units)**

## 5) Table complète des niveaux (L1 -> L35)
> Les colonnes d’effets affichent les **effets totaux cumulés atteints** au niveau indiqué.

| Niveau | Palier cible | Ore | Stone | Iron | Temps construction (s) | Population | Effets totaux cumulés atteints au niveau N | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---|---:|---:|---:|---:|---:|---|---|---|
| 1 | Ground Attack | 100 | 200 | 120 | 107 | 3 | groundAttackPct=0.9 | HQ>=8 | research_lab>=10, barracks>=10 |
| 2 | Ground Defense | 231 | 429 | 276 | 509 | 6 | groundAttackPct=0.9 ; groundDefensePct=0.7 | HQ>=8 | research_lab>=10, barracks>=10 |
| 3 | Air Attack | 378 | 670 | 448 | 1266 | 9 | groundAttackPct=0.9 ; groundDefensePct=0.7 ; airAttackPct=0.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 4 | Air Defense | 535 | 919 | 633 | 2419 | 12 | groundAttackPct=0.9 ; groundDefensePct=0.7 ; airAttackPct=0.8 ; airDefensePct=0.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 5 | Ground Attack + Ground Defense | 701 | 1175 | 828 | 3997 | 15 | groundAttackPct=1.8 ; groundDefensePct=1.4 ; airAttackPct=0.8 ; airDefensePct=0.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 6 | Air Attack + Air Defense | 874 | 1435 | 1030 | 6024 | 18 | groundAttackPct=1.8 ; groundDefensePct=1.4 ; airAttackPct=1.6 ; airDefensePct=1.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 7 | Ground Attack | 1053 | 1701 | 1240 | 8522 | 21 | groundAttackPct=2.7 ; groundDefensePct=1.4 ; airAttackPct=1.6 ; airDefensePct=1.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 8 | Ground Defense | 1238 | 1970 | 1455 | 11508 | 24 | groundAttackPct=2.7 ; groundDefensePct=2.1 ; airAttackPct=1.6 ; airDefensePct=1.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 9 | Air Attack | 1428 | 2242 | 1676 | 15000 | 27 | groundAttackPct=2.7 ; groundDefensePct=2.1 ; airAttackPct=2.4 ; airDefensePct=1.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 10 | Air Defense | 1622 | 2518 | 1902 | 19013 | 30 | groundAttackPct=2.7 ; groundDefensePct=2.1 ; airAttackPct=2.4 ; airDefensePct=1.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 11 | Ground Attack + Ground Defense | 1820 | 2796 | 2132 | 23799 | 33 | groundAttackPct=3.6 ; groundDefensePct=2.8 ; airAttackPct=2.4 ; airDefensePct=1.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 12 | Air Attack + Air Defense | 2022 | 3077 | 2367 | 26533 | 36 | groundAttackPct=3.6 ; groundDefensePct=2.8 ; airAttackPct=3.2 ; airDefensePct=2.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 13 | Ground Attack | 2228 | 3360 | 2606 | 29326 | 39 | groundAttackPct=4.5 ; groundDefensePct=2.8 ; airAttackPct=3.2 ; airDefensePct=2.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 14 | Ground Defense | 2437 | 3646 | 2848 | 32172 | 42 | groundAttackPct=4.5 ; groundDefensePct=3.5 ; airAttackPct=3.2 ; airDefensePct=2.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 15 | Air Attack | 2649 | 3933 | 3094 | 35070 | 45 | groundAttackPct=4.5 ; groundDefensePct=3.5 ; airAttackPct=4.0 ; airDefensePct=2.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 16 | Air Defense | 2864 | 4222 | 3343 | 38016 | 48 | groundAttackPct=4.5 ; groundDefensePct=3.5 ; airAttackPct=4.0 ; airDefensePct=3.0 | HQ>=8 | research_lab>=10, barracks>=10 |
| 17 | Ground Attack + Ground Defense | 3082 | 4514 | 3595 | 41009 | 51 | groundAttackPct=5.4 ; groundDefensePct=4.2 ; airAttackPct=4.0 ; airDefensePct=3.0 | HQ>=8 | research_lab>=10, barracks>=10 |
| 18 | Air Attack + Air Defense | 3303 | 4807 | 3850 | 44046 | 54 | groundAttackPct=5.4 ; groundDefensePct=4.2 ; airAttackPct=4.8 ; airDefensePct=3.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 19 | Ground Attack | 3526 | 5101 | 4109 | 47126 | 57 | groundAttackPct=6.3 ; groundDefensePct=4.2 ; airAttackPct=4.8 ; airDefensePct=3.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 20 | Ground Defense | 3752 | 5397 | 4369 | 50246 | 60 | groundAttackPct=6.3 ; groundDefensePct=4.9 ; airAttackPct=4.8 ; airDefensePct=3.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 21 | Air Attack | 3980 | 5695 | 4633 | 53407 | 63 | groundAttackPct=6.3 ; groundDefensePct=4.9 ; airAttackPct=5.6 ; airDefensePct=3.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 22 | Air Defense | 4210 | 5994 | 4899 | 56603 | 66 | groundAttackPct=6.3 ; groundDefensePct=4.9 ; airAttackPct=5.6 ; airDefensePct=4.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 23 | Ground Attack + Ground Defense | 4443 | 6294 | 5167 | 59838 | 69 | groundAttackPct=7.2 ; groundDefensePct=5.6 ; airAttackPct=5.6 ; airDefensePct=4.2 | HQ>=8 | research_lab>=10, barracks>=10 |
| 24 | Air Attack + Air Defense | 4678 | 6596 | 5438 | 63108 | 72 | groundAttackPct=7.2 ; groundDefensePct=5.6 ; airAttackPct=6.4 ; airDefensePct=4.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 25 | Ground Attack | 4915 | 6899 | 5711 | 66411 | 75 | groundAttackPct=8.1 ; groundDefensePct=5.6 ; airAttackPct=6.4 ; airDefensePct=4.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 26 | Ground Defense | 5154 | 7203 | 5986 | 69748 | 78 | groundAttackPct=8.1 ; groundDefensePct=6.3 ; airAttackPct=6.4 ; airDefensePct=4.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 27 | Air Attack | 5394 | 7508 | 6264 | 73117 | 81 | groundAttackPct=8.1 ; groundDefensePct=6.3 ; airAttackPct=7.2 ; airDefensePct=4.8 | HQ>=8 | research_lab>=10, barracks>=10 |
| 28 | Air Defense | 5637 | 7815 | 6543 | 76518 | 84 | groundAttackPct=8.1 ; groundDefensePct=6.3 ; airAttackPct=7.2 ; airDefensePct=5.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 29 | Ground Attack + Ground Defense | 5882 | 8122 | 6824 | 79949 | 87 | groundAttackPct=9.0 ; groundDefensePct=7.0 ; airAttackPct=7.2 ; airDefensePct=5.4 | HQ>=8 | research_lab>=10, barracks>=10 |
| 30 | Air Attack + Air Defense | 6128 | 8431 | 7108 | 83410 | 90 | groundAttackPct=9.0 ; groundDefensePct=7.0 ; airAttackPct=8.0 ; airDefensePct=6.0 | HQ>=8 | research_lab>=10, barracks>=10 |
| 31 | Ground Attack | 6376 | 8740 | 7393 | 86900 | 93 | groundAttackPct=9.9 ; groundDefensePct=7.0 ; airAttackPct=8.0 ; airDefensePct=6.0 | HQ>=8 | research_lab>=10, barracks>=10 |
| 32 | Ground Defense | 6626 | 9051 | 7680 | 90418 | 96 | groundAttackPct=9.9 ; groundDefensePct=7.7 ; airAttackPct=8.0 ; airDefensePct=6.0 | HQ>=8 | research_lab>=10, barracks>=10 |
| 33 | Air Attack | 6877 | 9363 | 7969 | 93964 | 99 | groundAttackPct=9.9 ; groundDefensePct=7.7 ; airAttackPct=8.8 ; airDefensePct=6.0 | HQ>=8 | research_lab>=10, barracks>=10 |
| 34 | Air Defense | 7130 | 9675 | 8260 | 97536 | 102 | groundAttackPct=9.9 ; groundDefensePct=7.7 ; airAttackPct=8.8 ; airDefensePct=6.6 | HQ>=8 | research_lab>=10, barracks>=10 |
| 35 | FINAL ALL UNITS (Ground ATK+DEF + Air ATK+DEF) | 7385 | 9989 | 8552 | 101135 | 105 | groundAttackPct=10.8 ; groundDefensePct=8.4 ; airAttackPct=9.6 ; airDefensePct=7.2 | HQ>=8 | research_lab>=10, barracks>=10 |

## 6) Dépendances / interactions
- Influence active: stats dérivées de ville (`groundAttackPct`, `groundDefensePct`, `airAttackPct`, `airDefensePct`).
- N’influence pas: `trainingSpeedPct`.

## 7) Sources de vérité utilisées
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/render/modes/cityViewUiHelpers.ts`
- `src/game/render/modes/CityFoundationMode.ts`
