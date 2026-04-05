**COINAGE**

**Game Design Document — Master**

*Document de référence complet*

VERSION 1.0 — CONFIDENTIEL

Game Design Document — Version 1.0

# Vision

Coinage est un MMO de stratégie persistant où chaque token crypto est une planète et chaque holder est un joueur. Les communautés s'affrontent pour dominer une galaxie.

| **Propriété** | **Valeur** |
| --- | --- |
| Genre | MMO Stratégie persistant — inspiré de Grepolis / OGame |
| Monde initial | Solana — tous les tokens SPL |
| Extension future | Ethereum, Base, Sui, et autres blockchains si le concept prend |
| Concept core | 1 token = 1 planète mère. 1 holder = 1 joueur sur cette planète. Toutes les planètes sont neutres au départ — une planète devient la planète mère d'un token quand le premier joueur de ce token y est assigné. |
| Pitch | "A persistent strategy game where crypto communities become factions and fight for control of a shared galaxy." |

# Index des documents

| **Document** | **Contenu** | **Couche** |
| --- | --- | --- |
| 01 — Lexique & Ressources | Terminologie officielle, Ore/Stone/Iron/Shards/Signal, production, storage cap, pillage | Fondation |
| 02 — Bâtiments & Construction | HQ, catalogue complet des bâtiments, queue de construction, prestige, gouvernance | Micro |
| 03 — Gameplay Micro | Population, Économie, Militaire, Espionnage, Recherche, Trading | Micro |
| 04 — Gameplay Macro | Niveaux de Planète, Gouvernance, Planètes Neutres, Alliances, Diplomatie | Macro |
| 05 — GDD Master (ce document) | Vue d'ensemble complète, règles fondamentales, points en suspens | Global |

# Règles fondamentales

## Accès au jeu

| **Règle** | **Détail** |
| --- | --- |
| Holder obligatoire | Être holder du token est obligatoire pour avoir une ville sur sa planète. Snapshot quotidien. |
| Perte de ville | Si tu n'es plus holder au snapshot → ta ville est perdue définitivement. |
| Multi-token | 3 à 5 tokens simultanément maximum. |
| Conflit d'intérêt | Si deux tokens que tu holds entrent en guerre : choix de camp obligatoire dans les 12h. Passé ce délai, assignation automatique à ta planète principale. |
| Slots planète mère | 100 slots de base → extensible jusqu'à 1 500 via Branche Diplomatique. 1 slot = 1 holder. |
| Slots planète neutre | 50 à 300 slots aléatoires. Un joueur peut avoir plusieurs slots. |

## Multiplicateur de holding

Influe uniquement sur la vitesse de production passive. Courbe logarithmique par percentile dans la distribution du token.

| **Percentile** | **Multiplicateur** |
| --- | --- |
| Bottom 60% | 1.0x |
| 60–90% | 1.5x |
| Top 10% | 2.0x |
| Top 1% (plafond absolu) | 3.0x |

## Carte du monde

| **Propriété** | **Valeur** |
| --- | --- |
| Structure | Toutes les planètes sur une carte ouverte unique — pas de secteurs artificiels |
| Génération | Toutes les planètes sont générées depuis WORLD_SEED au lancement du serveur. Toutes démarrent neutres. |
| Positionnement | Aléatoire au lancement. La géographie détermine les ennemis naturels. |
| Attribution token | Quand le premier joueur d'un token rejoint le jeu → il est assigné à une planète neutre disponible → cette planète devient la planète mère de ce token. |
| Équilibre | La position détermine les menaces naturelles, pas la taille du token |

# Architecture du jeu — Micro vs Macro

## Niveau 1 — La ville individuelle (Micro)

Le gameplay quotidien. Chaque joueur gère sa ville en autonomie complète.

| **Système** | **Description** | **Doc référence** |
| --- | --- | --- |
| Ressources | Ore, Stone, Iron, Shards. Production continue. Storage cap. | 01 |
| Bâtiments | HQ gouverne les déblocages. 20 niveaux max. 1 bâtiment de chaque type. | 02 |
| Population | Partagée entre bâtiments et troupes. Housing Complex = seule source. | 03 |
| Économie | Production temps réel continu (modèle Grepolis). Pas de tick model. | 03 |
| Militaire | 3 types d'attaque, 2 phases de combat, 9 unités + Vaisseau colo. | 03 |
| Espionnage | Vault d'Iron, 5 niveaux de mission, contre-espionnage passif/actif. | 03 |
| Recherche | RC comme budget. 6 branches × 5 tiers. Spécialisation forcée. | 03 |
| Trading | Marché régional, distance/temps de trajet, marché système. | 03 |

## Niveau 2 — La planète collective (Macro)

Le gameplay social. Tous les joueurs d'un token forment une faction.

| **Système** | **Description** | **Doc référence** |
| --- | --- | --- |
| Signal | Ressource on-chain + activité joueurs. Planétaire — jamais individuelle. | 04 |
| Niveaux de planète | 3 branches × 20 paliers. Économique, Militaire, Diplomatique. | 04 |
| Trésor planétaire | Pool collectif alimenté par contributions volontaires. Géré par le Conseil. | 04 |
| Gouvernance | Conseil 5 membres élus. 3 rôles (Gouverneur, Général, Diplomate). | 04 |
| Armée collective | Pool de troupes contribuées. Dirigé par le Général en guerre. | 04 |

