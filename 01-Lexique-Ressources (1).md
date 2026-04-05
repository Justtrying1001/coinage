**COINAGE**

**Lexique ****&**** Ressources**

*Terminologie officielle et système de ressources*

DOC 01 — MICRO

Game Design Document — Version 1.0

# Lexique officiel

Ce lexique définit les termes utilisés dans l'ensemble de la documentation de Coinage. Tout le monde doit utiliser ces termes pour éviter les confusions.

## Entités de jeu

| **Terme** | **Définition** |
| --- | --- |
| Joueur | Un individu avec une ville sur une planète |
| Ville | L'entité individuelle d'un joueur sur une planète. Une ville par slot. |
| Slot | Emplacement disponible pour une ville sur une planète |
| Planète | Un token crypto (ex. Planète SOL = token Solana). Désigne le token ET la communauté qui le joue |
| Planète mère | Une planète neutre qui est devenue la planète officielle d'un token. Cela se produit quand le premier joueur de ce token est assigné à cette planète. Intouchable hors guerre officielle. |
| Planète neutre | Toutes les planètes démarrent neutres — générées depuis WORLD_SEED au lancement du serveur. Une planète neutre sans token assigné est colonisable par tous les joueurs. PvP permanent. |
| Planète secondaire | Planète neutre dont tous les slots sont contrôlés par les joueurs d'une même planète, lui conférant les droits d'une planète mère |
| Fondateur | Premier joueur à avoir créé une planète. Badge permanent visible sur son profil et sur la page de la planète. Joue sur planète neutre pendant la période PENDING. |
| Planète en attente | Planète créée mais pas encore activée — statut PENDING. Invisible sur la carte monde. En attente d'atteindre le seuil d'activation de 5 joueurs. |
| Seuil d'activation | Nombre de joueurs requis pour qu'une planète PENDING devienne ACTIVE et apparaisse sur la carte monde. Fixé à 5 joueurs. Pas de limite de temps. |
| Faction | Synonyme de planète — l'ensemble des joueurs d'un même token |
| Alliance | Coalition formelle entre plusieurs planètes (max 3 planètes mères) |

## Termes militaires

| **Terme** | **Définition** |
| --- | --- |
| Raid | Attaque individuelle d'un joueur contre une ville ennemie pour piller des ressources |
| Siège | Attaque visant à capturer une ville ennemie via un Vaisseau de colonisation |
| Colonisation | Envoi d'un Vaisseau de colonisation vers un slot LIBRE sur une planète neutre. Aucun combat. |
| Guerre officielle | Conflit formel déclaré entre deux planètes ou alliances |
| Armée collective | Pool de troupes contribuées volontairement par les joueurs d'une planète |
| Vague | Un groupe d'unités envoyées ensemble dans une même attaque |
| Escorte | Unités aériennes protégeant un Vaisseau de colonisation ou un Transporteur |
| Instabilité | Période de 12h après une victoire de siège pendant laquelle la ville peut être colonisée |

## Ressources

| **Terme** | **Définition** |
| --- | --- |
| Ore | Ressource de base la plus commune. Champ DB : ore |
| Stone | Ressource intermédiaire. Champ DB : stone |
| Iron | Ressource avancée et monnaie d'espionnage. Champ DB : iron |
| Shards | Ressource premium achetable. Champ DB : shards |
| Signal | Ressource planétaire collective générée par les données on-chain + activité joueurs |
| Trésor planétaire | Pool collectif de ressources alimenté par les contributions volontaires des joueurs |
| Vault d'Iron | Stock d'Iron séparé de l'Entrepôt, dédié à l'espionnage. Géré par le Centre d'espionnage |
| Storage cap | Plafond de stockage maximum pour une ressource dans une ville |
| RC | Research Capacity — budget de recherche individuel généré par le Laboratoire de recherche |

## Termes de gouvernance

| **Terme** | **Définition** |
| --- | --- |
| Conseil | Les 5 membres élus qui gouvernent une planète |
| Gouverneur | Membre du Conseil le plus ancien. Rôle symbolique — propose mais ne décide pas seul |
| Général | Membre du Conseil nommé pour diriger l'armée collective en guerre |
| Diplomate | Membre du Conseil nommé pour gérer les relations inter-planètes |
| Council Chamber | Bâtiment requis pour participer à la gouvernance planétaire |
| Score de contribution | Score public reflétant les ressources et troupes contribuées au collectif |

# Ressources

Coinage utilise 5 ressources distinctes — 3 ressources de base, 1 ressource premium et 1 ressource planétaire collective.

## Vue d'ensemble

| **Ressource** | **Champ DB** | **Type** | **Produite par** | **Usage principal** |
| --- | --- | --- | --- | --- |
| Ore | ore | Base — commune | Mine | Construction légère, unités basiques |
| Stone | stone | Base — intermédiaire | Carrière | Construction lourde, fortifications |
| Iron | iron | Base — avancée + espionnage | Raffinerie | Unités avancées, bâtiments T3-T4, vault d'espionnage |
| Shards | shards | Premium | Achat, guerres, événements | Timers, slots supplémentaires, cosmétiques |
| Signal | N/A (planétaire) | Collective on-chain | Automatique | Technologies planétaires collectives uniquement |

