**COINAGE**

**Guerres Officielles ****&**** End Game**

*Conflits, espionnage macro, saisons et fin de serveur*

DOC 05 — MACRO

Game Design Document — Version 1.0

# Guerres officielles

## Conditions préalables

| **Condition** | **Détail** |
| --- | --- |
| Branche Diplomatique palier 3 | Débloque la capacité de déclarer une guerre officielle |
| Branche Militaire palier 3 | Pool d'armée collective actif |

Sans ces deux prérequis, une planète ne peut que raider sur les planètes neutres — elle ne peut pas entrer en guerre officielle contre une planète mère.

## L'armée collective

Le pool d'armée collective existe en permanence — pas uniquement en guerre. Les joueurs peuvent y contribuer des troupes à tout moment. Ces troupes quittent leur ville et rejoignent le pool. En temps de paix, l'armée collective est une réserve défensive. En guerre, le Général la dirige contre les objectifs ennemis.

## Déclaration de guerre

| **Étape** | **Description** |
| --- | --- |
| 1. Proposition | Le Gouverneur propose la déclaration de guerre au Conseil et aux joueurs actifs |
| 2. Vote | 25% des joueurs actifs de la planète doivent approuver dans les 24h |
| 3. Déclaration | Si le vote est accepté → guerre déclarée. La planète cible est notifiée UNIQUEMENT à ce moment. |
| 4. Choix de camp | Les joueurs multi-tokens qui détiennent les deux tokens en guerre ont 12h pour choisir leur camp. Passé ce délai → assignation automatique à leur planète principale. |
| 5. Alliés | Les planètes alliées des deux camps sont notifiées. Elles peuvent intervenir ou rester neutres — sans obligation. |

## Déroulement du conflit

Pas de timer fixe. La guerre dure jusqu'à une condition de fin.

| **Acteur** | **Ce qu****'****il fait** |
| --- | --- |
| Général (+ lieutenants éventuels) | Dirige les troupes du pool collectif. Choisit les objectifs, coordonne les vagues d'attaque sur les villes ennemies. |
| Joueurs individuels | Totale autonomie. Chaque joueur décide seul — attaquer les villes ennemies qu'il choisit, défendre ses propres villes, contribuer davantage au pool collectif, ou ne rien faire. Aucun rôle assigné. |

*Les deux dimensions coexistent simultanément pendant toute la durée du conflit. Le score de contribution est public — visible par tous les joueurs de la planète.*

## Objectifs de guerre

Les objectifs sont les villes ennemies sur la planète mère et les planètes secondaires de la planète cible. L'attaquant vise à capturer suffisamment de villes pour atteindre la règle des 75% sur une planète spécifique.

Séquence de capture d'une ville — identique au système militaire :

| **Étape** | **Description** |
| --- | --- |
| 1. Nettoyage | Détruire toutes les défenses de la ville cible. Les défenseurs tués sont définitivement perdus. |
| 2. Instabilité | Envoyer une attaque de siège désignée. Si victoire → période d'Instabilité de 12h. |
| 3. Vaisseau | Le Vaisseau de colonisation doit arriver pendant la fenêtre de 12h. |
| 4. Capture | Si le Vaisseau arrive et son escorte survit → ville capturée. Vaisseau consommé définitivement. |

## Règle des 75% — Chute d'une planète

Si une planète perd 75% de ses villes sur une planète SPÉCIFIQUE au profit d'une même planète ennemie → cette planète tombe sous contrôle ennemi.

*Exemple : le token SOL a 4 planètes. Si l**'**ennemi capture 75% des villes sur SOL-1 → SOL-1 passe sous contrôle ennemi. SOL-2, SOL-3 et SOL-4 restent à SOL. La guerre continue sur les autres planètes.*

La guerre ne s'arrête pas automatiquement quand une planète tombe — si l'ennemi a plusieurs planètes, le conflit continue.

## Conditions de fin de guerre

