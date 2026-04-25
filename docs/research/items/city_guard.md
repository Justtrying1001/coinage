# City Guard

## Identity
- technical id: `city_guard`
- display name: `City Guard`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.city_guard`)

## Requirements
- required research lab level: `1`
- required research prerequisites: none
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `400`
- stone: `300`
- iron: `300`
- research points: `3`
- duration: `510s`

## Declared effect
- `defensePct: 5`

## Intended role in the game
- intention design probable: Renforcer la défense de ville.
- confidence: `MEDIUM`

## Current runtime behavior
- runtime consumer(s): getResearchEffectTotals -> getCityDerivedStats.cityDefensePct (agrégé)
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Augmente une stat défensive agrégée; pas de resolver combat global prouvé.
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

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`