## Modèle de production — temps réel continu

Coinage utilise un modèle de production identique à Grepolis : les ressources s'accumulent en continu à un taux horaire. Pas de tick model.

**Formule de calcul à chaque accès à la ville :**

ressources_gagnées = heures_écoulées × production_horaire × multiplicateur_holding

nouveau_stock = Math.min(stock_actuel + ressources_gagnées, storage_cap)

La ville stocke un lastUpdatedAt timestamp. À chaque accès, le système calcule le temps écoulé et crédite les ressources accumulées, plafonnées par le storage cap. Aucun background job nécessaire.

## Storage cap

Le storage cap est le seul plafond sur les ressources de base. Si le stock est plein, la production s'arrête — les ressources au-delà du cap sont perdues. Cela crée l'incitation naturelle à se connecter régulièrement pour dépenser.

**Caps de base (sans Entrepôt) :**

| **Ressource** | **Cap de base** | **Extensible par** |
| --- | --- | --- |
| Ore | 500 | Entrepôt |
| Stone | 300 | Entrepôt |
| Iron | 200 | Entrepôt |
| Shards | 100 | Shard Vault |
| Iron vault (espionnage) | Selon niveau Centre d'espionnage | Centre d'espionnage |

## Bâtiments producteurs

| **Bâtiment** | **Ressource** | **Formule indicative par heure** |
| --- | --- | --- |
| Mine | Ore | niveau × production_base_ore |
| Carrière | Stone | niveau × production_base_stone |
| Raffinerie | Iron | niveau × production_base_iron |

## Multiplicateur de holding

Le holding du token influe uniquement sur la vitesse de production passive des ressources de base. Courbe logarithmique par percentile dans la distribution du token — pas en valeur USD absolue.

*Être top 1% de Pepe = même bonus que top 1% de Solana.*

| **Percentile holder** | **Multiplicateur** |
| --- | --- |
| Bottom 60% | 1.0x |
| 60–90% | 1.5x |
| Top 10% | 2.0x |
| Top 1% (plafond absolu) | 3.0x |

## Sources de ressources

### Ore, Stone, Iron

| **Source** | **Type** | **Détail** |
| --- | --- | --- |
| Bâtiments de production | Passif — continu | Source principale. Mine, Carrière, Raffinerie. Multiplicateur de holding appliqué. |
| Pillage / Raid | Actif | Attaque réussie sur une ville ennemie. Caps de loot appliqués. |
| Récompenses de guerre | Actif | Guerre officielle gagnée. Distribué proportionnellement aux contributeurs. |

### Shards

| **Source** | **Type** | **Détail** |
| --- | --- | --- |
| Récompenses de guerre | Actif rare | Petite quantité dans les récompenses de guerre officielles gagnées |
| Événements saisonniers | Événement | Distribués lors des events de fin de saison |
| Achat direct | Monétisation | Packages achetables — cœur de la monétisation |

## Le Signal — ressource planétaire collective

Le Signal est une ressource exclusivement planétaire. Elle n'appartient à aucun joueur individuellement — elle appartient à la planète entière. Elle s'accumule dans le trésor planétaire.

**Formule de génération :**

Signal/heure = (données_on_chain × coef) + (joueurs_actifs_7j × coef)

| **Composante** | **Source** | **Calcul** |
| --- | --- | --- |
| Données on-chain | Volume transactions hebdo + % wallets actifs 30j | Normalisé par capita de joueurs actifs |
| Activité joueurs | Nombre de joueurs actifs dans les 7 derniers jours | Coefficient fixe × joueurs actifs 7j |

Le Signal est utilisé exclusivement pour débloquer et upgrader les paliers des 3 branches technologiques planétaires (Économique, Militaire, Diplomatique). Il ne peut pas être pillé, transféré ou stocké individuellement.

## Pillage — règles

10% du storage cap de l'Entrepôt est toujours protégé du pillage (identique à Grepolis). Les Shards ne peuvent jamais être pillés.

Ressources_protégées = 10% du storage_cap de l'Entrepôt

Ressources_exposées = max(0, stock_actuel - ressources_protégées)

Loot = ressources_exposées × efficacité_raid × résultat_combat

| **Ressource** | **Cap de loot max par raid** |
| --- | --- |
| Ore | 10% du stock exposé |
| Stone | 8% du stock exposé |
| Iron | 6% du stock exposé |
| Shards | Jamais pillables |

## Pattern de transaction — règle critique

Toutes les mutations de ressources suivent ce pattern sans exception :

• Re-read des valeurs dans une $transaction serializable

• Math.min(current + delta, cap) pour les gains

• Math.max(0, current - cost) pour les dépenses

• Jamais { increment: } / { decrement: } Prisma pour les ressources