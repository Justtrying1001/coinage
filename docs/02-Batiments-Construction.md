# Bâtiments & Construction

> **Statut document**: référence design inspectable (synchro avec `cityEconomyConfig`).
> **Légende**: **Confirmé (snapshot config actuel)** / **Temporaire balance value** / **TODO validate with design**.

## 1. Règles globales
- **Slots**: 2 constructions concurrentes (F2P), premium queue désactivée.
- **Unicité**: un type de bâtiment par ville, progression en niveaux.
- **Niveaux max**: 20 pour tous les bâtiments documentés ici.
- **Queue**: coût débité au lancement; niveau appliqué uniquement à la fin du timer.
- **Annulation**: non supportée dans le flux actuel.
- **HQ gating**: HQ pilote les unlocks; branches militaires avec prérequis additionnels.
- **Population**: bâtiments + troupes vivantes + réservations de formation partagent le même cap.
- **Règle canonique**: Warehouse et Housing Complex ont un coût population de 0.
- **Normalisation des timers**: tous les timers de construction/formation finissent par **0** ou **5**.

## 2. Vue d’ensemble du catalogue
| Building | Category | Active version scope | Main role | Main unlock |
| --- | --- | --- | --- | --- |
| HQ | Économie | MVP actif | Bâtiment de progression centrale | Toujours disponible. |
| Mine | Économie | MVP actif | Production passive d'Ore | HQ >= 1 |
| Quarry | Économie | MVP actif | Production passive de Stone | HQ >= 1 |
| Refinery | Économie | MVP actif | Production passive d'Iron | HQ >= 3 |
| Warehouse | Économie | MVP actif | Augmente les caps Ore/Stone/Iron | HQ >= 1 |
| Housing Complex | Économie | MVP actif | Augmente le cap de population | HQ >= 1 |
| Barracks | Militaire éco | V0 actif (éco/training) | Débloque et structure les troupes ground de base | HQ >= 1 |
| Combat Forge | Militaire éco | V0 actif (éco/training) | Débloque les unités ground avancées | HQ >= 5 + Barracks >= 8 |
| Space Dock | Militaire éco | V0 actif (éco/training) | Débloque les unités de projection (catégorie air dans le système économie/training actuel) | HQ >= 10 + Combat Forge >= 5 |
| Defensive Wall | Militaire combat | Later | Défense passive | HQ 3 |
| Watch Tower | Militaire combat | Later | Détection | HQ 5 |
| Military Academy | Militaire meta | Later | Bonus permanents | HQ 15 |
| Armory | Militaire meta | Later | Équipements | HQ 18 |
| Spy Center | Espionnage | Later | Missions espionnage | HQ 12 |
| Market | Trading | Later | Échanges | HQ 7 |
| Council Chamber | Gouvernance | Later | Politique faction | HQ 7 |
| Shard Vault | Premium | Later | Cap shards | HQ 10 |

## 3. Détail par bâtiment

### HQ
- **Rôle**: Bâtiment de progression centrale. Débloque le catalogue.
- **Scope actif**: MVP actif
- **Unlock**: Toujours disponible.
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Valeurs Confirmé (snapshot config actuel).

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 220 | 180 | 35 | 55 | 1 | 1 | — | — | — | Mine, Quarry, Warehouse, Housing Complex, Barracks | — |
| 2 | 264 | 216 | 42 | 60 | 1 | 2 | — | — | — | — | — |
| 3 | 317 | 259 | 50 | 70 | 1 | 3 | — | — | — | Refinery | — |
| 4 | 380 | 311 | 60 | 75 | 1 | 4 | — | — | — | — | — |
| 5 | 456 | 373 | 73 | 85 | 1 | 5 | — | — | — | Combat Forge | — |
| 6 | 547 | 448 | 87 | 95 | 1 | 6 | — | — | — | — | — |
| 7 | 657 | 537 | 105 | 105 | 1 | 7 | — | — | — | — | — |
| 8 | 788 | 645 | 125 | 115 | 1 | 8 | — | — | — | — | — |
| 9 | 946 | 774 | 150 | 125 | 1 | 9 | — | — | — | — | — |
| 10 | 1135 | 929 | 181 | 140 | 1 | 10 | — | — | — | Space Dock | — |
| 11 | 1362 | 1115 | 217 | 155 | 1 | 11 | — | — | — | — | — |
| 12 | 1635 | 1337 | 260 | 175 | 1 | 12 | — | — | — | — | — |
| 13 | 1962 | 1605 | 312 | 190 | 2 | 14 | — | — | — | — | — |
| 14 | 2354 | 1926 | 374 | 215 | 2 | 16 | — | — | — | — | — |
| 15 | 2825 | 2311 | 449 | 235 | 2 | 18 | — | — | — | — | — |
| 16 | 3390 | 2773 | 539 | 265 | 2 | 20 | — | — | — | — | — |
| 17 | 4067 | 3328 | 647 | 290 | 2 | 22 | — | — | — | — | — |
| 18 | 4881 | 3993 | 777 | 325 | 2 | 24 | — | — | — | — | — |
| 19 | 5857 | 4792 | 932 | 360 | 2 | 26 | — | — | — | — | — |
| 20 | 7029 | 5751 | 1118 | 400 | 2 | 28 | — | — | — | — | — |

