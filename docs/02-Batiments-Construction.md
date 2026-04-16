# Bâtiments & Construction

> **Statut document**: référence design inspectable synchronisée avec `src/game/city/economy/cityEconomyConfig.ts`.
> **Contraintes actives**: timers finissent par 0/5, Warehouse à caps absolus lisibles, prérequis par bands de niveaux.

## 1. Règles globales
- Slots: 2 constructions concurrentes (premium queue off).
- Unicité: un type de bâtiment par ville, progression de niveau 1→20.
- Population: bâtiments + troupes + réservations de formation.
- Warehouse/Housing Complex: coût population = 0.
- Timer rule: tous les timers de construction/formation finissent en **0** ou **5**.
- Courbe de temps: early hook (L1-L10), ralentissement net ensuite, late game long avec L20 >= 24h sur tous les bâtiments.

## 2. Catalogue actif (ville + économie militaire)
| Building | Main role | Unlock global |
| --- | --- | --- |
| HQ | Bâtiment de progression centrale | Toujours disponible. |
| Mine | Production passive d'Ore | HQ >= 1 |
| Quarry | Production passive de Stone | HQ >= 1 |
| Refinery | Production passive d'Iron | HQ >= 3 |
| Warehouse | Augmente les caps de stockage absolus | HQ >= 1 |
| Housing Complex | Augmente le cap de population | HQ >= 1 |
| Barracks | Débloque les troupes ground de base | HQ >= 2 + Housing Complex >= 2 |
| Combat Forge | Débloque les unités ground avancées | HQ >= 6 + Barracks >= 8 + Refinery >= 5 |
| Space Dock | Débloque les unités air (éco/training) | HQ >= 10 + Combat Forge >= 5 + Refinery >= 6 |

## 3. Tables bâtiment 1→20

### HQ
- **Rôle**: Bâtiment de progression centrale.
- **Unlock**: Toujours disponible..
- **Prérequis**: Aucun.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 220 | 180 | 35 | 55 | 1 | 1 | — | — | — | Mine, Quarry, Warehouse, Housing Complex, Barracks | — |
| 2 | 264 | 216 | 42 | 65 | 1 | 2 | — | — | — | — | — |
| 3 | 317 | 259 | 50 | 80 | 1 | 3 | — | — | — | Refinery | — |
| 4 | 380 | 311 | 60 | 100 | 1 | 4 | — | — | — | — | — |
| 5 | 456 | 373 | 73 | 120 | 1 | 5 | — | — | — | Combat Forge | — |
| 6 | 547 | 448 | 87 | 150 | 1 | 6 | — | — | — | — | — |
| 7 | 657 | 537 | 105 | 180 | 1 | 7 | — | — | — | — | — |
| 8 | 788 | 645 | 125 | 220 | 1 | 8 | — | — | — | — | — |
| 9 | 946 | 774 | 150 | 270 | 1 | 9 | — | — | — | — | — |
| 10 | 1135 | 929 | 181 | 330 | 1 | 10 | — | — | — | Space Dock | — |
| 11 | 1362 | 1115 | 217 | 625 | 1 | 11 | — | — | — | — | — |
| 12 | 1635 | 1337 | 260 | 1190 | 1 | 12 | — | — | — | — | — |
| 13 | 1962 | 1605 | 312 | 2260 | 2 | 14 | — | — | — | — | — |
| 14 | 2354 | 1926 | 374 | 4290 | 2 | 16 | — | — | — | — | — |
| 15 | 2825 | 2311 | 449 | 8155 | 2 | 18 | — | — | — | — | — |
| 16 | 3390 | 2773 | 539 | 15495 | 2 | 20 | — | — | — | — | — |
| 17 | 4067 | 3328 | 647 | 29435 | 2 | 22 | — | — | — | — | — |
| 18 | 4881 | 3993 | 777 | 55930 | 2 | 24 | — | — | — | — | — |
| 19 | 5857 | 4792 | 932 | 106265 | 2 | 26 | — | — | — | — | — |
| 20 | 7029 | 5751 | 1118 | 201900 | 2 | 28 | — | — | — | — | — |

### Mine
- **Rôle**: Production passive d'Ore.
- **Unlock**: HQ >= 1.
- **Prérequis**: Voir bands de progression.
- **Bands de progression (target level)**:
  - L1→L5: HQ 1.
  - L6→L10: HQ 4 + Quarry 5.
  - L11→L15: HQ 8 + Warehouse 6.
  - L16→L20: HQ 12 + Refinery 8.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 76 | 60 | 0 | 30 | 1 | 1 | Ore 30 | — | — | — | HQ 1 |
