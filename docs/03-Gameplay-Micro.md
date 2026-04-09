**COINAGE**

**Gameplay Micro**

*Population • Économie • Militaire • Espionnage • Recherche • Trading*

DOC 03 — MICRO

Version 2.2 — Avril 2026

# Population

La population est une capacité partagée et permanente de chaque ville. Elle est consommée par deux éléments simultanément : les bâtiments construits et les troupes entraînées et vivantes.

**Tension centrale : plus tu construis de bâtiments, moins tu as de population disponible pour les troupes, et inversement.**

## Source de population

Housing Complex est la seule source principale de cap population. Training Grounds (prestige) ajoute +10% sur ce cap.

Le Housing Complex et l'Entrepôt ne consomment pas de population.

## Consommation

| Source | Comportement |
| --- | --- |
| Bâtiments | Consomment de la population à la construction et à chaque upgrade. La population reste réservée tant que le bâtiment existe. |
| Troupes | Consomment de la population tant qu'elles sont vivantes. Quand une troupe meurt, sa population est libérée. |

## Spécialisation des villes

| Type de ville | Focus | Description |
| --- | --- | --- |
| Ville économique | Production max | Housing Complex et bâtiments de production au maximum, peu de troupes |
| Ville offensive | Pression d'attaque | Bâtiments minimaux, population concentrée en troupes d'attaque |
| Ville défensive | Défenses max | Mur défensif et Tour de guet élevés, forte garnison |
| Ville de recherche | RC max | Laboratoire priorisé, forte contribution technologique |
| Ville de colonisation | Prise territoriale | Hub de déploiement niveau 20 + convoi de colonisation + escorte complète |

# Économie

## Production continue — modèle Grepolis

Les ressources s'accumulent en continu à un taux horaire. La ville stocke un `lastUpdatedAt`. À chaque accès, le système calcule le temps écoulé et crédite les ressources accumulées, plafonnées par le storage cap.

Aucun job de fond nécessaire : calcul à la demande (`claim-on-access`).

## Anti-abuse

| Protection | Durée | Condition |
| --- | --- | --- |
| Protection nouveau joueur | 7 jours | Immunité totale. Levée si le joueur attaque en premier. |
| Protection post-raid | 12 heures | Immunité contre le même attaquant après un raid subi. |

# Militaire — Micro

## Système de combat — 3 types d'attaque

Chaque unité possède un type d'attaque et des valeurs de défense contre les trois types.

| Type | Description | Efficace contre | Inefficace contre |
| --- | --- | --- | --- |
| Cinétique | Attaque physique brute | Défense Énergétique | Défense Cinétique |
| Énergétique | Attaque concentrée | Défense Plasma | Défense Énergétique |
| Plasma | Attaque à distance | Défense Cinétique | Défense Plasma |

## Deux phases de combat (mécanique inchangée)

| Phase | Description |
| --- | --- |
| Phase 1 — Écran de projection / interception | Les unités de projection s'affrontent en premier. Le résultat détermine combien de convois d'assaut atteignent la cible et avec quelle efficacité. |
| Phase 2 — Combat principal | Les troupes débarquées affrontent les défenses locales. Le Mur défensif applique son bonus à toutes les unités en défense. |

## Unités de ligne

| Unité | DB key | Attaque | Vitesse | Loot | Pop | Débloqué |
| --- | --- | --- | --- | --- | --- | --- |
| Fantassin | infantry | Cinétique | Moyenne | Faible | 1 | Caserne niv.1 |
| Bouclier | shield_guard | Cinétique | Lente | Nul | 3 | Caserne niv.5 |
| Tireur | marksman | Plasma | Moyenne | Faible | 1 | Caserne niv.10 |
| Cavalier | raider_cavalry | Cinétique | Très rapide | Très élevé | 3 | Caserne niv.15 |
| Assaillant | assault | Énergétique | Moyenne | Moyen | 2 | Forge niv.1 |
| Briseur | breacher | Cinétique | Très lente | Nul | 5 | Forge niv.8 |

## Unités de projection

| Unité | DB key | Attaque | Vitesse | Pop | Débloqué | Note |
| --- | --- | --- | --- | --- | --- | --- |
| Sentinelle d'interception | interception_sentinel | Énergétique | Très rapide | 4 | Hub niv.1 | Défense d'écran de projection |
| Escorteur rapide | rapid_escort | Plasma | Rapide | 3 | Hub niv.5 | Recommandé sur toute attaque inter-secteur |
| Convoi d'assaut | assault_convoy | Aucune | Lente | 6 | Hub niv.10 | Requis pour projeter des troupes sur un autre secteur. Cible prioritaire ennemie. Capacité : 10 pop |
| Briseur mobile | siege_runner | Cinétique | Lente | 5 | Hub niv.15 | Anti-structure. Nécessite escorte |
| Convoi de colonisation | colonization_convoy | Aucune | Très lente (le plus lent) | 10 | Hub niv.20 + HQ 10 | Consommé à l'arrivée. Escorte obligatoire |

