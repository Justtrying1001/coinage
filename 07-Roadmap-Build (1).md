**COINAGE**

**Roadmap ****&**** Plan de Build**

*MVP → V0 → V1 → V2 → V3*

Version 1.0 — Avril 2026

# Vue d'ensemble

Coinage est buildé par couches progressives. Chaque version est jouable et déployable de façon indépendante. On valide avant d'investir plus.

| **Version** | **Objectif principal** | **Auth** | **Combat** | **Web3** | **Statut** |
| --- | --- | --- | --- | --- | --- |
| MVP | Valider l'attractivité du concept | Aucune — pseudo seulement | Non | Non | À builder |
| V0 | Valider la rétention quotidienne | Email / GitHub | Raids + Sièges | Non | Roadmap |
| V1 | Connecter aux communautés token | Wallet Solana (Privy) | Complet | Oui | Roadmap |
| V2 | Couche sociale et politique | Wallet | Complet + Guerres | Oui | Roadmap |
| V3 | End game + Monétisation | Wallet | Complet | Oui | Roadmap |

**Features intentionnellement absentes du MVP et V0 :**

- Auth wallet / vérification holding → V1

- Multiplicateur de holding → V1

- Pipeline on-chain Solana / Signal → V1

- Branches planétaires (progression collective) → V1

- Recherche individuelle (RC + 6 branches) → V1

- Gouvernance planétaire (Conseil, votes) → V2

- Armée collective → V2

- Guerres officielles → V2

- Alliances & Diplomatie → V2

- Espionnage macro (Analyse planétaire) → V2

- Trading / Marché → V3

- Monuments Galactiques / End Game → V3

- Saisons + Reset serveur → V3

- Prize pool → V3

- Leaderboards + Événements spéciaux → V3

- Shards + Monétisation complète → V3

**MVP — ****Proof of Concept**

*Objectif : est-ce que le concept attire des joueurs ?*

Zéro barrière à l'entrée. Le joueur arrive, choisit un pseudo, sélectionne une planète (token) sur la carte monde, et joue immédiatement. Pas d'email, pas de compte, pas de wallet.

**Ce qu****'****on valide avec le MVP :**

- Est-ce que la carte monde avec des planètes crypto attire de la curiosité ?

- Est-ce que le loop construction/production est satisfaisant ?

- Est-ce que les joueurs comprennent le concept sans explication ?

- Est-ce que les communautés token partagent le jeu entre elles ?

**Phase 1 — ****Setup ****&**** Infrastructure**

- Repo GitHub + Vercel deploy

- Next.js App Router + TypeScript

- Neon PostgreSQL + Prisma v5.22.0 (PINNED)

- Schema DB minimal : User (pseudo + cookie), Planet, City

- Variables d'environnement : POSTGRES_PRISMA_URL, DIRECT_DATABASE_URL, NEXT_PUBLIC_WORLD_SEED

**Phase 2 — ****Onboarding sans auth**

- Page d'accueil → présentation du concept

- Choix d'un pseudo (5-20 chars, alphanumérique)

- Session anonyme stockée via cookie (pas de compte)

- Pas de mot de passe, pas d'email, pas de wallet

**Phase 3 — ****Galaxy View — Carte monde**

- Canvas 2D — identique architecture GitCities

- Génération procédurale des planètes depuis NEXT_PUBLIC_WORLD_SEED

- Planètes mères : créées dynamiquement à la demande des joueurs — pas de liste statique prédéfinie

- Planètes neutres : générées procéduralement (50-300 slots)

- Navigation : pan, zoom, sélection

- Tooltip au hover : nom de la planète, joueurs actifs, slots disponibles

- Selection card au clic : infos + bouton Rejoindre

- Seules les planètes activées (seuil atteint) apparaissent sur la carte — les planètes en attente sont invisibles

**Phase 4 — ****Choix de planète ****&**** Assignation**

Deux chemins possibles depuis l'onboarding — le joueur choisit de rejoindre une planète existante ou d'en créer une nouvelle.

**Chemin A — Rejoindre une planète existante**

- Liste des planètes activées sur la carte avec joueurs actifs, slots disponibles

- Si des slots sont disponibles → ville créée automatiquement

- Si la planète est pleine → suggestion de planète neutre

**Chemin B — Créer une nouvelle planète**

