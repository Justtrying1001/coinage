**COINAGE**

**Bâtiments ****&**** Construction**

*Catalogue complet des bâtiments individuels*

DOC 02 — MICRO

Game Design Document — Version 1.0

# Règles générales

| **Règle** | **Détail** |
| --- | --- |
| Slots | Nombre fixe de slots par ville — même terrain pour tous les joueurs |
| Unicité | Un seul bâtiment de chaque type par ville |
| Niveaux max | Tous les bâtiments vont jusqu'au niveau 20, sauf les bâtiments prestige (niveau 1 unique) |
| Coût | Déduit au lancement de la construction, pas à la complétion |
| Annulation | Construction non annulable — pas de remboursement |
| Prérequis | Chaque bâtiment a un niveau de HQ requis et ses propres prérequis |
| Queue F2P | 2 slots de construction simultanés |
| Queue Premium | Jusqu'à 5 slots simultanés — achetés via Shards pour une durée limitée |

## Queue de construction — Premium

| **Slots** | **Coût en Shards** | **Durée** |
| --- | --- | --- |
| 2 → 3 slots | À définir au balancing | À définir |
| 3 → 4 slots | À définir au balancing | À définir |
| 4 → 5 slots | À définir au balancing | À définir |

# HQ — Headquarters

Le bâtiment central de chaque ville. Son niveau gouverne l'accès à tous les autres bâtiments. 20 niveaux maximum. Unique et non déplaçable.

| **Niveau HQ** | **Bâtiments débloqués** |
| --- | --- |
| 1 | Mine, Carrière, Entrepôt, Caserne, Housing Complex |
| 3 | Raffinerie, Mur défensif |
| 5 | Forge de combat, Tour de guet |
| 7 | Laboratoire de recherche, Marché, Council Chamber |
| 10 | Dock spatial, Shard Vault |
| 12 | Centre d'espionnage |
| 15 | Académie militaire |
| 18 | Usine d'armement |
| 20 | Bâtiments prestige débloqués |

# Catalogue — Économie

## Mine

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | mine |
| HQ requis | 1 |
| Niveaux max | 20 |
| Prérequis | Aucun |
| Rôle | Production passive d'Ore par heure |
| Effet | Production d'Ore augmente à chaque niveau. Le multiplicateur de holding s'applique |

## Carrière

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | quarry |
| HQ requis | 1 |
| Niveaux max | 20 |
| Prérequis | Aucun |
| Rôle | Production passive de Stone par heure |
| Effet | Production de Stone augmente à chaque niveau |

## Raffinerie

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | refinery |
| HQ requis | 3 |
| Niveaux max | 20 |
| Prérequis | Mine niveau 5 |
| Rôle | Production passive d'Iron par heure |
| Effet | Production d'Iron augmente à chaque niveau |

## Entrepôt

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | warehouse |
| HQ requis | 1 |
| Niveaux max | 20 |
| Prérequis | Aucun |
| Rôle | Augmente le storage cap de toutes les ressources de base |
| Effet | Chaque niveau augmente les caps d'Ore, Stone, Iron. Priorité absolue en début de jeu. 10% du storage cap toujours protégé du pillage |
| Population | Ne consomme pas de population |

## Shard Vault

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | shard_vault |
| HQ requis | 10 |
| Niveaux max | 20 |
| Prérequis | Entrepôt niveau 7 |
| Rôle | Augmente le storage cap des Shards |
| Effet | Chaque niveau augmente le cap de Shards |

## Housing Complex

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | housing |
| HQ requis | 1 |
| Niveaux max | 20 |
| Prérequis | Aucun |
| Rôle | Augmente le cap de population total de la ville |
| Effet | Chaque niveau augmente significativement le cap de population disponible. Priorité absolue — sans population tu ne peux ni construire ni entraîner de troupes |
| Population | Ne consomme pas de population |

## Marché

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | market |
| HQ requis | 7 |
| Niveaux max | 20 |
| Prérequis | Entrepôt niveau 5 |
| Rôle | Échanges de ressources avec d'autres joueurs et inter-villes |
| Effet | Débloque le système de trading. Chaque niveau augmente la capacité de trade (Cargo Units) et le nombre de routes simultanées |

