# HQ

## 1. Résumé
- ID technique: `hq`
- Branche / catégorie: `economy`
- Statut dans le code: implémenté (bâtiment de progression sans effet direct en stats dérivées)
- Rôle gameplay réel: Colonne de progression: déverrouille les autres bâtiments et normalise les temps de construction.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 25
- Condition de déblocage HQ: HQ >= 1
- Prérequis globaux: aucun
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: oui

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): aucun
- Effets lus explicitement par le runtime ('cityEconomySystem'): aucun
- Entrée de catalogue correspondante: oui (phase=mvp, definitionStatus=fully_defined, gameplayImplemented=true)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 0 | 0 | 0 | 0 | 1 | — | HQ>=1 | — |
| 2 | 5 | 2 | 2 | 3 | 2 | — | HQ>=1 | — |
| 3 | 25 | 12 | 10 | 5 | 3 | — | HQ>=1 | — |
| 4 | 70 | 40 | 29 | 8 | 3 | — | HQ>=1 | — |
| 5 | 152 | 93 | 64 | 128 | 4 | — | HQ>=1 | — |
| 6 | 283 | 186 | 123 | 316 | 4 | — | HQ>=1 | — |
| 7 | 394 | 275 | 176 | 570 | 4 | — | HQ>=1 | — |
| 8 | 525 | 385 | 239 | 1119 | 4 | — | HQ>=1 | — |
| 9 | 676 | 519 | 313 | 4675 | 5 | — | HQ>=1 | — |
| 10 | 848 | 678 | 399 | 10322 | 5 | — | HQ>=1 | — |
| 11 | 1040 | 862 | 497 | 16144 | 5 | — | HQ>=1 | — |
| 12 | 1254 | 1075 | 607 | 20413 | 6 | — | HQ>=1 | — |
| 13 | 1490 | 1316 | 730 | 24401 | 6 | — | HQ>=1 | — |
| 14 | 1747 | 1588 | 865 | 26620 | 5 | — | HQ>=1 | — |
| 15 | 2027 | 1890 | 1014 | 28637 | 6 | — | HQ>=1 | — |
| 16 | 2328 | 2226 | 1176 | 31089 | 6 | — | HQ>=1 | — |
| 17 | 2652 | 2595 | 1352 | 33453 | 7 | — | HQ>=1 | — |
| 18 | 2999 | 2998 | 1542 | 35705 | 7 | — | HQ>=1 | — |
| 19 | 3369 | 3439 | 1746 | 37817 | 7 | — | HQ>=1 | — |
| 20 | 3762 | 3914 | 1965 | 39767 | 7 | — | HQ>=1 | — |
| 21 | 4178 | 4428 | 2199 | 41527 | 7 | — | HQ>=1 | — |
| 22 | 4617 | 4981 | 2447 | 43073 | 7 | — | HQ>=1 | — |
| 23 | 5080 | 5574 | 2710 | 44379 | 8 | — | HQ>=1 | — |
| 24 | 5567 | 6208 | 2989 | 45421 | 8 | — | HQ>=1 | — |
| 25 | 6077 | 6884 | 3283 | 46114 | 8 | — | HQ>=1 | — |

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
- `getConstructionDurationSeconds` applique une normalisation de type Senate basée sur le niveau HQ, sauf pour l’upgrade HQ lui-même.

## 7. Statut d’implémentation / zones d’attention
- Runtime construction: implémenté (canStartConstruction, startConstruction, resolveCompletedConstruction).
- Divergence config/runtime: catalog présent, comparer son statut (phase=mvp, gameplayImplemented=true) avec l’état runtime réel ci-dessus.
- Écarts docs existantes: non utilisés comme source de vérité dans cette génération (code prioritaire).

## 8. Sources de vérité utilisées
- src/game/city/economy/cityEconomyConfig.ts
- src/game/city/economy/cityBuildingLevelTables.ts
- src/game/city/economy/cityEconomySystem.ts
- src/game/city/economy/cityContentCatalog.ts
- src/game/render/modes/CityFoundationMode.ts (exposition UI)