| 2 | 88 | 70 | 0 | 35 | 1 | 2 | Ore 34 | — | — | — | HQ 1 |
| 3 | 102 | 81 | 0 | 45 | 1 | 3 | Ore 40 | — | — | — | HQ 1 |
| 4 | 119 | 94 | 0 | 55 | 1 | 4 | Ore 46 | — | — | — | HQ 1 |
| 5 | 138 | 109 | 0 | 65 | 1 | 5 | Ore 52 | — | — | — | HQ 1 |
| 6 | 160 | 126 | 0 | 80 | 1 | 6 | Ore 60 | — | — | — | HQ 4 + Quarry 5 |
| 7 | 185 | 146 | 0 | 100 | 1 | 7 | Ore 69 | — | — | — | HQ 4 + Quarry 5 |
| 8 | 215 | 170 | 0 | 120 | 1 | 8 | Ore 80 | — | — | — | HQ 4 + Quarry 5 |
| 9 | 249 | 197 | 0 | 145 | 1 | 9 | Ore 92 | — | — | — | HQ 4 + Quarry 5 |
| 10 | 289 | 228 | 0 | 180 | 1 | 10 | Ore 106 | — | — | — | HQ 4 + Quarry 5 |
| 11 | 335 | 265 | 0 | 340 | 1 | 11 | Ore 121 | — | — | — | HQ 8 + Warehouse 6 |
| 12 | 389 | 307 | 0 | 650 | 1 | 12 | Ore 140 | — | — | — | HQ 8 + Warehouse 6 |
| 13 | 451 | 356 | 0 | 1230 | 2 | 14 | Ore 161 | — | — | — | HQ 8 + Warehouse 6 |
| 14 | 523 | 413 | 0 | 2340 | 2 | 16 | Ore 185 | — | — | — | HQ 8 + Warehouse 6 |
| 15 | 607 | 479 | 0 | 4450 | 2 | 18 | Ore 212 | — | — | — | HQ 8 + Warehouse 6 |
| 16 | 704 | 556 | 0 | 8450 | 2 | 20 | Ore 244 | — | — | — | HQ 12 + Refinery 8 |
| 17 | 817 | 645 | 0 | 16055 | 2 | 22 | Ore 281 | — | — | — | HQ 12 + Refinery 8 |
| 18 | 948 | 748 | 0 | 30505 | 2 | 24 | Ore 323 | — | — | — | HQ 12 + Refinery 8 |
| 19 | 1099 | 868 | 0 | 57960 | 2 | 26 | Ore 371 | — | — | — | HQ 12 + Refinery 8 |
| 20 | 1275 | 1007 | 0 | 110125 | 2 | 28 | Ore 427 | — | — | — | HQ 12 + Refinery 8 |

### Quarry
- **Rôle**: Production passive de Stone.
- **Unlock**: HQ >= 1.
- **Prérequis**: Voir bands de progression.
- **Bands de progression (target level)**:
  - L1→L5: HQ 1.
  - L6→L10: HQ 4 + Mine 5.
  - L11→L15: HQ 8 + Warehouse 6.
  - L16→L20: HQ 12 + Refinery 8.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 68 | 78 | 0 | 30 | 1 | 1 | Stone 26 | — | — | — | HQ 1 |
| 2 | 79 | 90 | 0 | 35 | 1 | 2 | Stone 30 | — | — | — | HQ 1 |
| 3 | 92 | 105 | 0 | 45 | 1 | 3 | Stone 34 | — | — | — | HQ 1 |
| 4 | 106 | 122 | 0 | 55 | 1 | 4 | Stone 40 | — | — | — | HQ 1 |
| 5 | 123 | 141 | 0 | 65 | 1 | 5 | Stone 45 | — | — | — | HQ 1 |
| 6 | 143 | 164 | 0 | 80 | 1 | 6 | Stone 52 | — | — | — | HQ 4 + Mine 5 |
| 7 | 166 | 190 | 0 | 100 | 1 | 7 | Stone 60 | — | — | — | HQ 4 + Mine 5 |
| 8 | 192 | 220 | 0 | 120 | 1 | 8 | Stone 69 | — | — | — | HQ 4 + Mine 5 |
| 9 | 223 | 256 | 0 | 145 | 1 | 9 | Stone 80 | — | — | — | HQ 4 + Mine 5 |
| 10 | 259 | 297 | 0 | 180 | 1 | 10 | Stone 91 | — | — | — | HQ 4 + Mine 5 |
| 11 | 300 | 344 | 0 | 340 | 1 | 11 | Stone 105 | — | — | — | HQ 8 + Warehouse 6 |
| 12 | 348 | 399 | 0 | 650 | 1 | 12 | Stone 121 | — | — | — | HQ 8 + Warehouse 6 |
| 13 | 404 | 463 | 0 | 1230 | 2 | 14 | Stone 139 | — | — | — | HQ 8 + Warehouse 6 |
| 14 | 468 | 537 | 0 | 2340 | 2 | 16 | Stone 160 | — | — | — | HQ 8 + Warehouse 6 |
| 15 | 543 | 623 | 0 | 4450 | 2 | 18 | Stone 184 | — | — | — | HQ 8 + Warehouse 6 |
| 16 | 630 | 723 | 0 | 8450 | 2 | 20 | Stone 212 | — | — | — | HQ 12 + Refinery 8 |
| 17 | 731 | 838 | 0 | 16055 | 2 | 22 | Stone 243 | — | — | — | HQ 12 + Refinery 8 |
| 18 | 848 | 972 | 0 | 30505 | 2 | 24 | Stone 280 | — | — | — | HQ 12 + Refinery 8 |
| 19 | 983 | 1128 | 0 | 57960 | 2 | 26 | Stone 322 | — | — | — | HQ 12 + Refinery 8 |
| 20 | 1141 | 1309 | 0 | 110125 | 2 | 28 | Stone 370 | — | — | — | HQ 12 + Refinery 8 |

