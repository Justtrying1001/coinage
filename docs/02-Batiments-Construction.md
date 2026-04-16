# Bâtiments & Construction
> **Statut document**: référence design détaillée, alignée sur la structure centralisée actuelle (`cityEconomyConfig`).
> **Légende balance**: **Confirmé (snapshot config actuel)**, **Temporaire balance value**, **TODO validate with design**.
## 1. Règles globales
- **Slots de construction**: 2 slots concurrents (F2P), premium queue désactivée dans la configuration actuelle.
- **Unicité bâtiment**: 1 type de bâtiment par ville, progression par niveau (pas de duplication de type).
- **Niveaux max**: niveau 20 pour tous les bâtiments documentés ici.
- **Queue**: coût débité au lancement, progression au timer, niveau appliqué uniquement à la fin.
- **Annulation**: non implémentée dans le flux actuel (pas de cancel).
- **HQ gating**: HQ gouverne les déblocages, complété par prérequis de bâtiments pour certaines branches militaires.
- **Population**:
  - les bâtiments réservent de la population (coût par niveau) ;
  - `Warehouse` et `Housing Complex` consomment 0 ;
  - les troupes vivantes consomment de la population ;
  - la formation réserve aussi de la population pendant l'entraînement.
## 2. Vue d’ensemble du catalogue
| Building | Category | Active version scope | Main role | Main unlock |
| --- | --- | --- | --- | --- |
| HQ | Économie | MVP actif | Progression centrale | N/A |
| Mine | Économie | MVP actif | Prod Ore | HQ 1 |
| Quarry | Économie | MVP actif | Prod Stone | HQ 1 |
| Refinery | Économie | MVP actif | Prod Iron | HQ 3 |
| Warehouse | Économie | MVP actif | Storage caps | HQ 1 |
| Housing Complex | Économie | MVP actif | Population cap | HQ 1 |
| Barracks | Militaire éco | V0 actif (éco/training) | Troupes ground de base | HQ 1 |
| Combat Forge | Militaire éco | V0 actif (éco/training) | Troupes ground avancées | HQ 5 + Barracks 8 |
| Space Dock / Hub de déploiement | Militaire éco | V0 actif (éco/training) | Unités projection (air) | HQ 10 + Combat Forge 5 |
| Defensive Wall | Militaire combat | Later (non implémenté ici) | Défense passive | HQ 3 |
| Watch Tower | Militaire combat | Later (non implémenté ici) | Détection | HQ 5 |
| Military Academy | Militaire meta | Later (non implémenté ici) | Bonus stats permanentes | HQ 15 |
| Armory | Militaire meta | Later (non implémenté ici) | Équipements | HQ 18 |
| Spy Center | Espionnage | Later (non implémenté ici) | Missions espionnage | HQ 12 |
| Market | Trading | Later (non implémenté ici) | Échanges | HQ 7 |
| Council Chamber | Gouvernance | Later (non implémenté ici) | Politique faction | HQ 7 |
| Shard Vault | Premium | Later (hors scope) | Cap shards | HQ 10 |

## 3. Détail par bâtiment

### HQ
- **Rôle**: Bâtiment de progression centrale. Débloque le catalogue.
- **Scope actif**: MVP actif
- **Unlock**: Toujours disponible.
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Valeurs actuelles issues de la config centralisée (snapshot produit).

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 240 | 200 | 40 | 60 | 1 | 1 | — | — | — | Mine, Quarry, Warehouse, Housing Complex, Barracks | — |
| 2 | 320 | 270 | 55 | 90 | 1 | 2 | — | — | — | — | — |
| 3 | 430 | 360 | 75 | 130 | 1 | 3 | — | — | — | Refinery | — |
| 4 | 570 | 475 | 100 | 180 | 1 | 4 | — | — | — | — | — |
| 5 | 760 | 630 | 135 | 240 | 2 | 6 | — | — | — | Combat Forge | — |
| 6 | 1000 | 830 | 180 | 315 | 2 | 8 | — | — | — | — | — |
| 7 | 1320 | 1100 | 240 | 405 | 2 | 10 | — | — | — | — | — |
| 8 | 1740 | 1450 | 320 | 510 | 2 | 12 | — | — | — | — | — |
| 9 | 2290 | 1920 | 420 | 630 | 3 | 15 | — | — | — | — | — |
| 10 | 3020 | 2530 | 560 | 765 | 3 | 18 | — | — | — | Space Dock | — |
| 11 | 3980 | 3330 | 740 | 915 | 3 | 21 | — | — | — | — | — |
| 12 | 5250 | 4390 | 980 | 1080 | 3 | 24 | — | — | — | — | — |
| 13 | 6920 | 5790 | 1290 | 1260 | 4 | 28 | — | — | — | — | — |
| 14 | 9120 | 7640 | 1710 | 1455 | 4 | 32 | — | — | — | — | — |
| 15 | 12020 | 10080 | 2260 | 1665 | 4 | 36 | — | — | — | — | — |
| 16 | 15840 | 13290 | 2980 | 1890 | 4 | 40 | — | — | — | — | — |
| 17 | 20880 | 17540 | 3930 | 2130 | 5 | 45 | — | — | — | — | — |
| 18 | 27530 | 23150 | 5190 | 2385 | 5 | 50 | — | — | — | — | — |
| 19 | 36310 | 30570 | 6850 | 2655 | 5 | 55 | — | — | — | — | — |
| 20 | 47900 | 40350 | 9040 | 2940 | 6 | 61 | — | — | — | — | — |

