**COINAGE**

**Gameplay Macro**

*Niveaux de Planète • Gouvernance • Planètes Neutres • Alliances • Diplomatie*

DOC 04 — MACRO

Game Design Document — Version 1.0

# Vue d'ensemble — Macro vs Micro

| **Dimension** | **Micro** | **Macro** |
| --- | --- | --- |
| Échelle | Un joueur, une ville | Une planète entière, une alliance |
| Décisions | Individuelles — construction, troupes, raids | Collectives — technologies, guerres, diplomatie |
| Gouvernance | Aucune — le joueur décide seul | Conseil de Gouverneurs élu |
| Ressources | Ore, Stone, Iron, Shards — individuelles | Signal, Trésor planétaire — collectifs |
| Temporalité | Quotidien — connexions régulières | Hebdomadaire à mensuel — décisions stratégiques |

# Niveaux de Planète — Les 3 Branches

Les niveaux de planète sont la couche macro de progression collective. Il n'y a pas de bâtiments physiques — la planète progresse via trois branches technologiques collectives. Les effets s'appliquent à tous les joueurs de la planète simultanément.

## Financement

| **Source** | **Description** |
| --- | --- |
| Signal | Ressource on-chain + activité joueurs. Génération : (données_on_chain × coef) + (joueurs_actifs_7j × coef). S'accumule dans le trésor planétaire. |
| Contributions | Les joueurs contribuent volontairement Ore, Stone, Iron depuis leurs villes. Score de contribution public. |
| Trésor planétaire | Pool collectif géré par le Conseil. Utilisé pour financer les paliers et les guerres officielles. |

**Une seule branche peut progresser à la fois. Le Conseil décide quelle branche prioriser — c****'****est une décision politique majeure.**

*Les paliers sont permanents — une fois débloqué, un palier ne peut pas être perdu.*

## Free riders

Les joueurs qui ne contribuent pas au trésor planétaire ne bénéficient pas des effets des branches collectives. Ils peuvent jouer normalement mais les bonus planétaires ne s'appliquent pas à eux. Le score de contribution est public — la pression sociale fait partie de la mécanique.

## Branche Économique — 20 paliers

| **Palier** | **Effet** |
| --- | --- |
| 1 | +5% production toutes ressources pour tous les joueurs actifs |
| 2 | +10% storage cap pour tous les joueurs |
| 3 | -5% coût de construction de tous les bâtiments |
| 4 | +5% production toutes ressources (cumul → +10%) |
| 5 | -5% coût de formation de toutes les troupes |
| 6 | +10% storage cap (cumul → +20%) |
| 7 | -5% coût de recherche individuelle |
| 8 | +5% production toutes ressources (cumul → +15%) |
| 9 | -5% coût de construction (cumul → -10%) |
| 10 | +10% storage cap (cumul → +30%) |
| 11 | +5% production toutes ressources (cumul → +20%) |
| 12 | -5% coût de formation de troupes (cumul → -10%) |
| 13 | -5% coût de recherche individuelle (cumul → -10%) |
| 14 | +10% storage cap (cumul → +40%) |
| 15 | +5% production toutes ressources (cumul → +25%) |
| 16 | -5% coût de construction (cumul → -15%) |
| 17 | +10% storage cap (cumul → +50%) |
| 18 | -5% coût de formation de troupes (cumul → -15%) |
| 19 | +5% production toutes ressources (cumul → +30%) |
| 20 — MAJEUR | +20% production toutes ressources (cumul → +50%) + +20% storage cap (cumul → +70%) + -10% tous les coûts (construction, formation, recherche) |

## Branche Militaire — 20 paliers

| **Palier** | **Effet** |
| --- | --- |
| 1 | +10% attaque armée individuelle |
| 2 | +10% défense individuelle toutes villes |
| 3 | +10% attaque armée collective |
| 4 | +10% défense collective toutes villes |
| 5 | Débloque le siège de villes sur planètes mères ennemies en guerre |
| 6 | +10% attaque armée individuelle (cumul → +20%) |
| 7 | +10% défense individuelle (cumul → +20%) |
| 8 | -10% temps de mobilisation en guerre officielle |
| 9 | +10% attaque armée collective (cumul → +20%) |
| 10 | +10% défense collective (cumul → +20%) |
| 11 | +10% attaque armée individuelle (cumul → +30%) |
| 12 | +10% défense individuelle (cumul → +30%) |
| 13 | +10% vitesse toutes unités en guerre officielle |
| 14 | +10% attaque armée collective (cumul → +30%) |
| 15 | Débloque la conquête totale — règle des 75% |
| 16 | +10% défense collective (cumul → +30%) |
| 17 | +10% attaque armée individuelle (cumul → +40%) |
| 18 | +10% défense individuelle (cumul → +40%) |
| 19 | +10% attaque armée collective (cumul → +40%) |
| 20 — MAJEUR | +10% défense collective (cumul → +40%) + +10% vitesse (cumul → +20%) — au niveau 20, tous les bonus individuels et collectifs atteignent +100% cumulés |

