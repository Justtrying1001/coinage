# Council Chamber

## Identité runtime
- ID technique: `council_chamber`
- Nom affiché: `Council Chamber`
- Catégorie: `governance`
- Asset UI: `/assets/council_chamber.png`
- Niveau max: `25`
- Unlock: `HQ >= 15`
- Prérequis: `market >= 10`, `research_lab >= 15`

## Rôle confirmé (produit)
`council_chamber` est un bâtiment **diplomatie / gouvernance macro** uniquement.

Conséquences produit appliquées:
- aucun bonus local de build,
- aucun bonus local de défense,
- aucun bonus local/stat passive liée à ses niveaux.

## Table complète des niveaux (runtime actuel)
> Les niveaux restent présents pour la progression/build-cost/temps/population, mais **sans effet local gameplay**.

| Niveau | Ore | Stone | Iron | Build time (s) | Population | Effet local |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 0 | 0 | 0 | 0 | 1 | aucun |
| 2 | 5 | 2 | 2 | 3 | 2 | aucun |
| 3 | 25 | 12 | 10 | 5 | 3 | aucun |
| 4 | 70 | 40 | 29 | 8 | 3 | aucun |
| 5 | 152 | 93 | 64 | 128 | 4 | aucun |
| 6 | 283 | 186 | 123 | 316 | 4 | aucun |
| 7 | 394 | 275 | 176 | 570 | 4 | aucun |
| 8 | 525 | 385 | 239 | 1119 | 4 | aucun |
| 9 | 676 | 519 | 313 | 4675 | 5 | aucun |
| 10 | 848 | 678 | 399 | 10322 | 5 | aucun |
| 11 | 1040 | 862 | 497 | 16144 | 5 | aucun |
| 12 | 1254 | 1075 | 607 | 20413 | 6 | aucun |
| 13 | 1490 | 1316 | 730 | 24401 | 6 | aucun |
| 14 | 1747 | 1588 | 865 | 26620 | 5 | aucun |
| 15 | 2027 | 1890 | 1014 | 28637 | 6 | aucun |
| 16 | 2328 | 2226 | 1176 | 31089 | 6 | aucun |
| 17 | 2652 | 2595 | 1352 | 33453 | 7 | aucun |
| 18 | 2999 | 2998 | 1542 | 35705 | 7 | aucun |
| 19 | 3369 | 3439 | 1746 | 37817 | 7 | aucun |
| 20 | 3762 | 3914 | 1965 | 39767 | 7 | aucun |
| 21 | 4178 | 4428 | 2199 | 41527 | 7 | aucun |
| 22 | 4617 | 4981 | 2447 | 43073 | 7 | aucun |
| 23 | 5080 | 5574 | 2710 | 44379 | 8 | aucun |
| 24 | 5567 | 6208 | 2989 | 45421 | 8 | aucun |
| 25 | 6077 | 6884 | 3283 | 46114 | 8 | aucun |

## Runtime truth (après correction)
- `council_chamber` n’alimente plus `buildSpeedPct` ni `cityDefensePct` dans `getCityDerivedStats`.
- Les durées de construction ne reçoivent plus aucun bonus venant de `council_chamber`.
- Les levels de `council_chamber` restent utilisés pour progression/coûts/temps/population uniquement.
- Le système de policies existe toujours mais est explicitement **transitional** et n’est plus gate par `council_chamber` (requiredCouncilLevel=0).

## Ce qui est implémenté vs pending
Implémenté:
- identité runtime, prérequis, table niveaux, suppression des passifs locaux.

Pending:
- feature diplomatie macro/faction/token finale,
- définition produit de la signification exacte des niveaux `council_chamber` pour la boucle macro,
- éventuel remplacement du système policy transitionnel.

## Pourquoi l’ancien modèle était faux
L’ancien modèle donnait des bonus locaux de build/défense. Cela contredit la vérité produit confirmée: `council_chamber` doit être diplomatie-only et ne doit pas impacter local economy/combat passivement.

## Verdict
- Statut runtime actuel: **DIPLOMACY_GATE_ONLY**
- Statut produit global: **DESIGN_PENDING** (feature macro diplomatie non finalisée)

## Design pending
Voir: [`docs/building/council_chamber_design_pending.md`](./council_chamber_design_pending.md)