### Mine
- **Rôle**: Production passive d'Ore.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Production confirmée dans la structure actuelle.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 110 | 70 | 0 | 40 | 1 | 1 | Ore 20 | — | — | — | — |
| 2 | 145 | 93 | 0 | 55 | 1 | 2 | Ore 28 | — | — | — | — |
| 3 | 192 | 122 | 0 | 72 | 1 | 3 | Ore 37 | — | — | — | — |
| 4 | 253 | 161 | 0 | 91 | 1 | 4 | Ore 47 | — | — | — | — |
| 5 | 334 | 213 | 0 | 113 | 1 | 5 | Ore 58 | — | — | — | — |
| 6 | 441 | 281 | 0 | 138 | 1 | 6 | Ore 70 | — | — | — | — |
| 7 | 582 | 371 | 0 | 166 | 2 | 8 | Ore 83 | — | — | — | — |
| 8 | 768 | 490 | 0 | 197 | 2 | 10 | Ore 97 | — | — | — | — |
| 9 | 1014 | 646 | 0 | 231 | 2 | 12 | Ore 112 | — | — | — | — |
| 10 | 1338 | 853 | 0 | 269 | 2 | 14 | Ore 128 | — | — | — | — |
| 11 | 1766 | 1126 | 0 | 310 | 2 | 16 | Ore 145 | — | — | — | — |
| 12 | 2331 | 1486 | 0 | 354 | 2 | 18 | Ore 163 | — | — | — | — |
| 13 | 3077 | 1961 | 0 | 402 | 3 | 21 | Ore 182 | — | — | — | — |
| 14 | 4062 | 2588 | 0 | 454 | 3 | 24 | Ore 202 | — | — | — | — |
| 15 | 5362 | 3416 | 0 | 510 | 3 | 27 | Ore 223 | — | — | — | — |
| 16 | 7077 | 4509 | 0 | 570 | 3 | 30 | Ore 245 | — | — | — | — |
| 17 | 9342 | 5952 | 0 | 634 | 4 | 34 | Ore 268 | — | — | — | — |
| 18 | 12331 | 7856 | 0 | 703 | 4 | 38 | Ore 292 | — | — | — | — |
| 19 | 16277 | 10370 | 0 | 776 | 4 | 42 | Ore 317 | — | — | — | — |
| 20 | 21486 | 13688 | 0 | 854 | 4 | 46 | Ore 343 | — | — | — | — |

