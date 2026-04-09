**COINAGE**

**Gameplay Micro**

*Population • Économie • Combat • Espionnage • Recherche • Trading*

Version 2.0 — Avril 2026

# Population

La population alimente à la fois :

- les bâtiments
- les unités vivantes

Tension centrale : plus tu investis en infrastructures, moins tu peux maintenir d’unités (et inversement).

## Source

Housing Complex = source principale du cap de population.

## Spécialisations de ville

| Type | Focus |
| --- | --- |
| Ville économique | Production et stockage |
| Ville offensive | Projection et pression inter-secteur |
| Ville défensive | Résistance locale |
| Ville recherche | RC et technologies |
| Ville colonisation | Déploiement de convois |

# Économie

- Production continue au fil du temps
- Aucun tick serveur obligatoire
- Réévaluation au login ou à l’action
- Storage cap comme limite naturelle

Protections de base :

- Protection nouveau joueur (7 jours, levée en cas d’attaque initiée)
- Protection post-raid (12h contre le même attaquant)

# Combat micro

## Types d’attaque

- Cinétique
- Énergétique
- Plasma

## Phases de combat

1. Phase mobile : unités de projection et d’interception
2. Phase terrestre : affrontement principal sur cible

## Familles d’unités

| Famille | Rôle |
| --- | --- |
| Ligne | Tenue, défense, attrition |
| Assaut | Percée et dégâts directs |
| Projection | Déploiement rapide inter-secteur |
| Colonisation | Prise de secteur libre (convoi) |

## Déplacement

Le temps dépend de la distance inter-secteur et de l’unité la plus lente du groupe.

`temps_trajet = distance × (1 / vitesse_unite_plus_lente)`

# Actions militaires

| Action | Description |
| --- | --- |
| Raid | Pillage ciblé d’une ville ennemie |
| Siège | Capture d’une ville occupée |
| Colonisation | Installation sur secteur libre via convoi |
| Renfort | Défense d’un territoire allié |

## Séquence de siège

1. Nettoyage des défenses
2. Fenêtre d’instabilité (12h)
3. Arrivée du convoi de colonisation
4. Validation de capture

# Règle de chute territoriale (75%)

Quand une faction perd 75% des villes d’un territoire ciblé face à une même faction ennemie, ce territoire bascule.

# Espionnage

## Principe

Le vault d’Iron finance les missions.

| Mission | Effet |
| --- | --- |
| Reconnaissance | Données militaires essentielles |
| Infiltration | Vue étendue (unités, bâtiments, ressources) |
| Surveillance | Suivi des mouvements entrants/sortants |
| Sabotage | Retard de production ou de formation |

## Résolution

Succès si l’investissement d’Iron attaquant dépasse la défense adverse.

# Recherche individuelle

RC (Research Capacity) = budget limité qui force des choix.

Axes recommandés :

- Économie
- Défense
- Assaut
- Vitesse
- Espionnage
- Logistique

# Trading

Le Marché permet :

- échanges directs
- routes planifiées
- assistance intra-faction

Le coût logistique dépend de la distance inter-secteur.
