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

## 2. Vue d’ensemble du catalogue
| Building | Category | Active version scope | Main role | Main unlock |
| --- | --- | --- | --- | --- |
| HQ | Économie | MVP actif | Progression centrale | N/A |
| Mine | Économie | MVP actif | Prod Ore | HQ 1 |
| Quarry | Économie | MVP actif | Prod Stone | HQ 1 |
| Refinery | Économie | MVP actif | Prod Iron | HQ 3 |
| Warehouse | Économie | MVP actif | Storage caps | HQ 1 |
| Housing Complex | Économie | MVP actif | Population cap | HQ 1 |
| Barracks | Militaire éco | V0 actif (éco/training) | Troupes ground base | HQ 1 |
| Combat Forge | Militaire éco | V0 actif (éco/training) | Troupes ground avancées | HQ 5 + Barracks 8 |
| Space Dock / Hub de déploiement | Militaire éco | V0 actif (éco/training) | Unités projection | HQ 10 + Combat Forge 5 |
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
| 2 | 273 | 223 | 43 | 62 | 1 | 2 | — | — | — | — | — |
| 3 | 338 | 277 | 54 | 70 | 1 | 3 | — | — | — | Refinery | — |
| 4 | 419 | 343 | 67 | 79 | 1 | 4 | — | — | — | — | — |
| 5 | 520 | 426 | 83 | 90 | 1 | 5 | — | — | — | Combat Forge | — |
| 6 | 645 | 528 | 103 | 101 | 2 | 7 | — | — | — | — | — |
| 7 | 800 | 654 | 127 | 115 | 2 | 9 | — | — | — | — | — |
| 8 | 992 | 811 | 158 | 129 | 2 | 11 | — | — | — | — | — |
| 9 | 1230 | 1006 | 196 | 146 | 2 | 13 | — | — | — | — | — |
| 10 | 1525 | 1248 | 243 | 165 | 2 | 15 | — | — | — | Space Dock | — |
| 11 | 1891 | 1547 | 301 | 187 | 2 | 17 | — | — | — | — | — |
| 12 | 2345 | 1918 | 373 | 211 | 2 | 19 | — | — | — | — | — |
| 13 | 2907 | 2379 | 463 | 238 | 3 | 22 | — | — | — | — | — |
| 14 | 3605 | 2950 | 574 | 269 | 3 | 25 | — | — | — | — | — |
| 15 | 4470 | 3657 | 711 | 304 | 3 | 28 | — | — | — | — | — |
| 16 | 5543 | 4535 | 882 | 344 | 3 | 31 | — | — | — | — | — |
| 17 | 6873 | 5624 | 1093 | 389 | 3 | 34 | — | — | — | — | — |
| 18 | 8523 | 6973 | 1356 | 439 | 3 | 37 | — | — | — | — | — |
| 19 | 10568 | 8647 | 1681 | 496 | 3 | 40 | — | — | — | — | — |
| 20 | 13105 | 10722 | 2085 | 561 | 3 | 43 | — | — | — | — | — |

### Mine
- **Rôle**: Production passive d'Ore.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Valeurs Confirmé (snapshot config actuel).

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 90 | 70 | 0 | 36 | 1 | 1 | Ore 24 | — | — | — | — |
| 2 | 110 | 85 | 0 | 40 | 1 | 2 | Ore 27 | — | — | — | — |
| 3 | 134 | 104 | 0 | 45 | 1 | 3 | Ore 31 | — | — | — | — |
| 4 | 163 | 127 | 0 | 51 | 1 | 4 | Ore 35 | — | — | — | — |
| 5 | 199 | 155 | 0 | 57 | 1 | 5 | Ore 39 | — | — | — | — |
| 6 | 243 | 189 | 0 | 63 | 2 | 7 | Ore 44 | — | — | — | — |
| 7 | 297 | 231 | 0 | 71 | 2 | 9 | Ore 50 | — | — | — | — |
| 8 | 362 | 282 | 0 | 80 | 2 | 11 | Ore 56 | — | — | — | — |
| 9 | 442 | 344 | 0 | 89 | 2 | 13 | Ore 64 | — | — | — | — |
| 10 | 539 | 419 | 0 | 100 | 2 | 15 | Ore 72 | — | — | — | — |
| 11 | 657 | 511 | 0 | 112 | 2 | 17 | Ore 81 | — | — | — | — |
| 12 | 802 | 624 | 0 | 125 | 2 | 19 | Ore 92 | — | — | — | — |
| 13 | 978 | 761 | 0 | 140 | 3 | 22 | Ore 104 | — | — | — | — |
| 14 | 1194 | 928 | 0 | 157 | 3 | 25 | Ore 118 | — | — | — | — |
| 15 | 1456 | 1133 | 0 | 176 | 3 | 28 | Ore 133 | — | — | — | — |
| 16 | 1777 | 1382 | 0 | 197 | 3 | 31 | Ore 150 | — | — | — | — |
| 17 | 2168 | 1686 | 0 | 221 | 3 | 34 | Ore 170 | — | — | — | — |
| 18 | 2645 | 2057 | 0 | 247 | 3 | 37 | Ore 192 | — | — | — | — |
| 19 | 3226 | 2509 | 0 | 277 | 3 | 40 | Ore 217 | — | — | — | — |
| 20 | 3936 | 3062 | 0 | 310 | 3 | 43 | Ore 245 | — | — | — | — |