- Recherche libre par ticker ou mint address SPL (ex : "BONK", "AAPLx", ou adresse complète)

- Appel immédiat à Jupiter Token API pour valider le mint address et récupérer les métadonnées : nom, ticker, logo

- Si le mint address est invalide ou n'est pas un SPL token reconnu → erreur propre, création bloquée

- Si le token existe déjà comme planète active → redirection vers Chemin A

- Si le token n'existe pas encore → planète créée en statut PENDING, invisible sur la carte monde

- Le joueur devient Fondateur de cette planète — badge permanent

- En attendant l'activation, le Fondateur joue sur une planète neutre

**Seuil d'activation**

- Seuil : 5 joueurs ayant rejoint la planète PENDING

- Pas de fenêtre temporelle — la planète reste en PENDING indéfiniment jusqu'à atteindre le seuil

- Au seuil atteint → planète activée, position assignée sur la carte monde, badge Fondateur gravé

- Aucune vérification de holding dans le MVP — la vérification wallet arrivera en V1

**Règle générale**

- Un joueur = une ville dans le MVP (pas de multi-villes)

**Phase 5 — ****City View — Vue isométrique**

- Canvas isométrique — identique architecture GitCities

- Grille métallique sombre (thème Coinage)

- HQ affiché par défaut niveau 1

- Slots disponibles visibles sur la grille

- Click sur bâtiment → fiche détail (niveau, production, upgrade)

- Click sur slot vide → menu de construction

**Phase 6 — ****Ressources ****&**** Production**

- Ore, Stone, Iron — production continue (claim-on-access)

- Pas de Shards dans le MVP — aucune monétisation

- Storage cap par ressource

- Affichage pills dans le HUD : quantité / cap

- Mise à jour du compteur toutes les 30 secondes (polling léger)

**Phase 7 — ****Bâtiments économiques**

- HQ (niveaux 1-5 dans le MVP)

- Mine → Ore

- Carrière → Stone

- Raffinerie → Iron (déblocage HQ 3)

- Entrepôt → Storage cap

- Housing Complex → Population

- Queue de construction : 2 slots simultanés

- Timer affiché en temps réel

- Pas de queue premium dans le MVP

**Phase 8 — ****Planet View — Vue intérieure planète**

- Liste des villes présentes sur la planète

- Propriétaire, niveau HQ, statut (actif/inactif)

- Slots libres restants

- Navigation entre Galaxy View → Planet View → City View

**Ce que le MVP NE contient PAS intentionnellement :**

- Aucun combat (pas de troupes, pas de raids)

- Aucun espionnage

- Aucune gouvernance

- Aucun Signal / branches planétaires

- Aucune auth (email, GitHub ou wallet)

- Aucune monétisation

**Critère de succès du MVP :**

- Des joueurs reviennent le lendemain sans être relancés

- Des communautés token partagent le jeu d'elles-mêmes

- Des retours sur ce qui manque (combat, social, etc.)

**V0 — ****Premier gameplay loop complet**

*Objectif : les joueurs reviennent-ils jouer chaque jour ?*

On ajoute l'auth, le combat, les raids, les sièges et l'espionnage basique. Les joueurs ont maintenant une vraie raison de se connecter chaque jour — défendre leur ville, attaquer leurs voisins, progresser.

*Prérequis : MVP validé avec des joueurs actifs.*

**Phase 1 — ****Auth email / GitHub**

- NextAuth v5 — email ou GitHub OAuth

- Migration des sessions anonymes vers des comptes réels (optionnel — les joueurs MVP peuvent conserver leur session)

- Pas encore de wallet — on garde la friction basse

- Protection anti-abuse : rate limiting sur les actions

**Phase 2 — ****Bâtiments militaires + Formation de troupes**

- Caserne → unités terrestres tier 1 (Fantassin, Bouclier, Tireur)

- Forge de combat → unités terrestres tier 2 (Assaillant, Briseur)

- Dock spatial → unités aériennes (Intercepteur, Chasseur léger, Transporteur, Bombardier)

- Population consommée par les troupes vivantes

- Temps de formation affiché en temps réel

**Phase 3 — ****Système de combat**

- 3 types d'attaque : Cinétique / Énergétique / Plasma

- 2 phases : Combat aérien → Combat terrestre

- Calcul de résultat basé sur attaque vs défense

- Pertes des deux côtés proportionnelles aux stats

