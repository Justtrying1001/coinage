# Bâtiments & Construction — MVP MICRO

## Source of truth runtime
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityContentCatalog.ts`

## Active buildings in MVP MICRO

| Branche | Bâtiments |
|---|---|
| Économie / logistique | HQ, Mine, Quarry, Refinery, Warehouse, Housing Complex, Market |
| Militaire | Barracks, Combat Forge, Space Dock, Military Academy, Armament Factory |
| Défense | Defensive Wall, Watch Tower |
| Recherche / Intel / Gouvernance | Research Lab, Intelligence Center, Council Chamber |

## Construction rules

- Queue standard active (2 slots).
- Queue premium désactivée.
- Coûts déduits au lancement.
- Vérification unlock/prérequis au lancement.
- Progression de niveau persistée et résolue sur timer.

## Effets locaux implémentés

- Militaire: bonus entraînement/efficacité/combat via Barracks, Forge, Dock, Academy, Armament Factory.
- Défense: défense locale, mitigation, résistance siège via Wall/Tower.
- Recherche: file locale + bonus appliqués en ville.
- Intelligence: readiness locale + projets intel + contre-espionnage.
- Gouvernance: politiques locales persistées via Council Chamber.
- Marché: bonus locaux de logistique/efficacité/coûts de build.

## Hors MVP MICRO

- `training_grounds`
- `shard_vault`
- tout bâtiment premium/spécial/endgame