### Mine
- **Rôle**: Production passive d'Ore.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: ROI corrigé: progression coût/Δprod maintenue attractive sur 1→20.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 80 | 65 | 0 | 35 | 1 | 1 | Ore 28 | — | — | — | — |
| 2 | 94 | 76 | 0 | 40 | 1 | 2 | Ore 32 | — | — | — | — |
| 3 | 110 | 89 | 0 | 40 | 1 | 3 | Ore 37 | — | — | — | — |
| 4 | 128 | 104 | 0 | 45 | 1 | 4 | Ore 43 | — | — | — | — |
| 5 | 150 | 122 | 0 | 50 | 1 | 5 | Ore 49 | — | — | — | — |
| 6 | 175 | 143 | 0 | 55 | 1 | 6 | Ore 56 | — | — | — | — |
| 7 | 205 | 167 | 0 | 60 | 1 | 7 | Ore 65 | — | — | — | — |
| 8 | 240 | 195 | 0 | 70 | 1 | 8 | Ore 74 | — | — | — | — |
| 9 | 281 | 228 | 0 | 75 | 1 | 9 | Ore 86 | — | — | — | — |
| 10 | 329 | 267 | 0 | 85 | 1 | 10 | Ore 99 | — | — | — | — |
| 11 | 385 | 312 | 0 | 90 | 1 | 11 | Ore 113 | — | — | — | — |
| 12 | 450 | 366 | 0 | 100 | 1 | 12 | Ore 130 | — | — | — | — |
| 13 | 526 | 428 | 0 | 110 | 2 | 14 | Ore 150 | — | — | — | — |
| 14 | 616 | 500 | 0 | 120 | 2 | 16 | Ore 172 | — | — | — | — |
| 15 | 721 | 585 | 0 | 135 | 2 | 18 | Ore 198 | — | — | — | — |
| 16 | 843 | 685 | 0 | 145 | 2 | 20 | Ore 228 | — | — | — | — |
| 17 | 986 | 801 | 0 | 160 | 2 | 22 | Ore 262 | — | — | — | — |
| 18 | 1154 | 938 | 0 | 175 | 2 | 24 | Ore 301 | — | — | — | — |
| 19 | 1350 | 1097 | 0 | 195 | 2 | 26 | Ore 347 | — | — | — | — |
| 20 | 1580 | 1284 | 0 | 215 | 2 | 28 | Ore 398 | — | — | — | — |

