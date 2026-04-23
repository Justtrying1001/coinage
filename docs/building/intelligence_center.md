# Intelligence Center

## Identité runtime
- ID technique: `intelligence_center`
- Nom: `Intelligence Center`
- Branche: `intelligence`
- Déblocage: `HQ 10` + `market >= 4` + `warehouse >= 7`
- Niveau max: `10`
- Asset UI (City view): `/assets/building/spycenter.png`

## Rôle gameplay (MVP final espionnage)
Le bâtiment porte la capacité opérationnelle d’espionnage de ville à ville:
- débloque les opérations intel locales (`sweep/network/cipher`) qui montent `intelReadiness`;
- débloque le coffre espion (`spyVaultSilver`) alimenté via conversion d’`iron`;
- débloque l’envoi de mission espionnage vers une ville cible;
- fournit des stats `detectionPct` et `counterIntelPct` qui sont maintenant utilisées dans la défense espionnage effective à la résolution.

## Ce que le bâtiment ne fait pas
- ne remplace pas `research_lab` (qui reste la source des recherches);
- ne produit pas d’unités;
- n’introduit pas de nouvelle ressource (on reste sur silver dans le vault).

## Table de niveaux runtime (L1 -> L10)
| Niveau | Ore | Stone | Iron | Build (s) | Population | Effets |
|---:|---:|---:|---:|---:|---:|---|
| 1 | 200 | 400 | 700 | 37 | 3 | `detectionPct=3`, `counterIntelPct=4` |
| 2 | 492 | 800 | 1306 | 205 | 4 | `detectionPct=6`, `counterIntelPct=8` |
| 3 | 834 | 1200 | 1882 | 556 | 5 | `detectionPct=9`, `counterIntelPct=12` |
| 4 | 1213 | 1600 | 2438 | 1127 | 6 | `detectionPct=12`, `counterIntelPct=16` |
| 5 | 1621 | 2000 | 2980 | 1949 | 7 | `detectionPct=15`, `counterIntelPct=20` |
| 6 | 2054 | 2400 | 3511 | 3050 | 7 | `detectionPct=18`, `counterIntelPct=24` |
| 7 | 2510 | 2800 | 4034 | 4453 | 8 | `detectionPct=21`, `counterIntelPct=28` |
| 8 | 2986 | 3200 | 4549 | 6182 | 8 | `detectionPct=24`, `counterIntelPct=32` |
| 9 | 3480 | 3600 | 5057 | 8256 | 9 | `detectionPct=27`, `counterIntelPct=36` |
| 10 | 3991 | 4000 | 5560 | 10694 | 10 | `detectionPct=30`, `counterIntelPct=40` |

## Vérité runtime espionnage (résumé)
- Mission sortante: 1 max / ville, cible obligatoire, pas d’auto-cible, minimum `1000` silver.
- Refill vault bloqué pendant mission sortante active.
- Cap vault: `niveau * 1000`, infini à L10.
- Résolution cross-city en persistence via tick runtime central (`runCityEconomyRuntimeTick`), indépendante du chargement opportuniste d’une ville.
- Règle de succès: `silver_envoyé > defenderEffectiveSpyDefense`.
- `defenderEffectiveSpyDefense` inclut silver défensif + multiplicateur dérivé de `detectionPct + counterIntelPct`.
- Succès: rapport détaillé côté attaquant (snapshot ressources, bâtiments, troupes, bonus défensifs), pas de rapport défenseur par défaut.
- Échec: rapport attaquant + rapport défenseur; silver défenseur dépensé selon `min(vault_def, silver_envoyé)`.

## Statut scope
- Statut: **DONE (MVP espionnage)**
- La boucle MVP de mission ville->ville est complète, persistée, testée, documentée.