### Quarry
- **Rôle**: Production passive de Stone.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Production confirmée dans la structure actuelle.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 85 | 105 | 0 | 42 | 1 | 1 | Stone 16 | — | — | — | — |
| 2 | 112 | 139 | 0 | 58 | 1 | 2 | Stone 23 | — | — | — | — |
| 3 | 148 | 183 | 0 | 75 | 1 | 3 | Stone 31 | — | — | — | — |
| 4 | 196 | 242 | 0 | 95 | 1 | 4 | Stone 40 | — | — | — | — |
| 5 | 258 | 319 | 0 | 117 | 1 | 5 | Stone 50 | — | — | — | — |
| 6 | 341 | 421 | 0 | 142 | 1 | 6 | Stone 61 | — | — | — | — |
| 7 | 450 | 556 | 0 | 170 | 2 | 8 | Stone 73 | — | — | — | — |
| 8 | 594 | 734 | 0 | 201 | 2 | 10 | Stone 86 | — | — | — | — |
| 9 | 784 | 969 | 0 | 236 | 2 | 12 | Stone 100 | — | — | — | — |
| 10 | 1034 | 1279 | 0 | 274 | 2 | 14 | Stone 115 | — | — | — | — |
| 11 | 1365 | 1688 | 0 | 315 | 2 | 16 | Stone 131 | — | — | — | — |
| 12 | 1801 | 2228 | 0 | 360 | 2 | 18 | Stone 148 | — | — | — | — |
| 13 | 2378 | 2941 | 0 | 409 | 3 | 21 | Stone 166 | — | — | — | — |
| 14 | 3138 | 3882 | 0 | 462 | 3 | 24 | Stone 185 | — | — | — | — |
| 15 | 4143 | 5124 | 0 | 519 | 3 | 27 | Stone 205 | — | — | — | — |
| 16 | 5470 | 6764 | 0 | 580 | 3 | 30 | Stone 226 | — | — | — | — |
| 17 | 7220 | 8929 | 0 | 646 | 4 | 34 | Stone 248 | — | — | — | — |
| 18 | 9531 | 11787 | 0 | 717 | 4 | 38 | Stone 271 | — | — | — | — |
| 19 | 12581 | 15559 | 0 | 793 | 4 | 42 | Stone 295 | — | — | — | — |
| 20 | 16607 | 20538 | 0 | 874 | 4 | 46 | Stone 320 | — | — | — | — |

### Refinery
- **Rôle**: Production passive d'Iron.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 3
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Étape de progression marquante au palier HQ 3.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 210 | 170 | 35 | 55 | 1 | 1 | Iron 8 | — | — | — | Requires HQ 3 |
| 2 | 278 | 225 | 47 | 74 | 1 | 2 | Iron 12 | — | — | — | Requires HQ 3 |
| 3 | 367 | 297 | 62 | 95 | 1 | 3 | Iron 17 | — | — | — | Requires HQ 3 |
| 4 | 484 | 392 | 82 | 119 | 1 | 4 | Iron 23 | — | — | — | Requires HQ 3 |
| 5 | 639 | 517 | 108 | 146 | 1 | 5 | Iron 30 | — | — | — | Requires HQ 3 |
| 6 | 843 | 683 | 143 | 176 | 1 | 6 | Iron 38 | — | — | — | Requires HQ 3 |
| 7 | 1112 | 901 | 189 | 209 | 2 | 8 | Iron 47 | — | — | — | Requires HQ 3 |
| 8 | 1468 | 1190 | 249 | 246 | 2 | 10 | Iron 57 | — | — | — | Requires HQ 3 |
| 9 | 1938 | 1571 | 329 | 286 | 2 | 12 | Iron 68 | — | — | — | Requires HQ 3 |
| 10 | 2558 | 2074 | 434 | 330 | 2 | 14 | Iron 80 | — | — | — | Requires HQ 3 |
| 11 | 3377 | 2738 | 573 | 378 | 2 | 16 | Iron 93 | — | — | — | Requires HQ 3 |
| 12 | 4457 | 3615 | 756 | 430 | 2 | 18 | Iron 107 | — | — | — | Requires HQ 3 |
| 13 | 5884 | 4772 | 998 | 486 | 3 | 21 | Iron 122 | — | — | — | Requires HQ 3 |
| 14 | 7768 | 6300 | 1317 | 546 | 3 | 24 | Iron 138 | — | — | — | Requires HQ 3 |
| 15 | 10254 | 8316 | 1738 | 610 | 3 | 27 | Iron 155 | — | — | — | Requires HQ 3 |
| 16 | 13535 | 10978 | 2294 | 678 | 3 | 30 | Iron 173 | — | — | — | Requires HQ 3 |
| 17 | 17866 | 14492 | 3028 | 750 | 4 | 34 | Iron 192 | — | — | — | Requires HQ 3 |
| 18 | 23582 | 19130 | 3997 | 826 | 4 | 38 | Iron 212 | — | — | — | Requires HQ 3 |
| 19 | 31129 | 25251 | 5276 | 906 | 4 | 42 | Iron 233 | — | — | — | Requires HQ 3 |
| 20 | 41090 | 33331 | 6964 | 990 | 4 | 46 | Iron 255 | — | — | — | Requires HQ 3 |