- Rapport de combat envoyé aux deux joueurs

**Phase 4 — ****Raids sur planètes neutres**

- Envoi de troupes vers une ville ennemie sur planète neutre

- Distance + temps de trajet (unité la plus lente)

- Pillage si victoire : ressources exposées selon caps

- Protection post-raid 12h contre le même attaquant

- Protection nouveau joueur 7 jours (levée si le joueur attaque en premier)

**Phase 5 — ****Colonisation ****&**** Sièges**

- Vaisseau de colonisation → déblocage Dock spatial niveau 20

- Colonisation slot libre : envoi Vaisseau seul, aucun combat, ville créée

- Siège ville occupée : nettoyage → Instabilité 12h → Vaisseau → capture

- Règle des 75% sur les planètes neutres

- Planètes secondaires : planète neutre 100% contrôlée par une même planète

**Phase 6 — ****Espionnage basique**

- Centre d'espionnage — déblocage HQ niveau 12

- Vault d'Iron séparé de l'Entrepôt

- Mission Reconnaissance (niveau 1) : troupes présentes

- Mission Infiltration (niveau 5) : rapport complet

- Contre-espionnage passif via niveau du vault

- Missions Surveillance, Sabotage, Opération fantôme → V1

**Phase 7 — ****Tower de guet ****&**** Anti-abuse**

- Tour de guet → détection des mouvements ennemis entrants

- Anti-bully : MoraleMod basé sur PowerRatio

- Anti-abuse : wash trading, rate limiting, taille minimale actions

**Critère de succès V0 :**

- Des joueurs se connectent chaque jour pour checker leurs ressources et défendre leur ville

- Des guerres spontanées entre joueurs sur les planètes neutres

- Des demandes pour avoir des guerres officielles entre planètes mères

**V1 — ****Intégration Web3**

*Objectif : connecter le jeu aux vraies communautés token*

On introduit le wallet Solana. La proposition de valeur est claire : connecte ton wallet pour rejoindre officiellement ta communauté token et débloquer le multiplicateur de holding. La confiance est établie depuis le MVP et la V0.

*Prérequis : V0 validée avec des joueurs actifs et fidèles.*

**Phase 1 — ****Auth wallet Solana — Privy**

- Ajout de Privy comme provider d'auth (en complément de GitHub/email)

- Connexion Phantom → récupération adresse publique du wallet

- Le wallet est optionnel — les joueurs existants sans wallet continuent de jouer

- Un joueur connecté wallet peut lier son wallet à son compte existant

**Phase 2 — ****Vérification holding on-chain**

- Lecture des tokens détenus via RPC Solana (Helius / QuickNode / Alchemy — à choisir)

- Si le joueur détient un token → il peut rejoindre la planète mère correspondante

- Snapshot quotidien via QStash : si plus holder → ville sur planète mère perdue

- Logique multi-token : jusqu'à 3 tokens simultanés

- Conflit d'intérêt : choix de camp 12h si deux tokens en guerre

**Phase 3 — ****Multiplicateur de holding**

- Calcul du percentile du wallet dans la distribution du token

- Bottom 60% → 1.0x | 60-90% → 1.5x | Top 10% → 2.0x | Top 1% → 3.0x

- Appliqué uniquement sur la production passive de ressources

- Les joueurs sans wallet restent à 1.0x — ils ne sont pas désavantagés en combat

**Phase 4 — ****Pipeline on-chain Solana → Signal**

- Job QStash hebdomadaire : lecture données on-chain chaque token actif

- Le mint address de chaque planète est déjà en DB depuis sa création au MVP — aucune migration nécessaire

- Lecture via Helius / Birdeye pour chaque planète active : volume de transactions 7j, holders actifs 30j, total holders

- Calcul Signal : (données_on_chain × coef) + (joueurs_actifs_7j × coef)

- Planètes avec zéro activité on-chain (tokens obscurs, petites communautés) : Signal = joueurs_actifs_7j × coef uniquement — la planète peut vivre et progresser uniquement via l'activité in-game

- Signal crédité au trésor planétaire — immuable pendant 7 jours

- Provider RPC à définir au moment du build

**Phase 5 — ****Branches planétaires**

- 3 branches : Économique / Militaire / Diplomatique

- 20 paliers par branche — financés par Signal + contributions joueurs

- Trésor planétaire : Ore, Stone, Iron collectifs

