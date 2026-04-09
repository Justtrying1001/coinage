**COINAGE**

**Lexique & Ressources**

*Terminologie officielle et économie de base*

Version 2.0 — Avril 2026

# Dictionnaire canonique

## Entités

| Terme | Définition |
| --- | --- |
| Faction | Ensemble des joueurs d’un token |
| Joueur | Participant possédant une ville |
| Ville | Base individuelle d’un joueur |
| Secteur | Zone occupable de la world map 2D |
| Secteur neutre | Secteur sans faction contrôleuse |
| Territoire principal | Premier secteur attribué à une faction |
| Territoire contrôlé | Secteur détenu par une faction |
| Cluster | Groupe naturel de secteurs proches |

## Actions territoriales

| Terme | Définition |
| --- | --- |
| Colonisation | Prise d’un secteur libre via convoi de colonisation |
| Capture | Prise d’une ville occupée après siège réussi |
| Perte | Ville ou secteur repris par l’ennemi |
| Projection militaire | Capacité à attaquer/renforcer des secteurs éloignés |
| Déplacement | Temps de trajet entre deux secteurs |

## Gouvernance

| Terme | Définition |
| --- | --- |
| Conseil | Organe élu de 5 membres |
| Gouverneur | Porte-parole institutionnel de faction |
| Général | Responsable opérationnel militaire collectif |
| Diplomate | Responsable des traités et négociations |
| Score de contribution | Indicateur public des efforts d’un joueur |

# Ressources

| Ressource | Champ DB | Type | Usage principal |
| --- | --- | --- | --- |
| Ore | ore | Base | Construction légère, unités de base |
| Stone | stone | Base | Construction lourde, défenses |
| Iron | iron | Base avancée | Unités avancées, espionnage |
| Shards | shards | Premium | Confort, accélération, personnalisation |
| Signal de faction | signal | Collective | Progression macro de faction |

## Production continue

Modèle en temps réel continu (claim-on-access) :

- `ressources_gagnees = heures_ecoulees × production_horaire × multiplicateur_holding`
- `nouveau_stock = min(stock_actuel + ressources_gagnees, storage_cap)`

## Storage cap

Le storage cap limite l’accumulation passive. Si le cap est atteint, la production cesse jusqu’à dépense.

| Ressource | Cap de base | Extension |
| --- | --- | --- |
| Ore | 500 | Entrepôt |
| Stone | 300 | Entrepôt |
| Iron | 200 | Entrepôt |
| Shards | 100 | Shard Vault |

## Multiplicateur de holding

| Percentile holder | Multiplicateur |
| --- | --- |
| 0–60% | 1.0x |
| 60–90% | 1.5x |
| 90–99% | 2.0x |
| Top 1% | 3.0x |

## Signal de faction

Le Signal de faction est collectif, jamais individuel.

Formule cible :

`Signal/heure = (donnees_onchain × coef_a) + (joueurs_actifs_7j × coef_b)`

Usage : déblocage des branches collectives (Économie / Militaire / Diplomatie).

# Règle transactionnelle critique

Pour toute mutation de ressources :

- Relecture en transaction serializable
- `Math.min(current + delta, cap)` pour les gains
- `Math.max(0, current - cost)` pour les dépenses
- Jamais d’incrément/décrément aveugle côté ORM
