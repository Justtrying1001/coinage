# Architecture

## Identity
- technical id: `architecture`
- display name: `Architecture`
- type: `stat bonus`
- description: `Direct bonus research.`
- source of truth: `src/game/city/economy/cityEconomyConfig.ts` (`CITY_ECONOMY_CONFIG.research.architecture`)

## Requirements
- required research lab level: `10`
- required research prerequisites: `city_guard`
- required building prerequisites if any: none specific to this node beyond `research_lab` level gate
- other gating dependencies if any:
- none


## Costs
- ore: `1900`
- stone: `2100`
- iron: `1300`
- research points: `6`
- duration: `1500s`

## Declared effect
- `buildSpeedPct: 6`

## Intended role in the game
- intention design probable: Accélérer les durées de construction.
- confidence: `HIGH`

## Current runtime behavior
- runtime consumer(s): getResearchEffectTotals -> getCityDerivedStats.buildSpeedPct -> getConstructionDurationSeconds
- UI surfacing: affiché dans `CityFoundationMode` (effet, coût, durée, status, blockers, RP usage).

## Actual gameplay impact today
- verdict impact: Réduit le temps de construction.
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

## References
- `src/game/city/economy/cityEconomyConfig.ts`
- `src/game/city/economy/cityEconomySystem.ts`
- `src/game/city/economy/cityEconomyPersistence.ts`
- `src/game/render/modes/CityFoundationMode.ts`
- `docs/research/research_feature_audit.md`
