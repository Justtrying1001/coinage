# Market

## 1. Résumé
- ID technique: `market`
- Branche / catégorie: `logistics`
- Statut dans le code: implémenté
- Rôle gameplay réel: Efficacité de marché.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 30
- Condition de déblocage HQ: HQ >= 3
- Prérequis globaux: warehouse >= 5
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): marketEfficiencyPct
- Effets lus explicitement par le runtime ('cityEconomySystem'): marketEfficiencyPct
- Entrée de catalogue correspondante: oui (phase=later, definitionStatus=partially_defined, gameplayImplemented=false)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 50 | 20 | 5 | 25 | 2 | marketEfficiencyPct=5 | HQ>=3 | warehouse>=5 |
| 2 | 139 | 61 | 20 | 158 | 4 | marketEfficiencyPct=10 | HQ>=3 | warehouse>=5 |
| 3 | 254 | 119 | 44 | 477 | 7 | marketEfficiencyPct=15 | HQ>=3 | warehouse>=5 |
| 4 | 389 | 189 | 78 | 1062 | 9 | marketEfficiencyPct=20 | HQ>=3 | warehouse>=5 |
| 5 | 541 | 271 | 121 | 2006 | 12 | marketEfficiencyPct=25 | HQ>=3 | warehouse>=5 |
| 6 | 709 | 364 | 174 | 3418 | 14 | marketEfficiencyPct=30 | HQ>=3 | warehouse>=5 |
| 7 | 891 | 468 | 236 | 5432 | 17 | marketEfficiencyPct=35 | HQ>=3 | warehouse>=5 |
| 8 | 1085 | 581 | 307 | 8217 | 20 | marketEfficiencyPct=40 | HQ>=3 | warehouse>=5 |
| 9 | 1292 | 703 | 388 | 11988 | 22 | marketEfficiencyPct=45 | HQ>=3 | warehouse>=5 |
| 10 | 1510 | 834 | 477 | 17026 | 25 | marketEfficiencyPct=50 | HQ>=3 | warehouse>=5 |
| 11 | 1739 | 973 | 577 | 22034 | 28 | marketEfficiencyPct=55 | HQ>=3 | warehouse>=5 |
| 12 | 1978 | 1120 | 685 | 25326 | 31 | marketEfficiencyPct=60 | HQ>=3 | warehouse>=5 |
| 13 | 2226 | 1275 | 803 | 28786 | 34 | marketEfficiencyPct=65 | HQ>=3 | warehouse>=5 |
| 14 | 2485 | 1438 | 930 | 32411 | 36 | marketEfficiencyPct=70 | HQ>=3 | warehouse>=5 |
| 15 | 2752 | 1608 | 1066 | 36192 | 39 | marketEfficiencyPct=75 | HQ>=3 | warehouse>=5 |
| 16 | 3027 | 1785 | 1211 | 40130 | 42 | marketEfficiencyPct=80 | HQ>=3 | warehouse>=5 |
| 17 | 3312 | 1970 | 1365 | 44217 | 45 | marketEfficiencyPct=85 | HQ>=3 | warehouse>=5 |
| 18 | 3604 | 2161 | 1529 | 48452 | 48 | marketEfficiencyPct=90 | HQ>=3 | warehouse>=5 |
| 19 | 3904 | 2358 | 1702 | 52830 | 51 | marketEfficiencyPct=95 | HQ>=3 | warehouse>=5 |
| 20 | 4212 | 2563 | 1884 | 57349 | 54 | marketEfficiencyPct=100 | HQ>=3 | warehouse>=5 |
| 21 | 4527 | 2773 | 2075 | 62005 | 57 | marketEfficiencyPct=105 | HQ>=3 | warehouse>=5 |
| 22 | 4850 | 2991 | 2275 | 66796 | 60 | marketEfficiencyPct=110 | HQ>=3 | warehouse>=5 |
| 23 | 5180 | 3214 | 2484 | 71721 | 63 | marketEfficiencyPct=115 | HQ>=3 | warehouse>=5 |
| 24 | 5517 | 3443 | 2703 | 76775 | 66 | marketEfficiencyPct=120 | HQ>=3 | warehouse>=5 |
| 25 | 5860 | 3679 | 2930 | 81956 | 69 | marketEfficiencyPct=125 | HQ>=3 | warehouse>=5 |
| 26 | 6211 | 3920 | 3167 | 87264 | 72 | marketEfficiencyPct=130 | HQ>=3 | warehouse>=5 |
| 27 | 6567 | 4167 | 3412 | 92696 | 75 | marketEfficiencyPct=135 | HQ>=3 | warehouse>=5 |
| 28 | 6930 | 4420 | 3667 | 98250 | 78 | marketEfficiencyPct=140 | HQ>=3 | warehouse>=5 |
| 29 | 7300 | 4679 | 3931 | 103923 | 81 | marketEfficiencyPct=145 | HQ>=3 | warehouse>=5 |
| 30 | 7676 | 4943 | 4204 | 109716 | 84 | marketEfficiencyPct=150 | HQ>=3 | warehouse>=5 |

## 5. Contenus débloqués / dépendances aval
### Bâtiments débloqués
- `intelligence_center`
- `council_chamber`

### Unités liées
- aucune unité liée directement

### Recherches liées
- aucune liaison directe hors gate global research_lab

### Politiques liées
- aucune

## 6. Détails runtime importants
- `marketEfficiencyPct` est calculé dans stats dérivées mais son impact runtime direct n’est pas branché hors exposition de stat.

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
