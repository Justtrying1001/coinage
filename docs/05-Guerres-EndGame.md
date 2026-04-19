**COINAGE**

**Guerres Officielles & End Game**

*Conflits, renseignement macro, saisons et fin de serveur*

DOC 05 — MACRO

Version 2.2 — Avril 2026

# Guerres officielles

## Conditions préalables

| Condition | Détail |
| --- | --- |
| Branche Diplomatique palier 3 | Déclaration de guerre officielle |
| Branche Militaire palier 3 | Armée collective active |

Sans ces deux prérequis, une faction peut raider les secteurs neutres ou contestés mais pas déclarer de guerre officielle contre des territoires ennemis contrôlés/gouvernés.

## Armée collective

Le pool collectif existe en permanence. Les joueurs peuvent y contribuer des troupes à tout moment.

- En paix : réserve défensive
- En guerre : le Général dirige les objectifs et les vagues

## Déclaration de guerre

| Étape | Description |
| --- | --- |
| 1. Proposition | Le Gouverneur propose la guerre |
| 2. Vote | 25% des joueurs actifs approuvent sous 24h |
| 3. Déclaration | La cible est notifiée au moment de la validation |
| 4. Choix de camp | Multi-token : 12h pour choisir un camp |
| 5. Alliés | Les alliés sont notifiés et choisissent leur implication |

## Déroulement du conflit

Pas de timer fixe : la guerre dure jusqu'à condition de fin.

| Acteur | Rôle |
| --- | --- |
| Général | Dirige les troupes du pool collectif, objectifs et timings |
| Joueurs individuels | Attaques, défenses, renforts, contributions au pool |

## Objectifs de guerre

Les cibles sont les villes situées sur des territoires ennemis contrôlés ou gouvernés.

### Séquence de capture (mécanique inchangée)

| Étape | Description |
| --- | --- |
| 1. Nettoyage | Détruire les défenses de la ville cible |
| 2. Instabilité | Attaque de siège gagnante : fenêtre de 12h |
| 3. Convoi | Le convoi de colonisation doit arriver dans la fenêtre |
| 4. Capture | Si le convoi survit : ville capturée, convoi consommé |

## Règle des 75% — chute d'un territoire

Si 75% des villes d'un territoire spécifique passent sous contrôle d'une même faction ennemie, ce territoire bascule au profit de cette faction.

La guerre peut continuer sur les autres territoires de la faction perdante.

## Conditions de fin de guerre

| Condition | Mécanisme | Prérequis |
| --- | --- | --- |
| Traité de paix | Diplomates + Conseils (3/5) + 50% joueurs actifs | Diplomatique 5 |
| Reddition conditionnelle | Proposition faction en faiblesse, acceptation adverse | Diplomatique 14 |
| Victoire par conquête | Seuil 75% atteint sur territoire ciblé | Militaire 15 |
| Abandon | Vote interne d'abandon | Aucun |

## Récompenses

Distribution proportionnelle au score de contribution :

- part du trésor adverse
- ressources capturées en sièges
- bonus Shards

## Post-guerre

- délai de reconstruction avant nouvelle guerre entre mêmes factions
- colonies établies pendant guerre restent
- joueurs sans ville peuvent reconstruire sur secteur neutre

## Impact on-chain en guerre

Snapshot hebdomadaire immuable pendant la guerre.

| Métrique | Effet |
| --- | --- |
| Cohésion > 60% | +15% efficacité armée collective |
| Cohésion < 40% | -10% efficacité armée collective |
| Rétention > 70% | +10% bonus défensif passif |
| Rétention < 40% | -5% défense collective |
| Conversion élevée | -20% temps de mobilisation |

## Guerres avec alliances

Les alliés peuvent intervenir volontairement : troupes, attaques directes, renfort au pool collectif.

# Renseignement macro — Analyse de faction

## Prérequis

| Condition | Détail |
| --- | --- |
| Centre d'espionnage niveau 10 | Mission Surveillance individuelle |
| Branche Diplomatique palier 10 | Analyse de faction macro |

## Ce que l'analyse révèle

| Révèle | Ne révèle pas |
| --- | --- |
| Niveau du trésor de faction | Détail complet ville par ville |
| Paliers des 3 branches | Composition exacte armée collective |
| Taille approximative armée collective | Décisions internes du Conseil |
| Joueurs actifs 7j | Identité des espions actifs |
| Niveau de cohésion |  |

## Mécanique

Même logique que l'espionnage individuel : Iron depuis vault, trajet, succès/échec selon rapport attaque/défense collective.

`Défense_faction = somme(iron_vaults_actifs)`

Succès si `Iron_envoyé > Défense_faction / nombre_espions_actifs`.

# End Game & Saisons

## Modèle général

Chaque serveur a une durée finie. À la fin : reset du monde et ouverture d'un nouveau serveur.

## End game — Monuments de territoire

Quand le monde atteint un niveau de développement suffisant, une phase monuments s'ouvre :

- 7 monuments positionnés sur des secteurs neutres stratégiques
- construction collective coûteuse
- première alliance à compléter 4 monuments : victoire serveur

## Persistance inter-saisons

Persiste : titres, historique, réputation.

Reset : ressources, bâtiments, villes, branches, alliances, guerres, carte politique.
