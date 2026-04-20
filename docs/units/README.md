# Référence unités (runtime)

Documentation générée automatiquement depuis la config runtime et la logique exécutée.

| ID | Nom affiché | Catégorie / branche | Rôle principal | Lien |
|---|---|---|---|---|
| citizen_militia | Citizen Militia | militia | Défense locale temporaire uniquement. | [voir](./citizen_militia.md) |
| line_infantry | Line Infantry | ground | Unité terrestre de combat. | [voir](./line_infantry.md) |
| phalanx_lanceguard | Phalanx Lanceguard | ground | Unité terrestre de combat. | [voir](./phalanx_lanceguard.md) |
| rail_marksman | Rail Marksman | ground | Unité terrestre de combat. | [voir](./rail_marksman.md) |
| assault_legionnaire | Assault Legionnaire | ground | Unité terrestre de combat. | [voir](./assault_legionnaire.md) |
| aegis_shieldguard | Aegis Shieldguard | ground | Unité terrestre de combat. | [voir](./aegis_shieldguard.md) |
| raider_hoverbike | Raider Hoverbike | ground | Unité terrestre de combat. | [voir](./raider_hoverbike.md) |
| siege_breacher | Siege Breacher | ground | Unité terrestre de combat. | [voir](./siege_breacher.md) |
| assault_dropship | Assault Dropship | naval | Transport logistique/naval. | [voir](./assault_dropship.md) |
| swift_carrier | Swift Carrier | naval | Transport logistique/naval. | [voir](./swift_carrier.md) |
| interceptor_sentinel | Interceptor Sentinel | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./interceptor_sentinel.md) |
| ember_drifter | Ember Drifter | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./ember_drifter.md) |
| rapid_escort | Rapid Escort | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./rapid_escort.md) |
| bulwark_trireme | Bulwark Trireme | naval | Combat naval (stat configurée; résolution absente du runtime). | [voir](./bulwark_trireme.md) |
| colonization_arkship | Colonization Arkship | naval | Support non-combattant (dans cette base de code). | [voir](./colonization_arkship.md) |

## Régénération

`node scripts/generate-economy-reference-docs.mjs`

## Notes
- Les unités documentées ici sont strictement celles de CITY_ECONOMY_CONFIG.troops.
- Les entrées présentes uniquement dans le catalog mais absentes de la config runtime ne sont pas documentées ici.