### Warehouse
- **Rôle**: Augmente les caps Ore/Stone/Iron.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Population cost toujours 0 (règle canonique).

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 130 | 120 | 20 | 45 | 0 | 0 | — | x1.15 | — | — | — |
| 2 | 172 | 158 | 26 | 62 | 0 | 0 | — | x1.32 | — | — | — |
| 3 | 228 | 209 | 34 | 81 | 0 | 0 | — | x1.5 | — | — | — |
| 4 | 301 | 276 | 45 | 103 | 0 | 0 | — | x1.69 | — | — | — |
| 5 | 397 | 364 | 59 | 127 | 0 | 0 | — | x1.89 | — | — | — |
| 6 | 524 | 480 | 78 | 154 | 0 | 0 | — | x2.1 | — | — | — |
| 7 | 692 | 634 | 103 | 184 | 0 | 0 | — | x2.32 | — | — | — |
| 8 | 914 | 836 | 136 | 217 | 0 | 0 | — | x2.55 | — | — | — |
| 9 | 1206 | 1104 | 179 | 253 | 0 | 0 | — | x2.79 | — | — | — |
| 10 | 1592 | 1457 | 237 | 292 | 0 | 0 | — | x3.04 | — | — | — |
| 11 | 2102 | 1924 | 312 | 334 | 0 | 0 | — | x3.3 | — | — | — |
| 12 | 2774 | 2542 | 412 | 379 | 0 | 0 | — | x3.57 | — | — | — |
| 13 | 3661 | 3359 | 544 | 427 | 0 | 0 | — | x3.85 | — | — | — |
| 14 | 4832 | 4438 | 718 | 478 | 0 | 0 | — | x4.14 | — | — | — |
| 15 | 6378 | 5862 | 948 | 532 | 0 | 0 | — | x4.44 | — | — | — |
| 16 | 8419 | 7743 | 1251 | 589 | 0 | 0 | — | x4.75 | — | — | — |
| 17 | 11113 | 10227 | 1652 | 649 | 0 | 0 | — | x5.07 | — | — | — |
| 18 | 14669 | 13505 | 2181 | 712 | 0 | 0 | — | x5.4 | — | — | — |
| 19 | 19364 | 17835 | 2879 | 778 | 0 | 0 | — | x5.74 | — | — | — |
| 20 | 25564 | 23552 | 3801 | 847 | 0 | 0 | — | x6.09 | — | — | — |

### Housing Complex
- **Rôle**: Augmente le cap de population.
- **Scope actif**: MVP actif
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Population cost toujours 0 (règle canonique).

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 125 | 118 | 18 | 44 | 0 | 0 | — | — | 80 | — | — |
| 2 | 165 | 156 | 24 | 61 | 0 | 0 | — | — | 170 | — | — |
| 3 | 218 | 206 | 32 | 80 | 0 | 0 | — | — | 270 | — | — |
| 4 | 288 | 272 | 42 | 102 | 0 | 0 | — | — | 380 | — | — |
| 5 | 380 | 359 | 56 | 126 | 0 | 0 | — | — | 500 | — | — |
| 6 | 502 | 474 | 74 | 153 | 0 | 0 | — | — | 630 | — | — |
| 7 | 663 | 626 | 98 | 183 | 0 | 0 | — | — | 770 | — | — |
| 8 | 875 | 826 | 129 | 216 | 0 | 0 | — | — | 920 | — | — |
| 9 | 1155 | 1091 | 171 | 252 | 0 | 0 | — | — | 1080 | — | — |
| 10 | 1525 | 1440 | 225 | 291 | 0 | 0 | — | — | 1250 | — | — |
| 11 | 2014 | 1901 | 297 | 333 | 0 | 0 | — | — | 1430 | — | — |
| 12 | 2659 | 2510 | 392 | 378 | 0 | 0 | — | — | 1620 | — | — |
| 13 | 3510 | 3313 | 517 | 426 | 0 | 0 | — | — | 1820 | — | — |
| 14 | 4633 | 4374 | 682 | 477 | 0 | 0 | — | — | 2030 | — | — |
| 15 | 6116 | 5774 | 900 | 531 | 0 | 0 | — | — | 2250 | — | — |
| 16 | 8074 | 7622 | 1188 | 588 | 0 | 0 | — | — | 2480 | — | — |
| 17 | 10658 | 10062 | 1568 | 648 | 0 | 0 | — | — | 2720 | — | — |
| 18 | 14069 | 13282 | 2070 | 711 | 0 | 0 | — | — | 2970 | — | — |
| 19 | 18570 | 17532 | 2732 | 777 | 0 | 0 | — | — | 3230 | — | — |
| 20 | 24512 | 23141 | 3606 | 846 | 0 | 0 | — | — | 3500 | — | — |

