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
| watch_tower | Skyguard Tower | defense | Bonus défense de ville et anti-air. | [voir](./watch_tower.md) |
| armament_factory | Armament Factory | military | Bonus puissance/entretien/formation des troupes. | [voir](./armament_factory.md) |
| intelligence_center | Intelligence Center | intelligence | Détection, contre-intel, projets intel, coffre espion. | [voir](./intelligence_center.md) |
| research_lab | Research Lab | research | Capacité de recherche et gate des recherches. | [voir](./research_lab.md) |
| market | Market | logistics | Efficacité de marché. | [voir](./market.md) |
| council_chamber | Council Chamber | governance | Bonus build speed + city defense, déblocage politiques locales. | [voir](./council_chamber.md) |

## Régénération

`node scripts/generate-economy-reference-docs.mjs`