### Refinery
- **Rôle**: Production passive d'Iron.
- **Unlock**: HQ >= 3.
- **Prérequis**: Mine 4 + Quarry 4 puis bands.
- **Bands de progression (target level)**:
  - L1→L5: HQ 3 + Mine 4 + Quarry 4.
  - L6→L10: HQ 6 + Warehouse 5.
  - L11→L15: HQ 10 + Mine 10 + Quarry 10.
  - L16→L20: HQ 14 + Warehouse 12 + Housing Complex 10.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 125 | 105 | 35 | 45 | 1 | 1 | Iron 14 | — | — | — | HQ 3 + Mine 4 + Quarry 4 |
| 2 | 146 | 122 | 41 | 55 | 1 | 2 | Iron 16 | — | — | — | HQ 3 + Mine 4 + Quarry 4 |
| 3 | 170 | 143 | 48 | 65 | 1 | 3 | Iron 19 | — | — | — | HQ 3 + Mine 4 + Quarry 4 |
| 4 | 198 | 166 | 55 | 80 | 1 | 4 | Iron 22 | — | — | — | HQ 3 + Mine 4 + Quarry 4 |
| 5 | 230 | 193 | 64 | 100 | 1 | 5 | Iron 26 | — | — | — | HQ 3 + Mine 4 + Quarry 4 |
| 6 | 268 | 225 | 75 | 120 | 1 | 6 | Iron 31 | — | — | — | HQ 6 + Warehouse 5 |
| 7 | 313 | 263 | 88 | 150 | 1 | 7 | Iron 36 | — | — | — | HQ 6 + Warehouse 5 |
| 8 | 364 | 306 | 102 | 180 | 1 | 8 | Iron 42 | — | — | — | HQ 6 + Warehouse 5 |
| 9 | 424 | 356 | 119 | 220 | 1 | 9 | Iron 49 | — | — | — | HQ 6 + Warehouse 5 |
| 10 | 494 | 415 | 138 | 270 | 1 | 10 | Iron 58 | — | — | — | HQ 6 + Warehouse 5 |
| 11 | 576 | 484 | 161 | 510 | 1 | 11 | Iron 67 | — | — | — | HQ 10 + Mine 10 + Quarry 10 |
| 12 | 671 | 563 | 188 | 975 | 1 | 12 | Iron 79 | — | — | — | HQ 10 + Mine 10 + Quarry 10 |
| 13 | 781 | 656 | 219 | 1850 | 2 | 14 | Iron 92 | — | — | — | HQ 10 + Mine 10 + Quarry 10 |
| 14 | 910 | 765 | 255 | 3510 | 2 | 16 | Iron 108 | — | — | — | HQ 10 + Mine 10 + Quarry 10 |
| 15 | 1060 | 891 | 297 | 6670 | 2 | 18 | Iron 126 | — | — | — | HQ 10 + Mine 10 + Quarry 10 |
| 16 | 1235 | 1038 | 346 | 12675 | 2 | 20 | Iron 148 | — | — | — | HQ 14 + Warehouse 12 + Housing Complex 10 |
| 17 | 1439 | 1209 | 403 | 24085 | 2 | 22 | Iron 173 | — | — | — | HQ 14 + Warehouse 12 + Housing Complex 10 |
| 18 | 1677 | 1408 | 469 | 45760 | 2 | 24 | Iron 202 | — | — | — | HQ 14 + Warehouse 12 + Housing Complex 10 |
| 19 | 1953 | 1641 | 547 | 86945 | 2 | 26 | Iron 236 | — | — | — | HQ 14 + Warehouse 12 + Housing Complex 10 |
| 20 | 2276 | 1912 | 637 | 165190 | 2 | 28 | Iron 276 | — | — | — | HQ 14 + Warehouse 12 + Housing Complex 10 |

### Warehouse
- **Rôle**: Augmente les caps de stockage absolus.
- **Unlock**: HQ >= 1.
- **Prérequis**: Voir bands de progression.
- **Bands de progression (target level)**:
  - L1→L5: HQ 1.
  - L6→L10: HQ 5.
  - L11→L15: HQ 9 + Housing Complex 5.
  - L16→L20: HQ 13 + Refinery 8.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 | 84 | 10 | 35 | 0 | 0 | — | Ore 1500 / Stone 1200 / Iron 800 | — | — | HQ 1 |