*Prérequis : Branche Économique palier 2 avant d**'**accéder à la Branche Militaire.*

## Branche Diplomatique — 20 paliers

| **Palier** | **Effet** |
| --- | --- |
| 1 | +100 slots planète mère (cumul → 200) |
| 2 | Débloque les pactes de non-agression entre planètes |
| 3 | Débloque la déclaration de guerre officielle |
| 4 | +100 slots planète mère (cumul → 300) |
| 5 | Débloque les traités de paix en cours de guerre |
| 6 | Débloque la formation d'alliances formelles (max 3 planètes) |
| 7 | +100 slots planète mère (cumul → 400) |
| 8 | Débloque la diplomatie secrète — pactes et alliances invisibles publiquement pendant 30 jours |
| 9 | +100 slots planète mère (cumul → 500) |
| 10 | Débloque l'espionnage macro — Analyse planétaire |
| 11 | +100 slots planète mère (cumul → 600) |
| 12 | +100 slots planète mère (cumul → 700) |
| 13 | +100 slots planète mère (cumul → 800) |
| 14 | Débloque les négociations de reddition avec conditions |
| 15 | +100 slots planète mère (cumul → 900) |
| 16 | +100 slots planète mère (cumul → 1000) |
| 17 | +100 slots planète mère (cumul → 1100) |
| 18 | Débloque la trahison d'alliance sans AUCUN malus (remplace palier 12) |
| 19 | +100 slots planète mère (cumul → 1200) |
| 20 — MAJEUR | +300 slots planète mère (cumul → 1500) + Les villes de la planète sont 50% plus difficiles et longues à conquérir par l'ennemi |

*Prérequis : Branche Économique palier 2 avant d**'**accéder à la Branche Diplomatique.*

**Slots : la planète mère démarre à 100 slots et peut atteindre 1 500 slots via la branche Diplomatique. Seule la planète mère permet d****'****accueillir de nouveaux holders/joueurs — même si la planète dispose de planètes secondaires.**

# Gouvernance Planétaire

## Le Conseil de Gouverneurs

| **Propriété** | **Valeur** |
| --- | --- |
| Membres | 5 membres élus |
| Vote | 1 joueur = 1 voix — pas pondéré par le holding ou la contribution. Seul moment où tout le monde pèse pareil. |
| Mandat | À vie — pas de durée limitée |
| Perte de siège | Inactivité > 7 jours consécutifs / Démission volontaire / Expulsion par vote unanime des 4 autres membres |
| Rejoindre le Conseil | Candidature ouverte (requiert Council Chamber) → vote de tous les joueurs actifs → le candidat avec le plus de votes prend le siège libéré |

## Les 3 rôles de gouvernance

| **Rôle** | **Nomination** | **Responsabilités** |
| --- | --- | --- |
| Gouverneur | Membre du Conseil le plus ancien. Rôle symbolique. | Représente officiellement la planète. Signe les traités et alliances. Peut proposer une déclaration de guerre. Ne décide RIEN seul — propose uniquement. |
| Général | Vote du Conseil (3/5). Révocable à tout moment. | Dirige l'armée collective en guerre. Objectifs d'attaque, répartition des troupes, timing des vagues. Rôle pleinement actif uniquement en guerre officielle. |
| Diplomate | Vote du Conseil (3/5). Révocable à tout moment. | Gère les relations inter-planètes. Seul habilité à entamer des négociations formelles (alliances, pactes, traités, redditions). |

## Décisions et niveaux d'approbation

| **Décision** | **Qui décide** |
| --- | --- |
| Dépenser le trésor planétaire (TOUTE dépense) | Majorité Conseil (3/5) — le Gouverneur ne peut toucher au trésor seul |
| Nommer / révoquer Général ou Diplomate | Majorité Conseil (3/5) |
| Former une alliance | Diplomate négocie + Conseil signe (3/5) |
| Rompre une alliance | Majorité Conseil (3/5) |
| Proposer un pacte de non-agression | Diplomate seul |
| Déclarer une guerre officielle | Gouverneur propose + vote 25% joueurs actifs dans les 24h |
| Accepter un traité de paix | Majorité Conseil (3/5) + vote 50% joueurs actifs |
| Accepter une reddition | Majorité Conseil (3/5) + vote 50% joueurs actifs |
| Expulser un membre du Conseil | Vote unanime des 4 autres membres |
| Prioriser une branche planétaire | Majorité Conseil (3/5) |
| Allouer le Signal entre les branches | Majorité Conseil (3/5) |