# Catalogue — Militaire

## Caserne

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | barracks |
| HQ requis | 1 |
| Niveaux max | 20 |
| Prérequis | Aucun |
| Rôle | Formation des unités terrestres tier 1 |
| Effet | Débloque et accélère la formation des unités terrestres. Chaque niveau réduit le temps de formation et débloque de nouvelles unités |

**Unités débloquées par niveau :**

| **Niveau** | **Unité débloquée** |
| --- | --- |
| 1 | Fantassin (unité terrestre de base) |
| 5 | Éclaireur (rapide, faible puissance) |
| 10 | Bouclier (tank défensif) |
| 15 | Cavalier (raid rapide, loot élevé) |
| 20 | — |

## Forge de combat

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | combat_forge |
| HQ requis | 5 |
| Niveaux max | 20 |
| Prérequis | Caserne niveau 8 |
| Rôle | Formation des unités terrestres avancées |
| Effet | Débloque les unités terrestres de tier 2 et 3. Chaque niveau réduit le temps de formation |

**Unités débloquées par niveau :**

| **Niveau** | **Unité débloquée** |
| --- | --- |
| 1 | Assaillant (attaque équilibrée) |
| 8 | Briseur (anti-fortification) |
| 15 | — |
| 20 | — |

## Dock spatial

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | space_dock |
| HQ requis | 10 |
| Niveaux max | 20 |
| Prérequis | Forge de combat niveau 5 |
| Rôle | Construction et déploiement des unités aériennes |
| Effet | Débloque les unités aériennes. Chaque niveau augmente la capacité de flotte et réduit les temps de construction |

**Unités débloquées par niveau :**

| **Niveau** | **Unité débloquée** |
| --- | --- |
| 1 | Intercepteur (défense aérienne) |
| 5 | Chasseur léger (offensif aérien) |
| 10 | Transporteur (transport troupes) |
| 15 | Bombardier (anti-structure) |
| 20 | Vaisseau de colonisation |

## Académie militaire

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | military_academy |
| HQ requis | 7 |
| Niveaux max | 20 |
| Prérequis | Caserne niveau 10, Forge de combat niveau 8 |
| Rôle | Améliore les stats permanentes des unités |
| Effet | Chaque niveau débloque des améliorations permanentes (attaque, défense, vitesse) |

**Améliorations par niveau :**

| **Niveau** | **Amélioration** |
| --- | --- |
| 1 | +2% attaque toutes unités |
| 5 | +5% défense toutes unités |
| 10 | +5% vitesse de déplacement |
| 15 | +10% attaque toutes unités |
| 20 | +10% défense toutes unités |

## Mur défensif

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | wall |
| HQ requis | 3 |
| Niveaux max | 20 |
| Prérequis | Aucun |
| Rôle | Défense passive de la ville |
| Effet | Augmente la puissance défensive de toutes les unités en défense. Entre dans le calcul du GroundDefensePower. Peut être réduit par les Briseurs ennemis |

## Tour de guet

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | watchtower |
| HQ requis | 5 |
| Niveaux max | 20 |
| Prérequis | Mur défensif niveau 3 |
| Rôle | Détection des mouvements ennemis |
| Effet | Chaque niveau augmente la portée de détection des troupes ennemies. Donne un préavis avant une attaque entrante |

## Usine d'armement

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | armory |
| HQ requis | 18 |
| Niveaux max | 20 |
| Prérequis | Forge de combat niveau 15, Académie militaire niveau 10 |
| Rôle | Production d'équipements spéciaux pour les unités |
| Effet | Chaque niveau débloque des équipements qui améliorent les stats de certaines unités spécifiques |

# Catalogue — Espionnage

## Centre d'espionnage

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | spy_center |
| HQ requis | 12 |
| Niveaux max | 20 |
| Prérequis | Tour de guet niveau 5 |
| Rôle | Gestion du vault d'Iron et des missions d'espionnage |
| Effet niveau vault | Capacité du vault d'Iron augmente avec le niveau. Au niveau 20 : vault illimité |
| Effet missions | Débloque progressivement des missions de niveau supérieur par paliers de niveau |