### Barracks
- **Rôle**: Débloque et structure les troupes de ligne (ground).
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 1
- **Prérequis**: Aucun
- **Niveau max**: 20
- **Notes**: Valeurs de coûts/temps marquées provisoires (balance temporaire) : TODO validation design.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 180 | 150 | 30 | 65 | 1 | 1 | — | — | — | — | — |
| 2 | 239 | 200 | 40 | 75 | 1 | 2 | — | — | — | — | — |
| 3 | 318 | 265 | 53 | 87 | 1 | 3 | — | — | — | — | — |
| 4 | 423 | 353 | 71 | 101 | 1 | 4 | — | — | — | — | — |
| 5 | 563 | 469 | 94 | 118 | 1 | 5 | — | — | — | — | — |
| 6 | 749 | 624 | 125 | 137 | 1 | 6 | — | — | — | — | — |
| 7 | 996 | 830 | 166 | 158 | 1 | 7 | — | — | — | — | — |
| 8 | 1325 | 1104 | 221 | 184 | 1 | 8 | — | — | — | — | — |
| 9 | 1762 | 1469 | 294 | 213 | 1 | 9 | — | — | — | — | — |
| 10 | 2344 | 1953 | 391 | 247 | 1 | 10 | — | — | — | — | — |
| 11 | 3117 | 2598 | 520 | 287 | 1 | 11 | — | — | — | — | — |
| 12 | 4146 | 3455 | 691 | 333 | 1 | 12 | — | — | — | — | — |
| 13 | 5514 | 4595 | 919 | 386 | 1 | 13 | — | — | — | — | — |
| 14 | 7334 | 6112 | 1222 | 448 | 1 | 14 | — | — | — | — | — |
| 15 | 9754 | 8129 | 1626 | 519 | 1 | 15 | — | — | — | — | — |
| 16 | 12973 | 10811 | 2162 | 602 | 1 | 16 | — | — | — | — | — |
| 17 | 17254 | 14379 | 2876 | 699 | 1 | 17 | — | — | — | — | — |
| 18 | 22948 | 19124 | 3825 | 810 | 1 | 18 | — | — | — | — | — |
| 19 | 30521 | 25434 | 5087 | 940 | 1 | 19 | — | — | — | — | — |
| 20 | 40593 | 33828 | 6766 | 1090 | 1 | 20 | — | — | — | — | — |

### Combat Forge
- **Rôle**: Débloque les unités ground avancées.
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 5 + Barracks >= 8
- **Prérequis**: Barracks niveau 8
- **Niveau max**: 20
- **Notes**: Valeurs de coûts/temps marquées provisoires (balance temporaire) : TODO validation design.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 320 | 290 | 110 | 95 | 2 | 2 | — | — | — | — | Requires Barracks 8 (all levels) |
| 2 | 429 | 389 | 147 | 112 | 2 | 4 | — | — | — | — | Requires Barracks 8 (all levels) |
| 3 | 575 | 521 | 198 | 132 | 2 | 6 | — | — | — | — | Requires Barracks 8 (all levels) |
| 4 | 770 | 698 | 265 | 156 | 2 | 8 | — | — | — | — | Requires Barracks 8 (all levels) |
| 5 | 1032 | 935 | 355 | 184 | 2 | 10 | — | — | — | — | Requires Barracks 8 (all levels) |
| 6 | 1383 | 1253 | 475 | 217 | 2 | 12 | — | — | — | — | Requires Barracks 8 (all levels) |
| 7 | 1853 | 1679 | 637 | 256 | 2 | 14 | — | — | — | — | Requires Barracks 8 (all levels) |
| 8 | 2482 | 2250 | 853 | 303 | 2 | 16 | — | — | — | — | Requires Barracks 8 (all levels) |
| 9 | 3327 | 3015 | 1143 | 357 | 2 | 18 | — | — | — | — | Requires Barracks 8 (all levels) |
| 10 | 4458 | 4040 | 1532 | 421 | 2 | 20 | — | — | — | — | Requires Barracks 8 (all levels) |
| 11 | 5973 | 5413 | 2053 | 497 | 2 | 22 | — | — | — | — | Requires Barracks 8 (all levels) |
| 12 | 8004 | 7254 | 2751 | 587 | 2 | 24 | — | — | — | — | Requires Barracks 8 (all levels) |
| 13 | 10725 | 9720 | 3687 | 692 | 2 | 26 | — | — | — | — | Requires Barracks 8 (all levels) |
| 14 | 14372 | 13024 | 4940 | 817 | 2 | 28 | — | — | — | — | Requires Barracks 8 (all levels) |
| 15 | 19258 | 17453 | 6620 | 964 | 2 | 30 | — | — | — | — | Requires Barracks 8 (all levels) |
| 16 | 25806 | 23387 | 8871 | 1138 | 2 | 32 | — | — | — | — | Requires Barracks 8 (all levels) |
| 17 | 34580 | 31338 | 11887 | 1342 | 2 | 34 | — | — | — | — | Requires Barracks 8 (all levels) |
| 18 | 46337 | 41993 | 15928 | 1584 | 2 | 36 | — | — | — | — | Requires Barracks 8 (all levels) |
| 19 | 62092 | 56271 | 21344 | 1869 | 2 | 38 | — | — | — | — | Requires Barracks 8 (all levels) |
| 20 | 83203 | 75403 | 28601 | 2205 | 2 | 40 | — | — | — | — | Requires Barracks 8 (all levels) |

