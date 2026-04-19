# Skyguard Tower

## 1. Résumé
- ID technique: `watch_tower`
- Branche / catégorie: `defense`
- Statut dans le code: implémenté
- Rôle gameplay réel: Bonus défense de ville et anti-air.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 20
- Condition de déblocage HQ: HQ >= 12
- Prérequis globaux: defensive_wall >= 15
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): cityDefensePct, antiAirDefensePct
- Effets lus explicitement par le runtime ('cityEconomySystem'): cityDefensePct, antiAirDefensePct
- Entrée de catalogue correspondante: oui (phase=later, definitionStatus=partially_defined, gameplayImplemented=false)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 400 | 350 | 200 | 80 | 2 | antiAirDefensePct=3.3 ; cityDefensePct=2.2 | HQ>=12 | defensive_wall>=15 |
| 2 | 400 | 700 | 429 | 395 | 4 | antiAirDefensePct=6.75 ; cityDefensePct=4.5 | HQ>=12 | defensive_wall>=15 |
| 3 | 400 | 1050 | 670 | 1003 | 7 | antiAirDefensePct=10.2 ; cityDefensePct=6.8 | HQ>=12 | defensive_wall>=15 |
| 4 | 400 | 1400 | 919 | 1945 | 10 | antiAirDefensePct=13.95 ; cityDefensePct=9.3 | HQ>=12 | defensive_wall>=15 |
| 5 | 400 | 1750 | 1175 | 3249 | 13 | antiAirDefensePct=17.7 ; cityDefensePct=11.8 | HQ>=12 | defensive_wall>=15 |
| 6 | 400 | 2100 | 1435 | 4942 | 16 | antiAirDefensePct=21.75 ; cityDefensePct=14.5 | HQ>=12 | defensive_wall>=15 |
| 7 | 400 | 2450 | 1701 | 7045 | 19 | antiAirDefensePct=25.65 ; cityDefensePct=17.1 | HQ>=12 | defensive_wall>=15 |
| 8 | 400 | 2800 | 1970 | 9577 | 22 | antiAirDefensePct=30 ; cityDefensePct=20 | HQ>=12 | defensive_wall>=15 |
| 9 | 400 | 3150 | 2242 | 12557 | 26 | antiAirDefensePct=34.2 ; cityDefensePct=22.8 | HQ>=12 | defensive_wall>=15 |
| 10 | 400 | 3500 | 2515 | 16000 | 29 | antiAirDefensePct=38.7 ; cityDefensePct=25.8 | HQ>=12 | defensive_wall>=15 |
| 11 | 400 | 3850 | 2796 | 20123 | 32 | antiAirDefensePct=43.35 ; cityDefensePct=28.9 | HQ>=12 | defensive_wall>=15 |
| 12 | 400 | 4200 | 3077 | 22532 | 36 | antiAirDefensePct=48.15 ; cityDefensePct=32.1 | HQ>=12 | defensive_wall>=15 |
| 13 | 400 | 4550 | 3360 | 25003 | 39 | antiAirDefensePct=53.1 ; cityDefensePct=35.4 | HQ>=12 | defensive_wall>=15 |
| 14 | 400 | 4900 | 3646 | 27533 | 43 | antiAirDefensePct=58.2 ; cityDefensePct=38.8 | HQ>=12 | defensive_wall>=15 |
| 15 | 400 | 5250 | 3933 | 30116 | 46 | antiAirDefensePct=63.45 ; cityDefensePct=42.3 | HQ>=12 | defensive_wall>=15 |
| 16 | 400 | 5600 | 4222 | 32752 | 50 | antiAirDefensePct=69 ; cityDefensePct=46 | HQ>=12 | defensive_wall>=15 |
| 17 | 400 | 5950 | 4514 | 35437 | 54 | antiAirDefensePct=74.55 ; cityDefensePct=49.7 | HQ>=12 | defensive_wall>=15 |
| 18 | 400 | 6300 | 4807 | 38170 | 57 | antiAirDefensePct=80.55 ; cityDefensePct=53.7 | HQ>=12 | defensive_wall>=15 |
| 19 | 400 | 6650 | 5101 | 40950 | 61 | antiAirDefensePct=86.55 ; cityDefensePct=57.7 | HQ>=12 | defensive_wall>=15 |
| 20 | 400 | 7000 | 5397 | 43774 | 65 | antiAirDefensePct=93 ; cityDefensePct=62 | HQ>=12 | defensive_wall>=15 |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- aucun bâtiment ne référence ce bâtiment comme prérequis direct

### Unités liées
- aucune unité liée directement

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- aucune

## 6. Détails runtime importants
- Contribue à `cityDefensePct` et `antiAirDefensePct` via `getCityDerivedStats`.

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