## Distance et temps de déplacement

`Temps_trajet = Distance × (1 / Vitesse_unité_la_plus_lente)`

La vitesse du groupe est celle de l'unité la plus lente. Les joueurs coordonnent les vagues : la vague de nettoyage doit arriver juste avant le convoi de colonisation.

### Vitesses relatives (du plus rapide au plus lent)

| Vitesse | Unités |
| --- | --- |
| Très rapide | Cavalier, Sentinelle d'interception |
| Rapide | Escorteur rapide |
| Moyenne | Fantassin, Tireur, Assaillant |
| Lente | Bouclier, Briseur mobile, Convoi d'assaut |
| Très lente | Briseur |
| Extrêmement lente | Convoi de colonisation |

## Types d'actions militaires

| Action | Disponible | Description |
| --- | --- | --- |
| Raid | Toujours sur secteurs neutres / En guerre sur territoires principaux | Attaque rapide de pillage |
| Colonisation | Toujours, slot libre uniquement | Envoi d'un convoi de colonisation vers un slot libre sur secteur neutre. Aucun combat si slot libre |
| Siège ville occupée (neutre) | Toujours | Si victoire + convoi arrive pendant Instabilité : capture |
| Siège ville (territoire principal) | Uniquement en guerre officielle | Même mécanique que siège neutre |

## Séquence de siège

| Étape | Description |
| --- | --- |
| 1. Nettoyage | Détruire les défenses de la ville cible |
| 2. Instabilité | Attaque de siège gagnante : fenêtre d'Instabilité de 12h |
| 3. Convoi | Envoyer le convoi de colonisation (souvent avant l'Instabilité vu sa lenteur) |
| 4. Capture | Le convoi arrive pendant la fenêtre et son escorte survit : ville capturée |
| 5. Échec | Convoi détruit ou fenêtre expirée : siège annulé |

## Règle des 75% — Chute d'un territoire

Si une faction perd 75% de ses villes sur un territoire spécifique au profit d'une même faction ennemie, ce territoire bascule.

Exemple : une faction possède 4 territoires. Si l'ennemi prend 75% des villes du territoire 1, le territoire 1 bascule, les territoires 2/3/4 restent.

## Anti-bully

`PowerRatio = puissance_défenseur / puissance_attaquant`

`MoraleMod = clamp(0.55, 1.0, 0.4 + PowerRatio × 1.8)`

Plus l'écart de puissance est grand, plus l'attaque est pénalisée.

## Impact on-chain sur le militaire

| Métrique | Calcul | Effet |
| --- | --- | --- |
| Cohésion | % joueurs actifs 7j | >60% : +15% efficacité armée collective / <40% : -10% |
| Rétention holders | % holders >30 jours | >70% : +10% bonus défensif / <40% : -5% défense |
| Taux de conversion | % holders actifs en jeu | Haut taux : -20% temps de mobilisation collective |

# Espionnage

## Principe — Vault d'Iron

L'Iron sert de ressource de construction et de monnaie d'espionnage.

Le Centre d'espionnage dispose d'un vault interne séparé de l'Entrepôt. L'Iron déposé dans ce vault n'est pas restituable vers l'Entrepôt.

| Rôle du vault | Description |
| --- | --- |
| Attaque | Iron envoyé vers une ville cible |
| Défense | Plus le vault est rempli, plus la ville résiste à l'espionnage |

## Mécanique

| Résultat | Condition | Conséquences |
| --- | --- | --- |
| Succès | Iron envoyé > Iron vault cible | Rapport complet. Iron envoyé consommé. |
| Échec | Iron envoyé ≤ Iron vault cible | Rapport d'échec aux deux joueurs. Iron envoyé perdu. |

Minimum mission : 1 000 Iron.

## Niveaux de mission

| Niveau Centre d'espionnage | Mission | Description |
| --- | --- | --- |
| 1 | Reconnaissance | Rapport basique troupes |
| 5 | Infiltration | Rapport complet troupes, bâtiments, ressources, vault |
| 10 | Surveillance | Suivi 12h des mouvements entrants/sortants |
| 15 | Sabotage | Ralentit construction/production/formation |
| 20 | Opération fantôme | Reconnaissance + sabotage, détection réduite |

# Recherche individuelle

## RC (Research Capacity)

Le RC est un budget alloué, non consommé. Les technologies réservent du RC tant qu'elles restent actives.

`RC_total = RC_base(6) + RC_laboratoire(3 × niveau) + RC_HQ(paliers)`

Une seule recherche active à la fois par ville.

## Branches de recherche (mécaniques conservées)

1. Économie
2. Militaire de ligne
3. Militaire de projection
4. Défense
5. Espionnage
6. Colonisation

# Trading

Le Marché rééquilibre les spécialisations de villes. Les ressources circulent via convois logistiques, avec un temps de trajet dépendant de la distance entre villes.
