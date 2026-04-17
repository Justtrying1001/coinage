# Bâtiments & Construction — MVP MICRO

## Intro
Ce document est généré depuis la config runtime active (`cityEconomyConfig.ts`) pour éviter toute dérive entre design et implémentation.

## Liste des bâtiments MVP actifs
- `hq` — HQ
- `mine` — Mine
- `quarry` — Quarry
- `refinery` — Refinery
- `warehouse` — Warehouse
- `housing_complex` — Housing Complex
- `barracks` — Barracks
- `space_dock` — Space Dock
- `defensive_wall` — Defensive Wall
- `watch_tower` — Skyguard Tower
- `armament_factory` — Armament Factory
- `intelligence_center` — Intelligence Center
- `research_lab` — Research Lab
- `market` — Market
- `council_chamber` — Council Chamber

## Détail par bâtiment MVP

### HQ (hq)
- **Branche** : economy
- **Rôle** : Colonne vertébrale de progression et hub d'unlocks.
- **Prérequis** : Aucun prérequis (hors disponibilité de base).
- **Effets** : Déverrouille les branches principales à certains paliers de niveau.
- **Logique de scaling** : Coûts exponentiels (scale 1.195), temps staged, population escalade (2 + 0.9*(n-1) + 0.06*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 220 | 180 | 35 | 50 | 50s | 2 |
| 2 | 263 | 215 | 42 | 60 | 1m 00s | 3 |
| 3 | 314 | 257 | 50 | 75 | 1m 15s | 4 |
| 4 | 375 | 307 | 60 | 90 | 1m 30s | 5 |
| 5 | 449 | 367 | 71 | 110 | 1m 50s | 7 |
| 6 | 536 | 439 | 85 | 135 | 2m 15s | 8 |
| 7 | 641 | 524 | 102 | 165 | 2m 45s | 10 |
| 8 | 766 | 626 | 122 | 200 | 3m 20s | 11 |
| 9 | 915 | 749 | 146 | 245 | 4m 05s | 13 |
| 10 | 1093 | 895 | 174 | 300 | 5m 00s | 15 |
| 11 | 1306 | 1069 | 208 | 555 | 9m 15s | 17 |
| 12 | 1561 | 1277 | 248 | 1035 | 17m 15s | 19 |
| 13 | 1866 | 1526 | 297 | 1925 | 32m 05s | 21 |
| 14 | 2229 | 1824 | 355 | 3585 | 59m 45s | 24 |
| 15 | 2664 | 2180 | 424 | 6665 | 1h 51m 05s | 26 |
| 16 | 3184 | 2605 | 507 | 12395 | 3h 26m 35s | 29 |
| 17 | 3805 | 3113 | 605 | 23055 | 6h 24m 15s | 32 |
| 18 | 4546 | 3720 | 723 | 42885 | 11h 54m 45s | 35 |
| 19 | 5433 | 4445 | 864 | 79765 | 22h 09m 25s | 38 |
| 20 | 6493 | 5312 | 1033 | 148365 | 41h 12m 45s | 41 |

### Mine (mine)
- **Branche** : economy
- **Rôle** : Production passive d'ore.
- **Prérequis** : L6-10: HQ >= 4, quarry >= 5 · L11-15: HQ >= 8, warehouse >= 6 · L16-20: HQ >= 12, refinery >= 8
- **Effets** : Augmente `orePerHour`.
- **Logique de scaling** : Coûts exponentiels (1.16), temps staged, population escalade légère (1 + 0.55*(n-1) + 0.03*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 76 | 60 | 0 | 30 | 30s | 1 |
| 2 | 88 | 70 | 0 | 35 | 35s | 2 |
| 3 | 102 | 81 | 0 | 45 | 45s | 2 |
| 4 | 119 | 94 | 0 | 55 | 55s | 3 |
| 5 | 138 | 109 | 0 | 65 | 1m 05s | 4 |
| 6 | 160 | 126 | 0 | 80 | 1m 20s | 5 |
| 7 | 185 | 146 | 0 | 100 | 1m 40s | 5 |
| 8 | 215 | 170 | 0 | 120 | 2m 00s | 6 |
| 9 | 249 | 197 | 0 | 145 | 2m 25s | 7 |
| 10 | 289 | 228 | 0 | 180 | 3m 00s | 8 |
| 11 | 335 | 265 | 0 | 335 | 5m 35s | 10 |
| 12 | 389 | 307 | 0 | 620 | 10m 20s | 11 |
| 13 | 451 | 356 | 0 | 1155 | 19m 15s | 12 |
| 14 | 523 | 413 | 0 | 2150 | 35m 50s | 13 |
| 15 | 607 | 479 | 0 | 4000 | 1h 06m 40s | 15 |
| 16 | 704 | 556 | 0 | 7440 | 2h 04m 00s | 16 |
| 17 | 817 | 645 | 0 | 13835 | 3h 50m 35s | 17 |
| 18 | 948 | 748 | 0 | 25730 | 7h 08m 50s | 19 |
| 19 | 1099 | 868 | 0 | 47860 | 13h 17m 40s | 21 |
| 20 | 1275 | 1007 | 0 | 89020 | 24h 43m 40s | 22 |

### Quarry (quarry)
- **Branche** : economy
- **Rôle** : Production passive de stone.
- **Prérequis** : L6-10: HQ >= 4, mine >= 5 · L11-15: HQ >= 8, warehouse >= 6 · L16-20: HQ >= 12, refinery >= 8
- **Effets** : Augmente `stonePerHour`.
- **Logique de scaling** : Coûts exponentiels (1.16), temps staged, population escalade légère (1 + 0.55*(n-1) + 0.03*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 68 | 78 | 0 | 30 | 30s | 1 |
| 2 | 79 | 90 | 0 | 35 | 35s | 2 |
| 3 | 92 | 105 | 0 | 45 | 45s | 2 |
| 4 | 106 | 122 | 0 | 55 | 55s | 3 |
| 5 | 123 | 141 | 0 | 65 | 1m 05s | 4 |
| 6 | 143 | 164 | 0 | 80 | 1m 20s | 5 |
| 7 | 166 | 190 | 0 | 100 | 1m 40s | 5 |
| 8 | 192 | 220 | 0 | 120 | 2m 00s | 6 |
| 9 | 223 | 256 | 0 | 145 | 2m 25s | 7 |
| 10 | 259 | 297 | 0 | 180 | 3m 00s | 8 |
| 11 | 300 | 344 | 0 | 335 | 5m 35s | 10 |
| 12 | 348 | 399 | 0 | 620 | 10m 20s | 11 |
| 13 | 404 | 463 | 0 | 1155 | 19m 15s | 12 |
| 14 | 468 | 537 | 0 | 2150 | 35m 50s | 13 |
| 15 | 543 | 623 | 0 | 4000 | 1h 06m 40s | 15 |
| 16 | 630 | 723 | 0 | 7440 | 2h 04m 00s | 16 |
| 17 | 731 | 838 | 0 | 13835 | 3h 50m 35s | 17 |
| 18 | 848 | 972 | 0 | 25730 | 7h 08m 50s | 19 |
| 19 | 983 | 1128 | 0 | 47860 | 13h 17m 40s | 21 |
| 20 | 1141 | 1309 | 0 | 89020 | 24h 43m 40s | 22 |

### Refinery (refinery)
- **Branche** : economy
- **Rôle** : Production passive d'iron.
- **Prérequis** : HQ >= 3 · mine >= 4 · quarry >= 4
- **Effets** : Augmente `ironPerHour`.
- **Logique de scaling** : Coûts exponentiels (1.165), temps staged, population escalade (2 + 0.7*(n-1) + 0.04*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 125 | 105 | 35 | 45 | 45s | 2 |
| 2 | 146 | 122 | 41 | 55 | 55s | 3 |
| 3 | 170 | 143 | 48 | 65 | 1m 05s | 4 |
| 4 | 198 | 166 | 55 | 80 | 1m 20s | 4 |
| 5 | 230 | 193 | 64 | 100 | 1m 40s | 5 |
| 6 | 268 | 225 | 75 | 120 | 2m 00s | 7 |
| 7 | 313 | 263 | 88 | 150 | 2m 30s | 8 |
| 8 | 364 | 306 | 102 | 180 | 3m 00s | 9 |
| 9 | 424 | 356 | 119 | 220 | 3m 40s | 10 |
| 10 | 494 | 415 | 138 | 270 | 4m 30s | 12 |
| 11 | 576 | 484 | 161 | 500 | 8m 20s | 13 |
| 12 | 671 | 563 | 188 | 930 | 15m 30s | 15 |
| 13 | 781 | 656 | 219 | 1735 | 28m 55s | 16 |
| 14 | 910 | 765 | 255 | 3225 | 53m 45s | 18 |
| 15 | 1060 | 891 | 297 | 6000 | 1h 40m 00s | 20 |
| 16 | 1235 | 1038 | 346 | 11155 | 3h 05m 55s | 22 |
| 17 | 1439 | 1209 | 403 | 20750 | 5h 45m 50s | 23 |
| 18 | 1677 | 1408 | 469 | 38595 | 10h 43m 15s | 25 |
| 19 | 1953 | 1641 | 547 | 71790 | 19h 56m 30s | 28 |
| 20 | 2276 | 1912 | 637 | 133530 | 37h 05m 30s | 30 |

### Warehouse (warehouse)
- **Branche** : economy
- **Rôle** : Augmente les capacités de stockage.
- **Prérequis** : Aucun prérequis (hors disponibilité de base).
- **Effets** : Augmente `storageCap` (table explicite).
- **Logique de scaling** : Coûts exponentiels (1.17), temps staged, population escalade (1 + 0.45*(n-1) + 0.03*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 90 | 84 | 10 | 35 | 35s | 1 |
| 2 | 105 | 98 | 12 | 45 | 45s | 1 |
| 3 | 123 | 115 | 14 | 50 | 50s | 2 |
| 4 | 144 | 135 | 16 | 65 | 1m 05s | 3 |
| 5 | 169 | 157 | 19 | 80 | 1m 20s | 3 |
| 6 | 197 | 184 | 22 | 95 | 1m 35s | 4 |
| 7 | 231 | 215 | 26 | 115 | 1m 55s | 5 |
| 8 | 270 | 252 | 30 | 140 | 2m 20s | 6 |
| 9 | 316 | 295 | 35 | 170 | 2m 50s | 7 |
| 10 | 370 | 345 | 41 | 210 | 3m 30s | 7 |
| 11 | 433 | 404 | 48 | 390 | 6m 30s | 9 |
| 12 | 506 | 472 | 56 | 725 | 12m 05s | 10 |
| 13 | 592 | 553 | 66 | 1350 | 22m 30s | 11 |
| 14 | 693 | 647 | 77 | 2510 | 41m 50s | 12 |
| 15 | 811 | 757 | 90 | 4665 | 1h 17m 45s | 13 |
| 16 | 948 | 885 | 105 | 8675 | 2h 24m 35s | 15 |
| 17 | 1110 | 1036 | 123 | 16140 | 4h 29m 00s | 16 |
| 18 | 1298 | 1212 | 144 | 30020 | 8h 20m 20s | 17 |
| 19 | 1519 | 1418 | 169 | 55835 | 15h 30m 35s | 19 |
| 20 | 1777 | 1659 | 197 | 103855 | 28h 50m 55s | 20 |

### Housing Complex (housing_complex)
- **Branche** : economy
- **Rôle** : Augmente le cap de population de la ville.
- **Prérequis** : Aucun prérequis (hors disponibilité de base).
- **Effets** : Augmente `populationCapBonus`.
- **Logique de scaling** : Coûts exponentiels (1.17), temps staged, population escalade (1 + 0.5*(n-1) + 0.035*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 90 | 84 | 10 | 35 | 35s | 1 |
| 2 | 105 | 98 | 12 | 45 | 45s | 2 |
| 3 | 123 | 115 | 14 | 50 | 50s | 2 |
| 4 | 144 | 135 | 16 | 65 | 1m 05s | 3 |
| 5 | 169 | 157 | 19 | 80 | 1m 20s | 4 |
| 6 | 197 | 184 | 22 | 95 | 1m 35s | 4 |
| 7 | 231 | 215 | 26 | 115 | 1m 55s | 5 |
| 8 | 270 | 252 | 30 | 140 | 2m 20s | 6 |
| 9 | 316 | 295 | 35 | 170 | 2m 50s | 7 |
| 10 | 370 | 345 | 41 | 210 | 3m 30s | 8 |
| 11 | 433 | 404 | 48 | 390 | 6m 30s | 10 |
| 12 | 506 | 472 | 56 | 725 | 12m 05s | 11 |
| 13 | 592 | 553 | 66 | 1350 | 22m 30s | 12 |
| 14 | 693 | 647 | 77 | 2510 | 41m 50s | 13 |
| 15 | 811 | 757 | 90 | 4665 | 1h 17m 45s | 15 |
| 16 | 948 | 885 | 105 | 8675 | 2h 24m 35s | 16 |
| 17 | 1110 | 1036 | 123 | 16140 | 4h 29m 00s | 18 |
| 18 | 1298 | 1212 | 144 | 30020 | 8h 20m 20s | 20 |
| 19 | 1519 | 1418 | 169 | 55835 | 15h 30m 35s | 21 |
| 20 | 1777 | 1659 | 197 | 103855 | 28h 50m 55s | 23 |

### Barracks (barracks)
- **Branche** : military
- **Rôle** : Production des unités terrestres.
- **Prérequis** : HQ >= 2 · housing_complex >= 2
- **Effets** : Augmente `trainingSpeedPct`.
- **Logique de scaling** : Coûts exponentiels (1.2), temps staged, population escalade (2 + 0.8*(n-1) + 0.05*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 140 | 110 | 20 | 50 | 50s | 2 |
| 2 | 168 | 132 | 24 | 60 | 1m 00s | 3 |
| 3 | 202 | 158 | 29 | 75 | 1m 15s | 4 |
| 4 | 242 | 190 | 35 | 90 | 1m 30s | 5 |
| 5 | 290 | 228 | 41 | 110 | 1m 50s | 6 |
| 6 | 348 | 274 | 50 | 135 | 2m 15s | 7 |
| 7 | 418 | 328 | 60 | 165 | 2m 45s | 9 |
| 8 | 502 | 394 | 72 | 200 | 3m 20s | 10 |
| 9 | 602 | 473 | 86 | 245 | 4m 05s | 12 |
| 10 | 722 | 568 | 103 | 300 | 5m 00s | 13 |
| 11 | 867 | 681 | 124 | 555 | 9m 15s | 15 |
| 12 | 1040 | 817 | 149 | 1035 | 17m 15s | 17 |
| 13 | 1248 | 981 | 178 | 1925 | 32m 05s | 19 |
| 14 | 1498 | 1177 | 214 | 3585 | 59m 45s | 21 |
| 15 | 1797 | 1412 | 257 | 6665 | 1h 51m 05s | 23 |
| 16 | 2157 | 1695 | 308 | 12395 | 3h 26m 35s | 25 |
| 17 | 2588 | 2034 | 370 | 23055 | 6h 24m 15s | 28 |
| 18 | 3106 | 2440 | 444 | 42885 | 11h 54m 45s | 30 |
| 19 | 3727 | 2929 | 532 | 79765 | 22h 09m 25s | 33 |
| 20 | 4473 | 3514 | 639 | 148365 | 41h 12m 45s | 35 |

### Space Dock (space_dock)
- **Branche** : military
- **Rôle** : Production des unités volantes.
- **Prérequis** : HQ >= 8 · barracks >= 6 · refinery >= 6
- **Effets** : Augmente `trainingSpeedPct` pour la branche aérienne.
- **Logique de scaling** : Coûts exponentiels (1.22), temps staged, population escalade forte (3 + 1.0*(n-1) + 0.06*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 360 | 300 | 150 | 80 | 1m 20s | 3 |
| 2 | 439 | 366 | 183 | 100 | 1m 40s | 4 |
| 3 | 536 | 447 | 223 | 120 | 2m 00s | 5 |
| 4 | 654 | 545 | 272 | 145 | 2m 25s | 7 |
| 5 | 798 | 665 | 332 | 175 | 2m 55s | 8 |
| 6 | 973 | 811 | 405 | 215 | 3m 35s | 10 |
| 7 | 1187 | 989 | 495 | 265 | 4m 25s | 11 |
| 8 | 1448 | 1207 | 603 | 320 | 5m 20s | 13 |
| 9 | 1767 | 1472 | 736 | 395 | 6m 35s | 15 |
| 10 | 2155 | 1796 | 898 | 480 | 8m 00s | 17 |
| 11 | 2630 | 2191 | 1096 | 890 | 14m 50s | 19 |
| 12 | 3208 | 2673 | 1337 | 1655 | 27m 35s | 21 |
| 13 | 3914 | 3262 | 1631 | 3080 | 51m 20s | 24 |
| 14 | 4775 | 3979 | 1990 | 5735 | 1h 35m 35s | 26 |
| 15 | 5826 | 4855 | 2427 | 10665 | 2h 57m 45s | 29 |
| 16 | 7107 | 5923 | 2961 | 19835 | 5h 30m 35s | 32 |
| 17 | 8671 | 7226 | 3613 | 36890 | 10h 14m 50s | 34 |
| 18 | 10578 | 8815 | 4408 | 68615 | 19h 03m 35s | 37 |
| 19 | 12906 | 10755 | 5377 | 127630 | 35h 27m 10s | 40 |
| 20 | 15745 | 13121 | 6560 | 237390 | 65h 56m 30s | 44 |

### Defensive Wall (defensive_wall)
- **Branche** : defense
- **Rôle** : Défense principale anti-unités terrestres.
- **Prérequis** : HQ >= 4
- **Effets** : Augmente `cityDefensePct`, `damageMitigationPct`, `siegeResistancePct`.
- **Logique de scaling** : Coûts exponentiels (1.185), temps staged, population escalade forte (3 + 0.9*(n-1) + 0.055*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 175 | 265 | 70 | 50 | 50s | 3 |
| 2 | 207 | 314 | 83 | 65 | 1m 05s | 4 |
| 3 | 246 | 372 | 98 | 75 | 1m 15s | 5 |
| 4 | 291 | 441 | 116 | 95 | 1m 35s | 6 |
| 5 | 345 | 523 | 138 | 115 | 1m 55s | 7 |
| 6 | 409 | 619 | 164 | 140 | 2m 20s | 9 |
| 7 | 485 | 734 | 194 | 170 | 2m 50s | 10 |
| 8 | 574 | 870 | 230 | 210 | 3m 30s | 12 |
| 9 | 680 | 1030 | 272 | 255 | 4m 15s | 14 |
| 10 | 806 | 1221 | 323 | 310 | 5m 10s | 16 |
| 11 | 955 | 1447 | 382 | 580 | 9m 40s | 18 |
| 12 | 1132 | 1715 | 453 | 1075 | 17m 55s | 20 |
| 13 | 1342 | 2032 | 537 | 2005 | 33m 25s | 22 |
| 14 | 1590 | 2408 | 636 | 3725 | 1h 02m 05s | 24 |
| 15 | 1884 | 2853 | 754 | 6930 | 1h 55m 30s | 26 |
| 16 | 2233 | 3381 | 893 | 12890 | 3h 34m 50s | 29 |
| 17 | 2646 | 4006 | 1058 | 23980 | 6h 39m 40s | 31 |
| 18 | 3135 | 4747 | 1254 | 44600 | 12h 23m 20s | 34 |
| 19 | 3715 | 5626 | 1486 | 82960 | 23h 02m 40s | 37 |
| 20 | 4402 | 6666 | 1761 | 154300 | 42h 51m 40s | 40 |

### Skyguard Tower (watch_tower)
- **Branche** : defense
- **Rôle** : Défense anti-unités volantes + détection locale.
- **Prérequis** : HQ >= 5 · defensive_wall >= 2
- **Effets** : Augmente `cityDefensePct` (anti-air), `detectionPct`, `counterIntelPct`.
- **Logique de scaling** : Coûts exponentiels (1.18), temps staged, population escalade (2 + 0.75*(n-1) + 0.05*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 145 | 180 | 95 | 50 | 50s | 2 |
| 2 | 171 | 212 | 112 | 60 | 1m 00s | 3 |
| 3 | 202 | 251 | 132 | 70 | 1m 10s | 4 |
| 4 | 238 | 296 | 156 | 85 | 1m 25s | 5 |
| 5 | 281 | 349 | 184 | 105 | 1m 45s | 6 |
| 6 | 332 | 412 | 217 | 130 | 2m 10s | 7 |
| 7 | 391 | 486 | 256 | 160 | 2m 40s | 8 |
| 8 | 462 | 573 | 303 | 195 | 3m 15s | 10 |
| 9 | 545 | 677 | 357 | 235 | 3m 55s | 11 |
| 10 | 643 | 798 | 421 | 285 | 4m 45s | 13 |
| 11 | 759 | 942 | 497 | 535 | 8m 55s | 15 |
| 12 | 896 | 1112 | 587 | 995 | 16m 35s | 16 |
| 13 | 1057 | 1312 | 692 | 1850 | 30m 50s | 18 |
| 14 | 1247 | 1548 | 817 | 3440 | 57m 20s | 20 |
| 15 | 1471 | 1827 | 964 | 6400 | 1h 46m 40s | 22 |
| 16 | 1736 | 2155 | 1138 | 11900 | 3h 18m 20s | 25 |
| 17 | 2049 | 2543 | 1342 | 22135 | 6h 08m 55s | 27 |
| 18 | 2417 | 3001 | 1584 | 41170 | 11h 26m 10s | 29 |
| 19 | 2853 | 3541 | 1869 | 76575 | 21h 16m 15s | 32 |
| 20 | 3366 | 4179 | 2205 | 142435 | 39h 33m 55s | 34 |

### Armament Factory (armament_factory)
- **Branche** : military
- **Rôle** : Améliorations militaires (puissance, entraînement, upkeep).
- **Prérequis** : HQ >= 10 · barracks >= 10 · space_dock >= 5 · refinery >= 8 · market >= 6
- **Effets** : Augmente `troopCombatPowerPct`, `troopUpkeepEfficiencyPct`, `trainingSpeedPct`.
- **Logique de scaling** : Coûts exponentiels (1.205), temps staged, population escalade très forte (4 + 1.1*(n-1) + 0.07*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 340 | 250 | 190 | 70 | 1m 10s | 4 |
| 2 | 410 | 301 | 229 | 90 | 1m 30s | 5 |
| 3 | 494 | 363 | 276 | 105 | 1m 45s | 6 |
| 4 | 595 | 437 | 332 | 130 | 2m 10s | 8 |
| 5 | 717 | 527 | 401 | 160 | 2m 40s | 10 |
| 6 | 864 | 635 | 483 | 195 | 3m 15s | 11 |
| 7 | 1041 | 765 | 582 | 235 | 3m 55s | 13 |
| 8 | 1254 | 922 | 701 | 290 | 4m 50s | 15 |
| 9 | 1511 | 1111 | 845 | 355 | 5m 55s | 17 |
| 10 | 1821 | 1339 | 1018 | 430 | 7m 10s | 20 |
| 11 | 2195 | 1614 | 1226 | 800 | 13m 20s | 22 |
| 12 | 2644 | 1944 | 1478 | 1490 | 24m 50s | 25 |
| 13 | 3187 | 2343 | 1781 | 2775 | 46m 15s | 27 |
| 14 | 3840 | 2823 | 2146 | 5160 | 1h 26m 00s | 30 |
| 15 | 4627 | 3402 | 2586 | 9595 | 2h 39m 55s | 33 |
| 16 | 5576 | 4100 | 3116 | 17850 | 4h 57m 30s | 36 |
| 17 | 6718 | 4940 | 3754 | 33200 | 9h 13m 20s | 40 |
| 18 | 8096 | 5953 | 4524 | 61755 | 17h 09m 15s | 43 |
| 19 | 9755 | 7173 | 5452 | 114865 | 31h 54m 25s | 46 |
| 20 | 11755 | 8644 | 6569 | 213650 | 59h 20m 50s | 50 |

### Intelligence Center (intelligence_center)
- **Branche** : intelligence
- **Rôle** : Renseignement local et contre-renseignement.
- **Prérequis** : HQ >= 4 · watch_tower >= 2
- **Effets** : Augmente `detectionPct` et `counterIntelPct`.
- **Logique de scaling** : Coûts exponentiels (1.185), temps staged, population escalade (2 + 0.75*(n-1) + 0.045*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 180 | 165 | 135 | 55 | 55s | 2 |
| 2 | 213 | 196 | 160 | 65 | 1m 05s | 3 |
| 3 | 253 | 232 | 190 | 80 | 1m 20s | 4 |
| 4 | 300 | 275 | 225 | 100 | 1m 40s | 5 |
| 5 | 355 | 325 | 266 | 120 | 2m 00s | 6 |
| 6 | 421 | 386 | 315 | 145 | 2m 25s | 7 |
| 7 | 498 | 457 | 374 | 180 | 3m 00s | 8 |
| 8 | 591 | 541 | 443 | 215 | 3m 35s | 9 |
| 9 | 700 | 642 | 525 | 265 | 4m 25s | 11 |
| 10 | 829 | 760 | 622 | 325 | 5m 25s | 12 |
| 11 | 983 | 901 | 737 | 600 | 10m 00s | 14 |
| 12 | 1165 | 1068 | 873 | 1120 | 18m 40s | 16 |
| 13 | 1380 | 1265 | 1035 | 2080 | 34m 40s | 17 |
| 14 | 1635 | 1499 | 1227 | 3870 | 1h 04m 30s | 19 |
| 15 | 1938 | 1776 | 1453 | 7200 | 2h 00m 00s | 21 |
| 16 | 2296 | 2105 | 1722 | 13390 | 3h 43m 10s | 23 |
| 17 | 2721 | 2494 | 2041 | 24900 | 6h 55m 00s | 26 |
| 18 | 3225 | 2956 | 2418 | 46315 | 12h 51m 55s | 28 |
| 19 | 3821 | 3503 | 2866 | 86150 | 23h 55m 50s | 30 |
| 20 | 4528 | 4151 | 3396 | 160235 | 44h 30m 35s | 32 |

### Research Lab (research_lab)
- **Branche** : research
- **Rôle** : Capacité de recherche locale.
- **Prérequis** : HQ >= 4 · warehouse >= 4
- **Effets** : Augmente `researchCapacity`.
- **Logique de scaling** : Coûts exponentiels (1.185), temps staged, population escalade (2 + 0.8*(n-1) + 0.05*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 175 | 175 | 130 | 55 | 55s | 2 |
| 2 | 207 | 207 | 154 | 70 | 1m 10s | 3 |
| 3 | 246 | 246 | 183 | 85 | 1m 25s | 4 |
| 4 | 291 | 291 | 216 | 100 | 1m 40s | 5 |
| 5 | 345 | 345 | 256 | 125 | 2m 05s | 6 |
| 6 | 409 | 409 | 304 | 150 | 2m 30s | 7 |
| 7 | 485 | 485 | 360 | 185 | 3m 05s | 9 |
| 8 | 574 | 574 | 427 | 225 | 3m 45s | 10 |
| 9 | 680 | 680 | 505 | 275 | 4m 35s | 12 |
| 10 | 806 | 806 | 599 | 335 | 5m 35s | 13 |
| 11 | 955 | 955 | 710 | 625 | 10m 25s | 15 |
| 12 | 1132 | 1132 | 841 | 1160 | 19m 20s | 17 |
| 13 | 1342 | 1342 | 997 | 2160 | 36m 00s | 19 |
| 14 | 1590 | 1590 | 1181 | 4015 | 1h 06m 55s | 21 |
| 15 | 1884 | 1884 | 1400 | 7465 | 2h 04m 25s | 23 |
| 16 | 2233 | 2233 | 1659 | 13885 | 3h 51m 25s | 25 |
| 17 | 2646 | 2646 | 1965 | 25825 | 7h 10m 25s | 28 |
| 18 | 3135 | 3135 | 2329 | 48030 | 13h 20m 30s | 30 |
| 19 | 3715 | 3715 | 2760 | 89340 | 24h 49m 00s | 33 |
| 20 | 4402 | 4402 | 3270 | 166170 | 46h 09m 30s | 35 |

### Market (market)
- **Branche** : logistics
- **Rôle** : Efficacité marché et réduction coût de build.
- **Prérequis** : HQ >= 5 · warehouse >= 5 · research_lab >= 2
- **Effets** : Augmente `marketEfficiencyPct` et `buildCostReductionPct`.
- **Logique de scaling** : Coûts exponentiels (1.18), temps staged, population escalade (2 + 0.7*(n-1) + 0.04*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 165 | 145 | 80 | 45 | 45s | 2 |
| 2 | 195 | 171 | 94 | 55 | 55s | 3 |
| 3 | 230 | 202 | 111 | 70 | 1m 10s | 4 |
| 4 | 271 | 238 | 131 | 85 | 1m 25s | 4 |
| 5 | 320 | 281 | 155 | 100 | 1m 40s | 5 |
| 6 | 377 | 332 | 183 | 125 | 2m 05s | 7 |
| 7 | 445 | 391 | 216 | 150 | 2m 30s | 8 |
| 8 | 526 | 462 | 255 | 185 | 3m 05s | 9 |
| 9 | 620 | 545 | 301 | 225 | 3m 45s | 10 |
| 10 | 732 | 643 | 355 | 275 | 4m 35s | 12 |
| 11 | 864 | 759 | 419 | 510 | 8m 30s | 13 |
| 12 | 1019 | 896 | 494 | 955 | 15m 55s | 15 |
| 13 | 1202 | 1057 | 583 | 1770 | 29m 30s | 16 |
| 14 | 1419 | 1247 | 688 | 3295 | 54m 55s | 18 |
| 15 | 1674 | 1471 | 812 | 6130 | 1h 42m 10s | 20 |
| 16 | 1976 | 1736 | 958 | 11405 | 3h 10m 05s | 22 |
| 17 | 2331 | 2049 | 1130 | 21210 | 5h 53m 30s | 23 |
| 18 | 2751 | 2417 | 1334 | 39455 | 10h 57m 35s | 25 |
| 19 | 3246 | 2853 | 1574 | 73385 | 20h 23m 05s | 28 |
| 20 | 3830 | 3366 | 1857 | 136500 | 37h 55m 00s | 30 |

### Council Chamber (council_chamber)
- **Branche** : governance
- **Rôle** : Politiques locales et vitesse de construction.
- **Prérequis** : HQ >= 8 · research_lab >= 5 · market >= 4
- **Effets** : Augmente `cityDefensePct` et `buildSpeedPct` (vitesse de build).
- **Logique de scaling** : Coûts exponentiels (1.195), temps staged, population escalade forte (3 + 0.95*(n-1) + 0.06*(n-1)^2).

| Niveau | Ore | Stone | Iron | Temps (s) | Temps (lisible) | Population requise |
|---:|---:|---:|---:|---:|---|---:|
| 1 | 235 | 220 | 145 | 60 | 1m 00s | 3 |
| 2 | 281 | 263 | 173 | 75 | 1m 15s | 4 |
| 3 | 336 | 314 | 207 | 90 | 1m 30s | 5 |
| 4 | 401 | 375 | 247 | 110 | 1m 50s | 6 |
| 5 | 479 | 449 | 296 | 135 | 2m 15s | 8 |
| 6 | 573 | 536 | 353 | 160 | 2m 40s | 9 |
| 7 | 684 | 641 | 422 | 200 | 3m 20s | 11 |
| 8 | 818 | 766 | 505 | 240 | 4m 00s | 13 |
| 9 | 977 | 915 | 603 | 295 | 4m 55s | 14 |
| 10 | 1168 | 1093 | 721 | 360 | 6m 00s | 16 |
| 11 | 1396 | 1306 | 861 | 670 | 11m 10s | 19 |
| 12 | 1668 | 1561 | 1029 | 1245 | 20m 45s | 21 |
| 13 | 1993 | 1866 | 1230 | 2310 | 38m 30s | 23 |
| 14 | 2382 | 2229 | 1469 | 4300 | 1h 11m 40s | 25 |
| 15 | 2846 | 2664 | 1756 | 8000 | 2h 13m 20s | 28 |
| 16 | 3401 | 3184 | 2098 | 14875 | 4h 07m 55s | 31 |
| 17 | 4064 | 3805 | 2508 | 27670 | 7h 41m 10s | 34 |
| 18 | 4856 | 4546 | 2997 | 51465 | 14h 17m 45s | 36 |
| 19 | 5804 | 5433 | 3581 | 95720 | 26h 35m 20s | 40 |
| 20 | 6935 | 6493 | 4279 | 178040 | 49h 27m 20s | 43 |

## Bâtiments spéciaux futurs à implémenter
- `training_grounds` : bâtiment spécial différé (hors runtime MVP).
- `shard_vault` : branche premium/shards différée (hors runtime MVP).
- Les bâtiments retirés du MVP actif (`combat_forge`, `military_academy`) restent hors runtime actuel et pourront être réintroduits plus tard.