### Space Dock (alias actuel; docs historiques: Hub de déploiement)
- **Rôle**: Débloque les unités de projection (catégorie air dans le système économie/training actuel).
- **Scope actif**: V0 actif (éco/training)
- **Unlock**: HQ >= 10 + Combat Forge >= 5
- **Prérequis**: Combat Forge niveau 5
- **Niveau max**: 20
- **Notes**: Nom canonical à valider + valeurs provisoires (balance temporaire) : TODO validation design.

| Level | Ore cost | Stone cost | Iron cost | Build time (s) | Pop cost (lvl) | Cumulative pop used | Production/h | Storage effect | Pop cap bonus | Unlocks granted | Prerequisite notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 520 | 460 | 240 | 130 | 3 | 3 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 2 | 702 | 621 | 324 | 156 | 3 | 6 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 3 | 948 | 838 | 437 | 187 | 3 | 9 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 4 | 1279 | 1132 | 590 | 225 | 3 | 12 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 5 | 1727 | 1528 | 797 | 270 | 3 | 15 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 6 | 2332 | 2063 | 1076 | 323 | 3 | 18 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 7 | 3148 | 2785 | 1453 | 388 | 3 | 21 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 8 | 4250 | 3759 | 1961 | 466 | 3 | 24 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 9 | 5737 | 5075 | 2648 | 559 | 3 | 27 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 10 | 7745 | 6851 | 3574 | 671 | 3 | 30 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 11 | 10455 | 9249 | 4826 | 805 | 3 | 33 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 12 | 14115 | 12486 | 6515 | 966 | 3 | 36 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 13 | 19055 | 16856 | 8795 | 1159 | 3 | 39 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 14 | 25724 | 22756 | 11873 | 1391 | 3 | 42 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 15 | 34728 | 30721 | 16028 | 1669 | 3 | 45 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 16 | 46882 | 41473 | 21638 | 2003 | 3 | 48 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 17 | 63291 | 55988 | 29211 | 2403 | 3 | 51 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 18 | 85443 | 75584 | 39435 | 2884 | 3 | 54 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 19 | 115348 | 102039 | 53238 | 3461 | 3 | 57 | — | — | — | — | Requires Combat Forge 5 (all levels) |
| 20 | 155720 | 137752 | 71871 | 4153 | 3 | 60 | — | — | — | — | Requires Combat Forge 5 (all levels) |

## 4. Open issues / points à valider
- **Naming drift**: `Space Dock` (code/projet actuel) vs `Hub de déploiement` (docs historiques). Décision canonique à figer.
- **Balance militaire** (`Barracks`, `Combat Forge`, `Space Dock`): valeurs actuelles marquées **Temporaire balance value** (coûts/temps/pop) tant que non validées en revue design.
- **Contradiction documentaire unités Barracks**: doc 02 mentionne palier différent de doc 03 pour l'unité de niveau 5/10 (Éclaireur vs Bouclier/Tireur). À arbitrer.
- **Bâtiments later-phase** (espionnage, marché, gouvernance, etc.) listés au catalogue mais non détaillés niveau 1→20 ici faute de table de balance centralisée active.
