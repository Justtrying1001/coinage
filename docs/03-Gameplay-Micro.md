**COINAGE**

**Gameplay Micro**

*Population • Économie • Militaire • Espionnage • Recherche • Trading*

DOC 03 — MICRO

Game Design Document — Version 1.0

# Population

La population est une capacité partagée et permanente de chaque ville. Elle est consommée par deux choses simultanément : les bâtiments construits et les troupes entraînées et vivantes.

**Tension centrale : plus tu construis de bâtiments → moins de population disponible pour des troupes, et vice versa. C****'****est la décision stratégique fondamentale de chaque ville.**

## Source de population

Housing Complex est le seul bâtiment qui augmente le cap de population. Training Grounds (prestige) ajoute +10% bonus sur ce cap.

Le Housing Complex et l'Entrepôt ne consomment pas de population — identique à Grepolis pour la Farm et le Warehouse.

## Consommation de population

| **Source** | **Comportement** |
| --- | --- |
| Bâtiments | Consomment de la population à la construction et à chaque upgrade. La population est permanente — elle reste réservée tant que le bâtiment existe. |
| Troupes | Consomment de la population tant qu'elles sont vivantes. Quand une troupe meurt au combat, sa population est libérée et redevient disponible. |

## Spécialisation des villes

| **Type de ville** | **Focus** | **Description** |
| --- | --- | --- |
| Ville économique | Production max | Housing Complex et bâtiments de production upgradés au maximum, peu de troupes |
| Ville offensive | Troupes d'attaque max | Bâtiments réduits au minimum (HQ, Housing, Entrepôt, Caserne/Dock), toute la population en troupes d'attaque |
| Ville défensive | Défenses max | Mur défensif et Tour de guet upgradés, troupes défensives, Housing Complex maximisé |
| Ville de recherche | RC max | Laboratoire de recherche upgradé au maximum, contribution forte au Signal planétaire |
| Ville de colonisation | Flotte max | Dock spatial niveau 20 + Vaisseau de colonisation + escorte complète |

# Économie

## Production continue — modèle Grepolis

Identique à Grepolis. Les ressources s'accumulent en continu à un taux horaire. La ville stocke un lastUpdatedAt timestamp. À chaque accès, le système calcule le temps écoulé et crédite les ressources accumulées, plafonnées par le storage cap.

Aucun background job nécessaire — tout est calculé à la demande (claim-on-access).

## Anti-abuse

Pas de daily cap sur la production passive — elle est naturellement plafonnée par le storage cap.

| **Protection** | **Durée** | **Condition** |
| --- | --- | --- |
| Protection nouveau joueur | 7 jours | Immunité totale aux attaques. Levée immédiatement si le joueur attaque en premier. |
| Protection post-raid | 12 heures | Immunité contre le même attaquant après un raid subi. |

# Militaire — Micro

## Système de combat — 3 types d'attaque

Inspiré de Grepolis. Chaque unité a un seul type d'attaque et des valeurs de défense contre les trois types. Choisir les bonnes unités en fonction de la composition ennemie est la compétence centrale.

| **Type** | **Description** | **Efficace contre** | **Inefficace contre** |
| --- | --- | --- | --- |
| Cinétique | Attaque physique brute | Défense Énergétique | Défense Cinétique |
| Énergétique | Attaque concentrée | Défense Plasma | Défense Énergétique |
| Plasma | Attaque à distance | Défense Cinétique | Défense Plasma |

## Deux phases de combat

| **Phase** | **Description** |
| --- | --- |
| Phase 1 — Combat aérien | Les unités aériennes s'affrontent en premier. Le résultat détermine combien de Transporteurs atteignent leur destination et à quelle efficacité. |
| Phase 2 — Combat terrestre | Les unités terrestres débarquées affrontent les défenses terrestres. Le Mur défensif ajoute un bonus massif à toutes les unités en défense. |

## Unités terrestres