### Quarry
- **Rôle**: Production passive de Stone.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Valeurs Confirmé (snapshot config actuel).

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 78 | 95 | 0 | 38 | 1 | 1 | Stone 20 | — | — | — | — |
| 2 | 95 | 116 | 0 | 43 | 1 | 2 | Stone 23 | — | — | — | — |
| 3 | 116 | 141 | 0 | 48 | 1 | 3 | Stone 26 | — | — | — | — |
| 4 | 142 | 173 | 0 | 53 | 1 | 4 | Stone 29 | — | — | — | — |
| 5 | 173 | 210 | 0 | 60 | 1 | 5 | Stone 33 | — | — | — | — |
| 6 | 211 | 257 | 0 | 67 | 2 | 7 | Stone 37 | — | — | — | — |
| 7 | 257 | 313 | 0 | 75 | 2 | 9 | Stone 42 | — | — | — | — |
| 8 | 314 | 382 | 0 | 84 | 2 | 11 | Stone 47 | — | — | — | — |
| 9 | 383 | 466 | 0 | 94 | 2 | 13 | Stone 53 | — | — | — | — |
| 10 | 467 | 569 | 0 | 105 | 2 | 15 | Stone 60 | — | — | — | — |
| 11 | 570 | 694 | 0 | 118 | 2 | 17 | Stone 68 | — | — | — | — |
| 12 | 695 | 847 | 0 | 132 | 2 | 19 | Stone 77 | — | — | — | — |
| 13 | 848 | 1033 | 0 | 148 | 3 | 22 | Stone 87 | — | — | — | — |
| 14 | 1035 | 1260 | 0 | 166 | 3 | 25 | Stone 98 | — | — | — | — |
| 15 | 1262 | 1537 | 0 | 186 | 3 | 28 | Stone 111 | — | — | — | — |
| 16 | 1540 | 1876 | 0 | 208 | 3 | 31 | Stone 125 | — | — | — | — |
| 17 | 1879 | 2288 | 0 | 233 | 3 | 34 | Stone 141 | — | — | — | — |
| 18 | 2292 | 2792 | 0 | 261 | 3 | 37 | Stone 160 | — | — | — | — |
| 19 | 2796 | 3406 | 0 | 292 | 3 | 40 | Stone 180 | — | — | — | — |
| 20 | 3411 | 4155 | 0 | 327 | 3 | 43 | Stone 204 | — | — | — | — |

