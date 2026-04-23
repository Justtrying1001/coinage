# Research Lab

## Statut
- Scope: bâtiment runtime existant et constructible.
- Décision produit figée: `research_lab` = **bâtiment d’unlock techno / doctrines / accès systèmes**.

## 1) Identité (vérité repo)
- ID technique: `research_lab`
- Nom affiché: `Research Lab`
- Catégorie: `research`
- Prérequis runtime: `HQ >= 8`, `housing_complex >= 6`, `barracks >= 5`
- Niveau max runtime: `36`

## 2) Rôle produit figé
`research_lab` répond à: **"qu’est-ce que je peux débloquer"**.

Il porte:
- unlock des recherches/technologies,
- unlock des doctrines,
- unlock d’accès à certaines unités,
- unlock d’accès à des systèmes militaires avancés,
- futur unlock vers unités spéciales / "mythiques" via système dédié de généraux (future scope).

## 3) Ce que le bâtiment fait aujourd’hui en code
- Effet niveau: `researchCapacity` (4 par niveau dans la table actuelle).
- Le runtime de recherche utilise:
  - garde par niveau de lab (`canStartResearch`),
  - capacité de points de recherche via niveau de lab (`level * 4`).
- Le `research_lab` est déjà un gate pour plusieurs bâtiments/systèmes (dont `armament_factory`, `council_chamber`).

## 4) Séparation explicite avec armament_factory
- `research_lab` = unlock tree / accès systèmes.
- `armament_factory` = scaling passif de performance militaire.
- Cette séparation est volontaire et doit être conservée.

## 5) Ce que research_lab n’est pas
- Pas un bâtiment de production d’unités.
- Pas un bâtiment de buff matériel (rôle armament_factory).
- Pas le système des généraux en lui-même.

## 6) Futur scope (non implémenté)
- Le futur système de généraux (remplacement temple/gods) sera un système dédié.
- `research_lab` pourra participer aux conditions d’accès, mais ne doit pas absorber ce système.
