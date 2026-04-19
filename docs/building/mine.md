# Mine

## 1. Résumé
- ID technique: `mine`
- Branche / catégorie: `economy`
- Statut dans le code: implémenté
- Rôle gameplay réel: Production d’ore.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 40
- Condition de déblocage HQ: HQ >= 1
- Prérequis globaux: aucun
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: oui

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): orePerHour
- Effets lus explicitement par le runtime ('cityEconomySystem'): orePerHour
- Entrée de catalogue correspondante: oui (phase=mvp, definitionStatus=fully_defined, gameplayImplemented=true)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 3 | 2 | 1 | 2 | 1 | orePerHour=8 | HQ>=1 | — |
| 2 | 10 | 9 | 6 | 3 | 2 | orePerHour=12 | HQ>=1 | — |
| 3 | 21 | 20 | 15 | 5 | 2 | orePerHour=18 | HQ>=1 | — |
| 4 | 36 | 37 | 27 | 8 | 2 | orePerHour=24 | HQ>=1 | — |
| 5 | 55 | 59 | 44 | 33 | 2 | orePerHour=30 | HQ>=1 | — |
| 6 | 78 | 86 | 64 | 87 | 2 | orePerHour=37 | HQ>=1 | — |
| 7 | 105 | 119 | 89 | 171 | 2 | orePerHour=43 | HQ>=1 | — |
| 8 | 135 | 158 | 117 | 373 | 3 | orePerHour=51 | HQ>=1 | — |
| 9 | 169 | 202 | 150 | 1764 | 3 | orePerHour=58 | HQ>=1 | — |
| 10 | 207 | 252 | 188 | 4572 | 3 | orePerHour=66 | HQ>=1 | — |
| 11 | 248 | 308 | 229 | 7258 | 3 | orePerHour=73 | HQ>=1 | — |
| 12 | 292 | 369 | 275 | 9435 | 3 | orePerHour=81 | HQ>=1 | — |
| 13 | 340 | 437 | 325 | 11612 | 3 | orePerHour=89 | HQ>=1 | — |
| 14 | 391 | 510 | 380 | 13064 | 3 | orePerHour=98 | HQ>=1 | — |
| 15 | 446 | 590 | 440 | 14515 | 3 | orePerHour=106 | HQ>=1 | — |
| 16 | 504 | 676 | 503 | 16408 | 3 | orePerHour=114 | HQ>=1 | — |
| 17 | 566 | 767 | 572 | 18416 | 3 | orePerHour=123 | HQ>=1 | — |
| 18 | 631 | 865 | 645 | 20525 | 3 | orePerHour=132 | HQ>=1 | — |
| 19 | 699 | 969 | 722 | 22745 | 3 | orePerHour=141 | HQ>=1 | — |
| 20 | 771 | 1079 | 804 | 25073 | 3 | orePerHour=147 | HQ>=1 | — |
| 21 | 846 | 1196 | 891 | 27508 | 3 | orePerHour=153 | HQ>=1 | — |
| 22 | 924 | 1319 | 982 | 30051 | 3 | orePerHour=159 | HQ>=1 | — |
| 23 | 1005 | 1448 | 1078 | 32699 | 3 | orePerHour=165 | HQ>=1 | — |
| 24 | 1090 | 1583 | 1179 | 35453 | 3 | orePerHour=171 | HQ>=1 | — |
| 25 | 1178 | 1725 | 1285 | 38312 | 3 | orePerHour=177 | HQ>=1 | — |
| 26 | 1269 | 1873 | 1395 | 41276 | 3 | orePerHour=184 | HQ>=1 | — |
| 27 | 1363 | 2027 | 1510 | 44345 | 3 | orePerHour=190 | HQ>=1 | — |
| 28 | 1461 | 2188 | 1630 | 47517 | 3 | orePerHour=196 | HQ>=1 | — |
| 29 | 1561 | 2355 | 1755 | 50793 | 3 | orePerHour=203 | HQ>=1 | — |
| 30 | 1665 | 2529 | 1884 | 54172 | 3 | orePerHour=209 | HQ>=1 | — |
| 31 | 1772 | 2710 | 2019 | 57655 | 3 | orePerHour=216 | HQ>=1 | — |
| 32 | 1883 | 2896 | 2158 | 61240 | 3 | orePerHour=222 | HQ>=1 | — |
| 33 | 1996 | 3090 | 2302 | 64927 | 3 | orePerHour=229 | HQ>=1 | — |
| 34 | 2112 | 3290 | 2451 | 68716 | 4 | orePerHour=235 | HQ>=1 | — |
| 35 | 2232 | 3496 | 2605 | 72607 | 4 | orePerHour=242 | HQ>=1 | — |
| 36 | 2355 | 3709 | 2763 | 76599 | 4 | orePerHour=248 | HQ>=1 | — |
| 37 | 2481 | 3929 | 2927 | 80692 | 4 | orePerHour=255 | HQ>=1 | — |
| 38 | 2610 | 4155 | 3096 | 84886 | 4 | orePerHour=261 | HQ>=1 | — |
| 39 | 2742 | 4388 | 3269 | 89181 | 4 | orePerHour=268 | HQ>=1 | — |
| 40 | 2877 | 4628 | 3448 | 93576 | 4 | orePerHour=275 | HQ>=1 | — |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- `refinery`
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
