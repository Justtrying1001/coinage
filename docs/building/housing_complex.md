# Housing Complex

## 1. Résumé
- ID technique: `housing_complex`
- Branche / catégorie: `economy`
- Statut dans le code: implémenté
- Rôle gameplay réel: Augmente le cap de population (et sert de base à la milice).
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 45
- Condition de déblocage HQ: HQ >= 1
- Prérequis globaux: aucun
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: oui

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): populationCapBonus
- Effets lus explicitement par le runtime ('cityEconomySystem'): populationCapBonus
- Entrée de catalogue correspondante: oui (phase=mvp, definitionStatus=fully_defined, gameplayImplemented=true)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 0 | 0 | 0 | 0 | 0 | populationCapBonus=114 | HQ>=1 | — |
| 2 | 5 | 4 | 1 | 125 | 0 | populationCapBonus=121 | HQ>=1 | — |
| 3 | 24 | 18 | 5 | 250 | 0 | populationCapBonus=134 | HQ>=1 | — |
| 4 | 64 | 49 | 16 | 315 | 0 | populationCapBonus=152 | HQ>=1 | — |
| 5 | 129 | 104 | 38 | 320 | 0 | populationCapBonus=175 | HQ>=1 | — |
| 6 | 228 | 190 | 74 | 360 | 0 | populationCapBonus=206 | HQ>=1 | — |
| 7 | 304 | 260 | 107 | 1752 | 0 | populationCapBonus=245 | HQ>=1 | — |
| 8 | 391 | 341 | 147 | 3203 | 0 | populationCapBonus=291 | HQ>=1 | — |
| 9 | 487 | 433 | 195 | 6606 | 0 | populationCapBonus=343 | HQ>=1 | — |
| 10 | 593 | 536 | 251 | 12010 | 0 | populationCapBonus=399 | HQ>=1 | — |
| 11 | 709 | 650 | 316 | 16607 | 0 | populationCapBonus=458 | HQ>=1 | — |
| 12 | 834 | 776 | 389 | 20166 | 0 | populationCapBonus=520 | HQ>=1 | — |
| 13 | 969 | 913 | 471 | 23724 | 0 | populationCapBonus=584 | HQ>=1 | — |
| 14 | 1113 | 1061 | 563 | 26690 | 0 | populationCapBonus=651 | HQ>=1 | — |
| 15 | 1266 | 1220 | 665 | 29655 | 0 | populationCapBonus=720 | HQ>=1 | — |
| 16 | 1428 | 1391 | 776 | 33095 | 0 | populationCapBonus=790 | HQ>=1 | — |
| 17 | 1600 | 1573 | 898 | 36687 | 0 | populationCapBonus=863 | HQ>=1 | — |
| 18 | 1780 | 1767 | 1030 | 40432 | 0 | populationCapBonus=938 | HQ>=1 | — |
| 19 | 1970 | 1972 | 1172 | 44324 | 0 | populationCapBonus=1015 | HQ>=1 | — |
| 20 | 2168 | 2188 | 1326 | 48362 | 0 | populationCapBonus=1094 | HQ>=1 | — |
| 21 | 2375 | 2416 | 1490 | 52544 | 0 | populationCapBonus=1174 | HQ>=1 | — |
| 22 | 2591 | 2655 | 1667 | 56869 | 0 | populationCapBonus=1257 | HQ>=1 | — |
| 23 | 2815 | 2906 | 1854 | 61332 | 0 | populationCapBonus=1341 | HQ>=1 | — |
| 24 | 3048 | 3168 | 2054 | 65935 | 0 | populationCapBonus=1426 | HQ>=1 | — |
| 25 | 3290 | 3442 | 2265 | 70673 | 0 | populationCapBonus=1514 | HQ>=1 | — |
| 26 | 3541 | 3727 | 2488 | 75546 | 0 | populationCapBonus=1602 | HQ>=1 | — |
| 27 | 3800 | 4024 | 2724 | 80551 | 0 | populationCapBonus=1693 | HQ>=1 | — |
| 28 | 4067 | 4332 | 2973 | 85689 | 0 | populationCapBonus=1785 | HQ>=1 | — |
| 29 | 4343 | 4652 | 3234 | 90956 | 0 | populationCapBonus=1878 | HQ>=1 | — |
| 30 | 4627 | 4983 | 3508 | 96353 | 0 | populationCapBonus=1973 | HQ>=1 | — |
| 31 | 4920 | 5326 | 3795 | 101876 | 0 | populationCapBonus=2070 | HQ>=1 | — |
| 32 | 5221 | 5681 | 4096 | 107526 | 0 | populationCapBonus=2168 | HQ>=1 | — |
| 33 | 5530 | 6047 | 4410 | 113301 | 0 | populationCapBonus=2267 | HQ>=1 | — |
| 34 | 5847 | 6425 | 4738 | 119198 | 0 | populationCapBonus=2368 | HQ>=1 | — |
| 35 | 6173 | 6814 | 5079 | 125219 | 0 | populationCapBonus=2470 | HQ>=1 | — |
| 36 | 6507 | 7215 | 5434 | 131362 | 0 | populationCapBonus=2573 | HQ>=1 | — |
| 37 | 6849 | 7628 | 5803 | 137626 | 0 | populationCapBonus=2678 | HQ>=1 | — |
| 38 | 7199 | 8052 | 6187 | 144008 | 0 | populationCapBonus=2784 | HQ>=1 | — |
| 39 | 7558 | 8489 | 6585 | 150511 | 0 | populationCapBonus=2891 | HQ>=1 | — |
| 40 | 7924 | 8936 | 6998 | 157730 | 0 | populationCapBonus=3000 | HQ>=1 | — |
| 41 | 8298 | 9396 | 7425 | 163866 | 0 | populationCapBonus=3109 | HQ>=1 | — |
| 42 | 8681 | 9867 | 7867 | 170719 | 0 | populationCapBonus=3220 | HQ>=1 | — |
| 43 | 9071 | 10349 | 8324 | 177686 | 0 | populationCapBonus=3332 | HQ>=1 | — |
| 44 | 9470 | 10844 | 8796 | 184768 | 0 | populationCapBonus=3446 | HQ>=1 | — |
| 45 | 9876 | 11350 | 9283 | 191963 | 0 | populationCapBonus=3560 | HQ>=1 | — |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- `barracks`
- `research_lab`

### Unités liées
- `citizen_militia`

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- aucune

## 6. Détails runtime importants
- `getPopulationSnapshot` prend le cap depuis `populationCapBonus`; `activateMilitia` utilise ce niveau pour la taille de milice (cap niveau 25).

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