| **Condition** | **Mécanisme** | **Prérequis** |
| --- | --- | --- |
| Traité de paix | Diplomates négocient. Conseils (3/5 chacun) + 50% joueurs actifs de chaque planète valident. Peut inclure des conditions (ressources, planètes neutres, délai avant prochaine guerre). | Diplomatique palier 5 |
| Reddition avec conditions | La planète en faiblesse propose sa reddition. L'ennemi accepte ou refuse. Si accepté → fin immédiate. | Diplomatique palier 14 |
| Victoire par conquête | 75% des villes d'une planète spécifique capturées → cette planète tombe. | Militaire palier 15 |
| Abandon | Le Conseil vote l'abandon. Équivalent d'une reddition sans conditions. | Aucun |

## Récompenses de guerre

Distribuées à la fin de la guerre, proportionnellement au score de contribution de chaque joueur pendant le conflit.

| **Récompense** | **Description** |
| --- | --- |
| Pillage du trésor planétaire adverse | Proportionnel au nombre de villes capturées. Plus tu as capturé, plus tu pilles. |
| Ressources des villes capturées | Ressources exposées pillées lors de chaque siège réussi. Caps définis dans le système militaire. |
| Shards | Petite quantité distribuée aux joueurs de la planète victorieuse. |

## Post-guerre

- Aucune nouvelle guerre possible entre les deux mêmes planètes pendant une période de reconstruction — durée à définir au balancing

- Les colonies installées pendant la guerre restent permanentes

- Les joueurs qui ont perdu leur ville peuvent reconstruire sur une planète neutre ou rejoindre une autre planète s'ils sont holders d'un autre token

## Impact on-chain pendant une guerre

Snapshot hebdomadaire — immuable pendant une guerre en cours. Un pump du token le jour J de la déclaration n'a aucun impact.

| **Métrique** | **Effet en guerre** |
| --- | --- |
| Cohésion > 60% joueurs actifs 7j | +15% efficacité armée collective |
| Cohésion < 40% | -10% efficacité armée collective |
| Rétention holders > 70% | +10% bonus défensif passif |
| Rétention holders < 40% | -5% défense collective |
| Taux de conversion élevé | -20% temps de mobilisation |

## Guerres impliquant des alliances

Les planètes alliées peuvent intervenir volontairement — pas d'obligation mécanique. Si une planète alliée entre dans le conflit en soutien, elle peut envoyer des troupes, attaquer directement les villes ennemies, ou contribuer au pool collectif de l'alliée. Les récompenses restent liées à la planète principale en guerre.

# Espionnage macro — Analyse planétaire

## Prérequis

| **Condition** | **Détail** |
| --- | --- |
| Centre d'espionnage niveau 10 | Débloque la mission Surveillance au niveau individuel |
| Branche Diplomatique palier 10 | Débloque l'espionnage macro au niveau planétaire |

Les deux conditions sont cumulatives. L'Analyse planétaire est une capacité collective — elle nécessite un investissement individuel ET un investissement planétaire.

## Ce que l'Analyse planétaire révèle

Contrairement aux missions individuelles qui ciblent une ville, l'Analyse planétaire cible une planète entière.

| **Révèle** | **Ne révèle PAS** |
| --- | --- |
| Niveau du trésor planétaire (Ore, Stone, Iron) | Détail des villes individuelles |
| Paliers débloqués dans chacune des 3 branches | Composition exacte de l'armée collective |
| Taille approximative de l'armée collective (ordre de grandeur) | Décisions en cours du Conseil |
| Nombre de joueurs actifs dans les 7 derniers jours | Identité des espions actifs sur la planète |
| Niveau de cohésion de la planète (métrique on-chain) |  |

## Mécanique

Même logique que l'espionnage individuel — Iron depuis le vault, temps de trajet, succès/échec basé sur un rapport entre Iron envoyé et capacité défensive collective.

Défense planétaire = somme Iron dans les vaults de tous les joueurs ayant un Centre d'espionnage actif

Succès si : Iron_envoyé > Iron_défensif_planétaire / nombre_espions_actifs

| **Résultat** | **Conséquences** |
| --- | --- |
| Succès | Rapport d'Analyse planétaire reçu. La planète cible n'est PAS notifiée. |
| Échec | Iron perdu. Le Conseil de la planète cible reçoit une notification qu'une tentative d'Analyse planétaire a eu lieu — sans savoir qui ni d'où. |

Le Surveillance Network (bâtiment prestige) n'a pas d'effet sur l'Analyse planétaire — celle-ci est détectée ou non selon la formule collective, indépendamment des bâtiments individuels.

