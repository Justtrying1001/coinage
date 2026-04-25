# Colony Ark

## Identity
- technical id: `colony_ark`
- display name: `Colony Ark`
- type: `unit unlock`
- description: `Unit unlock research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.colony_ark`)

## Requirements
- required research lab level: `13`
- required research prerequisites: `architecture`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- Unit dependency: training of `colonization_arkship` requires this research via troop config.


## Costs
- ore: `7500`
- stone: `7500`
- iron: `9500`
- research points: `0`
- duration: `3600s`

## Declared effect
- `{}`

## Intended role in the game
- intention design probable: Unlock colony ship needed by colonization/conquest branch
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): canStartTroopTraining -> troop.requiredResearch (colonization_arkship)
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Bloque/débloque l'entraînement de l'unité concernée.
- impact level: PARTIAL

## Status verdict
- `PARTIALLY_WIRED`

## Problems / caveats
- Une partie de l'effet est consommée, mais pas l'ensemble de la promesse design probable.

## Related systems
- Research queue
- City derived stats
- City research UI
- Persistence/hydration
- Troop training guards
- Colonization/Conquest branch
- Naval/logistics branch

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`
