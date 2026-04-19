**COINAGE**

**Game Design Document — Master**

*Référence globale produit*

Version 2.0 — Avril 2026

# Vision

Coinage est un MMO de stratégie persistant où chaque token représente une faction, et chaque holder actif contrôle une ville.

Le monde est une **world map 2D sectorisée** :

- Environ 500 secteurs au lancement
- Aucun territoire attribué au démarrage
- Des espaces de déplacement entre les secteurs
- Des clusters naturels, sans grille rigide

Le système de jeu reste identique : expansion territoriale, guerre, diplomatie, gouvernance, saisons.

## Règles cœur

| Propriété | Règle |
| --- | --- |
| Token | 1 token = 1 faction |
| Joueur | 1 joueur = 1 ville |
| Monde | Persistant |
| Départ | Tous les secteurs sont neutres |
| Progression | Capture, colonisation, défense, pertes |

# Modèle canonique (obligatoire dans toute la doc)

| Terme canonique | Définition |
| --- | --- |
| Secteur | Zone territoriale sur la carte 2D |
| Secteur neutre | Secteur sans contrôle de faction |
| Territoire contesté (mixte) | Secteur avec présence de plusieurs factions |
| Territoire contrôlé | Secteur dont tous les slots sont unifiés sous une même faction |
| Territoire gouverné | Territoire contrôlé avec gouvernance active de la faction |
| Faction | Communauté de joueurs liée à un token |
| Déplacement | Trajet d’unités entre secteurs via zones vides |
| Unités | Forces militaires entraînées en ville |
| Colonisation | Prise d’un secteur libre via convoi |
| Projection militaire | Capacité à intervenir loin de sa base |

# État initial du monde

1. La carte est générée depuis `WORLD_SEED`.
2. Tous les secteurs démarrent en statut neutre.
3. Aucun token n’est présent au lancement.
4. Les premiers joueurs peuvent apparaître dans des secteurs déjà occupés par d’autres factions.
5. Un secteur devient contrôlé uniquement quand tous ses slots appartiennent à une seule faction.
6. La gouvernance territoriale ne s’active qu’après contrôle complet du secteur.

# Architecture gameplay

## Couche micro (ville)

Chaque joueur gère sa ville :

- Ressources (Ore, Stone, Iron, Shards)
- Bâtiments
- Population
- Entraînement d’unités
- Recherche individuelle
- Espionnage
- Trading

## Couche macro (faction)

Tous les joueurs d’un token coopèrent via :

- Signal de faction
- Trésor de faction
- Branches collectives (Économie / Militaire / Diplomatie)
- Conseil
- Armée collective

## Couche monde

Interactions entre factions :

- Conquête de secteurs
- Guerres officielles
- Traités et alliances
- Conditions de victoire de saison

# Conditions de victoire

| Niveau | Condition |
| --- | --- |
| Conflit local | Atteindre le seuil de contrôle (75%) sur le territoire ciblé |
| Saison | Dominer le classement global de fin de saison |
| Long terme | Accumuler titres, réputation et résultats historiques |

# Monétisation (non pay-to-win)

| Type | Usage |
| --- | --- |
| Shards | Accélérations, confort, personnalisation |
| Queue premium | Slots de construction supplémentaires |
| Cosmétiques | Identité visuelle de ville et faction |

Règle stricte : pas d’achat direct de puissance brute (ressources de base, unités, technologies).

# Référentiel documentaire

| Document | Objet |
| --- | --- |
| 01 | Lexique & Ressources |
| 02 | Bâtiments & Construction |
| 03 | Gameplay Micro |
| 04 | Gameplay Macro |
| 05 | Guerres & End Game |
| 06 | Stack Technique |
| 07 | Roadmap Build |