| 2 | 105 | 98 | 12 | 45 | 0 | 0 | — | Ore 2000 / Stone 1600 / Iron 1000 | — | — | HQ 1 |
| 3 | 123 | 115 | 14 | 50 | 0 | 0 | — | Ore 2600 / Stone 2100 / Iron 1300 | — | — | HQ 1 |
| 4 | 144 | 135 | 16 | 65 | 0 | 0 | — | Ore 3400 / Stone 2700 / Iron 1700 | — | — | HQ 1 |
| 5 | 169 | 157 | 19 | 80 | 0 | 0 | — | Ore 4400 / Stone 3500 / Iron 2200 | — | — | HQ 1 |
| 6 | 197 | 184 | 22 | 95 | 0 | 0 | — | Ore 5600 / Stone 4500 / Iron 2800 | — | — | HQ 5 |
| 7 | 231 | 215 | 26 | 115 | 0 | 0 | — | Ore 7200 / Stone 5800 / Iron 3600 | — | — | HQ 5 |
| 8 | 270 | 252 | 30 | 140 | 0 | 0 | — | Ore 9200 / Stone 7400 / Iron 4600 | — | — | HQ 5 |
| 9 | 316 | 295 | 35 | 170 | 0 | 0 | — | Ore 11700 / Stone 9400 / Iron 5900 | — | — | HQ 5 |
| 10 | 370 | 345 | 41 | 210 | 0 | 0 | — | Ore 14800 / Stone 11800 / Iron 7400 | — | — | HQ 5 |
| 11 | 433 | 404 | 48 | 400 | 0 | 0 | — | Ore 18600 / Stone 14900 / Iron 9300 | — | — | HQ 9 + Housing Complex 5 |
| 12 | 506 | 472 | 56 | 755 | 0 | 0 | — | Ore 23300 / Stone 18600 / Iron 11600 | — | — | HQ 9 + Housing Complex 5 |
| 13 | 592 | 553 | 66 | 1435 | 0 | 0 | — | Ore 29100 / Stone 23300 / Iron 14500 | — | — | HQ 9 + Housing Complex 5 |
| 14 | 693 | 647 | 77 | 2730 | 0 | 0 | — | Ore 36300 / Stone 29000 / Iron 18100 | — | — | HQ 9 + Housing Complex 5 |
| 15 | 811 | 757 | 90 | 5190 | 0 | 0 | — | Ore 45200 / Stone 36200 / Iron 22600 | — | — | HQ 9 + Housing Complex 5 |
| 16 | 948 | 885 | 105 | 9860 | 0 | 0 | — | Ore 56300 / Stone 45000 / Iron 28100 | — | — | HQ 13 + Refinery 8 |
| 17 | 1110 | 1036 | 123 | 18730 | 0 | 0 | — | Ore 70100 / Stone 56100 / Iron 35100 | — | — | HQ 13 + Refinery 8 |
| 18 | 1298 | 1212 | 144 | 35590 | 0 | 0 | — | Ore 87300 / Stone 69800 / Iron 43600 | — | — | HQ 13 + Refinery 8 |
| 19 | 1519 | 1418 | 169 | 67620 | 0 | 0 | — | Ore 108700 / Stone 86900 / Iron 54300 | — | — | HQ 13 + Refinery 8 |
| 20 | 1777 | 1659 | 197 | 128480 | 0 | 0 | — | Ore 135000 / Stone 108000 / Iron 67500 | — | — | HQ 13 + Refinery 8 |

### Housing Complex
- **Rôle**: Augmente le cap de population.
- **Unlock**: HQ >= 1.
- **Prérequis**: Voir bands de progression.
- **Bands de progression (target level)**:
  - L1→L5: HQ 1.
  - L6→L10: HQ 4 + Quarry 4.
  - L11→L15: HQ 8 + Warehouse 6.
  - L16→L20: HQ 12 + Refinery 7.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 | 84 | 10 | 35 | 0 | 0 | — | — | 229 | — | HQ 1 |
