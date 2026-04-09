**COINAGE**

**Gameplay Micro**

*Population • Économie • Unités • Combat • Déplacement • Colonisation • Espionnage*

Version 2.1 — Avril 2026

# Population

La population est la capacité partagée de la ville. Elle est consommée par :

- bâtiments
- unités vivantes

Objectif stratégique : arbitrer entre puissance économique, défense locale et projection militaire.

# Économie

- Production continue en temps réel
- Récupération au login / à l’action (claim-on-access)
- Caps de stockage comme limite naturelle
- Protection nouveau joueur + protection post-raid

# Typologie d’unités (canonique)

Aucune catégorie verticale. Toutes les unités suivent une logique terrain/carte.

| Type | Rôle principal |
| --- | --- |
| Unité rapide | Pression, interception, anti-raid |
| Unité standard | Polyvalence frontale |
| Unité lourde | Tenue de ligne, encaissement |
| Unité de siège | Destruction des défenses et ouverture de capture |
| Unité de reconnaissance | Information et détection |
| Unité défensive | Protection forte en garnison |
| Convoi logistique | Renfort et transport de charge |
| Convoi de colonisation | Installation sur secteur libre |

# Combat

## Principe général

Le combat est résolu sans couches verticales :

- type d’unité
- vitesse
- portée opérationnelle
- composition de vague

## Phases de résolution

1. **Engagement initial** : contact des unités rapides et de reconnaissance, perturbation de la ligne adverse.
2. **Combat principal** : affrontement des unités standard, lourdes et défensives.
3. **Résolution** : application des pertes, validation du contrôle local, ouverture éventuelle de capture.

## Modèle de contre

- Rapides > Reconnaissance isolée
- Lourdes > Standard en duel frontal
- Siège > Défenses fixes
- Défensives > Rapides en défense préparée

# Déplacement et projection

## Déplacement inter-secteur

Le temps dépend de la distance et de l’unité la plus lente du groupe.

`temps_trajet = distance_inter_secteur × (1 / vitesse_unite_plus_lente)`

## Projection militaire

La projection combine :

- vitesse des unités
- disponibilité des convois logistiques
- coordination multi-vagues

# Colonisation

## Colonisation d’un secteur libre

- Condition : secteur neutre avec slot libre
- Moyen : convoi de colonisation
- Résultat : création d’une ville contrôlée

## Capture d’une ville occupée

Séquence :

1. Nettoyage des défenses
2. Fenêtre d’instabilité (12h)
3. Arrivée du convoi de colonisation dans la fenêtre
4. Validation de capture si le convoi survit

# Actions militaires disponibles

| Action | Usage |
| --- | --- |
| Raid | Pillage ciblé |
| Siège | Ouverture d’une capture |
| Renfort | Soutien défensif |
| Colonisation | Prise de secteur libre |

# Règle de bascule territoriale (75%)

Si une faction perd 75% des villes d’un territoire ciblé au profit d’une même faction ennemie, le territoire bascule.

# Espionnage micro

Le Centre d’espionnage et le vault d’Iron permettent :

- reconnaissance
- infiltration
- surveillance
- sabotage

Succès d’une mission : investissement d’Iron attaquant supérieur à la défense de la cible.

# Recherche individuelle (RC)

Le RC est un budget limité qui force la spécialisation. Axes recommandés :

- économie
- défense
- assaut
- vitesse
- espionnage
- logistique