# End Game & Saisons

## Modèle général

Le monde Solana a une durée de vie définie — il y a une fin. Quand le serveur se termine, un nouveau serveur repart de zéro. Ce modèle crée de la fraîcheur et donne à chaque communauté une chance de dominer à chaque nouveau serveur.

*La durée exacte d**'**un serveur et les conditions de fin sont à définir.*

## End game — Les Monuments Galactiques

Inspiré des World Wonders de Grepolis. Quand le monde atteint un seuil de développement suffisant, une ère des Monuments Galactiques s'ouvre. 7 Monuments sont placés sur des planètes neutres stratégiques de la carte.

| **Propriété** | **Détail** |
| --- | --- |
| Prérequis construction | L'alliance doit contrôler totalement la planète neutre où se trouve le Monument |
| Construction | Les membres de l'alliance envoient des ressources collectivement. Long et coûteux — coordination à grande échelle requise |
| Victoire | Première alliance à compléter 4 Monuments sur 7 gagne le serveur et reçoit le prize pool principal |
| Après victoire | Compétition continue pour les 3 Monuments restants — 2ème et 3ème places |
| Fin du serveur | Après victoire + période de fin définie → serveur ferme. Nouveau serveur s'ouvre. |

*Statut : concept validé, détails à définir (coûts, seuil de déclenchement, période de fin).*

## Ce qui persiste d'un serveur à l'autre

| **Persiste** | **Repart à zéro** |
| --- | --- |
| Récompenses et titres — visibles sur le profil public | Ressources individuelles |
| Classements historiques | Bâtiments et villes |
| Réputation du joueur | Niveaux de recherche individuelle |
|  | Branches planétaires |
|  | Alliances et guerres |
|  | Trésor planétaire |
|  | Carte politique entière |

## Prize pool de fin de serveur

Un pourcentage fixe des revenus du serveur (Shards achetés, queues premium) s'accumule dans un prize pool distribué à la fin.

| **Bénéficiaire** | **Part** |
| --- | --- |
| Alliance victorieuse (1ère place) | Majorité — distribué entre les membres proportionnellement au score de contribution |
| 2ème place | Part intermédiaire |
| 3ème place | Part minoritaire |

*La forme exacte du prize pool et le cadre légal selon les juridictions sont à définir séparément.*

## Récompenses régulières

### Leaderboard hebdomadaire

Classement des joueurs et planètes sur la semaine écoulée — ressources gagnées, villes capturées, contributions planétaires. Récompenses légères : Shards, cosmétiques temporaires, titres de profil hebdomadaires.

### Leaderboard mensuel

Classement plus significatif avec récompenses plus substantielles. Planète du mois, joueur du mois. Shards + cosmétiques exclusifs mensuels.

### Événements spéciaux

Événements thématiques ponctuels avec mécaniques temporaires et récompenses dédiées. Classement propre, prize pool léger, sans impact sur le classement général du serveur.

| **Événement** | **Description** |
| --- | --- |
| Summer War | Event estival avec bonus de production, guerres accélérées et récompenses spéciales en fin d'event |
| Token Rush | Certains tokens génèrent plus de Signal pendant une semaine — incite à l'activité communautaire |
| Grand Raid | Event PvP intensif sur les planètes neutres avec classement dédié |
| Alliance Championship | Tournoi inter-alliances avec bracket et élimination directe |

## Extension — Nouveaux mondes

Le monde initial est Solana. Si le concept prend, chaque nouvelle blockchain devient un nouveau monde indépendant — Ethereum, Base, Sui, etc. Chaque monde est autonome avec ses propres planètes, guerres et end game. Les mondes n'interagissent pas. Chaque nouveau monde est un nouveau lancement avec une nouvelle communauté.

## Points à définir

| **Point** | **Statut** |
| --- | --- |
| Durée exacte d'un serveur | À définir |
| Seuil de développement déclenchant l'ère des Monuments Galactiques | À définir |
| Coût des Monuments en ressources | À définir au balancing |
| Période de fin après victoire avant fermeture du serveur | À définir |
| Cadre légal du prize pool | À vérifier avec un juriste selon les juridictions |
| Fréquence et format des événements spéciaux | À définir |