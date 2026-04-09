**COINAGE**

**Bâtiments & Construction**

*Catalogue complet des bâtiments individuels*

DOC 02 — MICRO

Version 2.2 — Avril 2026

# Règles générales

| Règle | Détail |
| --- | --- |
| Slots | Nombre fixe de slots par ville |
| Unicité | Un seul bâtiment de chaque type par ville |
| Niveaux max | Niveau 20 pour tous les bâtiments standards |
| Coût | Déduit au lancement de la construction |
| Annulation | Non annulable |
| Prérequis | Niveau HQ + prérequis propres |
| Queue F2P | 2 slots simultanés |
| Queue Premium | Jusqu'à 5 slots via Shards |

## Queue Premium

| Slots | Coût Shards | Durée |
| --- | --- | --- |
| 2 → 3 | À équilibrer | À définir |
| 3 → 4 | À équilibrer | À définir |
| 4 → 5 | À équilibrer | À définir |

# HQ — Headquarters

| Niveau HQ | Bâtiments débloqués |
| --- | --- |
| 1 | Mine, Carrière, Entrepôt, Caserne, Housing Complex |
| 3 | Raffinerie, Mur défensif |
| 5 | Forge de combat, Tour de guet |
| 7 | Laboratoire de recherche, Marché, Council Chamber |
| 10 | Hub de déploiement, Shard Vault |
| 12 | Centre d'espionnage |
| 15 | Académie militaire |
| 18 | Usine d'armement |
| 20 | Bâtiments prestige |

# Catalogue — Économie

## Mine
Production passive d'Ore.

## Carrière
Production passive de Stone.

## Raffinerie
Production passive d'Iron.

## Entrepôt
Augmente le storage cap d'Ore/Stone/Iron. 10% du cap reste protégé du pillage.

## Shard Vault
Augmente le cap de Shards.

## Housing Complex
Augmente le cap de population total.

## Marché
Trading inter-villes, capacité logistique et routes simultanées.

# Catalogue — Militaire

## Caserne

| Propriété | Valeur |
| --- | --- |
| DB key | barracks |
| HQ requis | 1 |
| Niveaux max | 20 |
| Rôle | Formation unités de ligne tier 1 |

**Déblocages Caserne :**

| Niveau | Unité |
| --- | --- |
| 1 | Fantassin |
| 5 | Éclaireur |
| 10 | Bouclier |
| 15 | Cavalier |

## Forge de combat

| Propriété | Valeur |
| --- | --- |
| DB key | combat_forge |
| HQ requis | 5 |
| Prérequis | Caserne 8 |
| Rôle | Formation unités avancées |

**Déblocages Forge :**

| Niveau | Unité |
| --- | --- |
| 1 | Assaillant |
| 8 | Briseur |

## Hub de déploiement

| Propriété | Valeur |
| --- | --- |
| DB key | deployment_hub |
| HQ requis | 10 |
| Prérequis | Forge de combat 5 |
| Rôle | Construction des unités de projection, convoi d'assaut, unité de siège mobile et convoi de colonisation |
| Effet | Débloque les unités de projection. Chaque niveau augmente la capacité de projection et réduit les temps de construction |

**Déblocages Hub de déploiement :**

| Niveau | Unité |
| --- | --- |
| 1 | Sentinelle d'interception |
| 5 | Escorteur rapide |
| 10 | Convoi d'assaut |
| 15 | Briseur mobile |
| 20 | Convoi de colonisation |

## Académie militaire

Améliore les stats permanentes (attaque, défense, vitesse).

## Mur défensif

Défense passive de ville. Bonus défensif à toutes les unités en défense.

## Tour de guet

Détection des mouvements ennemis entrants.

## Usine d'armement

Production d'équipements spécialisés pour bonus d'unités ciblées.

# Catalogue — Espionnage

## Centre d'espionnage

| Propriété | Valeur |
| --- | --- |
| DB key | spy_center |
| HQ requis | 12 |
| Niveaux max | 20 |
| Prérequis | Tour de guet 5 |
| Rôle | Gestion du vault d'Iron et missions d'espionnage |
| Effet vault | Cap vault augmente avec le niveau |
| Effet missions | Débloque des missions de niveau supérieur |