- Council Chamber requis pour contribuer au trésor

- Effets des paliers appliqués à tous les joueurs de la planète

**Phase 6 — ****Recherche individuelle**

- Laboratoire de recherche — déblocage HQ niveau 7

- RC = Research Capacity (budget permanent, non consommable)

- 6 branches × 5 tiers : Économie / Militaire terrestre / Militaire aérien / Défense / Espionnage / Colonisation

- 1 seule recherche active à la fois par ville

- Reset possible via Shards (cooldown 7 jours)

**Phase 7 — ****Espionnage avancé**

- Missions Surveillance (niveau 10), Sabotage (niveau 15), Opération fantôme (niveau 20)

- Surveillance Network (prestige) : 100% détection garantie

- Contre-espionnage actif : formule probabiliste niveau espion

**Critère de succès V1 :**

- Des communautés token s'organisent pour progresser leurs branches planétaires

- Des holders connectent leur wallet spontanément pour le multiplicateur

- Le Signal crée une dynamique on-chain visible dans les communautés

**V2 — ****Couche sociale ****&**** politique**

*Objectif : transformer les planètes en vraies communautés organisées*

On ajoute la gouvernance collective, les guerres officielles, les alliances et la diplomatie. Les planètes deviennent de véritables organisations avec des leaders, des décisions collectives et des conflits formels.

*Prérequis : V1 validée avec des planètes actives et des communautés token engagées.*

**Phase 1 — ****Gouvernance planétaire**

- Council Chamber — HQ niveau 7

- Élection des 5 membres du Conseil (1 joueur = 1 voix)

- 3 rôles : Gouverneur (symbolique), Général (armée collective), Diplomate (relations)

- Décisions collectives : dépense trésor, alliances, guerres — vote Conseil (3/5)

- Score de contribution public — visible par toute la planète

**Phase 2 — ****Armée collective**

- Pool de troupes contribuées volontairement par les joueurs

- Dirigé par le Général (et lieutenants éventuels) en guerre

- Existe en permanence — pas uniquement en guerre

- Score de contribution militaire public

**Phase 3 — ****Guerres officielles**

- Prérequis : Diplomatique palier 3 + Militaire palier 3

- Déclaration : Gouverneur propose + 25% vote joueurs actifs en 24h

- Cible notifiée uniquement si le vote est accepté

- Armée collective dirigée par le Général — joueurs individuels en autonomie totale

- Conditions de fin : Traité de paix / Reddition / Conquête 75% / Abandon

- Récompenses : pillage trésor adverse + Shards

- Impact on-chain : snapshot hebdomadaire immuable

**Phase 4 — ****Alliances**

- Max 3 planètes par alliance

- Non-agression totale mécanique partout sur la carte

- Durée minimale 7 jours

- Trahison : -30% attaque/défense 7 jours

- Diplomatie secrète (palier 8) : alliance invisible 30 jours

**Phase 5 — ****Diplomatie complète**

- Pactes de non-agression (palier 2)

- Traités de paix avec conditions (palier 5)

- Reddition avec conditions négociées (palier 14)

- Trahison sans malus (palier 18)

- Réputation planétaire — score public visible par tous

**Phase 6 — ****Espionnage macro — Analyse planétaire**

- Prérequis : Centre d'espionnage niveau 10 + Diplomatique palier 10

- Cible une planète entière — pas une ville individuelle

- Révèle : trésor planétaire, paliers branches, taille armée collective, cohésion

- Défense collective : somme Iron vaults de tous les joueurs avec Centre d'espionnage

**Phase 7 — ****Bâtiments prestige complets**

- Tous les bâtiments prestige débloqués et fonctionnels

- Groupe A : Data Center, Training Grounds, Warp Beacon, Trade Hub

- Groupe B : Defense Grid, Réserve Stratégique, Surveillance Network, War Council

**Critère de succès V2 :**

- Des guerres officielles se déclarent entre communautés token

- Des alliances se forment et se trahissent

- Le Conseil de Gouverneurs prend de vraies décisions stratégiques

**V3 — ****End Game ****&**** Monétisation**

*Objectif : rétention long terme + revenus durables*

On ajoute la couche end game, le trading, les événements et la monétisation complète. Le jeu est maintenant complet dans toutes ses dimensions.

*Prérequis : V2 validée avec des guerres actives et des communautés politiquement organisées.*

