# War Council (Future Product Direction)

> Status: **future product direction / not implemented yet**.
> Ce document fige la direction produit pour le remplacement `temple/gods`.

## 1) Décision produit
Le remplacement `temple/gods` passera par un système dédié de **généraux**, et non par `armament_factory`.

Direction retenue:
- futur bâtiment/système: `war_council` (ou équivalent `high_command`),
- roster cible: 5 à 6 généraux,
- chaque général aura:
  - une identité stratégique,
  - un pouvoir actif / sort,
  - potentiellement une unité spéciale / "mythique" associée.

## 2) Séparation de responsabilités (figée)
- `research_lab`: unlock techno/doctrines/accès systèmes.
- `armament_factory`: scaling passif armement/puissance/upkeep.
- `war_council` (futur): système généraux, pouvoirs actifs, unités spéciales liées.

## 3) Ce que ce document n’implique pas
- Aucun runtime building `war_council` n’est ajouté ici.
- Aucune logique gameplay de généraux n’est implémentée dans ce patch.
- Aucun remplacement technique direct de `temple/gods` n’est codé ici; c’est une cible produit gelée pour la suite.

## 4) TODO produit rattachés
- définir les 5-6 généraux (fantasy + gameplay),
- définir les kits de pouvoirs actifs,
- définir les unités spéciales associées,
- définir les prérequis d’accès (incluant rôle éventuel du `research_lab` et prérequis matériel),
- brancher le runtime + UI + balance + persistence.
