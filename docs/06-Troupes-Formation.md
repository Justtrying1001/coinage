# Troupes & Formation (catalogue complet)

> **Statut document**: source de vérité design full-content pour les unités.  
> Runtime actif des unités implémentées: `src/game/city/economy/cityEconomyConfig.ts`.  
> Catalogue full-content structuré: `src/game/city/economy/cityContentCatalog.ts`.

## 1. Objectif

Ce document aligne les lignes d’unités intentionnelles du jeu (MVP/V0/later), avec distinction explicite entre:
- valeurs confirmées,
- valeurs provisoires,
- valeurs manquantes à designer.

## 2. Catalogue complet des unités

| Unit ID | Nom | Catégorie | Scope phase | Statut définition | Runtime implémenté | Déblocage | Valeurs actuellement connues |
| --- | --- | --- | --- | --- | --- | --- | --- |
| infantry | Fantassin / Infantry | ground_line | V0 | fully_defined | Oui | Barracks 1 | Coûts + temps + pop confirmés |
| shield_guard | Bouclier / Shield Guard | ground_line | V0 | fully_defined | Oui | Barracks 5 | Coûts + temps + pop confirmés |
| marksman | Tireur / Marksman | ground_line | V0 | fully_defined | Oui | Barracks 10 | Coûts + temps + pop confirmés |
| raider_cavalry | Cavalier / Raider Cavalry | ground_line | V0 | fully_defined | Oui | Barracks 15 | Coûts + temps + pop confirmés |
| assault | Assaillant / Assault | ground_line | V0 | fully_defined | Oui | Combat Forge 1 | Coûts + temps + pop confirmés |
| breacher | Briseur / Breacher | ground_line | V0 | fully_defined | Oui | Combat Forge 8 | Coûts + temps + pop confirmés |
| interception_sentinel | Sentinelle d’interception | projection | V0 | fully_defined | Oui | Space Dock 1 | Coûts + temps + pop confirmés |
| rapid_escort | Escorteur rapide | projection | V0 | fully_defined | Oui | Space Dock 5 | Coûts + temps + pop confirmés |
| assault_convoy | Convoi d’assaut | projection | later | partially_defined | Non | Space Dock 10 | Pop/capacité intentionnelles; coûts/temps manquants |
| siege_runner | Briseur mobile / Siege Runner | siege | later | partially_defined | Non | Space Dock 15 | Rôle et vitesse relative définis; valeurs chiffrées manquantes |
| colonization_convoy | Convoi de colonisation | colonization | later | partially_defined | Non | Space Dock 20 + HQ 10 | Pop et usage (consommé à l’arrivée) connus; coûts/temps manquants |

## 3. Classification par branches gameplay

### 3.1 Ligne terrestre (ground_line)
- Rôle: combat principal phase 2.
- Source unlock: Barracks puis Combat Forge.
- Statut: runtime actif présent, mais stats combat détaillées (attaque/défense par type) restent à formaliser côté config runtime.

### 3.2 Projection / Interception
- Rôle: phase 1 d’écran de projection et sécurisation des convois.
- Source unlock: Space Dock.
- Statut: 2 unités actives (interception_sentinel, rapid_escort), 3 unités later non implémentées (assault_convoy, siege_runner, colonization_convoy).

### 3.3 Siège / Colonisation
- Rôle: capture territoriale (fenêtre d’instabilité + convoi).
- Source unlock: Space Dock high-level + HQ gate.
- Statut: logique design macro/micro définie, table balance incomplète.

## 4. Statut de complétude des valeurs unités

| Champ | Unités actives (8) | Unités later (3) |
| --- | --- | --- |
| Coûts ressources | Confirmés | Placeholder requis |
| Temps de formation | Confirmés | Placeholder requis |
| Coût population | Confirmés | Partiellement défini |
| Stats combat détaillées (ATK/DEF typées) | Partielles | Partielles |
| Vitesse/loot/capacité logistique | Partielles | Partielles |

## 5. Graphe de dépendances unités (full-content)

- `Barracks 1` → infantry
- `Barracks 5` → shield_guard
- `Barracks 10` → marksman
- `Barracks 15` → raider_cavalry
- `Combat Forge 1` → assault
- `Combat Forge 8` → breacher
- `Space Dock 1` → interception_sentinel
- `Space Dock 5` → rapid_escort
- `Space Dock 10` → assault_convoy
- `Space Dock 15` → siege_runner
- `Space Dock 20 + HQ 10` → colonization_convoy

## 6. Points bloquants avant balance globale finale

1. Valeurs coûts/temps/pop manquantes pour les unités de projection avancée/siège/colonisation.
2. Stats combat typées (cinétique/énergétique/plasma) incomplètes au niveau configuration canonique.
3. Paramètres logistiques (capacité convoi, vitesse absolue, règles d’escorte) non entièrement tablés pour simulation complète.
4. Couplage final avec bâtiments later (Mur/Tour/Académie/Usine) non encore chiffré.

## 7. Règle de gouvernance design

Aucune unité later ne doit être considérée “finale” tant que son statut n’est pas passé de `partially_defined` à `fully_defined` dans le catalogue full-content.
