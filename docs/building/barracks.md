# Barracks

## 1. Résumé
- ID technique: `barracks`
- Branche / catégorie: `military`
- Statut dans le code: implémenté
- Rôle gameplay réel: Débloque l’entraînement des unités terrestres.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 30
- Condition de déblocage HQ: HQ >= 2
- Prérequis globaux: refinery >= 1, housing_complex >= 3, mine >= 1
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): trainingSpeedPct
- Effets lus explicitement par le runtime ('cityEconomySystem'): trainingSpeedPct
- Entrée de catalogue correspondante: oui (phase=v0, definitionStatus=fully_defined, gameplayImplemented=true)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 70 | 20 | 40 | 634 | 1 | — | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 2 | 163 | 64 | 116 | 1508 | 3 | trainingSpeedPct=1 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 3 | 267 | 125 | 217 | 2504 | 4 | trainingSpeedPct=2 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 4 | 380 | 203 | 338 | 3588 | 6 | trainingSpeedPct=3 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 5 | 499 | 294 | 477 | 4742 | 8 | trainingSpeedPct=4 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 6 | 623 | 399 | 632 | 5956 | 10 | trainingSpeedPct=5 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 7 | 752 | 516 | 807 | 7222 | 13 | trainingSpeedPct=6 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 8 | 885 | 644 | 984 | 8534 | 15 | trainingSpeedPct=7 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 9 | 1022 | 785 | 1179 | 9888 | 17 | trainingSpeedPct=8 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 10 | 1162 | 935 | 1387 | 11280 | 20 | trainingSpeedPct=9 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 11 | 1305 | 1097 | 1606 | 12706 | 23 | trainingSpeedPct=10 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 12 | 1451 | 1268 | 1837 | 14167 | 25 | trainingSpeedPct=11 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 13 | 1600 | 1450 | 2077 | 15657 | 28 | trainingSpeedPct=12 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 14 | 1751 | 1641 | 2329 | 17178 | 31 | trainingSpeedPct=13 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 15 | 1905 | 1841 | 2590 | 18725 | 34 | trainingSpeedPct=14 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 16 | 2061 | 2051 | 2860 | 20298 | 37 | trainingSpeedPct=15 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 17 | 2219 | 2269 | 3140 | 21896 | 40 | trainingSpeedPct=16 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 18 | 2380 | 2497 | 3429 | 23517 | 43 | trainingSpeedPct=17 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 19 | 2542 | 2732 | 3727 | 25162 | 46 | trainingSpeedPct=18 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 20 | 2706 | 2977 | 4033 | 26828 | 49 | trainingSpeedPct=19 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 21 | 2872 | 3230 | 4348 | 28515 | 52 | trainingSpeedPct=20 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 22 | 3040 | 3490 | 4671 | 30223 | 56 | trainingSpeedPct=21 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 23 | 3209 | 3759 | 5002 | 31950 | 59 | trainingSpeedPct=22 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 24 | 3380 | 4036 | 5341 | 33700 | 62 | trainingSpeedPct=23 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 25 | 3553 | 4321 | 5687 | 35459 | 66 | trainingSpeedPct=24 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 26 | 3727 | 4614 | 6041 | 37241 | 69 | trainingSpeedPct=25 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 27 | 3903 | 4914 | 6403 | 39040 | 73 | trainingSpeedPct=26 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 28 | 4080 | 5221 | 6771 | 40855 | 76 | trainingSpeedPct=27 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 29 | 4258 | 5536 | 7147 | 42688 | 80 | trainingSpeedPct=28 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |
| 30 | 4438 | 5859 | 7531 | 44535 | 83 | trainingSpeedPct=29 | HQ>=2 | refinery>=1, housing_complex>=3, mine>=1 |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- `armament_factory`
- `research_lab`

### Unités liées
- `line_infantry`
- `phalanx_lanceguard`
- `rail_marksman`
- `assault_legionnaire`
- `aegis_shieldguard`
- `raider_hoverbike`
- `siege_breacher`

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- aucune

## 6. Détails runtime importants
- `canStartTroopTraining` vérifie le niveau bâtiment requis de chaque unité ground, et son `trainingSpeedPct` alimente `getCityDerivedStats`.

## 7. Statut d’implémentation / zones d’attention
- Runtime construction: implémenté (canStartConstruction, startConstruction, resolveCompletedConstruction).
- Divergence config/runtime: catalog présent, comparer son statut (phase=v0, gameplayImplemented=true) avec l’état runtime réel ci-dessus.
- Écarts docs existantes: non utilisés comme source de vérité dans cette génération (code prioritaire).

## 8. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityBuildingLevelTables.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)