| **Unité** | **DB key** | **Attaque** | **Vitesse** | **Loot** | **Pop** | **Débloqué** |
| --- | --- | --- | --- | --- | --- | --- |
| Fantassin | infantry | Cinétique | Moyenne | Faible | 1 | Caserne niv.1 |
| Bouclier | shield_guard | Cinétique | Lente | Nul | 3 | Caserne niv.5 |
| Tireur | marksman | Plasma | Moyenne | Faible | 1 | Caserne niv.10 |
| Cavalier | raider_cavalry | Cinétique | Très rapide | Très élevé | 3 | Caserne niv.15 |
| Assaillant | assault | Énergétique | Moyenne | Moyen | 2 | Forge niv.1 |
| Briseur | breacher | Cinétique | Très lente | Nul | 5 | Forge niv.8 |

## Unités aériennes

| **Unité** | **DB key** | **Attaque** | **Vitesse** | **Pop** | **Débloqué** | **Note** |
| --- | --- | --- | --- | --- | --- | --- |
| Intercepteur | interceptor | Énergétique | Très rapide | 4 | Dock niv.1 | Défense aérienne |
| Chasseur léger | light_fighter | Plasma | Rapide | 3 | Dock niv.5 | Toujours inclure dans une attaque inter-planète |
| Transporteur | dropship | Aucune | Lente | 6 | Dock niv.10 | Requis pour attaquer une planète différente. Cible prioritaire ennemie. Capacité : 10 unités pop. |
| Bombardier | bomber | Cinétique | Lente | 5 | Dock niv.15 | Anti-structure. Nécessite escorte Chasseurs légers. |
| Vaisseau colonisation | colony_ship | Aucune | Très lente (le plus lent) | 10 | Dock niv.20 + HQ 10 | Consommé définitivement à l'arrivée. Escorte obligatoire. |

## Distance et temps de déplacement

La distance entre deux villes sur la carte détermine le temps de trajet de toutes les unités.

Temps_trajet = Distance × (1 / Vitesse_unité_la_plus_lente)

La vitesse du groupe est toujours celle de l'unité la plus lente. Les joueurs doivent calculer les temps d'arrivée pour coordonner plusieurs vagues — une vague de nettoyage doit arriver quelques minutes avant le Vaisseau de colonisation.

**Vitesses relatives des unités (du plus rapide au plus lent) :**

| **Vitesse** | **Unités** |
| --- | --- |
| Très rapide | Cavalier, Intercepteur |
| Rapide | Chasseur léger |
| Moyenne | Fantassin, Tireur, Assaillant |
| Lente | Bouclier, Bombardier, Transporteur |
| Très lente | Briseur |
| Extrêmement lente | Vaisseau de colonisation (le plus lent du jeu) |

## Types d'actions militaires

| **Action** | **Disponible** | **Description** |
| --- | --- | --- |
| Raid | Toujours sur planètes neutres / En guerre sur planètes mères | Attaque rapide pour piller des ressources. Combat résolu, ressources pillées si victoire. |
| Colonisation | Toujours, slot libre uniquement | Envoi d'un Vaisseau de colonisation vers un slot LIBRE sur planète neutre. Aucun combat si slot libre. Garantie d'une nouvelle ville. |
| Siège de ville occupée (neutre) | Toujours | Attaquer une ville occupée sur planète neutre. Si victoire + Vaisseau arrive pendant Instabilité → ville capturée. |
| Siège de ville (planète mère) | Uniquement en guerre officielle | Même mécanique que siège neutre mais uniquement pendant une guerre déclarée contre cette planète. |

## Séquence de siège