### Refinery
- **Rôle**: Production passive d'Iron.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 3
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Valeurs Confirmé (snapshot config actuel). Étape économique plus coûteuse et plus lente.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 170 | 140 | 50 | 48 | 1 | 1 | Iron 10 | — | — | — | Requires HQ 3 |
| 2 | 209 | 172 | 62 | 54 | 1 | 2 | Iron 11 | — | — | — | Requires HQ 3 |
| 3 | 257 | 212 | 76 | 61 | 1 | 3 | Iron 13 | — | — | — | Requires HQ 3 |
| 4 | 316 | 261 | 93 | 69 | 1 | 4 | Iron 15 | — | — | — | Requires HQ 3 |
| 5 | 389 | 320 | 114 | 78 | 1 | 5 | Iron 17 | — | — | — | Requires HQ 3 |
| 6 | 479 | 394 | 141 | 88 | 2 | 7 | Iron 19 | — | — | — | Requires HQ 3 |
| 7 | 589 | 485 | 173 | 100 | 2 | 9 | Iron 22 | — | — | — | Requires HQ 3 |
| 8 | 724 | 596 | 213 | 113 | 2 | 11 | Iron 25 | — | — | — | Requires HQ 3 |
| 9 | 891 | 733 | 262 | 128 | 2 | 13 | Iron 29 | — | — | — | Requires HQ 3 |
| 10 | 1095 | 902 | 322 | 144 | 2 | 15 | Iron 33 | — | — | — | Requires HQ 3 |
| 11 | 1347 | 1110 | 396 | 163 | 2 | 17 | Iron 37 | — | — | — | Requires HQ 3 |
| 12 | 1657 | 1365 | 487 | 184 | 2 | 19 | Iron 42 | — | — | — | Requires HQ 3 |
| 13 | 2038 | 1679 | 600 | 208 | 3 | 22 | Iron 48 | — | — | — | Requires HQ 3 |
| 14 | 2507 | 2065 | 737 | 235 | 3 | 25 | Iron 55 | — | — | — | Requires HQ 3 |
| 15 | 3084 | 2540 | 907 | 266 | 3 | 28 | Iron 63 | — | — | — | Requires HQ 3 |
| 16 | 3793 | 3124 | 1116 | 300 | 3 | 31 | Iron 71 | — | — | — | Requires HQ 3 |
| 17 | 4666 | 3842 | 1372 | 339 | 3 | 34 | Iron 81 | — | — | — | Requires HQ 3 |
| 18 | 5739 | 4726 | 1688 | 383 | 3 | 37 | Iron 93 | — | — | — | Requires HQ 3 |
| 19 | 7059 | 5813 | 2076 | 433 | 3 | 40 | Iron 106 | — | — | — | Requires HQ 3 |
| 20 | 8683 | 7150 | 2554 | 489 | 3 | 43 | Iron 121 | — | — | — | Requires HQ 3 |

### Warehouse
- **Rôle**: Augmente les caps Ore/Stone/Iron.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Valeurs Confirmé (snapshot config actuel). Pop cost = 0.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 110 | 100 | 15 | 40 | 0 | 0 | — | x1.08 | — | — | — |
| 2 | 133 | 121 | 18 | 44 | 0 | 0 | — | x1.17 | — | — | — |
| 3 | 161 | 146 | 22 | 49 | 0 | 0 | — | x1.25 | — | — | — |
| 4 | 195 | 177 | 27 | 55 | 0 | 0 | — | x1.34 | — | — | — |
| 5 | 236 | 214 | 32 | 61 | 0 | 0 | — | x1.44 | — | — | — |
| 6 | 285 | 259 | 39 | 67 | 0 | 0 | — | x1.53 | — | — | — |
| 7 | 345 | 314 | 47 | 75 | 0 | 0 | — | x1.63 | — | — | — |
| 8 | 418 | 380 | 57 | 83 | 0 | 0 | — | x1.74 | — | — | — |
| 9 | 505 | 459 | 69 | 92 | 0 | 0 | — | x1.84 | — | — | — |
| 10 | 612 | 556 | 83 | 102 | 0 | 0 | — | x1.95 | — | — | — |
| 11 | 740 | 673 | 101 | 114 | 0 | 0 | — | x2.06 | — | — | — |
| 12 | 895 | 814 | 122 | 126 | 0 | 0 | — | x2.18 | — | — | — |
| 13 | 1083 | 985 | 148 | 140 | 0 | 0 | — | x2.29 | — | — | — |
| 14 | 1311 | 1192 | 179 | 155 | 0 | 0 | — | x2.41 | — | — | — |
| 15 | 1586 | 1442 | 216 | 172 | 0 | 0 | — | x2.54 | — | — | — |
| 16 | 1919 | 1745 | 262 | 191 | 0 | 0 | — | x2.66 | — | — | — |
| 17 | 2323 | 2111 | 317 | 212 | 0 | 0 | — | x2.79 | — | — | — |
| 18 | 2810 | 2555 | 383 | 236 | 0 | 0 | — | x2.93 | — | — | — |
| 19 | 3400 | 3091 | 464 | 262 | 0 | 0 | — | x3.06 | — | — | — |
| 20 | 4114 | 3740 | 561 | 291 | 0 | 0 | — | x3.20 | — | — | — |

