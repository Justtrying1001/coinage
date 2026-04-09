**COINAGE**

**Gameplay Macro**

*Niveaux de Territoire • Gouvernance • Secteurs Neutres • Alliances • Diplomatie*

DOC 04 — MACRO

Version 2.2 — Avril 2026

# Vue d'ensemble — Macro vs Micro

| Dimension | Micro | Macro |
| --- | --- | --- |
| Échelle | Un joueur, une ville | Une faction entière, une alliance |
| Décisions | Construction, troupes, raids | Technologies collectives, guerres, diplomatie |
| Gouvernance | Individuelle | Conseil élu |
| Ressources | Ore, Stone, Iron, Shards | Signal et Trésor de faction |
| Temporalité | Quotidienne | Hebdo à mensuelle |

# Niveaux de Territoire — 3 branches

Les niveaux de territoire sont une progression collective sans bâtiment physique dédié. Les effets s'appliquent à tous les joueurs contributeurs de la faction.

## Financement

| Source | Description |
| --- | --- |
| Signal de faction | Données on-chain + activité joueurs |
| Contributions | Ore/Stone/Iron versés au trésor |
| Trésor de faction | Pool collectif géré par le Conseil |

Une seule branche progresse à la fois.

## Branche Économique — 20 paliers

Paliers centrés sur production, storage cap, coûts de construction/formation/recherche.

## Branche Militaire — 20 paliers

Paliers centrés sur attaque/défense individuelles et collectives, mobilisation, vitesse en guerre, déblocage conquête 75%.

## Branche Diplomatique — 20 paliers

Paliers centrés sur slots du territoire principal, pactes, alliances, traités, reddition, analyse de faction.

# Gouvernance de faction

## Conseil

| Propriété | Valeur |
| --- | --- |
| Membres | 5 élus |
| Vote | 1 joueur = 1 voix |
| Mandat | Permanent tant qu'actif |
| Perte siège | Inactivité >7 jours, démission, expulsion unanime des 4 autres |

## Rôles

| Rôle | Responsabilité |
| --- | --- |
| Gouverneur | Représentation officielle, propose la guerre |
| Général | Direction armée collective en guerre |
| Diplomate | Pactes, alliances, traités, redditions |

## Décisions clés

| Décision | Validation |
| --- | --- |
| Dépense trésor | Majorité Conseil (3/5) |
| Nommer/révoquer Général ou Diplomate | Majorité Conseil (3/5) |
| Déclarer guerre | Gouverneur + vote 25% joueurs actifs/24h |
| Accepter paix ou reddition | Conseil (3/5) + vote 50% joueurs actifs |
| Priorité branche | Majorité Conseil (3/5) |

# Secteurs neutres et territoires contrôlés

## Génération monde

Tous les secteurs sont générés à partir de `WORLD_SEED` et démarrent neutres.

## Secteur neutre

| Propriété | Valeur |
| --- | --- |
| Slots | 50 à 300 selon seed |
| Gouvernance | Aucune |
| PvP | Permanent |
| Colonisation | Slot libre via convoi de colonisation |
| Multi-slots | Autorisé |

## Attribution territoire principal

Premier joueur d'un token :

1. attribution d'un secteur neutre
2. ce secteur devient territoire principal
3. ville du joueur créée
4. protection hors guerre officielle

## Passage en territoire contrôlé

Un secteur neutre devient territoire contrôlé quand tous ses slots sont détenus par la même faction.

## Perte du statut contrôlé

Si un slot est repris par une autre faction en guerre officielle, le secteur redevient neutre immédiatement.

# Alliances

| Propriété | Valeur |
| --- | --- |
| Prérequis | Branche Diplomatique palier dédié pour les deux factions |
| Maximum | 3 factions |
| Durée minimale | 7 jours |
| Visibilité | Publique par défaut, secrète si palier adéquat |

## Effets

- non-agression totale
- coordination militaire
- visibilité partagée des mouvements entrants

## Rupture

| Type | Effet |
| --- | --- |
| Rupture normale | Notification + délai de 48h avant guerre entre ex-alliées |
| Trahison en guerre | Malus temporaire, annulable à haut palier diplomatique |

# Diplomatie

Actions : pactes, guerre officielle, traités de paix, alliances, accords secrets, analyse de faction, reddition conditionnelle.
