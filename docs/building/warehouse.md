# Warehouse

## 1. Résumé
- ID technique: `warehouse`
- Branche / catégorie: `economy`
- Statut dans le code: implémenté
- Rôle gameplay réel: Augmente les caps de stockage de ressources.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 35
- Condition de déblocage HQ: HQ >= 1
- Prérequis globaux: aucun
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: oui

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): storageCap
- Effets lus explicitement par le runtime ('cityEconomySystem'): storageCap
- Entrée de catalogue correspondante: oui (phase=mvp, definitionStatus=fully_defined, gameplayImplemented=true)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 0 | 0 | 0 | 0 | 0 | storageCap=ore:300,stone:300,iron:300 | HQ>=1 | — |
| 2 | 10 | 15 | 4 | 3 | 0 | storageCap=ore:711,stone:711,iron:711 | HQ>=1 | — |
| 3 | 37 | 58 | 18 | 5 | 0 | storageCap=ore:1185,stone:1185,iron:1185 | HQ>=1 | — |
| 4 | 115 | 180 | 60 | 8 | 0 | storageCap=ore:1706,stone:1706,iron:1706 | HQ>=1 | — |
| 5 | 242 | 381 | 130 | 114 | 0 | storageCap=ore:2267,stone:2267,iron:2267 | HQ>=1 | — |
| 6 | 426 | 670 | 235 | 290 | 0 | storageCap=ore:2862,stone:2862,iron:2862 | HQ>=1 | — |
| 7 | 674 | 1059 | 379 | 541 | 0 | storageCap=ore:3487,stone:3487,iron:3487 | HQ>=1 | — |
| 8 | 826 | 1297 | 473 | 1101 | 0 | storageCap=ore:4140,stone:4140,iron:4140 | HQ>=1 | — |
| 9 | 987 | 1552 | 576 | 4789 | 0 | storageCap=ore:4818,stone:4818,iron:4818 | HQ>=1 | — |
| 10 | 1159 | 1821 | 686 | 11175 | 0 | storageCap=ore:5518,stone:5518,iron:5518 | HQ>=1 | — |
| 11 | 1340 | 2105 | 803 | 17738 | 0 | storageCap=ore:6241,stone:6241,iron:6241 | HQ>=1 | — |
| 12 | 1529 | 2403 | 928 | 23059 | 0 | storageCap=ore:6984,stone:6984,iron:6984 | HQ>=1 | — |
| 13 | 1727 | 2714 | 1060 | 28380 | 0 | storageCap=ore:7746,stone:7746,iron:7746 | HQ>=1 | — |
| 14 | 1933 | 3037 | 1199 | 31928 | 0 | storageCap=ore:8526,stone:8526,iron:8526 | HQ>=1 | — |
| 15 | 2146 | 3373 | 1344 | 35475 | 0 | storageCap=ore:9324,stone:9324,iron:9324 | HQ>=1 | — |
| 16 | 2368 | 3721 | 1496 | 38407 | 0 | storageCap=ore:10138,stone:10138,iron:10138 | HQ>=1 | — |
| 17 | 2596 | 4080 | 1654 | 41380 | 0 | storageCap=ore:10969,stone:10969,iron:10969 | HQ>=1 | — |
| 18 | 2832 | 4450 | 1819 | 44394 | 0 | storageCap=ore:11815,stone:11815,iron:11815 | HQ>=1 | — |
| 19 | 3074 | 4831 | 1990 | 47447 | 0 | storageCap=ore:12675,stone:12675,iron:12675 | HQ>=1 | — |
| 20 | 3324 | 5223 | 2167 | 50536 | 0 | storageCap=ore:13550,stone:13550,iron:13550 | HQ>=1 | — |
| 21 | 3580 | 5625 | 2349 | 53662 | 0 | storageCap=ore:14439,stone:14439,iron:14439 | HQ>=1 | — |
| 22 | 3842 | 6037 | 2538 | 56823 | 0 | storageCap=ore:15341,stone:15341,iron:15341 | HQ>=1 | — |
| 23 | 4110 | 6459 | 2732 | 60016 | 0 | storageCap=ore:16257,stone:16257,iron:16257 | HQ>=1 | — |
| 24 | 4385 | 6891 | 2933 | 63241 | 0 | storageCap=ore:17185,stone:17185,iron:17185 | HQ>=1 | — |
| 25 | 4666 | 7332 | 3138 | 66497 | 0 | storageCap=ore:18125,stone:18125,iron:18125 | HQ>=1 | — |
| 26 | 4953 | 7783 | 3349 | 69784 | 0 | storageCap=ore:19077,stone:19077,iron:19077 | HQ>=1 | — |
| 27 | 5245 | 8242 | 3566 | 73100 | 0 | storageCap=ore:20041,stone:20041,iron:20041 | HQ>=1 | — |
| 28 | 5543 | 8710 | 3788 | 76444 | 0 | storageCap=ore:21016,stone:21016,iron:21016 | HQ>=1 | — |
| 29 | 5847 | 9188 | 4015 | 79816 | 0 | storageCap=ore:22003,stone:22003,iron:22003 | HQ>=1 | — |
| 30 | 6156 | 9674 | 4247 | 83215 | 0 | storageCap=ore:23000,stone:23000,iron:23000 | HQ>=1 | — |
| 31 | 6470 | 10168 | 4485 | 86639 | 0 | storageCap=ore:24008,stone:24008,iron:24008 | HQ>=1 | — |
| 32 | 6790 | 10671 | 4728 | 90089 | 0 | storageCap=ore:25026,stone:25026,iron:25026 | HQ>=1 | — |
| 33 | 7116 | 11182 | 4975 | 93565 | 0 | storageCap=ore:26055,stone:26055,iron:26055 | HQ>=1 | — |
| 34 | 7446 | 11701 | 5228 | 97064 | 0 | storageCap=ore:27093,stone:27093,iron:27093 | HQ>=1 | — |
| 35 | 7781 | 12228 | 5486 | 100587 | 0 | storageCap=ore:28142,stone:28142,iron:28142 | HQ>=1 | — |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- `intelligence_center`
- `market`

### Unités liées
- aucune unité liée directement

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- aucune

## 6. Détails runtime importants
- Les caps de ressources viennent de `getStorageCaps`; fallback base si niveau 0.

## 7. Statut d’implémentation / zones d’attention
- Runtime construction: implémenté (canStartConstruction, startConstruction, resolveCompletedConstruction).
- Divergence config/runtime: catalog présent, comparer son statut (phase=mvp, gameplayImplemented=true) avec l’état runtime réel ci-dessus.
- Écarts docs existantes: non utilisés comme source de vérité dans cette génération (code prioritaire).

## 8. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityBuildingLevelTables.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)