| 2 | 105 | 98 | 12 | 45 | 0 | 0 | — | — | 326 | — | HQ 1 |
| 3 | 123 | 115 | 14 | 50 | 0 | 0 | — | — | 431 | — | HQ 1 |
| 4 | 144 | 135 | 16 | 65 | 0 | 0 | — | — | 544 | — | HQ 1 |
| 5 | 169 | 157 | 19 | 80 | 0 | 0 | — | — | 665 | — | HQ 1 |
| 6 | 197 | 184 | 22 | 95 | 0 | 0 | — | — | 794 | — | HQ 4 + Quarry 4 |
| 7 | 231 | 215 | 26 | 115 | 0 | 0 | — | — | 931 | — | HQ 4 + Quarry 4 |
| 8 | 270 | 252 | 30 | 140 | 0 | 0 | — | — | 1076 | — | HQ 4 + Quarry 4 |
| 9 | 316 | 295 | 35 | 170 | 0 | 0 | — | — | 1229 | — | HQ 4 + Quarry 4 |
| 10 | 370 | 345 | 41 | 210 | 0 | 0 | — | — | 1390 | — | HQ 4 + Quarry 4 |
| 11 | 433 | 404 | 48 | 400 | 0 | 0 | — | — | 1559 | — | HQ 8 + Warehouse 6 |
| 12 | 506 | 472 | 56 | 755 | 0 | 0 | — | — | 1736 | — | HQ 8 + Warehouse 6 |
| 13 | 592 | 553 | 66 | 1435 | 0 | 0 | — | — | 1921 | — | HQ 8 + Warehouse 6 |
| 14 | 693 | 647 | 77 | 2730 | 0 | 0 | — | — | 2114 | — | HQ 8 + Warehouse 6 |
| 15 | 811 | 757 | 90 | 5190 | 0 | 0 | — | — | 2315 | — | HQ 8 + Warehouse 6 |
| 16 | 948 | 885 | 105 | 9860 | 0 | 0 | — | — | 2524 | — | HQ 12 + Refinery 7 |
| 17 | 1110 | 1036 | 123 | 18730 | 0 | 0 | — | — | 2741 | — | HQ 12 + Refinery 7 |
| 18 | 1298 | 1212 | 144 | 35590 | 0 | 0 | — | — | 2966 | — | HQ 12 + Refinery 7 |
| 19 | 1519 | 1418 | 169 | 67620 | 0 | 0 | — | — | 3199 | — | HQ 12 + Refinery 7 |
| 20 | 1777 | 1659 | 197 | 128480 | 0 | 0 | — | — | 3440 | — | HQ 12 + Refinery 7 |

### Barracks
- **Rôle**: Débloque les troupes ground de base.
- **Unlock**: HQ >= 2 + Housing Complex >= 2.
- **Prérequis**: Housing Complex 2 puis bands.
- **Bands de progression (target level)**:
  - L1→L5: HQ 2 + Housing Complex 2.
  - L6→L10: HQ 6 + Mine 6.
  - L11→L15: HQ 10 + Quarry 8.
  - L16→L20: HQ 14 + Housing Complex 12.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 140 | 110 | 20 | 50 | 1 | 1 | — | — | — | — | HQ 2 + Housing Complex 2 |
| 2 | 168 | 132 | 24 | 60 | 1 | 2 | — | — | — | — | HQ 2 + Housing Complex 2 |
| 3 | 202 | 158 | 29 | 75 | 1 | 3 | — | — | — | — | HQ 2 + Housing Complex 2 |
| 4 | 242 | 190 | 35 | 90 | 1 | 4 | — | — | — | — | HQ 2 + Housing Complex 2 |
| 5 | 290 | 228 | 41 | 110 | 1 | 5 | — | — | — | — | HQ 2 + Housing Complex 2 |
| 6 | 348 | 274 | 50 | 135 | 1 | 6 | — | — | — | — | HQ 6 + Mine 6 |
| 7 | 418 | 328 | 60 | 165 | 1 | 7 | — | — | — | — | HQ 6 + Mine 6 |
| 8 | 502 | 394 | 72 | 200 | 1 | 8 | — | — | — | — | HQ 6 + Mine 6 |
| 9 | 602 | 473 | 86 | 245 | 1 | 9 | — | — | — | — | HQ 6 + Mine 6 |
| 10 | 722 | 568 | 103 | 300 | 1 | 10 | — | — | — | — | HQ 6 + Mine 6 |
| 11 | 867 | 681 | 124 | 570 | 1 | 11 | — | — | — | — | HQ 10 + Quarry 8 |
| 12 | 1040 | 817 | 149 | 1080 | 1 | 12 | — | — | — | — | HQ 10 + Quarry 8 |
| 13 | 1248 | 981 | 178 | 2055 | 1 | 13 | — | — | — | — | HQ 10 + Quarry 8 |
| 14 | 1498 | 1177 | 214 | 3900 | 1 | 14 | — | — | — | — | HQ 10 + Quarry 8 |
| 15 | 1797 | 1412 | 257 | 7415 | 1 | 15 | — | — | — | — | HQ 10 + Quarry 8 |
| 16 | 2157 | 1695 | 308 | 14085 | 1 | 16 | — | — | — | — | HQ 14 + Housing Complex 12 |
| 17 | 2588 | 2034 | 370 | 26760 | 1 | 17 | — | — | — | — | HQ 14 + Housing Complex 12 |
| 18 | 3106 | 2440 | 444 | 50845 | 1 | 18 | — | — | — | — | HQ 14 + Housing Complex 12 |
| 19 | 3727 | 2929 | 532 | 96605 | 1 | 19 | — | — | — | — | HQ 14 + Housing Complex 12 |
| 20 | 4473 | 3514 | 639 | 183545 | 1 | 20 | — | — | — | — | HQ 14 + Housing Complex 12 |