**Phase 1 — ****Trading / Marché**

- Bâtiment Marché — déblocage HQ niveau 7

- Cargo Units (CU) — capacité de transport basée sur le niveau du Marché

- Transferts intra-joueur entre villes

- Marché joueur : ordres d'achat/vente entre joueurs (matching prix-temps)

- Marché système : liquidité de fallback

- Distance + temps de trajet pour tous les transferts

**Phase 2 — ****Monétisation — Shards**

- Shards : ressource premium achetable via packages

- Queue de construction premium : 2 → 5 slots via Shards (durée limitée)

- Reset recherche individuelle : coût en Shards + cooldown 7 jours

- Slots de tokens supplémentaires : 3 → 5 tokens simultanés

- Cosmétiques : skins de ville et de planète — aucun impact gameplay

- Règle absolue : zéro achat de ressources de base, troupes ou technologies

**Phase 3 — ****Leaderboards ****&**** Événements**

- Leaderboard hebdomadaire : joueurs + planètes — récompenses légères (Shards, cosmétiques temporaires)

- Leaderboard mensuel : récompenses plus substantielles — planète du mois, joueur du mois

- Événements spéciaux : Summer War, Token Rush, Grand Raid, Alliance Championship

- Chaque événement a son propre classement et prize pool léger

**Phase 4 — ****Monuments Galactiques — End Game**

- Déclenchement : seuil de développement mondial atteint

- 7 Monuments placés sur des planètes neutres stratégiques

- Construction : alliance doit contrôler totalement la planète neutre

- Ressources envoyées collectivement par les membres de l'alliance

- Victoire : première alliance à compléter 4 Monuments sur 7

- Après victoire : compétition pour les 3 Monuments restants (2ème et 3ème places)

**Phase 5 — ****Saisons ****&**** Reset serveur**

- Durée du serveur à définir — probablement 2-3 mois

- Fin du serveur après victoire + période de fin définie

- Nouveau serveur repart de zéro — carte politique vierge

- Ce qui persiste : récompenses, titres, réputation sur le profil public

- Ce qui repart à zéro : ressources, villes, branches planétaires, alliances

**Phase 6 — ****Prize pool de fin de serveur**

- % fixe des revenus du serveur accumulés pendant toute la durée

- Distribution : top 3 alliances proportionnellement au score de contribution

- Forme exacte et cadre légal à définir selon les juridictions

**Phase 7 — ****Extension multi-blockchain**

- Monde Solana → Monde Ethereum → Monde Base → Monde Sui…

- Chaque blockchain = nouveau monde indépendant

- Pas d'interaction entre les mondes

- Chaque nouveau monde = nouveau lancement, nouvelle communauté

**Critère de succès V3 :**

- Des revenus Shards récurrents

- Un premier serveur terminé avec un gagnant et un prize pool distribué

- Des demandes pour un deuxième serveur / un nouveau monde blockchain

# Récapitulatif — Ce qu'on NE build PAS avant V3

| **Feature** | **Version cible** | **Raison du report** |
| --- | --- | --- |
| Auth wallet / Privy | V1 | Barrière à l'entrée — d'abord valider le concept |
| Vérification holding on-chain | V1 | Nécessite confiance établie avec les joueurs |
| Multiplicateur de holding | V1 | Dépend du wallet |
| Signal / Pipeline on-chain | V1 | Dépend du wallet et RPC Solana |
| Branches planétaires | V1 | Dépend du Signal |
| Recherche individuelle (RC) | V1 | Complexité — valider d'abord le combat |
| Gouvernance (Conseil) | V2 | Nécessite une base de joueurs actifs par planète |
| Armée collective | V2 | Dépend de la gouvernance |
| Guerres officielles | V2 | Dépend armée collective + gouvernance |
| Alliances & Diplomatie | V2 | Dépend des guerres officielles |
| Espionnage macro | V2 | Dépend Diplomatique palier 10 |
| Trading / Marché | V3 | Complexité — valider d'abord toute la couche sociale |
| Monétisation Shards | V3 | Ne monétise pas avant d'avoir des users fidèles |
| Monuments Galactiques | V3 | Nécessite une masse critique de joueurs |
| Saisons + Reset | V3 | Nécessite un serveur complet pour se terminer |
| Prize pool | V3 | Dépend de la monétisation + cadre légal |