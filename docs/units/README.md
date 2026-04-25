# Référence unités (runtime)

Documentation générée automatiquement depuis la config runtime et la logique exécutée.

| ID | Nom affiché | Catégorie / branche | Rôle principal | Lien |
|---|---|---|---|---|
| citizen_militia | Citizen Militia | militia | Défense locale temporaire uniquement. | [voir](./citizen_militia.md) |
| line_infantry | Frontline Trooper | ground | Transport logistique/naval. | [voir](./line_infantry.md) |
| phalanx_lanceguard | Bulwark Trooper | ground | Transport logistique/naval. | [voir](./phalanx_lanceguard.md) |
| rail_marksman | Railgun Skirmisher | ground | Transport logistique/naval. | [voir](./rail_marksman.md) |
| assault_legionnaire | Assault Ranger | ground | Transport logistique/naval. | [voir](./assault_legionnaire.md) |
| aegis_shieldguard | Aegis Walker | ground | Transport logistique/naval. | [voir](./aegis_shieldguard.md) |
| raider_hoverbike | Raider Interceptor | ground | Transport logistique/naval. | [voir](./raider_hoverbike.md) |
| siege_breacher | Siege Artillery | ground | Transport logistique/naval. | [voir](./siege_breacher.md) |
| assault_dropship | Strike Dropship | naval | Transport logistique/naval. | [voir](./assault_dropship.md) |
| swift_carrier | Rapid Carrier | naval | Transport logistique/naval. | [voir](./swift_carrier.md) |
| interceptor_sentinel | Sentinel Interceptor | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./interceptor_sentinel.md) |
| ember_drifter | Ember Frigate | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./ember_drifter.md) |
| rapid_escort | Vanguard Corvette | naval | Transport logistique/naval. | [voir](./rapid_escort.md) |
| bulwark_trireme | Bulwark Cruiser | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./bulwark_trireme.md) |
| colonization_arkship | Colony Ark | naval | Support non-combattant (dans cette base de code). | [voir](./colonization_arkship.md) |

## Régénération

`node scripts/generate-economy-reference-docs.mjs`

## Notes
- Les unités documentées ici sont strictement celles de CITY_ECONOMY_CONFIG.troops.
- Les entrées présentes uniquement dans le catalog mais absentes de la config runtime ne sont pas documentées ici.