### Combat Forge
- **Rôle**: Débloque les unités ground avancées.
- **Unlock**: HQ >= 6 + Barracks >= 8 + Refinery >= 5.
- **Prérequis**: Barracks 8 + Refinery 5 puis bands.
- **Bands de progression (target level)**:
  - L1→L5: HQ 6 + Barracks 8 + Refinery 5.
  - L6→L10: HQ 10 + Warehouse 8.
  - L11→L15: HQ 13 + Barracks 12.
  - L16→L20: HQ 16 + Housing Complex 14.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 240 | 205 | 80 | 65 | 1 | 1 | — | — | — | — | HQ 6 + Barracks 8 + Refinery 5 |
| 2 | 290 | 248 | 97 | 80 | 1 | 2 | — | — | — | — | HQ 6 + Barracks 8 + Refinery 5 |
| 3 | 351 | 300 | 117 | 95 | 1 | 3 | — | — | — | — | HQ 6 + Barracks 8 + Refinery 5 |
| 4 | 425 | 363 | 142 | 120 | 1 | 4 | — | — | — | — | HQ 6 + Barracks 8 + Refinery 5 |
| 5 | 514 | 439 | 171 | 145 | 1 | 5 | — | — | — | — | HQ 6 + Barracks 8 + Refinery 5 |
| 6 | 622 | 532 | 207 | 175 | 1 | 6 | — | — | — | — | HQ 10 + Warehouse 8 |
| 7 | 753 | 643 | 251 | 215 | 1 | 7 | — | — | — | — | HQ 10 + Warehouse 8 |
| 8 | 911 | 778 | 304 | 260 | 1 | 8 | — | — | — | — | HQ 10 + Warehouse 8 |
| 9 | 1103 | 942 | 368 | 320 | 1 | 9 | — | — | — | — | HQ 10 + Warehouse 8 |
| 10 | 1334 | 1140 | 445 | 390 | 1 | 10 | — | — | — | — | HQ 10 + Warehouse 8 |
| 11 | 1615 | 1379 | 538 | 740 | 1 | 11 | — | — | — | — | HQ 13 + Barracks 12 |
| 12 | 1954 | 1669 | 651 | 1405 | 1 | 12 | — | — | — | — | HQ 13 + Barracks 12 |
| 13 | 2364 | 2019 | 788 | 2670 | 2 | 14 | — | — | — | — | HQ 13 + Barracks 12 |
| 14 | 2860 | 2443 | 953 | 5070 | 2 | 16 | — | — | — | — | HQ 13 + Barracks 12 |
| 15 | 3461 | 2956 | 1154 | 9635 | 2 | 18 | — | — | — | — | HQ 13 + Barracks 12 |
| 16 | 4188 | 3577 | 1396 | 18310 | 2 | 20 | — | — | — | — | HQ 16 + Housing Complex 14 |
| 17 | 5067 | 4328 | 1689 | 34790 | 2 | 22 | — | — | — | — | HQ 16 + Housing Complex 14 |
| 18 | 6131 | 5237 | 2044 | 66095 | 2 | 24 | — | — | — | — | HQ 16 + Housing Complex 14 |
| 19 | 7419 | 6337 | 2473 | 125585 | 2 | 26 | — | — | — | — | HQ 16 + Housing Complex 14 |
| 20 | 8977 | 7668 | 2992 | 238610 | 2 | 28 | — | — | — | — | HQ 16 + Housing Complex 14 |

### Space Dock
- **Rôle**: Débloque les unités air (éco/training).
- **Unlock**: HQ >= 10 + Combat Forge >= 5 + Refinery >= 6.
- **Prérequis**: Combat Forge 5 + Refinery 6 puis bands.
- **Bands de progression (target level)**:
  - L1→L5: HQ 10 + Combat Forge 5 + Refinery 6.
  - L6→L10: HQ 13 + Warehouse 10.
  - L11→L15: HQ 16 + Combat Forge 10.
  - L16→L20: HQ 18 + Housing Complex 14.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 360 | 300 | 150 | 80 | 1 | 1 | — | — | — | — | HQ 10 + Combat Forge 5 + Refinery 6 |