### Housing Complex
- **Rôle**: Augmente le cap de population.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Valeurs Confirmé (snapshot config actuel). Pop cost = 0.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 105 | 98 | 14 | 39 | 0 | 0 | — | — | 102 | — | — |
| 2 | 127 | 119 | 17 | 43 | 0 | 0 | — | — | 163 | — | — |
| 3 | 154 | 143 | 20 | 48 | 0 | 0 | — | — | 228 | — | — |
| 4 | 186 | 174 | 25 | 53 | 0 | 0 | — | — | 297 | — | — |
| 5 | 225 | 210 | 30 | 59 | 0 | 0 | — | — | 370 | — | — |
| 6 | 272 | 254 | 36 | 66 | 0 | 0 | — | — | 447 | — | — |
| 7 | 330 | 308 | 44 | 73 | 0 | 0 | — | — | 528 | — | — |
| 8 | 399 | 372 | 53 | 81 | 0 | 0 | — | — | 613 | — | — |
| 9 | 482 | 450 | 64 | 90 | 0 | 0 | — | — | 702 | — | — |
| 10 | 584 | 545 | 78 | 100 | 0 | 0 | — | — | 795 | — | — |
| 11 | 706 | 659 | 94 | 111 | 0 | 0 | — | — | 892 | — | — |
| 12 | 855 | 798 | 114 | 123 | 0 | 0 | — | — | 993 | — | — |
| 13 | 1034 | 965 | 138 | 136 | 0 | 0 | — | — | 1098 | — | — |
| 14 | 1251 | 1168 | 167 | 151 | 0 | 0 | — | — | 1207 | — | — |
| 15 | 1514 | 1413 | 202 | 168 | 0 | 0 | — | — | 1320 | — | — |
| 16 | 1832 | 1710 | 244 | 187 | 0 | 0 | — | — | 1437 | — | — |
| 17 | 2217 | 2069 | 296 | 207 | 0 | 0 | — | — | 1558 | — | — |
| 18 | 2683 | 2504 | 358 | 230 | 0 | 0 | — | — | 1683 | — | — |
| 19 | 3246 | 3029 | 433 | 255 | 0 | 0 | — | — | 1812 | — | — |
| 20 | 3927 | 3666 | 524 | 283 | 0 | 0 | — | — | 1945 | — | — |

### Barracks
- **Rôle**: Débloque et structure les troupes ground de base.
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Temporaire balance value — TODO validate with design.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 150 | 120 | 20 | 52 | 1 | 1 | — | — | — | — | — |
| 2 | 184 | 148 | 25 | 59 | 1 | 2 | — | — | — | — | — |
| 3 | 227 | 182 | 30 | 66 | 1 | 3 | — | — | — | — | — |
| 4 | 279 | 223 | 37 | 75 | 1 | 4 | — | — | — | — | — |
| 5 | 343 | 275 | 46 | 85 | 1 | 5 | — | — | — | — | — |
| 6 | 422 | 338 | 56 | 96 | 1 | 6 | — | — | — | — | — |
| 7 | 519 | 416 | 69 | 108 | 1 | 7 | — | — | — | — | — |
| 8 | 639 | 511 | 85 | 122 | 1 | 8 | — | — | — | — | — |
| 9 | 786 | 629 | 105 | 138 | 1 | 9 | — | — | — | — | — |
| 10 | 967 | 773 | 129 | 156 | 1 | 10 | — | — | — | — | — |
| 11 | 1189 | 951 | 159 | 177 | 1 | 11 | — | — | — | — | — |
| 12 | 1462 | 1170 | 195 | 199 | 1 | 12 | — | — | — | — | — |
| 13 | 1799 | 1439 | 240 | 225 | 2 | 14 | — | — | — | — | — |
| 14 | 2212 | 1770 | 295 | 255 | 2 | 16 | — | — | — | — | — |
| 15 | 2721 | 2177 | 363 | 288 | 2 | 18 | — | — | — | — | — |
| 16 | 3347 | 2678 | 446 | 325 | 2 | 20 | — | — | — | — | — |
| 17 | 4117 | 3294 | 549 | 368 | 2 | 22 | — | — | — | — | — |
| 18 | 5064 | 4051 | 675 | 415 | 2 | 24 | — | — | — | — | — |
| 19 | 6228 | 4983 | 830 | 469 | 2 | 26 | — | — | — | — | — |
| 20 | 7661 | 6129 | 1021 | 530 | 2 | 28 | — | — | — | — | — |