## Score de contribution

Chaque joueur a un score de contribution public visible par toute la planète. Il reflète :

- Les ressources contribuées au trésor planétaire

- Les troupes contribuées à l'armée collective

- L'activité en guerre (raids, sièges effectués)

Ce score influence : le poids du vote aux élections du Conseil, l'accès aux récompenses de guerre (distribué proportionnellement), et la réputation visible sur le profil public du joueur.

## Protections contre les abus

| **Protection** | **Mécanisme** |
| --- | --- |
| Anti-whale | Vote d'élection : 1 joueur = 1 voix. Un whale ne peut pas s'imposer seul. |
| Anti-coup d'état | Expulser un membre du Conseil nécessite l'unanimité des 4 autres. |
| Anti-inaction | Membre inactif > 7 jours → perd automatiquement son siège. |
| Anti-trésor personnel | Le Gouverneur ne peut pas dépenser le trésor seul. Toujours vote du Conseil. |

## Council Chamber — prérequis de gouvernance

Le Council Chamber est le bâtiment individuel (niveau 1, unique) requis pour participer à la gouvernance planétaire. Sans ce bâtiment, le joueur joue normalement mais n'a aucun droit de gouvernance : il ne peut pas voter aux élections ni se présenter comme Gouverneur.

HQ requis : 7. Ne compte pas dans les 2 slots prestige — slot séparé.

# Planètes Neutres & Planètes Secondaires

## Génération du monde

Toutes les planètes du monde sont générées depuis `WORLD_SEED` au lancement du serveur. Elles démarrent toutes neutres — il n'y a pas de planètes mères prédéfinies. Une planète devient la planète mère d'un token uniquement quand le premier joueur de ce token est assigné à cette planète.

## Planètes neutres — caractéristiques

| **Propriété** | **Valeur** |
| --- | --- |
| Définition | Toutes les planètes démarrent neutres. Une planète neutre sans token assigné est libre de colonisation et en PvP permanent. |
| Slots | Entre 50 et 300, définis aléatoirement à la création depuis WORLD_SEED |
| Gouvernance | Aucune — chaque ville est indépendante |
| PvP | Permanent — n'importe quel joueur peut attaquer n'importe quelle ville à tout moment, sans déclaration de guerre |
| Colonisation | N'importe quel joueur peut coloniser un slot libre via un Vaisseau de colonisation |
| Multi-slots | Un joueur peut avoir plusieurs villes sur une même planète neutre (pas de limite de 1 par joueur) |
| Signal | Pas de Signal généré — exclusivement lié aux tokens |
| Profil de production | Fixe à la création — certaines riches en Ore, d'autres en Stone, d'autres en Iron. Visible avant de coloniser. |

## Attribution d'une planète mère à un token

Quand le premier joueur d'un token rejoint le jeu :

1. Le système cherche une planète neutre disponible (avec slots libres)
2. Cette planète est assignée au token — elle devient sa planète mère
3. La ville du joueur est créée sur cette planète
4. La planète passe du statut Neutre au statut Mère dans la DB — elle est désormais protégée hors guerre officielle

## Passage en planète secondaire

Une planète neutre devient planète secondaire d'une planète quand TOUS ses slots sont contrôlés par des joueurs de cette même planète (pas d'une alliance — d'une seule planète).

## Effets du passage en planète secondaire

- Acquiert les mêmes droits qu'une planète mère — protégée des attaques hors guerre officielle

- Considérée comme territoire de la planète qui la contrôle

- Contribue au calcul de la règle des 75% lors d'une guerre

- Les joueurs qui y ont une ville participent aux votes d'élection du Conseil de leur planète mère

## Perte du statut de planète secondaire

Si un slot est capturé par un joueur d'une autre planète via siège pendant une guerre officielle → la planète perd son statut de planète secondaire et redevient neutre. Le PvP permanent y est rétabli immédiatement.

## Gestion des planètes secondaires

Les planètes secondaires n'ont pas de gouvernance propre. Elles sont gérées directement par le Conseil de Gouverneurs de la planète mère. Les joueurs qui y ont une ville ont les mêmes droits politiques que les joueurs sur la planète mère.