### Quarry
- **Rôle**: Production passive de Stone.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: ROI corrigé: progression coût/Δprod maintenue attractive sur 1→20.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 72 | 82 | 0 | 35 | 1 | 1 | Stone 24 | — | — | — | — |
| 2 | 84 | 96 | 0 | 40 | 1 | 2 | Stone 28 | — | — | — | — |
| 3 | 99 | 112 | 0 | 40 | 1 | 3 | Stone 32 | — | — | — | — |
| 4 | 115 | 131 | 0 | 45 | 1 | 4 | Stone 37 | — | — | — | — |
| 5 | 135 | 154 | 0 | 50 | 1 | 5 | Stone 42 | — | — | — | — |
| 6 | 158 | 180 | 0 | 55 | 1 | 6 | Stone 48 | — | — | — | — |
| 7 | 185 | 210 | 0 | 60 | 1 | 7 | Stone 56 | — | — | — | — |
| 8 | 216 | 246 | 0 | 70 | 1 | 8 | Stone 64 | — | — | — | — |
| 9 | 253 | 288 | 0 | 75 | 1 | 9 | Stone 73 | — | — | — | — |
| 10 | 296 | 337 | 0 | 85 | 1 | 10 | Stone 84 | — | — | — | — |
| 11 | 346 | 394 | 0 | 90 | 1 | 11 | Stone 97 | — | — | — | — |
| 12 | 405 | 461 | 0 | 100 | 1 | 12 | Stone 112 | — | — | — | — |
| 13 | 474 | 540 | 0 | 110 | 2 | 14 | Stone 128 | — | — | — | — |
| 14 | 554 | 631 | 0 | 120 | 2 | 16 | Stone 148 | — | — | — | — |
| 15 | 649 | 739 | 0 | 135 | 2 | 18 | Stone 170 | — | — | — | — |
| 16 | 759 | 864 | 0 | 145 | 2 | 20 | Stone 195 | — | — | — | — |
| 17 | 888 | 1011 | 0 | 160 | 2 | 22 | Stone 225 | — | — | — | — |
| 18 | 1039 | 1183 | 0 | 175 | 2 | 24 | Stone 258 | — | — | — | — |
| 19 | 1215 | 1384 | 0 | 195 | 2 | 26 | Stone 297 | — | — | — | — |
| 20 | 1422 | 1619 | 0 | 215 | 2 | 28 | Stone 342 | — | — | — | — |

### Refinery
- **Rôle**: Production passive d'Iron.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 3
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Plus tardive et plus coûteuse que Mine/Quarry, mais ROI maintenu rationnel.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 150 | 125 | 45 | 45 | 1 | 1 | Iron 13 | — | — | — | Requires HQ 3 |
| 2 | 177 | 148 | 53 | 50 | 1 | 2 | Iron 15 | — | — | — | Requires HQ 3 |
| 3 | 209 | 174 | 63 | 55 | 1 | 3 | Iron 17 | — | — | — | Requires HQ 3 |
| 4 | 246 | 205 | 74 | 60 | 1 | 4 | Iron 20 | — | — | — | Requires HQ 3 |
| 5 | 291 | 242 | 87 | 70 | 1 | 5 | Iron 24 | — | — | — | Requires HQ 3 |
| 6 | 343 | 286 | 103 | 75 | 1 | 6 | Iron 27 | — | — | — | Requires HQ 3 |
| 7 | 405 | 337 | 121 | 85 | 1 | 7 | Iron 32 | — | — | — | Requires HQ 3 |
| 8 | 478 | 398 | 143 | 95 | 1 | 8 | Iron 37 | — | — | — | Requires HQ 3 |
| 9 | 564 | 470 | 169 | 105 | 1 | 9 | Iron 43 | — | — | — | Requires HQ 3 |
| 10 | 665 | 554 | 200 | 115 | 1 | 10 | Iron 49 | — | — | — | Requires HQ 3 |
| 11 | 785 | 654 | 236 | 130 | 1 | 11 | Iron 57 | — | — | — | Requires HQ 3 |
| 12 | 926 | 772 | 278 | 140 | 1 | 12 | Iron 67 | — | — | — | Requires HQ 3 |
| 13 | 1093 | 911 | 328 | 155 | 2 | 14 | Iron 77 | — | — | — | Requires HQ 3 |
| 14 | 1290 | 1075 | 387 | 175 | 2 | 16 | Iron 90 | — | — | — | Requires HQ 3 |
| 15 | 1522 | 1268 | 457 | 195 | 2 | 18 | Iron 104 | — | — | — | Requires HQ 3 |
| 16 | 1796 | 1497 | 539 | 215 | 2 | 20 | Iron 120 | — | — | — | Requires HQ 3 |
| 17 | 2119 | 1766 | 636 | 240 | 2 | 22 | Iron 140 | — | — | — | Requires HQ 3 |
| 18 | 2501 | 2084 | 750 | 265 | 2 | 24 | Iron 162 | — | — | — | Requires HQ 3 |
| 19 | 2951 | 2459 | 885 | 295 | 2 | 26 | Iron 188 | — | — | — | Requires HQ 3 |
| 20 | 3482 | 2902 | 1045 | 325 | 2 | 28 | Iron 218 | — | — | — | Requires HQ 3 |

