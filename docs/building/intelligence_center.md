# Intelligence Center

## 1. Résumé
- ID technique: `intelligence_center`
- Branche / catégorie: `intelligence`
- Statut dans le code: implémenté
- Rôle gameplay réel: Détection, contre-intel, projets intel, coffre espion.
- Réellement utilisable dans le runtime actuel: oui

## 2. Position dans la progression
- Niveau max: 10
- Condition de déblocage HQ: HQ >= 10
- Prérequis globaux: market >= 4, warehouse >= 7
- Prérequis par band / palier: aucun dans la config runtime
- Présent dans l’état initial d’une ville: non

## 3. Ce que ce bâtiment fait réellement
- Effets configurés (union de tous niveaux): detectionPct, counterIntelPct
- Effets lus explicitement par le runtime ('cityEconomySystem'): detectionPct, counterIntelPct
- Entrée de catalogue correspondante: oui (phase=later, definitionStatus=partially_defined, gameplayImplemented=false)

## 4. Table complète des niveaux
| Niveau | Ore | Stone | Iron | Temps construction (s) | Population | Effets non nuls | Pré requis HQ (target) | Pré requis additionnels (target) |
|---:|---:|---:|---:|---:|---:|---|---|---|
| 1 | 200 | 400 | 700 | 37 | 3 | counterIntelPct=4 ; detectionPct=3 | HQ>=10 | market>=4, warehouse>=7 |
| 2 | 492 | 800 | 1306 | 205 | 4 | counterIntelPct=8 ; detectionPct=6 | HQ>=10 | market>=4, warehouse>=7 |
| 3 | 834 | 1200 | 1882 | 556 | 5 | counterIntelPct=12 ; detectionPct=9 | HQ>=10 | market>=4, warehouse>=7 |
| 4 | 1213 | 1600 | 2438 | 1127 | 6 | counterIntelPct=16 ; detectionPct=12 | HQ>=10 | market>=4, warehouse>=7 |
| 5 | 1621 | 2000 | 2980 | 1949 | 7 | counterIntelPct=20 ; detectionPct=15 | HQ>=10 | market>=4, warehouse>=7 |
| 6 | 2054 | 2400 | 3511 | 3050 | 7 | counterIntelPct=24 ; detectionPct=18 | HQ>=10 | market>=4, warehouse>=7 |
| 7 | 2510 | 2800 | 4034 | 4453 | 8 | counterIntelPct=28 ; detectionPct=21 | HQ>=10 | market>=4, warehouse>=7 |
| 8 | 2986 | 3200 | 4549 | 6182 | 8 | counterIntelPct=32 ; detectionPct=24 | HQ>=10 | market>=4, warehouse>=7 |
| 9 | 3480 | 3600 | 5057 | 8256 | 9 | counterIntelPct=36 ; detectionPct=27 | HQ>=10 | market>=4, warehouse>=7 |
| 10 | 3991 | 4000 | 5560 | 10694 | 10 | counterIntelPct=40 ; detectionPct=30 | HQ>=10 | market>=4, warehouse>=7 |

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
- Garde l’accès à `canStartIntelProject`, `canDepositSpySilver`, `canStartEspionageMission`; `getSpyVaultCap` dépend du niveau.

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