## Niveau 3 — Le monde (Macro)

Le gameplay macro. Les planètes interagissent entre elles.

| **Système** | **Description** | **Doc référence** |
| --- | --- | --- |
| Planètes neutres | PvP permanent, colonisables, peuvent devenir planètes secondaires. | 04 |
| Alliances | Max 3 planètes. Non-agression totale. Coordination militaire. | 04 |
| Diplomatie | Pactes, guerres officielles, traités de paix, reddition. | 04 |
| Guerres officielles | Déclenchées par vote. Fin par traité ou règle 75%. Pool collectif + raids individuels. | 04 |

# Monétisation

| **Type** | **Description** | **P2W ?** |
| --- | --- | --- |
| Shards (premium) | Packages achetables. Accélèrent timers, débloquent slots de tokens, cosmétiques. | Non — avance plus vite, pas plus fort |
| Queue de construction premium | 5 slots au lieu de 2. Achetés via Shards pour durée limitée. | Confort uniquement |
| Cosmétiques | Skins de ville, skins de planète. Aucun impact gameplay. | Non |
| Slots de tokens | 3 tokens max par défaut. Achetable jusqu'à 5 via Shards. | Légèrement — surface de jeu |

**Règle absolue : zéro achat de ressources de base, troupes ou technologies directement.**

## Saisons & End Game

| **Propriété** | **Valeur** |
| --- | --- |
| Durée | À définir — probablement ~3 mois |
| Condition de victoire planète | Capturer 75% des villes d'une planète ennemie spécifique (pas de l'ensemble) |
| Condition de victoire monde | Dominer le classement global en fin de saison |
| Prize pool | % fixe des revenus de la saison redistribué aux top planètes et top joueurs |
| Détails prize pool | À définir — cadre légal à vérifier selon les juridictions |

# Points en suspens — À définir ultérieurement

## Balancing (à traiter au moment du build)

- Formules exactes de production par niveau de bâtiment

- Coûts de construction de chaque bâtiment par niveau

- Temps de construction par niveau

- Coûts des unités militaires (Ore, Stone, Iron)

- Temps de formation des unités par niveau de bâtiment

- Calcul exact du multiplicateur de holding

- Coûts en Signal et ressources de chaque palier de branche planétaire

- Coefficient exact du Signal on-chain vs joueurs actifs

- Cap de population par niveau de Housing Complex

- Plafond absolu de slots par planète

- Coût des Shards pour la queue de construction premium

## Mécaniques futures — documentées, non implémentées

| **Mécanique** | **Description** | **Statut** |
| --- | --- | --- |
| Faveur / Pouvoir divin | Ressource spéciale non stockable produite par un bâtiment dédié. Utilisée pour des pouvoirs actifs temporaires (bonus de production, protection, buff militaire). Thème à adapter à l'univers Coinage. | À concevoir |
| Outposts abandonnés | Équivalent des Farming Villages de Grepolis. Outposts NPC sur planètes neutres, contrôlables pour un revenu passif supplémentaire. Ajoute une couche PvE. | À concevoir |
| Espionnage macro | Analyse planétaire débloquée au niveau 10 du Centre d'espionnage + Branche Diplomatique palier 10. Révèle le trésor planétaire, les technologies et l'armée collective d'une planète ennemie. | À intégrer dans la doc Macro |
| Guerres officielles — séquence complète | Déclaration → Mobilisation → Conflit (sans timer fixe) → Résolution → Post-guerre. Armée collective vs raids individuels. | À documenter |
| End game & saisons | Conditions de victoire globale, classement, prize pool, reset. | À documenter |
| Design system | Identité visuelle, palette de couleurs, typographie, composants UI, direction artistique. | À documenter après game design |
| Stack technique & Schema DB | Architecture Next.js, Prisma schema complet, API surface, pipeline on-chain Solana. | À documenter après game design |

# Séquence de build recommandée

Ordre logique pour implémenter Coinage en partant de la base GitCities :

| **Phase** | **Systèmes à implémenter** | **Priorité** |
| --- | --- | --- |
| Phase 1 — Fondation | Auth wallet (Phantom/Solana), DB schema de base (City, Planet, User), ressources + storage cap, HQ + bâtiments économiques, production continue | Critique |
| Phase 2 — Ville individuelle | Population, bâtiments militaires, formation de troupes, bâtiments de recherche + RC, bâtiments prestige | Haute |
| Phase 3 — Monde | Carte monde avec planètes tokens, planètes neutres, colonisation (Vaisseau) | Haute |
| Phase 4 — Combat | Système de combat 3 types, raids, sièges, distance/temps de trajet, anti-bully | Haute |
| Phase 5 — Espionnage & Trading | Cave/vault d'Iron, missions d'espionnage, marché avec routes de transfert | Moyenne |
| Phase 6 — Macro | Signal on-chain, 3 branches planétaires, Conseil de Gouverneurs, trésor planétaire | Moyenne |
| Phase 7 — Guerres officielles | Déclaration, armée collective, mobilisation, traités de paix, règle 75% | Moyenne |
| Phase 8 — Alliances & Diplomatie | Formation d'alliances, pactes, diplomatie secrète, reddition | Basse |
| Phase 9 — End game | Saisons, classement, prize pool | Basse |