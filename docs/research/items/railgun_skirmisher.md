# Railgun Skirmisher

## Identity
- technical id: `railgun_skirmisher`
- display name: `Railgun Skirmisher`
- type: `unit unlock`
- description: `Unit unlock research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.railgun_skirmisher`)

## Requirements
- required research lab level: `1`
- required research prerequisites: none
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- Unit dependency: training of `rail_marksman` requires this research via troop config.


## Costs
- ore: `300`
- stone: `500`
- iron: `200`
- research points: `4`
- duration: `570s`

## Declared effect
- `{}`

## Intended role in the game
- intention design probable: Unlock unité `rail_marksman` dans la file d'entraînement.
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): canStartTroopTraining -> troop.requiredResearch (rail_marksman)
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Bloque/débloque l'entraînement de l'unité concernée.
- impact level: YES

## Status verdict
- `FULLY_WIRED`

## Problems / caveats
- Aucun gap majeur de wiring prouvé pour le scope runtime audité.

## Related systems
- Research queue
- City derived stats
- City research UI
- Persistence/hydration
- Troop training guards

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`
