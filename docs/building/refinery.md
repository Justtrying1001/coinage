# Refinery

## 1. Résumé
- ID technique: `refinery`
- Branche / catégorie: `economy`
- Statut dans le code: implémenté
- Rôle gameplay réel: Production d’iron.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 40
- Condition de déblocage HQ: HQ >= 1
- Prérequis globaux: mine >= 1
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): ironPerHour
- Effets lus explicitement par le runtime ('cityEconomySystem'): ironPerHour
- Entrée de catalogue correspondante: oui (phase=mvp, definitionStatus=fully_defined, gameplayImplemented=true)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 5 | 2 | 4 | 2 | 1 | ironPerHour=8 | HQ>=1 | mine>=1 |
| 2 | 19 | 8 | 14 | 3 | 2 | ironPerHour=12 | HQ>=1 | mine>=1 |
| 3 | 40 | 18 | 29 | 5 | 2 | ironPerHour=18 | HQ>=1 | mine>=1 |
| 4 | 70 | 32 | 49 | 8 | 2 | ironPerHour=24 | HQ>=1 | mine>=1 |
| 5 | 106 | 50 | 72 | 58 | 2 | ironPerHour=30 | HQ>=1 | mine>=1 |
| 6 | 150 | 72 | 101 | 149 | 2 | ironPerHour=37 | HQ>=1 | mine>=1 |
| 7 | 202 | 98 | 133 | 280 | 2 | ironPerHour=43 | HQ>=1 | mine>=1 |
| 8 | 260 | 128 | 169 | 578 | 3 | ironPerHour=51 | HQ>=1 | mine>=1 |
| 9 | 325 | 162 | 209 | 2552 | 3 | ironPerHour=58 | HQ>=1 | mine>=1 |
| 10 | 397 | 200 | 252 | 6065 | 3 | ironPerHour=66 | HQ>=1 | mine>=1 |
| 11 | 476 | 242 | 300 | 9627 | 3 | ironPerHour=73 | HQ>=1 | mine>=1 |
| 12 | 562 | 288 | 350 | 12514 | 3 | ironPerHour=81 | HQ>=1 | mine>=1 |
| 13 | 654 | 338 | 405 | 15402 | 3 | ironPerHour=89 | HQ>=1 | mine>=1 |
| 14 | 753 | 392 | 462 | 17328 | 3 | ironPerHour=98 | HQ>=1 | mine>=1 |
| 15 | 858 | 450 | 524 | 19253 | 3 | ironPerHour=106 | HQ>=1 | mine>=1 |
| 16 | 970 | 512 | 588 | 21088 | 3 | ironPerHour=115 | HQ>=1 | mine>=1 |
| 17 | 1088 | 578 | 656 | 22969 | 3 | ironPerHour=123 | HQ>=1 | mine>=1 |
| 18 | 1213 | 648 | 727 | 24897 | 3 | ironPerHour=132 | HQ>=1 | mine>=1 |
| 19 | 1345 | 722 | 801 | 26870 | 3 | ironPerHour=141 | HQ>=1 | mine>=1 |
| 20 | 1482 | 800 | 879 | 28885 | 3 | ironPerHour=147 | HQ>=1 | mine>=1 |
| 21 | 1626 | 882 | 960 | 30942 | 3 | ironPerHour=153 | HQ>=1 | mine>=1 |
| 22 | 1777 | 968 | 1043 | 33040 | 3 | ironPerHour=159 | HQ>=1 | mine>=1 |
| 23 | 1933 | 1058 | 1130 | 35177 | 3 | ironPerHour=165 | HQ>=1 | mine>=1 |
| 24 | 2096 | 1152 | 1220 | 37352 | 3 | ironPerHour=171 | HQ>=1 | mine>=1 |
| 25 | 2265 | 1250 | 1313 | 38700 | 3 | ironPerHour=177 | HQ>=1 | mine>=1 |
| 26 | 2440 | 1352 | 1409 | 41815 | 3 | ironPerHour=184 | HQ>=1 | mine>=1 |
| 27 | 2622 | 1458 | 1508 | 44100 | 3 | ironPerHour=190 | HQ>=1 | mine>=1 |
| 28 | 2809 | 1568 | 1610 | 46420 | 3 | ironPerHour=196 | HQ>=1 | mine>=1 |
| 29 | 3003 | 1682 | 1715 | 48775 | 3 | ironPerHour=203 | HQ>=1 | mine>=1 |
| 30 | 3203 | 1800 | 1823 | 51164 | 3 | ironPerHour=209 | HQ>=1 | mine>=1 |
| 31 | 3408 | 1922 | 1934 | 53585 | 3 | ironPerHour=216 | HQ>=1 | mine>=1 |
| 32 | 3620 | 2048 | 2028 | 56037 | 3 | ironPerHour=222 | HQ>=1 | mine>=1 |
| 33 | 3838 | 2178 | 2165 | 58522 | 3 | ironPerHour=229 | HQ>=1 | mine>=1 |
| 34 | 4062 | 2312 | 2284 | 61039 | 4 | ironPerHour=235 | HQ>=1 | mine>=1 |
| 35 | 4292 | 2450 | 2406 | 63585 | 4 | ironPerHour=242 | HQ>=1 | mine>=1 |
| 36 | 4528 | 2592 | 2532 | 66161 | 4 | ironPerHour=248 | HQ>=1 | mine>=1 |
| 37 | 4770 | 2738 | 2660 | 68767 | 4 | ironPerHour=255 | HQ>=1 | mine>=1 |
| 38 | 5018 | 2888 | 2790 | 71403 | 4 | ironPerHour=261 | HQ>=1 | mine>=1 |
| 39 | 5272 | 3042 | 2924 | 74066 | 4 | ironPerHour=268 | HQ>=1 | mine>=1 |
| 40 | 5532 | 3200 | 3060 | 76758 | 4 | ironPerHour=275 | HQ>=1 | mine>=1 |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- `barracks`
- `space_dock`

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