**Missions débloquées par niveau :**

| **Niveau** | **Mission** | **Description** |
| --- | --- | --- |
| 1 | Reconnaissance | Rapport basique : troupes présentes |
| 5 | Infiltration | Rapport complet : troupes, bâtiments, ressources, vault |
| 10 | Surveillance | Agent en observation 12h — mouvements de troupes en temps réel |
| 15 | Sabotage | Perturbation active : ralentit construction, réduit production 15% pendant 12h |
| 20 | Opération fantôme | Reconnaissance + sabotage combinés, détection minimale |

# Catalogue — Recherche

## Laboratoire de recherche

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | research_lab |
| HQ requis | 7 |
| Niveaux max | 20 |
| Prérequis | Mine niveau 5, Carrière niveau 5 |
| Rôle | Recherche de technologies individuelles |
| Effet | Génère de la Research Capacity (RC) individuelle. Chaque niveau augmente le RC disponible (RC = 3 × niveau_laboratoire) et la vitesse de recherche |

# Catalogue — Gouvernance

## Council Chamber

| **Propriété** | **Valeur** |
| --- | --- |
| DB key | council_chamber |
| HQ requis | 7 |
| Niveaux | 1 (unique, pas de niveaux) |
| Prérequis | HQ niveau 7 |
| Slot | Slot séparé — ne compte pas dans les 2 slots prestige |
| Rôle | Participation à la gouvernance planétaire |
| Effet | Débloque le droit de vote pour l'élection du Conseil de Gouverneurs. Sans ce bâtiment, le joueur joue normalement mais ne peut pas voter ni se présenter. Rend visible le trésor planétaire et les statistiques de contribution. |

# Catalogue — Bâtiments prestige

Maximum 2 bâtiments prestige par ville. Deux groupes de 4 — un seul choix par groupe. Pas de niveaux. Construction unique, longue et coûteuse. Débloqués au niveau 20 du HQ.

## Groupe A — Économie & Support

*Choisis 1 parmi ces 4.*

| **Bâtiment** | **DB key** | **Prérequis** | **Effet** | **Équivalent Grepolis** |
| --- | --- | --- | --- | --- |
| Data Center | data_center | Labo recherche niv.10 | Augmente la RC individuelle. Reset gratuit d'une recherche 1×/saison | Library |
| Training Grounds | training_grounds | Caserne niv.8 | +10% cap de population — permet une armée plus grande. Choix par défaut des villes offensives. | Thermal Baths |
| Warp Beacon | warp_beacon | Dock spatial niv.5 | +20% vitesse de toutes les unités aériennes. Essentiel pour les villes spécialisées raids rapides. | Lighthouse |
| Trade Hub | trade_hub | Marché niv.8 | +50% capacité de trade (CU) et +10% storage cap sur toutes les ressources. | Merchant's Shop |

## Groupe B — Militaire & Stratégie

*Choisis 1 parmi ces 4.*

| **Bâtiment** | **DB key** | **Prérequis** | **Effet** | **Équivalent Grepolis** |
| --- | --- | --- | --- | --- |
| Defense Grid | defense_grid | Mur défensif niv.10 | +10% puissance défensive pour toutes les unités en défense. Empêche les unités de siège de cibler aléatoirement les bâtiments. | Tower |
| Réserve Stratégique | strategic_reserve | HQ niv.12 | +25% de ressources additionnellement protégées du pillage, en cumul avec la protection Entrepôt (10%). Transforme la ville en hub de stockage très difficile à raider. | Divine Statue |
| Surveillance Network | surveillance_network | Centre espionnage niv.8 | Détecte automatiquement TOUS les espions entrants, même réussis. L'ennemi sait que tu as ce bâtiment dès qu'il reçoit un rapport réussi sur ta ville. | Oracle |
| War Council | war_council | Académie militaire niv.8 | +10% puissance offensive pour toutes les unités terrestres et aériennes. Choix offensif par excellence. | War Council |