### Warehouse
- **Rôle**: Augmente les caps Ore/Stone/Iron.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Support fort du système. Pop cost = 0.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 100 | 90 | 12 | 35 | 0 | 0 | — | x1.10 | — | — | — |
| 2 | 118 | 106 | 14 | 40 | 0 | 0 | — | x1.21 | — | — | — |
| 3 | 139 | 125 | 17 | 40 | 0 | 0 | — | x1.32 | — | — | — |
| 4 | 164 | 148 | 20 | 45 | 0 | 0 | — | x1.43 | — | — | — |
| 5 | 194 | 174 | 23 | 50 | 0 | 0 | — | x1.55 | — | — | — |
| 6 | 229 | 206 | 27 | 55 | 0 | 0 | — | x1.67 | — | — | — |
| 7 | 270 | 243 | 32 | 60 | 0 | 0 | — | x1.80 | — | — | — |
| 8 | 319 | 287 | 38 | 70 | 0 | 0 | — | x1.93 | — | — | — |
| 9 | 376 | 338 | 45 | 75 | 0 | 0 | — | x2.06 | — | — | — |
| 10 | 444 | 399 | 53 | 85 | 0 | 0 | — | x2.20 | — | — | — |
| 11 | 523 | 471 | 63 | 90 | 0 | 0 | — | x2.34 | — | — | — |
| 12 | 618 | 556 | 74 | 100 | 0 | 0 | — | x2.49 | — | — | — |
| 13 | 729 | 656 | 87 | 110 | 0 | 0 | — | x2.64 | — | — | — |
| 14 | 860 | 774 | 103 | 120 | 0 | 0 | — | x2.79 | — | — | — |
| 15 | 1015 | 913 | 122 | 135 | 0 | 0 | — | x2.95 | — | — | — |
| 16 | 1197 | 1078 | 144 | 145 | 0 | 0 | — | x3.11 | — | — | — |
| 17 | 1413 | 1272 | 170 | 160 | 0 | 0 | — | x3.28 | — | — | — |
| 18 | 1667 | 1501 | 200 | 175 | 0 | 0 | — | x3.45 | — | — | — |
| 19 | 1967 | 1771 | 236 | 195 | 0 | 0 | — | x3.62 | — | — | — |
| 20 | 2321 | 2089 | 279 | 215 | 0 | 0 | — | x3.80 | — | — | — |

### Housing Complex
- **Rôle**: Augmente le cap de population.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Bâtiment central de viabilité ville+armée. Pop cost = 0.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 95 | 88 | 12 | 35 | 0 | 0 | — | — | 133 | — | — |
| 2 | 112 | 104 | 14 | 40 | 0 | 0 | — | — | 212 | — | — |
| 3 | 132 | 123 | 17 | 40 | 0 | 0 | — | — | 297 | — | — |
| 4 | 156 | 145 | 20 | 45 | 0 | 0 | — | — | 388 | — | — |
| 5 | 184 | 171 | 23 | 50 | 0 | 0 | — | — | 485 | — | — |
| 6 | 217 | 201 | 27 | 55 | 0 | 0 | — | — | 588 | — | — |
| 7 | 256 | 238 | 32 | 60 | 0 | 0 | — | — | 697 | — | — |
| 8 | 303 | 280 | 38 | 70 | 0 | 0 | — | — | 812 | — | — |
| 9 | 357 | 331 | 45 | 75 | 0 | 0 | — | — | 933 | — | — |
| 10 | 421 | 390 | 53 | 85 | 0 | 0 | — | — | 1060 | — | — |
| 11 | 497 | 461 | 63 | 90 | 0 | 0 | — | — | 1193 | — | — |
| 12 | 587 | 543 | 74 | 100 | 0 | 0 | — | — | 1332 | — | — |
| 13 | 692 | 641 | 87 | 110 | 0 | 0 | — | — | 1477 | — | — |
| 14 | 817 | 757 | 103 | 120 | 0 | 0 | — | — | 1628 | — | — |
| 15 | 964 | 893 | 122 | 135 | 0 | 0 | — | — | 1785 | — | — |
| 16 | 1138 | 1054 | 144 | 145 | 0 | 0 | — | — | 1948 | — | — |
| 17 | 1342 | 1243 | 170 | 160 | 0 | 0 | — | — | 2117 | — | — |
| 18 | 1584 | 1467 | 200 | 175 | 0 | 0 | — | — | 2292 | — | — |
| 19 | 1869 | 1731 | 236 | 195 | 0 | 0 | — | — | 2473 | — | — |
| 20 | 2205 | 2043 | 279 | 215 | 0 | 0 | — | — | 2660 | — | — |

