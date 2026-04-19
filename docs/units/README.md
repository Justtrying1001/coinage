# Référence unités (runtime)

Documentation générée automatiquement depuis la config runtime et la logique exécutée.

| ID | Nom affiché | Catégorie / branche | Rôle principal | Lien |
|---|---|---|---|---|
| citizen_militia | Citizen Militia | militia | Défense locale temporaire uniquement. | [voir](./terrestre/citizen_militia.md) |
| infantry | Infantry | ground | Unité terrestre de combat. | [voir](./terrestre/infantry.md) |
| phalanx_lancer | Phalanx Lancer | ground | Unité terrestre de combat. | [voir](./terrestre/phalanx_lancer.md) |
| marksman | Marksman | ground | Unité terrestre de combat. | [voir](./terrestre/marksman.md) |
| assault | Assault | ground | Unité terrestre de combat. | [voir](./terrestre/assault.md) |
| shield_guard | Shield Guard | ground | Unité terrestre de combat. | [voir](./terrestre/shield_guard.md) |
| raider_cavalry | Raider Cavalry | ground | Unité terrestre de combat. | [voir](./terrestre/raider_cavalry.md) |
| breacher | Breacher | ground | Siège terrestre lent à forte pression structurelle (intent config). | [voir](./terrestre/breacher.md) |
| assault_convoy | Assault Convoy | naval | Transport logistique/naval. | [voir](./air/assault_convoy.md) |
| swift_carrier | Swift Carrier | naval | Transport logistique/naval. | [voir](./air/swift_carrier.md) |
| interception_sentinel | Interception Sentinel | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./air/interception_sentinel.md) |
| ember_drifter | Ember Drifter | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./air/ember_drifter.md) |
| rapid_escort | Rapid Escort | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./air/rapid_escort.md) |
| bulwark_trireme | Bulwark Trireme | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./air/bulwark_trireme.md) |
| colonization_convoy | Colonization Convoy | naval | Colonisation/conquête (selon notes), avec consommation attendue mais non implémentée ici. | [voir](./air/colonization_convoy.md) |

## Régénération

`node scripts/generate-economy-reference-docs.mjs`

## Notes
- Les unités documentées ici sont strictement celles de CITY_ECONOMY_CONFIG.troops.
- Les entrées présentes uniquement dans le catalog mais absentes de la config runtime ne sont pas documentées ici.