| 2 | 439 | 366 | 183 | 100 | 1 | 2 | — | — | — | — | HQ 10 + Combat Forge 5 + Refinery 6 |
| 3 | 536 | 447 | 223 | 120 | 1 | 3 | — | — | — | — | HQ 10 + Combat Forge 5 + Refinery 6 |
| 4 | 654 | 545 | 272 | 145 | 1 | 4 | — | — | — | — | HQ 10 + Combat Forge 5 + Refinery 6 |
| 5 | 798 | 665 | 332 | 175 | 1 | 5 | — | — | — | — | HQ 10 + Combat Forge 5 + Refinery 6 |
| 6 | 973 | 811 | 405 | 215 | 2 | 7 | — | — | — | — | HQ 13 + Warehouse 10 |
| 7 | 1187 | 989 | 495 | 265 | 2 | 9 | — | — | — | — | HQ 13 + Warehouse 10 |
| 8 | 1448 | 1207 | 603 | 320 | 2 | 11 | — | — | — | — | HQ 13 + Warehouse 10 |
| 9 | 1767 | 1472 | 736 | 395 | 2 | 13 | — | — | — | — | HQ 13 + Warehouse 10 |
| 10 | 2155 | 1796 | 898 | 480 | 2 | 15 | — | — | — | — | HQ 13 + Warehouse 10 |
| 11 | 2630 | 2191 | 1096 | 910 | 2 | 17 | — | — | — | — | HQ 16 + Combat Forge 10 |
| 12 | 3208 | 2673 | 1337 | 1730 | 2 | 19 | — | — | — | — | HQ 16 + Combat Forge 10 |
| 13 | 3914 | 3262 | 1631 | 3285 | 2 | 21 | — | — | — | — | HQ 16 + Combat Forge 10 |
| 14 | 4775 | 3979 | 1990 | 6240 | 2 | 23 | — | — | — | — | HQ 16 + Combat Forge 10 |
| 15 | 5826 | 4855 | 2427 | 11860 | 2 | 25 | — | — | — | — | HQ 16 + Combat Forge 10 |
| 16 | 7107 | 5923 | 2961 | 22535 | 2 | 27 | — | — | — | — | HQ 18 + Housing Complex 14 |
| 17 | 8671 | 7226 | 3613 | 42815 | 2 | 29 | — | — | — | — | HQ 18 + Housing Complex 14 |
| 18 | 10578 | 8815 | 4408 | 81350 | 2 | 31 | — | — | — | — | HQ 18 + Housing Complex 14 |
| 19 | 12906 | 10755 | 5377 | 154565 | 2 | 33 | — | — | — | — | HQ 18 + Housing Complex 14 |
| 20 | 15745 | 13121 | 6560 | 293675 | 2 | 35 | — | — | — | — | HQ 18 + Housing Complex 14 |

## 4. Économie des troupes (active)
| Unit | Category | Required building | Required level | Ore | Stone | Iron | Training time (s) | Pop cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Infantry | ground | Barracks | 1 | 30 | 18 | 0 | 20 | 1 |
| Shield Guard | ground | Barracks | 5 | 62 | 48 | 10 | 35 | 2 |
| Marksman | ground | Barracks | 10 | 90 | 56 | 30 | 45 | 1 |
| Raider Cavalry | ground | Barracks | 15 | 128 | 88 | 48 | 60 | 2 |
| Assault | ground | Combat Forge | 1 | 155 | 110 | 80 | 70 | 2 |
| Breacher | ground | Combat Forge | 8 | 225 | 185 | 120 | 95 | 3 |
| Interception Sentinel | air | Space Dock | 1 | 195 | 140 | 115 | 85 | 3 |
| Rapid Escort | air | Space Dock | 5 | 255 | 175 | 155 | 105 | 2 |

## 5. Validation rapide (design)
- Warehouse: caps absolus explicités avec valeurs arrondies lisibles par niveau.
- Construction time: courbe en 3 phases (L1-L10 rapide, L11-L15 ralentissement fort, L16-L20 engagement long).
- Tous les bâtiments atteignent >=24h au niveau 20.
- Timers: toutes les valeurs finissent par 0/5.
- À playtester encore: ressenti exact de friction entre L11-L15 pour les profils militaires agressifs.

## 6. Inventaire complet du contenu bâtiment (MVP + V0 + later)

> Cette section est la vue **full-content** canonique pour la progression bâtiment.  
> Le runtime actif reste `src/game/city/economy/cityEconomyConfig.ts` (subset implémenté), et la source de vérité full-content est `src/game/city/economy/cityContentCatalog.ts`.

| Building ID | Nom | Catégorie | Scope phase | Statut définition | Runtime implémenté | Notes de complétude |
| --- | --- | --- | --- | --- | --- | --- |
| hq | HQ | economy | MVP | fully_defined | Oui | Table 1→20 complète active |
| mine | Mine | economy | MVP | fully_defined | Oui | Table 1→20 complète active |
| quarry | Quarry | economy | MVP | fully_defined | Oui | Table 1→20 complète active |
| refinery | Refinery | economy | MVP | fully_defined | Oui | Table 1→20 complète active |
| warehouse | Warehouse | support_logistics | MVP | fully_defined | Oui | Caps absolus 1→20 complets |
| housing_complex | Housing Complex | support_logistics | MVP | fully_defined | Oui | Bonus pop 1→20 complet |
| barracks | Barracks | military | V0 | fully_defined | Oui | Coûts/temps/pop complets, effets de niveau encore minimalistes |
| combat_forge | Combat Forge | military | V0 | fully_defined | Oui | Coûts/temps/pop complets, effets de niveau encore minimalistes |
| space_dock | Space Dock (Hub de déploiement) | military | V0 | fully_defined | Oui | Coûts/temps/pop complets, unités projection partielles |
| defensive_wall | Mur défensif | defense | later | partially_defined | Non | Rôle défini, tables valeurs manquantes |
| watch_tower | Tour de guet | defense | later | partially_defined | Non | Rôle macro défensif/intel défini, valeurs manquantes |
| military_academy | Académie militaire | military | later | partially_defined | Non | Branche intentionnelle, design détaillé manquant |
| armament_factory | Usine d’armement | military | later | partially_defined | Non | Branche intentionnelle, design détaillé manquant |
| intelligence_center | Centre d’espionnage | intelligence | later | partially_defined | Non | Paliers missions définis (1/5/10/15/20), tables coûts/temps manquantes |
| research_lab | Laboratoire de recherche | research | later | partially_defined | Non | RC formula connue, tables bâtiment manquantes |
| market | Marché | support_logistics | later | partially_defined | Non | Fonction trading définie, tables et limites manquantes |
| council_chamber | Council Chamber | governance | later | partially_defined | Non | Rôle gouvernance connu, effets bâtiment non spécifiés |

