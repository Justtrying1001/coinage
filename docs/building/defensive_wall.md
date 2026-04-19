# Defensive Wall

## 1. Résumé
- ID technique: `defensive_wall`
- Branche / catégorie: `defense`
- Statut dans le code: implémenté
- Rôle gameplay réel: Bonus défensifs de ville (défense, mitigation, résistance siège).
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 25
- Condition de déblocage HQ: HQ >= 5
- Prérequis globaux: aucun
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): cityDefensePct, damageMitigationPct, siegeResistancePct
- Effets lus explicitement par le runtime ('cityEconomySystem'): cityDefensePct, damageMitigationPct, siegeResistancePct
- Entrée de catalogue correspondante: oui (phase=later, definitionStatus=partially_defined, gameplayImplemented=false)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 400 | 350 | 200 | 80 | 2 | cityDefensePct=3.7 ; damageMitigationPct=1.5 ; siegeResistancePct=2.2 | HQ>=5 | — |
| 2 | 400 | 700 | 429 | 395 | 4 | cityDefensePct=7.5 ; damageMitigationPct=3 ; siegeResistancePct=4.5 | HQ>=5 | — |
| 3 | 400 | 1050 | 670 | 1003 | 7 | cityDefensePct=11.4 ; damageMitigationPct=4.6 ; siegeResistancePct=6.8 | HQ>=5 | — |
| 4 | 400 | 1400 | 919 | 1945 | 10 | cityDefensePct=15.5 ; damageMitigationPct=6.2 ; siegeResistancePct=9.3 | HQ>=5 | — |
| 5 | 400 | 1750 | 1175 | 3249 | 13 | cityDefensePct=19.7 ; damageMitigationPct=7.9 ; siegeResistancePct=11.8 | HQ>=5 | — |
| 6 | 400 | 2100 | 1435 | 4942 | 16 | cityDefensePct=24.1 ; damageMitigationPct=9.6 ; siegeResistancePct=14.5 | HQ>=5 | — |
| 7 | 400 | 2450 | 1701 | 7045 | 19 | cityDefensePct=28.5 ; damageMitigationPct=11.4 ; siegeResistancePct=17.1 | HQ>=5 | — |
| 8 | 400 | 2800 | 1970 | 9577 | 22 | cityDefensePct=33.3 ; damageMitigationPct=13.3 ; siegeResistancePct=20 | HQ>=5 | — |
| 9 | 400 | 3150 | 2242 | 12557 | 26 | cityDefensePct=38 ; damageMitigationPct=15.2 ; siegeResistancePct=22.8 | HQ>=5 | — |
| 10 | 400 | 3500 | 2515 | 16000 | 29 | cityDefensePct=43 ; damageMitigationPct=17.2 ; siegeResistancePct=25.8 | HQ>=5 | — |
| 11 | 400 | 3850 | 2796 | 20123 | 32 | cityDefensePct=48.1 ; damageMitigationPct=19.2 ; siegeResistancePct=28.9 | HQ>=5 | — |
| 12 | 400 | 4200 | 3077 | 22532 | 36 | cityDefensePct=53.5 ; damageMitigationPct=21.4 ; siegeResistancePct=32.1 | HQ>=5 | — |
| 13 | 400 | 4550 | 3360 | 25003 | 39 | cityDefensePct=59 ; damageMitigationPct=23.6 ; siegeResistancePct=35.4 | HQ>=5 | — |
| 14 | 400 | 4900 | 3646 | 27533 | 43 | cityDefensePct=64.7 ; damageMitigationPct=25.9 ; siegeResistancePct=38.8 | HQ>=5 | — |
| 15 | 400 | 5250 | 3933 | 30116 | 46 | cityDefensePct=70.5 ; damageMitigationPct=28.2 ; siegeResistancePct=42.3 | HQ>=5 | — |
| 16 | 400 | 5600 | 4222 | 32752 | 50 | cityDefensePct=76.7 ; damageMitigationPct=30.7 ; siegeResistancePct=46 | HQ>=5 | — |
| 17 | 400 | 5950 | 4514 | 35437 | 54 | cityDefensePct=82.9 ; damageMitigationPct=33.2 ; siegeResistancePct=49.7 | HQ>=5 | — |
| 18 | 400 | 6300 | 4807 | 38170 | 57 | cityDefensePct=89.5 ; damageMitigationPct=35.8 ; siegeResistancePct=53.7 | HQ>=5 | — |
| 19 | 400 | 6650 | 5101 | 40950 | 61 | cityDefensePct=96.2 ; damageMitigationPct=38.5 ; siegeResistancePct=57.7 | HQ>=5 | — |
| 20 | 400 | 7000 | 5397 | 43774 | 65 | cityDefensePct=103.3 ; damageMitigationPct=41.3 ; siegeResistancePct=62 | HQ>=5 | — |
| 21 | 400 | 7350 | 5695 | 46641 | 68 | cityDefensePct=110.4 ; damageMitigationPct=44.2 ; siegeResistancePct=66.2 | HQ>=5 | — |
| 22 | 400 | 7700 | 5994 | 49549 | 72 | cityDefensePct=117.9 ; damageMitigationPct=47.2 ; siegeResistancePct=70.7 | HQ>=5 | — |
| 23 | 400 | 8050 | 6294 | 52496 | 76 | cityDefensePct=125.6 ; damageMitigationPct=50.2 ; siegeResistancePct=75.4 | HQ>=5 | — |
| 24 | 400 | 8400 | 6596 | 55482 | 80 | cityDefensePct=133.6 ; damageMitigationPct=53.4 ; siegeResistancePct=80.2 | HQ>=5 | — |
| 25 | 400 | 8750 | 6899 | 58506 | 84 | cityDefensePct=141.9 ; damageMitigationPct=56.8 ; siegeResistancePct=85.1 | HQ>=5 | — |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- `watch_tower`

### Unités liées
- aucune unité liée directement

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- aucune

## 6. Détails runtime importants
- Contribue à `cityDefensePct`, `damageMitigationPct`, `siegeResistancePct` via `getCityDerivedStats`.

## 7. Statut d’implémentation / zones d’attention
- Runtime construction: implémenté (canStartConstruction, startConstruction, resolveCompletedConstruction).
- Divergence config/runtime: catalog présent, comparer son statut (phase=later, gameplayImplemented=false) avec l’état runtime réel ci-dessus.
- Écarts docs existantes: non utilisés comme source de vérité dans cette génération (code prioritaire).

## 8. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityBuildingLevelTables.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)
