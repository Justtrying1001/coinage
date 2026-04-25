# Aegis Walker

## Identity
- technical id: `aegis_walker`
- display name: `Aegis Walker`
- type: `unit unlock`
- description: `Unit unlock research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.aegis_walker`)

## Requirements
- required research lab level: `16`
- required research prerequisites: `raider_interceptor`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- Unit dependency: training of `aegis_shieldguard` requires this research via troop config.


## Costs
- ore: `3700`
- stone: `1900`
- iron: `2800`
- research points: `8`
- duration: `2160s`

## Declared effect
- `{}`

## Intended role in the game
- intention design probable: Unlock unité `aegis_shieldguard` dans la file d'entraînement.
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): canStartTroopTraining -> troop.requiredResearch (aegis_shieldguard)
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