### Barracks
- **Rôle**: Débloque et structure les troupes ground de base.
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Courbe coût/temps/pop ajustée pour viabilité militaire sans deadlock.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 140 | 110 | 20 | 50 | 1 | 1 | — | — | — | — | — |
| 2 | 168 | 132 | 24 | 55 | 1 | 2 | — | — | — | — | — |
| 3 | 202 | 158 | 29 | 60 | 1 | 3 | — | — | — | — | — |
| 4 | 242 | 190 | 35 | 70 | 1 | 4 | — | — | — | — | — |
| 5 | 290 | 228 | 41 | 75 | 1 | 5 | — | — | — | — | — |
| 6 | 348 | 274 | 50 | 85 | 1 | 6 | — | — | — | — | — |
| 7 | 418 | 328 | 60 | 95 | 1 | 7 | — | — | — | — | — |
| 8 | 502 | 394 | 72 | 105 | 1 | 8 | — | — | — | — | — |
| 9 | 602 | 473 | 86 | 115 | 1 | 9 | — | — | — | — | — |
| 10 | 722 | 568 | 103 | 130 | 1 | 10 | — | — | — | — | — |
| 11 | 867 | 681 | 124 | 140 | 1 | 11 | — | — | — | — | — |
| 12 | 1040 | 817 | 149 | 160 | 1 | 12 | — | — | — | — | — |
| 13 | 1248 | 981 | 178 | 175 | 1 | 13 | — | — | — | — | — |
| 14 | 1498 | 1177 | 214 | 195 | 1 | 14 | — | — | — | — | — |
| 15 | 1797 | 1412 | 257 | 215 | 1 | 15 | — | — | — | — | — |
| 16 | 2157 | 1695 | 308 | 240 | 1 | 16 | — | — | — | — | — |
| 17 | 2588 | 2034 | 370 | 265 | 1 | 17 | — | — | — | — | — |
| 18 | 3106 | 2440 | 444 | 295 | 1 | 18 | — | — | — | — | — |
| 19 | 3727 | 2929 | 532 | 325 | 1 | 19 | — | — | — | — | — |
| 20 | 4473 | 3514 | 639 | 365 | 1 | 20 | — | — | — | — | — |

### Combat Forge
- **Rôle**: Débloque les unités ground avancées.
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 5 + Barracks >= 8
- **Prérequis**: Barracks niveau 8
- **Niveau max**: 20
- **Notes**: Courbe coût/temps/pop ajustée pour spécialisation lisible.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 240 | 205 | 80 | 65 | 1 | 1 | — | — | — | — | Requires Barracks 8 (all levels) |
| 2 | 290 | 248 | 97 | 75 | 1 | 2 | — | — | — | — | Requires Barracks 8 (all levels) |
| 3 | 351 | 300 | 117 | 80 | 1 | 3 | — | — | — | — | Requires Barracks 8 (all levels) |
| 4 | 425 | 363 | 142 | 90 | 1 | 4 | — | — | — | — | Requires Barracks 8 (all levels) |
| 5 | 514 | 439 | 171 | 100 | 1 | 5 | — | — | — | — | Requires Barracks 8 (all levels) |
| 6 | 622 | 532 | 207 | 115 | 1 | 6 | — | — | — | — | Requires Barracks 8 (all levels) |
| 7 | 753 | 643 | 251 | 130 | 1 | 7 | — | — | — | — | Requires Barracks 8 (all levels) |
| 8 | 911 | 778 | 304 | 145 | 1 | 8 | — | — | — | — | Requires Barracks 8 (all levels) |
| 9 | 1103 | 942 | 368 | 160 | 1 | 9 | — | — | — | — | Requires Barracks 8 (all levels) |
| 10 | 1334 | 1140 | 445 | 180 | 1 | 10 | — | — | — | — | Requires Barracks 8 (all levels) |
| 11 | 1615 | 1379 | 538 | 200 | 1 | 11 | — | — | — | — | Requires Barracks 8 (all levels) |
| 12 | 1954 | 1669 | 651 | 225 | 1 | 12 | — | — | — | — | Requires Barracks 8 (all levels) |
| 13 | 2364 | 2019 | 788 | 255 | 2 | 14 | — | — | — | — | Requires Barracks 8 (all levels) |
| 14 | 2860 | 2443 | 953 | 285 | 2 | 16 | — | — | — | — | Requires Barracks 8 (all levels) |
| 15 | 3461 | 2956 | 1154 | 320 | 2 | 18 | — | — | — | — | Requires Barracks 8 (all levels) |
| 16 | 4188 | 3577 | 1396 | 355 | 2 | 20 | — | — | — | — | Requires Barracks 8 (all levels) |
| 17 | 5067 | 4328 | 1689 | 400 | 2 | 22 | — | — | — | — | Requires Barracks 8 (all levels) |
| 18 | 6131 | 5237 | 2044 | 445 | 2 | 24 | — | — | — | — | Requires Barracks 8 (all levels) |
| 19 | 7419 | 6337 | 2473 | 500 | 2 | 26 | — | — | — | — | Requires Barracks 8 (all levels) |
| 20 | 8977 | 7668 | 2992 | 560 | 2 | 28 | — | — | — | — | Requires Barracks 8 (all levels) |

