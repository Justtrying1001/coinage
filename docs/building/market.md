# Market

## Identité du bâtiment
- ID technique: `market`
- Nom runtime: `Market`
- Branche: `logistics`
- Déblocage: `HQ >= 3` + `warehouse >= 5`
- Niveau max: `30`
- Asset UI: `/assets/market.png`

## Rôle cible (produit) et rôle runtime actuel
- **Rôle principal**: capacité d’envoi/transfert de ressources vers une autre ville joueur.
- **Stat principale canonique**: `shipmentCapacity` (cap max de ressources par dispatch).
- **Rôle secondaire**: `marketEfficiencyPct` reste une stat agrégée de recherches (pas le cœur du bâtiment market).

## Table runtime des niveaux (L1 -> L30)
> Coûts/temps/population inchangés; effet principal migré vers `shipmentCapacity`.

| Niveau | Ore | Stone | Iron | Build(s) | Population | Effet principal |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 50 | 20 | 5 | 25 | 2 | `shipmentCapacity=500` |
| 2 | 139 | 61 | 20 | 158 | 4 | `shipmentCapacity=1000` |
| 3 | 254 | 119 | 44 | 477 | 7 | `shipmentCapacity=1500` |
| 4 | 389 | 189 | 78 | 1062 | 9 | `shipmentCapacity=2000` |
| 5 | 541 | 271 | 121 | 2006 | 12 | `shipmentCapacity=2500` |
| 6 | 709 | 364 | 174 | 3418 | 14 | `shipmentCapacity=3000` |
| 7 | 891 | 468 | 236 | 5432 | 17 | `shipmentCapacity=3500` |
| 8 | 1085 | 581 | 307 | 8217 | 20 | `shipmentCapacity=4000` |
| 9 | 1292 | 703 | 388 | 11988 | 22 | `shipmentCapacity=4500` |
| 10 | 1510 | 834 | 477 | 17026 | 25 | `shipmentCapacity=5000` |
| 11 | 1739 | 973 | 577 | 22034 | 28 | `shipmentCapacity=5500` |
| 12 | 1978 | 1120 | 685 | 25326 | 31 | `shipmentCapacity=6000` |
| 13 | 2226 | 1275 | 803 | 28786 | 34 | `shipmentCapacity=6500` |
| 14 | 2485 | 1438 | 930 | 32411 | 36 | `shipmentCapacity=7000` |
| 15 | 2752 | 1608 | 1066 | 36192 | 39 | `shipmentCapacity=7500` |
| 16 | 3027 | 1785 | 1211 | 40130 | 42 | `shipmentCapacity=8000` |
| 17 | 3312 | 1970 | 1365 | 44217 | 45 | `shipmentCapacity=8500` |
| 18 | 3604 | 2161 | 1529 | 48452 | 48 | `shipmentCapacity=9000` |
| 19 | 3904 | 2358 | 1702 | 52830 | 51 | `shipmentCapacity=9500` |
| 20 | 4212 | 2563 | 1884 | 57349 | 54 | `shipmentCapacity=10000` |
| 21 | 4527 | 2773 | 2075 | 62005 | 57 | `shipmentCapacity=10500` |
| 22 | 4850 | 2991 | 2275 | 66796 | 60 | `shipmentCapacity=11000` |
| 23 | 5180 | 3214 | 2484 | 71721 | 63 | `shipmentCapacity=11500` |
| 24 | 5517 | 3443 | 2703 | 76775 | 66 | `shipmentCapacity=12000` |
| 25 | 5860 | 3679 | 2930 | 81956 | 69 | `shipmentCapacity=12500` |
| 26 | 6211 | 3920 | 3167 | 87264 | 72 | `shipmentCapacity=13000` |
| 27 | 6567 | 4167 | 3412 | 92696 | 75 | `shipmentCapacity=13500` |
| 28 | 6930 | 4420 | 3667 | 98250 | 78 | `shipmentCapacity=14000` |
| 29 | 7300 | 4679 | 3931 | 103923 | 81 | `shipmentCapacity=14500` |
| 30 | 7676 | 4943 | 4204 | 109716 | 84 | `shipmentCapacity=15000` |

## Runtime truth après correction
- `getMarketShipmentCapacity(state)` lit directement l’effet du niveau courant de `market`.
- `canSendResourceTransfer(...)` bloque un dispatch si:
  - market non construit,
  - cible invalide,
  - total envoyé <= 0,
  - total envoyé > `shipmentCapacity`,
  - ressources insuffisantes.
- `sendResourceTransfer(...)` applique le guard, débite les ressources et retourne un reçu de dispatch (source, cible, bundle, total, capacité au moment d’envoi).
- UI market expose maintenant `shipmentCapacity`, le montant transférable instantané, et l’état des guards de dispatch.

## Ce qui est implémenté vs ce qui reste
### Implémenté
- Rôle principal market = capacité de transfert par dispatch.
- Consommation runtime réelle de cette stat via guards et exécution locale d’envoi.
- UI alignée sur cette capacité.

### Reste à brancher
- Livraison inter-ville complète (transit, arrivée, crédit cible, éventuelle annulation/latence).
- Flux exchange/matching complet type order-book.

## Verdict final
- `market` n’est plus un simple nœud d’`marketEfficiencyPct`.
- `market` est maintenant correctement mappé comme bâtiment de capacité de transfert de ressources (scope MVP local runtime).
- Statut: **PARTIAL** (dispatch local réel OK, boucle inter-ville complète encore incomplète).