## 7. Graphe de prérequis étendu (full-content)

### 7.1 Tronc principal (actif)
- `HQ` est la spine centrale.
- `HQ 1` → Mine, Quarry, Warehouse, Housing Complex.
- `HQ 3 + Mine 4 + Quarry 4` → Refinery.
- `HQ 2 + Housing 2` → Barracks.
- `HQ 6 + Barracks 8 + Refinery 5` → Combat Forge.
- `HQ 10 + Combat Forge 5 + Refinery 6` → Space Dock.

### 7.2 Branches full-game (intégrées au catalogue, non implémentées runtime)
- Défense: `HQ 4+` → Defensive Wall ; `HQ 5+` → Watch Tower.
- Intelligence: `HQ 4+` → Intelligence Center.
- Recherche: `HQ 4+` → Research Lab.
- Trading: `HQ 5+` → Market.
- Gouvernance locale: `HQ 8+` → Council Chamber.
- Militaire avancé later: `HQ 12+` → Military Academy + Armament Factory.

### 7.3 Intentions gameplay des branches (sans fake-finalisation)
- Défense: amplifier la résilience locale et l’anti-snowball de siège.
- Intelligence: brancher vault d’Iron + missions d’espionnage.
- Recherche: structurer la capacité RC et les 6 branches techno.
- Trading: flux logistiques inter-villes et spécialisation économique.
- Gouvernance: interface locale vers le système Conseil/faction.

## 8. Statut de complétude valeurs (bâtiments)

| Domaine valeur | Actif (MVP/V0 runtime) | Later (catalogue full-content) |
| --- | --- | --- |
| Coûts ressources | Confirmés | **Provisoires tablés** pour Mur, Tour, Académie, Usine, Marché, Lab, Espionnage, Council Chamber |
| Temps construction | Confirmés | **Provisoires tablés** avec courbe staged 1→20 |
| Coût population | Confirmés pour subset actif | **Provisoires tablés** (bands 1/1/2 ou 1/2/2 selon branche) |
| Effets | Confirmés sur économie/stockage/pop | **Clarifiés** par niveau (défense, trading, espionnage, recherche, gouvernance, militarisation) |
| Paliers/prérequis | Confirmés sur subset actif | **Étendus** avec gates par bands pour toutes les branches core non-premium |

## 9. Référence unités / troupes

- Le catalogue unités full-content est détaillé dans `docs/06-Troupes-Formation.md`.
- Les unités runtime actives restent documentées en section 4 ci-dessus (subset implémenté).

## 10. Contenu différé (hors périmètre de balance actuel)

Les branches prestige/premium/special sont **retirées du périmètre actif de balancing** pour stabiliser d’abord le coeur économie + militaire:

- `training_grounds` (prestige)
- `shard_vault` (premium)

Elles sont conservées dans le code via un catalogue différé dédié (`DEFERRED_BUILDING_CATALOG`) pour réintégration ultérieure après stabilisation du core-game.

## 11. Effets gameplay clarifiés (core non-premium)

- **Defensive Wall**: bonus global de défense en phase 2 (provisoire, niveau-scalé).
- **Watch Tower**: alerte précoce attaques entrantes + efficacité d’interception garnison (provisoire).
- **Military Academy**: réduction temps de formation ground + capacité doctrine (provisoire).
- **Armament Factory**: réduction coût Iron des unités militaires + réduction temps de formation projection/siège (provisoire).
- **Intelligence Center**: robustesse vault espionnage + mapping des paliers missions 1/5/10/15/20.
- **Research Lab**: progression RC alignée sur la formule micro (`+3 RC / niveau`, provisoire).
- **Market**: throughput des convois logistiques + réduction taxe de transfert interne (provisoire).
- **Council Chamber**: poids de vote gouvernance + réduction préparation mobilisation collective (provisoire).

> Tous ces effets sont intégrés au catalogue de balance comme **provisional design values** et restent marqués `partially_defined` tant que l’arbitrage produit combat/macro n’est pas finalisé.
