# Référence bâtiments (runtime)

Documentation générée automatiquement depuis la config runtime et la logique exécutée.

| ID | Nom affiché | Catégorie / branche | Rôle principal | Lien |
|---|---|---|---|---|
| hq | HQ | economy | Colonne de progression: déverrouille les autres bâtiments et normalise les temps de construction. | [voir](./hq.md) |
| mine | Mine | economy | Production d’ore. | [voir](./mine.md) |
| quarry | Quarry | economy | Production de stone. | [voir](./quarry.md) |
| refinery | Refinery | economy | Production d’iron. | [voir](./refinery.md) |
| warehouse | Warehouse | economy | Augmente les caps de stockage de ressources. | [voir](./warehouse.md) |
| housing_complex | Housing Complex | economy | Augmente le cap de population (et sert de base à la milice). | [voir](./housing_complex.md) |
| barracks | Barracks | military | Débloque l’entraînement des unités terrestres. | [voir](./barracks.md) |
| space_dock | Space Dock | military | Débloque l’entraînement des unités navales. | [voir](./space_dock.md) |
| defensive_wall | Defensive Wall | defense | Bonus défensifs de ville (défense, mitigation, résistance siège). | [voir](./defensive_wall.md) |
| skyshield_battery | Skyshield Battery | defense | Bonus défense de ville et anti-air. | [voir](./skyshield_battery.md) |
| armament_factory | Armament Factory | military | Bonus cycliques ground/air ATK/DEF (sans rôle training/research). | [voir](./armament_factory.md) |
| intelligence_center | Intelligence Center | intelligence | Détection, contre-intel, projets intel, coffre espion. | [voir](./intelligence_center.md) |
| research_lab | Research Lab | research | Capacité de recherche et gate des recherches. | [voir](./research_lab.md) |
| market | Market | logistics | Efficacité de marché. | [voir](./market.md) |
| council_chamber | Council Chamber | governance | Bonus build speed + city defense, déblocage politiques locales. | [voir](./council_chamber.md) |

## Régénération

`node scripts/generate-economy-reference-docs.mjs`

## Écarts runtime importants à garder en tête (audit 2026-04-21)

- Les coûts/durées de table sont des **bases**. La durée réellement appliquée en jeu passe par `getConstructionDurationSeconds` (normalisation HQ + build speed policy).
- Le cas le plus visible est `barracks` niveau 1: table = `634s`, mais à HQ1 la durée runtime monte à `891s` (~14m51s).
- `armament_factory` n’a pas d’entrée dans `BUILDING_ASSETS` côté UI (`CityFoundationMode`) => fallback visuel “No Art”.
- Mapping fichiers assets canonisé pour:
  - `refinery` → `/assets/refinery.png`
  - `council_chamber` → `/assets/council_chamber.png`
  - `barracks` → `/assets/barracks.png`
- `buildCostReductionPct` est désormais appliqué par le calcul de coût de construction (`getConstructionCostResources`) quand une source runtime l’alimente.