| **Étape** | **Description** |
| --- | --- |
| 1. Nettoyage | Envoyer des troupes pour détruire toutes les défenses de la ville cible. Si tu gagnes, les défenseurs sont détruits. |
| 2. Instabilité | Envoyer une attaque de siège désignée. Si victoire → période d'Instabilité de 12h. La ville est déstabilisée. |
| 3. Vaisseau | Envoyer le Vaisseau de colonisation (souvent avant l'Instabilité à cause de sa lenteur). Doit arriver pendant la fenêtre de 12h. |
| 4. Capture | Si le Vaisseau arrive pendant l'Instabilité et que son escorte survit → ville capturée. Vaisseau consommé définitivement. |
| 5. Échec | Si le Vaisseau est détruit → siège annulé. Si la fenêtre de 12h expire → ville retourne au propriétaire. |

## Règle des 75% — Chute d'une planète

Si une planète perd 75% de ses villes (sur une planète spécifique, pas sur l'ensemble) au profit d'une même planète ennemie, cette planète tombe.

*Exemple : le token SOL a 4 planètes. Si l**'**ennemi capture 75% des villes sur SOL-1 → SOL-1 passe sous contrôle ennemi. SOL-2, SOL-3 et SOL-4 restent à SOL. La guerre continue.*

## Anti-bully

PowerRatio = puissance_défenseur / puissance_attaquant

MoraleMod = clamp(0.55, 1.0, 0.4 + PowerRatio × 1.8)

Plus l'écart de puissance est grand, plus l'attaque est pénalisée. Décourage le farming répété des petits joueurs par les gros.

## Impact on-chain sur le militaire

Métriques calculées en snapshot hebdomadaire — immuables pendant une guerre en cours. Résistantes à la manipulation court-terme.

| **Métrique** | **Calcul** | **Effet** |
| --- | --- | --- |
| Cohésion | % joueurs actifs 7 derniers jours | >60% : +15% efficacité armée collective │ <40% : -10% |
| Rétention holders | % holders détenant depuis >30 jours | >70% : +10% bonus défensif passif │ <40% : -5% défense |
| Taux de conversion | % holders qui jouent activement | Haut taux : -20% temps de mobilisation collective |

# Espionnage

## Principe — Cave/Vault d'Iron

Adapté directement du système Cave/Silver de Grepolis. L'Iron sert à la fois de ressource de construction ET de monnaie d'espionnage.

Le Centre d'espionnage dispose d'un vault interne séparé de l'Entrepôt. Tu y déposes de l'Iron. Une fois déposé, l'Iron ne peut pas retourner dans l'Entrepôt.

| **Rôle du vault** | **Description** |
| --- | --- |
| Attaque | Tu envoies de l'Iron depuis ton vault vers une ville cible pour espionner |
| Défense | Plus tu stockes d'Iron dans ton vault, plus ta ville est protégée contre l'espionnage ennemi |

## Mécanique d'espionnage

| **Résultat** | **Condition** | **Conséquences** |
| --- | --- | --- |
| Succès | Iron envoyé > Iron dans vault cible | Rapport complet (troupes, bâtiments, ressources, vault). Ennemi ne sait pas. Son vault non touché. Iron envoyé consommé. |
| Échec | Iron envoyé ≤ Iron vault cible | Les deux joueurs reçoivent un rapport d'échec. Ennemi sait qu'une tentative a eu lieu (pas qui). Tu perds tout l'Iron envoyé. |

*Minimum requis : 1 000 Iron. Envoyer des chiffres ronds est déconseillé — envoie 1 001 plutôt que 1 000.*

Règle anti-abus : impossible de recharger ton vault pendant qu'une mission est en cours.

## Niveaux de mission

| **Niveau Centre d****'****espionnage** | **Mission** | **Description** |
| --- | --- | --- |
| Niveau 1 | Reconnaissance | Rapport basique : nombre de troupes par type dans la ville cible |
| Niveau 5 | Infiltration | Rapport complet : troupes, niveaux de bâtiments, ressources en stock, Iron dans le vault |
| Niveau 10 | Surveillance | Mission passive 12h — rapport en temps réel sur tous les mouvements de troupes entrants et sortants |
| Niveau 15 | Sabotage | Mission active — perturbation : ralentit construction, -15% production 12h, ou retarde formation troupes. Risque de détection élevé. |
| Niveau 20 | Opération fantôme | Reconnaissance + sabotage combinés, risque de détection minimal |

## Contre-espionnage

| **Mécanisme** | **Description** |
| --- | --- |
| Passif — vault | Ton vault d'Iron est ta première défense. Plus il est garni, plus il est difficile de t'espionner. |
| Actif — Centre d'espionnage | À partir du niveau 10, génère des agents de contre-espionnage passifs. Probabilité de détection proportionnelle au niveau. Formule : niveau_spy_defender / (niveau_spy_attaquant + niveau_spy_defender) |
| Surveillance Network (prestige) | 100% de détection garantie — détecte tous les espions entrants, même réussis. L'ennemi voit ce bâtiment dans son rapport réussi. |

## Contre-espionnage — Surveillance passive

Si un espion en mission Surveillance est détecté par le contre-espionnage actif :

- L'agent est neutralisé — la surveillance s'arrête immédiatement

- Le défenseur reçoit une notification (sans savoir qui)

- L'attaquant reçoit une notification que son agent a été neutralisé

- L'Iron investi dans la mission est perdu

## Rapport d'espionnage réussi — contenu

- Toutes les unités présentes dans la ville

- Le niveau de tous les bâtiments construits

- Le stock de ressources (Ore, Stone, Iron)

- Le niveau d'Iron dans le vault

- Si le bâtiment Surveillance Network est présent

*Le rapport est une photographie à l**'**instant T — si l**'**ennemi envoie des renforts après l**'**espionnage, tu ne le verras pas.*

# Recherche individuelle

## Research Capacity (RC)

Le RC est un budget d'allocation permanent — pas une ressource consommable. Chaque technologie recherchée réserve du RC tant qu'elle est active. Tu ne peux pas tout rechercher — la spécialisation est forcée.

RC_total = RC_base(6) + RC_laboratoire(3 × niveau) + RC_HQ(paliers)

| **Niveau HQ** | **RC bonus** |
| --- | --- |
| 5 | +4 |
| 10 | +10 |
| 15 | +18 |
| 20 | +28 |

| **État de la ville** | **RC total disponible** |
| --- | --- |
| HQ 5, Labo 3 | 6 + 9 + 4 = 19 |
| HQ 10, Labo 8 | 6 + 24 + 14 = 44 |
| HQ 15, Labo 12 | 6 + 36 + 32 = 74 |
| HQ 20, Labo 20 | 6 + 60 + 60 = 126 |

| **Tier technologie** | **RC réservé** |
| --- | --- |
| T1 | 2 RC |
| T2 | 4 RC |
| T3 | 6 RC |
| T4 | 9 RC |
| T5 | 13 RC |

Une seule recherche active à la fois par ville. Identique à Grepolis et GitCities.

## Branche 1 — Économie

| **Tier** | **Technologie** | **Effet** |
| --- | --- | --- |
| T1 | Extraction optimisée | +8% production Ore et Stone |
| T2 | Raffinage avancé | +10% production Iron |
| T3 | Logistique efficiente | -15% temps construction bâtiments économiques |
| T4 | Stockage renforcé | +25% storage cap toutes ressources |
| T5 | Production maximale | +20% production toutes ressources |

## Branche 2 — Militaire terrestre

| **Tier** | **Technologie** | **Effet** |
| --- | --- | --- |
| T1 | Tactiques de base | +5% attaque toutes unités terrestres |
| T2 | Armement amélioré | +8% attaque unités Cinétiques |
| T3 | Défense renforcée | +10% défense toutes unités terrestres |
| T4 | Formation accélérée | -20% temps formation unités terrestres |
| T5 | Élite terrestre | +15% attaque et défense toutes unités terrestres |

## Branche 3 — Militaire aérien

| **Tier** | **Technologie** | **Effet** |
| --- | --- | --- |
| T1 | Pilotage avancé | +5% attaque toutes unités aériennes |
| T2 | Propulsion améliorée | +15% vitesse toutes unités aériennes |
| T3 | Blindage orbital | +10% défense toutes unités aériennes |
| T4 | Capacité de transport | +4 unités de population par Transporteur |
| T5 | Supériorité aérienne | +20% attaque et défense toutes unités aériennes |

## Branche 4 — Défense

| **Tier** | **Technologie** | **Effet** |
| --- | --- | --- |
| T1 | Fortifications de base | +10% bonus défensif du Mur défensif |
| T2 | Systèmes d'alerte | +20% portée détection Tour de guet |
| T3 | Contre-mesures | -15% efficacité des sabotages ennemis |
| T4 | Blindage urbain | +15% défense toutes unités en défense dans cette ville |
| T5 | Forteresse | +25% bonus défensif Mur défensif + immunité aux Briseurs |

## Branche 5 — Espionnage

| **Tier** | **Technologie** | **Effet** |
| --- | --- | --- |
| T1 | Techniques de base | +20% Iron envoyé effectif sur toutes les missions |
| T2 | Cryptographie | -20% Iron perdu lors d'un échec d'espionnage |
| T3 | Infiltration avancée | +30% probabilité de détecter les espions ennemis |
| T4 | Réseau de surveillance | -15% coût en Iron de toutes les missions |
| T5 | Maîtrise de l'ombre | Les missions réussies ne consomment pas d'Iron |

## Branche 6 — Colonisation

| **Tier** | **Technologie** | **Effet** |
| --- | --- | --- |
| T1 | Navigation avancée | +20% vitesse du Vaisseau de colonisation |
| T2 | Capacité d'escorte | +2 unités de pop par Transporteur lors des colonisations |
| T3 | Établissement rapide | -30% temps d'instabilité lors d'un siège réussi (12h → ~8h) |
| T4 | Infrastructure coloniale | Nouvelle ville colonisée démarre avec +20% de ressources |
| T5 | Expansion maîtrisée | Permet de lancer deux Vaisseaux de colonisation simultanément |

## Reset de recherche

| **Propriété** | **Valeur** |
| --- | --- |
| Coût | X Shards (à définir au balancing) |
| Cooldown | 7 jours entre deux resets sur la même ville |
| Effet | Libère tout le RC alloué. Les technologies perdent leurs effets immédiatement. |

# Trading

## Rôle

Le trading résout le déséquilibre structurel entre les villes. Une ville spécialisée en production d'Ore aura des surplus d'Ore et des déficits d'Iron. Le trading permet de rééquilibrer sans tout produire soi-même.

## Prérequis

Le bâtiment Marché est requis pour toute activité de trading. Chaque niveau augmente la capacité de trade (Cargo Units) et le nombre de routes simultanées.

## Distance et temps de trajet

Chaque transfert de ressources a un temps de trajet basé sur la distance entre les deux villes. Les ressources voyagent via des convois. Pendant le trajet, les ressources sont immobilisées.

Temps_trajet = Distance × (1 / vitesse_commerciale)

## Cargo Units (CU)

Chaque ressource en transit consomme du CU selon son poids. La capacité totale est déterminée par le niveau du Marché.

| **Ressource** | **Poids par unité** |
| --- | --- |
| Ore | 1.0 CU |
| Stone | 1.1 CU |
| Iron | 1.25 CU |
| Shards | 1.5 CU |

## Types de trading

| **Type** | **Description** |
| --- | --- |
| Transfert intra-joueur | Déplacer des ressources entre tes propres villes. Requiert un Marché dans la ville source. Frais logistiques mineurs en Ore. |
| Marché joueur | Ordres d'achat et de vente entre joueurs. Marché régional (pas global). Matching par prix-temps prioritaire. Settlement via routes de transfert. |
| Marché système | Liquidité de fallback quand le marché joueur est peu actif. Taux moins favorables. Slippage progressif si utilisé trop souvent. |

## Frais

| **Type** | **Frais** |
| --- | --- |
| Transfert intra-joueur | Frais logistiques mineurs en Ore |
| Ordre marché — maker | 1% de la valeur de l'échange |
| Ordre marché — taker | 2% de la valeur de l'échange |
| Marché système | 3.5% + slippage progressif |

## Anti-abus

- Taille minimale : 50 CU par transfert

- Cooldown : 30 secondes entre deux transferts vers la même destination

- Wash trading : échanges circulaires entre comptes détectés et bloqués

- Si storage cap de destination plein à l'arrivée → excédent perdu