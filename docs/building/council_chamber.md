# Council Chamber

## 1. Résumé
- ID technique: `council_chamber`
- Branche / catégorie: `governance`
- Statut dans le code: implémenté
- Rôle gameplay réel: Bonus build speed + city defense, déblocage politiques locales.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 25
- Condition de déblocage HQ: HQ >= 15
- Prérequis globaux: market >= 10, research_lab >= 15
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): cityDefensePct, buildSpeedPct
- Effets lus explicitement par le runtime ('cityEconomySystem'): cityDefensePct, buildSpeedPct
- Entrée de catalogue correspondante: oui (phase=later, definitionStatus=partially_defined, gameplayImplemented=false)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 0 | 0 | 0 | 0 | 1 | buildSpeedPct=0.5 ; cityDefensePct=0.5 | HQ>=15 | market>=10, research_lab>=15 |
| 2 | 5 | 2 | 2 | 3 | 2 | buildSpeedPct=1 ; cityDefensePct=1 | HQ>=15 | market>=10, research_lab>=15 |
| 3 | 25 | 12 | 10 | 5 | 3 | buildSpeedPct=1.5 ; cityDefensePct=1.5 | HQ>=15 | market>=10, research_lab>=15 |
| 4 | 70 | 40 | 29 | 8 | 3 | buildSpeedPct=2 ; cityDefensePct=2 | HQ>=15 | market>=10, research_lab>=15 |
| 5 | 152 | 93 | 64 | 128 | 4 | buildSpeedPct=2.5 ; cityDefensePct=2.5 | HQ>=15 | market>=10, research_lab>=15 |
| 6 | 283 | 186 | 123 | 316 | 4 | buildSpeedPct=3 ; cityDefensePct=3 | HQ>=15 | market>=10, research_lab>=15 |
| 7 | 394 | 275 | 176 | 570 | 4 | buildSpeedPct=3.5 ; cityDefensePct=3.5 | HQ>=15 | market>=10, research_lab>=15 |
| 8 | 525 | 385 | 239 | 1119 | 4 | buildSpeedPct=4 ; cityDefensePct=4 | HQ>=15 | market>=10, research_lab>=15 |
| 9 | 676 | 519 | 313 | 4675 | 5 | buildSpeedPct=4.5 ; cityDefensePct=4.5 | HQ>=15 | market>=10, research_lab>=15 |
| 10 | 848 | 678 | 399 | 10322 | 5 | buildSpeedPct=5 ; cityDefensePct=5 | HQ>=15 | market>=10, research_lab>=15 |
| 11 | 1040 | 862 | 497 | 16144 | 5 | buildSpeedPct=5.5 ; cityDefensePct=5.5 | HQ>=15 | market>=10, research_lab>=15 |
| 12 | 1254 | 1075 | 607 | 20413 | 6 | buildSpeedPct=6 ; cityDefensePct=6 | HQ>=15 | market>=10, research_lab>=15 |
| 13 | 1490 | 1316 | 730 | 24401 | 6 | buildSpeedPct=6.5 ; cityDefensePct=6.5 | HQ>=15 | market>=10, research_lab>=15 |
| 14 | 1747 | 1588 | 865 | 26620 | 5 | buildSpeedPct=7 ; cityDefensePct=7 | HQ>=15 | market>=10, research_lab>=15 |
| 15 | 2027 | 1890 | 1014 | 28637 | 6 | buildSpeedPct=7.5 ; cityDefensePct=7.5 | HQ>=15 | market>=10, research_lab>=15 |
| 16 | 2328 | 2226 | 1176 | 31089 | 6 | buildSpeedPct=8 ; cityDefensePct=8 | HQ>=15 | market>=10, research_lab>=15 |
| 17 | 2652 | 2595 | 1352 | 33453 | 7 | buildSpeedPct=8.5 ; cityDefensePct=8.5 | HQ>=15 | market>=10, research_lab>=15 |
| 18 | 2999 | 2998 | 1542 | 35705 | 7 | buildSpeedPct=9 ; cityDefensePct=9 | HQ>=15 | market>=10, research_lab>=15 |
| 19 | 3369 | 3439 | 1746 | 37817 | 7 | buildSpeedPct=9.5 ; cityDefensePct=9.5 | HQ>=15 | market>=10, research_lab>=15 |
| 20 | 3762 | 3914 | 1965 | 39767 | 7 | buildSpeedPct=10 ; cityDefensePct=10 | HQ>=15 | market>=10, research_lab>=15 |
| 21 | 4178 | 4428 | 2199 | 41527 | 7 | buildSpeedPct=10.5 ; cityDefensePct=10.5 | HQ>=15 | market>=10, research_lab>=15 |
| 22 | 4617 | 4981 | 2447 | 43073 | 7 | buildSpeedPct=11 ; cityDefensePct=11 | HQ>=15 | market>=10, research_lab>=15 |
| 23 | 5080 | 5574 | 2710 | 44379 | 8 | buildSpeedPct=11.5 ; cityDefensePct=11.5 | HQ>=15 | market>=10, research_lab>=15 |
| 24 | 5567 | 6208 | 2989 | 45421 | 8 | buildSpeedPct=12 ; cityDefensePct=12 | HQ>=15 | market>=10, research_lab>=15 |
| 25 | 6077 | 6884 | 3283 | 46114 | 8 | buildSpeedPct=12.5 ; cityDefensePct=12.5 | HQ>=15 | market>=10, research_lab>=15 |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- aucun bâtiment ne référence ce bâtiment comme prérequis direct

### Unités liées
- aucune unité liée directement

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- industrial_push (council 1)
- martial_law (council 3)
- civic_watch (council 5)

## 6. Détails runtime importants
- `canSetPolicy` vérifie son niveau; `buildSpeedPct` impacte les durées de construction (plafond multiplicateur 0.4).
- Mapping asset UI actuel: `/assets/council_chamber.png` (aligné canonique).
- Note runtime liée aux coûts: `buildCostReductionPct` est pris en compte par le calcul de coût de construction, mais aucune source active ne l’alimente encore dans la config actuelle.

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