### Combat Forge
- **Rôle**: Débloque les unités ground avancées.
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 5 + Barracks >= 8
- **Prérequis**: Barracks niveau 8
- **Niveau max**: 20
- **Notes**: Temporaire balance value — TODO validate with design.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 280 | 240 | 90 | 68 | 2 | 2 | — | — | — | — | Requires Barracks 8 (all levels) |
| 2 | 347 | 298 | 112 | 78 | 2 | 4 | — | — | — | — | Requires Barracks 8 (all levels) |
| 3 | 431 | 369 | 138 | 88 | 2 | 6 | — | — | — | — | Requires Barracks 8 (all levels) |
| 4 | 534 | 458 | 172 | 101 | 2 | 8 | — | — | — | — | Requires Barracks 8 (all levels) |
| 5 | 662 | 567 | 213 | 115 | 2 | 10 | — | — | — | — | Requires Barracks 8 (all levels) |
| 6 | 821 | 704 | 264 | 131 | 2 | 12 | — | — | — | — | Requires Barracks 8 (all levels) |
| 7 | 1018 | 872 | 327 | 149 | 2 | 14 | — | — | — | — | Requires Barracks 8 (all levels) |
| 8 | 1262 | 1082 | 406 | 170 | 2 | 16 | — | — | — | — | Requires Barracks 8 (all levels) |
| 9 | 1565 | 1341 | 503 | 194 | 2 | 18 | — | — | — | — | Requires Barracks 8 (all levels) |
| 10 | 1941 | 1663 | 624 | 221 | 2 | 20 | — | — | — | — | Requires Barracks 8 (all levels) |
| 11 | 2406 | 2063 | 773 | 252 | 2 | 22 | — | — | — | — | Requires Barracks 8 (all levels) |
| 12 | 2984 | 2558 | 959 | 287 | 2 | 24 | — | — | — | — | Requires Barracks 8 (all levels) |
| 13 | 3700 | 3172 | 1189 | 328 | 3 | 27 | — | — | — | — | Requires Barracks 8 (all levels) |
| 14 | 4588 | 3933 | 1475 | 373 | 3 | 30 | — | — | — | — | Requires Barracks 8 (all levels) |
| 15 | 5689 | 4877 | 1829 | 426 | 3 | 33 | — | — | — | — | Requires Barracks 8 (all levels) |
| 16 | 7055 | 6047 | 2268 | 485 | 3 | 36 | — | — | — | — | Requires Barracks 8 (all levels) |
| 17 | 8748 | 7498 | 2812 | 553 | 3 | 39 | — | — | — | — | Requires Barracks 8 (all levels) |
| 18 | 10847 | 9298 | 3487 | 631 | 3 | 42 | — | — | — | — | Requires Barracks 8 (all levels) |
| 19 | 13451 | 11529 | 4323 | 719 | 3 | 45 | — | — | — | — | Requires Barracks 8 (all levels) |
| 20 | 16679 | 14296 | 5361 | 820 | 3 | 48 | — | — | — | — | Requires Barracks 8 (all levels) |

### Space Dock (alias actuel; docs historiques: Hub de déploiement)
- **Rôle**: Débloque les unités de projection (catégorie air dans le système économie/training actuel).
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 10 + Combat Forge >= 5
- **Prérequis**: Combat Forge niveau 5
- **Niveau max**: 20
- **Notes**: Temporaire balance value — TODO validate with design + naming canonical à figer.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production per hour | Storage effect | Population cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 430 | 360 | 180 | 84 | 2 | 2 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 2 | 538 | 450 | 225 | 97 | 2 | 4 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 3 | 672 | 562 | 281 | 111 | 2 | 6 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 4 | 840 | 703 | 352 | 128 | 2 | 8 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 5 | 1050 | 879 | 439 | 147 | 2 | 10 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 6 | 1312 | 1099 | 549 | 169 | 3 | 13 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 7 | 1640 | 1373 | 687 | 194 | 3 | 16 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 8 | 2050 | 1717 | 858 | 223 | 3 | 19 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 9 | 2563 | 2146 | 1073 | 257 | 3 | 22 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 10 | 3204 | 2682 | 1341 | 296 | 3 | 25 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 11 | 4005 | 3353 | 1676 | 340 | 3 | 28 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 12 | 5006 | 4191 | 2095 | 391 | 3 | 31 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 13 | 6257 | 5239 | 2619 | 449 | 3 | 34 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 14 | 7822 | 6548 | 3274 | 517 | 3 | 37 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 15 | 9777 | 8185 | 4093 | 594 | 3 | 40 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 16 | 12221 | 10232 | 5116 | 684 | 3 | 43 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 17 | 15277 | 12790 | 6395 | 786 | 3 | 46 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 18 | 19096 | 15987 | 7994 | 904 | 3 | 49 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 19 | 23870 | 19984 | 9992 | 1040 | 3 | 52 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 20 | 29837 | 24980 | 12490 | 1195 | 3 | 55 | — | — | — | — | Requires Combat Forge 5 (all levels) |

## 4. Open issues / points à valider
- **Naming drift**: `Space Dock` vs `Hub de déploiement` (décision canonique à figer).
- **Branches militaires**: coûts/temps/pop marqués **Temporaire balance value** en attente de validation design.
- **Contradiction doc unités Barracks** (DOC 02 historique vs DOC 03) sur paliers exacts: arbitrage produit requis.
- **Bâtiments later-phase** listés au catalogue mais non détaillés 1→20 ici faute de table active centralisée.
