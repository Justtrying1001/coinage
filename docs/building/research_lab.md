# Research Lab
## Purpose
- Rôle: bâtiment pivot du système de research local (déverrouillage arbre + capacité RP).
- Permet: lancer des recherches temporisées, sous contraintes de prereqs, coûts, RP, et file active unique.
- Ne permet pas: exécuter directement des features mères absentes (ex: conquest/colonization globale, trade runtime complet).

## Runtime truth
- Source canonique: `CITY_ECONOMY_CONFIG.buildings.research_lab` + `CITY_BUILDING_LEVEL_TABLES.research_lab` + logique `cityEconomySystem`.
- Max level runtime: `35`.
- Effet par niveau: `researchCapacity +4`.
- Capacité RP effective utilisée par le runtime: `getBuildingLevel(research_lab) * 4`.
- Queue research active simultanée: `1` (guard `state.researchQueue.length > 0`).

## Unlock conditions
- HQ minimum: `8`.
- Prérequis bâtiment: `housing_complex >= 6`, `barracks >= 5`.
- Dépendances supplémentaires: aucune côté unlock bâtiment.

## Level table
| level | ore | stone | iron | build time (s) | population | effect | notes |
|---:|---:|---:|---:|---:|---:|---|---|
| 1 | 100 | 200 | 120 | 107 | 3 | researchCapacity +4 | RP cap += 4 |
| 2 | 231 | 429 | 276 | 509 | 6 | researchCapacity +4 | RP cap += 4 |
| 3 | 378 | 670 | 448 | 1266 | 9 | researchCapacity +4 | RP cap += 4 |
| 4 | 535 | 919 | 633 | 2419 | 12 | researchCapacity +4 | RP cap += 4 |
| 5 | 701 | 1175 | 828 | 3997 | 15 | researchCapacity +4 | RP cap += 4 |
| 6 | 874 | 1435 | 1030 | 6024 | 18 | researchCapacity +4 | RP cap += 4 |
| 7 | 1053 | 1701 | 1240 | 8522 | 21 | researchCapacity +4 | RP cap += 4 |
| 8 | 1238 | 1970 | 1455 | 11508 | 24 | researchCapacity +4 | RP cap += 4 |
| 9 | 1428 | 2242 | 1676 | 15000 | 27 | researchCapacity +4 | RP cap += 4 |
| 10 | 1622 | 2518 | 1902 | 19013 | 30 | researchCapacity +4 | RP cap += 4 |
| 11 | 1820 | 2796 | 2132 | 23799 | 33 | researchCapacity +4 | RP cap += 4 |
| 12 | 2022 | 3077 | 2367 | 26533 | 36 | researchCapacity +4 | RP cap += 4 |
| 13 | 2228 | 3360 | 2606 | 29326 | 39 | researchCapacity +4 | RP cap += 4 |
| 14 | 2437 | 3646 | 2848 | 32172 | 42 | researchCapacity +4 | RP cap += 4 |
| 15 | 2649 | 3933 | 3094 | 35070 | 45 | researchCapacity +4 | RP cap += 4 |
| 16 | 2864 | 4222 | 3343 | 38016 | 48 | researchCapacity +4 | RP cap += 4 |
| 17 | 3082 | 4514 | 3595 | 41009 | 51 | researchCapacity +4 | RP cap += 4 |
| 18 | 3303 | 4807 | 3850 | 44046 | 54 | researchCapacity +4 | RP cap += 4 |
| 19 | 3526 | 5101 | 4109 | 47126 | 57 | researchCapacity +4 | RP cap += 4 |
| 20 | 3752 | 5397 | 4369 | 50246 | 60 | researchCapacity +4 | RP cap += 4 |
| 21 | 3980 | 5695 | 4633 | 53407 | 63 | researchCapacity +4 | RP cap += 4 |
| 22 | 4210 | 5994 | 4899 | 56603 | 66 | researchCapacity +4 | RP cap += 4 |
| 23 | 4443 | 6294 | 5167 | 59838 | 69 | researchCapacity +4 | RP cap += 4 |
| 24 | 4678 | 6596 | 5438 | 63108 | 72 | researchCapacity +4 | RP cap += 4 |
| 25 | 4915 | 6899 | 5711 | 66411 | 75 | researchCapacity +4 | RP cap += 4 |
| 26 | 5154 | 7203 | 5986 | 69748 | 78 | researchCapacity +4 | RP cap += 4 |
| 27 | 5394 | 7508 | 6264 | 73117 | 81 | researchCapacity +4 | RP cap += 4 |
| 28 | 5637 | 7815 | 6543 | 76518 | 84 | researchCapacity +4 | RP cap += 4 |
| 29 | 5882 | 8122 | 6824 | 79949 | 87 | researchCapacity +4 | RP cap += 4 |
| 30 | 6128 | 8431 | 7108 | 83410 | 90 | researchCapacity +4 | RP cap += 4 |
| 31 | 6376 | 8740 | 7393 | 86900 | 93 | researchCapacity +4 | RP cap += 4 |
| 32 | 6626 | 9051 | 7680 | 90418 | 96 | researchCapacity +4 | RP cap += 4 |
| 33 | 6877 | 9363 | 7969 | 93964 | 99 | researchCapacity +4 | RP cap += 4 |
| 34 | 7130 | 9675 | 8260 | 97536 | 102 | researchCapacity +4 | RP cap += 4 |
| 35 | 7385 | 9989 | 8552 | 101135 | 105 | researchCapacity +4 | RP cap += 4 |

## Research mechanics linked to the building
- RP capacity: `research_lab_level * 4`.
- RP spend: `sum(completedResearch RP cost) + sum(researchQueue RP cost)`.
- Start guard: vérifie niveau lab requis, prereqs research, RP capacity, ressources, queue libre.
- Start: retire le coût ressources, ajoute une entrée queue avec `startedAtMs`, `endsAtMs`, `costPaid`.
- Completion: `resolveCompletedResearch` déplace les entrées finies vers `completedResearch` (dédup).
- Persistence/load: queue + completed persistés; migration legacy IDs et filtrage unknown IDs au chargement.

## UX / player-facing behavior
- UI affiche: statuses locked/available/in progress/completed, coûts, durée, prereqs, points utilisés, queue active.
- Blockers affichés: niveau lab, prereq research manquante, RP insuffisants, ressources insuffisantes, queue occupée.
- Libellé d’effet basé sur la config (`formatResearchEffect`) ; ne distingue pas toujours agrégé-only vs gameplay consumer complet.

## Current limitations / caveats
- Le bâtiment et la queue research sont runtime-fonctionnels.
- Certaines recherches débloquées par lab alimentent seulement des stats agrégées (defense/anti-air/market) sans consumer gameplay complet prouvé.
- `conquest` est déclarée mais la feature mère conquest/colonization n'est pas branchée en runtime dans ce scope.

## Source references
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityBuildingLevelTables.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