# Alliances

## Formation

| **Propriété** | **Valeur** |
| --- | --- |
| Prérequis | Branche Diplomatique palier 6 débloquée pour les deux planètes |
| Processus | Diplomate propose → Diplomate cible accepte → Conseil des deux planètes valide (3/5 chacun) → Alliance active |
| Maximum | 3 planètes par alliance — limite mécanique infranchissable |
| Durée minimale | 7 jours avant de pouvoir dissoudre |
| Visibilité | Publique par défaut. Secrète si Diplomatique palier 8 débloqué (30 jours max) |

## Ce qu'une alliance implique

| **Avantage** | **Description** |
| --- | --- |
| Non-agression totale | Impossible mécaniquement d'attaquer un joueur allié — sur planètes mères, neutres ET secondaires. La non-agression est absolue. |
| Coordination militaire | Les planètes alliées peuvent coordonner leurs attaques contre un ennemi commun. Pas de mécanique automatique — coordination humaine entre Conseils et Généraux. |
| Visibilité partagée | Les mouvements de troupes alliés sont visibles. Les attaques entrantes sur une planète alliée sont visibles. |

## Rupture d'alliance

| **Type** | **Processus** | **Conséquences** |
| --- | --- | --- |
| Rupture normale | Majorité Conseil (3/5). Effet immédiat. Notification publique. | Délai de 48h avant qu'une guerre puisse être déclarée entre les deux anciennes alliées. |
| Trahison (pendant guerre commune) | Possible à tout moment. | -30% attaque et -30% défense sur toutes les unités pendant 7 jours. Si Diplomatique palier 18 débloqué : 0% malus. |

## Alliances et planètes secondaires

Si plusieurs planètes d'une alliance contrôlent des slots sur une même planète neutre (mais pas la même planète pour tous les slots), la planète neutre ne devient PAS planète secondaire. Le statut de planète secondaire requiert que tous les slots appartiennent à des joueurs d'une même planète, pas d'une alliance.

# Diplomatie

## Vue d'ensemble des interactions diplomatiques

| **Action** | **Palier requis** | **Qui** | **Description** |
| --- | --- | --- | --- |
| Pactes de non-agression | Diplom. palier 2 | Diplomate seul | Accord bilatéral. Aucune guerre possible pendant la durée. Min 7 jours. Rupture avec préavis 48h. |
| Déclaration de guerre officielle | Diplom. palier 3 | Gouverneur propose + 25% vote joueurs 24h | Voir documentation Guerres officielles |
| Traités de paix | Diplom. palier 5 | Diplomate négocie + Conseil (3/5) + 50% joueurs actifs | Fin de guerre négociée. Peut inclure des conditions. |
| Formation d'alliances | Diplom. palier 6 | Diplomate + Conseil (3/5) | Voir documentation Alliances |
| Diplomatie secrète | Diplom. palier 8 | Diplomate | Pactes et alliances invisibles 30 jours. Devient public automatiquement après 30j. |
| Espionnage macro | Diplom. palier 10 | Centre d'espionnage | Analyse planétaire — voir section Espionnage Macro |
| Trahison sans pénalité réduite | Diplom. palier 12 | Décision unilatérale | Malus réduit à -15% au lieu de -30% |
| Reddition avec conditions | Diplom. palier 14 | Diplomate + Conseil (3/5) des deux planètes + 50% joueurs | La planète en faiblesse propose sa reddition. L'ennemi peut accepter ou refuser. Fin de guerre immédiate si accepté. |
| Trahison sans aucun malus | Diplom. palier 18 | Décision unilatérale | 0% de malus. Trahison sans conséquence mécanique. |

## Réputation planétaire

Chaque planète a un score de réputation visible publiquement par toutes les planètes du monde.

| **Impact** | **Actions** |
| --- | --- |
| Augmente la réputation | Respecter ses pactes jusqu'à leur terme / Honorer ses alliances en guerre / Accepter des redditions plutôt que poursuivre une conquête totale |
| Diminue la réputation | Trahir une alliance / Rompre un pacte sans préavis / Déclarer une guerre immédiatement après la fin d'un pacte |

| **Niveau de réputation** | **Conséquences mécaniques** |
| --- | --- |
| Haute réputation | Les autres planètes acceptent plus facilement tes propositions d'alliance et de pacte |
| Basse réputation | Les autres planètes peuvent refuser de négocier. Les joueurs holders peuvent hésiter à rejoindre ta planète. |