# Quarry

## 1. Résumé
- ID technique: `quarry`
- Branche / catégorie: `economy`
- Statut dans le code: implémenté
- Rôle gameplay réel: Production de stone.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 40
- Condition de déblocage HQ: HQ >= 1
- Prérequis globaux: aucun
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: oui

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): stonePerHour
- Effets lus explicitement par le runtime ('cityEconomySystem'): stonePerHour
- Entrée de catalogue correspondante: oui (phase=mvp, definitionStatus=fully_defined, gameplayImplemented=true)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 1 | 3 | 2 | 2 | 1 | stonePerHour=8 | HQ>=1 | — |
| 2 | 6 | 10 | 10 | 3 | 2 | stonePerHour=12 | HQ>=1 | — |
| 3 | 13 | 21 | 24 | 5 | 2 | stonePerHour=18 | HQ>=1 | — |
| 4 | 24 | 36 | 44 | 8 | 2 | stonePerHour=24 | HQ>=1 | — |
| 5 | 38 | 55 | 70 | 38 | 2 | stonePerHour=30 | HQ>=1 | — |
| 6 | 56 | 78 | 103 | 102 | 2 | stonePerHour=37 | HQ>=1 | — |
| 7 | 77 | 105 | 143 | 201 | 2 | stonePerHour=43 | HQ>=1 | — |
| 8 | 102 | 135 | 189 | 437 | 3 | stonePerHour=51 | HQ>=1 | — |
| 9 | 131 | 169 | 242 | 2066 | 3 | stonePerHour=58 | HQ>=1 | — |
| 10 | 164 | 207 | 302 | 5355 | 3 | stonePerHour=66 | HQ>=1 | — |
| 11 | 200 | 248 | 369 | 8500 | 3 | stonePerHour=73 | HQ>=1 | — |
| 12 | 240 | 292 | 443 | 11050 | 3 | stonePerHour=81 | HQ>=1 | — |
| 13 | 284 | 340 | 524 | 13600 | 3 | stonePerHour=89 | HQ>=1 | — |
| 14 | 332 | 391 | 612 | 15300 | 3 | stonePerHour=98 | HQ>=1 | — |
| 15 | 383 | 446 | 708 | 17001 | 3 | stonePerHour=106 | HQ>=1 | — |
| 16 | 439 | 504 | 811 | 18874 | 3 | stonePerHour=114 | HQ>=1 | — |
| 17 | 499 | 566 | 921 | 20822 | 3 | stonePerHour=123 | HQ>=1 | — |
| 18 | 562 | 631 | 1038 | 22842 | 3 | stonePerHour=132 | HQ>=1 | — |
| 19 | 630 | 699 | 1163 | 24932 | 3 | stonePerHour=141 | HQ>=1 | — |
| 20 | 702 | 771 | 1295 | 27093 | 3 | stonePerHour=147 | HQ>=1 | — |
| 21 | 777 | 846 | 1435 | 29321 | 3 | stonePerHour=153 | HQ>=1 | — |
| 22 | 857 | 924 | 1582 | 31617 | 3 | stonePerHour=159 | HQ>=1 | — |
| 23 | 941 | 1005 | 1737 | 33977 | 3 | stonePerHour=165 | HQ>=1 | — |
| 24 | 1029 | 1090 | 1900 | 36402 | 3 | stonePerHour=171 | HQ>=1 | — |
| 25 | 1121 | 1178 | 2070 | 38891 | 3 | stonePerHour=177 | HQ>=1 | — |
| 26 | 1217 | 1269 | 2247 | 41442 | 3 | stonePerHour=184 | HQ>=1 | — |
| 27 | 1318 | 1363 | 2433 | 44055 | 3 | stonePerHour=190 | HQ>=1 | — |
| 28 | 1422 | 1461 | 2626 | 46729 | 3 | stonePerHour=196 | HQ>=1 | — |
| 29 | 1531 | 1561 | 2826 | 49462 | 3 | stonePerHour=203 | HQ>=1 | — |
| 30 | 1644 | 1665 | 3035 | 52255 | 3 | stonePerHour=209 | HQ>=1 | — |
| 31 | 1761 | 1772 | 3251 | 55106 | 3 | stonePerHour=216 | HQ>=1 | — |
| 32 | 1883 | 1883 | 3476 | 58014 | 3 | stonePerHour=222 | HQ>=1 | — |
| 33 | 2008 | 1996 | 3708 | 60979 | 3 | stonePerHour=229 | HQ>=1 | — |
| 34 | 2138 | 2112 | 3947 | 64001 | 4 | stonePerHour=235 | HQ>=1 | — |
| 35 | 2272 | 2232 | 4195 | 67078 | 4 | stonePerHour=242 | HQ>=1 | — |
| 36 | 2411 | 2355 | 4451 | 70210 | 4 | stonePerHour=248 | HQ>=1 | — |
| 37 | 2556 | 2482 | 4714 | 73397 | 4 | stonePerHour=255 | HQ>=1 | — |
| 38 | 2701 | 2610 | 4986 | 76637 | 4 | stonePerHour=261 | HQ>=1 | — |
| 39 | 2852 | 2742 | 5266 | 79931 | 4 | stonePerHour=268 | HQ>=1 | — |
| 40 | 3008 | 2877 | 5553 | 83277 | 4 | stonePerHour=275 | HQ>=1 | — |

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
- La production est calculée dans `getProductionPerHour` / `applyClaimOnAccess` avec bonus de recherche/politique puis malus milice actif.

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
