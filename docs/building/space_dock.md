# Space Dock

## 1. Résumé
- ID technique: `space_dock`
- Branche / catégorie: `military`
- Statut dans le code: implémenté
- Rôle gameplay réel: Débloque l’entraînement des unités navales.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 30
- Condition de déblocage HQ: HQ >= 14
- Prérequis globaux: mine >= 15, refinery >= 10
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): trainingSpeedPct
- Effets lus explicitement par le runtime ('cityEconomySystem'): trainingSpeedPct
- Entrée de catalogue correspondante: oui (phase=v0, definitionStatus=fully_defined, gameplayImplemented=true)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 400 | 200 | 100 | 95 | 4 | — | HQ>=14 | mine>=15, refinery>=10 |
| 2 | 746 | 394 | 214 | 408 | 4 | trainingSpeedPct=1 | HQ>=14 | mine>=15, refinery>=10 |
| 3 | 1075 | 587 | 335 | 956 | 4 | trainingSpeedPct=2 | HQ>=14 | mine>=15, refinery>=10 |
| 4 | 1393 | 778 | 459 | 1749 | 4 | trainingSpeedPct=3 | HQ>=14 | mine>=15, refinery>=10 |
| 5 | 1703 | 968 | 587 | 2794 | 4 | trainingSpeedPct=4 | HQ>=14 | mine>=15, refinery>=10 |
| 6 | 2006 | 1158 | 718 | 4097 | 4 | trainingSpeedPct=5 | HQ>=14 | mine>=15, refinery>=10 |
| 7 | 2006 | 1158 | 718 | 5664 | 4 | trainingSpeedPct=6 | HQ>=14 | mine>=15, refinery>=10 |
| 8 | 2599 | 1535 | 985 | 7497 | 4 | trainingSpeedPct=7 | HQ>=14 | mine>=15, refinery>=10 |
| 9 | 2830 | 1723 | 1121 | 9601 | 4 | trainingSpeedPct=8 | HQ>=14 | mine>=15, refinery>=10 |
| 10 | 3177 | 1910 | 1259 | 11979 | 4 | trainingSpeedPct=9 | HQ>=14 | mine>=15, refinery>=10 |
| 11 | 3462 | 2097 | 1398 | 14780 | 4 | trainingSpeedPct=10 | HQ>=14 | mine>=15, refinery>=10 |
| 12 | 3744 | 2284 | 1539 | 15671 | 4 | trainingSpeedPct=11 | HQ>=14 | mine>=15, refinery>=10 |
| 13 | 4024 | 2470 | 1698 | 17762 | 4 | trainingSpeedPct=12 | HQ>=14 | mine>=15, refinery>=10 |
| 14 | 4301 | 2656 | 1823 | 19271 | 4 | trainingSpeedPct=13 | HQ>=14 | mine>=15, refinery>=10 |
| 15 | 4577 | 2842 | 1967 | 20790 | 4 | trainingSpeedPct=14 | HQ>=14 | mine>=15, refinery>=10 |
| 16 | 4850 | 3027 | 2111 | 22320 | 4 | trainingSpeedPct=15 | HQ>=14 | mine>=15, refinery>=10 |
| 17 | 5122 | 3213 | 2257 | 23859 | 4 | trainingSpeedPct=16 | HQ>=14 | mine>=15, refinery>=10 |
| 18 | 5393 | 3398 | 2403 | 25407 | 4 | trainingSpeedPct=17 | HQ>=14 | mine>=15, refinery>=10 |
| 19 | 5662 | 3583 | 2551 | 26964 | 4 | trainingSpeedPct=18 | HQ>=14 | mine>=15, refinery>=10 |
| 20 | 5929 | 3767 | 2699 | 28529 | 4 | trainingSpeedPct=19 | HQ>=14 | mine>=15, refinery>=10 |
| 21 | 6195 | 3952 | 2847 | 30102 | 4 | trainingSpeedPct=20 | HQ>=14 | mine>=15, refinery>=10 |
| 22 | 6460 | 4136 | 2997 | 31683 | 4 | trainingSpeedPct=21 | HQ>=14 | mine>=15, refinery>=10 |
| 23 | 6724 | 4320 | 3147 | 33270 | 4 | trainingSpeedPct=22 | HQ>=14 | mine>=15, refinery>=10 |
| 24 | 6986 | 4504 | 3298 | 34865 | 4 | trainingSpeedPct=23 | HQ>=14 | mine>=15, refinery>=10 |
| 25 | 7248 | 4688 | 3449 | 36466 | 4 | trainingSpeedPct=24 | HQ>=14 | mine>=15, refinery>=10 |
| 26 | 7508 | 4872 | 3601 | 38074 | 4 | trainingSpeedPct=25 | HQ>=14 | mine>=15, refinery>=10 |
| 27 | 7768 | 4872 | 3601 | 38074 | 4 | trainingSpeedPct=26 | HQ>=14 | mine>=15, refinery>=10 |
| 28 | 8026 | 5239 | 3907 | 41308 | 4 | trainingSpeedPct=27 | HQ>=14 | mine>=15, refinery>=10 |
| 29 | 8284 | 5422 | 4061 | 42934 | 4 | trainingSpeedPct=28 | HQ>=14 | mine>=15, refinery>=10 |
| 30 | 8540 | 5605 | 4215 | 44565 | 4 | trainingSpeedPct=29 | HQ>=14 | mine>=15, refinery>=10 |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- aucun bâtiment ne référence ce bâtiment comme prérequis direct

### Unités liées
- `assault_convoy`
- `swift_carrier`
- `interception_sentinel`
- `ember_drifter`
- `rapid_escort`
- `bulwark_trireme`
- `colonization_convoy`

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- aucune

## 6. Détails runtime importants
- Même logique que barracks pour les unités navales; son `trainingSpeedPct` est cumulé.

## 7. Statut d’implémentation / zones d’attention
- Runtime construction: implémenté (canStartConstruction, startConstruction, resolveCompletedConstruction).
- Divergence config/runtime: catalog présent, comparer son statut (phase=v0, gameplayImplemented=true) avec l’état runtime réel ci-dessus.
- Écarts docs existantes: non utilisés comme source de vérité dans cette génération (code prioritaire).

## 8. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityBuildingLevelTables.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)