### Space Dock (alias actuel; docs historiques: Hub de déploiement)
- **Rôle**: Débloque les unités de projection (catégorie air dans le système économie/training actuel).
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 10 + Combat Forge >= 5
- **Prérequis**: Combat Forge niveau 5
- **Niveau max**: 20
- **Notes**: Courbe coût/temps/pop ajustée; reste la branche la plus lourde.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 360 | 300 | 150 | 80 | 1 | 1 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 2 | 439 | 366 | 183 | 90 | 1 | 2 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 3 | 536 | 447 | 223 | 100 | 1 | 3 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 4 | 654 | 545 | 272 | 115 | 1 | 4 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 5 | 798 | 665 | 332 | 130 | 1 | 5 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 6 | 973 | 811 | 405 | 145 | 2 | 7 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 7 | 1187 | 989 | 495 | 165 | 2 | 9 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 8 | 1448 | 1207 | 603 | 190 | 2 | 11 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 9 | 1767 | 1472 | 736 | 215 | 2 | 13 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 10 | 2155 | 1796 | 898 | 240 | 2 | 15 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 11 | 2630 | 2191 | 1096 | 270 | 2 | 17 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 12 | 3208 | 2673 | 1337 | 305 | 2 | 19 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 13 | 3914 | 3262 | 1631 | 345 | 2 | 21 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 14 | 4775 | 3979 | 1990 | 390 | 2 | 23 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 15 | 5826 | 4855 | 2427 | 445 | 2 | 25 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 16 | 7107 | 5923 | 2961 | 500 | 2 | 27 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 17 | 8671 | 7226 | 3613 | 565 | 2 | 29 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 18 | 10578 | 8815 | 4408 | 640 | 2 | 31 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 19 | 12906 | 10755 | 5377 | 720 | 2 | 33 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 20 | 15745 | 13121 | 6560 | 815 | 2 | 35 | — | — | — | — | Requires Combat Forge 5 (all levels) |

## 4. Économie des troupes (active)
Valeurs synchronisées avec `TROOP_CONFIG` (coûts, temps de formation, population, unlock).

| Unit | Category | Required building | Required level | Ore | Stone | Iron | Training time (s) | Pop cost |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Infantry | ground | Barracks | 1 | 35 | 20 | 0 | 20 | 1 |
| Shield Guard | ground | Barracks | 5 | 70 | 55 | 10 | 35 | 2 |
| Marksman | ground | Barracks | 10 | 98 | 62 | 35 | 45 | 1 |
| Raider Cavalry | ground | Barracks | 15 | 140 | 95 | 55 | 60 | 2 |
| Assault | ground | Combat Forge | 1 | 165 | 120 | 85 | 70 | 2 |
| Breacher | ground | Combat Forge | 8 | 240 | 200 | 130 | 95 | 3 |
| Interception Sentinel | air | Space Dock | 1 | 210 | 150 | 125 | 85 | 3 |
| Rapid Escort | air | Space Dock | 5 | 275 | 190 | 170 | 105 | 2 |

## 5. Open issues / points à valider
- **Naming drift**: `Space Dock` vs `Hub de déploiement` (décision canonique à figer).
- **Branches militaires**: coûts/temps/pop restent des **Temporaire balance value** à confirmer en playtests.
- **Combat layer**: valeurs économiques synchronisées, mais tuning final dépendra des stats de combat ultérieures.
